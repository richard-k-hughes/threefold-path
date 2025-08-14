import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, tap, switchMap, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface MainGoal { name: string; done: boolean; description: string; }
export interface Subgoal { name: string; done: boolean; }
export interface DayState {
  name: string;
  date: string;
  dailyGoals: MainGoal[];
  subgoals: Subgoal[];
}
export interface WeeklyGoal { name: string; done: boolean; }
export interface WeeklySubgoal { name: string; done: boolean; }
export interface WeekState {
  weekOf: string;
  days: DayState[];
  weekly: { goals: WeeklyGoal[]; subgoals: WeeklySubgoal[]; };
}

const LOCAL_KEY = 'weekdayState';
const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class WeekdayStateService {
  private subj = new BehaviorSubject<WeekState>({weekOf: '', days: [], weekly: { goals: [], subgoals: [] } });
  public state$: Observable<WeekState> = this.subj.asObservable();

  constructor(private http: HttpClient) {
    this.load();
  }

  // Handy if you need the current value
  get snapshot(): WeekState { return this.subj.value; }

  private defaultState(): WeekState {
    const labels = ['Physical','Learning/Building','Music/Art'];
    const subLabels = ['Meditation','Diet Adherence'];
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
    const dates = this.currentWeekDates();
    const mon = this.mondayOf(new Date());

    return {
      weekOf: this.iso(mon),
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

  private currentWeekDates(): string[] {
    const today = new Date();
    const dow = today.getDay();                 // 0=Sun..6=Sat
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return fmt.format(d);
    });
  }

 private mondayOf(date: Date): Date {
       const d = new Date(date);
       const dow = d.getDay();
       const offset = dow === 0 ? -6 : 1 - dow;
       d.setDate(d.getDate() + offset);
       d.setHours(0, 0, 0, 0);
       return d;
     }

 private iso(d: Date): string {
       return d.toISOString().slice(0, 10);
     }


  private shape(raw?: Partial<WeekState>): WeekState {
    const base = this.defaultState();

    // <-- key change: if the server has days: [], use base.days instead
    const days = (raw?.days && raw.days.length > 0) ? raw.days : base.days;

    return {
      ...base,
      ...raw,
      weekOf: raw?.weekOf ?? base.weekOf,
      days,
      weekly: {
        ...base.weekly,
        ...(raw?.weekly ?? {})
      }
    };
  }


  private alignDatesToCurrentWeek(state: WeekState): WeekState {
    const want = this.currentWeekDates();
    const days = (state.days ?? []).map((d, i) => ({ ...d, date: want[i] }));
    const weekOf = this.iso(this.mondayOf(new Date()));
    return { ...state, weekOf, days };
  }

  private load() {
    // Archives if we've moved to a later week
    this.http.post(`${API}/archive-week`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();

    this.http.get<Partial<WeekState>>(`${API}/state`).pipe(
      map(raw => this.shape(raw)),
      map(s => this.alignDatesToCurrentWeek(s)),          // <-- align dates on boot
      tap(next => {
        this.subj.next(next);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      }),
      // Optional: write back once on boot so state.json reflects the aligned dates
      switchMap(next => this.http.put<WeekState>(`${API}/state`, next).pipe(
        catchError(() => of(next)), map(() => next)
      )),
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
    ).subscribe();
  }

  /**
   * Full replace — only use if you truly intend to overwrite both days & weekly
   * Prefer updateDays / updateWeekly to avoid stomping concurrent edits.
   */
  save(state: WeekState) {
    const shaped = this.shape(state);
    this.subj.next(shaped);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(shaped));
    this.http.put(`${API}/state`, shaped).pipe(catchError(_ => of(null))).subscribe();
  }

  /** Safely update ONLY the days array, merging with the latest server copy first */
  updateDays(updater: (days: WeekState['days']) => void) {
    this.http.get<Partial<WeekState>>(`${API}/state`).pipe(
      map(raw => this.shape(raw)),
      map(current => {
        // deep clone to avoid mutating observables
        const next: WeekState = JSON.parse(JSON.stringify(current));

        // apply caller's change to days
        updater(next.days);

        // >>> preserve the most recent WEEKLY from our in-memory state to avoid races
        const live = this.subj.value;
        if (live?.weekly) {
          next.weekly = JSON.parse(JSON.stringify(live.weekly));
        }
        next.weekOf = this.iso(this.mondayOf(new Date()));
        return next;
      }),
      switchMap(next =>
        this.http.put<WeekState>(`${API}/state`, next).pipe(map(() => next))
      ),
      tap(next => {
        this.subj.next(next);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      }),
      catchError(_ => of(null))
    ).subscribe();
  }

  /** Safely update ONLY the weekly block, merging with the latest server copy first */
  updateWeekly(updater: (w: WeekState['weekly']) => void) {
    this.http.get<Partial<WeekState>>(`${API}/state`).pipe(
      map(raw => this.shape(raw)),
      map(current => {
        const next: WeekState = JSON.parse(JSON.stringify(current));

        if (!next.weekly) next.weekly = { goals: [], subgoals: [] };
        // apply caller's change to weekly
        updater(next.weekly);

        // >>> preserve the most recent DAYS from our in-memory state to avoid races
        const live = this.subj.value;
        if (live?.days?.length) {
          next.days = JSON.parse(JSON.stringify(live.days));
        }
        next.weekOf = this.iso(this.mondayOf(new Date()));
        return next;
      }),
      switchMap(next =>
        this.http.put<WeekState>(`${API}/state`, next).pipe(map(() => next))
      ),
      tap(next => {
        this.subj.next(next);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      }),
      catchError(_ => of(null))
    ).subscribe();
  }

}
