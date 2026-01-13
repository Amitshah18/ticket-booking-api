const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Section name is required"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Section price is required"],
    min: [0, "Price cannot be negative"],
  },
  capacity: {
    type: Number,
    required: [true, "Section capacity is required"],
    min: [1, "Capacity must be at least 1"],
  },
  remaining: {
    type: Number,
    required: true,
    min: [0, "Remaining seats cannot be negative"],
  },
});

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
    },
    sections: {
      type: [sectionSchema],
      validate: {
        validator: function (sections) {
          return sections && sections.length > 0;
        },
        message: "Event must have at least one section",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);
