import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { SOPService, OrderSOPData, SOPServiceItem, SOPSubtask, SubtaskProofImage } from '../../services/sop.service';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-sop',
    templateUrl: './sop.page.html',
    styleUrls: ['./sop.page.scss'],
})
export class SOPPage implements OnInit, OnDestroy {
    orders: any[] = [];
    selectedOrderId: number | string | null = null;
    sopData: OrderSOPData | null = null;
    selectedService: SOPServiceItem | null = null;
    loading = true;

    // Segmented Toggle: 'sop' | 'chat'
    activeTab: 'sop' | 'chat' = 'sop';
    showChatPanel = false;

    // Current User
    currentUser: any = null;
    customerDisplayName = 'Customer';
    customerOrgName = '';

    // Add Sub Task Modal
    showAddSubtaskModal = false;
    targetServiceForSubtask: SOPServiceItem | null = null;
    newSubtask: {
        title: string;
        description: string;
        start_date: string;
        end_date: string;
        next_order_service_id: number | null;
    } = {
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        next_order_service_id: null
    };
    isSavingSubtask = false;

    // View Subtask Details Modal
    showSubtaskDetailsModal = false;
    selectedSubtask: SOPSubtask | null = null;
    selectedSubtaskService: SOPServiceItem | null = null;

    // Review Completion Request Modal
    showCompletionReviewModal = false;
    activeCompletionRequest: any = null;
    activeReviewService: SOPServiceItem | null = null;
    isSubmittingReview = false;
    rejectionReason = '';
    showRejectionInput = false;

    // Lightbox image preview
    previewImageUrl: string | null = null;

    // Drag-and-drop state
    draggedServiceIndex: number | null = null;

    private subs: Subscription = new Subscription();

    constructor(
        private sopService: SOPService,
        private authService: AuthService,
        private chatService: ChatService,
        private toastCtrl: ToastController,
        private alertCtrl: AlertController,
        private loadingCtrl: LoadingController,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadUserInfo();

        this.route.params.subscribe(params => {
            if (params['orderId']) {
                this.selectedOrderId = params['orderId'];
            }
            this.loadInitialData();
        });

        this.listenToSocketUpdates();
    }

    ngOnDestroy() {
        this.subs.unsubscribe();
    }

    loadUserInfo() {
        this.currentUser = this.authService.getUser();
        if (!this.currentUser) {
            const raw = localStorage.getItem('civilworks_user') || localStorage.getItem('civilworks_vendor_user');
            if (raw) {
                try { this.currentUser = JSON.parse(raw); } catch (e) { }
            }
        }
        if (this.currentUser) {
            this.customerDisplayName = this.currentUser.name || this.currentUser.username || 'Customer';
            this.customerOrgName = this.currentUser.organization || this.currentUser.name || '';
        }
    }

    loadInitialData() {
        this.loading = true;
        this.sopService.getEligibleOrders().subscribe({
            next: (orders) => {
                this.orders = orders || [];
                if (this.orders.length > 0) {
                    if (!this.selectedOrderId) {
                        this.selectedOrderId = this.orders[0].order_no || this.orders[0].id;
                    } else {
                        // verify selected order is in list or fallback
                        const exists = this.orders.some(o => o.order_no == this.selectedOrderId || o.id == this.selectedOrderId);
                        if (!exists) {
                            this.selectedOrderId = this.orders[0].order_no || this.orders[0].id;
                        }
                    }
                    this.loadSOPDetails(this.selectedOrderId);
                } else {
                    this.loading = false;
                }
            },
            error: (err) => {
                console.error('Failed to load eligible SOP orders:', err);
                this.loading = false;
            }
        });
    }

