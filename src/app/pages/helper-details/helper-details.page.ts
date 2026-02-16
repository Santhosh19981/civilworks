import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HelperService } from '../../services/helper.service';
import { OrderService } from '../../services/order.service';
import { Helper } from '../../models/helper.model';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-helper-details',
  templateUrl: './helper-details.page.html',
  styleUrls: ['./helper-details.page.scss'],
})
export class HelperDetailsPage implements OnInit {
  helper: Helper | undefined;
  loading = true;
  membersCount = 1;
  totalAmount = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private helperService: HelperService,
    private orderService: OrderService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadHelper(id);
    }
  }

  loadHelper(id: string) {
    this.loading = true;
    setTimeout(() => {
      this.helper = this.helperService.getHelperById(id);
      this.calculateTotal();
      this.loading = false;
    }, 500);
  }

  incrementMembers() {
    this.membersCount++;
    this.calculateTotal();
  }

  decrementMembers() {
    if (this.membersCount > 1) {
      this.membersCount--;
      this.calculateTotal();
    }
  }

  calculateTotal() {
    if (this.helper) {
      this.totalAmount = this.membersCount * this.helper.pricePerDay;
    }
  }

  async placeBooking() {
    if (!this.helper) return;

    // Simulate booking storage
    const bookingId = 'HELP' + Math.floor(1000 + Math.random() * 9000);
    const bookingData = {
      bookingId: bookingId,
      serviceName: this.helper.name,
      members: this.membersCount,
      totalAmount: this.totalAmount,
      date: new Date().toISOString().split('T')[0],
      status: 'Booked',
      mobile: this.helper.mobile,
      type: 'helper'
    };

    // Save to LocalStorage (simulating app logic)
    const existingBookings = JSON.parse(localStorage.getItem('civilworks_helper_bookings') || '[]');
    existingBookings.push(bookingData);
    localStorage.setItem('civilworks_helper_bookings', JSON.stringify(existingBookings));

    const toast = await this.toastController.create({
      message: 'Booking placed successfully!',
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    toast.present();

    this.router.navigate(['/helper-booking-success'], {
      state: { booking: bookingData }
    });
  }
}
