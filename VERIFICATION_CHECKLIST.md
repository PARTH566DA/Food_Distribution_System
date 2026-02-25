# Integration Verification Checklist

## Pre-requisites
- [ ] MySQL is running on localhost:3306
- [ ] Database `food_distribution` exists
- [ ] Java 21 is installed
- [ ] Node.js 16+ is installed
- [ ] Maven is installed

## Backend Setup
- [ ] Created `.env.properties` file in backend root with:
  ```properties
  DB_USERNAME=your_username
  DB_PASSWORD=your_password
  ```
- [ ] Database has at least one user record
- [ ] Database has at least one needy_zone record
- [ ] (Optional) Loaded sample data: `mysql -u root -p food_distribution < backend/sample_data.sql`

## Backend Build & Run
- [ ] Navigate to backend folder: `cd backend`
- [ ] Compile successfully: `./mvnw clean compile -DskipTests`
- [ ] Start backend: `./mvnw spring-boot:run`
- [ ] Backend starts without errors
- [ ] Backend is running on http://localhost:8080
- [ ] Test API: `curl http://localhost:8080/api/food/feed?page=0&size=5`
- [ ] API returns JSON response with success:true

## Frontend Setup
- [ ] Navigate to frontend folder: `cd frontend`
- [ ] Install dependencies: `npm install`
- [ ] Check `.env` file exists with `VITE_API_BASE_URL=http://localhost:8080/api`
- [ ] Start frontend: `npm run dev`
- [ ] Frontend starts without errors
- [ ] Frontend is running on http://localhost:5173

## Functional Testing
- [ ] Open browser to http://localhost:5173
- [ ] Navigate to Home page
- [ ] Food feed loads and displays items from database
- [ ] Food items show correct information (description, quantity, etc.)
- [ ] Veg/Non-veg icons display correctly
- [ ] Package icon shows for packed items
- [ ] Time ago displays correctly
- [ ] Expiry time shows in hours
- [ ] "Accept" button is visible on available items

## Claim Functionality
- [ ] Click "Accept" on a food item
- [ ] Button shows loading state while claiming
- [ ] Item status updates to "claimed"
- [ ] "Claimed" badge appears instead of Accept button
- [ ] Backend database shows status changed to 'ASSIGNED'

## Pagination Testing
- [ ] Scroll down to load more items
- [ ] New items load automatically (infinite scroll)
- [ ] Loading indicator shows while fetching
- [ ] "End of feed" message appears when no more items

## Error Handling
- [ ] Stop backend server
- [ ] Refresh frontend page
- [ ] Error message displays: "Failed to load food items"
- [ ] "Try again" button appears
- [ ] Start backend again
- [ ] Click "Try again" button
- [ ] Items load successfully

## Browser Console
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab for no errors
- [ ] Network tab shows API calls to localhost:8080
- [ ] API responses return proper JSON format

## Database Verification
- [ ] Check `food_listings` table in database
- [ ] Verify records exist with status='OPEN'
- [ ] After claiming, check status changed to 'ASSIGNED'
- [ ] Query: `SELECT food_id, description, status FROM food_listings;`

## Files Verification
### Backend Files Created:
- [ ] `controller/FoodListingController.java`
- [ ] `service/FoodListingService.java`
- [ ] `dto/FoodListingDTO.java`
- [ ] `dto/FoodPageResponse.java`
- [ ] `dto/ApiResponse.java`
- [ ] `dto/ClaimRequest.java`
- [ ] `config/SecurityConfig.java`
- [ ] `config/CorsConfig.java`
- [ ] `sample_data.sql`

### Backend Files Modified:
- [ ] `repository/FoodListingRepository.java`
- [ ] `resources/application.properties`
- [ ] `pom.xml`

### Frontend Files Modified:
- [ ] `src/api/food.js`

### Frontend Files Created:
- [ ] `.env`
- [ ] `.env.example`

### Documentation Created:
- [ ] `QUICK_START.md`
- [ ] `FEED_INTEGRATION.md`
- [ ] `INTEGRATION_SUMMARY.md`

## Verification Commands

```bash
# Check backend is running
curl http://localhost:8080/api/food/feed?page=0&size=5

# Check specific food item
curl http://localhost:8080/api/food/1

# Test claim endpoint
curl -X POST http://localhost:8080/api/food/1/claim \
  -H "Content-Type: application/json" \
  -d '{"volunteerId": 1}'

# Check database
mysql -u root -p -e "USE food_distribution; SELECT food_id, description, status, created_at FROM food_listings LIMIT 5;"
```

## Common Issues & Solutions

### Issue: Backend compilation errors
**Solution**: Make sure Lombok is properly installed in your IDE. Run `./mvnw clean compile` to verify.

### Issue: "Cannot connect to database"
**Solution**: 
1. Check MySQL is running: `mysql -u root -p`
2. Verify database exists: `SHOW DATABASES;`
3. Check credentials in `.env.properties`

### Issue: CORS errors in browser
**Solution**: 
1. Verify backend is running on port 8080
2. Check `CorsConfig.java` includes your frontend URL
3. Clear browser cache

### Issue: No food items showing
**Solution**:
1. Run sample_data.sql to insert test data
2. Check database: `SELECT * FROM food_listings WHERE status='OPEN';`
3. Verify user_id and target_zone_id exist in database

### Issue: Claim button doesn't work
**Solution**:
1. Check browser console for errors
2. Verify food item status is 'OPEN' in database
3. Check backend logs for errors

## Success Criteria
✅ All checkboxes above are checked
✅ Food feed loads from database
✅ Pagination works (infinite scroll)
✅ Claim functionality updates status
✅ No errors in browser console
✅ No errors in backend logs

---

**Status**: [ ] Complete / [ ] In Progress / [ ] Issues Found

**Notes**:
_Add any issues or observations here_