    loadSOPDetails(orderId: number | string | null) {
        if (!orderId) return;
        this.loading = true;
        this.sopService.getOrderSOP(orderId).subscribe({
            next: (data) => {
                this.sopData = data;
                if (this.sopData?.customer_name) {
                    this.customerDisplayName = this.sopData.customer_name;
                }
                if (this.sopData?.customer_organization) {
                    this.customerOrgName = this.sopData.customer_organization;
                }

                // If currently selected service is in new data, re-link it, else select first in_progress or first service
                if (this.sopData.services && this.sopData.services.length > 0) {
                    if (this.selectedService) {
                        const found = this.sopData.services.find(s => s.id === this.selectedService!.id);
                        this.selectedService = found || this.sopData.services[0];
                    } else if (typeof window !== 'undefined' && window.innerWidth > 960) {
                        const inProg = this.sopData.services.find(s => s.service_status === 'in_progress');
                        this.selectedService = inProg || this.sopData.services[0];
                    } else {
                        this.selectedService = null;
                    }
                } else {
                    this.selectedService = null;
                }

                // If subtask modal is open, re-link selectedSubtask to get latest proof_images
                if (this.selectedSubtask) {
                    for (const s of this.sopData.services || []) {
                        const foundSt = (s.subtasks || []).find(st => st.id === this.selectedSubtask!.id);
                        if (foundSt) {
                            this.selectedSubtask = foundSt;
                            break;
                        }
                    }
                }

                this.loading = false;
            },
            error: async (err) => {
                console.error('Failed to load SOP details for order:', err);
                this.loading = false;
                const toast = await this.toastCtrl.create({
                    message: err?.error?.message || 'Failed to load order SOP sequence.',
                    duration: 3000,
                    color: 'danger',
                    position: 'top'
                });
                toast.present();
            }
        });
    }

    onOrderChange(newOrderId: any) {
        this.selectedOrderId = newOrderId;
        this.selectedService = null;
        this.loadSOPDetails(this.selectedOrderId);
    }

    // Toggle between SOP and Chat
    setTab(tab: 'sop' | 'chat') {
        this.activeTab = tab;
        if (tab === 'chat') {
            this.showChatPanel = true;
        } else {
            this.showChatPanel = false;
        }
    }

    onChatClosed() {
        this.showChatPanel = false;
        this.activeTab = 'sop';
    }

    selectService(service: SOPServiceItem) {
        if (this.selectedService?.id === service.id && typeof window !== 'undefined' && window.innerWidth <= 960) {
            this.selectedService = null;
        } else {
            this.selectedService = service;
        }
    }

    get isOrderClosed(): boolean {
        if (this.sopData) {
            const s = this.sopData;
            if (s.order_status === 'delivered' || s.order_status === 'completed' || (s as any).status === 'completed') {
                return true;
            }
            const svcs = (s.services || []).filter((item: any) => item.service_status !== 'removed');
            if (svcs.length > 0 && svcs.every((item: any) => item.service_status === 'completed')) {
                return true;
            }
        }
        if (this.orders && this.selectedOrderId) {
            const ord = this.orders.find(o => o.order_no == this.selectedOrderId || o.id == this.selectedOrderId);
            if (ord) {
                const st = (ord.status || ord.order_status || '').toLowerCase();
                if (st === 'completed' || st === 'delivered' || st === 'closed') {
                    return true;
                }
            }
        }
        return false;
    }

