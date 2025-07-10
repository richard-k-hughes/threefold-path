import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainContainer } from '././main-container';

describe('MainContainer', () => {
  let component: MainContainer;
  let fixture: ComponentFixture<MainContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MainContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
