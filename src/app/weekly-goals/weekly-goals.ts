import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BacklogService } from '../services/backlog.service';
import { WeekdayStateService, WeekState } from '../services/weekday-state.service';

@Component({
  selector: 'app-weekly-goals',
  standalone: false,
  templateUrl: './weekly-goals.html',
  styleUrl: './weekly-goals.scss'
})
export class WeeklyGoals implements AfterViewInit, OnInit, OnDestroy {
  // === UI state you already had ===
  primaryGoalCategories: string[] = [];   // names of weekly primary goals
  subgoalCategories: string[] = [];       // names of weekly subgoals
  mondayDate: Date = new Date();

  // fixed/alternating subgoals
  private fixedSubgoals = ['Financial Assessment', 'Water Plants'];
  private alternatingSubgoals = ['Wash Bedding', 'Laundry'];

  // checkbox state keyed by name (weekly only; no descriptions here)
  goals: Record<string, { checked: boolean }> = {};

  // modal / backlog controls (unchanged)
  showModal = false;
  newGoalText = '';
  backlogTasks: string[] = [];
  selectedBacklogTask = '';

  // internals
  private subs = new Subscription();
  private lastState!: WeekState; // keep for parity with your original file

  constructor(
    private elRef: ElementRef<HTMLElement>,
    private backlogService: BacklogService,
    private stateSvc: WeekdayStateService
  ) {}

  // -------------------- lifecycle --------------------

  ngOnInit(): void {
    // backlog subscription (unchanged)
    this.subs.add(
      this.backlogService.backlogTasks$.subscribe(tasks => {
        this.backlogTasks = tasks;
      })
    );

    // compute current week Monday
    this.calculateMondayDate();

    // load weekly state from service; initialize if missing
    this.subs.add(
      this.stateSvc.state$.subscribe((s) => {
        this.lastState = s;

        // if weekly block is missing/empty, initialize once from your rules
        const needsInit =
          !s.weekly ||
          ((!s.weekly.goals || s.weekly.goals.length === 0) &&
            (!s.weekly.subgoals || s.weekly.subgoals.length === 0));

        if (needsInit) {
          // build subgoals from fixed + alternating rule
          const initSubs = this.computeAlternatingSubgoals();
          // initialize ONLY the weekly section via updateWeekly (doesn't touch days)
          this.stateSvc.updateWeekly(w => {
            w.goals = [];
            w.subgoals = initSubs.map(n => ({ name: n, done: false }));
          });
          return; // service will emit again with the initialized data
        }

        // map service → component fields
        this.primaryGoalCategories = (s.weekly.goals ?? []).map(g => g.name);
        this.subgoalCategories     = (s.weekly.subgoals ?? []).map(sg => sg.name);

        // rebuild the checked map
        const map: Record<string, { checked: boolean }> = {};
        for (const g of s.weekly.goals ?? []) map[g.name] = { checked: !!g.done };
        for (const sg of s.weekly.subgoals ?? []) map[sg.name] = { checked: !!sg.done };
        this.goals = map;
      })
    );
  }

  ngAfterViewInit() {
    // keep your existing auto-grow binding for any textareas you might add later
    const nodes = this.elRef.nativeElement.querySelectorAll('.goal-input-textarea');
    (Array.from(nodes) as HTMLTextAreaElement[]).forEach((textarea) => {
      const autoResize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      };
      autoResize();
      textarea.addEventListener('input', autoResize);
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // -------------------- UI helpers (unchanged) --------------------

  openModal(): void {
    this.showModal = true;
    this.resetForm();

    setTimeout(() => {
      const input = this.elRef.nativeElement.querySelector('#newGoalInput') as HTMLInputElement | null;
      input?.focus();
    }, 0);
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.newGoalText = '';
    this.selectedBacklogTask = '';
  }

  onManualInputChange(): void {
    if (this.newGoalText.trim()) this.selectedBacklogTask = '';
  }

  onBacklogSelectChange(): void {
    if (this.selectedBacklogTask) this.newGoalText = '';
  }

  autoGrow(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  // -------------------- weekly logic + persistence --------------------

  addGoal(): void {
    let goalText = '';
    if (this.newGoalText.trim()) goalText = this.newGoalText.trim();
    else if (this.selectedBacklogTask) goalText = this.selectedBacklogTask;

    if (!goalText) return;

    // update UI
    this.primaryGoalCategories.push(goalText);
    this.goals[goalText] = { checked: false };
    this.closeModal();

    // persist ONLY weekly via service merge
    this.persistWeekly();
  }

  removeWeeklyGoal(i: number): void {
    const name = this.primaryGoalCategories[i];
    if (!name) return;

    this.primaryGoalCategories.splice(i, 1);
    delete this.goals[name];

    this.persistWeekly();
  }

  toggleWeeklyGoal(i: number): void {
    const name = this.primaryGoalCategories[i];
    if (!name) return;
    this.goals[name].checked = !this.goals[name].checked;
    this.persistWeekly();
  }

  toggleWeeklySubgoal(i: number): void {
    const name = this.subgoalCategories[i];
    if (!name) return;
    this.goals[name].checked = !this.goals[name].checked;
    this.persistWeekly();
  }

  private persistWeekly(): void {
    this.stateSvc.updateWeekly(w => {
      w.goals = this.primaryGoalCategories.map(n => ({
        name: n,
        done: this.goals[n]?.checked ?? false
      }));
      w.subgoals = this.subgoalCategories.map(n => ({
        name: n,
        done: this.goals[n]?.checked ?? false
      }));
    });
  }

  // -------------------- date / alternating helpers --------------------

  private calculateMondayDate(): void {
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sun..6=Sat
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    this.mondayDate = new Date(today);
    this.mondayDate.setDate(today.getDate() + mondayOffset);
  }

  /** returns fixed + one alternating subgoal for this week */
  private computeAlternatingSubgoals(): string[] {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      (((today.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7
    );
    const alternatingIndex = weekNumber % 2;
    return [...this.fixedSubgoals, this.alternatingSubgoals[alternatingIndex]];
  }
}
