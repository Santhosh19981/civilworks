import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
    {
        path: '',
        component: TabsPage,
        children: [
            {
                path: 'home',
                loadChildren: () => import('../pages/home/home.module').then(m => m.HomePageModule)
            },
            {
                path: 'products',
                loadChildren: () => import('../pages/products/products.module').then(m => m.ProductsPageModule)
            },
            {
                path: 'rentals',
                loadChildren: () => import('../pages/rentals/rentals.module').then(m => m.RentalsPageModule)
            },
            {
                path: 'orders',
                loadChildren: () => import('../pages/orders/orders.module').then(m => m.OrdersPageModule)
            },
            {
                path: 'profile',
                loadChildren: () => import('../pages/profile/profile.module').then(m => m.ProfilePageModule)
            },
            {
                path: 'sop',
                loadChildren: () => import('../pages/sop/sop.module').then(m => m.SOPPageModule)
            },
            {
                path: 'sop/:orderId',
                loadChildren: () => import('../pages/sop/sop.module').then(m => m.SOPPageModule)
            },
            {
                path: '',
                redirectTo: '/tabs/home',
                pathMatch: 'full'
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule { }
