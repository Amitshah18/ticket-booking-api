const Event = require("../models/Event");
const Booking = require("../models/Booking");


const createBooking = async (req, res) => {
  try {
    const { eventId, sectionId, qty } = req.body;

    // validate request body
    if (!eventId || !sectionId || !qty) {
      return res.status(400).json({
        success: false,
        message: "eventId, sectionId, and qty are required",
      });
    }

    if (qty < 1 || !Number.isInteger(qty)) {
      return res.status(400).json({
        success: false,
        message: "qty must be a positive integer",
      });
    }


    const result = await Event.findOneAndUpdate(
      {
        _id: eventId,
        "sections._id": sectionId,
        "sections.remaining": { $gte: qty }, 
      },
      {
        $inc: { "sections.$.remaining": -qty }, 
      },
      {
        new: true,
      }
    );

    if (!result) {
      const event = await Event.findById(eventId);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      const section = event.sections.id(sectionId);

      if (!section) {
        return res.status(404).json({
          success: false,
          message: "Section not found in this event",
        });
      }

      return res.status(400).json({
        success: false,
        message: `Not enough seats available. Requested: ${qty}, Available: ${section.remaining}`,
      });
    }

    const booking = await Booking.create({
      eventId,
      sectionId,
      qty,
    });


    const bookedSection = result.sections.id(sectionId);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        booking,
        remainingSeats: bookedSection.remaining,
      },
    });
  } catch (error) {
    
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// lsit of  all bookings with event and section info
//  GET /bookings

const listBookings = async (req, res) => {
  try {
    
    const bookings = await Booking.find()
      .populate("eventId", "name sections")
      .sort({ createdAt: -1 });

    // bookings with section details
    const enrichedBookings = bookings.map((booking) => {
      const bookingObj = booking.toObject();

      // find the section in the populated event
      if (bookingObj.eventId && bookingObj.eventId.sections) {
        const section = bookingObj.eventId.sections.find(
          (s) => s._id.toString() === bookingObj.sectionId.toString()
        );
        bookingObj.sectionDetails = section || null;
      }

      return bookingObj;
    });

    res.status(200).json({
      success: true,
      count: enrichedBookings.length,
      data: enrichedBookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createBooking,
  listBookings,
};
