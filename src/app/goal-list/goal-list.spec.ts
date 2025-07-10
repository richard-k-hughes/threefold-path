import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoalList } from './goal-list';

describe('GoalList', () => {
  let component: GoalList;
  let fixture: ComponentFixture<GoalList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GoalList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoalList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
