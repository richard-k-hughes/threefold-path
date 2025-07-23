import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BacklogService {
  private backlogTasksSubject = new BehaviorSubject<string[]>([]);
  public backlogTasks$: Observable<string[]> = this.backlogTasksSubject.asObservable();

  constructor() {
    // Load tasks from localStorage if available
    const savedTasks = localStorage.getItem('backlogTasks');
    if (savedTasks) {
      this.backlogTasksSubject.next(JSON.parse(savedTasks));
    }
  }

  getBacklogTasks(): string[] {
    return this.backlogTasksSubject.value;
  }

  addBacklogTask(task: string): void {
    if (task && task.trim()) {
      const currentTasks = this.backlogTasksSubject.value;
      const newTasks = [...currentTasks, task.trim()];
      this.backlogTasksSubject.next(newTasks);

      // Save to localStorage
      localStorage.setItem('backlogTasks', JSON.stringify(newTasks));
    }
  }

  removeBacklogTask(task: string): void {
    const currentTasks = this.backlogTasksSubject.value;
    const newTasks = currentTasks.filter(t => t !== task);
    this.backlogTasksSubject.next(newTasks);

    // Save to localStorage
    localStorage.setItem('backlogTasks', JSON.stringify(newTasks));
  }
}
