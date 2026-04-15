# UsafiLink Review & Rating System

## Overview

The review and rating system allows customers to rate drivers after completing bookings, and admins to review and respond to ratings. The system tracks customer feedback, maintains driver ratings statistics, and enables admin moderation.

## Features

### 1. Customer Review Submission
- Customers can rate completed bookings on a 1-5 star scale
- Optional text comments (up to 500 characters)
- Rating submitted immediately after booking completion
- One rating per booking (cannot rate the same booking twice)

### 2. Driver Rating Dashboard
- Drivers can view their overall rating and statistics
- See distribution of ratings (5★, 4★, 3★, 2★, 1★)
- View recent customer reviews
- See admin responses to flagged reviews

### 3. Admin Review Panel
- View all ratings submitted in the system
- Filter by:
  - Unreviewed ratings only
  - Flagged ratings only
  - Specific driver
- Add admin response to ratings
- Flag inappropriate ratings with reason
- Bulk management capabilities

## API Endpoints

### Customer - Submit Rating
```
POST /api/bookings/{booking_id}/rate/
Content-Type: application/json

Request Body:
{
  "score": 5,          // Required: 1-5
  "comment": "string"  // Optional: up to 500 chars
}

Response:
{
  "detail": "Thank you for your feedback!"
}
```

### Get Driver Ratings
```
GET /api/bookings/driver_ratings/?driver_id={driver_id}

Response:
{
  "driver": {
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "phone": "+254712345678"
  },
  "statistics": {
    "average_rating": 4.5,
    "total_ratings": 20,
    "distribution": {
      "5_stars": 15,
      "4_stars": 3,
      "3_stars": 1,
      "2_stars": 1,
      "1_star": 0
    }
  },
  "recent_ratings": [
    {
      "id": 1,
      "customer_name": "Jane Smith",
      "score": 5,
      "comment": "Great service!",
      "created_at": "2026-04-01T10:30:00Z",
      "is_reviewed_by_admin": true,
      "admin_response": "Thank you for the positive feedback!",
      "is_flagged": false
    }
  ],
  "all_ratings_count": 20
}
```

### Admin - Get All Ratings
```
GET /api/bookings/all_ratings/?page=1&page_size=20&unreviewed=false&flagged=false&driver_id=

Parameters:
  - page: Page number (default: 1)
  - page_size: Results per page (default: 20)
  - unreviewed: true/false - Only unreviewed ratings
  - flagged: true/false - Only flagged ratings
  - driver_id: Optional - Filter by driver

Response:
{
  "count": 100,
  "page": 1,
  "page_size": 20,
  "total_pages": 5,
  "results": [
    {
      "id": 1,
      "booking": 50,
      "customer": 10,
      "customer_name": "Jane Smith",
      "driver": 5,
      "driver_name": "John Doe",
      "score": 5,
      "comment": "Excellent service",
      "created_at": "2026-04-01T10:30:00Z",
      "is_reviewed_by_admin": false,
      "admin_response": null,
      "reviewed_by": null,
      "reviewed_by_name": null,
      "is_flagged": false,
      "flag_reason": null,
      "reviewed_at": null
    }
  ]
}
```

### Admin - Review a Rating
```
POST /api/bookings/review_rating/
Content-Type: application/json

Request Body:
{
  "rating_id": 1,
  "admin_response": "Thank you for your feedback!",
  "is_flagged": false,
  "flag_reason": ""  // Required if is_flagged is true
}

Response:
{
  "detail": "Rating reviewed successfully.",
  "rating": {
    "id": 1,
    "is_reviewed_by_admin": true,
    "admin_response": "Thank you for your feedback!",
    ...
  }
}
```

## Frontend Components

### RatingForm Component
**Path:** `src/components/bookings/RatingForm.jsx`

Displays a rating submission form for customers after booking completion.

**Props:**
- `bookingId` (required): The booking ID to rate
- `driverId` (required): The driver being rated
- `onSubmitSuccess` (optional): Callback when rating is submitted
- `onCancel` (optional): Callback when user cancels

**Usage:**
```jsx
<RatingForm 
  bookingId={booking.id} 
  driverId={booking.driver_id}
  onSubmitSuccess={() => fetchBookingDetails()}
  onCancel={() => setShowForm(false)}
/>
```

