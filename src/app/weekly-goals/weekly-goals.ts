import { AfterViewInit, Component, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { BacklogService } from '../services/backlog.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-weekly-goals',
  standalone: false,
  templateUrl: './weekly-goals.html',
  styleUrl: './weekly-goals.scss'
})
export class WeeklyGoals implements AfterViewInit, OnInit, OnDestroy {
  primaryGoalCategories: string[] = [];
  subgoalCategories = ['Meditation', 'Diet Adherence', 'Reading', 'Project Progress'];

  goals: Record<string, { checked: boolean; note: string }> = {};
  showModal = false;
  newGoalText = '';
  backlogTasks: string[] = [];
  selectedBacklogTask = '';
  private subscription: Subscription = new Subscription();

  constructor(
    private elRef: ElementRef,
    private backlogService: BacklogService
  ) {
    // Initialize subgoals
    for (const sub of this.subgoalCategories) {
      this.goals[sub] = { checked: false, note: '' };
    }
  }

  ngOnInit(): void {
    this.subscription.add(
      this.backlogService.backlogTasks$.subscribe(tasks => {
        this.backlogTasks = tasks;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onManualInputChange(): void {
    // If user types in the manual input, clear the backlog selection
    if (this.newGoalText.trim()) {
      this.selectedBacklogTask = '';
    }
  }

  onBacklogSelectChange(): void {
    // If user selects from backlog, clear the manual input
    if (this.selectedBacklogTask) {
      this.newGoalText = '';
    }
  }

  addGoal(): void {
    let goalText = '';

    // Prioritize manual input if it has content
    if (this.newGoalText.trim()) {
      goalText = this.newGoalText.trim();
    } else if (this.selectedBacklogTask) {
      goalText = this.selectedBacklogTask;
    }

    if (goalText) {
      this.primaryGoalCategories.push(goalText);
      this.goals[goalText] = { checked: false, note: '' };
      this.resetForm();
      this.showModal = false;
    }
  }

  resetForm(): void {
    this.newGoalText = '';
    this.selectedBacklogTask = '';
  }

  openModal(): void {
    this.showModal = true;
    this.resetForm();

    setTimeout(() => {
      const input = this.elRef.nativeElement.querySelector('#newGoalInput');
      if (input) {
        input.focus();
      }
    }, 0);
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
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
