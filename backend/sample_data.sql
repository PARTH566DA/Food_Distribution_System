-- Sample data for testing the food feed
-- Make sure to replace user_id and target_zone_id with actual IDs from your database

-- Insert sample food listings
INSERT INTO food_listings
(is_vegetarian, is_packed_in_box, quantity, fresh_hours, pickup_latitude, pickup_longitude, status, description, pickup_address, image_url, created_at, user_id, target_zone_id)
VALUES
-- Food 1
(true, true, 20, 12, 40.7128, -74.0060, 'OPEN',
 'Fresh Vegetable Curry with Rice - Contains mixed vegetables, rice, and aromatic spices',
 '123 Community Kitchen Street, Downtown',
 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
 NOW(), 1, 1),

-- Food 2
(false, false, 15, 6, 40.7589, -73.9851, 'OPEN',
 'Chicken Biryani with Raita - Aromatic rice dish with tender chicken',
 '456 Restaurant District Avenue',
 'https://images.unsplash.com/photo-1563379091339-03246963d7d9?w=400&h=300&fit=crop',
 NOW() - INTERVAL 1 HOUR, 1, 1),

-- Food 3
(true, true, 30, 24, 40.7580, -73.9855, 'OPEN',
 'Mixed Fruit Salad Bowls - Fresh seasonal fruits in individual portions',
 '789 Farmers Market Lane',
 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop',
 NOW() - INTERVAL 2 HOUR, 1, 1),

-- Food 4
(true, true, 25, 8, 40.7306, -73.9352, 'OPEN',
 'Homemade Sandwiches & Soup - Vegetable sandwiches with tomato soup',
 '321 Central Community Hall',
 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&h=300&fit=crop',
 NOW() - INTERVAL 3 HOUR, 1, 1),

-- Food 5
(false, false, 18, 4, 40.7829, -73.9654, 'OPEN',
 'Pizza Slices & Garlic Bread - Margherita and pepperoni pizza with sides',
 '555 University Campus Drive',
 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
 NOW() - INTERVAL 4 HOUR, 1, 1),

-- Food 6
(true, true, 40, 10, 40.7614, -73.9776, 'OPEN',
 'Lentil Soup & Bread - Nutritious lentil soup with fresh bread rolls',
 '888 Charity Kitchen Street',
 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
 NOW() - INTERVAL 5 HOUR, 1, 1),

-- Food 7 (claimed example)
(true, false, 12, 6, 40.7484, -73.9857, 'ASSIGNED',
 'Pasta Primavera - Fresh pasta with seasonal vegetables',
 '999 Italian Restaurant Row',
 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
 NOW() - INTERVAL 6 HOUR, 1, 1),

-- Food 8
(false, true, 50, 12, 40.7282, -73.7949, 'OPEN',
 'Chicken Wraps & Fries - Grilled chicken wraps with french fries',
 '111 Fast Food Boulevard',
 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop',
 NOW() - INTERVAL 7 HOUR, 1, 1);

-- Note: Make sure you have at least one user and one needy zone in your database
-- You can create them with:

-- INSERT INTO users (email, password, role, first_name, last_name, phone_number)
-- VALUES ('donor@example.com', 'password', 'DONOR', 'John', 'Doe', '1234567890');

-- INSERT INTO needy_zones (zone_name, latitude, longitude, zone_status)
-- VALUES ('Downtown Zone', 40.7128, -74.0060, 'ACTIVE');

