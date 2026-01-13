const express = require("express");
const router = express.Router();
const {
  createBooking,
  listBookings,
} = require("../controllers/bookingController");

// POST/book-Create a new booking
router.post("/", createBooking);

// GET/bookings-List all bookings
router.get("/", listBookings);

module.exports = router;
