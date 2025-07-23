import { Component, OnInit, OnDestroy } from '@angular/core';
import { BacklogService } from '../../services/backlog.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit, OnDestroy {
  activeTab: string = '';
  newBacklogTask: string = '';
  backlogTasks: string[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private backlogService: BacklogService) {}

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

  setActiveTab(tab: string): void {
    // Toggle off the tab if it's already active, except for 'backlog'
    if (this.activeTab === tab && tab !== 'backlog') {
      this.activeTab = '';
    } else {
      this.activeTab = tab;
    }
  }

  addBacklogTask(): void {
    if (this.newBacklogTask.trim()) {
      this.backlogService.addBacklogTask(this.newBacklogTask);
      this.newBacklogTask = '';
    }
  }

  removeBacklogTask(task: string): void {
    this.backlogService.removeBacklogTask(task);
  }
}
