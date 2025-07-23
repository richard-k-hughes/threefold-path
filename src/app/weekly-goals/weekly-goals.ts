import { AfterViewInit, Component, ElementRef } from '@angular/core';

@Component({
  selector: 'app-weekly-goals',
  standalone: false,
  templateUrl: './weekly-goals.html',
  styleUrl: './weekly-goals.scss'
})
export class WeeklyGoals implements AfterViewInit {
  primaryGoalCategories = ['Physical', 'Learning/Building', 'Music/Art'];
  subgoalCategories = ['Meditation', 'Diet Adherence', 'Reading', 'Project Progress'];

  goals: Record<string, { checked: boolean; note: string }> = {};

  constructor(private elRef: ElementRef) {
    // Initialize primary goals
    for (const category of this.primaryGoalCategories) {
      this.goals[category] = { checked: false, note: '' };
    }

    // Initialize subgoals
    for (const sub of this.subgoalCategories) {
      this.goals[sub] = { checked: false, note: '' };
    }
  }

  autoGrow(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  ngAfterViewInit() {
    const textareas = this.elRef.nativeElement.querySelectorAll('.goal-input-textarea');
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
