import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        redirectTo: 'splash',
        pathMatch: 'full'
    },
    {
        path: 'splash',
        loadChildren: () => import('./pages/splash/splash.module').then(m => m.SplashPageModule)
    },
    {
        path: 'sector-select',
        loadChildren: () => import('./pages/sector-select/sector-select.module').then(m => m.SectorSelectPageModule)
    },
    {
        path: 'tabs',
        loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
    },
    {
        path: 'categories',
        redirectTo: 'tabs/home',
        pathMatch: 'full'
    },
    {
        path: 'product-detail/:id',
        loadChildren: () => import('./pages/product-detail/product-detail.module').then(m => m.ProductDetailPageModule)
    },
    {
        path: 'rental-detail/:id',
        loadChildren: () => import('./pages/rental-detail/rental-detail.module').then(m => m.RentalDetailPageModule)
    },
    {
        path: 'cart',
        loadChildren: () => import('./pages/cart/cart.module').then(m => m.CartPageModule)
    },
    {
        path: 'login',
        loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
    },
    {
        path: 'checkout',
        loadChildren: () => import('./pages/checkout/checkout.module').then(m => m.CheckoutPageModule)
    },
    {
        path: 'membership-checkout',
        loadChildren: () => import('./pages/membership-checkout/membership-checkout.module').then(m => m.MembershipCheckoutPageModule)
    },
    {
        path: 'payment',
        loadChildren: () => import('./pages/payment/payment.module').then(m => m.PaymentPageModule)
    },
    {
        path: 'order-success',
        loadChildren: () => import('./pages/order-success/order-success.module').then(m => m.OrderSuccessPageModule)
    },
    {
        path: 'helpers',
        loadChildren: () => import('./pages/helpers/helpers.module').then(m => m.HelpersPageModule)
    },
    {
        path: 'helper-details/:id',
        loadChildren: () => import('./pages/helper-details/helper-details.module').then(m => m.HelperDetailsPageModule)
    },
    {
        path: 'helper-booking-success',
        loadChildren: () => import('./pages/helper-booking-success/helper-booking-success.module').then(m => m.HelperBookingSuccessPageModule)
    },
    {
        path: 'rental-booking-success',
        loadChildren: () => import('./pages/rental-booking-success/rental-booking-success.module').then(m => m.RentalBookingSuccessPageModule)
    },
    {
        path: 'services',
        loadChildren: () => import('./pages/products/products.module').then(m => m.ProductsPageModule)
    },
    {
        path: 'sop',
        loadChildren: () => import('./pages/sop/sop.module').then(m => m.SOPPageModule)
    },
    {
        path: 'sop/:orderId',
        loadChildren: () => import('./pages/sop/sop.module').then(m => m.SOPPageModule)
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
