# Quick Start Guide - Feed Integration

## Prerequisites
- Java 21
- Maven
- Node.js 16+
- MySQL running on localhost:3306
- Database `food_distribution` created

## Step 1: Backend Setup

### 1.1 Configure Database
Create `.env.properties` in the backend folder:
```properties
DB_USERNAME=root
DB_PASSWORD=your_password
```

### 1.2 Load Sample Data (Optional)
```bash
mysql -u root -p food_distribution < backend/sample_data.sql
```

Note: Make sure you have at least one user and one needy_zone record.

### 1.3 Start Backend
```bash
cd backend
./mvnw spring-boot:run
```

Backend will start on: http://localhost:8080

## Step 2: Frontend Setup

### 2.1 Install Dependencies
```bash
cd frontend
npm install
```

### 2.2 Start Frontend
```bash
npm run dev
```

Frontend will start on: http://localhost:5173

## Step 3: Test the Integration

1. Open browser to http://localhost:5173
2. Navigate to Home page
3. You should see food listings from the database
4. Try clicking "Accept" on any food item
5. The status should update to "claimed"

## Troubleshooting

### Backend won't start
- Check MySQL is running
- Verify database credentials in `.env.properties`
- Check database `food_distribution` exists

### No food items showing
- Run the sample_data.sql script
- Or manually insert food listings with status='OPEN'

### CORS errors
- Make sure backend is running on port 8080
- Check frontend .env has correct VITE_API_BASE_URL

### Claim button not working
- Check browser console for errors
- Verify backend is running
- Check food item status is 'OPEN' in database

## API Endpoints

Test them with curl or Postman:

```bash
# Get food feed
curl http://localhost:8080/api/food/feed?page=0&size=5

# Get specific food
curl http://localhost:8080/api/food/1

# Claim food
curl -X POST http://localhost:8080/api/food/1/claim \
  -H "Content-Type: application/json" \
  -d '{"volunteerId": 1}'
```

## What's Integrated

✅ Food feed display
✅ Pagination (infinite scroll)
✅ Claim functionality
✅ Real-time status updates
✅ Error handling
✅ Loading states

## What's NOT Modified

❌ AddFood page (as requested)
❌ Backend food creation endpoints
❌ Authentication/Authorization

