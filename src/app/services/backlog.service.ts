import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

const LOCAL_STORAGE_KEY = 'backlogTasks';
const API_BASE = 'http://localhost:3000'; // full URL since you're not proxying

@Injectable({
  providedIn: 'root'
})
export class BacklogService {
  private backlogTasksSubject = new BehaviorSubject<string[]>([]);
  public backlogTasks$: Observable<string[]> = this.backlogTasksSubject.asObservable();

  constructor(private http: HttpClient) {
    this.load();
  }

  private load(): void {
    this.http.get<string[]>(`${API_BASE}/backlog`)
      .pipe(
        tap(tasks => {
          this.backlogTasksSubject.next(tasks);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks)); // cache locally
        }),
        catchError(err => {
          console.warn('Backend fetch failed, falling back to localStorage', err);
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) {
            try {
              this.backlogTasksSubject.next(JSON.parse(saved));
            } catch (e) {
              console.warn('Failed to parse cached tasks', e);
            }
          }
          return of([]);
        })
      )
      .subscribe();
  }

  getBacklogTasks(): string[] {
    return this.backlogTasksSubject.value;
  }

  addBacklogTask(task: string): void {
    if (!task || !task.trim()) {
      return;
    }
    const trimmed = task.trim();

    // optimistic update
    const current = this.backlogTasksSubject.value;
    const newTasks = [...current, trimmed];
    this.backlogTasksSubject.next(newTasks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTasks));

    // persist
    this.http.post<string[]>(`${API_BASE}/backlog`, { task: trimmed })
      .pipe(
        catchError(err => {
          console.warn('Failed to persist new task to backend, keeping local version', err);
          return of(null);
        })
      )
      .subscribe();
  }

  removeBacklogTask(task: string): void {
    if (!task) {
      return;
    }

    const current = this.backlogTasksSubject.value;
    const newTasks = current.filter(t => t !== task);
    this.backlogTasksSubject.next(newTasks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTasks));

    this.http.request<string[]>('delete', `${API_BASE}/backlog`, { body: { task } })
      .pipe(
        catchError(err => {
          console.warn('Failed to remove task from backend, keeping local state', err);
          return of(null);
        })
      )
      .subscribe();
  }

  replaceAll(tasks: string[]): void {
    this.backlogTasksSubject.next(tasks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    this.http.put<string[]>(`${API_BASE}/backlog`, { tasks })
      .pipe(
        catchError(err => {
          console.warn('Failed to replace remote backlog', err);
          return of(null);
        })
      )
      .subscribe();
  }
}
