import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API_BASE = 'http://localhost:3000';

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

  goals: Record<string, Record<string, { checked: boolean; note: string }>> = {};

  constructor(private elRef: ElementRef, private http: HttpClient) {
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
    this.loadState();
  }

  private loadState(): void {
    this.http.get<{ days: any[] }>(`${API_BASE}/state`)
      .subscribe(state => {
        state.days.forEach(dayState => {
          const day = dayState.name;
          // map main goals
          dayState.dailyGoals.forEach((g: any) => {
            if (this.goals[day] && this.goals[day][g.name]) {
              this.goals[day][g.name].checked = g.done;
              this.goals[day][g.name].note = g.description;
            }
          });
          // map subgoals
          dayState.subgoals.forEach((s: any) => {
            if (this.goals[day] && this.goals[day][s.name]) {
              this.goals[day][s.name].checked = s.done;
            }
          });
        });
      }, err => console.error('Failed to load state', err));
  }

  private saveState(): void {
    const payload = {
      days: this.weekdays.map((day, idx) => ({
        name: day,
        date: this.weekdayDates[idx].toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dailyGoals: this.goalCategories.map(name => ({
          name,
          done: this.goals[day][name].checked,
          description: this.goals[day][name].note
        })),
        subgoals: this.subgoalCategories.map(name => ({
          name,
          done: this.goals[day][name].checked
        }))
      }))
    };
    this.http.put(`${API_BASE}/state`, payload)
      .subscribe({ error: err => console.error('Failed to save state', err) });
  }

  onCheckboxChange(day: string, category: string): void {
    this.goals[day][category].checked = !this.goals[day][category].checked;
    this.saveState();
  }

  onNoteChange(day: string, category: string, note: string): void {
    this.goals[day][category].note = note;
    this.saveState();
  }


  /**
   * Calculate dates for the current week (Monday to Friday)
   */
  calculateWeekDates(): void {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate the date of Monday in the current week
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // If today is Sunday, go back 6 days, otherwise calculate days from Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    // Generate dates for Monday through Friday
    this.weekdayDates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      this.weekdayDates.push(date);
    }
  }

  autoGrow(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  ngAfterViewInit() {
    const textareas = this.elRef.nativeElement.querySelectorAll('.goal-input');
    textareas.forEach((textarea: HTMLTextAreaElement) => {
      const autoResize = () => {
        textarea.style.height = 'auto'; // reset
        textarea.style.height = `${textarea.scrollHeight}px`; // grow
      };

      // resize now + on input
      autoResize();
      textarea.addEventListener('input', autoResize);
    });
  }


}
