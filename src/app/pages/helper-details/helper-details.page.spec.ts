import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelperDetailsPage } from './helper-details.page';

describe('HelperDetailsPage', () => {
  let component: HelperDetailsPage;
  let fixture: ComponentFixture<HelperDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HelperDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
