
// =====================================
// GOALTRACK - BACKEND AUTHENTICATION
// =====================================

const API_URL = "http://localhost:5000/api/auth";

const SESSION_KEY = "goaltrack_demo_session";
const TOKEN_KEY = "goaltrack_token";

const message = document.getElementById("authMessage");

// =====================================
// PASSWORD SHOW / HIDE
// =====================================

document.querySelectorAll("[data-toggle='password']").forEach(button => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.toggle);

        input.type = input.type === "password" ? "text" : "password";

        button.textContent =
            input.type === "password" ? "Show" : "Hide";
    });
});

// =====================================
// REGISTER STUDENT
// =====================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async event => {

        event.preventDefault();

        const name = document.getElementById("name").value.trim();

        const email = document.getElementById("email").value.trim().toLowerCase();

        const password = document.getElementById("password").value;

        const confirm = document.getElementById("confirmPassword").value;

        if (password !== confirm) {
            message.textContent = "Passwords do not match.";
            return;
        }

        if (password.length < 8) {
            message.textContent = "Password must contain at least 8 characters.";
            return;
        }

        message.textContent = "Creating your account...";

        try {

            const response = await fetch(`${API_URL}/register`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    password
                })

            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Registration failed.");
            }

            message.textContent = "Registration successful! Please log in.";

            // Send student to login page
            window.location.href = "login.html";

        } catch (error) {

            console.error("Registration error:", error);

            message.textContent =
                error.message || "Cannot connect to server.";

        }

    });

}

// =====================================
// LOGIN STUDENT
// =====================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async event => {

        event.preventDefault();

        const email = document.getElementById("email").value.trim().toLowerCase();

        const password = document.getElementById("password").value;

        message.textContent = "Logging in...";

        try {

            const response = await fetch(`${API_URL}/login`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })

            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Login failed.");
            }

            // Save JWT token
            localStorage.setItem(TOKEN_KEY, result.token);

            // Save student session
            localStorage.setItem(SESSION_KEY, JSON.stringify({
                id: result.user.id,
                name: result.user.name,
                email: result.user.email
            }));

            // Open dashboard
            window.location.href = "../index.html";

        } catch (error) {

            console.error("Login error:", error);

            message.textContent =
                error.message || "Cannot connect to server.";

        }

    });

}
