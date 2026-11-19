
// ==========================================
// GOALTRACK - FRONTEND APPLICATION
// ==========================================

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const KEYS = {
  session: "goaltrack_demo_session",
  data: "goaltrack_data_v1"
};

const API_URL = "http://localhost:5000/api/goals";

// ==========================================
// AUTHENTICATION
// ==========================================

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + localStorage.getItem("goaltrack_token")
  };
}

// ==========================================
// DATE FUNCTIONS
// ==========================================

const todayISO = () => new Date().toISOString().slice(0, 10);

function getLocalToday() {
  const d = new Date();

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ==========================================
// GOAL FORMATTING
// ==========================================

function formatGoal(goal) {
  return {
    ...goal,
    id: goal._id,
    subject: goal.subject || "General",
    deadline: goal.deadline || "",
    priority: goal.priority || "Medium",
    progress: goal.progress || 0
  };
}

// ==========================================
// FETCH GOALS FROM MONGODB
// ==========================================

async function fetchGoals() {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: authHeaders()
  });

  if (!response.ok) {
    throw new Error("Could not fetch goals");
  }

  const goals = await response.json();

  return goals.map(formatGoal);
}

// ==========================================
// DEFAULT DATA
// ==========================================

const defaultData = () => ({
  goals: [
    {
      id: 1,
      title: "Complete JavaScript basics",
      subject: "Web Development",
      deadline: addDays(3),
      priority: "High",
      progress: 65
    },
    {
      id: 2,
      title: "Revise Discrete Mathematics",
      subject: "Mathematics",
      deadline: addDays(6),
      priority: "Medium",
      progress: 35
    },
    {
      id: 3,
      title: "Build my portfolio homepage",
      subject: "Personal Project",
      deadline: addDays(10),
      priority: "Low",
      progress: 100
    }
  ],

  habits: [
    {
      id: 1,
      name: "Study for 30 minutes",
      category: "Study",
      done: false,
      lastCompletedDate: ""
    },
    {
      id: 2,
      name: "Read 10 pages",
      category: "Learning",
      done: false,
      lastCompletedDate: ""
    },
    {
      id: 3,
      name: "Go for a walk",
      category: "Wellness",
      done: false,
      lastCompletedDate: ""
    }
  ],

  notes: [
    {
      id: 1,
      title: "Project ideas",
      body: "Explore a weekly study planner and a simple progress chart.",
      date: todayISO()
    }
  ],

  completedSessions: 0
});

// ==========================================
// GLOBAL VARIABLES
// ==========================================

let data = loadData();

let calendarDate = new Date();
let timerSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;
let currentMode = 25;
let editing = null;

// ==========================================
// LOCAL STORAGE
// ==========================================

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.data)) || defaultData();
  } catch {
    return defaultData();
  }
}

function saveData() {
  localStorage.setItem(KEYS.data, JSON.stringify(data));
}

// ==========================================
// DAILY HABIT RESET
// ==========================================

function resetHabitCheckInsForNewDay() {

  const today = getLocalToday();

  data.habits.forEach(h => {

    // Preserve old completed habits during migration
    if (h.done && !h.lastCompletedDate) {
      h.lastCompletedDate = today;
    }

    // Reset habits completed on previous days
    if (h.lastCompletedDate !== today) {
      h.done = false;
    }

  });

  saveData();
}

// ==========================================
// GENERAL FUNCTIONS
// ==========================================

function esc(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function dateLabel(value) {
  if (!value) return "";

  return new Date(value + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function toast(text) {
  const el = $("#toast");

  el.textContent = text;
  el.classList.add("show");

  clearTimeout(toast.timeout);

  toast.timeout = setTimeout(
    () => el.classList.remove("show"),
    2300
  );
}

// ==========================================
// USER SESSION
// ==========================================

function session() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.session));
  } catch {
    return null;
  }
}

const user = session();

if (!user || !localStorage.getItem("goaltrack_token")) {

  window.location.href = "pages/login.html";

} else {

  init();

}

// ==========================================
// INITIALIZE DASHBOARD
// ==========================================