### DriverRatings Component
**Path:** `src/components/bookings/DriverRatings.jsx`

Displays driver's overall rating and recent reviews.

**Props:**
- `driverId` (required): The driver ID to display ratings for

**Usage:**
```jsx
<DriverRatings driverId={user.id} />
```

### AdminRatingsPanel Component
**Path:** `src/components/bookings/AdminRatingsPanel.jsx`

Complete admin panel for managing ratings with filtering, pagination, and review submission.

**Features:**
- Filter unreviewed/flagged ratings
- Filter by specific driver
- Pagination (10 per page)
- Modal for reviewing individual ratings
- Add admin response
- Flag inappropriate ratings with reason

## Pages

### Customer Booking Detail
**Path:** `/bookings/:id`
- Shows booking information
- Displays rating form for completed bookings
- Shows submitted rating if available

### Driver Ratings View
**Path:** `/driver/ratings`
- Shows driver's personal rating statistics
- Displays recent customer reviews
- Shows admin responses to reviews

### Admin Ratings Management
**Path:** `/admin/ratings`
- Complete ratings management dashboard
- List all ratings with filtering options
- Review and respond to individual ratings
- Flag inappropriate content

## Database Schema

### Rating Model Fields

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| booking | ForeignKey | Reference to Booking (OneToOne, required) |
| customer | ForeignKey | Customer who submitted rating |
| driver | ForeignKey | Driver being rated |
| score | Integer | Rating 1-5 |
| comment | Text | Optional customer comment (max 500 chars) |
| created_at | DateTime | When rating was submitted |
| is_reviewed_by_admin | Boolean | Admin has reviewed this rating |
| admin_response | Text | Admin's response/notes (max 500 chars) |
| reviewed_by | ForeignKey | Admin user who reviewed |
| is_flagged | Boolean | Marked as inappropriate |
| flag_reason | String | Reason for flagging (max 255 chars) |
| reviewed_at | DateTime | When admin reviewed |

## Migration

A migration file has been created: `bookings/migrations/0007_rating_admin_review.py`

To apply:
```bash
cd backend
python manage.py migrate bookings
```

## Usage Flow

### Customer Flow
1. Customer completes a booking
2. Booking status changes to 'completed'
3. RatingForm appears in BookingDetail page
4. Customer selects star rating and optionally adds comment
5. Click "Submit Rating"
6. Rating is saved and displayed immediately

### Driver Flow
1. Driver navigates to `/driver/ratings`
2. Sees their overall rating statistics
3. Views recent customer reviews
4. Sees admin responses to flagged reviews
5. Can check which reviews have been reviewed by admin

### Admin Flow
1. Admin navigates to `/admin/ratings`
2. Sees all system ratings
3. Filters by unreviewed, flagged, or driver
4. Clicks "Add Review" or "Edit Review" on a rating
5. Modal opens to add response
6. Can optionally flag the rating with reason
7. Submits review
8. Customer and driver can now see admin response

## Validation

### Frontend Validation
- Star rating required (1-5)
- Comment limited to 500 characters
- Can only rate completed bookings
- Cannot rate same booking twice

### Backend Validation
- Admin response limited to 500 characters
- Flag reason limited to 255 characters
- Only authenticated customers can submit ratings
- Only admins can review/flag ratings
- Rating can only exist once per booking

## Error Handling

### Common Errors

**"You can only rate completed bookings"**
- Booking status is not 'completed'
- Wait for driver to complete the service

**"Only the customer who made the booking can rate it"**
- Trying to rate another user's booking
- Access denied for security

**"This booking has already been rated"**
- Already submitted a rating for this booking
- Cannot submit multiple ratings per booking

**"Cannot rate a booking that had no driver assigned"**
- No driver was assigned to the booking
- Cannot rate system without driver

**"Only admins can review ratings"**
- Non-admin user trying to access admin endpoints
- Check user role and permissions

## Future Enhancements

- [ ] Email notifications to drivers of new reviews
- [ ] Automated response suggestions based on rating score
- [ ] Rating history analytics and trends
- [ ] Dispute resolution system integration
- [ ] Review moderation workflows
- [ ] Rating appeals by drivers
- [ ] Incentive system based on ratings
