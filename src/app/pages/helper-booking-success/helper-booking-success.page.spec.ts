import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelperBookingSuccessPage } from './helper-booking-success.page';

describe('HelperBookingSuccessPage', () => {
  let component: HelperBookingSuccessPage;
  let fixture: ComponentFixture<HelperBookingSuccessPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HelperBookingSuccessPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
