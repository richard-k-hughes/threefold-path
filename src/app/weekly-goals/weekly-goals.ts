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
  primaryGoalCategories: string[] = [];
  subgoalCategories: string[] = [];
  mondayDate: Date = new Date();

  private fixedSubgoals = ['Financial Assessment', 'Water Plants'];
  private alternatingSubgoals = ['Wash Bedding', 'Laundry'];

  goals: Record<string, { checked: boolean }> = {};

  showModal = false;
  newGoalText = '';
  backlogTasks: string[] = [];
  selectedBacklogTask = '';

  private subs = new Subscription();
  private lastState!: WeekState;

  // NEW: guard to avoid acting on the initial empty subject emission
  private hydrated = false;

  constructor(
    private elRef: ElementRef<HTMLElement>,
    private backlogService: BacklogService,
    private stateSvc: WeekdayStateService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.backlogService.backlogTasks$.subscribe(tasks => (this.backlogTasks = tasks))
    );

    this.calculateMondayDate();

    this.subs.add(
      this.stateSvc.state$.subscribe((s) => {
        this.lastState = s;

        // If this is the first emission AND it looks like the initial empty value,
        // ignore it and wait for the hydrated state from the server/localStorage.
        const looksUnhydrated =
          (!s.days || s.days.length === 0) &&
          (!s.weekly || ((s.weekly.goals?.length ?? 0) === 0 && (s.weekly.subgoals?.length ?? 0) === 0));

        if (!this.hydrated && looksUnhydrated) {
          return; // wait for the next emission (after load())
        }
        this.hydrated = true;

        // If, AFTER hydration, weekly is truly empty, initialize it once
        const needsInit =
          !s.weekly ||
          (((s.weekly.goals?.length ?? 0) === 0) && ((s.weekly.subgoals?.length ?? 0) === 0));

        if (needsInit) {
          const initSubs = this.computeAlternatingSubgoals();
          this.stateSvc.updateWeekly(w => {
            w.goals = [];
            w.subgoals = initSubs.map(n => ({ name: n, done: false }));
          });
          return; // will emit again with initialized data
        }

        // Use the canonical Monday from state if it exists
        if (s.weekOf) {
          const dt = new Date(s.weekOf + 'T00:00:00'); // ISO -> local Date
          if (!Number.isNaN(dt.getTime())) this.mondayDate = dt;
        }

        // map service → component UI
        this.primaryGoalCategories = (s.weekly.goals ?? []).map(g => g.name);
        this.subgoalCategories     = (s.weekly.subgoals ?? []).map(sg => sg.name);

        const map: Record<string, { checked: boolean }> = {};
        for (const g of s.weekly.goals ?? []) map[g.name] = { checked: !!g.done };
        for (const sg of s.weekly.subgoals ?? []) map[sg.name] = { checked: !!sg.done };
        this.goals = map;
      })
    );
  }

  ngAfterViewInit() {
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

  // ---- persistence

  addGoal(): void {
    let goalText = '';
    if (this.newGoalText.trim()) goalText = this.newGoalText.trim();
    else if (this.selectedBacklogTask) goalText = this.selectedBacklogTask;
    if (!goalText) return;

    this.primaryGoalCategories.push(goalText);
    this.goals[goalText] = { checked: false };
    this.closeModal();

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

  // ---- helpers

  private calculateMondayDate(): void {
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sun..6=Sat
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    this.mondayDate = new Date(today);
    this.mondayDate.setDate(today.getDate() + mondayOffset);
  }

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
