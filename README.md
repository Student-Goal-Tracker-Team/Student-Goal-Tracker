# GoalTrack frontend

A responsive, purple-themed student productivity dashboard built with HTML, CSS and vanilla JavaScript.

## Run the project
1. Extract the ZIP file.
2. Open the `GoalTrack-Frontend` folder in VS Code.
3. Open `index.html` with the VS Code Live Server extension (recommended).
4. Create a demo account from the registration page.

## Included screens and features
- Demo registration and login
- Dashboard overview
- Goals: add, edit, delete, search, filter and progress slider
- Calendar with goal deadline markers
- Habit tracker
- Pomodoro focus timer
- Analytics overview
- XP points and achievement badges
- Notes
- Prepared study-assistant suggestions
- Profile display name and dark mode
- Responsive sidebar and mobile layout

## Important limitations
This is a frontend learning prototype. Demo accounts and app data are stored in browser `localStorage`. Passwords are not securely protected. Do not use real credentials or deploy this authentication as-is.

The AI Study Assistant currently shows prepared sample suggestions; it is not connected to an AI model. Calendar events and habits are local demo data. A production version needs a backend, database, secure password hashing, authentication sessions, server-side validation and a protected AI API integration.

## Suggested next step
After reviewing and testing the frontend, build a Node.js + Express backend and replace local demo storage with API calls and a database.
