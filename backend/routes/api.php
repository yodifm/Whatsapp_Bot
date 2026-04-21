<?php

use App\Http\Controllers\Backend\AnalyticsController;
use App\Http\Controllers\Backend\AuthController;
use App\Http\Controllers\Backend\BookingController;
use App\Http\Controllers\Backend\BroadcastController;
use App\Http\Controllers\Backend\CustomerController;
use App\Http\Controllers\Backend\DashboardController;
use App\Http\Controllers\Backend\FaqController;
use App\Http\Controllers\Backend\GalleryController;
use App\Http\Controllers\Backend\InvoiceController;
use App\Http\Controllers\Backend\NotificationController;
use App\Http\Controllers\Backend\PackageController;
use App\Http\Controllers\Backend\SettingController;
use App\Http\Controllers\Backend\TestAIController;
use App\Http\Controllers\WhatsAppController;
use Illuminate\Support\Facades\Route;

// WhatsApp webhook (public)
Route::get('/webhook/whatsapp',  [WhatsAppController::class, 'verify']);
Route::post('/webhook/whatsapp', [WhatsAppController::class, 'handle']);

// Auth
Route::post('/login', [AuthController::class, 'login']);

// Protected
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user',    [AuthController::class, 'me']);

    Route::get('/customers',               [DashboardController::class, 'customers']);
    Route::get('/customers/{id}/messages', [DashboardController::class, 'messages']);

    Route::get('/settings',  [SettingController::class, 'index']);
    Route::post('/settings', [SettingController::class, 'update']);

    Route::post('/test-ai', [TestAIController::class, 'chat']);

    // Packages
    Route::get('/packages',              [PackageController::class, 'index']);
    Route::post('/packages',             [PackageController::class, 'store']);
    Route::put('/packages/{package}',    [PackageController::class, 'update']);
    Route::delete('/packages/{package}', [PackageController::class, 'destroy']);

    // Customer actions
    Route::patch('/customers/{customer}/status',    [CustomerController::class, 'updateStatus']);
    Route::patch('/customers/{customer}/toggle-ai', [CustomerController::class, 'toggleAI']);

    // Analytics
    Route::get('/analytics', [AnalyticsController::class, 'index']);

    // Broadcast
    Route::post('/broadcast/preview', [BroadcastController::class, 'preview']);
    Route::post('/broadcast',         [BroadcastController::class, 'send']);

    // Notifications (polling)
    Route::get('/notifications', [NotificationController::class, 'poll']);

    // Bookings / Calendar
    Route::get('/bookings/booked-dates', [BookingController::class, 'bookedDates']);
    Route::get('/bookings',              [BookingController::class, 'index']);
    Route::post('/bookings',             [BookingController::class, 'store']);
    Route::put('/bookings/{booking}',    [BookingController::class, 'update']);
    Route::delete('/bookings/{booking}', [BookingController::class, 'destroy']);

    // Invoice PDF
    Route::get('/bookings/{booking}/invoice',         [InvoiceController::class, 'download']);
    Route::get('/bookings/{booking}/invoice/preview', [InvoiceController::class, 'preview']);

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
});
