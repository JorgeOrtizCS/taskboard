// Taskboard: a small task manager using Supabase (database + auth).

const client = window.supabase.createClient(
  window.APP_CONFIG.SUPABASE_URL,
  window.APP_CONFIG.SUPABASE_ANON_KEY
);

const STATUS_LABELS = { todo: "To do", doing: "In progress", done: "Done" };

// App state
let authMode = "login"; // "login" or "register"
let tasks = [];
let activeFilter = "all";
let editingId = null;
let currentUserId = null;

// Grab elements once
const $ = (id) => document.getElementById(id);
const authView = $("auth-view");
const appView = $("app-view");
const authMsg = $("auth-msg");
const appMsg = $("app-msg");

// ---------- Helpers ----------

function setMsg(el, text, type) {
  el.textContent = text || "";
  el.className = "msg" + (type ? " " + type : "");
}

function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function formatDate(dateStr) {
  // dateStr is YYYY-MM-DD; build a local date so it does not shift a day
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric"
  });
}

// ---------- Auth ----------

function setAuthMode(mode) {
  authMode = mode;
  $("tab-login").classList.toggle("active", mode === "login");
  $("tab-register").classList.toggle("active", mode === "register");
  $("auth-submit").textContent = mode === "login" ? "Log in" : "Create account";
  $("password").autocomplete = mode === "login" ? "current-password" : "new-password";
  setMsg(authMsg, "");
}

async function handleAuthSubmit() {
  const email = $("email").value.trim();
  const password = $("password").value;

  if (!email || !password) {
    setMsg(authMsg, "Enter your email and password.", "error");
    return;
  }
  if (password.length < 6) {
    setMsg(authMsg, "Password must be at least 6 characters.", "error");
    return;
  }

  setMsg(authMsg, "Working...");

  if (authMode === "register") {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) return setMsg(authMsg, error.message, "error");
    if (!data.session) {
      // Happens when email confirmation is turned on in Supabase
      setMsg(authMsg, "Account created. Check your email to confirm, then log in.", "ok");
    }
  } else {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return setMsg(authMsg, error.message, "error");
  }
  // On success, onAuthStateChange switches the screen for us.
}

async function handleLogout() {
  await client.auth.signOut();
}

// ---------- Screen switching ----------

function showAuth() {
  currentUserId = null;
  tasks = [];
  appView.hidden = true;
  authView.hidden = false;
  $("password").value = "";
}

async function showApp(user) {
  authView.hidden = true;
  appView.hidden = false;
  $("user-email").textContent = user.email;
  await loadTasks();
}

async function onSession(session) {
  if (!session) {
    showAuth();
    return;
  }
  // Token refreshes also fire this event; only reload when the user changes.
  if (session.user.id === currentUserId) return;
  currentUserId = session.user.id;
  await showApp(session.user);
}

// ---------- Database (CRUD) ----------

async function loadTasks() {
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    setMsg(appMsg, "Could not load tasks: " + error.message, "error");
    return;
  }
  tasks = data;
  render();
}

async function addTask() {
  const title = $("new-title").value.trim();
  const due = $("new-due").value;
  const status = $("new-status").value;

  if (!title) {
    setMsg(appMsg, "Give the task a title.", "error");
    return;
  }

  // user_id is filled in by the database (default auth.uid())
  const { error } = await client
    .from("tasks")
    .insert({ title, due_date: due || null, status });

  if (error) {
    setMsg(appMsg, "Could not add task: " + error.message, "error");
    return;
  }

  $("new-title").value = "";
  $("new-due").value = "";
  $("new-status").value = "todo";
  setMsg(appMsg, "Task added.", "ok");
  await loadTasks();
}

