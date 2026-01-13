require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const eventRoutes = require("./routes/eventRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

//middleware
app.use(express.json());

//routes
app.use("/events", eventRoutes);
app.use("/book", bookingRoutes);
app.use("/bookings", bookingRoutes);

//health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

//404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

//error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

//start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Endpoints:`);
      console.log(`  POST /events/create - Create a new event`);
      console.log(`  GET  /events/:id    - Get event details`);
      console.log(`  POST /book          - Book tickets (concurrency-safe)`);
      console.log(`  GET  /bookings      - List all bookings`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
