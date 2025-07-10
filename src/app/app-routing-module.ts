import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GoalList } from './goal-list/goal-list';

const routes: Routes = [
  { path: '', component: GoalList },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
