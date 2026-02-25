# Food Distribution System - Feed Integration

## Setup Instructions

### Backend Setup

1. **Prerequisites**
   - Java 21 or higher
   - Maven
   - MySQL database running on localhost:3306

2. **Database Configuration**
   - Create a database named `food_distribution`
   - Create a `.env.properties` file in the backend root directory:
     ```properties
     DB_USERNAME=your_mysql_username
     DB_PASSWORD=your_mysql_password
     ```

3. **Run the Backend**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   
   The backend will start on `http://localhost:8080`

### Frontend Setup

1. **Prerequisites**
   - Node.js 16 or higher
   - npm or yarn

2. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Environment Configuration**
   - The `.env` file is already configured to connect to `http://localhost:8080/api`
   - You can modify this in `.env` if your backend runs on a different port

4. **Run the Frontend**
   ```bash
   npm run dev
   ```
   
   The frontend will start on `http://localhost:5173`

## API Endpoints

### Food Feed API

1. **Get Food Listings (Paginated)**
   - **URL**: `GET /api/food/feed?page={page}&size={size}`
   - **Response**:
     ```json
     {
       "success": true,
       "data": {
         "items": [...],
         "currentPage": 0,
         "totalPages": 5,
         "totalItems": 25,
         "hasMore": true
       }
     }
     ```

2. **Get Food by ID**
   - **URL**: `GET /api/food/{foodId}`
   - **Response**:
     ```json
     {
       "success": true,
       "data": {
         "id": 1,
         "foodId": "FOOD001",
         "description": "...",
         ...
       }
     }
     ```

3. **Claim Food**
   - **URL**: `POST /api/food/{foodId}/claim`
   - **Body**:
     ```json
     {
       "volunteerId": 1
     }
     ```
   - **Response**:
     ```json
     {
       "success": true,
       "message": "Food claimed successfully",
       "data": {...}
     }
     ```

## Features Implemented

### Backend
- ✅ FoodListingController with REST endpoints
- ✅ FoodListingService with business logic
- ✅ Pagination support for food listings
- ✅ DTO mapping for API responses
- ✅ CORS configuration for frontend communication
- ✅ Security configuration (API endpoints open for now)

### Frontend
- ✅ Updated API client to connect to Spring Boot backend
- ✅ Feed component with infinite scroll
- ✅ Claim functionality
- ✅ Environment-based API URL configuration
- ✅ Error handling and loading states

## Database Schema

The backend expects the following `food_listings` table structure:
- `food_id` (Long, Primary Key)
- `description` (String)
- `quantity` (Integer)
- `is_packed_in_box` (Boolean)
- `is_vegetarian` (Boolean)
- `image_url` (String)
- `created_at` (LocalDateTime)
- `pickup_address` (String)
- `fresh_hours` (Integer)
- `status` (Enum: OPEN, ASSIGNED, PICKED_UP, DELIVERED, EXPIRED)
- `pickup_latitude` (Double)
- `pickup_longitude` (Double)
- `user_id` (Foreign Key to users table)
- `target_zone_id` (Foreign Key to needy_zones table)

## Testing the Integration

1. Start the backend server
2. Start the frontend dev server
3. Navigate to the Home page
4. The Feed should load food listings from the backend
5. Click "Accept" on any food item to claim it
6. The status should update to "claimed"

## Notes

- The AddFood page functionality was not modified as requested
- Spring Security is configured to permit all API endpoints for now
- In production, implement proper authentication and authorization
- The volunteerId is hardcoded to 1 for claim requests (should come from authenticated user session)

