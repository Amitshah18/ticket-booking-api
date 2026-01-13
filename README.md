# 🎫 Ticket Booking Backend API

A **concurrency-safe** ticket booking backend API built with Node.js, Express, and MongoDB that prevents ticket overselling using atomic database operations.

## ✨ Features

- **Concurrency-safe booking** - MongoDB atomic operations prevent race conditions
- **No overselling** - Remaining seats never go below zero
- **Clean architecture** - Models, controllers, and routes separation
- **Tested** - Includes concurrency test script

## 🛠️ Tech Stack

| Technology | Purpose       |
| ---------- | ------------- |
| Node.js    | Runtime       |
| Express.js | Web framework |
| MongoDB    | Database      |
| Mongoose   | ODM           |

## 🚀 Quick Start



```bash
#Rename the .env file
cp .env.example .env

# Install dependencies
npm install

# Start server (MongoDB must be running)
npm start

# Run concurrency test (in another terminal)
npm run test:concurrency
```

## 📡 API Endpoints

### 1. Create Event

**POST** `/events/create`

```json
{
  "name": "Dhurandhar",
  "sections": [
    { "name": "VIP", "price": 800, "capacity": 50 },
    { "name": "General", "price": 300, "capacity": 200 }
  ]
}
```

### 2. Get Event

**GET** `/events/:id`

### 3. Book Tickets

**POST** `/book`

```json
{
  "eventId": "...",
  "sectionId": "...",
  "qty": 3
}
```

### 4. List Bookings

**GET** `/bookings`

---

## 🔒 Locking Strategy & Concurrency Handling

### The Overselling Problem

When multiple users book tickets simultaneously:

```
User A checks: 5 seats available ✓
User B checks: 5 seats available ✓
User A books 3 seats → 2 remaining
User B books 3 seats → 2 remaining (BUG! Should have failed)
Result: 6 tickets sold, but only 5 seats existed!
```

### What Race Condition Occurs

This is a **read-check-write** race condition:

```
Time →
Thread A: READ (5) → CHECK (5 >= 3) → WRITE (remaining = 2)
Thread B:      READ (5) → CHECK (5 >= 3) → WRITE (remaining = 2)
```

Thread B reads before Thread A's write completes → data corruption.

### Solution: MongoDB Atomic Operation

We use `findOneAndUpdate` with a conditional query:

```javascript
const result = await Event.findOneAndUpdate(
  {
    _id: eventId,
    "sections._id": sectionId,
    "sections.remaining": { $gte: qty }, // Condition
  },
  {
    $inc: { "sections.$.remaining": -qty }, // Atomic decrement
  },
  { new: true }
);
```

**How it works:**

1. **Single Operation** - Check and update happen atomically
2. **Document Lock** - MongoDB locks the document during operation
3. **Conditional Match** - If `remaining < qty`, returns `null` (no update)
4. **No Race Window** - No gap between check and update

### Why This is Safe

| Traditional Approach         | Atomic Approach         |
| ---------------------------- | ----------------------- |
| Read → Check → Write (3 ops) | findOneAndUpdate (1 op) |
| Race condition possible      | No race condition       |
| Needs external locks         | Database handles it     |

**Guarantees:**

- ✅ Remaining seats never negative
- ✅ Total booked ≤ capacity
- ✅ No external locks needed

### Production Improvements

1. **Redis Distributed Locks** - Extra safety for high traffic
2. **MongoDB Transactions** - Multi-collection atomicity
3. **Message Queue (Kafka/RabbitMQ)** - Serial processing
4. **Rate Limiting** - Prevent abuse

---

## 🧪 Concurrency Test Results

```
Sending 10 PARALLEL booking requests (5 seats available)...

Results (completed in 192ms):
  Successful bookings: 5
  Failed bookings: 5

Validation:
  ✓ Successful bookings: 5 (expected: 5)
  ✓ Remaining seats: 0 (expected: 0)
  ✓ Remaining >= 0: PASSED (no overselling)
  ✓ Total booked (5) = Capacity (5)

ALL CONCURRENCY TESTS PASSED!
```

---

## 📁 Project Structure

```
Backend-Assignment/
├── config/db.js              # MongoDB connection
├── controllers/
│   ├── eventController.js
│   └── bookingController.js  # ← Atomic booking logic
├── models/
│   ├── Event.js
│   └── Booking.js
├── routes/
│   ├── eventRoutes.js
│   └── bookingRoutes.js
├── scripts/concurrencyTest.js
├── server.js
└── package.json
```
