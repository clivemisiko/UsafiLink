# 🚛 Driver Job Completion & Invoicing Flow

## Overview
This document explains the flow when a driver marks a job as "Completed" and how it triggers invoice generation for the customer.

## 🔄 The Process

1.  **Driver Actions**
    *   Driver logs in to `DriverDashboard`.
    *   The dashboard automatically fetches the current **active job** (Status: `accepted`, `started`, or `arrived`).
    *   Driver performs the service and clicks **"Complete"**.
    *   System asks for confirmation.

2.  **Backend Processing**
    *   Endpoint `POST /bookings/bookings/{id}/complete/` is called.
    *   **Status Update**: Booking status changes to `completed`.
    *   **Invoice Generation**:
        *   The system checks if a payment record exists.
        *   If not, it **automatically creates a Pending Payment** record.
        *   Amount is set to the booking's `estimated_price` (or `final_price`).
    *   **Notification**: An SMS is sent to the customer: _"Service completed! Invoice of KES X generated. Please login to pay."_

3.  **Customer Experience**
    *   Customer sees the booking status update to **Completed** (or Payment Pending).
    *   In **Booking Details**, the "Make Payment" button becomes available (or active).
    *   Customer proceeds to pay via M-PESA.

## 🛠️ Key Code Components

*   **Frontend (`DriverDashboard.jsx`)**:
    *   Fetches real booking data via `bookingsAPI.getUserBookings()`.
    *   Identifies active job.
    *   Calls `bookingsAPI.completeBooking(id)`.

*   **Backend (`bookings/views.py`)**:
    *   `complete` action now runs inside a transaction.
    *   Creates entry in `Payment` model.

## 🧪 How to Test
1.  **Login as Driver**: View active job.
2.  **Click Complete**: Confirm action.
3.  **Login as Customer**: Go to "My Bookings".
4.  **Verify**:
    *   Status is Completed/Payment Pending.
    *   Click "View" -> "Make Payment" should work.
