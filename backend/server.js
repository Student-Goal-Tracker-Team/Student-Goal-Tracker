
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

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.send("GoalTrack Backend is running!");
});

// ==========================================
// USER REGISTRATION
// ==========================================

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

// ==========================================
// USER LOGIN
// ==========================================

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter email and password."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password."
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
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

// ==========================================
// GET ALL GOALS FOR LOGGED-IN USER
// ==========================================

app.get("/api/goals", authMiddleware, async (req, res) => {
    try {
        const goals = await Goal.find({
            userId: req.userId
        }).sort({ createdAt: -1 });

        res.json(goals);

    } catch (error) {
        console.error("Fetch goals error:", error);

        res.status(500).json({
            message: "Error fetching goals"
        });
    }
});

// ==========================================
// ADD NEW GOAL WITH CHECKLIST
// ==========================================

app.post("/api/goals", authMiddleware, async (req, res) => {
    try {
        const {
            title,
            subject,
            deadline,
            priority,
            checklist
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Goal title is required."
            });
        }

        const newChecklist = Array.isArray(checklist)
            ? checklist
                .filter(item =>
                    item &&
                    typeof item.text === "string" &&
                    item.text.trim()
                )
                .map(item => ({
                    text: item.text.trim(),
                    completed: Boolean(item.completed)
                }))
            : [];

        const newGoal = new Goal({
            userId: req.userId,
            title: title.trim(),
            subject: subject || "General",
            deadline: deadline || "",
            priority: priority || "Medium",
            checklist: newChecklist
        });

        await newGoal.save();

        res.status(201).json({
            message: "Goal added successfully!",
            goal: newGoal
        });

    } catch (error) {
        console.error("Add goal error:", error);

        res.status(500).json({
            message: "Error adding goal"
        });
    }
});

// ==========================================
// UPDATE GOAL AND CHECKLIST
// ==========================================

app.put("/api/goals/:id", authMiddleware, async (req, res) => {
    try {
        const goal = await Goal.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!goal) {
            return res.status(404).json({
                message: "Goal not found."
            });
        }

        if (req.body.title !== undefined) {
            goal.title = req.body.title;
        }

        if (req.body.subject !== undefined) {
            goal.subject = req.body.subject;
        }

        if (req.body.deadline !== undefined) {
            goal.deadline = req.body.deadline;
        }

        if (req.body.priority !== undefined) {
            goal.priority = req.body.priority;
        }

        if (req.body.checklist !== undefined) {
            if (!Array.isArray(req.body.checklist)) {
                return res.status(400).json({
                    message: "Checklist must be an array."
                });
            }

            goal.checklist = req.body.checklist.map(item => ({
                text: item.text.trim(),
                completed: Boolean(item.completed)
            }));
        }

        // Automatically calculates progress through the
        // pre-save middleware in Goal.js
        await goal.save();

        res.json({
            message: "Goal updated successfully!",
            goal
        });

    } catch (error) {
        console.error("Update goal error:", error);

        res.status(500).json({
            message: "Error updating goal"
        });
    }
});

// ==========================================
// DELETE GOAL
// ==========================================

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
            message: "Error deleting goal"
        });
    }
});

// ==========================================
// START SERVER AND CONNECT DATABASE
// ==========================================

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error("MONGO_URI or JWT_SECRET is missing from .env");
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully!");

        app.listen(PORT, () => {
            console.log(`GoalTrack server running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error("MongoDB connection error:", error);
    });
