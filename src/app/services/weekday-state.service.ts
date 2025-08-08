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
  weekly: {
    goals: WeeklyGoal[];
    subgoals: WeeklySubgoal[];
  };
}
export interface WeeklyGoal { name: string; done: boolean; }
export interface WeeklySubgoal { name: string; done: boolean; }

const LOCAL_KEY = 'weekdayState';
const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class WeekdayStateService {
  private subj = new BehaviorSubject<WeekState>({ days: [], weekly: { goals: [], subgoals: [] } });
  public state$: Observable<WeekState> = this.subj.asObservable();

  constructor(private http: HttpClient) {
    this.load();
  }

  private defaultState(): WeekState {
    const labels = ['Physical','Learning/Building','Music/Art'];
    const subLabels = ['Meditation','Diet Adherence'];
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
    const dates = ['Aug 4','Aug 5','Aug 6','Aug 7','Aug 8'];

    return {
      days: days.map((d,i) => ({
        name: d,
        date: dates[i],
        dailyGoals: labels.map(l => ({ name: l, done: false, description: '' })),
        subgoals: subLabels.map(s => ({ name: s, done: false }))
      })),
      weekly: {
        goals: [],
        subgoals: [
          { name: 'Financial Assessment', done: false },
          { name: 'Water Plants', done: false },
          { name: 'Wash Bedding', done: false }
        ]
      }
    };
  }

  private load() {
    this.http.get<Partial<WeekState>>(`${API}/state`)
      .pipe(
        tap(raw => {
          // tolerate older files missing `weekly`
          const merged: WeekState = {
            ...this.defaultState(),
            ...raw,
            weekly: {
              ...this.defaultState().weekly,
              ...(raw?.weekly ?? {})
            }
          };
          this.subj.next(merged);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
        }),
        catchError(_ => {
          const saved = localStorage.getItem(LOCAL_KEY);
          if (saved) {
            try { this.subj.next(JSON.parse(saved) as WeekState); }
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

  // Optional convenience updaters:
  updateWeekly(updater: (w: WeekState['weekly']) => void) {
    const next = structuredClone(this.subj.value);
    updater(next.weekly);
    this.save(next);
  }
  updateDays(updater: (d: WeekState['days']) => void) {
    const next = structuredClone(this.subj.value);
    updater(next.days);
    this.save(next);
  }
}
