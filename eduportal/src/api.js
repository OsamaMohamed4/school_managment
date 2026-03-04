const BASE = (process.env.REACT_APP_API_URL || "http://localhost:8000").replace(/\/$/, "");
const API  = BASE + "/api";

export const getToken = () => localStorage.getItem("access_token");
export const getUser  = () => { try { const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null; } catch { return null; } };
export const clearAuth = () => ["access_token","refresh_token","role","user"].forEach(k => localStorage.removeItem(k));

const setAuth = (d) => {
  localStorage.setItem("access_token",  d.access);
  localStorage.setItem("refresh_token", d.refresh);
  localStorage.setItem("role",          d.user.role);
  localStorage.setItem("user",          JSON.stringify(d.user));
};

const request = async (path, opts = {}) => {
  const token = getToken();
  // path starts with /  e.g.  /auth/login/
  const url = API + path;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...opts.headers,
    },
    ...opts,
  });

  if (res.status === 401) {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      const r = await fetch(API + "/auth/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (r.ok) {
        localStorage.setItem("access_token", (await r.json()).access);
        return request(path, opts);
      }
    }
    clearAuth();
    window.location.href = "/";
    return;
  }

  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

// ── AUTH ──────────────────────────────────────────────────────
export const authAPI = {
  login: async (email, password) => {
    const d = await request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAuth(d);
    return d;
  },
  me: () => request("/auth/me/"),
};

// ── USERS (Admin) ─────────────────────────────────────────────
export const usersAPI = {
  list:         (p = {}) => request("/auth/users/?" + new URLSearchParams(p)),
  create:       (d)      => request("/auth/users/",  { method: "POST", body: JSON.stringify(d) }),
  toggleStatus: (id)     => request("/auth/users/" + id + "/toggle-status/", { method: "PATCH" }),
};

// ── ACADEMICS ─────────────────────────────────────────────────
export const academicsAPI = {
  classes: {
    myClasses: () => request("/classes/my/"),
    myClass:   () => request("/classes/mine/"),
  },
};
// ── ATTENDANCE ────────────────────────────────────────────────
export const attendanceAPI = {
  submitBulk: (cid, date, records) =>
    request("/attendance/bulk/", { method: "POST", body: JSON.stringify({ class_room: cid, date, records }) }),
  myHistory: () => request("/attendance/my/"),
  byClass:   (cid, date) => request("/attendance/class/" + cid + "/?date=" + date),
};

// ── QUIZZES ───────────────────────────────────────────────────
export const quizzesAPI = {
  available: ()            => request("/quizzes/available/"),
  take:      (id)          => request("/quizzes/" + id + "/take/"),
  submit:    (id, answers) => request("/quizzes/" + id + "/take/", { method: "POST", body: JSON.stringify({ answers }) }),
  myResults: ()            => request("/quizzes/my-results/"),
};