# Part A — Design Document

## A1. System Overview

**Major components:**
- Frontend: Next.js (React) app — has separate pages for restaurant and customer
- Backend: Express.js REST API
- Database: MySQL with Sequelize
- Real-time: WebSocket connection between server and browser for live status updates

**Tech stack and why:**
- Next.js / React — required by the assignment, also what I'm comfortable with
- Express — simple to set up REST APIs quickly
- MySQL + Sequelize — relational data fits well here (orders belong to customers and restaurants, items belong to orders), Sequelize makes writing models/queries easier than raw SQL
- WebSocket (ws package) — needed for live updates without refreshing, simpler to set up than Socket.io for this scope

**Assumptions:**
- One customer can place one order at a time (keeps tracking simple — no need to pick "which order" to track)
- A restaurant account = one restaurant (1 user = 1 restaurant)
- No payment integration, this is just for tracking
- Prices are in INR, no tax/delivery fee calculation
- Delivery driver assignment is not built — restaurant manually marks "out for delivery"

---

## A2. Database Design

**Tables:**

1. **users**
   - id (PK)
   - name
   - email (unique)
   - password (hashed)
   - role (enum: customer / restaurant)

2. **restaurants**
   - id (PK)
   - userId (FK -> users.id)
   - name
   - address
   - phone

3. **orders**
   - id (PK)
   - customerId (FK -> users.id)
   - restaurantId (FK -> restaurants.id)
   - status (enum: placed, confirmed, preparing, out_for_delivery, delivered)
   - deliveryAddress
   - totalAmount
   - createdAt / updatedAt

4. **order_items**
   - id (PK)
   - orderId (FK -> orders.id)
   - name
   - quantity
   - price

**Relationships:**
- users -> restaurants: one-to-one (a restaurant account has one restaurant profile)
- users -> orders: one-to-many (a customer can have many orders, even if only one is "active")
- restaurants -> orders: one-to-many
- orders -> order_items: one-to-many

**Indexes:**
- email — unique, for fast login lookup
- customerId on orders — so customer can quickly find their orders
- restaurantId on orders — so restaurant can quickly find their orders
- status on orders — to filter active vs delivered orders

---

## A3. API Design

**Endpoints:**

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/orders                  (customer places order)
GET    /api/orders/my               (customer gets their order)
GET    /api/orders/restaurant       (restaurant gets order queue)
PATCH  /api/orders/:id/status       (restaurant updates status)

GET    /api/restaurants             (list of restaurants to order from)
```

**Sample request/response (3 endpoints):**

`POST /api/auth/login`
```json
// Request
{ "email": "customer@demo.com", "password": "password123" }

// Response
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": { "id": 2, "name": "Arjun", "email": "customer@demo.com", "role": "customer" }
  }
}
```

`POST /api/orders`
```json
// Request
{
  "restaurantId": 1,
  "deliveryAddress": "10 Koramangala, Bangalore",
  "items": [
    { "name": "Butter Chicken", "price": 280, "quantity": 1 }
  ]
}

// Response
{
  "success": true,
  "data": { "order": { "id": 7, "status": "placed", "totalAmount": "280.00" } }
}
```

`PATCH /api/orders/:id/status`
```json
// Request
{ "status": "confirmed" }

// Response (success)
{ "success": true, "data": { "order": { "id": 7, "status": "confirmed" } } }

// Response (invalid skip)
{ "success": false, "error": { "message": "Invalid status transition: placed -> delivered", "code": 422 } }
```

All error responses follow the same format: `{ success: false, error: { message, code } }`.

**Authentication:**
- JWT-based. On login/register, server returns a token.
- Frontend stores token in localStorage and sends it as `Authorization: Bearer <token>` on every request.
- Middleware checks the token and attaches the user to the request.
- Role check middleware — some routes only allow `customer`, some only `restaurant`.
- Ownership check inside controllers — e.g. restaurant can only update orders that belong to their own restaurant; customer can only see their own order.

---

## A4. Real-Time Strategy

**How updates are pushed:**
- Used WebSockets (ws library) on the same server as the Express API.
- When customer opens their order tracking page, the browser opens a WebSocket connection and sends a "subscribe to order X" message.
- When restaurant updates order status via the PATCH endpoint, the server finds anyone subscribed to that order and sends them the new status immediately.
- Restaurant dashboard also subscribes (to their restaurant ID) so new orders and status changes show up live for all staff.

**If the customer loses connection:**
- The WebSocket hook detects disconnection and shows a "disconnected" message in the UI so the user knows the status might be stale.
- It automatically tries to reconnect every few seconds.
- If the customer refreshes the page, the order is re-fetched normally via the REST API (`/api/orders/my`) on page load, so they always see the current status even if the WebSocket hasn't reconnected yet.
