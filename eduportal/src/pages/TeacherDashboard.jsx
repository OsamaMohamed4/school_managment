import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { academicsAPI, attendanceAPI, quizzesAPI, notificationsAPI } from "../api";
import VideosPanel      from "../components/VideosPanel";
import AssignmentsPanel from "../components/AssignmentsPanel";
import LessonPlanPanel  from "../components/LessonPlanPanel";
import TimetablePanel   from "../components/TimetablePanel";
import MessagesPanel    from "../components/MessagesPanel";

const NAV_ITEMS = [
  { id:"overview",       label:"Overview",       icon:"⊞" },
  { id:"attendance",     label:"Attendance",     icon:"✓" },
  { id:"quizzes",        label:"Quizzes",        icon:"✎" },
  { id:"results",        label:"Results",        icon:"★" },
  { id:"reports",        label:"Reports",        icon:"📊" },
  { id:"notifications",  label:"Notifications",  icon:"🔔" },
  { id:"assignments",    label:"Assignments",    icon:"📋" },
  { id:"messages",       label:"Messages",       icon:"✉" },
  { id:"timetable",      label:"Timetable",      icon:"📅" },
  { id:"lesson-plan",    label:"Lesson Plan",    icon:"📖" },
  { id:"videos",         label:"Videos",         icon:"▶" },
];

const Q_TYPES = [
  { value:"mcq",          label:"Multiple Choice" },
  { value:"true_false",   label:"True / False" },
  { value:"short_answer", label:"Short Answer" },
];

const NOTIF_TYPES = [
  { value:"info",    label:"Info",    color:"#2563EB", bg:"#EFF6FF" },
  { value:"warning", label:"Warning", color:"#D97706", bg:"#FEF3C7" },
  { value:"success", label:"Success", color:"#059669", bg:"#ECFDF5" },
];

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');

  :root {
    --green: #059669;
    --green-light: #34D399;
    --green-soft: #ECFDF5;
    --green-mid: #A7F3D0;
    --bg: #F0FDF4;
    --surface: #FFFFFF;
    --surface2: #F8FAFC;
    --border: #E5E7EB;
    --text: #0F172A;
    --muted: #64748B;
    --faint: #94A3B8;
    --blue: #2563EB;
    --amber: #D97706;
    --red: #EF4444;
    --purple: #7C3AED;
    --sidebar-w: 240px;
    --header-h: 56px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sora', sans-serif; }

  .t-root { display: flex; min-height: 100vh; font-family: 'Sora', sans-serif; background: var(--bg); }

  /* ── OVERLAY ── */
  .t-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(15,23,42,.45); backdrop-filter: blur(3px); z-index: 40;
  }
  .t-overlay.open { display: block; }

  /* ── SIDEBAR ── */
  .t-sidebar {
    position: fixed; top: 0; left: 0; bottom: 0;
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1.5px solid var(--border);
    display: flex; flex-direction: column;
    z-index: 50;
    transform: translateX(-100%);
    transition: transform .28s cubic-bezier(.4,0,.2,1);
  }
  .t-sidebar.open { transform: translateX(0); }
  @media (min-width: 768px) { .t-sidebar { transform: translateX(0); } }

  .t-logo {
    display: flex; align-items: center; gap: 10px;
    padding: 16px 14px; border-bottom: 1.5px solid var(--bg);
  }
  .t-logo-icon {
    width: 32px; height: 32px; background: var(--green);
    border-radius: 9px; display: flex; align-items: center; justify-content: center;
  }
  .t-logo-text {
    font-family: 'Playfair Display', serif;
    font-weight: 800; font-size: 15px; color: var(--text);
  }

  .t-user-chip {
    margin: 10px 10px 4px;
    background: var(--green-soft); border: 1px solid var(--green-mid);
    border-radius: 10px; padding: 10px 12px;
  }
  .t-user-role { font-size: 10px; font-weight: 700; color: var(--green); text-transform: uppercase; letter-spacing: .5px; }
  .t-user-name { font-size: 13px; font-weight: 700; color: var(--text); margin-top: 2px; }

  .t-nav {
    flex: 1; padding: 6px 8px;
    display: flex; flex-direction: column; gap: 2px;
    overflow-y: auto;
  }
  .t-nav::-webkit-scrollbar { width: 3px; }
  .t-nav::-webkit-scrollbar-thumb { background: var(--green-mid); border-radius: 2px; }

  .t-nav-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 12px; border-radius: 9px;
    border: none; background: none; width: 100%;
    font-size: 13px; font-weight: 500; color: var(--muted);
    cursor: pointer; font-family: 'Sora', sans-serif;
    transition: all .18s ease; text-align: left;
  }
  .t-nav-btn:hover { background: var(--green-soft); color: var(--text); transform: translateX(2px); }
  .t-nav-btn.active { background: var(--green-soft); color: var(--green); font-weight: 700; box-shadow: inset 3px 0 0 var(--green); }

  .t-nav-footer { padding: 8px 8px 12px; border-top: 1.5px solid var(--bg); display: flex; flex-direction: column; gap: 2px; }

  /* ── MAIN ── */
  .t-main { flex: 1; display: flex; flex-direction: column; min-height: 100vh; }
  @media (min-width: 768px) { .t-main { margin-left: var(--sidebar-w); } }

  /* ── HEADER ── */
  .t-header {
    position: sticky; top: 0; z-index: 30;
    height: var(--header-h);
    background: var(--surface); border-bottom: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 16px; gap: 12px;
  }
  .t-header-left { display: flex; align-items: center; gap: 10px; }
  .t-hamburger {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px;
    background: var(--bg); border: 1.5px solid var(--border);
    border-radius: 9px; cursor: pointer; transition: all .15s;
  }
  .t-hamburger:hover { background: var(--green-soft); border-color: var(--green-mid); }
  @media (min-width: 768px) { .t-hamburger { display: none; } }

  .t-header-title { font-size: 14px; font-weight: 700; color: var(--text); text-transform: capitalize; }
  .t-avatar {
    width: 34px; height: 34px; background: var(--green);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 800; font-size: 13px; flex-shrink: 0;
  }

  /* ── CONTENT ── */
  .t-content { padding: 20px 16px; }
  @media (min-width: 640px) { .t-content { padding: 24px 20px; } }
  @media (min-width: 1024px) { .t-content { padding: 28px 28px; } }

  .fade { animation: fadeUp .35s ease both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

  /* ── KPI ── */
  .t-kpi-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 20px; }
  @media (min-width: 480px) { .t-kpi-grid { grid-template-columns: repeat(3, 1fr); } }

  .t-kpi {
    background: var(--surface); border: 1.5px solid var(--border); border-radius: 14px;
    padding: 18px 16px; display: flex; align-items: center; gap: 14px;
    transition: box-shadow .2s;
  }
  .t-kpi:hover { box-shadow: 0 4px 16px rgba(5,150,105,.1); }
  .t-kpi-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .t-kpi-val { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 800; line-height: 1; }
  .t-kpi-label { font-size: 12px; color: var(--muted); margin-top: 3px; font-weight: 500; }

  /* ── CARD ── */
  .t-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 14px; padding: 20px 16px; margin-bottom: 14px; }
  @media (min-width: 640px) { .t-card { padding: 20px; } }
  .t-card-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 14px; }

  /* ── CLASS ROW ── */
  .t-class-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px; background: var(--green-soft);
    border: 1.5px solid var(--green-mid); border-radius: 11px;
    margin-bottom: 8px; gap: 10px; flex-wrap: wrap;
  }
  .t-class-info { flex: 1; min-width: 120px; }
  .t-class-name { font-size: 14px; font-weight: 700; color: var(--text); }
  .t-class-sub  { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .t-class-btns { display: flex; gap: 7px; flex-wrap: wrap; }

  /* ── BUTTONS ── */
  .btn-green {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 14px; border-radius: 9px;
    background: var(--green); color: #fff;
    border: none; font-size: 12px; font-weight: 700;
    cursor: pointer; font-family: 'Sora', sans-serif; transition: all .18s; white-space: nowrap;
  }
  .btn-green:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .btn-green:disabled { opacity: .5; cursor: not-allowed; }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 14px; border-radius: 9px;
    background: var(--bg); color: var(--muted);
    border: 1.5px solid var(--border);
    font-size: 12px; font-weight: 600;
    cursor: pointer; font-family: 'Sora', sans-serif; transition: all .18s; white-space: nowrap;
  }
  .btn-ghost:hover { border-color: var(--green-mid); color: var(--green); background: var(--green-soft); }

  .btn-danger {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: 9px;
    background: #FEF2F2; color: var(--red);
    border: 1.5px solid #FECACA;
    font-size: 11px; font-weight: 700;
    cursor: pointer; font-family: 'Sora', sans-serif; transition: all .18s;
  }
  .btn-danger:hover { background: #FEE2E2; }

  /* ── ATTENDANCE ── */
  .t-att-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
  @media (min-width: 768px) { .t-att-grid { grid-template-columns: 1fr 260px; } }

  .t-class-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }

  .t-tab-btn {
    padding: 8px 14px; border-radius: 9px;
    font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: 'Sora', sans-serif; transition: all .18s;
    border: 1.5px solid var(--border); background: var(--surface); color: var(--muted);
    white-space: nowrap;
  }
  .t-tab-btn.active { background: var(--green); color: #fff; border-color: var(--green); }

  .t-student-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px; border-radius: 10px;
    border: 1.5px solid var(--border); margin-bottom: 7px;
    cursor: pointer; transition: all .18s; background: var(--surface2);
    gap: 10px;
  }
  .t-student-row:hover { border-color: var(--green-mid); }
  .t-student-row.present { border-color: var(--green); background: var(--green-soft); }
  .t-student-row.absent  { border-color: var(--red);   background: #FEF2F2; }

  .t-student-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--bg); display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 12px; color: var(--muted); flex-shrink: 0;
  }
  .t-att-toggle {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 13px; flex-shrink: 0; transition: all .18s;
  }

  .t-summary-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 9px 12px; border-radius: 9px; margin-bottom: 7px;
  }
  .t-summary-label { font-size: 13px; font-weight: 600; }
  .t-summary-val { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 800; }

  /* ── QUIZ ── */
  .t-quiz-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px; background: var(--surface);
    border: 1.5px solid var(--border); border-radius: 12px;
    margin-bottom: 10px; gap: 12px; flex-wrap: wrap;
    transition: box-shadow .2s;
  }
  .t-quiz-row:hover { box-shadow: 0 2px 12px rgba(5,150,105,.1); }
  .t-quiz-info { flex: 1; min-width: 140px; }
  .t-quiz-title { font-weight: 700; font-size: 14px; color: var(--text); }
  .t-quiz-meta  { font-size: 12px; color: var(--muted); margin-top: 3px; }
  .t-quiz-btns  { display: flex; gap: 7px; flex-wrap: wrap; }

  .badge { display: inline-flex; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
  .badge-active   { background: #ECFDF5; color: #059669; }
  .badge-inactive { background: #FEE2E2; color: #EF4444; }
  .badge-mcq { background: #EFF6FF; color: #2563EB; }
  .badge-tf  { background: #ECFDF5; color: #059669; }
  .badge-sa  { background: #FEF3C7; color: #D97706; }

  .t-q-card {
    background: var(--surface2); border: 1.5px solid var(--border);
    border-radius: 11px; padding: 14px 16px; margin-bottom: 10px;
  }

  .t-input {
    width: 100%; padding: 9px 12px;
    border: 1.5px solid var(--border); border-radius: 9px;
    font-size: 13px; font-family: 'Sora', sans-serif; outline: none;
    background: var(--surface2); color: var(--text); transition: border .2s;
  }
  .t-input:focus { border-color: var(--green); background: #fff; }

  .t-select {
    width: 100%; padding: 9px 12px;
    border: 1.5px solid var(--border); border-radius: 9px;
    font-size: 13px; font-family: 'Sora', sans-serif; outline: none;
    background: var(--surface2); color: var(--text);
  }

  .t-label { display: block; font-size: 11px; font-weight: 700; color: var(--muted); margin-bottom: 5px; text-transform: uppercase; letter-spacing: .4px; }
  .t-field { margin-bottom: 12px; }

  .t-choice-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }

  /* ── REPORT ── */
  .t-report-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px; }
  @media (min-width: 480px) { .t-report-grid { grid-template-columns: repeat(3, 1fr); } }

  .t-report-table { overflow-x: auto; }
  .t-report-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
    padding: 10px 14px; border-bottom: 1px solid var(--bg);
    font-size: 13px; align-items: center; gap: 8px;
    min-width: 480px;
  }
  .t-report-hdr { background: var(--bg); border-radius: 8px; margin-bottom: 4px; }

  /* ── NOTIF ── */
  .t-notif-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  @media (min-width: 768px) { .t-notif-grid { grid-template-columns: 1fr 1fr; } }

  .t-notif-type-btn {
    padding: 7px 14px; border-radius: 8px;
    border: 1.5px solid var(--border); background: var(--surface);
    font-size: 12px; font-weight: 600; cursor: pointer;
    font-family: 'Sora', sans-serif; transition: all .18s; color: var(--muted);
  }

  /* ── RESULTS ── */
  .t-results-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px; }
  @media (min-width: 480px) { .t-results-grid { grid-template-columns: repeat(3, 1fr); } }

  /* ── PBAR ── */
  .pbar { height: 5px; background: var(--bg); border-radius: 3px; overflow: hidden; margin-top: 5px; }
  .pfill { height: 100%; border-radius: 3px; transition: width .8s ease; }

  /* ── MODAL ── */
  .t-modal-bg {
    position: fixed; inset: 0; background: rgba(15,23,42,.55);
    backdrop-filter: blur(5px);
    display: flex; align-items: center; justify-content: center; z-index: 100;
    padding: 16px;
  }
  .t-modal {
    background: var(--surface); border-radius: 18px; padding: 24px;
    width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto;
  }
  .t-modal-title { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 20px; margin-bottom: 18px; color: var(--text); }

  /* ── TOAST ── */
  .t-toast {
    position: fixed; bottom: 20px; right: 20px;
    padding: 13px 18px; border-radius: 12px;
    font-size: 13px; font-weight: 700;
    z-index: 300; max-width: 320px;
    animation: slideToast .3s ease;
    font-family: 'Sora', sans-serif;
    box-shadow: 0 8px 24px rgba(0,0,0,.15);
  }
  @keyframes slideToast { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .t-toast.success { background: linear-gradient(135deg, #059669, #10B981); color: #fff; }
  .t-toast.error   { background: linear-gradient(135deg, #DC2626, #EF4444); color: #fff; }

  /* ── EMPTY ── */
  .t-empty { text-align: center; padding: 36px 20px; color: var(--faint); font-size: 13px; }
  .t-empty-icon { font-size: 36px; margin-bottom: 10px; }

  .spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
    animation: spin .6s linear infinite; display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab]     = useState("overview");

  // ── Attendance ──────────────────────────────────────────
  const [classes,   setClasses]   = useState([]);
  const [selClass,  setSelClass]  = useState(null);
  const [students,  setStudents]  = useState([]);
  const [att,       setAtt]       = useState({});
  const [attDate,   setAttDate]   = useState(new Date().toISOString().split("T")[0]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting,setSubmitting]= useState(false);

  // ── Report ───────────────────────────────────────────────
  const [repClass, setRepClass] = useState(null);
  const [report,   setReport]   = useState(null);
  const [loadRep,  setLoadRep]  = useState(false);

  // ── Quizzes ──────────────────────────────────────────────
  const [quizzes,     setQuizzes]     = useState([]);
  const [loadingQ,    setLoadingQ]    = useState(false);
  const [selQuiz,     setSelQuiz]     = useState(null);
  const [showNewQuiz, setShowNewQuiz] = useState(false);
  const [newQuiz,     setNewQuiz]     = useState({ title:"", description:"", class_room:"", deadline:"" });
  const [newQ,        setNewQ]        = useState({
    text:"", question_type:"mcq", points:1, correct_answer_text:"",
    choices:[{text:"",is_correct:true},{text:"",is_correct:false},{text:"",is_correct:false},{text:"",is_correct:false}]
  });
  const [addingQ,    setAddingQ]    = useState(false);
  const [qImage,     setQImage]     = useState(null);
  const [qImagePreview, setQImagePreview] = useState(null);
  const [quizResults,setQuizResults]= useState([]);

  // ── Notifications ────────────────────────────────────────
  const [notifClass,   setNotifClass]   = useState("");
  const [notifTitle,   setNotifTitle]   = useState("");
  const [notifMsg,     setNotifMsg]     = useState("");
  const [notifType,    setNotifType]    = useState("info");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [sentHistory,  setSentHistory]  = useState([]);
  const [notifFile,    setNotifFile]    = useState(null);
  const [filePreview,  setFilePreview]  = useState(null);
  // received
  const [inboxNotifs,  setInboxNotifs]  = useState([]);
  const [unreadCount,  setUnreadCount]  = useState(0);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const loadClasses = useCallback(async () => {
    try { const d = await academicsAPI.classes.myClasses(); setClasses(Array.isArray(d)?d:(d.results||[])); } catch {}
  },[]);

  const loadQuizzes = useCallback(async () => {
    setLoadingQ(true);
    try { const d = await quizzesAPI.list(); setQuizzes(Array.isArray(d)?d:(d.results||[])); } catch {}
    finally { setLoadingQ(false); }
  },[]);

  useEffect(()=>{
    loadClasses(); loadQuizzes();
    notificationsAPI.list().then(d=>{ setInboxNotifs(d.notifications||[]); setUnreadCount(d.unread||0); }).catch(()=>{});
  },[loadClasses, loadQuizzes]);

  useEffect(()=>{
    if (!selClass) return;
    setSubmitted(false); setAtt({});
    setStudents(selClass.students_list||[]);
    attendanceAPI.byClass(selClass.id, attDate)
      .then(recs=>{ const m={}; recs.forEach(r=>{m[r.student]=r.status;}); setAtt(m); })
      .catch(()=>{});
  },[selClass, attDate]);

  const toggle  = (sid) => setAtt(a=>({...a,[sid]:a[sid]==="present"?"absent":"present"}));
  const markAll = (val) => { const m={}; students.forEach(s=>{m[s.id]=val;}); setAtt(m); };

  const handleSubmitAtt = async () => {
    if (!selClass||students.length===0){ showToast("No students","error"); return; }
    const records = students.map(s=>({student_id:s.id,status:att[s.id]||"absent"}));
    setSubmitting(true);
    try { await attendanceAPI.submitBulk(selClass.id,attDate,records); setSubmitted(true); showToast("Attendance submitted!"); }
    catch(e){ showToast(e?.error||"Submit failed","error"); }
    finally { setSubmitting(false); }
  };

  const loadReport = async (cls) => {
    setRepClass(cls); setReport(null); setLoadRep(true);
    try { const d = await attendanceAPI.report(cls.id); setReport(d); }
    catch { showToast("Failed to load report","error"); }
    finally { setLoadRep(false); }
  };

  const handleCreateQuiz = async () => {
    if (!newQuiz.title.trim()){ showToast("Enter title","error"); return; }
    if (!newQuiz.class_room){   showToast("Select class","error"); return; }
    try {
      const payload={ title:newQuiz.title, description:newQuiz.description, class_room:parseInt(newQuiz.class_room) };
      if (newQuiz.deadline) payload.deadline = newQuiz.deadline;
      const quiz = await quizzesAPI.create(payload);
      showToast("Quiz created!"); setShowNewQuiz(false);
      setNewQuiz({ title:"", description:"", class_room:"", deadline:"" });
      await loadQuizzes(); setSelQuiz(quiz); setTab("quizzes");
    } catch(e){ showToast(e?.title?.[0]||"Failed","error"); }
  };

  const handleAddQuestion = async () => {
    if (!newQ.text.trim()){ showToast("Enter question text","error"); return; }
    const payload={ text:newQ.text, question_type:newQ.question_type, points:newQ.points };
    if (newQ.question_type==="short_answer"){ payload.correct_answer_text=newQ.correct_answer_text; payload.choices=[]; }
    else if (newQ.question_type==="true_false"){
      if (!newQ.correct_answer_text){ showToast("Select correct answer","error"); return; }
      payload.correct_answer_text=newQ.correct_answer_text; payload.choices=[];
    } else {
      const filled=newQ.choices.filter(c=>c.text.trim());
      if (filled.length<2){ showToast("Add at least 2 choices","error"); return; }
      if (!filled.some(c=>c.is_correct)){ showToast("Mark 1 correct answer","error"); return; }
      payload.choices=filled;
    }
    setAddingQ(true);
    try {
      await quizzesAPI.addQuestion(selQuiz.id, payload, qImage||null);
      showToast("Question added!");
      setNewQ({ text:"", question_type:"mcq", points:1, correct_answer_text:"",
        choices:[{text:"",is_correct:true},{text:"",is_correct:false},{text:"",is_correct:false},{text:"",is_correct:false}] });
      setQImage(null); setQImagePreview(null);
      const updated=await quizzesAPI.list(); const list=Array.isArray(updated)?updated:(updated.results||[]);
      setQuizzes(list); setSelQuiz(list.find(q=>q.id===selQuiz.id)||selQuiz);
    } catch { showToast("Failed","error"); }
    finally { setAddingQ(false); }
  };

  const handleDeleteQuestion = async (qid) => {
    if (!window.confirm("Delete?")) return;
    try {
      await quizzesAPI.deleteQuestion(selQuiz.id,qid); showToast("Deleted!");
      const updated=await quizzesAPI.list(); const list=Array.isArray(updated)?updated:(updated.results||[]);
      setQuizzes(list); setSelQuiz(list.find(q=>q.id===selQuiz.id)||null);
    } catch { showToast("Failed","error"); }
  };

  const handleToggleQuiz = async (id) => {
    try {
      const res=await quizzesAPI.toggle(id);
      setQuizzes(qs=>qs.map(q=>q.id===id?{...q,is_active:res.is_active}:q));
      if (selQuiz?.id===id) setSelQuiz(q=>({...q,is_active:res.is_active}));
    } catch { showToast("Failed","error"); }
  };

  const loadResults = async (quiz) => {
    try { const d=await quizzesAPI.results(quiz.id); setQuizResults(d); setSelQuiz(quiz); setTab("results"); }
    catch { showToast("Failed","error"); }
  };

  const handleFileChange = (e) => {
    const f=e.target.files[0];
    if (!f){ setNotifFile(null); setFilePreview(null); return; }
    if (f.size>50*1024*1024){ showToast("File too large. Max 50MB.","error"); return; }
    const ext=f.name.split('.').pop().toLowerCase();
    const valid=['pdf','doc','docx','xls','xlsx','zip','jpg','jpeg','png','webp'];
    if (!valid.includes(ext)){ showToast("Unsupported file type.","error"); return; }
    setNotifFile(f);
    if (['jpg','jpeg','png','webp'].includes(ext)) setFilePreview(URL.createObjectURL(f));
    else setFilePreview(null);
  };

  const markAllRead = async () => {
    try { await notificationsAPI.markAllRead(); setInboxNotifs(n=>n.map(x=>({...x,is_read:true}))); setUnreadCount(0); } catch{}
  };

  const handleSendNotif = async () => {
    if (!notifTitle.trim()||!notifMsg.trim()){ showToast("Title and message required","error"); return; }
    if (!notifClass){ showToast("Select a class","error"); return; }
    setSendingNotif(true);
    try {
      let payload;
      if (notifFile){
        payload=new FormData();
        payload.append("title",notifTitle); payload.append("message",notifMsg);
        payload.append("notif_type",notifType); payload.append("class_id",notifClass);
        payload.append("file",notifFile);
      } else {
        payload={ title:notifTitle, message:notifMsg, notif_type:notifType, class_id:parseInt(notifClass) };
      }
      const res=await notificationsAPI.send(payload);
      showToast(res.message||"Sent!");
      setSentHistory(h=>[{ title:notifTitle, message:notifMsg, notif_type:notifType,
        sent_at:new Date().toLocaleString(), count:res.count, file:notifFile?notifFile.name:null },...h]);
      setNotifTitle(""); setNotifMsg(""); setNotifType("info"); setNotifFile(null); setFilePreview(null);
    } catch(e){ showToast(e?.error||"Failed","error"); }
    finally { setSendingNotif(false); }
  };

  const scoreColor = (p) => p>=80?"#059669":p>=60?"#D97706":"#EF4444";
  const present  = students.filter(s=>att[s.id]==="present").length;
  const absent   = students.filter(s=>att[s.id]==="absent").length;
  const unmarked = students.filter(s=>!att[s.id]).length;

  const navTo = (id) => { setTab(id); setSidebarOpen(false); };
  const firstName = user?.first_name || user?.full_name || "T";

  return (
    <div className="t-root">
      <style>{S}</style>

      <div className={`t-overlay${sidebarOpen?" open":""}`} onClick={()=>setSidebarOpen(false)}/>

      {/* ── SIDEBAR ── */}
      <aside className={`t-sidebar${sidebarOpen?" open":""}`}>
        <div className="t-logo">
          <div className="t-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <span className="t-logo-text">EduPortal</span>
        </div>

        <div className="t-user-chip">
          <div className="t-user-role">Teacher</div>
          <div className="t-user-name">{user?.full_name||user?.first_name||"Teacher"}</div>
        </div>

        <nav className="t-nav">
          {NAV_ITEMS.map(n=>(
            <button key={n.id} className={`t-nav-btn${tab===n.id?" active":""}`} onClick={()=>navTo(n.id)}>
              <span style={{fontSize:14,width:18,textAlign:"center"}}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="t-nav-footer">
          <button className="t-nav-btn" onClick={()=>{ navigate("/profile"); setSidebarOpen(false); }}>
            <span style={{fontSize:14}}>👤</span> My Profile
          </button>
          <button className="t-nav-btn" style={{color:"var(--red)"}} onClick={()=>{logout();navigate("/");}}>
            <span style={{fontSize:14}}>→</span> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="t-main">
        <header className="t-header">
          <div className="t-header-left">
            <button className="t-hamburger" onClick={()=>setSidebarOpen(true)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="t-header-title">{NAV_ITEMS.find(n=>n.id===tab)?.label||tab}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>{setTab("notifications");markAllRead();}}
              style={{position:"relative",background:"none",border:"none",cursor:"pointer",fontSize:20,padding:4,lineHeight:1}}>
              🔔
              {unreadCount>0 && (
                <span style={{position:"absolute",top:-2,right:-2,background:"#EF4444",color:"#fff",
                  borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:800,
                  display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
                  {unreadCount>9?"9+":unreadCount}
                </span>
              )}
            </button>
            <div className="t-avatar">{firstName.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="t-content">

          {/* ══ OVERVIEW ══ */}
          {tab==="overview" && (
            <div className="fade">
              <div className="t-kpi-grid">
                {[
                  { l:"Classes",  v:classes.length,  c:"#059669", bg:"#ECFDF5", i:"🏫" },
                  { l:"Quizzes",  v:quizzes.length,  c:"#2563EB", bg:"#EFF6FF", i:"✎"  },
                  { l:"Students", v:classes.reduce((a,c)=>a+(c.student_count||0),0), c:"#7C3AED", bg:"#EDE9FE", i:"👥" },
                ].map(k=>(
                  <div key={k.l} className="t-kpi">
                    <div className="t-kpi-icon" style={{background:k.bg}}>{k.i}</div>
                    <div>
                      <div className="t-kpi-val" style={{color:k.c}}>{k.v}</div>
                      <div className="t-kpi-label">{k.l}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="t-card">
                <div className="t-card-title">🏫 My Classes</div>
                {classes.length===0
                  ? <div className="t-empty"><div className="t-empty-icon">🏫</div>No classes assigned yet.</div>
                  : classes.map(c=>(
                    <div key={c.id} className="t-class-row">
                      <div className="t-class-info">
                        <div className="t-class-name">Class {c.name} — {c.subject||c.grade_name}</div>
                        <div className="t-class-sub">{c.student_count||0} students</div>
                      </div>
                      <div className="t-class-btns">
                        <button className="btn-ghost" style={{fontSize:12}} onClick={()=>{setSelClass(c);setTab("attendance");}}>Attendance</button>
                        <button className="btn-ghost" style={{fontSize:12}} onClick={()=>{loadReport(c);setTab("reports");}}>Report</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* ══ ATTENDANCE ══ */}
          {tab==="attendance" && (
            <div className="fade">
              <div className="t-class-tabs">
                {classes.map(c=>(
                  <button key={c.id} className={`t-tab-btn${selClass?.id===c.id?" active":""}`}
                    onClick={()=>{setSelClass(c);setSubmitted(false);}}>
                    Class {c.name}
                  </button>
                ))}
                <input type="date" value={attDate}
                  onChange={e=>{setAttDate(e.target.value);setSubmitted(false);}}
                  style={{padding:"8px 12px",border:"1.5px solid var(--border)",borderRadius:9,fontSize:13,outline:"none",background:"#fff",fontFamily:"'Sora',sans-serif"}}
                />
              </div>

              {!selClass
                ? <div className="t-card"><div className="t-empty">Select a class above</div></div>
                : (
                  <div className="t-att-grid">
                    {/* Student list */}
                    <div className="t-card">
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                        <div>
                          <div className="t-card-title" style={{marginBottom:2}}>Class {selClass.name} · {attDate}</div>
                          <p style={{fontSize:12,color:"var(--muted)"}}>
                            {students.length===0?"No students — tap rows to toggle":"Tap to toggle attendance"}
                          </p>
                        </div>
                        {students.length>0 && (
                          <div style={{display:"flex",gap:7}}>
                            <button className="btn-green" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>markAll("present")}>✓ All</button>
                            <button className="btn-danger" style={{fontSize:11}} onClick={()=>markAll("absent")}>✗ All</button>
                          </div>
                        )}
                      </div>
                      {students.length===0
                        ? <div className="t-empty">No students assigned to this class.</div>
                        : students.map(s=>(
                          <div key={s.id}
                            className={`t-student-row${att[s.id]==="present"?" present":att[s.id]==="absent"?" absent":""}`}
                            onClick={()=>toggle(s.id)}
                          >
                            <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
                              <div className="t-student-avatar">
                                {(s.first_name||s.full_name||"?").charAt(0).toUpperCase()}
                              </div>
                              <span style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                {s.full_name||`${s.first_name} ${s.last_name}`}
                              </span>
                            </div>
                            <div className="t-att-toggle" style={{
                              background: att[s.id]==="present"?"#059669":att[s.id]==="absent"?"#EF4444":"#E2E8F0",
                              color: att[s.id]?"#fff":"#94A3B8"
                            }}>
                              {att[s.id]==="present"?"✓":att[s.id]==="absent"?"✗":"—"}
                            </div>
                          </div>
                        ))
                      }
                    </div>

                    {/* Summary + submit */}
                    <div>
                      <div className="t-card" style={{marginBottom:12}}>
                        <div className="t-card-title">Today's Summary</div>
                        {[
                          ["Present", present, "#059669","#ECFDF5"],
                          ["Absent",  absent,  "#EF4444","#FEF2F2"],
                          ["Unmarked",unmarked,"#D97706","#FEF3C7"],
                        ].map(([l,v,c,bg])=>(
                          <div key={l} className="t-summary-item" style={{background:bg}}>
                            <span className="t-summary-label" style={{color:c}}>{l}</span>
                            <span className="t-summary-val" style={{color:c}}>{v}</span>
                          </div>
                        ))}
                      </div>
                      {submitted
                        ? (
                          <div style={{background:"#ECFDF5",borderRadius:12,padding:18,textAlign:"center",border:"1.5px solid var(--green-mid)"}}>
                            <div style={{fontSize:28,marginBottom:6}}>✅</div>
                            <div style={{fontSize:14,fontWeight:700,color:"var(--green)"}}>Submitted!</div>
                            <button className="btn-ghost" style={{marginTop:12,width:"100%",justifyContent:"center"}} onClick={()=>setSubmitted(false)}>Edit</button>
                          </div>
                        ) : (
                          <button className="btn-green" style={{width:"100%",justifyContent:"center",padding:"13px",fontSize:14}}
                            disabled={submitting||students.length===0} onClick={handleSubmitAtt}>
                            {submitting?<span className="spinner"/>:"Submit Attendance"}
                          </button>
                        )
                      }
                    </div>
                  </div>
                )
              }
            </div>
          )}

          {/* ══ QUIZZES ══ */}
          {tab==="quizzes" && (
            <div className="fade">
              {!selQuiz ? (
                <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
                    <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>My Quizzes ({quizzes.length})</div>
                    <button className="btn-green" onClick={()=>setShowNewQuiz(true)}>+ New Quiz</button>
                  </div>
                  {loadingQ
                    ? <div className="t-card"><div className="t-empty">Loading...</div></div>
                    : quizzes.length===0
                      ? <div className="t-card"><div className="t-empty"><div className="t-empty-icon">📝</div>No quizzes yet.</div></div>
                      : quizzes.map(q=>(
                        <div key={q.id} className="t-quiz-row">
                          <div className="t-quiz-info">
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                              <span className="t-quiz-title">{q.title}</span>
                              <span className={`badge ${q.is_active?"badge-active":"badge-inactive"}`}>
                                {q.is_active?"Active":"Inactive"}
                              </span>
                            </div>
                            <div className="t-quiz-meta">{q.class_room_name} · {q.question_count} questions · {q.attempt_count} attempts</div>
                          </div>
                          <div className="t-quiz-btns">
                            <button className="btn-ghost" style={{fontSize:12}} onClick={()=>setSelQuiz(q)}>Build</button>
                            <button className="btn-ghost" style={{fontSize:12}} onClick={()=>handleToggleQuiz(q.id)}>
                              {q.is_active?"Deactivate":"Activate"}
                            </button>
                            <button className="btn-ghost" style={{fontSize:12}} onClick={()=>loadResults(q)}>Results</button>
                          </div>
                        </div>
                      ))
                  }
                </>
              ) : (
                <>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                    <button className="btn-ghost" onClick={()=>setSelQuiz(null)}>← Back</button>
                    <span style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>{selQuiz.title}</span>
                    <span className={`badge ${selQuiz.is_active?"badge-active":"badge-inactive"}`}>
                      {selQuiz.is_active?"Active":"Inactive"}
                    </span>
                  </div>

                  {/* Questions list */}
                  <div className="t-card" style={{marginBottom:14}}>
                    <div className="t-card-title">Questions ({selQuiz.questions?.length||0})</div>
                    {(!selQuiz.questions||selQuiz.questions.length===0)
                      ? <div className="t-empty">No questions yet.</div>
                      : selQuiz.questions.map((q,i)=>(
                        <div key={q.id} className="t-q-card">
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                            <div style={{flex:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                                <span style={{fontSize:11,fontWeight:700,color:"var(--faint)"}}>Q{i+1}</span>
                                <span className={`badge badge-${q.question_type==="mcq"?"mcq":q.question_type==="true_false"?"tf":"sa"}`}>
                                  {q.question_type==="mcq"?"MCQ":q.question_type==="true_false"?"T/F":"Short"}
                                </span>
                                <span style={{fontSize:11,color:"var(--faint)"}}>{q.points} pt{q.points>1?"s":""}</span>
                              </div>
                              <p style={{fontSize:13,color:"var(--text)",marginBottom:6}}>{q.text}</p>
                              {q.image_url && (
                                <img src={q.image_url} alt="question"
                                  style={{maxWidth:260,maxHeight:180,borderRadius:8,objectFit:"contain",
                                    border:"1px solid var(--border)",marginBottom:6,display:"block"}}/>
                              )}
                              {q.question_type==="short_answer"&&q.correct_answer_text&&(
                                <p style={{fontSize:12,color:"#059669"}}>✓ {q.correct_answer_text}</p>
                              )}
                              {q.choices?.map(c=>(
                                <div key={c.id} style={{fontSize:12,color:c.is_correct?"#059669":"var(--muted)",marginBottom:2}}>
                                  {c.is_correct?"✓":"·"} {c.text}
                                </div>
                              ))}
                            </div>
                            <button className="btn-danger" style={{flexShrink:0}} onClick={()=>handleDeleteQuestion(q.id)}>Delete</button>
                          </div>
                        </div>
                      ))
                    }
                  </div>

                  {/* Add question */}
                  <div className="t-card">
                    <div className="t-card-title">Add New Question</div>
                    <div className="t-field">
                      <label className="t-label">Type</label>
                      <select className="t-select" value={newQ.question_type}
                        onChange={e=>setNewQ(q=>({...q,question_type:e.target.value,correct_answer_text:"",
                          choices:[{text:"",is_correct:true},{text:"",is_correct:false},{text:"",is_correct:false},{text:"",is_correct:false}]}))}>
                        {Q_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="t-field">
                      <label className="t-label">Question Text</label>
                      <textarea className="t-input" rows={3} value={newQ.text}
                        onChange={e=>setNewQ(q=>({...q,text:e.target.value}))} style={{resize:"vertical"}}/>
                    </div>

                    {/* Image upload */}
                    <div className="t-field">
                      <label className="t-label">Question Image <span style={{color:"var(--muted)",fontWeight:400}}>(optional)</span></label>
                      <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",
                        border:"1.5px dashed var(--border)",borderRadius:10,background:"var(--surface2)",width:"fit-content"}}>
                        <span style={{fontSize:20}}>🖼️</span>
                        <span style={{fontSize:13,color:"var(--muted)"}}>
                          {qImage ? qImage.name : "Choose image (JPG / PNG / WEBP)"}
                        </span>
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                          style={{display:"none"}}
                          onChange={e=>{
                            const f=e.target.files[0];
                            if(!f){setQImage(null);setQImagePreview(null);return;}
                            if(f.size>10*1024*1024){showToast("Image must be under 10MB","error");return;}
                            setQImage(f);
                            setQImagePreview(URL.createObjectURL(f));
                          }}/>
                      </label>
                      {qImagePreview && (
                        <div style={{marginTop:10,position:"relative",display:"inline-block"}}>
                          <img src={qImagePreview} alt="preview"
                            style={{maxWidth:320,maxHeight:220,borderRadius:10,border:"1.5px solid var(--border)",objectFit:"contain"}}/>
                          <button onClick={()=>{setQImage(null);setQImagePreview(null);}}
                            style={{position:"absolute",top:4,right:4,background:"#EF4444",color:"#fff",
                              border:"none",borderRadius:"50%",width:24,height:24,cursor:"pointer",fontSize:14,
                              display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                        </div>
                      )}
                    </div>

                    <div className="t-field" style={{width:100}}>
                      <label className="t-label">Points</label>
                      <input className="t-input" type="number" min={1} max={10} value={newQ.points}
                        onChange={e=>setNewQ(q=>({...q,points:parseInt(e.target.value)||1}))}/>
                    </div>

                    {newQ.question_type==="mcq" && (
                      <div className="t-field">
                        <label className="t-label">Choices</label>
                        {newQ.choices.map((c,i)=>(
                          <div key={i} className="t-choice-row">
                            <input type="checkbox" checked={c.is_correct}
                              onChange={e=>{const u=[...newQ.choices];u[i]={...c,is_correct:e.target.checked};setNewQ(q=>({...q,choices:u}));}}/>
                            <input className="t-input" placeholder={`Choice ${i+1}`} value={c.text}
                              onChange={e=>{const u=[...newQ.choices];u[i]={...c,text:e.target.value};setNewQ(q=>({...q,choices:u}));}}/>
                          </div>
                        ))}
                      </div>
                    )}

                    {newQ.question_type==="true_false" && (
                      <div className="t-field">
                        <label className="t-label">Correct Answer *</label>
                        <div style={{display:"flex",gap:10}}>
                          {["True","False"].map(val=>(
                            <button key={val} type="button"
                              onClick={()=>setNewQ(q=>({...q,correct_answer_text:val}))}
                              style={{flex:1,padding:"10px",borderRadius:8,
                                border:`2px solid ${newQ.correct_answer_text===val?"var(--green)":"var(--border)"}`,
                                background:newQ.correct_answer_text===val?"var(--green-soft)":"var(--surface2)",
                                color:newQ.correct_answer_text===val?"var(--green)":"var(--muted)",
                                fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Sora',sans-serif"}}>
                              {val==="True"?"✓ True":"✗ False"}
                            </button>
                          ))}
                        </div>
                        {!newQ.correct_answer_text && <p style={{fontSize:11,color:"var(--red)",marginTop:4}}>Select the correct answer</p>}
                      </div>
                    )}

                    {newQ.question_type==="short_answer" && (
                      <div className="t-field">
                        <label className="t-label">Correct Answer</label>
                        <input className="t-input" value={newQ.correct_answer_text}
                          onChange={e=>setNewQ(q=>({...q,correct_answer_text:e.target.value}))}/>
                      </div>
                    )}

                    <button className="btn-green" disabled={addingQ} onClick={handleAddQuestion}>
                      {addingQ?<span className="spinner"/>:"+ Add Question"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ RESULTS ══ */}
          {tab==="results" && (
            <div className="fade">
              {!selQuiz ? (
                <>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:14}}>Select a quiz to view results</div>
                  {quizzes.length===0
                    ? <div className="t-card"><div className="t-empty">No quizzes yet.</div></div>
                    : quizzes.map(q=>(
                      <div key={q.id} className="t-quiz-row">
                        <div className="t-quiz-info">
                          <div className="t-quiz-title">{q.title}</div>
                          <div className="t-quiz-meta">{q.attempt_count} attempts</div>
                        </div>
                        <button className="btn-ghost" style={{fontSize:12}} onClick={()=>loadResults(q)}>View Results</button>
                      </div>
                    ))
                  }
                </>
              ) : (
                <>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                    <button className="btn-ghost" onClick={()=>setSelQuiz(null)}>← Back</button>
                    <span style={{fontSize:15,fontWeight:700,color:"var(--text)"}}>{selQuiz.title} — Results</span>
                  </div>
                  {quizResults.length>0 && (
                    <div className="t-results-grid">
                      {[
                        ["Attempts", quizResults.length, "var(--green)"],
                        ["Avg Score", Math.round(quizResults.reduce((a,r)=>a+(r.percentage||0),0)/quizResults.length)+"%", "#2563EB"],
                        ["Pass Rate", Math.round(quizResults.filter(r=>r.percentage>=60).length/quizResults.length*100)+"%", "#D97706"],
                      ].map(([l,v,c])=>(
                        <div key={l} className="t-kpi">
                          <div style={{flex:1,textAlign:"center"}}>
                            <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:800,color:c}}>{v}</div>
                            <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>{l}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {quizResults.length===0
                    ? <div className="t-card"><div className="t-empty">No attempts yet.</div></div>
                    : quizResults.map(r=>(
                      <div key={r.id} className="t-card" style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
                          <div>
                            <div style={{fontWeight:700,fontSize:14,color:"var(--text)"}}>{r.student_name}</div>
                            <div style={{fontSize:12,color:"var(--muted)"}}>{new Date(r.submitted_at).toLocaleString()}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:800,color:scoreColor(r.percentage)}}>{r.percentage}%</div>
                            <div style={{fontSize:12,color:"var(--muted)"}}>{r.score}/{r.total_points} pts</div>
                          </div>
                        </div>
                        <div className="pbar"><div className="pfill" style={{width:`${r.percentage}%`,background:scoreColor(r.percentage)}}/></div>
                      </div>
                    ))
                  }
                </>
              )}
            </div>
          )}

          {/* ══ REPORTS ══ */}
          {tab==="reports" && (
            <div className="fade">
              <div style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:14}}>Attendance Reports</div>
              <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                {classes.map(c=>(
                  <button key={c.id}
                    className={`t-tab-btn${repClass?.id===c.id?" active":""}`}
                    onClick={()=>loadReport(c)}>
                    Class {c.name}
                  </button>
                ))}
              </div>
              {!repClass && <div className="t-card"><div className="t-empty">Select a class</div></div>}
              {repClass && loadRep && <div className="t-card"><div className="t-empty">Loading...</div></div>}
              {repClass && !loadRep && report && (
                <>
                  <div className="t-report-grid">
                    {[
                      ["Total Students", report.total_students, "var(--text)"],
                      ["Avg Attendance", report.student_stats.length>0
                        ? Math.round(report.student_stats.reduce((a,s)=>a+s.attendance_rate,0)/report.student_stats.length)+"%"
                        : "0%", "var(--green)"],
                      ["Below 75%", report.student_stats.filter(s=>s.attendance_rate<75).length, "var(--red)"],
                    ].map(([l,v,c])=>(
                      <div key={l} className="t-kpi">
                        <div style={{flex:1,textAlign:"center"}}>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:800,color:c}}>{v}</div>
                          <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>{l}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="t-card" style={{padding:0,overflow:"hidden"}}>
                    <div className="t-report-table">
                      <div className="t-report-row t-report-hdr">
                        {["Student","Total","Present","Absent","Rate"].map(h=>(
                          <div key={h} style={{fontSize:11,fontWeight:700,color:"var(--muted)",textTransform:"uppercase"}}>{h}</div>
                        ))}
                      </div>
                      {report.student_stats.length===0
                        ? <div style={{padding:24,textAlign:"center",color:"var(--faint)"}}>No records.</div>
                        : [...report.student_stats].sort((a,b)=>a.attendance_rate-b.attendance_rate).map(s=>(
                          <div key={s.student_id} className="t-report-row">
                            <div style={{fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.student_name}</div>
                            <span>{s.total_days}</span>
                            <span style={{color:"var(--green)",fontWeight:600}}>{s.present_days}</span>
                            <span style={{color:"var(--red)",fontWeight:600}}>{s.absent_days}</span>
                            <div>
                              <span style={{fontWeight:700,color:scoreColor(s.attendance_rate)}}>{s.attendance_rate}%</span>
                              <div className="pbar" style={{width:60}}>
                                <div className="pfill" style={{width:`${s.attendance_rate}%`,background:scoreColor(s.attendance_rate)}}/>
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ NOTIFICATIONS ══ */}
          {tab==="notifications" && (
            <div className="fade">
              <div className="t-notif-grid">
                {/* Send form */}
                <div className="t-card">
                  <div className="t-card-title">📢 Send Notification</div>
                  <div className="t-field">
                    <label className="t-label">Send to Class</label>
                    <select className="t-select" value={notifClass} onChange={e=>setNotifClass(e.target.value)}>
                      <option value="">— Select Class —</option>
                      {classes.map(c=><option key={c.id} value={c.id}>Class {c.name} ({c.grade_name})</option>)}
                    </select>
                  </div>
                  <div className="t-field">
                    <label className="t-label">Type</label>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {NOTIF_TYPES.map(t=>(
                        <button key={t.value} className="t-notif-type-btn"
                          style={{
                            background:notifType===t.value?t.color:"var(--surface)",
                            color:notifType===t.value?"#fff":t.color,
                            borderColor:notifType===t.value?t.color:"var(--border)"
                          }}
                          onClick={()=>setNotifType(t.value)}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="t-field">
                    <label className="t-label">Title</label>
                    <input className="t-input" placeholder="Notification title..." value={notifTitle} onChange={e=>setNotifTitle(e.target.value)}/>
                  </div>
                  <div className="t-field">
                    <label className="t-label">Message</label>
                    <textarea className="t-input" rows={4} placeholder="Write your message..."
                      value={notifMsg} onChange={e=>setNotifMsg(e.target.value)} style={{resize:"vertical"}}/>
                  </div>
                  <div className="t-field">
                    <label className="t-label">Attachment (optional, max 50MB)</label>
                    <input type="file" onChange={handleFileChange} style={{fontSize:12,width:"100%"}}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,image/jpeg,image/png,image/webp"/>
                    {notifFile && (
                      <div style={{marginTop:8,display:"flex",alignItems:"center",gap:10,padding:8,background:"var(--bg)",borderRadius:8,border:"1px solid var(--border)"}}>
                        {filePreview
                          ? <img src={filePreview} alt="" style={{width:40,height:40,objectFit:"cover",borderRadius:4}}/>
                          : <span style={{fontSize:20}}>📎</span>
                        }
                        <span style={{fontSize:12,fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis"}}>{notifFile.name}</span>
                        <button className="btn-danger" style={{padding:"4px 8px",fontSize:11}}
                          onClick={()=>{setNotifFile(null);setFilePreview(null);}}>✕</button>
                      </div>
                    )}
                  </div>
                  <button className="btn-green" style={{width:"100%",justifyContent:"center",padding:"12px",fontSize:14}}
                    disabled={sendingNotif} onClick={handleSendNotif}>
                    {sendingNotif?<span className="spinner"/>:"📢 Send Notification"}
                  </button>
                </div>

                {/* Sent history */}
                <div className="t-card">
                  <div className="t-card-title">Sent This Session ({sentHistory.length})</div>
                  {sentHistory.length===0
                    ? <div className="t-empty"><div className="t-empty-icon">📭</div>No notifications sent yet.</div>
                    : sentHistory.map((n,i)=>(
                      <div key={i} style={{padding:"12px 14px",borderRadius:10,border:"1.5px solid var(--border)",marginBottom:8,background:"var(--bg)"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4,gap:8,flexWrap:"wrap"}}>
                          <span style={{fontWeight:700,fontSize:13,color:"var(--text)"}}>{n.title}</span>
                          <span style={{fontSize:11,color:"var(--faint)",whiteSpace:"nowrap"}}>{n.sent_at}</span>
                        </div>
                        <p style={{fontSize:12,color:"var(--muted)",marginBottom:6}}>{n.message}</p>
                        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                          <span style={{fontSize:10,padding:"2px 8px",borderRadius:999,fontWeight:700,
                            background:NOTIF_TYPES.find(t=>t.value===n.notif_type)?.bg||"var(--bg)",
                            color:NOTIF_TYPES.find(t=>t.value===n.notif_type)?.color||"var(--muted)"}}>
                            {n.notif_type}
                          </span>
                          <span style={{fontSize:11,color:"var(--muted)"}}>→ {n.count} student{n.count>1?"s":""}</span>
                          {n.file && <span style={{fontSize:11,color:"var(--green)"}}>📎 Attached</span>}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* ── Inbox ── */}
              <div className="t-card" style={{marginTop:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div className="t-card-title" style={{marginBottom:0}}>
                    📬 My Notifications
                    {unreadCount>0 && <span style={{marginLeft:8,background:"#EF4444",color:"#fff",borderRadius:999,fontSize:10,fontWeight:800,padding:"2px 7px"}}>{unreadCount} new</span>}
                  </div>
                  {unreadCount>0 && <button className="btn-ghost" style={{fontSize:11,padding:"4px 10px"}} onClick={markAllRead}>Mark all read</button>}
                </div>
                {inboxNotifs.length===0
                  ? <div className="t-empty"><div className="t-empty-icon">📭</div>No notifications yet.</div>
                  : inboxNotifs.map(n=>(
                    <div key={n.id} style={{padding:"11px 14px",borderRadius:10,marginBottom:8,
                      border:"1.5px solid",borderColor:n.is_read?"var(--border)":"var(--green-mid)",
                      background:n.is_read?"var(--bg)":"var(--green-soft)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap",marginBottom:4}}>
                        <span style={{fontWeight:700,fontSize:13,color:"var(--text)"}}>{n.title}</span>
                        <span style={{fontSize:11,color:"var(--faint)",whiteSpace:"nowrap"}}>{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      <p style={{fontSize:12,color:"var(--muted)",marginBottom:4}}>{n.message}</p>
                      {n.file_url && (
                        <a href={n.file_url} target="_blank" rel="noreferrer"
                          style={{fontSize:11,color:"var(--green)",display:"inline-flex",alignItems:"center",gap:4}}>
                          📎 Attachment
                        </a>
                      )}
                    </div>
                  ))
                }
              </div>

            </div>
          )}

          {tab==="assignments" && <div className="fade"><AssignmentsPanel accentColor="#059669" accentBg="#ECFDF5"/></div>}
          {tab==="messages"    && <div className="fade"><MessagesPanel accentColor="#059669" accentBg="#ECFDF5"/></div>}
          {tab==="lesson-plan" && <div className="fade"><LessonPlanPanel accentColor="#059669" accentBg="#ECFDF5"/></div>}
          {tab==="videos"      && <div className="fade"><VideosPanel accentColor="#059669" accentBg="#ECFDF5"/></div>}
          {tab==="timetable"   && <div className="fade"><TimetablePanel isTeacher={true} readOnly={true} accentColor="#059669"/></div>}

        </div>
      </div>

      {/* New Quiz Modal */}
      {showNewQuiz && (
        <div className="t-modal-bg" onClick={()=>setShowNewQuiz(false)}>
          <div className="t-modal" onClick={e=>e.stopPropagation()}>
            <div className="t-modal-title">Create New Quiz</div>
            <div className="t-field">
              <label className="t-label">Title *</label>
              <input className="t-input" placeholder="Quiz title..." value={newQuiz.title}
                onChange={e=>setNewQuiz(q=>({...q,title:e.target.value}))}/>
            </div>
            <div className="t-field">
              <label className="t-label">Description</label>
              <textarea className="t-input" rows={2} value={newQuiz.description}
                onChange={e=>setNewQuiz(q=>({...q,description:e.target.value}))} style={{resize:"none"}}/>
            </div>
            <div className="t-field">
              <label className="t-label">Class *</label>
              <select className="t-select" value={newQuiz.class_room}
                onChange={e=>setNewQuiz(q=>({...q,class_room:e.target.value}))}>
                <option value="">— Select —</option>
                {classes.map(c=><option key={c.id} value={c.id}>Class {c.name} ({c.grade_name})</option>)}
              </select>
            </div>
            <div className="t-field">
              <label className="t-label">Deadline (optional)</label>
              <input className="t-input" type="datetime-local" value={newQuiz.deadline}
                onChange={e=>setNewQuiz(q=>({...q,deadline:e.target.value}))}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn-green" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={handleCreateQuiz}>Create</button>
              <button className="btn-ghost" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={()=>setShowNewQuiz(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`t-toast ${toast.type==="success"?"success":"error"}`}>{toast.msg}</div>
      )}
    </div>
  );
}
