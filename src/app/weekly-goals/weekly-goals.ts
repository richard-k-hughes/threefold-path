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
  subgoalCategories: string[] = [];
  mondayDate: Date = new Date(); // Property to store the Monday date

  // Fixed subgoals
  private fixedSubgoals = ['Financial Assessment', 'Water Plants'];
  // Alternating subgoals
  private alternatingSubgoals = ['Wash Bedding', 'Laundry'];

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
    // Subgoals are initialized in initializeSubgoalCategories()
  }

  ngOnInit(): void {
    // Subscribe to backlog tasks
    this.subscription.add(
      this.backlogService.backlogTasks$.subscribe(tasks => {
        this.backlogTasks = tasks;
      })
    );

    // Initialize subgoal categories with fixed subgoals and the appropriate alternating subgoal
    this.initializeSubgoalCategories();

    // Calculate the Monday date for the current week
    this.calculateMondayDate();
  }

  /**
   * Calculate the date of Monday in the current week
   */
  private calculateMondayDate(): void {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate the date of Monday in the current week
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // If today is Sunday, go back 6 days, otherwise calculate days from Monday
    this.mondayDate = new Date(today);
    this.mondayDate.setDate(today.getDate() + mondayOffset);
  }

  /**
   * Initialize subgoal categories with fixed subgoals and the appropriate alternating subgoal
   * The last item alternates between "Wash Bedding" and "Laundry" based on the current date
   */
  private initializeSubgoalCategories(): void {
    // Start with the fixed subgoals
    this.subgoalCategories = [...this.fixedSubgoals];

    // Determine which alternating subgoal to use based on the current date
    // Use even/odd weeks to alternate between "Wash Bedding" and "Laundry"
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((today.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);

    // Add the appropriate alternating subgoal
    const alternatingIndex = weekNumber % 2; // 0 for even weeks, 1 for odd weeks
    this.subgoalCategories.push(this.alternatingSubgoals[alternatingIndex]);

    // Initialize goals for all subgoals
    for (const sub of this.subgoalCategories) {
      this.goals[sub] = { checked: false, note: '' };
    }
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
