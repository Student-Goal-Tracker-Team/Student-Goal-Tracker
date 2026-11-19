
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Goal = require("./models/Goal");
const User = require("./models/User");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("GoalTrack Backend is running!");
});

// ===============================
// REGISTER
// ===============================

app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please fill all fields."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            message: "Registration successful!",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            message: "Registration failed."
        });
    }
});

// ===============================
// LOGIN
// ===============================

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter email and password."
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password."
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Login failed."
        });
    }
});

// ===============================
// GET LOGGED-IN USER'S GOALS
// ===============================

app.get("/api/goals", authMiddleware, async (req, res) => {
    try {
        const goals = await Goal.find({
            userId: req.userId
        });

        res.json(goals);

    } catch (error) {
        console.error("Fetch goals error:", error);
        res.status(500).json({
            message: "Error fetching goals."
        });
    }
});

// ===============================
// ADD A GOAL
// ===============================

app.post("/api/goals", authMiddleware, async (req, res) => {
    try {
        const { title, subject, deadline, priority, progress } = req.body;

        if (!title) {
            return res.status(400).json({
                message: "Goal title is required."
            });
        }

        const goal = new Goal({
            userId: req.userId,
            title,
            subject,
            deadline,
            priority,
            progress
        });

        await goal.save();

        res.status(201).json({
            message: "Goal added successfully!",
            goal
        });

    } catch (error) {
        console.error("Add goal error:", error);
        res.status(500).json({
            message: "Error adding goal."
        });
    }
});

// ===============================
// UPDATE A GOAL
// ===============================

app.put("/api/goals/:id", authMiddleware, async (req, res) => {
    try {
        const { title, subject, deadline, priority, progress } = req.body;

        const updatedGoal = await Goal.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.userId
            },
            {
                title,
                subject,
                deadline,
                priority,
                progress
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedGoal) {
            return res.status(404).json({
                message: "Goal not found."
            });
        }

        res.json({
            message: "Goal updated successfully!",
            goal: updatedGoal
        });

    } catch (error) {
        console.error("Update goal error:", error);
        res.status(500).json({
            message: "Error updating goal."
        });
    }
});

// ===============================
// DELETE A GOAL
// ===============================

app.delete("/api/goals/:id", authMiddleware, async (req, res) => {
    try {
        const deletedGoal = await Goal.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!deletedGoal) {
            return res.status(404).json({
                message: "Goal not found."
            });
        }

        res.json({
            message: "Goal deleted successfully!"
        });

    } catch (error) {
        console.error("Delete goal error:", error);
        res.status(500).json({
            message: "Error deleting goal."
        });
    }
});

// ===============================
// START SERVER
// ===============================

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing from .env file.");
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully!");

        app.listen(5000, () => {
            console.log("GoalTrack server running on port 5000");
        });
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });
