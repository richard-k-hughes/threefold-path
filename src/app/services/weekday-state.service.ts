import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface MainGoal {
  name: string;
  done: boolean;
  description: string;
}
export interface Subgoal {
  name: string;
  done: boolean;
}
export interface DayState {
  name: string;
  date: string;
  dailyGoals: MainGoal[];
  subgoals: Subgoal[];
}
export interface WeekState {
  days: DayState[];
}

const LOCAL_KEY = 'weekdayState';
const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class WeekdayStateService {
  private subj = new BehaviorSubject<WeekState>({ days: [] });
  public state$: Observable<WeekState> = this.subj.asObservable();

  constructor(private http: HttpClient) {
    this.load();
  }

  private defaultState(): WeekState {
    const labels = ['Physical','Learning/Building','Music/Art'];
    const subLabels = ['Meditation','Diet Adherence'];
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
    // for demo we hard-code dates; you could compute this week’s dates dynamically
    const dates = ['Aug 4','Aug 5','Aug 6','Aug 7','Aug 8'];

    return {
      days: days.map((d,i) => ({
        name: d,
        date: dates[i],
        dailyGoals: labels.map(l => ({ name: l, done: false, description: '' })),
        subgoals:    subLabels.map(s => ({ name: s, done: false }))
      }))
    };
  }

  private load() {
    this.http.get<WeekState>(`${API}/state`)
      .pipe(
        tap(s => {
          this.subj.next(s);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(s));
        }),
        catchError(_ => {
          // fallback: localStorage or default
          const saved = localStorage.getItem(LOCAL_KEY);
          if (saved) {
            try { this.subj.next(JSON.parse(saved)); }
            catch { this.subj.next(this.defaultState()); }
          } else {
            this.subj.next(this.defaultState());
          }
          return of(null);
        })
      )
      .subscribe();
  }

  /** call whenever you mutate the state */
  save(state: WeekState) {
    this.subj.next(state);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    this.http.put(`${API}/state`, state)
      .pipe(catchError(_ => of(null)))
      .subscribe();
  }
}