async function init() {

  // Reset old daily habit check-ins first
  resetHabitCheckInsForNewDay();

  try {

    data.goals = await fetchGoals();

  } catch (error) {

    console.error("Error loading goals:", error);

    toast("Could not load goals. Please check your login and server.");

  }

  const name = user.name || "Student";

  $("#welcomeName").textContent = name.split(" ")[0];
  $("#topAvatar").textContent = name[0].toUpperCase();
  $("#profileAvatar").textContent = name[0].toUpperCase();

  $("#profileName").value = name;
  $("#profileEmail").value = user.email || "";

  $("#todayLabel").textContent = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).toUpperCase();

  bindNavigation();
  bindGoals();
  bindHabits();
  bindNotes();
  bindCalendar();
  bindTimer();
  bindAssistant();
  bindProfile();

  renderAll();

  // DARK MODE
  if (localStorage.getItem("goaltrack_dark") === "yes") {
    document.body.classList.add("dark");
  }

  $("#themeBtn").addEventListener("click", () => {

    document.body.classList.toggle("dark");

    localStorage.setItem(
      "goaltrack_dark",
      document.body.classList.contains("dark") ? "yes" : "no"
    );

  });

  // LOGOUT
  $("#logoutBtn").addEventListener("click", () => {

    localStorage.removeItem(KEYS.session);
    localStorage.removeItem("goaltrack_token");

    window.location.href = "pages/login.html";

  });

  // MOBILE MENU
  $("#menuBtn").addEventListener("click", () => {

    $("#sidebar").classList.toggle("open");

  });

}

// ==========================================
// NAVIGATION
// ==========================================

function goTo(section) {

  $$(".page-section").forEach(s =>
    s.classList.toggle("active", s.id === "section-" + section)
  );

  $$(".nav-link[data-section]").forEach(b =>
    b.classList.toggle("active", b.dataset.section === section)
  );

  $("#pageCrumb").textContent =
    section.charAt(0).toUpperCase() + section.slice(1);

  $("#sidebar").classList.remove("open");

  if (section === "calendar") renderCalendar();

  if (section === "analytics") renderAnalytics();

}

function bindNavigation() {

  $$(".nav-link[data-section]").forEach(b =>
    b.addEventListener("click", () => goTo(b.dataset.section))
  );

  $$("[data-go]").forEach(b =>
    b.addEventListener("click", () => goTo(b.dataset.go))
  );

  $("#profileAvatar").addEventListener("click", () => goTo("profile"));

  $("#topAvatar").addEventListener("click", () => goTo("profile"));

}

// ==========================================
// GOALS
// ==========================================