    // Drag and Drop Service Reordering
    onDragStart(index: number, event?: DragEvent) {
        if (this.isOrderClosed) return;
        if (event) {
            event.stopPropagation();
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', String(index));
            }
        }
        this.draggedServiceIndex = index;
    }

    onDragOver(event: DragEvent) {
        if (this.isOrderClosed) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    openDatePicker(event: Event) {
        if (this.isOrderClosed) return;
        event.stopPropagation();
        const current = event.currentTarget as HTMLElement;
        let input: HTMLInputElement | null = null;
        if (current instanceof HTMLInputElement) {
            input = current;
        } else {
            input = current.querySelector('input[type="date"]');
        }
        if (input) {
            if (typeof (input as any).showPicker === 'function') {
                try {
                    (input as any).showPicker();
                } catch {
                    input.focus();
                }
            } else {
                input.focus();
            }
        }
    }

    validateReorderSequence(services: any[], fromIndex: number, toIndex: number): { valid: boolean; error?: string } {
        // Free sequence reordering without date restrictions
        return { valid: true };
    }

    validateChronologicalDates(services: any[], serviceId: number, newStartDate: string, newEndDate?: string): { valid: boolean; error?: string } {
        // Services can run simultaneously; only validate individual service start_date <= end_date
        if (newStartDate && newEndDate) {
            const newStart = new Date(newStartDate).getTime();
            const newEnd = new Date(newEndDate).getTime();
            if (newStart > newEnd) {
                return { valid: false, error: 'Start date cannot be after End date.' };
            }
        }
        return { valid: true };
    }

    async onServiceDateChange(service: SOPServiceItem, field: 'start_date' | 'end_date', event: any) {
        if (this.isOrderClosed || !this.sopData) return;
        const newVal = event.target?.value;
        if (!newVal) return;
        const originalStart = service.start_date;
        const originalEnd = service.end_date;

        let proposedStart = field === 'start_date' ? newVal : (service.start_date ? this.formatDateForInput(service.start_date) : '');
        let proposedEnd = field === 'end_date' ? newVal : (service.end_date ? this.formatDateForInput(service.end_date) : '');

        const payload: any = {};
        if (field === 'start_date') {
            payload.start_date = newVal;
            if (proposedEnd && new Date(newVal).getTime() > new Date(proposedEnd).getTime()) {
                payload.end_date = newVal;
                proposedEnd = newVal;
            }
        } else if (field === 'end_date') {
            payload.end_date = newVal;
            if (proposedStart && new Date(newVal).getTime() < new Date(proposedStart).getTime()) {
                payload.start_date = newVal;
                proposedStart = newVal;
            }
        }

        this.sopService.updateService(service.id, payload).subscribe({
            next: async () => {
                if (payload.start_date !== undefined) service.start_date = payload.start_date;
                if (payload.end_date !== undefined) service.end_date = payload.end_date;
                const toast = await this.toastCtrl.create({
                    message: '✅ Service date updated successfully.',
                    duration: 2000,
                    color: 'success',
                    position: 'top'
                });
                await toast.present();
            },
            error: async (err) => {
                event.target.value = field === 'start_date' ? this.formatDateForInput(originalStart || '') : this.formatDateForInput(originalEnd || '');
                const toast = await this.toastCtrl.create({
                    message: err?.error?.message || 'Failed to update service date.',
                    duration: 3500,
                    color: 'danger',
                    position: 'top'
                });
                await toast.present();
            }
        });
    }

    async onDrop(targetIndex: number, event?: DragEvent) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (this.isOrderClosed || this.draggedServiceIndex === null || this.draggedServiceIndex === targetIndex || !this.sopData) {
            this.draggedServiceIndex = null;
            return;
        }

        const services = [...this.sopData.services];
        const [movedItem] = services.splice(this.draggedServiceIndex, 1);
        services.splice(targetIndex, 0, movedItem);

        // Reassign sequence orders
        const updatedSequence = services.map((s, idx) => ({
            id: s.id,
            sequence_order: idx + 1
        }));

        const originalServices = [...this.sopData.services];
        // Optimistic UI update
        this.sopData.services = services.map((s, idx) => ({ ...s, sequence_order: idx + 1 }));
        this.draggedServiceIndex = null;

        const orderTarget = this.sopData.id || this.sopData.order_no;
        this.sopService.reorderServices(orderTarget, updatedSequence).subscribe({
            next: async (res: any) => {
                if (res && res.services && Array.isArray(res.services)) {
                    if (this.sopData) {
                        this.sopData.services = res.services;
                    }
                }
                const toast = await this.toastCtrl.create({
                    message: '✅ Service sequence updated successfully.',
                    duration: 2000,
                    color: 'success',
                    position: 'top'
                });
                toast.present();
            },
            error: async (err) => {
                console.error('Reorder failed:', err);
                if (this.sopData) this.sopData.services = originalServices;
                const toast = await this.toastCtrl.create({
                    message: err?.error?.message || 'Could not save new sequence order.',
                    duration: 3000,
                    color: 'danger',
                    position: 'top'
                });
                toast.present();
            }
        });
    }

    getAvailableNextServices(): SOPServiceItem[] {
        if (!this.sopData?.services || !this.targetServiceForSubtask) {
            return [];
        }
        return this.sopData.services.filter(
            (s: SOPServiceItem) => s.id !== this.targetServiceForSubtask?.id && s.service_status !== 'removed'
        );
    }

    // Add Subtask Modal Methods
    openAddSubtask(service?: SOPServiceItem, event?: Event) {
        if (this.isOrderClosed) return;
        if (event) event.stopPropagation();
        this.targetServiceForSubtask = service || this.selectedService;
        if (!this.targetServiceForSubtask) return;

        this.newSubtask = {
            title: '',
            description: '',
            start_date: this.targetServiceForSubtask.start_date ? this.formatDateForInput(this.targetServiceForSubtask.start_date) : '',
            end_date: this.targetServiceForSubtask.end_date ? this.formatDateForInput(this.targetServiceForSubtask.end_date) : '',
            next_order_service_id: null
        };
        this.showAddSubtaskModal = true;
    }

    closeAddSubtaskModal() {
        this.showAddSubtaskModal = false;
        this.targetServiceForSubtask = null;
        this.newSubtask = { title: '', description: '', start_date: '', end_date: '', next_order_service_id: null };
    }

    async saveSubtask() {
        if (this.isOrderClosed) return;
        if (!this.newSubtask.title.trim()) {
            const toast = await this.toastCtrl.create({
                message: 'Please enter a subtask title.',
                duration: 2500,
                color: 'warning',
                position: 'top'
            });
            toast.present();
            return;
        }

        if (!this.targetServiceForSubtask) return;

        this.isSavingSubtask = true;
        this.sopService.createSubtask(this.targetServiceForSubtask.id, {
            title: this.newSubtask.title.trim(),
            description: this.newSubtask.description.trim() || undefined,
            start_date: this.newSubtask.start_date || undefined,
            end_date: this.newSubtask.end_date || undefined,
            next_order_service_id: this.newSubtask.next_order_service_id || null
        }).subscribe({
            next: async (created) => {
                this.isSavingSubtask = false;
                this.closeAddSubtaskModal();
                const toast = await this.toastCtrl.create({
                    message: `✅ Subtask "${created.title}" added successfully.`,
                    duration: 2500,
                    color: 'success',
                    position: 'top'
                });
                toast.present();
                this.loadSOPDetails(this.selectedOrderId);
            },
            error: async (err) => {
                this.isSavingSubtask = false;
                console.error('Failed to create subtask:', err);
                const toast = await this.toastCtrl.create({
                    message: err?.error?.message || 'Could not save subtask.',
                    duration: 3000,
                    color: 'danger',
                    position: 'top'
                });
                toast.present();
            }
        });
    }

    selectedProofImageUrl: string | null = null;

    // View Subtask Details Modal
    openSubtaskDetails(subtask: SOPSubtask, service?: SOPServiceItem, event?: Event) {
        if (event) event.stopPropagation();
        this.selectedSubtask = subtask;
        this.selectedSubtaskService = service || this.selectedService;
        this.selectedProofImageUrl = this.getDefaultSubtaskProofUrl(subtask);
        this.showSubtaskDetailsModal = true;
    }

    closeSubtaskDetailsModal() {
        this.showSubtaskDetailsModal = false;
        this.selectedSubtask = null;
        this.selectedSubtaskService = null;
        this.selectedProofImageUrl = null;
    }

    selectSubtaskProofImage(imageUrl: string, event?: Event) {
        if (event) event.stopPropagation();
        this.selectedProofImageUrl = imageUrl;
    }

    getDefaultSubtaskProofUrl(st?: SOPSubtask | null): string {
        const target = st || this.selectedSubtask;
        if (!target) return '';
        if (target.proof_images && target.proof_images.length > 0) {
            return target.proof_images[0].image_url;
        }
        if (target.proof_image_url) return target.proof_image_url;
        return '';
    }

    getActiveSubtaskProofUrl(): string {
        if (this.selectedProofImageUrl) {
            return this.selectedProofImageUrl;
        }
        return this.getDefaultSubtaskProofUrl();
    }

    // Completion Review Modal Methods
    openCompletionReview(service: SOPServiceItem, event?: Event) {
        if (event) event.stopPropagation();
        if (!service.completion_request) {
            return;
        }
        this.activeReviewService = service;
        this.activeCompletionRequest = service.completion_request;
        this.showRejectionInput = false;
        this.rejectionReason = '';
        this.showCompletionReviewModal = true;
    }

    closeCompletionReviewModal() {
        this.showCompletionReviewModal = false;
        this.activeReviewService = null;
        this.activeCompletionRequest = null;
        this.showRejectionInput = false;
        this.rejectionReason = '';
    }

    async approveCompletion() {
        if (!this.activeCompletionRequest) return;
        this.isSubmittingReview = true;

        this.sopService.respondCompletionRequest(this.activeCompletionRequest.id, 'approve').subscribe({
            next: async (res) => {
                this.isSubmittingReview = false;
                this.closeCompletionReviewModal();
                const toast = await this.toastCtrl.create({
                    message: '🎉 Service marked as Completed & approved!',
                    duration: 3500,
                    color: 'success',
                    position: 'top'
                });
                toast.present();
                this.loadSOPDetails(this.selectedOrderId);
            },
            error: async (err) => {
                this.isSubmittingReview = false;
                console.error('Failed to approve completion:', err);
                const toast = await this.toastCtrl.create({
                    message: err?.error?.message || 'Approval failed. Please try again.',
                    duration: 3000,
                    color: 'danger',
                    position: 'top'
                });
                toast.present();
            }
        });
    }

    async rejectCompletion() {
        if (!this.activeCompletionRequest) return;

        if (!this.showRejectionInput) {
            this.showRejectionInput = true;
            return;
        }

        if (!this.rejectionReason.trim()) {
            const toast = await this.toastCtrl.create({
                message: 'Please provide a reason for requesting corrections.',
                duration: 2500,
                color: 'warning',
                position: 'top'
            });
            toast.present();
            return;
        }

        this.isSubmittingReview = true;
        this.sopService.respondCompletionRequest(this.activeCompletionRequest.id, 'reject', this.rejectionReason.trim()).subscribe({
            next: async (res) => {
                this.isSubmittingReview = false;
                this.closeCompletionReviewModal();
                const toast = await this.toastCtrl.create({
                    message: 'Notice sent to vendor: corrections requested.',
                    duration: 3500,
                    color: 'warning',
                    position: 'top'
                });
                toast.present();
                this.loadSOPDetails(this.selectedOrderId);
            },
            error: async (err) => {
                this.isSubmittingReview = false;
                console.error('Failed to reject completion:', err);
                const toast = await this.toastCtrl.create({
                    message: err?.error?.message || 'Failed to submit response.',
                    duration: 3000,
                    color: 'danger',
                    position: 'top'
                });
                toast.present();
            }
        });
    }

    // Helper formatting methods

    get completedOrderDate(): string | null {
        if (!this.sopData) return null;
        const ord = this.orders.find(o => o.order_no == this.selectedOrderId || o.id == this.selectedOrderId);
        if (ord && (ord.completed_at || ord.delivered_at || ord.updated_at)) {
            return ord.completed_at || ord.delivered_at || ord.updated_at;
        }
        const svcs = (this.sopData.services || []);
        const endDates = svcs.map((s: any) => s.end_date).filter(Boolean);
        if (endDates.length > 0) {
            endDates.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
            return endDates[0];
        }
        return this.sopData.created_at || null;
    }

    formatDateDisplay(dateStr?: string | null): string {
        if (!dateStr) return 'Set Date';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Set Date';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    private draggedSubtask: { serviceId: number; index: number } | null = null;

    onSubtaskDragStart(serviceId: number, index: number, event: DragEvent) {
        if (this.isOrderClosed) return;
        this.draggedSubtask = { serviceId, index };
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', JSON.stringify({ serviceId, index }));
        }
    }

    onSubtaskDragOver(event: DragEvent) {
        if (this.isOrderClosed) return;
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    async onSubtaskDrop(service: SOPServiceItem, targetIndex: number, event: DragEvent) {
        if (this.isOrderClosed) return;
        event.preventDefault();
        event.stopPropagation();
        if (!this.draggedSubtask || this.draggedSubtask.serviceId !== service.id) {
            this.draggedSubtask = null;
            return;
        }
        const fromIndex = this.draggedSubtask.index;
        this.draggedSubtask = null;
        if (fromIndex === targetIndex || !service.subtasks) return;

        const subtasks = [...service.subtasks];
        const [moved] = subtasks.splice(fromIndex, 1);
        subtasks.splice(targetIndex, 0, moved);

        subtasks.forEach((st, idx) => {
            st.sequence_order = idx + 1;
        });
        service.subtasks = subtasks;

        this.sopService.reorderSubtasks(service.id, subtasks.map((st, idx) => ({ id: st.id, sequence_order: idx + 1 }))).subscribe({
            next: async () => {
                const toast = await this.toastCtrl.create({
                    message: `✅ Subtask sequence updated.`,
                    duration: 2000,
                    color: 'success',
                    position: 'top'
                });
                toast.present();
            },
            error: async (err) => {
                console.error('Failed to save subtask sequence:', err);
                this.loadSOPDetails(this.selectedOrderId);
            }
        });
    }

    async onSubtaskDateChange(service: SOPServiceItem, subtask: SOPSubtask, field: 'start_date' | 'end_date', event: any) {
        if (this.isOrderClosed) return;
        const newVal = event.target?.value;
        if (!newVal) return;
        const originalStart = subtask.start_date;
        const originalEnd = subtask.end_date;

        let proposedStart = field === 'start_date' ? newVal : (subtask.start_date ? this.formatDateForInput(subtask.start_date) : '');
        let proposedEnd = field === 'end_date' ? newVal : (subtask.end_date ? this.formatDateForInput(subtask.end_date) : '');

        const payload: any = {};
        if (field === 'start_date') {
            payload.start_date = newVal;
            if (proposedEnd && new Date(newVal).getTime() > new Date(proposedEnd).getTime()) {
                payload.end_date = newVal;
                proposedEnd = newVal;
            }
        } else if (field === 'end_date') {
            payload.end_date = newVal;
            if (proposedStart && new Date(newVal).getTime() < new Date(proposedStart).getTime()) {
                payload.start_date = newVal;
                proposedStart = newVal;
            }
        }

        this.sopService.updateSubtask(subtask.id, payload).subscribe({
            next: async () => {
                if (payload.start_date !== undefined) subtask.start_date = payload.start_date;
                if (payload.end_date !== undefined) subtask.end_date = payload.end_date;
                const toast = await this.toastCtrl.create({
                    message: `✅ Subtask date updated.`,
                    duration: 2000,
                    color: 'success',
                    position: 'top'
                });
                toast.present();
            },
            error: async (err) => {
                console.error('Failed to update subtask date:', err);
                event.target.value = field === 'start_date' ? this.formatDateForInput(originalStart) : this.formatDateForInput(originalEnd);
                const toast = await this.toastCtrl.create({
                    message: err?.error?.message || 'Failed to update subtask date.',
                    duration: 3000,
                    color: 'danger',
                    position: 'top'
                });
                toast.present();
            }
        });
    }

    hasSubtaskProof(): boolean {
        if (!this.selectedSubtask) return false;
        if (this.selectedSubtask.proof_image_url) return true;
        return !!(this.selectedSubtask.proof_images && this.selectedSubtask.proof_images.length > 0);
    }

    getSubtaskProofImages(): SubtaskProofImage[] {
        if (!this.selectedSubtask) return [];
        if (this.selectedSubtask.proof_images && this.selectedSubtask.proof_images.length > 0) {
            return this.selectedSubtask.proof_images;
        }
        if (this.selectedSubtask.proof_image_url) {
            return [{
                id: 0,
                subtask_id: this.selectedSubtask.id,
                image_url: this.selectedSubtask.proof_image_url,
                original_name: 'Proof Image'
            }];
        }
        return [];
    }

    formatImageUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
            return url;
        }
        const clean = url.startsWith('/') ? url : `/${url}`;
        const baseOrigin = environment.uploadUrl.replace(/\/uploads\/?$/, '');
        if (clean.startsWith('/uploads/')) {
            return `${baseOrigin}${clean}`;
        }
        return `${environment.uploadUrl}${clean}`;
    }

    formatDateForInput(dateStr?: string | null): string {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    }

    getProgressColor(status: string, percent: number): string {
        if (status === 'completed' || percent === 100) return '#10b981'; // Green
        if (status === 'in_progress' || percent > 0) return '#f59e0b'; // Orange
        return '#cbd5e1'; // Gray
    }

    getSubtaskDotClass(status: string): string {
        if (status === 'completed') return 'dot-completed';
        if (status === 'in_progress') return 'dot-in-progress';
        return 'dot-pending';
    }

    getSubtaskBadgeClass(status: string): string {
        if (status === 'completed') return 'badge-completed';
        if (status === 'in_progress') return 'badge-in-progress';
        return 'badge-pending';
    }

    getStatusText(status: string): string {
        if (status === 'completed') return 'Completed';
        if (status === 'in_progress') return 'In Process';
        return 'Pending';
    }

    listenToSocketUpdates() {
        const socket = this.chatService.getSocket();
        if (socket) {
            socket.on('sop_sequence_updated', () => this.loadSOPDetails(this.selectedOrderId));
            socket.on('sop_service_updated', () => this.loadSOPDetails(this.selectedOrderId));
            socket.on('sop_subtask_created', () => this.loadSOPDetails(this.selectedOrderId));
            socket.on('sop_subtask_updated', () => this.loadSOPDetails(this.selectedOrderId));
            socket.on('sop_subtask_completed', () => this.loadSOPDetails(this.selectedOrderId));
            socket.on('sop_proof_uploaded', () => this.loadSOPDetails(this.selectedOrderId));
            socket.on('sop_completion_requested', () => this.loadSOPDetails(this.selectedOrderId));
            socket.on('sop_completion_responded', () => this.loadSOPDetails(this.selectedOrderId));
        }
    }
}
