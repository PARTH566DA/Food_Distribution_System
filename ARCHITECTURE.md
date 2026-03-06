# Food Distribution System - Feed Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                     http://localhost:5173                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌─────────────┐      ┌───────────────┐  │
│  │  Home.jsx    │ ───> │  Feed.jsx   │ ───> │ FeedItem.jsx  │  │
│  └──────────────┘      └─────────────┘      └───────────────┘  │
│                              │                                   │
│                              ▼                                   │
│                       ┌─────────────┐                           │
│                       │  food.js    │ (API Client)              │
│                       │  - fetchFoodPage()                      │
│                       │  - claimFood()                          │
│                       │  - getFoodDetails()                     │
│                       └─────────────┘                           │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               │ HTTP REST API
                               │ (JSON over HTTP)
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                      BACKEND (Spring Boot)                       │
│                     http://localhost:8080                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              FoodListingController                          │ │
│  │  - GET  /api/food/feed?page=0&size=5                      │ │
│  │  - GET  /api/food/{foodId}                                │ │
│  │  - POST /api/food/{foodId}/claim                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              FoodListingService                             │ │
│  │  - getAvailableFoodListings(page, size)                   │ │
│  │  - getFoodListingById(foodId)                             │ │
│  │  - claimFoodListing(foodId, volunteerId)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           FoodListingRepository                             │ │
│  │  - findByStatus(status, pageable)                          │ │
│  │  - findById(id)                                            │ │
│  │  - save(foodListing)                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               │ JDBC
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                      MySQL Database                              │
│                     localhost:3306                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Database: food_distribution                                     │
│                                                                   │
│  Tables:                                                         │
│  ┌─────────────────┐    ┌──────────────┐                       │
│  │ food_listings   │    │   users      │                       │
│  │ - food_id (PK)  │    │ - user_id    │                       │
│  │ - description   │    │ - email      │                       │
│  │ - quantity      │    │ - first_name │                       │
│  │ - status        │    │ - role       │                       │
│  │ - created_at    │    └──────────────┘                       │
│  │ - user_id (FK)  │                                            │
│  │ - ...           │    ┌──────────────┐                       │
│  └─────────────────┘    │ needy_zones  │                       │
│                         │ - zone_id    │                       │
│                         │ - zone_name  │                       │
│                         │ - latitude   │                       │
│                         │ - longitude  │                       │
│                         └──────────────┘                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Get Food Feed (Pagination)

```
User scrolls ──> Feed.jsx ──> fetchFoodPage(page, size)
                                      │
                                      ▼
              GET /api/food/feed?page=0&size=5
                                      │
                                      ▼
                          FoodListingController
                                      │
                                      ▼
                          FoodListingService
                                      │
                                      ▼
                        FoodListingRepository
                                      │
                                      ▼
                         MySQL Database Query:
                SELECT * FROM food_listings 
                WHERE status = 'OPEN' 
                ORDER BY created_at DESC 
                LIMIT 5 OFFSET 0
                                      │
                                      ▼
              List<FoodListing> entities
                                      │
                                      ▼
              Convert to FoodListingDTO
                                      │
                                      ▼
              Wrap in FoodPageResponse
                                      │
                                      ▼
              Wrap in ApiResponse
                                      │
                                      ▼
              JSON Response:
              {
                "success": true,
                "data": {
                  "items": [...],
                  "currentPage": 0,
                  "totalPages": 5,
                  "hasMore": true
                }
              }
                                      │
                                      ▼
              Feed.jsx updates state
                                      │
                                      ▼
              FeedItem.jsx renders items
```

### 2. Claim Food

```
User clicks "Accept" ──> FeedItem.jsx ──> onClaim(foodId)
                                                │
                                                ▼
                                    claimFood(foodId)
                                                │
                                                ▼
              POST /api/food/{foodId}/claim
              Body: { "volunteerId": 1 }
                                                │
                                                ▼
                                  FoodListingController
                                                │
                                                ▼
                    claimFoodListing(foodId, volunteerId)
                                                │
                                                ▼
                          Get food by ID from database
                                                │
                                                ▼
                          Check if status == 'OPEN'
                                                │
                                                ▼
                          Set status = 'ASSIGNED'
                                                │
                                                ▼
                          Save to database:
                UPDATE food_listings 
                SET status = 'ASSIGNED' 
                WHERE food_id = ?
                                                │
                                                ▼
                          Return updated FoodListing
                                                │
                                                ▼
              JSON Response:
              {
                "success": true,
                "message": "Food claimed successfully",
                "data": { ...updated item... }
              }
                                                │
                                                ▼
              Feed.jsx updates item status locally
                                                │
                                                ▼
              FeedItem shows "Claimed" badge
```

## Status Mapping

```
Backend (Database)          Frontend (Display)
─────────────────          ──────────────────
OPEN                  ──>  available   (Green "Accept" button)
ASSIGNED              ──>  claimed     (Yellow "Claimed" badge)
PICKED_UP             ──>  claimed     (Yellow "Claimed" badge)
DELIVERED             ──>  delivered   (Hidden from feed)
EXPIRED               ──>  expired     (Red "Expired" badge)
```

## Configuration Files

```
Backend:
├── application.properties (Server port, DB config)
└── .env.properties (DB credentials)

Frontend:
└── .env (API base URL)
```

## Security Configuration

```
Spring Security:
├── All /api/** endpoints: PERMIT ALL
├── CSRF: DISABLED
└── CORS: ENABLED for localhost:5173, localhost:3000
```

## DTOs (Data Transfer Objects)

```
Entity (Database)          DTO (API)
────────────────          ────────
food_id             ──>   id, foodId ("FOOD001")
description         ──>   description
quantity            ──>   quantity (String)
is_packed_in_box    ──>   packed (Boolean)
is_vegetarian       ──>   vegetarian (Boolean)
image_url           ──>   imageUrl
created_at          ──>   createdAt (ISO 8601)
pickup_address      ──>   address
fresh_hours         ──>   expiryTime (String)
status (Enum)       ──>   status (String)
pickup_latitude     ──>   pickupLatitude
pickup_longitude    ──>   pickupLongitude
```

## Key Features Implemented

✅ **Pagination**: Infinite scroll with page-based loading
✅ **Real-time Updates**: Status changes reflect immediately
✅ **Error Handling**: Graceful error messages and retry
✅ **Loading States**: Skeleton loaders and spinners
✅ **CORS**: Cross-origin requests enabled
✅ **REST API**: Clean RESTful endpoints
✅ **DTO Mapping**: Proper separation of concerns
✅ **Status Management**: Comprehensive status tracking

## Not Implemented (As Requested)

❌ AddFood page functionality
❌ Food creation endpoints
❌ Authentication/Authorization
❌ File upload for images
❌ User session management