function bindGoals() {

  // ADD GOAL
  $("#addGoalBtn").addEventListener("click", () => {

    openModal("Add a goal", [
      {
        name: "title",
        label: "Goal title",
        placeholder: "e.g. Finish chapter 3",
        required: true
      },
      {
        name: "subject",
        label: "Subject or category",
        placeholder: "e.g. Mathematics",
        required: true
      },
      {
        name: "deadline",
        label: "Deadline",
        type: "date",
        required: true
      },
      {
        name: "priority",
        label: "Priority",
        type: "select",
        options: ["High", "Medium", "Low"],
        value: "Medium"
      }
    ], async values => {

      try {

        const response = await fetch(API_URL, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(values)
        });

        if (!response.ok) {
          throw new Error("Could not add goal");
        }

        const result = await response.json();

        data.goals.push(formatGoal(result.goal));

        saveData();
        renderAll();

        toast("Goal added successfully.");

      } catch (error) {

        console.error(error);

        toast("Could not add goal. Check your login and server.");

      }

    });

  });

  // SEARCH AND FILTER
  ["goalSearch", "goalStatusFilter", "goalPriorityFilter"].forEach(id => {

    $("#" + id).addEventListener(
      id === "goalSearch" ? "input" : "change",
      renderGoals
    );

  });

  // EDIT AND DELETE
  $("#goalCards").addEventListener("click", async e => {

    const btn = e.target.closest("[data-action]");

    if (!btn) return;

    const id = btn.dataset.id;

    const goal = data.goals.find(
      g => String(g.id) === String(id)
    );

    if (!goal) return;

    // DELETE GOAL
    if (btn.dataset.action === "delete" && confirm("Delete this goal?")) {

      try {

        const response = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
          headers: authHeaders()
        });

        if (!response.ok) {
          throw new Error("Could not delete goal");
        }

        data.goals = data.goals.filter(
          g => String(g.id) !== String(id)
        );

        saveData();
        renderAll();

        toast("Goal deleted.");

      } catch (error) {

        console.error(error);

        toast("Could not delete goal.");

      }

    }

    // EDIT GOAL
    if (btn.dataset.action === "edit") {

      openModal("Edit goal", [
        {
          name: "title",
          label: "Goal title",
          value: goal.title,
          required: true
        },
        {
          name: "subject",
          label: "Subject or category",
          value: goal.subject,
          required: true
        },
        {
          name: "deadline",
          label: "Deadline",
          type: "date",
          value: goal.deadline,
          required: true
        },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          options: ["High", "Medium", "Low"],
          value: goal.priority
        }
      ], async values => {

        try {

          const updatedValues = {
            ...values,
            progress: goal.progress
          };

          const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(updatedValues)
          });

          if (!response.ok) {
            throw new Error("Could not update goal");
          }

          const result = await response.json();

          const index = data.goals.findIndex(
            g => String(g.id) === String(id)
          );

          if (index !== -1) {
            data.goals[index] = formatGoal(result.goal);
          }

          saveData();
          renderAll();

          toast("Goal updated.");

        } catch (error) {

          console.error(error);

          toast("Could not update goal.");

        }

      });

    }

  });

  // UPDATE PROGRESS
  $("#goalCards").addEventListener("input", e => {

    if (!e.target.matches("[data-progress]")) return;

    const id = e.target.dataset.progress;

    const goal = data.goals.find(
      g => String(g.id) === String(id)
    );

    if (!goal) return;

    goal.progress = Number(e.target.value);

    const card = e.target.closest(".goal-card");

    card.querySelector(".goal-percent").textContent =
      goal.progress + "%";

    card.querySelector(".progress-fill").style.width =
      goal.progress + "%";

    renderStats();
    renderAnalytics();

  });

  // SAVE PROGRESS TO MONGODB
  $("#goalCards").addEventListener("change", async e => {

    if (!e.target.matches("[data-progress]")) return;

    const id = e.target.dataset.progress;

    const goal = data.goals.find(
      g => String(g.id) === String(id)
    );

    if (!goal) return;

    try {

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          title: goal.title,
          subject: goal.subject,
          deadline: goal.deadline,
          priority: goal.priority,
          progress: goal.progress
        })
      });

      if (!response.ok) {
        throw new Error("Could not save progress");
      }

      const result = await response.json();

      const index = data.goals.findIndex(
        g => String(g.id) === String(id)
      );

      if (index !== -1) {
        data.goals[index] = formatGoal(result.goal);
      }

      saveData();

      toast("Progress saved.");

    } catch (error) {

      console.error(error);

      toast("Could not save progress.");

    }

  });

}

// ==========================================
// DISPLAY GOALS
// ==========================================

function renderGoals() {

  const search = $("#goalSearch").value.toLowerCase();

  const status = $("#goalStatusFilter").value;

  const priority = $("#goalPriorityFilter").value;

  const filtered = data.goals.filter(g =>

    (g.title + " " + g.subject).toLowerCase().includes(search) &&

    (status === "all" ||
      (status === "completed" ? g.progress === 100 : g.progress < 100)) &&

    (priority === "all" || g.priority === priority)

  );

  $("#goalCards").innerHTML = filtered.length

    ? filtered.map(g => `

      <article class="goal-card">

        <div class="goal-card-top">

          <div>
            <h3>${esc(g.title)}</h3>
            <p class="goal-subject">${esc(g.subject)}</p>
          </div>

          <span class="priority-pill priority-${g.priority}">
            ${g.priority}
          </span>

        </div>

        <div class="goal-meta">
          <span>Due ${dateLabel(g.deadline)}</span>
          <strong class="goal-percent">${g.progress}%</strong>
        </div>

        <div class="progress-track">
          <div class="progress-fill" style="width:${g.progress}%"></div>
        </div>

        <div class="goal-card-actions">

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value="${g.progress}"
            data-progress="${g.id}"
            aria-label="Progress for ${esc(g.title)}"
          >

          <button data-action="edit" data-id="${g.id}">
            Edit
          </button>

          <button class="danger" data-action="delete" data-id="${g.id}">
            Delete
          </button>

        </div>

      </article>

    `).join("")

    : `<div class="empty-state" style="grid-column:1/-1">
        No matching goals. Try another search or add a new goal.
      </div>`;

}

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

