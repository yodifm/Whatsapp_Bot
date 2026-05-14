<?php

use App\Http\Controllers\BookingFormController;
use App\Http\Controllers\Backend\AnalyticsController;
use App\Http\Controllers\Backend\KioskController;
use App\Http\Controllers\Backend\LogisticController;
use App\Http\Controllers\Backend\LogisticStaffController;
use App\Http\Controllers\Backend\SalesController;
use App\Http\Controllers\Backend\AuthController;
use App\Http\Controllers\Backend\UserController;
use App\Http\Controllers\Backend\BookingController;
use App\Http\Controllers\Backend\BroadcastController;
use App\Http\Controllers\Backend\CustomerController;
use App\Http\Controllers\Backend\DashboardController;
use App\Http\Controllers\Backend\FaqController;
use App\Http\Controllers\Backend\FeedbackController;
use App\Http\Controllers\Backend\ReimbursementController;
use App\Http\Controllers\Backend\DiscountController;
use App\Http\Controllers\Backend\GalleryController;
use App\Http\Controllers\Backend\InvoiceController;
use App\Http\Controllers\Backend\NotificationController;
use App\Http\Controllers\Backend\OpAssetsController;
use App\Http\Controllers\Backend\PackageController;
use App\Http\Controllers\Backend\SettingController;
use App\Http\Controllers\Backend\TestAIController;
use App\Http\Controllers\WhatsAppController;
use Illuminate\Support\Facades\Route;

// WhatsApp webhook (public)
Route::get('/webhook/whatsapp',  [WhatsAppController::class, 'verify']);
Route::post('/webhook/whatsapp', [WhatsAppController::class, 'handle']);

// Public booking form
Route::get('/booking-form/packages', [BookingFormController::class, 'packages']);
Route::post('/booking-form',         [BookingFormController::class, 'store']);

// Public feedback form
Route::get('/studio-info',           [FeedbackController::class, 'studioInfo']);
Route::get('/booking-info/{id}',     [FeedbackController::class, 'bookingInfo']);
Route::post('/feedback',             [FeedbackController::class, 'store']);

// Public reimbursement form (staff submits, no auth needed)
Route::post('/reimbursement', [ReimbursementController::class, 'store']);

// Public staff logistic checklist (no auth needed — internal staff tool)
Route::get('/staff-checkin/items',            [LogisticStaffController::class, 'items']);
Route::get('/staff-checkin/active-checkout',  [LogisticStaffController::class, 'activeCheckout']);
Route::get('/staff-checkin/upcoming-bookings',[LogisticStaffController::class, 'upcomingBookings']);
Route::post('/staff-checkin',                 [LogisticStaffController::class, 'store']);

// Auth
Route::post('/login', [AuthController::class, 'login']);

