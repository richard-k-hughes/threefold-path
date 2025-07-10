import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainContainer } from './main-container/./main-container';

const routes: Routes = [
  { path: '', component: MainContainer },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