function renderStats() {

  const total = data.goals.length;

  const done = data.goals.filter(
    g => g.progress === 100
  ).length;

  const avg = total
    ? Math.round(data.goals.reduce((s, g) => s + g.progress, 0) / total)
    : 0;

  $("#statTotal").textContent = total;
  $("#statCompleted").textContent = done;
  $("#statPending").textContent = total - done;
  $("#statProgress").textContent = avg + "%";

}

// ==========================================
// DASHBOARD
// ==========================================

function renderDashboard() {

  const top = data.goals.slice(0, 4);

  $("#dashboardGoals").innerHTML = top.length

    ? top.map(g => `

      <div class="compact-item">

        <i class="mini-dot"></i>

        <div class="compact-main">
          <strong>${esc(g.title)}</strong>
          <small>${esc(g.subject)} · ${g.progress}% complete</small>
        </div>

        <span class="compact-end">
          ${g.progress === 100 ? "Done" : dateLabel(g.deadline)}
        </span>

      </div>

    `).join("")

    : `<div class="empty-state">Add your first goal to get started.</div>`;

  const habits = data.habits.slice(0, 4);

  $("#dashboardHabits").innerHTML = habits.length

    ? habits.map(h => `

      <div class="compact-item">

        <i class="mini-dot" style="${h.done ? "background:#299b73" : ""}"></i>

        <div class="compact-main">
          <strong>${esc(h.name)}</strong>
          <small>${esc(h.category)}</small>
        </div>

        <span class="compact-end">
          ${h.done ? "Done ✓" : "Not yet"}
        </span>

      </div>

    `).join("")

    : `<div class="empty-state">Add a habit to build your routine.</div>`;

  const upcoming = data.goals
    .filter(g => g.progress < 100)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 4);

  $("#upcomingList").innerHTML = upcoming.length

    ? upcoming.map(g => `

      <div class="compact-item">

        <i class="mini-dot"></i>

        <div class="compact-main">
          <strong>${esc(g.title)}</strong>
          <small>${esc(g.subject)}</small>
        </div>

        <span class="compact-end">${dateLabel(g.deadline)}</span>

      </div>

    `).join("")

    : `<div class="empty-state">No upcoming deadlines.</div>`;

}

// ==========================================
// RENDER EVERYTHING
// ==========================================

function renderAll() {

  renderGoals();
  renderStats();
  renderDashboard();
  renderHabits();
  renderNotes();
  renderCalendar();
  renderAnalytics();
  renderRewards();

}

// ==========================================
// HABIT TRACKER
// ==========================================

function bindHabits() {

  // ADD HABIT
  $("#addHabitBtn").addEventListener("click", () => {

    openModal("Add a habit", [
      {
        name: "name",
        label: "Habit name",
        placeholder: "e.g. Read for 15 minutes",
        required: true
      },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: ["Study", "Learning", "Wellness", "Personal"],
        value: "Study"
      }
    ], v => {

      data.habits.push({
        id: Date.now(),
        ...v,
        done: false,
        lastCompletedDate: ""
      });

      saveData();
      renderAll();

      toast("Habit added.");

    });

  });

  // COMPLETE OR DELETE HABITS
  $("#habitList").addEventListener("click", e => {

    const check = e.target.closest("[data-habit-check]");

    const del = e.target.closest("[data-habit-delete]");

    // CHECK HABIT
    if (check) {

      const h = data.habits.find(
        x => x.id === Number(check.dataset.habitCheck)
      );

      if (h) {

        h.done = !h.done;

        h.lastCompletedDate = h.done
          ? getLocalToday()
          : "";

        saveData();
        renderAll();

      }

    }

    // DELETE HABIT
    if (del && confirm("Delete this habit?")) {

      data.habits = data.habits.filter(
        h => h.id !== Number(del.dataset.habitDelete)
      );

      saveData();
      renderAll();

      toast("Habit deleted.");

    }

  });

}

// ==========================================
// DISPLAY HABITS
// ==========================================

