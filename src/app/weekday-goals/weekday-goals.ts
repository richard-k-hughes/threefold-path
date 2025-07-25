import { AfterViewInit, Component, ElementRef, OnInit } from '@angular/core';

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

  constructor(private elRef: ElementRef) {
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