// Protected
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user',    [AuthController::class, 'me']);

    // User management (admin only — enforced inside controller)
    Route::get('/users',           [UserController::class, 'index']);
    Route::post('/users',          [UserController::class, 'store']);
    Route::put('/users/{user}',    [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);

    Route::get('/dashboard/stats',         [DashboardController::class, 'stats']);
    Route::get('/customers',               [DashboardController::class, 'customers']);
    Route::get('/customers/{id}/messages', [DashboardController::class, 'messages']);

    Route::get('/settings',  [SettingController::class, 'index']);
    Route::post('/settings', [SettingController::class, 'update']);

    // Operational assets (booth types, printers, transports, staff ops)
    Route::get('/op-assets',  [OpAssetsController::class, 'index']);
    Route::post('/op-assets', [OpAssetsController::class, 'update']);

    Route::post('/test-ai', [TestAIController::class, 'chat']);

    // Packages
    Route::get('/packages',              [PackageController::class, 'index']);
    Route::post('/packages',             [PackageController::class, 'store']);
    Route::put('/packages/{package}',    [PackageController::class, 'update']);
    Route::delete('/packages/{package}', [PackageController::class, 'destroy']);

    // Customer actions
    Route::get('/customers/{customer}',             [CustomerController::class, 'show']);
    Route::patch('/customers/{customer}/status',    [CustomerController::class, 'updateStatus']);
    Route::patch('/customers/{customer}/toggle-ai', [CustomerController::class, 'toggleAI']);
    Route::post('/customers/{customer}/send',       [CustomerController::class, 'send']);

    // Analytics
    Route::get('/analytics', [AnalyticsController::class, 'index']);

    // Broadcast
    Route::post('/broadcast/preview', [BroadcastController::class, 'preview']);
    Route::post('/broadcast',         [BroadcastController::class, 'send']);

    // Notifications (polling)
    Route::get('/notifications', [NotificationController::class, 'poll']);

    // Bookings / Calendar
    Route::get('/bookings/booked-dates',          [BookingController::class, 'bookedDates']);
    Route::get('/bookings/form-submissions',              [BookingController::class, 'formSubmissions']);
    Route::patch('/bookings/{booking}/form-status',       [BookingController::class, 'updateFormStatus']);
    Route::patch('/bookings/{booking}/ops',               [BookingController::class, 'updateOps']);
    Route::post('/bookings/{booking}/frame-design',       [BookingController::class, 'uploadFrameDesign']);
    Route::get('/bookings',                        [BookingController::class, 'index']);
    Route::post('/bookings',                       [BookingController::class, 'store']);
    Route::put('/bookings/{booking}',              [BookingController::class, 'update']);
    Route::delete('/bookings/{booking}',           [BookingController::class, 'destroy']);

    // Invoice PDF
    Route::get('/bookings/{booking}/invoice',          [InvoiceController::class, 'download']);
    Route::get('/bookings/{booking}/invoice/preview',  [InvoiceController::class, 'preview']);
    Route::post('/bookings/{booking}/send-invoice',    [InvoiceController::class, 'sendViaWa']);

    // FAQ
    Route::get('/faqs',           [FaqController::class, 'index']);
    Route::post('/faqs',          [FaqController::class, 'store']);
    Route::put('/faqs/{faq}',     [FaqController::class, 'update']);
    Route::delete('/faqs/{faq}',  [FaqController::class, 'destroy']);

    // Gallery
    Route::get('/gallery',              [GalleryController::class, 'index']);
    Route::post('/gallery',             [GalleryController::class, 'store']);
    Route::put('/gallery/{gallery}',    [GalleryController::class, 'update']);
    Route::delete('/gallery/{gallery}', [GalleryController::class, 'destroy']);

    // Kiosks
    Route::get('/kiosks',               [KioskController::class, 'index']);
    Route::post('/kiosks',              [KioskController::class, 'store']);
    Route::put('/kiosks/{kiosk}',       [KioskController::class, 'update']);
    Route::patch('/kiosks/{kiosk}/toggle',    [KioskController::class, 'toggle']);
    Route::patch('/kiosks/{kiosk}/toggle-ai', [KioskController::class, 'toggleAi']);
    Route::delete('/kiosks/{kiosk}',    [KioskController::class, 'destroy']);

    // Logistics — master inventory items
    Route::get('/logistics',                   [LogisticController::class, 'index']);
    Route::post('/logistics',                  [LogisticController::class, 'store']);
    Route::put('/logistics/{logistic}',        [LogisticController::class, 'update']);
    Route::delete('/logistics/{logistic}',     [LogisticController::class, 'destroy']);

    // Logistic logs — staff event submissions (admin view)
    Route::get('/logistic-logs',               [LogisticController::class, 'logs']);
    Route::delete('/logistic-logs/{log}',      [LogisticController::class, 'destroyLog']);

    // Logistic staff — staff submits their checklist before/after event
    Route::get('/logistic-staff/items',             [LogisticStaffController::class, 'items']);
    Route::get('/logistic-staff/active-checkout',   [LogisticStaffController::class, 'activeCheckout']);
    Route::get('/logistic-staff/upcoming-bookings', [LogisticStaffController::class, 'upcomingBookings']);
    Route::post('/logistic-staff',                  [LogisticStaffController::class, 'store']);

    // Sales
    Route::get('/sales',                        [SalesController::class, 'index']);
    Route::patch('/sales/{booking}/expenses',   [SalesController::class, 'updateExpenses']);

    // Feedback (admin view)
    Route::get('/feedbacks',                  [FeedbackController::class, 'index']);
    Route::delete('/feedbacks/{feedback}',    [FeedbackController::class, 'destroy']);

    // Reimbursements (admin view)
    Route::get('/reimbursements',                        [ReimbursementController::class, 'index']);
    Route::put('/reimbursements/{reimbursement}',        [ReimbursementController::class, 'update']);
    Route::delete('/reimbursements/{reimbursement}',     [ReimbursementController::class, 'destroy']);

    // Discounts
    Route::get('/discounts',               [DiscountController::class, 'index']);
    Route::post('/discounts',              [DiscountController::class, 'store']);
    Route::put('/discounts/{discount}',    [DiscountController::class, 'update']);
    Route::delete('/discounts/{discount}', [DiscountController::class, 'destroy']);
});