function renderHabits() {

  const done = data.habits.filter(h => h.done).length;

  const total = data.habits.length;

  const percent = total
    ? Math.round(done / total * 100)
    : 0;

  $("#habitCount").textContent = `${done} / ${total}`;

  $("#habitProgressBar").style.width = percent + "%";

  $("#habitEncouragement").textContent =

    total && done === total

      ? "Amazing! All habits completed today."

      : `${percent}% of today's habits complete.`;

  $("#habitList").innerHTML = total

    ? data.habits.map(h => `

      <article class="habit-card ${h.done ? "done" : ""}">

        <button
          class="habit-check"
          data-habit-check="${h.id}"
          aria-label="Toggle ${esc(h.name)}"
        >
          ${h.done ? "✓" : ""}
        </button>

        <div>
          <strong>${esc(h.name)}</strong>
          <small>${esc(h.category)}</small>
        </div>

        <button
          class="delete-habit"
          data-habit-delete="${h.id}"
          aria-label="Delete habit"
        >
          ×
        </button>

      </article>

    `).join("")

    : `<div class="empty-state" style="grid-column:1/-1">
        No habits yet. Add one small routine to begin.
      </div>`;

}

// ==========================================
// CALENDAR
// ==========================================

function bindCalendar() {

  $("#prevMonth").addEventListener("click", () => {

    calendarDate.setMonth(calendarDate.getMonth() - 1);

    renderCalendar();

  });

  $("#nextMonth").addEventListener("click", () => {

    calendarDate.setMonth(calendarDate.getMonth() + 1);

    renderCalendar();

  });

}

