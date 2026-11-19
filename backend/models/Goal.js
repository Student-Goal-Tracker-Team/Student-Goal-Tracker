
const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({

    // Student who owns this goal
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    title: {
        type: String,
        required: true
    },

    subject: {
        type: String,
        default: "General"
    },

    deadline: {
        type: String,
        default: ""
    },

    priority: {
        type: String,
        enum: ["High", "Medium", "Low"],
        default: "Medium"
    },

    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }

}, { timestamps: true });

const Goal = mongoose.model("Goal", goalSchema);

module.exports = Goal;
