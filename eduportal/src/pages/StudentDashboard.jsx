import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { quizzesAPI, attendanceAPI, notificationsAPI } from "../api";
import VideosPanel      from "../components/VideosPanel";
import AssignmentsPanel  from "../components/AssignmentsPanel";
import LessonPlanPanel   from "../components/LessonPlanPanel";
import TimetablePanel   from "../components/TimetablePanel";
import MessagesPanel    from "../components/MessagesPanel";

const NAV_ITEMS = [
  { id: "overview",      label: "Overview",      icon: "⊞" },
  { id: "quizzes",       label: "Quizzes",        icon: "✎" },
  { id: "attendance",    label: "Attendance",     icon: "✓" },
  { id: "grades",        label: "Grades",         icon: "★" },
  { id: "notifications", label: "Notifications",  icon: "🔔" },
  { id: "assignments",   label: "Assignments",    icon: "📋" },
  { id: "messages",      label: "Messages",       icon: "✉" },
  { id: "timetable",     label: "Timetable",      icon: "📅" },
  { id: "lesson-plan",   label: "Lesson Plan",    icon: "📖" },
  { id: "videos",        label: "Videos",         icon: "▶" },
];

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');

  :root {
    --purple: #7C3AED;
    --purple-light: #A78BFA;
    --purple-soft: #EDE9FE;
    --purple-mid: #DDD6FE;
    --bg: #F5F3FF;
    --surface: #FFFFFF;
    --surface2: #FAFAF9;
    --border: #E5E7EB;
    --text: #0F172A;
    --muted: #64748B;
    --faint: #94A3B8;
    --green: #059669;
    --amber: #D97706;
    --red: #EF4444;
    --sidebar-w: 240px;
    --header-h: 56px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { font-family: 'Sora', sans-serif; background: var(--bg); color: var(--text); }

  /* ── LAYOUT ── */
  .s-root { display: flex; min-height: 100vh; font-family: 'Sora', sans-serif; }

  /* ── OVERLAY ── */
  .s-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(15,23,42,.45);
    backdrop-filter: blur(3px);
    z-index: 40;
  }
  .s-overlay.open { display: block; }

  /* ── SIDEBAR ── */
  .s-sidebar {
    position: fixed; top: 0; left: 0; bottom: 0;
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1.5px solid var(--border);
    display: flex; flex-direction: column;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform .28s cubic-bezier(.4,0,.2,1);
  }
  .s-sidebar.open { transform: translateX(0); }

  @media (min-width: 768px) {
    .s-sidebar { transform: translateX(0); }
  }

  .s-logo {
    display: flex; align-items: center; gap: 10px;
    padding: 16px 14px;
    border-bottom: 1.5px solid var(--bg);
  }
  .s-logo-icon {
    width: 32px; height: 32px;
    background: var(--purple);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 14px;
  }
  .s-logo-text {
    font-family: 'Playfair Display', serif;
    font-weight: 800; font-size: 15px; color: var(--text);
  }

  .s-user-chip {
    margin: 10px 10px 4px;
    background: var(--purple-soft);
    border: 1px solid var(--purple-mid);
    border-radius: 10px;
    padding: 10px 12px;
  }
  .s-user-role {
    font-size: 10px; font-weight: 700; color: var(--purple);
    text-transform: uppercase; letter-spacing: .5px;
  }
  .s-user-name {
    font-size: 13px; font-weight: 700; color: var(--text); margin-top: 2px;
  }

  .s-nav {
    flex: 1; padding: 6px 8px;
    display: flex; flex-direction: column; gap: 2px;
    overflow-y: auto;
  }

  .s-nav-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 12px; border-radius: 9px;
    border: none; background: none; width: 100%;
    font-size: 13px; font-weight: 500; color: var(--muted);
    cursor: pointer; font-family: 'Sora', sans-serif;
    transition: all .18s ease; text-align: left;
    position: relative;
  }
  .s-nav-btn:hover {
    background: var(--purple-soft); color: var(--text);
    transform: translateX(2px);
  }
  .s-nav-btn.active {
    background: var(--purple-soft); color: var(--purple);
    font-weight: 700;
    box-shadow: inset 3px 0 0 var(--purple);
  }
  .s-nav-icon { font-size: 14px; width: 18px; text-align: center; }
  .s-unread-badge {
    margin-left: auto;
    background: var(--red); color: #fff;
    border-radius: 999px; font-size: 10px; font-weight: 800;
    padding: 1px 6px; min-width: 18px; text-align: center;
  }

  .s-nav-footer {
    padding: 8px 8px 12px;
    border-top: 1.5px solid var(--bg);
    display: flex; flex-direction: column; gap: 2px;
  }

  /* ── MAIN ── */
  .s-main {
    flex: 1;
    display: flex; flex-direction: column;
    min-height: 100vh;
    transition: margin-left .28s cubic-bezier(.4,0,.2,1);
  }
  @media (min-width: 768px) {
    .s-main { margin-left: var(--sidebar-w); }
  }

  /* ── HEADER ── */
  .s-header {
    position: sticky; top: 0; z-index: 30;
    height: var(--header-h);
    background: var(--surface);
    border-bottom: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 16px;
    gap: 12px;
  }
  .s-header-left { display: flex; align-items: center; gap: 10px; }
  .s-hamburger {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px;
    background: var(--bg); border: 1.5px solid var(--border);
    border-radius: 9px; cursor: pointer;
    transition: all .15s;
  }
  .s-hamburger:hover { background: var(--purple-soft); border-color: var(--purple-mid); }
  @media (min-width: 768px) { .s-hamburger { display: none; } }

  .s-header-title {
    font-size: 14px; font-weight: 700; color: var(--text); text-transform: capitalize;
  }
  .s-header-right { display: flex; align-items: center; gap: 8px; }

  .s-notif-pill {
    display: flex; align-items: center; gap: 5px;
    background: #FEF2F2; border: 1.5px solid #FECACA;
    border-radius: 20px; padding: 4px 10px;
    font-size: 12px; font-weight: 700; color: var(--red);
    cursor: pointer; transition: all .15s;
  }
  .s-notif-pill:hover { background: #FEE2E2; }

  .s-avatar {
    width: 34px; height: 34px;
    background: var(--purple);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 800; font-size: 13px;
    flex-shrink: 0;
  }

  /* ── CONTENT ── */
  .s-content { padding: 20px 16px; }
  @media (min-width: 640px) { .s-content { padding: 24px 20px; } }
  @media (min-width: 1024px) { .s-content { padding: 28px 28px; } }

  /* ── FADE ANIMATION ── */
  .fade { animation: fadeUp .35s ease both; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── KPI CARDS ── */
  .s-kpi-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px; margin-bottom: 20px;
  }
  @media (min-width: 480px) { .s-kpi-grid { grid-template-columns: repeat(3, 1fr); } }

  .s-kpi {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 14px;
    padding: 18px 16px;
    display: flex; align-items: center; gap: 14px;
    transition: box-shadow .2s;
  }
  .s-kpi:hover { box-shadow: 0 4px 16px rgba(124,58,237,.1); }
  .s-kpi-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .s-kpi-val {
    font-family: 'Playfair Display', serif;
    font-size: 26px; font-weight: 800; line-height: 1;
  }
  .s-kpi-label { font-size: 12px; color: var(--muted); margin-top: 3px; font-weight: 500; }

  /* ── CARD ── */
  .s-card {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 14px;
    padding: 20px 16px;
    margin-bottom: 14px;
  }
  @media (min-width: 640px) { .s-card { padding: 20px; } }
  .s-card-title {
    font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 14px;
    display: flex; align-items: center; gap: 7px;
  }

  /* ── NOTIF BANNER ── */
  .s-notif-banner {
    background: #FEF3C7; border: 1.5px solid #FDE68A; border-radius: 12px;
    padding: 12px 14px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 10px;
    flex-wrap: wrap; gap: 8px;
  }
  .s-notif-banner-text { flex: 1; min-width: 140px; }
  .s-notif-banner-title { font-size: 13px; font-weight: 700; color: #92400E; }
  .s-notif-banner-sub { font-size: 11px; color: #B45309; margin-top: 1px; }

  /* ── QUIZ ROW ── */
  .s-quiz-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px;
    background: var(--purple-soft);
    border: 1.5px solid var(--purple-mid);
    border-radius: 11px; margin-bottom: 8px;
    gap: 10px; flex-wrap: wrap;
  }
  .s-quiz-info { flex: 1; min-width: 120px; }
  .s-quiz-title { font-size: 14px; font-weight: 700; color: var(--text); }
  .s-quiz-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }

  /* ── BUTTONS ── */
  .btn-primary {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 8px 16px; border-radius: 9px;
    background: var(--purple); color: #fff;
    border: none; font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: 'Sora', sans-serif;
    transition: all .18s; white-space: nowrap;
  }
  .btn-primary:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: .5; cursor: not-allowed; }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 14px; border-radius: 9px;
    background: var(--bg); color: var(--muted);
    border: 1.5px solid var(--border);
    font-size: 12px; font-weight: 600;
    cursor: pointer; font-family: 'Sora', sans-serif;
    transition: all .18s; white-space: nowrap;
  }
  .btn-ghost:hover { border-color: var(--purple-mid); color: var(--purple); background: var(--purple-soft); }

  .btn-success {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 8px 16px; border-radius: 9px;
    background: var(--green); color: #fff;
    border: none; font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: 'Sora', sans-serif;
    transition: all .18s;
  }
  .btn-success:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .btn-success:disabled { opacity: .55; cursor: not-allowed; }

  /* ── QUIZ TAKING ── */
  .s-quiz-wrap { max-width: 680px; margin: 0 auto; }
  .s-progress-bar {
    height: 5px; background: var(--purple-mid);
    border-radius: 3px; overflow: hidden; margin-bottom: 20px;
  }
  .s-progress-fill {
    height: 100%; background: var(--purple);
    border-radius: 3px; transition: width .3s ease;
  }
  .s-q-card {
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 14px; padding: 18px 16px; margin-bottom: 12px;
  }
  @media (min-width: 640px) { .s-q-card { padding: 20px; } }
  .s-q-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .s-q-num { font-size: 11px; font-weight: 700; color: var(--faint); }
  .badge {
    display: inline-flex; padding: 2px 8px; border-radius: 999px;
    font-size: 10px; font-weight: 700;
  }
  .badge-mcq { background: #EFF6FF; color: #2563EB; }
  .badge-tf  { background: #ECFDF5; color: #059669; }
  .badge-sa  { background: #FEF3C7; color: #D97706; }
  .s-q-pts { font-size: 11px; color: var(--faint); margin-left: auto; }
  .s-q-text { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 14px; line-height: 1.5; }

  .s-opt {
    width: 100%; padding: 11px 14px; border-radius: 9px;
    border: 1.5px solid var(--border);
    background: var(--surface2);
    text-align: left; cursor: pointer; font-size: 13px;
    color: var(--muted); transition: all .18s;
    font-family: 'Sora', sans-serif;
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 7px;
  }
  .s-opt:hover { border-color: var(--purple-mid); background: var(--purple-soft); color: var(--text); }
  .s-opt.selected { border-color: var(--purple); background: var(--purple-soft); color: var(--purple); font-weight: 600; }
  .s-opt-circle {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 11px; flex-shrink: 0;
    background: var(--border); color: var(--muted);
    transition: all .18s;
  }
  .s-opt.selected .s-opt-circle { background: var(--purple); color: #fff; }

  .s-short-inp {
    width: 100%; padding: 10px 14px;
    border: 1.5px solid var(--border); border-radius: 9px;
    font-size: 13px; color: var(--text);
    font-family: 'Sora', sans-serif; outline: none;
    transition: border .2s; background: var(--surface2);
  }
  .s-short-inp:focus { border-color: var(--purple); background: #fff; }

  /* ── RESULT CARD ── */
  .s-result-wrap { max-width: 420px; margin: 40px auto; }
  .s-result-card {
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 18px; padding: 40px 28px; text-align: center;
  }
  .s-result-circle {
    width: 100px; height: 100px; border-radius: 50%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    margin: 0 auto 20px; border: 4px solid;
  }
  .s-result-pct {
    font-family: 'Playfair Display', serif;
    font-size: 28px; font-weight: 800; line-height: 1;
  }
  .s-result-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px; font-weight: 800; margin-bottom: 6px;
  }

  /* ── ATTENDANCE ── */
  .s-att-grid {
    display: grid; grid-template-columns: 1fr;
    gap: 12px; margin-bottom: 16px;
  }
  @media (min-width: 480px) { .s-att-grid { grid-template-columns: repeat(3, 1fr); } }

  .s-att-record {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 12px; border-radius: 9px;
    border: 1.5px solid; margin-bottom: 7px;
    font-size: 13px;
  }

  /* ── GRADES ── */
  .s-grade-row { margin-bottom: 16px; }
  .s-grade-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 6px;
  }
  .s-grade-title { font-size: 13px; font-weight: 700; color: var(--text); }
  .s-grade-date { font-size: 11px; color: var(--faint); margin-top: 1px; }
  .s-grade-pct {
    font-family: 'Playfair Display', serif;
    font-size: 20px; font-weight: 800; text-align: right; line-height: 1;
  }
  .s-grade-pts { font-size: 11px; color: var(--faint); text-align: right; margin-top: 1px; }
  .pbar { height: 5px; background: var(--border); border-radius: 3px; overflow: hidden; margin-top: 4px; }
  .pfill { height: 100%; border-radius: 3px; transition: width .8s ease; }

  /* ── NOTIFICATIONS ── */
  .s-notif-item {
    padding: 14px 16px; border-radius: 12px;
    border: 1.5px solid var(--border);
    margin-bottom: 8px; cursor: pointer; transition: all .18s;
  }
  .s-notif-item.unread { border-color: var(--purple-mid); background: var(--purple-soft); }
  .s-notif-top {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 5px; gap: 8px; flex-wrap: wrap;
  }
  .s-notif-title-row { display: flex; align-items: center; gap: 8px; }
  .s-notif-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .s-notif-title-text { font-weight: 700; font-size: 13px; color: var(--text); }
  .s-notif-date { font-size: 11px; color: var(--faint); white-space: nowrap; }
  .s-notif-msg { font-size: 13px; color: #374151; margin-bottom: 6px; line-height: 1.5; }
  .s-notif-chips { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .s-notif-type-chip {
    font-size: 10px; padding: 2px 8px; border-radius: 999px; font-weight: 700;
  }
  .s-notif-sender { font-size: 11px; color: var(--faint); }

  /* ── TOAST ── */
  .s-toast {
    position: fixed; bottom: 20px; right: 20px;
    padding: 13px 18px; border-radius: 12px;
    font-size: 13px; font-weight: 700;
    z-index: 300; max-width: 320px;
    animation: slideToast .3s ease;
    font-family: 'Sora', sans-serif;
    box-shadow: 0 8px 24px rgba(0,0,0,.15);
  }
  @keyframes slideToast {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .s-toast.success { background: linear-gradient(135deg, #059669, #10B981); color: #fff; }
  .s-toast.error   { background: linear-gradient(135deg, #DC2626, #EF4444); color: #fff; }

  /* ── EMPTY STATE ── */
  .s-empty {
    text-align: center; padding: 40px 20px;
    color: var(--faint); font-size: 13px;
  }
  .s-empty-icon { font-size: 36px; margin-bottom: 10px; }

  /* ── SCROLLBAR ── */
  .s-nav::-webkit-scrollbar { width: 3px; }
  .s-nav::-webkit-scrollbar-thumb { background: var(--purple-mid); border-radius: 2px; }
`;

export default function StudentDashboard() {
  const { user, logout }           = useAuth();
  const navigate                    = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab]               = useState("overview");

  const [quizzes,    setQuizzes]    = useState([]);
  const [myResults,  setMyResults]  = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizData,   setQuizData]   = useState(null);
  const [answers,    setAnswers]    = useState({});
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);

  const [attendance, setAttendance] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type="success") => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3500);
  };

  useEffect(()=>{
    quizzesAPI.available().then(d=>setQuizzes(Array.isArray(d)?d:(d.results||[]))).catch(()=>{});
    quizzesAPI.myResults().then(d=>setMyResults(Array.isArray(d)?d:(d.results||[]))).catch(()=>{});
    attendanceAPI.myHistory().then(setAttendance).catch(()=>{});
    notificationsAPI.list().then(d=>{
      setNotifications(d.notifications||[]);
      setUnread(d.unread||0);
    }).catch(()=>{});
  },[]);

  const startQuiz = async (q) => {
    setLoading(true);
    try {
      const data=await quizzesAPI.take(q.id);
      setQuizData(data); setActiveQuiz(q);
      setAnswers({}); setResult(null); setTab("quiz");
    } catch(e){ showToast(e?.error||"Cannot start quiz","error"); }
    finally { setLoading(false); }
  };

  const submitQuiz = async () => {
    const answersList = Object.entries(answers).map(([qid,ans])=>{
      const q=quizData.questions.find(q=>q.id===parseInt(qid));
      if (!q) return null;
      return q.question_type==="short_answer"
        ?{question_id:parseInt(qid),short_answer_text:ans}
        :{question_id:parseInt(qid),choice_id:parseInt(ans)};
    }).filter(Boolean);
    try {
      const res=await quizzesAPI.submit(activeQuiz.id,answersList);
      setResult(res);
      setQuizzes(qs=>qs.filter(q=>q.id!==activeQuiz.id));
      quizzesAPI.myResults().then(d=>setMyResults(Array.isArray(d)?d:(d.results||[]))).catch(()=>{});
    } catch(e){ showToast(e?.error||"Submit failed","error"); }
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(n=>n.map(x=>({...x,is_read:true})));
      setUnread(0);
    } catch {}
  };

  const markOneRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(n=>n.map(x=>x.id===id?{...x,is_read:true}:x));
      setUnread(u=>Math.max(0,u-1));
    } catch {}
  };

  const scoreColor = (p) => p>=80 ? "#059669" : p>=60 ? "#D97706" : "#EF4444";
  const scoreBg    = (p) => p>=80 ? "#ECFDF5" : p>=60 ? "#FEF3C7" : "#FEF2F2";
  const rate = attendance?.attendance_rate || 0;
  const avg  = myResults.length
    ? Math.round(myResults.reduce((a,r)=>a+(r.percentage||0),0)/myResults.length)
    : 0;
  const answered = Object.keys(answers).length;
  const totalQs  = quizData?.questions?.length || 0;
  const remaining = totalQs - answered;

  const notifColor = (t) => t==="info"?"#2563EB":t==="warning"?"#D97706":"#059669";
  const notifBg    = (t) => t==="info"?"#EFF6FF":t==="warning"?"#FEF3C7":"#ECFDF5";

  const getFileUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const base = (process.env.REACT_APP_API_URL||"http://localhost:8000").replace(/\/$/,"");
    return base + path;
  };

  const navTo = (id) => {
    setTab(id);
    setActiveQuiz(null);
    setResult(null);
    setSidebarOpen(false);
    if (id==="notifications" && unread>0) markAllRead();
  };

  const currentLabel = NAV_ITEMS.find(n=>n.id===tab)?.label
    || (tab==="quiz" && activeQuiz ? activeQuiz.title : tab);

  const firstName = user?.first_name || user?.full_name || "S";

  return (
    <div className="s-root">
      <style>{S}</style>

      {/* Overlay */}
      <div className={`s-overlay${sidebarOpen?" open":""}`} onClick={()=>setSidebarOpen(false)}/>

      {/* Sidebar */}
      <aside className={`s-sidebar${sidebarOpen?" open":""}`}>
        <div className="s-logo">
          <div className="s-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <span className="s-logo-text">EduPortal</span>
        </div>

        <div className="s-user-chip">
          <div className="s-user-role">Student</div>
          <div className="s-user-name">{user?.full_name || user?.first_name || "Student"}</div>
        </div>

        <nav className="s-nav">
          {NAV_ITEMS.map(n=>(
            <button
              key={n.id}
              className={`s-nav-btn${tab===n.id||tab==="quiz"&&n.id==="quizzes"?" active":""}`}
              onClick={()=>navTo(n.id)}
            >
              <span className="s-nav-icon">{n.icon}</span>
              {n.label}
              {n.id==="notifications" && unread>0 && (
                <span className="s-unread-badge">{unread}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="s-nav-footer">
          <button className="s-nav-btn" onClick={()=>{ navigate("/profile"); setSidebarOpen(false); }}>
            <span className="s-nav-icon">👤</span> My Profile
          </button>
          <button className="s-nav-btn" style={{color:"#EF4444"}} onClick={()=>{logout();navigate("/");}}>
            <span className="s-nav-icon">→</span> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="s-main">
        {/* Header */}
        <header className="s-header">
          <div className="s-header-left">
            <button className="s-hamburger" onClick={()=>setSidebarOpen(true)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="s-header-title">{currentLabel}</span>
          </div>
          <div className="s-header-right">
            {unread>0 && tab!=="notifications" && (
              <button className="s-notif-pill" onClick={()=>navTo("notifications")}>
                🔔 {unread} new
              </button>
            )}
            <div className="s-avatar">{firstName.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        {/* Content */}
        <div className="s-content">

          {/* ══ OVERVIEW ══ */}
          {tab==="overview" && (
            <div className="fade">
              <div className="s-kpi-grid">
                {[
                  { label:"Attendance", val:`${rate}%`, color:"#7C3AED", bg:"#EDE9FE", icon:"📊" },
                  { label:"Avg Score",  val:`${avg}%`,  color:"#059669", bg:"#ECFDF5", icon:"⭐" },
                  { label:"Quizzes Left", val: quizzes.filter(q=>!q.already_attempted).length, color:"#D97706", bg:"#FEF3C7", icon:"✎" },
                ].map(k=>(
                  <div key={k.label} className="s-kpi">
                    <div className="s-kpi-icon" style={{background:k.bg}}>{k.icon}</div>
                    <div>
                      <div className="s-kpi-val" style={{color:k.color}}>{k.val}</div>
                      <div className="s-kpi-label">{k.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {unread>0 && (
                <div className="s-notif-banner">
                  <span style={{fontSize:18}}>🔔</span>
                  <div className="s-notif-banner-text">
                    <div className="s-notif-banner-title">
                      {unread} unread notification{unread>1?"s":""}
                    </div>
                    <div className="s-notif-banner-sub">Tap to view</div>
                  </div>
                  <button className="btn-primary" style={{background:"#D97706",fontSize:12,padding:"6px 12px"}}
                    onClick={()=>navTo("notifications")}>
                    View →
                  </button>
                </div>
              )}

              <div className="s-card">
                <div className="s-card-title">✎ Available Quizzes</div>
                {quizzes.filter(q=>!q.already_attempted).length===0
                  ? <div className="s-empty"><div className="s-empty-icon">🎉</div>No quizzes available right now.</div>
                  : quizzes.filter(q=>!q.already_attempted).slice(0,3).map(q=>(
                    <div key={q.id} className="s-quiz-row">
                      <div className="s-quiz-info">
                        <div className="s-quiz-title">{q.title}</div>
                        <div className="s-quiz-sub">{q.question_count} questions · {q.class_room_name}</div>
                      </div>
                      <button className="btn-primary" disabled={loading} onClick={()=>startQuiz(q)}>
                        {loading?"…":"Start →"}
                      </button>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* ══ QUIZZES LIST ══ */}
          {tab==="quizzes" && !activeQuiz && (
            <div className="fade">
              {quizzes.length===0
                ? <div className="s-card"><div className="s-empty"><div className="s-empty-icon">📝</div>No quizzes assigned.</div></div>
                : quizzes.map(q=>(
                  <div key={q.id} className="s-card" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <div style={{width:44,height:44,borderRadius:11,background:q.already_attempted?"#ECFDF5":"#EDE9FE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                        {q.already_attempted?"✅":"✎"}
                      </div>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{q.title}</div>
                        <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>
                          {q.question_count} questions · {q.class_room_name}
                        </div>
                        {q.deadline && (
                          <div style={{fontSize:11,color:"#D97706",marginTop:1}}>
                            Due: {new Date(q.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    {q.already_attempted
                      ? <span style={{background:"#ECFDF5",color:"#059669",padding:"4px 12px",borderRadius:999,fontSize:12,fontWeight:700,flexShrink:0}}>✅ Done</span>
                      : <button className="btn-primary" disabled={loading} onClick={()=>startQuiz(q)}>Start Quiz</button>
                    }
                  </div>
                ))
              }
            </div>
          )}

          {/* ══ QUIZ TAKING ══ */}
          {tab==="quiz" && activeQuiz && !result && quizData && (
            <div className="fade s-quiz-wrap">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:13,color:"var(--muted)"}}>{answered}/{totalQs} answered</span>
                <button className="btn-ghost" onClick={()=>{setTab("quizzes");setActiveQuiz(null);}}>← Back</button>
              </div>
              <div className="s-progress-bar">
                <div className="s-progress-fill" style={{width:`${totalQs>0?(answered/totalQs)*100:0}%`}}/>
              </div>
              {quizData.questions?.map((q,i)=>(
                <div key={q.id} className="s-q-card">
                  <div className="s-q-meta">
                    <span className="s-q-num">Q{i+1}</span>
                    <span className={`badge badge-${q.question_type==="mcq"?"mcq":q.question_type==="true_false"?"tf":"sa"}`}>
                      {q.question_type==="mcq"?"MCQ":q.question_type==="true_false"?"True/False":"Short Answer"}
                    </span>
                    <span className="s-q-pts">{q.points} pt{q.points>1?"s":""}</span>
                  </div>
                  <p className="s-q-text">{q.text}</p>
                  {(q.question_type==="mcq"||q.question_type==="true_false") && q.choices?.map((c,ci)=>(
                    <button
                      key={c.id}
                      className={`s-opt${answers[q.id]===c.id?" selected":""}`}
                      onClick={()=>setAnswers(a=>({...a,[q.id]:c.id}))}
                    >
                      <span className="s-opt-circle">
                        {q.question_type==="true_false"
                          ? (c.text==="True"?"T":"F")
                          : ["A","B","C","D"][ci]
                        }
                      </span>
                      {c.text}
                    </button>
                  ))}
                  {q.question_type==="short_answer" && (
                    <input
                      className="s-short-inp"
                      placeholder="Type your answer..."
                      value={answers[q.id]||""}
                      onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))}
                    />
                  )}
                </div>
              ))}
              <button
                className="btn-success"
                style={{width:"100%",justifyContent:"center",padding:"13px",fontSize:14,marginTop:8}}
                disabled={remaining>0}
                onClick={submitQuiz}
              >
                {remaining>0 ? `Answer ${remaining} more question${remaining>1?"s":""}` : "Submit Quiz →"}
              </button>
            </div>
          )}

          {/* ══ RESULT ══ */}
          {tab==="quiz" && result && (
            <div className="fade s-result-wrap">
              <div className="s-result-card">
                <div className="s-result-circle" style={{borderColor:scoreColor(result.percentage),background:scoreBg(result.percentage)}}>
                  <div className="s-result-pct" style={{color:scoreColor(result.percentage)}}>{result.percentage}%</div>
                </div>
                <div className="s-result-title">
                  {result.percentage>=80?"Excellent! 🎉":result.percentage>=60?"Good Job 👍":"Keep Going 💪"}
                </div>
                <p style={{fontSize:13,color:"var(--muted)",marginBottom:24}}>
                  {result.score}/{result.total_points} points
                </p>
                <button className="btn-primary" style={{width:"100%",justifyContent:"center",padding:"12px",fontSize:14}}
                  onClick={()=>{setTab("grades");setActiveQuiz(null);setResult(null);}}>
                  View My Results →
                </button>
              </div>
            </div>
          )}

          {/* ══ ATTENDANCE ══ */}
          {tab==="attendance" && (
            <div className="fade">
              {!attendance
                ? <div className="s-card"><p style={{color:"var(--faint)"}}>Loading...</p></div>
                : (
                  <>
                    <div className="s-att-grid">
                      {[
                        {l:"Rate",    v:`${attendance.attendance_rate}%`, c:"#7C3AED", bg:"#EDE9FE"},
                        {l:"Present", v:attendance.present_days,         c:"#059669", bg:"#ECFDF5"},
                        {l:"Absent",  v:attendance.absent_days,          c:"#EF4444", bg:"#FEF2F2"},
                      ].map(k=>(
                        <div key={k.l} className="s-kpi">
                          <div style={{flex:1, textAlign:"center"}}>
                            <div style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',serif",color:k.c}}>{k.v}</div>
                            <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>{k.l}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="s-card">
                      <div className="s-card-title">📅 History</div>
                      {attendance.records?.length===0
                        ? <div className="s-empty">No records yet.</div>
                        : attendance.records?.map(r=>(
                          <div key={r.id} className="s-att-record"
                            style={{
                              background:r.status==="present"?"#F0FDF4":"#FEF2F2",
                              borderColor:r.status==="present"?"#A7F3D0":"#FECACA"
                            }}>
                            <span style={{fontSize:13,color:"#374151"}}>{r.date}</span>
                            <span style={{fontSize:12,fontWeight:700,color:r.status==="present"?"#059669":"#EF4444"}}>
                              {r.status==="present"?"✓ Present":"✗ Absent"}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </>
                )
              }
            </div>
          )}

          {/* ══ GRADES ══ */}
          {tab==="grades" && (
            <div className="fade">
              <div className="s-card">
                <div className="s-card-title">⭐ Quiz Results</div>
                {myResults.length===0
                  ? <div className="s-empty"><div className="s-empty-icon">📝</div>No completed quizzes yet.</div>
                  : myResults.map(r=>(
                    <div key={r.id} className="s-grade-row">
                      <div className="s-grade-header">
                        <div>
                          <div className="s-grade-title">{r.quiz_title}</div>
                          <div className="s-grade-date">{new Date(r.submitted_at).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="s-grade-pct" style={{color:scoreColor(r.percentage)}}>{r.percentage}%</div>
                          <div className="s-grade-pts">{r.score}/{r.total_points} pts</div>
                        </div>
                      </div>
                      <div className="pbar">
                        <div className="pfill" style={{width:`${r.percentage}%`,background:scoreColor(r.percentage)}}/>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* ══ NOTIFICATIONS ══ */}
          {tab==="notifications" && (
            <div className="fade">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>
                  Notifications ({notifications.length})
                </div>
                {unread>0 && (
                  <button className="btn-ghost" style={{fontSize:12}} onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length===0
                ? <div className="s-card"><div className="s-empty"><div className="s-empty-icon">🔔</div>No notifications yet.</div></div>
                : notifications.map(n=>(
                  <div key={n.id}
                    className={`s-notif-item${!n.is_read?" unread":""}`}
                    onClick={()=>!n.is_read && markOneRead(n.id)}
                  >
                    <div className="s-notif-top">
                      <div className="s-notif-title-row">
                        {!n.is_read && <div className="s-notif-dot" style={{background:notifColor(n.notif_type)}}/>}
                        <span className="s-notif-title-text">{n.title}</span>
                      </div>
                      <span className="s-notif-date">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="s-notif-msg">{n.message}</p>
                    {n.file && (
                      <div style={{marginBottom:8}}>
                        {n.file.match(/\.(jpg|jpeg|png|webp)$/i)
                          ? <img src={getFileUrl(n.file)} alt="attachment" style={{maxWidth:"100%",maxHeight:180,borderRadius:8,border:"1px solid var(--border)"}}/>
                          : <a href={getFileUrl(n.file)} target="_blank" rel="noreferrer"
                              style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 10px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:7,color:"#2563EB",textDecoration:"none",fontSize:12,fontWeight:600}}
                              onClick={e=>e.stopPropagation()}>
                              📎 Download Attachment
                            </a>
                        }
                      </div>
                    )}
                    <div className="s-notif-chips">
                      <span className="s-notif-type-chip" style={{background:notifBg(n.notif_type),color:notifColor(n.notif_type)}}>
                        {n.notif_type}
                      </span>
                      <span className="s-notif-sender">from {n.sender_name}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {tab==="assignments"  && <div className="fade"><AssignmentsPanel accentColor="#7C3AED" accentBg="#F5F3FF"/></div>}
          {tab==="messages"     && <div className="fade"><MessagesPanel accentColor="#7C3AED" accentBg="#F5F3FF"/></div>}
          {tab==="lesson-plan"  && <div className="fade"><LessonPlanPanel accentColor="#7C3AED" accentBg="#F5F3FF" readOnly={true}/></div>}
          {tab==="videos"       && <div className="fade"><VideosPanel accentColor="#7C3AED" accentBg="#F5F3FF"/></div>}
          {tab==="timetable"    && <div className="fade"><TimetablePanel readOnly={true} accentColor="#7C3AED"/></div>}

        </div>
      </div>

      {toast && (
        <div className={`s-toast ${toast.type==="success"?"success":"error"}`}>{toast.msg}</div>
      )}
    </div>
  );
}
