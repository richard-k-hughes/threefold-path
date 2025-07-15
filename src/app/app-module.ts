import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { MainContainer } from './main-container/main-container';
import { Sidebar } from './layout/sidebar/sidebar';
import { WeekdayGoals } from './weekday-goals/weekday-goals';

@NgModule({
  declarations: [
    App,
    MainContainer,
    Sidebar,
    WeekdayGoals
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners()
  ],
  bootstrap: [App]
})
export class AppModule { }