async function updateTask(id, changes) {
  const { error } = await client.from("tasks").update(changes).eq("id", id);
  if (error) {
    setMsg(appMsg, "Could not update task: " + error.message, "error");
    return false;
  }
  setMsg(appMsg, "Task updated.", "ok");
  await loadTasks();
  return true;
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  const { error } = await client.from("tasks").delete().eq("id", id);
  if (error) {
    setMsg(appMsg, "Could not delete task: " + error.message, "error");
    return;
  }
  setMsg(appMsg, "Task deleted.", "ok");
  await loadTasks();
}

// ---------- Rendering ----------

function makeButton(text, className, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  b.className = className;
  b.addEventListener("click", onClick);
  return b;
}

function renderTask(task) {
  const li = document.createElement("li");
  li.className = "task";
  li.dataset.status = task.status;

  const bar = document.createElement("div");
  bar.className = "bar";
  li.appendChild(bar);

  const body = document.createElement("div");
  const actions = document.createElement("div");
  actions.className = "actions";

  if (editingId === task.id) {
    // Edit mode
    const fields = document.createElement("div");
    fields.className = "edit-fields";

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = task.title;
    titleInput.maxLength = 120;
    titleInput.setAttribute("aria-label", "Task title");

    const dueInput = document.createElement("input");
    dueInput.type = "date";
    dueInput.value = task.due_date || "";
    dueInput.setAttribute("aria-label", "Due date");

    fields.append(titleInput, dueInput);
    body.appendChild(fields);

    actions.append(
      makeButton("Save", "primary", async () => {
        const newTitle = titleInput.value.trim();
        if (!newTitle) {
          setMsg(appMsg, "Title cannot be empty.", "error");
          return;
        }
        const ok = await updateTask(task.id, {
          title: newTitle,
          due_date: dueInput.value || null
        });
        if (ok) editingId = null;
        render();
      }),
      makeButton("Cancel", "ghost", () => {
        editingId = null;
        render();
      })
    );
  } else {
    // View mode
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = task.title;
    body.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "meta";
    if (task.due_date) {
      const overdue = task.status !== "done" && task.due_date < todayString();
      meta.textContent = (overdue ? "Overdue: " : "Due ") + formatDate(task.due_date);
      if (overdue) meta.classList.add("overdue");
    } else {
      meta.textContent = "No due date";
    }
    body.appendChild(meta);

    const select = document.createElement("select");
    select.setAttribute("aria-label", "Change status");
    for (const [value, label] of Object.entries(STATUS_LABELS)) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      if (value === task.status) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener("change", () => updateTask(task.id, { status: select.value }));

    actions.append(
      select,
      makeButton("Edit", "ghost", () => {
        editingId = task.id;
        render();
      }),
      makeButton("Delete", "ghost danger", () => deleteTask(task.id))
    );
  }

  li.append(body, actions);
  return li;
}

function render() {
  const list = $("task-list");
  list.replaceChildren();

  const visible = tasks.filter((t) => activeFilter === "all" || t.status === activeFilter);
  visible.forEach((t) => list.appendChild(renderTask(t)));
  $("empty").hidden = visible.length > 0;
}

// ---------- Wire up events ----------

$("tab-login").addEventListener("click", () => setAuthMode("login"));
$("tab-register").addEventListener("click", () => setAuthMode("register"));
$("auth-submit").addEventListener("click", handleAuthSubmit);
$("password").addEventListener("keydown", (e) => { if (e.key === "Enter") handleAuthSubmit(); });
$("logout-btn").addEventListener("click", handleLogout);
$("add-btn").addEventListener("click", addTask);
$("new-title").addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });

$("filters").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter");
  if (!btn) return;
  activeFilter = btn.dataset.filter;
  document.querySelectorAll(".filter").forEach((f) => f.classList.toggle("active", f === btn));
  render();
});

// ---------- Start ----------

client.auth.onAuthStateChange((_event, session) => {
  // Do not await Supabase calls directly inside this callback; defer them.
  setTimeout(() => onSession(session), 0);
});

(async function init() {
  const { data: { session } } = await client.auth.getSession();
  await onSession(session);
})();
