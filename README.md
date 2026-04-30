# 🍱 Food Distribution System

A web application to reduce food wastage and help connect surplus food with people in need — through a community of donors and volunteers.

---

## What is this?

Every day, large amounts of food go to waste after weddings, parties, events, and gatherings — while many people nearby go without a meal. The **Food Distribution System** bridges this gap.

The platform lets anyone post surplus food they want to donate. Volunteers can then pick up these donations and deliver them to nearby needy locations. Users can also mark **needy zones** — areas where food is frequently needed — which are verified by an admin to ensure authenticity.

The goal is simple: make it easy for people who have food to find people who can deliver it, so nothing goes to waste.

---

## Motivation

The idea came from a common, frustrating reality: after large gatherings, significant amounts of food often remain untouched. People are often *willing* to donate but don't know how, where, or who can help. At the same time, there are many volunteers who *want* to help but don't have a platform connecting them to opportunities.

Existing apps in this space are mostly business-oriented — they let restaurants list leftover food at discounted prices — but none focus specifically on community-driven donation and volunteer delivery to those in need. This project was built to fill that gap.

---

## What this app does

- Lets donors post food listings with details and images
- Shows a live feed of available food that volunteers can browse
- Lets volunteers claim food and update its delivery status
- Lets users mark needy zones where food is frequently needed (admin-verified)
- Supports user login with OTP email verification

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Spring Boot (Java) |
| Database | MySQL |

---

## Run Locally

### Prerequisites

- Node.js 18+
- Java 17+
- MySQL 8+

### 1. Create the database

Create a database named `food_distribution` in MySQL.

### 2. Backend setup

```bash
cd backend
```

Set these environment variables (required):

- `DB_USERNAME`
- `DB_PASSWORD`


Start the backend:

```bash
./mvnw spring-boot:run
```

Backend runs at **http://localhost:8080**

### 3. Frontend setup

```bash
cd frontend
npm install
```

Optionally set the API base URL (defaults to `http://localhost:8080/api` if skipped):

```
VITE_API_BASE_URL=http://localhost:8080/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at **http://localhost:5173**

### 4. (Optional) Sample data

Import the sample SQL file for quick demo data:

```
backend/sample_data.sql
```

---

## Notes

- Uploaded food images are stored in the `uploads/` folder by default.
- OTP-based login requires `SENDGRID_API_KEY` and `MAIL_FROM_ADDRESS` to be set. Without these, login will not complete.
- For production, deploy the backend to any Java host, serve the React frontend as static files, and point both at a hosted MySQL database.

