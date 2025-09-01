import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { HistoryService } from '../services/history.service';

@Component({
  selector: 'app-history-viewer',
  standalone: false,
  templateUrl: './history-viewer.html',
  styleUrl: './history-viewer.scss'
})
export class HistoryViewer implements OnInit {
  @Input() filename: string = '';
  @Output() close = new EventEmitter<void>();

  isLoading: boolean = true;
  error: string | null = null;
  historyData: any = null;
  mondayDate: Date | null = null;

  primaryGoalCategories: string[] = [];
  subgoalCategories: string[] = [];
  goals: Record<string, { checked: boolean }> = {};

  // Add weekday data properties
  weekdays: any[] = [];
  selectedDay: any = null;

  constructor(private historyService: HistoryService) {}

  ngOnInit(): void {
    if (this.filename) {
      this.loadHistoryData();
    }
  }

  loadHistoryData(): void {
    this.isLoading = true;
    this.error = null;

    this.historyService.getHistoryFile(this.filename).subscribe({
      next: (data) => {
        this.historyData = data;
        this.processHistoryData();
        this.isLoading = false;

        // Select the first day by default if days exist
        if (this.weekdays.length > 0) {
          this.selectedDay = this.weekdays[0];
        }
      },
      error: (err) => {
        console.error('Failed to load history data:', err);
        this.error = 'Failed to load history data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private processHistoryData(): void {
    if (!this.historyData) return;

    // Set the Monday date
    if (this.historyData.weekOf) {
      const dateStr = this.historyData.weekOf;
      this.mondayDate = new Date(`${dateStr}T00:00:00`);
    }

    // Process weekly goals
    if (this.historyData.weekly) {
      this.primaryGoalCategories = (this.historyData.weekly.goals || []).map((g: any) => g.name);
      this.subgoalCategories = (this.historyData.weekly.subgoals || []).map((sg: any) => sg.name);

      const map: Record<string, { checked: boolean }> = {};
      for (const g of this.historyData.weekly.goals || []) {
        map[g.name] = { checked: !!g.done };
      }
      for (const sg of this.historyData.weekly.subgoals || []) {
        map[sg.name] = { checked: !!sg.done };
      }
      this.goals = map;
    }

    // Process weekday data
    if (this.historyData.days && Array.isArray(this.historyData.days)) {
      this.weekdays = this.historyData.days;
    }
  }

  // Method to select a specific day
  selectDay(day: any): void {
    this.selectedDay = day;
  }

  closeModal(): void {
    this.close.emit();
  }
}
