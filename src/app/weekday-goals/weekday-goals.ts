import { Component } from '@angular/core';

@Component({
  selector: 'app-weekday-goals',
  standalone: false,
  templateUrl: './weekday-goals.html',
  styleUrl: './weekday-goals.scss'
})
export class WeekdayGoals {
  weekdays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  goalCategories = ['Physical', 'Learning/Building', 'Music/Art'];

  goals: Record<string, Record<string, { checked: boolean; note: string }>> = {};

  constructor() {
    // Initialize goals structure
    for (const day of this.weekdays) {
      this.goals[day] = {};
      for (const category of this.goalCategories) {
        this.goals[day][category] = { checked: false, note: '' };
      }
    }
  }
}