function renderCalendar() {

  const year = calendarDate.getFullYear();

  const month = calendarDate.getMonth();

  const first = new Date(year, month, 1);

  const start = first.getDay();

  const days = new Date(year, month + 1, 0).getDate();

  const prevDays = new Date(year, month, 0).getDate();

  $("#calendarMonth").textContent =
    calendarDate.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric"
    });

  let cells = "";

  for (let i = 0; i < 42; i++) {

    let day, date, outside = false;

    if (i < start) {

      day = prevDays - start + i + 1;

      date = new Date(year, month - 1, day);

      outside = true;

    } else if (i >= start + days) {

      day = i - start - days + 1;

      date = new Date(year, month + 1, day);

      outside = true;

    } else {

      day = i - start + 1;

      date = new Date(year, month, day);

    }

    const iso =
      `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;

    const has = data.goals.some(g => g.deadline === iso);

    const today = iso === todayISO();

    cells += `

      <div class="calendar-day ${outside ? "outside" : ""} ${today ? "today" : ""} ${has ? "has-event" : ""}"
        title="${has ? "Goal deadline" : ""}">
        ${day}
      </div>

    `;

  }

  $("#calendarDays").innerHTML = cells;

  const sorted = [...data.goals].sort(
    (a, b) => a.deadline.localeCompare(b.deadline)
  );

  $("#deadlineList").innerHTML = sorted.length

    ? sorted.map(g => `

      <div class="compact-item">

        <i class="mini-dot"></i>

        <div class="compact-main">
          <strong>${esc(g.title)}</strong>
          <small>${esc(g.subject)}</small>
        </div>

        <span class="compact-end">${dateLabel(g.deadline)}</span>

      </div>

    `).join("")

    : `<div class="empty-state">Your goal deadlines will appear here.</div>`;

}

// ==========================================
// ANALYTICS
// ==========================================

function renderAnalytics() {

  const total = data.goals.length;

  const done = data.goals.filter(
    g => g.progress === 100
  ).length;

  const avg = total
    ? Math.round(data.goals.reduce((s, g) => s + g.progress, 0) / total)
    : 0;

  const habitDone = data.habits.filter(h => h.done).length;

  const points = done * 50;

  $("#analyticsCompleted").textContent = done;
  $("#analyticsAverage").textContent = avg + "%";
  $("#analyticsHabits").textContent = habitDone;
  $("#analyticsPoints").textContent = points;

  $("#analyticsBars").innerHTML = data.goals.length

    ? data.goals.map(g => `

      <div class="analytics-row">

        <span title="${esc(g.title)}">${esc(g.title)}</span>

        <div class="progress-track">
          <div class="progress-fill" style="width:${g.progress}%"></div>
        </div>

        <strong>${g.progress}%</strong>

      </div>

    `).join("")

    : `<div class="empty-state">Add goals to see your progress.</div>`;

  const percent = total
    ? Math.round(done / total * 100)
    : 0;

  $("#donutPercent").textContent = percent + "%";

  $("#goalDonut").style.background =
    `conic-gradient(#8c63bf ${percent * 3.6}deg,#eeeaf3 0deg)`;

}

// ==========================================
// REWARDS
// ==========================================

function renderRewards() {

  const done = data.goals.filter(
    g => g.progress === 100
  ).length;

  const points = done * 50;

  $("#rewardPoints").textContent = points;

  const badges = [

    ["🌱", "First step", "Create your first goal", data.goals.length >= 1],

    ["🎯", "Goal getter", "Complete your first goal", done >= 1],

    ["🏅", "Rising star", "Complete 3 goals", done >= 3],

    ["🔥", "Habit builder", "Check in to all habits today",
      data.habits.length > 0 && data.habits.every(h => h.done)],

    ["💎", "Dedicated learner", "Earn 250 XP", points >= 250],

    ["👑", "Goal champion", "Complete 5 goals", done >= 5]

  ];

  $("#badgeGrid").innerHTML = badges.map(b => `

    <article class="achievement ${b[3] ? "" : "locked"}">

      <div class="achievement-icon">${b[0]}</div>

      <strong>${b[1]}</strong>

      <p>${b[2]}</p>

      <p>${b[3] ? "Unlocked" : "Locked"}</p>

    </article>

  `).join("");

}

// ==========================================
// NOTES
// ==========================================

function bindNotes() {

  // ADD NOTE
  $("#addNoteBtn").addEventListener("click", () => {

    openModal("Create a note", [
      {
        name: "title",
        label: "Note title",
        placeholder: "Give your note a title",
        required: true
      },
      {
        name: "body",
        label: "Your note",
        type: "textarea",
        placeholder: "Write your thoughts...",
        required: true
      }
    ], v => {

      data.notes.unshift({
        id: Date.now(),
        ...v,
        date: todayISO()
      });

      saveData();
      renderNotes();

      toast("Note saved.");

    });

  });

  // EDIT AND DELETE NOTE
  $("#notesGrid").addEventListener("click", e => {

    const btn = e.target.closest("[data-note-action]");

    if (!btn) return;

    const note = data.notes.find(
      n => n.id === Number(btn.dataset.id)
    );

    if (!note) return;

    // DELETE
    if (btn.dataset.noteAction === "delete" &&
        confirm("Delete this note?")) {

      data.notes = data.notes.filter(
        n => n.id !== note.id
      );

      saveData();
      renderNotes();

      toast("Note deleted.");

    }

    // EDIT
    if (btn.dataset.noteAction === "edit") {

      openModal("Edit note", [
        {
          name: "title",
          label: "Note title",
          value: note.title,
          required: true
        },
        {
          name: "body",
          label: "Your note",
          type: "textarea",
          value: note.body,
          required: true
        }
      ], v => {

        Object.assign(note, v, {
          date: todayISO()
        });

        saveData();
        renderNotes();

        toast("Note updated.");

      });

    }

  });

}

function renderNotes() {

  $("#notesGrid").innerHTML = data.notes.length

    ? data.notes.map(n => `

      <article class="note-card">

        <h3>${esc(n.title)}</h3>

        <p>${esc(n.body)}</p>

        <small>${dateLabel(n.date)}</small>

        <div class="note-actions">

          <button data-note-action="edit" data-id="${n.id}">
            Edit
          </button>

          <button data-note-action="delete" data-id="${n.id}">
            Delete
          </button>

        </div>

      </article>

    `).join("")

    : `<div class="empty-state" style="grid-column:1/-1">
        No notes yet. Create one to save an idea or reminder.
      </div>`;

}

// ==========================================
// FOCUS TIMER
// ==========================================

function bindTimer() {

  $$(".mode-button").forEach(b =>

    b.addEventListener("click", () => {

      stopTimer();

      currentMode = Number(b.dataset.minutes);

      timerSeconds = currentMode * 60;

      $$(".mode-button").forEach(x =>
        x.classList.toggle("active", x === b)
      );

      $("#timerModeLabel").textContent =
        currentMode === 25 ? "TIME TO FOCUS" : "TAKE A BREATHER";

      updateTimerDisplay();

      $("#timerStart").textContent = "Start";

    })

  );

  $("#timerStart").addEventListener("click", () => {

    if (timerRunning) {

      stopTimer();

      $("#timerStart").textContent = "Resume";

      return;

    }

    timerRunning = true;

    $("#timerStart").textContent = "Pause";

    timerInterval = setInterval(() => {

      timerSeconds--;

      updateTimerDisplay();

      if (timerSeconds <= 0) {

        stopTimer();

        if (currentMode === 25) {

          data.completedSessions++;

          saveData();

          renderAnalytics();

          toast("Focus session complete. Great work!");

        } else {

          toast("Break finished. Ready to focus?");

        }

        $("#timerStart").textContent = "Start again";

      }

    }, 1000);

  });

  $("#timerReset").addEventListener("click", () => {

    stopTimer();

    timerSeconds = currentMode * 60;

    updateTimerDisplay();

    $("#timerStart").textContent = "Start";

  });

}

function stopTimer() {

  clearInterval(timerInterval);

  timerRunning = false;

}

function updateTimerDisplay() {

  const m = Math.floor(timerSeconds / 60);

  const s = timerSeconds % 60;

  $("#timerDisplay").textContent =
    `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;

}

// ==========================================
// AI ASSISTANT DEMO
// ==========================================

function bindAssistant() {

  const responses = {

    plan: "Try a simple weekly plan: (1) Write down your three most important outcomes. (2) Break each outcome into 20–40 minute tasks. (3) Add realistic deadlines. (4) Leave a little buffer time. (5) Review your progress on Sunday.",

    focus: "Start with just 10 minutes. Choose one tiny task, put your phone out of reach, close unrelated tabs and work until the timer ends. You don't need to feel motivated before you begin.",

    deadline: "List every deadline and sort by due date. Mark urgent tasks as high priority, break large assignments into smaller steps and schedule the first step today. If the workload is unrealistic, ask for help early.",

    motivation: "You don't have to finish everything today. You only need to take the next useful step. Pick one task you can complete in 15 minutes and give yourself credit when it's done."

  };

  $$(".prompt-button").forEach(b =>

    b.addEventListener("click", () => {

      $("#assistantResponse").textContent =
        responses[b.dataset.prompt];

    })

  );

}

// ==========================================
// PROFILE
// ==========================================

function bindProfile() {

  $("#saveProfileBtn").addEventListener("click", () => {

    const name = $("#profileName").value.trim();

    if (!name) {

      toast("Please enter your name.");

      return;

    }

    const updated = {
      ...user,
      name
    };

    localStorage.setItem(
      KEYS.session,
      JSON.stringify(updated)
    );

    $("#welcomeName").textContent = name.split(" ")[0];

    $("#topAvatar").textContent = name[0].toUpperCase();

    $("#profileAvatar").textContent = name[0].toUpperCase();

    toast("Profile updated.");

  });

}

// ==========================================
// SHARED MODAL BUILDER
// ==========================================

function openModal(title, fields, onSave) {

  $("#modalTitle").textContent = title;

  $("#modalFields").innerHTML = fields.map(f => {

    const id = "modal-" + f.name;

    const required = f.required ? "required" : "";

    const value = f.value ?? "";

    if (f.type === "select") {

      return `

        <div class="form-field">

          <label for="${id}">${f.label}</label>

          <select id="${id}" name="${f.name}" ${required}>

            ${f.options.map(o => `

              <option ${o === (f.value || f.options[0]) ? "selected" : ""}>
                ${esc(o)}
              </option>

            `).join("")}

          </select>

        </div>

      `;

    }

    if (f.type === "textarea") {

      return `

        <div class="form-field">

          <label for="${id}">${f.label}</label>

          <textarea
            id="${id}"
            name="${f.name}"
            placeholder="${esc(f.placeholder || "")}"
            ${required}
          >${esc(value)}</textarea>

        </div>

      `;

    }

    return `

      <div class="form-field">

        <label for="${id}">${f.label}</label>

        <input
          id="${id}"
          name="${f.name}"
          type="${f.type || "text"}"
          value="${esc(value)}"
          placeholder="${esc(f.placeholder || "")}"
          ${required}
        >

      </div>

    `;

  }).join("");

  $("#modalBackdrop").classList.remove("hidden");

  const close = () =>
    $("#modalBackdrop").classList.add("hidden");

  $("#modalClose").onclick = close;

  $("#modalCancel").onclick = close;

  $("#modalForm").onsubmit = e => {

    e.preventDefault();

    const result = {};

    fields.forEach(f => {

      result[f.name] =
        $("#modal-" + f.name).value.trim();

    });

    if (result.deadline && result.deadline < todayISO()) {

      toast("Choose today or a future deadline.");

      return;

    }

    onSave(result);

    close();

  };

  $("#modalFields input")?.focus();

}
