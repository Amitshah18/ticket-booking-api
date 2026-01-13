const Event = require("../models/Event");


//  create a new event with sections
//  POST/events/create

const createEvent = async (req, res) => {
  try {
    const { name, sections } = req.body;

    // validate request body
    if (
      !name ||
      !sections ||
      !Array.isArray(sections) ||
      sections.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Event name and at least one section are required",
      });
    }


    const preparedSections = sections.map((section, index) => {
      if (!section.name || section.price === undefined || !section.capacity) {
        throw new Error(
          `Section at index ${index} is missing required fields (name, price, capacity)`
        );
      }
      if (section.capacity < 1) {
        throw new Error(`Section "${section.name}" must have capacity >= 1`);
      }
      return {
        name: section.name,
        price: section.price,
        capacity: section.capacity,
        remaining: section.capacity,
      };
    });

    const event = await Event.create({
      name,
      sections: preparedSections,
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// get eventdetails by ID
// GET /events/:id
const getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    // handle invalid ObjectId format
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createEvent,
  getEvent,
};
