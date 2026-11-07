import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { OrderService } from '../../services/order.service';
import { ChatService } from '../../services/chat.service';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-orders',
    templateUrl: './orders.page.html',
    styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit, OnDestroy {
    // Client launch mode: Services-only orders view
    activeTab: 'products' | 'services' | 'rentals' = 'services';

    allOrders: any[] = [];
    productOrders: any[] = [];
    serviceOrders: any[] = [];
    rentalOrders: any[] = [];

    loading = true;
    selectedSectorFilter = 'All'; // All | Construction | Interiors | Real Estate

    private subs = new Subscription();

    // View Details Modal State
    showDetailsModal = false;
    selectedOrder: any = null;

    // Chat Drawer State
    showChatPanel = false;
    chatInitialOrderId: number | string | null = null;

    // Edit Order Modal State
    showEditModal = false;
    editingOrder: any = null;

    // Replace Vendor Modal State
    showVendorPickerModal = false;
    loadingReplaceVendors = false;
    replacingOrder: any = null;
    replacingService: any = null;
    replaceVendorsList: any[] = [];

    constructor(
        private orderService: OrderService,
        private chatService: ChatService,
        private productService: ProductService,
        private cartService: CartService,
        private authService: AuthService,
        private alertCtrl: AlertController,
        private toastCtrl: ToastController,
        private loadingCtrl: LoadingController,
        private router: Router,
        private route: ActivatedRoute,
        private location: Location
    ) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            // Service-first launch: default and stay on services
            this.activeTab = 'services';
        });
        this.loadOrders();

        // Real-time WebSocket updates for instant UI synchronization
        this.subs.add(
            this.chatService.orderEvent$.subscribe(async ({ event, data }) => {
                console.log('[OrdersPage] Real-time order event:', event, data);
                this.loadOrders(false);
                if (event === 'notification_received' && data?.message) {
                    const toast = await this.toastCtrl.create({
                        header: data.title || 'Order Update',
                        message: data.message,
                        duration: 4500,
                        position: 'top',
                        color: 'primary',
                        buttons: [{ text: 'OK', role: 'cancel' }]
                    });
                    await toast.present();
                }
            })
        );

        this.subs.add(
            this.chatService.sopUpdated$.subscribe(({ event, data }) => {
                console.log('[OrdersPage] Real-time SOP event:', event, data);
                this.loadOrders(false);
            })
        );
    }

    ngOnDestroy() {
        this.subs.unsubscribe();
    }

    ionViewWillEnter() {
        this.loadOrders();
    }

    switchTab(tab: 'products' | 'services' | 'rentals') {
        this.activeTab = tab;
    }

    loadOrders(showSpinner = true) {
        if (showSpinner) {
            this.loading = true;
        }

        this.orderService.getMyOrders().subscribe({
            next: (data: any[]) => {
                const apiOrders = (data || []).map((o: any) => {
                    const itemName = o.items?.[0]?.product_name || o.items?.[0]?.name || o.services?.[0]?.service_name || o.services?.[0]?.subcategory_name || 'Order';
                    const resolved = this.resolveSector(itemName, o.main_category_name || o.items?.[0]?.main_category_name);

                    const isHelper = o.order_type === 'helper' || o.type === 'helper';

                    // Service orders are editable multi-service projects, but helper orders cannot be edited
                    const hasEditableSub = !isHelper && (
                        o.order_type === 'service' || o.type === 'service' || 
                        o.is_editable_order === true || o.is_editable_order === 1 || 
                        (o.services && o.services.some((s: any) => s.is_editable_order === 1 || s.is_editable_order === true))
                    );

                    return {
                        id: o.order_no || ('ORD-' + o.id),
                        rawId: o.id,
                        orderNo: o.order_no || ('ORD-' + o.id),
                        serviceName: itemName,
                        items: o.items || [],
                        services: o.services || [],
                        total: Number(o.total_amount || o.total || 0),
                        status: o.order_status || o.status || 'Confirmed',
                        date: new Date(o.created_at || o.date || Date.now()),
                        paymentMethod: o.payment_method || o.paymentMethod || 'Online / Pay on Site',
                        main_category_name: resolved.name,
                        main_category_id: resolved.id,
                        type: isHelper ? 'helper' : (o.order_type || 'product'),
                        is_editable_order: hasEditableSub,
                        conversation_id: isHelper ? null : (o.conversation_id || null),
                        address: o.address || null
                    };
                });

                this.combineOrders(apiOrders);
            },
            error: () => {
                this.combineOrders([]);
            }
        });
    }

    private resolveSector(itemName: string, fallbackSector?: string): { name: string, id: number } {
        const name = (itemName || '').toLowerCase();
        if (/cement|steel|sand|brick|tmt|ultratech|conduit|pipe|mortar|aggregate|concrete|tool|hammer|goggle|safety|jcb|excavator|machine|fleet|rental/i.test(name)) {
            return { name: 'Construction', id: 1 };
        }
        if (/plot|land|acre|villa|sq\s*feet|square\s*feet|infra|commercial\s*site/i.test(name)) {
            return { name: 'Real Estate', id: 3 };
        }
        if (/furniture|wardrobe|bed|kitchen|carpenter|interior|design/i.test(name)) {
            return { name: 'Interiors', id: 2 };
        }
        if (fallbackSector && fallbackSector.toLowerCase() !== 'all') {
            const lower = fallbackSector.toLowerCase();
            if (lower.includes('real')) return { name: 'Real Estate', id: 3 };
            if (lower.includes('interior')) return { name: 'Interiors', id: 2 };
            return { name: 'Construction', id: 1 };
        }
        return { name: 'Construction', id: 1 };
    }

    private combineOrders(apiOrders: any[]) {
        let currentUserId: any = null;
        try {
            const curUser = this.authService.getUser();
            if (curUser && curUser.id) {
                currentUserId = curUser.id;
            } else {
                const rawUser = localStorage.getItem('civilworks_user') || localStorage.getItem('currentUser') || localStorage.getItem('user');
                if (rawUser) {
                    const parsed = JSON.parse(rawUser);
                    currentUserId = parsed.id;
                }
            }
        } catch (e) { }

        // Load local fallback caches strictly isolated to current logged-in customer ID
        const localProductOrders = JSON.parse(localStorage.getItem('civilworks_product_orders') || '[]')
            .filter((p: any) => currentUserId ? (p.user_id && p.user_id == currentUserId) : false)
            .map((p: any) => {
            const itemName = p.serviceName || p.items?.[0]?.product?.name || p.items?.[0]?.name || 'InfraMart Product';
            const resolved = this.resolveSector(itemName, p.main_category_name);
            return {
                id: p.order_no || p.id || ('ORD-' + Math.floor(1000 + Math.random() * 9000)),
                rawId: p.id,
                orderNo: p.order_no || p.id,
                serviceName: itemName,
                items: p.items || [{ product: { name: 'Product' } }],
                services: [],
                total: Number(p.total_amount || p.total || p.finalAmount || 0),
                status: p.order_status || p.status || 'Confirmed',
                date: new Date(p.created_at || p.date || Date.now()),
                paymentMethod: p.payment_method || p.paymentMethod || 'Online / Pay on Site',
                main_category_name: resolved.name,
                main_category_id: resolved.id,
                type: 'product',
                is_editable_order: false,
                address: p.address || null
            };
        });

        const helperBookings = JSON.parse(localStorage.getItem('civilworks_helper_bookings') || '[]')
            .filter((b: any) => currentUserId ? ((b.user_id && b.user_id == currentUserId) || (b.userId && b.userId == currentUserId)) : false)
            .map((b: any) => ({
            id: b.bookingId || b.id || ('HELP-' + Math.floor(1000 + Math.random() * 9000)),
            rawId: b.id,
            orderNo: b.bookingId || b.id,
            serviceName: b.serviceName || b.name || b.trade || 'Skilled Site Crew',
            items: b.items || [],
            services: [{
                subcategory_name: b.serviceName || b.name || b.trade || 'Helper Service',
                vendor_name: b.vendorName || 'Direct Workforce Allocation',
                vendor_status: 'confirmed',
                price: b.totalAmount || b.finalAmount || b.total,
                is_editable_order: 0
            }],
            total: Number(b.finalAmount || b.totalAmount || b.total || 0),
            status: b.bookingStatus || b.status || 'Confirmed',
            date: new Date(b.bookedAt || b.date || Date.now()),
            paymentMethod: b.paymentMethod || 'Online / Pay on Site',
            main_category_name: b.main_category_name || 'Construction',
            main_category_id: b.main_category_id || 1,
            type: 'helper',
            is_editable_order: false,
            members: b.members || 1,
            days: b.days || 1,
            mobile: b.mobile
        }));

        const rentalBookings = JSON.parse(localStorage.getItem('civilworks_rental_bookings') || '[]')
            .filter((b: any) => currentUserId ? ((b.user_id && b.user_id == currentUserId) || (b.userId && b.userId == currentUserId)) : false)
            .map((b: any) => ({
            id: b.bookingId || b.id || ('RENT-' + Math.floor(1000 + Math.random() * 9000)),
            rawId: b.id,
            orderNo: b.bookingId || b.id,
            serviceName: b.rentalName || b.serviceName || 'Heavy Machinery Rental',
            items: [{ product: { name: b.rentalName || b.serviceName || 'Machinery' }, quantity: 1, rental_duration: b.days || 1, price: b.totalAmount || b.finalAmount }],
            services: [],
            total: Number(b.finalAmount || b.totalAmount || b.total || 0),
            status: b.bookingStatus || b.status || 'Confirmed',
            date: new Date(b.bookedAt || b.date || Date.now()),
            paymentMethod: b.paymentMethod || 'Online / Pay on Site',
            main_category_name: b.main_category_name || 'Construction',
            main_category_id: b.main_category_id || 1,
            type: 'rental',
            is_editable_order: false,
            days: b.days || 1,
            mobile: b.mobile
        }));

        // Merge and deduplicate by unique id
        const map = new Map<string, any>();
        [...apiOrders, ...localProductOrders, ...helperBookings, ...rentalBookings].forEach(item => {
            const key = String(item.id || item.orderNo || item.rawId);
            if (!map.has(key)) {
                map.set(key, item);
            }
        });

        this.allOrders = Array.from(map.values()).sort((a, b) => {
            const timeA = new Date(a.date).getTime() || 0;
            const timeB = new Date(b.date).getTime() || 0;
            return timeB - timeA;
        });

        this.segregateOrders();
        this.loading = false;
    }

    segregateOrders() {
        // Tab 1: Products
        this.productOrders = this.allOrders.filter(o => o.type === 'product');

        // Tab 2: Services
        this.serviceOrders = this.allOrders.filter(o => o.type === 'service' || o.type === 'helper');

        // Tab 3: Rentals
        this.rentalOrders = this.allOrders.filter(o => o.type === 'rental');
    }

    // ── Gated Actions: Communication Groups & Order Editing ──

    isOrderCompleted(order: any): boolean {
        if (!order) return false;
        const st = String(order.status || order.order_status || '').trim().toLowerCase();
        if (st === 'delivered' || st === 'completed' || st === 'closed' || st === 'finished') {
            return true;
        }
        const svcs = (order.services || []).filter((s: any) => s.service_status !== 'removed');
        if (svcs.length > 0 && svcs.every((s: any) => String(s.service_status || '').trim().toLowerCase() === 'completed')) {
            return true;
        }
        return false;
    }

    openProjectChat(order: any) {
        if (!order.is_editable_order) {
            console.warn('Chat only available for editable service orders');
            return;
        }
        this.chatInitialOrderId = order.orderNo || order.id || order.rawId;
        this.showChatPanel = true;
    }

    closeChatPanel() {
        this.showChatPanel = false;
        this.chatInitialOrderId = null;
    }

    openEditOrderModal(order: any) {
        if (!order || this.isOrderCompleted(order)) return;
        this.editingOrder = order;
        this.showEditModal = true;
    }

    toggleEditOrder(order: any) {
        if (this.isOrderCompleted(order)) {
            order.isEditing = false;
            return;
        }
        order.isEditing = !order.isEditing;
    }

    goToAddService(order: any) {
        if (!order || this.isOrderCompleted(order)) return;
        this.openEditOrderModal(order);
    }

    openEditOrder(order: any) {
        if (!order) return;
        const targetId = order.order_id || order.orderNo || order.id;
        const matched = this.allOrders.find((o: any) => o.id == targetId || o.orderNo == targetId);
        if (matched) {
            this.openEditOrderModal(matched);
        } else {
            this.orderService.getOrderDetails(targetId).subscribe({
                next: (details) => this.openEditOrderModal(details),
                error: () => this.openEditOrderModal(order)
            });
        }
    }

    onOrderUpdatedFromModal(updatedData: any) {
        this.loadOrders();
    }

    openOrderDetails(order: any) {
        this.selectedOrder = order;
        this.showDetailsModal = true;
    }

    closeOrderDetails() {
        this.showDetailsModal = false;
        this.selectedOrder = null;
    }

    handleRefresh(event: any) {
        this.loadOrders();
        setTimeout(() => {
            event.target.complete();
        }, 800);
    }

    getStatusClass(status: string): string {
        const s = (status || '').toLowerCase();
        if (s.includes('delivered') || s.includes('confirmed') || s.includes('booked') || s.includes('accepted')) {
            return 'status-delivered';
        }
        if (s.includes('ship') || s.includes('dispatch') || s.includes('transit')) {
            return 'status-shipping';
        }
        if (s.includes('pack') || s.includes('process') || s.includes('pending')) {
            return 'status-pending';
        }
        if (s.includes('cancel') || s.includes('reject')) {
            return 'status-cancelled';
        }
        return 'status-pending';
    }

    getStatusIcon(status: string): string {
        const s = (status || '').toLowerCase();
        if (s.includes('delivered') || s.includes('confirmed') || s.includes('booked') || s.includes('accepted')) {
            return 'checkmark-circle';
        }
        if (s.includes('ship') || s.includes('transit')) {
            return 'airplane-outline';
        }
        if (s.includes('pack') || s.includes('process')) {
            return 'cube-outline';
        }
        if (s.includes('cancel') || s.includes('reject')) {
            return 'close-circle-outline';
        }
        return 'time-outline';
    }

    getProductImage(product: any): string {
        if (!product) return 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=500&q=80';
        if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
            return product.image;
        }
        return 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=500&q=80';
    }

    getItemImage(item: any): string {
        const raw = item?.image || item?.product?.image || item?.product_image || item?.thumbnail || '';
        if (!raw) {
            return 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=500&q=80';
        }
        return this.formatImageUrl(raw);
    }

    onThumbError(event: any) {
        if (event && event.target) {
            event.target.src = 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=500&q=80';
        }
    }

    getItemTotal(item: any, order?: any): number {
        if (item?.total_price && Number(item.total_price) > 0) {
            return Number(item.total_price);
        }
        if (item?.subtotal && Number(item.subtotal) > 0) {
            return Number(item.subtotal);
        }
        if (item?.price && Number(item.price) > 0) {
            return Number(item.price) * Number(item.quantity || 1);
        }
        if (order?.total && Number(order.total) > 0) {
            return Number(order.total);
        }
        return 0;
    }

    isStepCompleted(status: string, step: string): boolean {
        const s = (status || '').toLowerCase().trim();
        const steps = ['placed', 'confirmed', 'shipped', 'delivered'];
        
        let currentIdx = 0;
        if (['delivered', 'completed'].includes(s)) {
            currentIdx = 3;
        } else if (['shipped', 'shipping', 'dispatched', 'in_transit', 'out_for_delivery'].includes(s)) {
            currentIdx = 2;
        } else if (['confirmed', 'processing', 'packing', 'accepted'].includes(s)) {
            currentIdx = 1;
        } else {
            currentIdx = 0;
        }

        const targetIdx = steps.indexOf(step);
        return currentIdx >= targetIdx;
    }

    isCurrentStep(status: string, step: string): boolean {
        const s = (status || '').toLowerCase().trim();
        if (step === 'delivered' && ['delivered', 'completed'].includes(s)) return true;
        if (step === 'shipped' && ['shipped', 'shipping', 'dispatched', 'in_transit', 'out_for_delivery'].includes(s)) return true;
        if (step === 'confirmed' && ['confirmed', 'processing', 'packing', 'accepted'].includes(s)) return true;
        if (step === 'placed' && (!s || ['placed', 'pending'].includes(s))) return true;
        return false;
    }

    getSectorDotClass(sectorName: string): string {
        const name = (sectorName || '').toLowerCase();
        if (name.includes('real')) return 'dot-real-estate';
        if (name.includes('interior')) return 'dot-interiors';
        if (name.includes('rental')) return 'dot-rental';
        return 'dot-construction';
    }

    async reorderItems(order: any) {
        if (!order || !order.items || order.items.length === 0) {
            const toast = await this.toastCtrl.create({
                message: 'No items found in this order to reorder.',
                duration: 2500,
                color: 'warning',
                position: 'top'
            });
            toast.present();
            return;
        }

        const loading = await this.loadingCtrl.create({
            message: 'Adding items to your cart...',
            spinner: 'crescent',
            duration: 3000
        });
        await loading.present();

        let addedCount = 0;
        for (const item of order.items) {
            const pId = item.product_id || item.product?.id || item.id;
            const qty = item.quantity || 1;
            if (pId) {
                try {
                    await this.cartService.addToCart(pId, qty).toPromise();
                    addedCount++;
                } catch (e) {
                    console.warn('Error reordering item:', item, e);
                }
            }
        }

        await loading.dismiss();

        const toast = await this.toastCtrl.create({
            message: addedCount > 0 
                ? `🛒 Added ${addedCount} item(s) to your cart!` 
                : 'Items added to cart. Check your cart to proceed to checkout.',
            duration: 3500,
            color: 'success',
            position: 'top',
            buttons: [
                {
                    text: 'View Cart',
                    role: 'info',
                    handler: () => {
                        this.router.navigate(['/tabs/cart']);
                    }
                }
            ]
        });
        toast.present();
    }

    goBack() {
        if (window.history.length > 1) {
            this.location.back();
        } else {
            this.router.navigate(['/tabs/home']);
        }
    }

    async removeService(order: any, service: any, event: Event) {
        event.stopPropagation();
        const sName = service.subcategory_name || service.name || 'this service';
        const vName = service.vendor_name || 'the vendor';
        const orderNo = order.orderNo || order.id;

        const alert = await this.alertCtrl.create({
            header: 'Delete Service / Vendor',
            subHeader: `Project #${orderNo}`,
            message: `Are you sure you want to remove "${sName}" (${vName}) from this project?`,
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel'
                },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: () => {
                        this.executeRemoveService(order, service);
                    }
                }
            ]
        });
        await alert.present();
    }

    private executeRemoveService(order: any, service: any) {
        const orderId = order.rawId || order.id;
        const serviceId = service.id;

        this.orderService.removeServiceFromOrder(orderId, serviceId).subscribe({
            next: async () => {
                order.services = (order.services || []).filter((s: any) => s.id !== serviceId);
                order.total = order.services.reduce((sum: number, s: any) => sum + Number(s.price || 0), 0);
                const toast = await this.toastCtrl.create({
                    message: `🗑️ Removed "${service.subcategory_name || 'Service'}" (${service.vendor_name || 'Vendor'}) from Project #${order.orderNo || order.id}.`,
                    duration: 3000,
                    color: 'success',
                    position: 'top'
                });
                toast.present();
            },
            error: async (err: any) => {
                console.error('Failed to remove service:', err);
                const toast = await this.toastCtrl.create({
                    message: err?.error?.message || 'Could not delete service. Please try again.',
                    duration: 3500,
                    color: 'danger',
                    position: 'top'
                });
                toast.present();
            }
        });
    }

    openReplaceVendorModal(order: any, service: any, event: Event) {
        event.stopPropagation();
        this.replacingOrder = order;
        this.replacingService = service;
        this.showVendorPickerModal = true;
        this.loadingReplaceVendors = true;
        this.replaceVendorsList = [];

        const subId = service.subcategory_id;
        this.productService.getVendors(subId).subscribe({
            next: (vendors) => {
                // If a vendor was selected for one service then he shouldn't be displayed in same service!
                // Filter out current vendor (service.vendor_id) AND any vendor already assigned to this subcategory in this order
                const assignedVendorIds = (order.services || [])
                    .filter((s: any) => Number(s.subcategory_id) === Number(subId) && s.service_status !== 'removed')
                    .map((s: any) => Number(s.vendor_id));

                this.replaceVendorsList = (vendors || []).filter(
                    (v: any) => !assignedVendorIds.includes(Number(v.id)) && Number(v.id) !== Number(service.vendor_id)
                );
                this.loadingReplaceVendors = false;
            },
            error: () => {
                this.loadingReplaceVendors = false;
            }
        });
    }

    closeReplaceVendorModal() {
        this.showVendorPickerModal = false;
        this.replacingOrder = null;
        this.replacingService = null;
        this.replaceVendorsList = [];
        this.loadingReplaceVendors = false;
    }

    async selectNewVendorForService(newVendor: any) {
        if (!this.replacingOrder || !this.replacingService) return;
        const orderId = this.replacingOrder.rawId || this.replacingOrder.id;
        const serviceId = this.replacingService.id;

        const loading = await this.loadingCtrl.create({
            message: `Assigning ${newVendor.name}...`,
            spinner: 'crescent'
        });
        await loading.present();

        this.orderService.reselectVendor(orderId, serviceId, { vendor_id: Number(newVendor.id) }).subscribe({
            next: async () => {
                await loading.dismiss();
                this.replacingService.vendor_name = newVendor.name;
                this.replacingService.vendor_mobile = newVendor.mobile;
                this.replacingService.vendor_status = 'pending';
                const sName = this.replacingService.subcategory_name || 'Service';
                this.closeReplaceVendorModal();

                const toast = await this.toastCtrl.create({
                    message: `✅ Vendor replaced with "${newVendor.name}" for ${sName}.`,
                    duration: 3500,
                    color: 'success',
                    position: 'top'
                });
                toast.present();
            },
            error: async (err: any) => {
                await loading.dismiss();
                const toast = await this.toastCtrl.create({
                    message: err?.error?.message || 'Could not change vendor. Please try again.',
                    duration: 3500,
                    color: 'danger',
                    position: 'top'
                });
                toast.present();
            }
        });
    }

    formatImageUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('assets/')) {
            return url;
        }
        return `${environment.uploadUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }
}
