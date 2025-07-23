import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { MainContainer } from './main-container/main-container';
import { Sidebar } from './layout/sidebar/sidebar';
import { WeekdayGoals } from './weekday-goals/weekday-goals';
import { WeeklyGoals } from './weekly-goals/weekly-goals';
import {FormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    App,
    MainContainer,
    Sidebar,
    WeekdayGoals,
    WeeklyGoals
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule
    ],
  providers: [
    provideBrowserGlobalErrorListeners()
  ],
  bootstrap: [App]
})
export class AppModule { }
