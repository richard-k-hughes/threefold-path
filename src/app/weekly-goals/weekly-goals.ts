import { AfterViewInit, Component, ElementRef } from '@angular/core';

@Component({
  selector: 'app-weekly-goals',
  standalone: false,
  templateUrl: './weekly-goals.html',
  styleUrl: './weekly-goals.scss'
})
export class WeeklyGoals implements AfterViewInit {
  primaryGoalCategories: string[] = [];
  subgoalCategories = ['Meditation', 'Diet Adherence', 'Reading', 'Project Progress'];

  goals: Record<string, { checked: boolean; note: string }> = {};
  showModal = false;
  newGoalText = '';

  constructor(private elRef: ElementRef) {
    // Initialize subgoals
    for (const sub of this.subgoalCategories) {
      this.goals[sub] = { checked: false, note: '' };
    }
  }

  addGoal(): void {
    if (this.newGoalText.trim()) {
      this.primaryGoalCategories.push(this.newGoalText.trim());
      this.goals[this.newGoalText.trim()] = { checked: false, note: '' };
      this.newGoalText = '';
      this.showModal = false;
    }
  }

  openModal(): void {
    this.showModal = true;
    this.newGoalText = '';
    setTimeout(() => {
      const input = this.elRef.nativeElement.querySelector('#newGoalInput');
      if (input) {
        input.focus();
      }
    }, 0);
  }

  closeModal(): void {
    this.showModal = false;
    this.newGoalText = '';
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
