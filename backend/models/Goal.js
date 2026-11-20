
const mongoose = require("mongoose");

const checklistSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    }
});

const goalSchema = new mongoose.Schema({
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

    checklist: {
        type: [checklistSchema],
        default: []
    },

    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }

}, { timestamps: true });

// Calculate progress from completed checklist items
goalSchema.pre("save", function () {
    if (this.checklist.length === 0) {
        this.progress = 0;
    } else {
        const completedTasks = this.checklist.filter(
            task => task.completed
        ).length;

        this.progress = Math.round(
            (completedTasks / this.checklist.length) * 100
        );
    }
});

const Goal = mongoose.model("Goal", goalSchema);

module.exports = Goal;
