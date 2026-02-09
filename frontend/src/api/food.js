// Mock API for food feed - replace with actual backend endpoints when ready

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock food data
const mockFoodItems = [
  {
    id: 1,
    foodId: "FOOD001",
    description: "Fresh Vegetable Curry with Rice",
    quantity: "20 servings",
    vegetarian: true,
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    createdAt: "2026-01-15T10:30:00Z",
    location: "Community Kitchen Downtown",
    donor: "City Food Bank",
    expiryTime: "12",
    status: "available"
  },
  {
    id: 2,
    foodId: "FOOD002",
    description: "Chicken Biryani with Raita",
    quantity: "15 servings",
    vegetarian: false,
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03246963d7d9?w=400&h=300&fit=crop",
    createdAt: "2026-01-15T09:45:00Z",
    location: "Restaurant District",
    donor: "Spice Garden Restaurant",
    expiryTime: "2026-01-15T17:30:00Z",
    status: "available"
  },
  {
    id: 3,
    foodId: "FOOD003",
    description: "Mixed Fruit Salad Bowls",
    quantity: "30 bowls",
    vegetarian: true,
    imageUrl: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop",
    createdAt: "2026-01-15T08:20:00Z",
    location: "Farmer's Market",
    donor: "Fresh Fruits Co.",
    expiryTime: "2026-01-15T16:00:00Z",
    status: "available"
  },
  {
    id: 4,
    foodId: "FOOD004", 
    description: "Homemade Sandwiches & Soup",
    quantity: "25 sets",
    vegetarian: true,
    imageUrl: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&h=300&fit=crop",
    createdAt: "2026-01-15T07:15:00Z",
    location: "Central Community Hall",
    donor: "Volunteers United",
    expiryTime: "2026-01-15T15:30:00Z", 
    status: "available"
  },
  {
    id: 5,
    foodId: "FOOD005",
    description: "Pizza Slices & Garlic Bread",
    quantity: "18 servings",
    vegetarian: false,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
    createdAt: "2026-01-14T20:30:00Z",
    location: "University Campus",
    donor: "Mario's Pizzeria",
    expiryTime: "2026-01-15T14:00:00Z",
    status: "claimed"
  }
];

// Simulate paginated API response
export const fetchFoodPage = async (page = 0, size = 5) => {
  await delay(800); // Simulate network delay
  
  const startIndex = page * size;
  const endIndex = startIndex + size;
  const items = mockFoodItems.slice(startIndex, endIndex);
  
  return {
    items,
    currentPage: page,
    totalPages: Math.ceil(mockFoodItems.length / size),
    totalItems: mockFoodItems.length,
    hasMore: endIndex < mockFoodItems.length
  };
};

// Simulate claim food action
export const claimFood = async (foodId) => {
  await delay(500);
  
  // In real implementation, this would make a POST request
  console.log(`Claiming food item: ${foodId}`);
  
  return {
    success: true,
    message: "Food claimed successfully"
  };
};

// Simulate get food details
export const getFoodDetails = async (foodId) => {
  await delay(300);
  
  const item = mockFoodItems.find(item => item.foodId === foodId);
  if (!item) {
    throw new Error('Food item not found');
  }
  
  return item;
};