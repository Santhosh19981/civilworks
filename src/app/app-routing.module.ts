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
        path: 'tabs',
        loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
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
        path: 'payment',
        loadChildren: () => import('./pages/payment/payment.module').then(m => m.PaymentPageModule)
    },
    {
        path: 'order-success',
        loadChildren: () => import('./pages/order-success/order-success.module').then(m => m.OrderSuccessPageModule)
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule { }
