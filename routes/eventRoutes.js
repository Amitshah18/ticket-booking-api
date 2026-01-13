const express = require("express");
const router = express.Router();
const { createEvent, getEvent } = require("../controllers/eventController");

// POST/events/create-Create a new event with sections
router.post("/create", createEvent);

// GET/events/:id Get event details by ID
router.get("/:id", getEvent);

module.exports = router;
        