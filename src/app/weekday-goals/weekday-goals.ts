import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { WeekdayStateService, DayState } from '../services/weekday-state.service';

@Component({
  selector: 'app-weekday-goals',
  standalone: false,
  templateUrl: './weekday-goals.html',
  styleUrl: './weekday-goals.scss'
})
export class WeekdayGoals implements AfterViewInit, OnInit {
  weekdays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  weekdayDates: Date[] = [];
  goalCategories = ['Physical', 'Learning/Building', 'Music/Art'];
  subgoalCategories = ['Meditation', 'Diet Adherence'];

  // UI model (checkbox + note)
  goals: Record<string, Record<string, { checked: boolean; note: string }>> = {};

  constructor(
    private elRef: ElementRef,
    private stateSvc: WeekdayStateService
  ) {
    // seed empty structure so template always has keys
    for (const day of this.weekdays) {
      this.goals[day] = {};
      for (const category of this.goalCategories) {
        this.goals[day][category] = { checked: false, note: '' };
      }
      for (const sub of this.subgoalCategories) {
        this.goals[day][sub] = { checked: false, note: '' };
      }
    }
  }

  ngOnInit(): void {
    this.calculateWeekDates();

    // Load from service → map into local UI state
    this.stateSvc.state$.subscribe(state => {
      state.days.forEach(dayState => {
        const day = dayState.name;

        // map main goals
        dayState.dailyGoals.forEach(g => {
          if (!this.goals[day]) this.goals[day] = {} as any;
          if (!this.goals[day][g.name]) this.goals[day][g.name] = { checked: false, note: '' };
          this.goals[day][g.name].checked = !!g.done;
          this.goals[day][g.name].note = g.description ?? '';
        });

        // map subgoals (no notes)
        dayState.subgoals.forEach(s => {
          if (!this.goals[day]) this.goals[day] = {} as any;
          if (!this.goals[day][s.name]) this.goals[day][s.name] = { checked: false, note: '' };
          this.goals[day][s.name].checked = !!s.done;
        });
      });

      // expand prefilled notes after DOM updates
      setTimeout(() => {
        const root = this.elRef.nativeElement as HTMLElement;
        const nodes = root.querySelectorAll('.goal-input') as NodeListOf<HTMLTextAreaElement>;
        nodes.forEach(ta => this.autoGrow(ta));
      }, 0);
    });
  }

  /** Calculate dates for the current week (Monday to Friday) */
  calculateWeekDates(): void {
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sun .. 6=Sat
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    this.weekdayDates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      this.weekdayDates.push(date);
    }
  }

  // ===== Persisting handlers (now use updateDays) =====

  onCheckboxChange(dayIdx: number, day: string, category: string): void {
    const cur = this.goals[day][category];
    cur.checked = !cur.checked;

    this.stateSvc.updateDays(days => {
      // create the day if missing
      let d = days[dayIdx];
      if (!d) {
        d = {
          name: day,
          date: this.weekdayDates[dayIdx]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? '',
          dailyGoals: this.goalCategories.map(n => ({ name: n, done: false, description: '' })),
          subgoals: this.subgoalCategories.map(n => ({ name: n, done: false }))
        };
        days[dayIdx] = d;
      }

      // flip the correct item
      const g  = d.dailyGoals.find(x => x.name === category);
      const sg = d.subgoals.find(x => x.name === category);
      if (g)  g.done  = cur.checked;
      if (sg) sg.done = cur.checked;
    });
  }

  onNoteChange(dayIdx: number, day: string, category: string, note: string): void {
    this.goals[day][category].note = note;

    this.stateSvc.updateDays(days => {
      // ensure day exists
      let d = days[dayIdx];
      if (!d) {
        d = {
          name: day,
          date: this.weekdayDates[dayIdx]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? '',
          dailyGoals: this.goalCategories.map(n => ({ name: n, done: false, description: '' })),
          subgoals: this.subgoalCategories.map(n => ({ name: n, done: false }))
        };
        days[dayIdx] = d;
      }

      // ensure goal exists, then set note
      let g = d.dailyGoals.find(x => x.name === category);
      if (!g) {
        g = { name: category, done: false, description: '' };
        d.dailyGoals.push(g);
      }
      g.description = note;
    });
  }

  // ===== UI helpers (unchanged) =====

  autoGrow(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  ngAfterViewInit() {
    const textareas = this.elRef.nativeElement.querySelectorAll('.goal-input') as NodeListOf<HTMLTextAreaElement>;
    textareas.forEach(textarea => {
      const autoResize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      };
      autoResize();
      textarea.addEventListener('input', autoResize);
    });
  }
}
