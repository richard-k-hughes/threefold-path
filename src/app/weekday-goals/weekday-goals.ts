import { AfterViewInit, Component, ElementRef } from '@angular/core';

@Component({
  selector: 'app-weekday-goals',
  standalone: false,
  templateUrl: './weekday-goals.html',
  styleUrl: './weekday-goals.scss'
})
export class WeekdayGoals implements AfterViewInit {
  weekdays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
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
