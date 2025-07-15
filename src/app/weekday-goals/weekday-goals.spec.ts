import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeekdayGoals } from './weekday-goals';

describe('WeekdayGoals', () => {
  let component: WeekdayGoals;
  let fixture: ComponentFixture<WeekdayGoals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WeekdayGoals]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeekdayGoals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
