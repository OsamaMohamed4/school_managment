import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersAPI, academicsAPI, gradeBookAPI, analyticsAPI, parentAPI, timetableAPI } from "../api";
import TimetablePanel from "../components/TimetablePanel";
import AdminTimetableManager from "../components/AdminTimetableManager";

const NAV = [
  { id:"overview",  label:"Overview",        icon:"⊞" },
  { id:"users",     label:"User Management", icon:"👥" },
  { id:"academics", label:"Grades & Classes",icon:"🏫" },
  { id:"parents",   label:"Parent Linking",  icon:"👨‍👩‍👦" },
  { id:"gradebook", label:"Grade Book",      icon:"📊" },
  { id:"analytics", label:"Analytics",       icon:"📈" },
  { id:"timetable", label:"Timetable",       icon:"📅" },
];

const RC = { admin:"#2563EB", teacher:"#059669", student:"#7C3AED", parent:"#D97706" };
const RB = { admin:"#EFF6FF", teacher:"#ECFDF5", student:"#F5F3FF", parent:"#FEF3C7" };
const scoreColor = p => p>=80?"#059669":p>=60?"#D97706":"#EF4444";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');

  :root {
    --blue: #2563EB;
    --blue-soft: #EFF6FF;
    --blue-mid: #BFDBFE;
    --bg: #F8FAFF;
    --surface: #FFFFFF;
    --surface2: #F8FAFC;
    --border: #E5E7EB;
    --text: #0F172A;
    --muted: #64748B;
    --faint: #94A3B8;
    --green: #059669;
    --amber: #D97706;
    --red: #EF4444;
    --purple: #7C3AED;
    --sidebar-w: 240px;
    --header-h: 56px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  .a-root { display: flex; min-height: 100vh; font-family: 'Sora', sans-serif; background: var(--bg); }

  /* ── OVERLAY ── */
  .a-overlay { display: none; position: fixed; inset: 0; background: rgba(15,23,42,.45); backdrop-filter: blur(3px); z-index: 40; }
  .a-overlay.open { display: block; }

  /* ── SIDEBAR ── */
  .a-sidebar {
    position: fixed; top: 0; left: 0; bottom: 0; width: var(--sidebar-w);
    background: var(--surface); border-right: 1.5px solid var(--border);
    display: flex; flex-direction: column; z-index: 50;
    transform: translateX(-100%);
    transition: transform .28s cubic-bezier(.4,0,.2,1);
    overflow-y: auto;
  }
  .a-sidebar.open { transform: translateX(0); }
  @media (min-width: 768px) { .a-sidebar { transform: translateX(0); } }

  .a-logo { display: flex; align-items: center; gap: 10px; padding: 16px 14px; border-bottom: 1.5px solid var(--bg); }
  .a-logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg,#2563EB,#7C3AED); border-radius: 9px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; }
  .a-logo-text { font-family: 'Playfair Display',serif; font-weight: 800; font-size: 15px; color: var(--text); }

  .a-user-chip { margin: 10px 10px 4px; background: var(--blue-soft); border: 1px solid var(--blue-mid); border-radius: 10px; padding: 10px 12px; }
  .a-user-role { font-size: 10px; font-weight: 700; color: var(--blue); text-transform: uppercase; letter-spacing: .5px; }
  .a-user-name { font-size: 13px; font-weight: 700; color: var(--text); margin-top: 2px; }
  .a-user-email { font-size: 11px; color: var(--muted); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .a-nav { flex: 1; padding: 6px 8px; display: flex; flex-direction: column; gap: 2px; }
  .a-nav-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 12px; border-radius: 9px; border: none; background: none; width: 100%;
    font-size: 13px; font-weight: 500; color: var(--muted);
    cursor: pointer; font-family: 'Sora',sans-serif; transition: all .18s; text-align: left;
  }
  .a-nav-btn:hover { background: var(--blue-soft); color: var(--text); transform: translateX(2px); }
  .a-nav-btn.active { background: var(--blue-soft); color: var(--blue); font-weight: 700; box-shadow: inset 3px 0 0 var(--blue); }
  .a-nav-btn.amber-active { background: #FEF3C7; color: var(--amber); font-weight: 700; box-shadow: inset 3px 0 0 var(--amber); }
  .a-nav-footer { padding: 8px 8px 12px; border-top: 1.5px solid var(--bg); display: flex; flex-direction: column; gap: 2px; }

  /* ── MAIN ── */
  .a-main { flex: 1; display: flex; flex-direction: column; min-height: 100vh; }
  @media (min-width: 768px) { .a-main { margin-left: var(--sidebar-w); } }

  /* ── HEADER ── */
  .a-header { position: sticky; top: 0; z-index: 30; height: var(--header-h); background: var(--surface); border-bottom: 1.5px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; gap: 12px; }
  .a-header-left { display: flex; align-items: center; gap: 10px; }
  .a-hamburger { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: var(--bg); border: 1.5px solid var(--border); border-radius: 9px; cursor: pointer; transition: all .15s; }
  .a-hamburger:hover { background: var(--blue-soft); border-color: var(--blue-mid); }
  @media (min-width: 768px) { .a-hamburger { display: none; } }
  .a-header-accent { width: 3px; height: 20px; border-radius: 2px; }
  .a-header-title { font-size: 14px; font-weight: 700; color: var(--text); }
  .a-avatar { width: 34px; height: 34px; background: linear-gradient(135deg,#2563EB,#7C3AED); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 13px; flex-shrink: 0; }

  /* ── CONTENT ── */
  .a-content { padding: 20px 16px; }
  @media (min-width: 640px) { .a-content { padding: 24px 20px; } }
  @media (min-width: 1024px) { .a-content { padding: 28px 28px; } }

  .fade { animation: fadeUp .35s ease both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

  /* ── KPI ── */
  .a-kpi-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; margin-bottom: 20px; }
  @media (min-width: 640px) { .a-kpi-grid { grid-template-columns: repeat(4,1fr); } }

  .a-kpi { background: var(--surface); border: 1.5px solid var(--border); border-radius: 14px; padding: 16px; transition: box-shadow .2s; }
  .a-kpi:hover { box-shadow: 0 4px 16px rgba(37,99,235,.08); }
  .a-kpi-val { font-family: 'Playfair Display',serif; font-size: 28px; font-weight: 800; }
  .a-kpi-label { font-size: 12px; color: var(--muted); margin-top: 4px; font-weight: 500; }

  /* ── CARD ── */
  .a-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 14px; padding: 20px 16px; margin-bottom: 14px; }
  @media (min-width: 640px) { .a-card { padding: 20px; } }
  .a-card-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 14px; }

  /* ── BUTTONS ── */
  .btn-blue { display: inline-flex; align-items: center; gap: 5px; padding: 8px 16px; border-radius: 9px; background: var(--blue); color: #fff; border: none; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Sora',sans-serif; transition: all .18s; white-space: nowrap; }
  .btn-blue:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .btn-blue:disabled { opacity: .5; cursor: not-allowed; }
  .btn-ghost { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 9px; background: var(--bg); color: var(--muted); border: 1.5px solid var(--border); font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Sora',sans-serif; transition: all .18s; white-space: nowrap; }
  .btn-ghost:hover { border-color: var(--blue-mid); color: var(--blue); background: var(--blue-soft); }
  .btn-amber { display: inline-flex; align-items: center; gap: 5px; padding: 8px 16px; border-radius: 9px; background: var(--amber); color: #fff; border: none; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Sora',sans-serif; transition: all .18s; white-space: nowrap; }
  .btn-amber:hover { opacity: .88; transform: translateY(-1px); }
  .btn-danger { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 8px; background: #FEF2F2; color: var(--red); border: 1.5px solid #FECACA; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Sora',sans-serif; transition: all .18s; white-space: nowrap; }
  .btn-danger:hover { background: #FEE2E2; }
  .btn-green { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 8px; background: #ECFDF5; color: var(--green); border: 1.5px solid #A7F3D0; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Sora',sans-serif; transition: all .18s; white-space: nowrap; }
  .btn-green:hover { background: #D1FAE5; }
  .btn-red { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 8px; background: #FEF2F2; color: var(--red); border: 1.5px solid #FECACA; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Sora',sans-serif; transition: all .18s; }
  .btn-red:hover { background: #FEE2E2; }

  /* ── BADGES ── */
  .badge { display: inline-flex; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
  .b-admin   { background: #EFF6FF; color: #2563EB; }
  .b-teacher { background: #ECFDF5; color: #059669; }
  .b-student { background: #F5F3FF; color: #7C3AED; }
  .b-parent  { background: #FEF3C7; color: #D97706; }
  .b-active  { background: #ECFDF5; color: #059669; }
  .b-inactive{ background: #FEF2F2; color: #EF4444; }

  /* ── USER TABLE ── */
  .a-user-table { overflow-x: auto; }
  .a-user-row {
    display: grid;
    grid-template-columns: minmax(120px,2fr) 80px minmax(100px,2fr) 70px auto;
    align-items: center; padding: 11px 14px;
    border-bottom: 1px solid var(--bg); font-size: 13px; gap: 10px;
    min-width: 520px;
  }
  .a-user-row:hover { background: var(--bg); }
  .a-user-hdr { background: var(--bg); border-radius: 8px 8px 0 0; }

  /* ── SEARCH ── */
  .a-search { padding: 9px 12px; border: 1.5px solid var(--border); border-radius: 9px; font-size: 13px; font-family: 'Sora',sans-serif; outline: none; background: var(--surface); color: var(--text); transition: border .2s; }
  .a-search:focus { border-color: var(--blue-mid); }
  .a-search::placeholder { color: var(--faint); }

  /* ── INPUT / SELECT ── */
  .a-input { width: 100%; padding: 9px 12px; border: 1.5px solid var(--border); border-radius: 9px; font-size: 13px; font-family: 'Sora',sans-serif; outline: none; background: var(--surface2); color: var(--text); transition: border .2s; }
  .a-input:focus { border-color: var(--blue); background: #fff; }
  .a-input.err { border-color: var(--red); }
  .a-select { width: 100%; padding: 9px 12px; border: 1.5px solid var(--border); border-radius: 9px; font-size: 13px; font-family: 'Sora',sans-serif; outline: none; background: var(--surface2); color: var(--text); }
  .a-label { display: block; font-size: 11px; font-weight: 700; color: var(--muted); margin-bottom: 5px; text-transform: uppercase; letter-spacing: .4px; }
  .a-field { margin-bottom: 12px; }
  .a-ferr { color: var(--red); font-size: 11px; margin-top: 3px; }

  /* ── TABS ── */
  .a-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .a-tab-btn { padding: 7px 14px; border-radius: 9px; border: 1.5px solid var(--border); background: var(--surface); font-size: 12px; font-weight: 600; color: var(--muted); cursor: pointer; font-family: 'Sora',sans-serif; transition: all .18s; white-space: nowrap; }
  .a-tab-btn.active { background: var(--blue); color: #fff; border-color: var(--blue); }

  /* ── ROLE FILTER ── */
  .a-role-btn { padding: 7px 12px; border-radius: 9px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Sora',sans-serif; transition: all .18s; text-transform: capitalize; white-space: nowrap; }

  /* ── GRADE CARD ── */
  .a-grade-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 14px; padding: 16px; margin-bottom: 10px; }
  .a-class-mini { background: var(--bg); border-radius: 10px; padding: 10px 12px; border: 1.5px solid var(--border); }
  .a-classes-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(180px,1fr)); gap: 8px; margin-top: 10px; }

  /* ── SEL ITEM ── */
  .a-sel-item { padding: 11px 14px; border-radius: 11px; border: 1.5px solid var(--border); margin-bottom: 6px; cursor: pointer; background: var(--surface); transition: all .18s; }
  .a-sel-item:hover { border-color: var(--blue-mid); background: var(--blue-soft); }
  .a-sel-item.active { border-color: var(--blue); background: var(--blue-soft); }

  /* ── PARENT CARD ── */
  .a-parent-card { padding: 12px 14px; border-radius: 11px; border: 1.5px solid var(--border); margin-bottom: 7px; cursor: pointer; background: var(--surface); transition: all .18s; }
  .a-parent-card:hover { border-color: #FDE68A; background: #FFFBEB; }
  .a-parent-card.selected { border-color: var(--amber); background: #FEF3C7; }

  /* ── PARENT LINKING LAYOUT ── */
  .a-parent-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  @media (min-width: 768px) { .a-parent-grid { grid-template-columns: 1fr 1.4fr; } }

  /* ── GRADE BOOK ── */
  .a-gb-row { display: grid; grid-template-columns: minmax(120px,2fr) 1fr 1fr 1fr 1fr; align-items: center; padding: 11px 14px; border-bottom: 1px solid var(--bg); font-size: 13px; gap: 8px; min-width: 480px; }
  .a-gb-hdr { background: var(--bg); }
  .pbar { height: 5px; background: var(--bg); border-radius: 3px; overflow: hidden; margin-top: 5px; }
  .pfill { height: 100%; border-radius: 3px; transition: width .8s ease; }

  /* ── ANALYTICS ── */
  .a-an-grid5 { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; margin-bottom: 18px; }
  @media (min-width: 640px) { .a-an-grid5 { grid-template-columns: repeat(3,1fr); } }
  @media (min-width: 1024px) { .a-an-grid5 { grid-template-columns: repeat(5,1fr); } }

  .a-an-grid2 { display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 14px; }
  @media (min-width: 768px) { .a-an-grid2 { grid-template-columns: 1fr 1fr; } }

  .a-an-table { overflow-x: auto; }
  .a-an-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; padding: 10px 14px; border-bottom: 1px solid var(--bg); font-size: 13px; align-items: center; gap: 8px; min-width: 420px; }

  /* ── TIMETABLE LAYOUT ── */
  .a-tt-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  @media (min-width: 768px) { .a-tt-grid { grid-template-columns: 260px 1fr; } }

  /* ── STUDENTS LAYOUT ── */
  .a-students-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  @media (min-width: 768px) { .a-students-grid { grid-template-columns: 1fr 1fr; } }

  /* ── MODAL ── */
  .a-modal-bg { position: fixed; inset: 0; background: rgba(15,23,42,.55); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
  .a-modal { background: var(--surface); border-radius: 18px; padding: 24px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; position: relative; }
  .a-modal-bar { height: 3px; background: linear-gradient(90deg,#2563EB,#7C3AED); border-radius: 20px 20px 0 0; margin: -24px -24px 20px; }
  .a-modal-title { font-family: 'Playfair Display',serif; font-weight: 800; font-size: 20px; margin-bottom: 18px; color: var(--text); }

  /* ── TOAST ── */
  .a-toast { position: fixed; bottom: 20px; right: 20px; padding: 13px 18px; border-radius: 12px; font-size: 13px; font-weight: 700; z-index: 300; max-width: 320px; animation: slideToast .3s ease; font-family: 'Sora',sans-serif; box-shadow: 0 8px 24px rgba(0,0,0,.15); }
  @keyframes slideToast { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .a-toast.success { background: linear-gradient(135deg,#059669,#10B981); color: #fff; }
  .a-toast.error   { background: linear-gradient(135deg,#DC2626,#EF4444); color: #fff; }

  /* ── EMPTY ── */
  .a-empty { text-align: center; padding: 36px 20px; color: var(--faint); font-size: 13px; }
  .a-empty-icon { font-size: 36px; margin-bottom: 10px; }
`;

function ClassCard({ c, teachers, onDelete, onAddSubject, onRemoveSubject }) {
  const [addOpen,    setAddOpen]    = React.useState(false);
  const [newTeacher, setNewTeacher] = React.useState("");
  const [newSubject, setNewSubject] = React.useState("");
  const SUBJECTS = ["Math","English","Arabic","Science","Social Studies","Islamic","Computer","Art","P.E","Karate","Music","High-Level","Other"];

  return (
    <div style={{background:"#fff",borderRadius:12,padding:16,border:"1.5px solid #E5E7EB",marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,gap:8}}>
        <div>
          <div style={{fontWeight:800,fontSize:14,color:"#0F172A"}}>Class {c.name}</div>
          <div style={{fontSize:12,color:"#64748B"}}>{c.grade_name} · {c.student_count||0} students</div>
        </div>
        <button className="btn-danger" style={{fontSize:11}} onClick={()=>onDelete(c.id)}>Delete</button>
      </div>
      <div style={{fontSize:11,fontWeight:700,color:"#2563EB",marginBottom:6}}>Subject Teachers</div>
      {(c.subject_teachers||[]).map(st=>(
        <div key={st.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 8px",background:"#EFF6FF",borderRadius:6,marginBottom:4,fontSize:12,gap:6}}>
          <span style={{flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}><b>{st.subject}</b> — {st.teacher_name}</span>
          <button onClick={()=>onRemoveSubject(c.id,st.id)} style={{background:"none",border:"none",color:"#EF4444",cursor:"pointer",fontSize:14,flexShrink:0}}>✕</button>
        </div>
      ))}
      {!addOpen ? (
        <button onClick={()=>setAddOpen(true)} style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px dashed #93C5FD",background:"#EFF6FF",color:"#2563EB",cursor:"pointer",marginTop:4,fontFamily:"inherit"}}>
          + Add Subject Teacher
        </button>
      ) : (
        <div style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px",border:"1px solid #E2E8F0",marginTop:6}}>
          <select value={newSubject} onChange={e=>setNewSubject(e.target.value)}
            style={{width:"100%",padding:"5px 8px",borderRadius:6,border:"1.5px solid #E2E8F0",fontSize:12,marginBottom:5,fontFamily:"inherit",background:"#fff",color:"#0F172A"}}>
            <option value="">— Subject —</option>
            {SUBJECTS.map(s=><option key={s}>{s}</option>)}
          </select>
          <select value={newTeacher} onChange={e=>setNewTeacher(e.target.value)}
            style={{width:"100%",padding:"5px 8px",borderRadius:6,border:"1.5px solid #E2E8F0",fontSize:12,marginBottom:5,fontFamily:"inherit",background:"#fff",color:"#0F172A"}}>
            <option value="">— Teacher —</option>
            {teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
          <div style={{display:"flex",gap:5}}>
            <button onClick={()=>{onAddSubject(c.id,newTeacher,newSubject);setAddOpen(false);setNewTeacher("");setNewSubject("");}}
              style={{flex:1,padding:"5px",borderRadius:6,border:"none",background:"#2563EB",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
              Add
            </button>
            <button onClick={()=>setAddOpen(false)}
              style={{padding:"5px 10px",borderRadius:6,border:"none",background:"#F1F5F9",color:"#64748B",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab]     = useState("overview");

  const [users,       setUsers]       = useState([]);
  const [loadingU,    setLoadingU]    = useState(false);
  const [search,      setSearch]      = useState("");
  const [roleF,       setRoleF]       = useState("all");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser,     setNewUser]     = useState({ first_name:"", last_name:"", email:"", role:"student", password:"" });
  const [formErrU,    setFormErrU]    = useState({});

  const [grades,        setGrades]        = useState([]);
  const [loadingG,      setLoadingG]      = useState(false);
  const [selGrade,      setSelGrade]      = useState(null);
  const [selClass,      setSelClass]      = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [teachers,      setTeachers]      = useState([]);
  const [unassigned,    setUnassigned]    = useState([]);
  const [showAddGrade,  setShowAddGrade]  = useState(false);
  const [showAddClass,  setShowAddClass]  = useState(false);
  const [newGradeName,  setNewGradeName]  = useState("");
  const [newClass,      setNewClass]      = useState({ name:"" });
  const [acView,        setAcView]        = useState("grades");

  const [parents,       setParents]       = useState([]);
  const [students,      setStudents]      = useState([]);
  const [selParent,     setSelParent]     = useState(null);
  const [parentChildren,setParentChildren]= useState([]);
  const [loadingPL,     setLoadingPL]     = useState(false);
  const [parentSearch,  setParentSearch]  = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const [gradeBook,     setGradeBook]     = useState([]);
  const [loadingGB,     setLoadingGB]     = useState(false);
  const [gbClassFilter, setGbClassFilter] = useState("");
  const [gbSearch,      setGbSearch]      = useState("");

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAn,     setLoadingAn]     = useState(false);

  const [selTTClass, setSelTTClass] = useState(null);
  const [stats, setStats] = useState({ total:0, teachers:0, students:0, grades:0 });

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = (msg, type="success") => {
    setToast({msg,type});
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToast(null),3000);
  };

  useEffect(()=>{
    if (tab==="overview") usersAPI.stats().then(setStats).catch(()=>{});
  },[tab]);

  const loadUsers = useCallback(async () => {
    setLoadingU(true);
    try {
      const p = {};
      if (roleF!=="all") p.role=roleF;
      if (search) p.search=search;
      const d = await usersAPI.list(p);
      setUsers(d.results||d);
    } catch { showToast("Failed to load users","error"); }
    finally { setLoadingU(false); }
  },[roleF, search]);

  const searchTimer = useRef(null);
  useEffect(()=>{
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(()=>loadUsers(),500);
    return ()=>clearTimeout(searchTimer.current);
  },[loadUsers]);

  const loadGrades    = useCallback(async()=>{ setLoadingG(true); try { const d=await academicsAPI.grades.list(); setGrades(d.results||d); } catch{} finally{setLoadingG(false);} },[]);
  const loadTeachers  = useCallback(async()=>{ try { setTeachers(await academicsAPI.teachers()); } catch{} },[]);
  const loadUnassigned= useCallback(async()=>{ try { setUnassigned(await academicsAPI.unassignedStudents()); } catch{} },[]);

  useEffect(()=>{ if(tab==="academics"){ loadGrades(); loadTeachers(); loadUnassigned(); } },[tab,loadGrades,loadTeachers,loadUnassigned]);

  useEffect(()=>{
    if (!selClass) return;
    academicsAPI.classes.students(selClass.id).then(d=>setClassStudents(d.students||[])).catch(()=>setClassStudents([]));
  },[selClass]);

  const loadParentLinking = useCallback(async()=>{
    setLoadingPL(true);
    try {
      const [pList,sAll] = await Promise.all([ usersAPI.list({role:"parent"}), usersAPI.list({role:"student"}) ]);
      setParents(pList.results||pList); setStudents(sAll.results||sAll);
    } catch { showToast("Failed to load data","error"); }
    finally { setLoadingPL(false); }
  },[]);

  const loadParentChildren = useCallback(async(parentId)=>{
    try {
      const data=await parentAPI.adminParentChildren(parentId);
      setParentChildren(Array.isArray(data)?data:(data.results||[]));
    } catch { setParentChildren([]); }
  },[]);

  useEffect(()=>{ if(tab==="parents") loadParentLinking(); },[tab,loadParentLinking]);
  useEffect(()=>{ if(selParent) loadParentChildren(selParent.id); },[selParent,loadParentChildren]);

  const handleLinkChild   = async(parentId,childId)=>{ try { const res=await parentAPI.linkChild(parentId,childId); showToast(res.message||"Linked!"); loadParentChildren(parentId); } catch(e){showToast(e?.error||"Failed","error");} };
  const handleUnlinkChild = async(parentId,childId)=>{ try { await parentAPI.unlinkChild(parentId,childId); showToast("Unlinked!"); loadParentChildren(parentId); } catch{showToast("Failed","error");} };

  const loadGradeBook = useCallback(async(classId)=>{
    setLoadingGB(true);
    try { const params={}; if(classId) params.class_id=classId; const d=await gradeBookAPI.list(params); setGradeBook(d.students||[]); }
    catch { showToast("Failed","error"); }
    finally { setLoadingGB(false); }
  },[]);

  useEffect(()=>{ if(tab==="gradebook"){ loadGrades(); loadGradeBook(gbClassFilter); } },[tab,gbClassFilter,loadGradeBook]);
  useEffect(()=>{ if(tab==="analytics"){ setLoadingAn(true); analyticsAPI.dashboard().then(d=>{setAnalyticsData(d);setLoadingAn(false);}).catch(()=>setLoadingAn(false)); } },[tab]);

  const handleToggleUser = async(id)=>{ try { const res=await usersAPI.toggleStatus(id); setUsers(u=>u.map(x=>x.id===id?{...x,is_active:res.is_active}:x)); showToast(res.message); } catch{showToast("Action failed","error");} };
  const handleDeleteUser = async(id,name)=>{ if(!window.confirm(`Delete user "${name}"?`)) return; try { await usersAPI.delete(id); setUsers(u=>u.filter(x=>x.id!==id)); showToast("User deleted!"); } catch{showToast("Cannot delete this user","error");} };

  const handleAddUser = async()=>{
    const e={};
    if(!newUser.first_name) e.first_name="Required";
    if(!newUser.last_name)  e.last_name="Required";
    if(!newUser.email||!/\S+@\S+\.\S+/.test(newUser.email)) e.email="Valid email required";
    if(!newUser.password||newUser.password.length<6) e.password="Min 6 chars";
    if(Object.keys(e).length){ setFormErrU(e); return; }
    try {
      await usersAPI.create({...newUser,username:newUser.email.split("@")[0]});
      showToast("User created!"); setShowAddUser(false);
      setNewUser({first_name:"",last_name:"",email:"",role:"student",password:""}); setFormErrU({});
      loadUsers();
    } catch(err){ showToast(err?.email?.[0]||"Failed","error"); }
  };

  const handleAddGrade  = async()=>{ if(!newGradeName.trim()){showToast("Enter grade name","error");return;} try{await academicsAPI.grades.create({name:newGradeName.trim()});showToast("Grade created!");setShowAddGrade(false);setNewGradeName("");loadGrades();}catch(err){showToast(err?.name?.[0]||"Failed","error");} };
  const handleDeleteGrade = async(id)=>{ if(!window.confirm("Delete this grade and all its classes?")) return; try{await academicsAPI.grades.delete(id);showToast("Deleted!");setSelGrade(null);setSelClass(null);loadGrades();}catch{showToast("Cannot delete","error");} };
  const handleAddClass  = async()=>{ if(!newClass.name.trim()){showToast("Enter class name","error");return;} if(!selGrade){showToast("Select a grade first","error");return;} try{await academicsAPI.classes.create({grade:selGrade.id,name:newClass.name.trim()});showToast("Class created!");setShowAddClass(false);setNewClass({name:""});loadGrades();}catch(err){showToast(err?.name?.[0]||"Failed","error");} };
  const handleDeleteClass = async(id)=>{ if(!window.confirm("Delete this class?")) return; try{await academicsAPI.classes.delete(id);showToast("Deleted!");setSelClass(null);setClassStudents([]);loadGrades();}catch{showToast("Cannot delete","error");} };

  const handleAddSubjectTeacher    = async(classId,teacherId,subject)=>{ if(!subject.trim()||!teacherId){showToast("Select teacher and subject","error");return;} try{await academicsAPI.classes.addSubjectTeacher(classId,teacherId,subject);showToast("Teacher added!");loadGrades();}catch(e){showToast(e?.error||"Failed","error");} };
  const handleRemoveSubjectTeacher = async(classId,stId)=>{ try{await academicsAPI.classes.removeSubjectTeacher(classId,stId);showToast("Removed!");loadGrades();}catch{showToast("Failed","error");} };

  const handleAssignStudent = async(studentId)=>{ if(!selClass) return; try{const res=await academicsAPI.classes.assignStudent(selClass.id,studentId);showToast(res.message);const d=await academicsAPI.classes.students(selClass.id);setClassStudents(d.students||[]);loadUnassigned();loadGrades();}catch{showToast("Failed","error");} };
  const handleRemoveStudent = async(studentId)=>{ if(!selClass) return; try{await academicsAPI.classes.removeStudent(selClass.id,studentId);showToast("Removed!");const d=await academicsAPI.classes.students(selClass.id);setClassStudents(d.students||[]);loadUnassigned();loadGrades();}catch{showToast("Failed","error");} };

  const allClasses = grades.flatMap(g=>(g.classes||[]).map(c=>({...c,grade_name:g.name})));
  const name       = user?.full_name||user?.first_name||"Admin";

  const filteredParents  = parents.filter(p=>!parentSearch||p.full_name?.toLowerCase().includes(parentSearch.toLowerCase())||p.email?.toLowerCase().includes(parentSearch.toLowerCase()));
  const filteredStudents = students.filter(s=>!studentSearch||s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()));
  const linkedIds        = new Set(parentChildren.map(c=>c.id));

  const navTo = (id) => { setTab(id); setSidebarOpen(false); };

  return (
    <div className="a-root">
      <style>{S}</style>

      <div className={`a-overlay${sidebarOpen?" open":""}`} onClick={()=>setSidebarOpen(false)}/>

      {/* ── SIDEBAR ── */}
      <aside className={`a-sidebar${sidebarOpen?" open":""}`}>
        <div className="a-logo">
          <div className="a-logo-icon">🎓</div>
          <span className="a-logo-text">EduPortal</span>
        </div>
        <div className="a-user-chip">
          <div className="a-user-role">Admin</div>
          <div className="a-user-name">{name}</div>
          <div className="a-user-email">{user?.email}</div>
        </div>
        <nav className="a-nav">
          {NAV.map(n=>(
            <button key={n.id}
              className={`a-nav-btn${tab===n.id?(n.id==="parents"?" amber-active":" active"):""}`}
              onClick={()=>navTo(n.id)}>
              <span style={{fontSize:14,width:18,textAlign:"center"}}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="a-nav-footer">
          <button className="a-nav-btn" onClick={()=>{ navigate("/profile"); setSidebarOpen(false); }}>
            <span style={{fontSize:14}}>👤</span> My Profile
          </button>
          <button className="a-nav-btn" style={{color:"var(--red)"}} onClick={()=>{logout();navigate("/");}}>
            <span style={{fontSize:14}}>→</span> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="a-main">
        <header className="a-header">
          <div className="a-header-left">
            <button className="a-hamburger" onClick={()=>setSidebarOpen(true)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="a-header-accent" style={{background:tab==="parents"?"var(--amber)":"var(--blue)"}}/>
            <span className="a-header-title">{NAV.find(n=>n.id===tab)?.label}</span>
          </div>
          <div className="a-avatar">{name.charAt(0).toUpperCase()}</div>
        </header>

        <div className="a-content">

          {/* ══ OVERVIEW ══ */}
          {tab==="overview" && (
            <div className="fade">
              <div className="a-kpi-grid">
                {[
                  ["Total Users",stats.total,  "#2563EB"],
                  ["Teachers",  stats.teachers,"#059669"],
                  ["Students",  stats.students,"#7C3AED"],
                  ["Grades",    stats.grades,  "#D97706"],
                ].map(([l,v,c])=>(
                  <div key={l} className="a-kpi">
                    <div className="a-kpi-val" style={{color:c}}>{v}</div>
                    <div className="a-kpi-label">{l}</div>
                  </div>
                ))}
              </div>
              <div className="a-card">
                <div className="a-card-title">⚡ Quick Actions</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button className="btn-blue"  onClick={()=>navTo("users")}>Manage Users</button>
                  <button className="btn-ghost" onClick={()=>navTo("academics")}>Manage Classes</button>
                  <button className="btn-amber" onClick={()=>navTo("parents")}>Link Parents</button>
                  <button className="btn-ghost" onClick={()=>navTo("gradebook")}>Grade Book</button>
                  <button className="btn-ghost" onClick={()=>navTo("analytics")}>Analytics</button>
                  <button className="btn-blue"  onClick={()=>setShowAddUser(true)}>+ Add User</button>
                </div>
              </div>
            </div>
          )}

          {/* ══ USERS ══ */}
          {tab==="users" && (
            <div className="fade">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users..."
                    className="a-search" style={{width:180}}/>
                  {["all","admin","teacher","student","parent"].map(r=>(
                    <button key={r} className="a-role-btn" onClick={()=>setRoleF(r)}
                      style={{background:roleF===r?"#2563EB":"#F8FAFC",color:roleF===r?"#fff":"#64748B",border:roleF===r?"none":"1.5px solid #E5E7EB",padding:"6px 12px"}}>
                      {r}
                    </button>
                  ))}
                </div>
                <button className="btn-blue" onClick={()=>setShowAddUser(true)}>+ Add User</button>
              </div>

              <div className="a-card" style={{padding:0,overflow:"hidden"}}>
                <div className="a-user-table">
                  <div className="a-user-row a-user-hdr">
                    {["Name","Role","Email","Status","Actions"].map(h=>(
                      <div key={h} style={{fontSize:11,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.4}}>{h}</div>
                    ))}
                  </div>
                  {loadingU
                    ? <div style={{padding:32,textAlign:"center",color:"var(--faint)"}}>Loading...</div>
                    : users.length===0
                      ? <div style={{padding:32,textAlign:"center",color:"var(--faint)"}}>No users found</div>
                      : users.map(u=>(
                        <div key={u.id} className="a-user-row">
                          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                            <div style={{width:30,height:30,borderRadius:"50%",background:RB[u.role]||"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:RC[u.role]||"#64748B",flexShrink:0}}>
                              {(u.first_name||"?").charAt(0).toUpperCase()}
                            </div>
                            <span style={{fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.full_name||`${u.first_name} ${u.last_name}`}</span>
                          </div>
                          <span className={`badge b-${u.role}`}>{u.role}</span>
                          <span style={{color:"var(--muted)",fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</span>
                          <span className={`badge b-${u.is_active?"active":"inactive"}`}>{u.is_active?"Active":"Off"}</span>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            <button className={u.is_active?"btn-red":"btn-green"} style={{fontSize:10}} onClick={()=>handleToggleUser(u.id)}>
                              {u.is_active?"Off":"On"}
                            </button>
                            <button className="btn-danger" style={{fontSize:10}} onClick={()=>handleDeleteUser(u.id,u.full_name||u.first_name)}>🗑</button>
                          </div>
                        </div>
                      ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* ══ ACADEMICS ══ */}
          {tab==="academics" && (
            <div className="fade">
              <div className="a-tabs">
                {[["grades","Grades"],["classes","Classes"],["students","Assign Students"]].map(([id,label])=>(
                  <button key={id} className={`a-tab-btn${acView===id?" active":""}`} onClick={()=>setAcView(id)}>{label}</button>
                ))}
              </div>

              {acView==="grades" && (
                <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>All Grades ({grades.length})</span>
                    <button className="btn-blue" onClick={()=>setShowAddGrade(true)}>+ Add Grade</button>
                  </div>
                  {loadingG
                    ? <div className="a-card"><div className="a-empty">Loading...</div></div>
                    : grades.length===0
                      ? <div className="a-card"><div className="a-empty"><div className="a-empty-icon">🏫</div>No grades yet.</div></div>
                      : grades.map(g=>(
                        <div key={g.id} className="a-grade-card">
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:g.classes?.length>0?12:0,gap:8,flexWrap:"wrap"}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <div style={{width:40,height:40,background:"var(--blue-soft)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"var(--blue)",fontSize:13,flexShrink:0}}>
                                {g.name.replace("Grade ","")}
                              </div>
                              <div>
                                <div style={{fontWeight:700,fontSize:14,color:"var(--text)"}}>{g.name}</div>
                                <div style={{fontSize:12,color:"var(--muted)"}}>{g.classes?.length||0} classes · {g.total_students||0} students</div>
                              </div>
                            </div>
                            <div style={{display:"flex",gap:8}}>
                              <button className="btn-ghost" style={{fontSize:11}} onClick={()=>{setSelGrade(g);setShowAddClass(true);}}>+ Class</button>
                              <button className="btn-danger" style={{fontSize:11}} onClick={()=>handleDeleteGrade(g.id)}>Delete</button>
                            </div>
                          </div>
                          {g.classes?.length>0 && (
                            <div className="a-classes-grid">
                              {g.classes.map(c=>(
                                <div key={c.id} className="a-class-mini">
                                  <div style={{fontWeight:700,fontSize:13,color:"var(--text)",marginBottom:2}}>Class {c.name}</div>
                                  <div style={{fontSize:11,color:"var(--muted)"}}>Teacher: <span style={{color:c.teacher_name?"#059669":"#EF4444",fontWeight:600}}>{c.teacher_name||"Unassigned"}</span></div>
                                  <div style={{fontSize:11,color:"var(--muted)"}}>Students: {c.student_count||0}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                  }
                </>
              )}

              {acView==="classes" && (
                <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>All Classes ({allClasses.length})</span>
                    <button className="btn-blue" onClick={()=>{if(!selGrade&&grades.length>0)setSelGrade(grades[0]);setShowAddClass(true);}}>+ Add Class</button>
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                    <button className="a-tab-btn" style={{background:!selGrade?"var(--blue)":"#F8FAFC",color:!selGrade?"#fff":"#64748B",borderColor:!selGrade?"var(--blue)":"#E5E7EB"}} onClick={()=>setSelGrade(null)}>All</button>
                    {grades.map(g=>(
                      <button key={g.id} className="a-tab-btn" style={{background:selGrade?.id===g.id?"var(--blue)":"#F8FAFC",color:selGrade?.id===g.id?"#fff":"#64748B",borderColor:selGrade?.id===g.id?"var(--blue)":"#E5E7EB"}} onClick={()=>setSelGrade(g)}>{g.name}</button>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
                    {(selGrade?allClasses.filter(c=>c.grade===selGrade.id):allClasses).map(c=>(
                      <ClassCard key={c.id} c={c} teachers={teachers}
                        onDelete={handleDeleteClass}
                        onAddSubject={handleAddSubjectTeacher}
                        onRemoveSubject={handleRemoveSubjectTeacher}/>
                    ))}
                    {allClasses.length===0 && <div className="a-card" style={{gridColumn:"1/-1"}}><div className="a-empty">No classes yet.</div></div>}
                  </div>
                </>
              )}

              {acView==="students" && (
                <div className="a-students-grid">
                  <div>
                    <h3 style={{fontSize:14,fontWeight:700,marginBottom:12,color:"var(--text)"}}>Select Class</h3>
                    {allClasses.map(c=>(
                      <div key={c.id} className={`a-sel-item${selClass?.id===c.id?" active":""}`} onClick={()=>setSelClass(c)}>
                        <div style={{fontWeight:700,fontSize:13,color:"var(--text)"}}>Class {c.name} <span style={{color:"var(--muted)",fontWeight:400}}>({c.grade_name})</span></div>
                        <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{c.student_count||0} students</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    {!selClass
                      ? <div className="a-card"><div className="a-empty"><div className="a-empty-icon">🏫</div>Select a class</div></div>
                      : (
                        <>
                          <h3 style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:12}}>Class {selClass.name} ({classStudents.length})</h3>
                          <div className="a-card" style={{marginBottom:12}}>
                            <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Enrolled</div>
                            {classStudents.length===0
                              ? <p style={{fontSize:13,color:"var(--faint)"}}>No students enrolled.</p>
                              : classStudents.map(s=>(
                                <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--bg)",gap:8}}>
                                  <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                                    <div style={{width:28,height:28,borderRadius:"50%",background:"#EDE9FE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#7C3AED",flexShrink:0}}>
                                      {s.full_name?.charAt(0)}
                                    </div>
                                    <div style={{minWidth:0}}>
                                      <div style={{fontSize:13,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.full_name}</div>
                                      <div style={{fontSize:11,color:"var(--faint)"}}>{s.email}</div>
                                    </div>
                                  </div>
                                  <button className="btn-danger" style={{fontSize:10,flexShrink:0}} onClick={()=>handleRemoveStudent(s.id)}>Remove</button>
                                </div>
                              ))
                            }
                          </div>
                          {unassigned.length>0 && (
                            <div className="a-card">
                              <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Unassigned Students</div>
                              {unassigned.map(s=>(
                                <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--bg)",gap:8}}>
                                  <div style={{minWidth:0}}>
                                    <div style={{fontSize:13,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.full_name}</div>
                                    <div style={{fontSize:11,color:"var(--faint)"}}>{s.email}</div>
                                  </div>
                                  <button className="btn-green" style={{fontSize:10,flexShrink:0}} onClick={()=>handleAssignStudent(s.id)}>+ Add</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ PARENT LINKING ══ */}
          {tab==="parents" && (
            <div className="fade">
              <div style={{background:"#FEF3C7",border:"1.5px solid #FDE68A",borderRadius:12,padding:"12px 16px",marginBottom:18,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <span style={{fontSize:20}}>👨‍👩‍👦</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#92400E"}}>Parent–Student Linking</div>
                  <div style={{fontSize:12,color:"#B45309"}}>Select a parent, then link or unlink students.</div>
                </div>
              </div>

              {loadingPL
                ? <div className="a-card"><div className="a-empty">Loading...</div></div>
                : (
                  <div className="a-parent-grid">
                    {/* LEFT — parents */}
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
                        <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>Parents ({parents.length})</span>
                        <button className="btn-amber" style={{fontSize:11}} onClick={()=>{setShowAddUser(true);setNewUser(u=>({...u,role:"parent"}));}}>+ New Parent</button>
                      </div>
                      <input className="a-search" style={{width:"100%",marginBottom:10}} placeholder="Search parents..."
                        value={parentSearch} onChange={e=>setParentSearch(e.target.value)}/>
                      {parents.length===0
                        ? <div className="a-card"><div className="a-empty"><div className="a-empty-icon">👨‍👩‍👦</div>No parents yet.</div></div>
                        : filteredParents.map(p=>(
                          <div key={p.id} className={`a-parent-card${selParent?.id===p.id?" selected":""}`} onClick={()=>setSelParent(p)}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <div style={{width:36,height:36,borderRadius:"50%",background:"#FEF3C7",border:"2px solid #FDE68A",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:"#D97706",flexShrink:0}}>
                                {(p.first_name||"?").charAt(0).toUpperCase()}
                              </div>
                              <div style={{minWidth:0}}>
                                <div style={{fontWeight:700,fontSize:13,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.full_name||`${p.first_name} ${p.last_name}`}</div>
                                <div style={{fontSize:11,color:"var(--muted)"}}>{p.email}</div>
                              </div>
                              {selParent?.id===p.id && <span style={{marginLeft:"auto",fontSize:10,background:"#D97706",color:"#fff",padding:"2px 8px",borderRadius:999,fontWeight:700,flexShrink:0}}>Selected</span>}
                            </div>
                          </div>
                        ))
                      }
                    </div>

                    {/* RIGHT — student linking */}
                    <div>
                      {!selParent
                        ? <div className="a-card"><div className="a-empty"><div className="a-empty-icon">👆</div>Select a parent to manage children</div></div>
                        : (
                          <>
                            <div className="a-card" style={{marginBottom:14}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                                <div>
                                  <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{selParent.full_name||selParent.first_name}'s Children</div>
                                  <p style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{parentChildren.length} linked</p>
                                </div>
                              </div>
                              {parentChildren.length===0
                                ? <div className="a-empty" style={{padding:"16px 0"}}>No students linked yet</div>
                                : parentChildren.map(c=>(
                                  <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid var(--bg)",gap:8}}>
                                    <div style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
                                      <div style={{width:30,height:30,borderRadius:"50%",background:"#EDE9FE",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"#7C3AED",flexShrink:0}}>{c.full_name?.charAt(0)||"?"}</div>
                                      <div style={{minWidth:0}}>
                                        <div style={{fontSize:13,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.full_name}</div>
                                        <div style={{fontSize:11,color:"var(--faint)"}}>{c.email}</div>
                                      </div>
                                    </div>
                                    <button className="btn-red" style={{fontSize:10,flexShrink:0}} onClick={()=>handleUnlinkChild(selParent.id,c.id)}>Unlink</button>
                                  </div>
                                ))
                              }
                            </div>
                            <div className="a-card">
                              <h4 style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:10}}>Link a Student</h4>
                              <input className="a-search" style={{width:"100%",marginBottom:10}} placeholder="Search students..."
                                value={studentSearch} onChange={e=>setStudentSearch(e.target.value)}/>
                              <div style={{maxHeight:280,overflowY:"auto"}}>
                                {filteredStudents.length===0
                                  ? <p style={{fontSize:13,color:"var(--faint)",textAlign:"center",padding:16}}>No students found</p>
                                  : filteredStudents.map(s=>{
                                    const isLinked=linkedIds.has(s.id);
                                    return (
                                      <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid var(--bg)",gap:8}}>
                                        <div style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
                                          <div style={{width:28,height:28,borderRadius:"50%",background:"#EDE9FE",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,color:"#7C3AED",flexShrink:0}}>{s.full_name?.charAt(0)||"?"}</div>
                                          <div style={{minWidth:0}}>
                                            <div style={{fontSize:13,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.full_name}</div>
                                            <div style={{fontSize:11,color:"var(--faint)"}}>{s.email}</div>
                                          </div>
                                        </div>
                                        {isLinked
                                          ? <span style={{fontSize:10,background:"#ECFDF5",color:"#059669",border:"1px solid #A7F3D0",padding:"3px 8px",borderRadius:999,fontWeight:700,flexShrink:0}}>✓ Linked</span>
                                          : <button className="btn-green" style={{fontSize:10,flexShrink:0}} onClick={()=>handleLinkChild(selParent.id,s.id)}>+ Link</button>
                                        }
                                      </div>
                                    );
                                  })
                                }
                              </div>
                            </div>
                          </>
                        )
                      }
                    </div>
                  </div>
                )
              }
            </div>
          )}

          {/* ══ GRADE BOOK ══ */}
          {tab==="gradebook" && (
            <div className="fade">
              <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
                <input value={gbSearch} onChange={e=>setGbSearch(e.target.value)} placeholder="Search student..."
                  className="a-search" style={{width:180}}/>
                <select value={gbClassFilter} onChange={e=>setGbClassFilter(e.target.value)} className="a-select" style={{width:"auto"}}>
                  <option value="">All Classes</option>
                  {grades.flatMap(g=>(g.classes||[]).map(c=>(
                    <option key={c.id} value={c.id}>{g.name} — Class {c.name}</option>
                  )))}
                </select>
                <button className="btn-blue" onClick={()=>loadGradeBook(gbClassFilter)}>Refresh</button>
              </div>

              {gradeBook.length>0 && (
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:16}}>
                  {[
                    ["Students",    gradeBook.length,                                                "#2563EB"],
                    ["Avg Attend.", Math.round(gradeBook.reduce((a,s)=>a+s.attendance_rate,0)/gradeBook.length)+"%","#059669"],
                    ["Avg Quiz",    Math.round(gradeBook.reduce((a,s)=>a+s.quiz_avg,0)/gradeBook.length)+"%",       "#7C3AED"],
                    ["At Risk",     gradeBook.filter(s=>s.quiz_avg<60||s.attendance_rate<60).length,                "#EF4444"],
                  ].map(([l,v,c])=>(
                    <div key={l} className="a-kpi" style={{textAlign:"center"}}>
                      <div className="a-kpi-val" style={{color:c}}>{v}</div>
                      <div className="a-kpi-label">{l}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="a-card" style={{padding:0,overflow:"hidden"}}>
                <div style={{overflowX:"auto"}}>
                  <div className="a-gb-row a-gb-hdr" style={{borderRadius:"14px 14px 0 0"}}>
                    {["Student","Class","Attendance","Quiz Avg","Quizzes"].map(h=>(
                      <div key={h} style={{fontSize:11,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.4}}>{h}</div>
                    ))}
                  </div>
                  {loadingGB
                    ? <div style={{padding:32,textAlign:"center",color:"var(--faint)"}}>Loading...</div>
                    : gradeBook.length===0
                      ? <div style={{padding:32,textAlign:"center",color:"var(--faint)"}}>No students found.</div>
                      : gradeBook.filter(s=>!gbSearch||s.student_name.toLowerCase().includes(gbSearch.toLowerCase())).map(s=>{
                        const ac=scoreColor(s.attendance_rate), qc=scoreColor(s.quiz_avg);
                        return (
                          <div key={s.student_id} className="a-gb-row">
                            <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                              <div style={{width:28,height:28,borderRadius:"50%",background:"#EDE9FE",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,color:"#7C3AED",flexShrink:0}}>{s.student_name?.charAt(0)}</div>
                              <div style={{minWidth:0}}>
                                <div style={{fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.student_name}</div>
                                <div style={{fontSize:11,color:"var(--faint)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.email}</div>
                              </div>
                            </div>
                            <div style={{fontSize:12,color:"var(--muted)"}}>{s.grade?`${s.grade}/C${s.class_room}`:"—"}</div>
                            <div>
                              <span style={{fontWeight:700,color:ac}}>{s.attendance_rate}%</span>
                              <div className="pbar"><div className="pfill" style={{width:`${s.attendance_rate}%`,background:ac}}/></div>
                            </div>
                            <div>
                              <span style={{fontWeight:700,color:qc}}>{s.quiz_avg>0?`${s.quiz_avg}%`:"—"}</span>
                              {s.quiz_avg>0&&<div className="pbar"><div className="pfill" style={{width:`${s.quiz_avg}%`,background:qc}}/></div>}
                            </div>
                            <span style={{color:"var(--muted)"}}>{s.quizzes_taken} taken</span>
                          </div>
                        );
                      })
                  }
                </div>
              </div>
            </div>
          )}

          {/* ══ ANALYTICS ══ */}
          {tab==="analytics" && (
            <div className="fade">
              {loadingAn
                ? <div className="a-empty" style={{padding:60}}>Loading analytics...</div>
                : !analyticsData
                  ? <div className="a-empty" style={{padding:60}}><div className="a-empty-icon">📈</div>No data yet.</div>
                  : (
                    <>
                      <div className="a-an-grid5">
                        {[
                          ["Total Users",    analyticsData.users.total,                "#2563EB"],
                          ["Teachers",       analyticsData.users.teachers,             "#059669"],
                          ["Students",       analyticsData.users.students,             "#7C3AED"],
                          ["Attendance Avg", analyticsData.attendance.overall_rate+"%","#D97706"],
                          ["Quiz Avg",       analyticsData.quizzes.avg_score+"%",      "#EF4444"],
                        ].map(([l,v,c])=>(
                          <div key={l} className="a-kpi" style={{textAlign:"center"}}>
                            <div className="a-kpi-val" style={{color:c,fontSize:22}}>{v}</div>
                            <div className="a-kpi-label">{l}</div>
                          </div>
                        ))}
                      </div>

                      <div className="a-an-grid2">
                        <div className="a-card">
                          <div className="a-card-title">📊 Platform Summary</div>
                          {[
                            ["Grades",         analyticsData.academics.grades],
                            ["Classes",        analyticsData.academics.classes],
                            ["Total Quizzes",  analyticsData.quizzes.total],
                            ["Quiz Attempts",  analyticsData.quizzes.attempts],
                            ["Assignments",    analyticsData.assignments.total],
                            ["Submissions",    analyticsData.assignments.submissions],
                            ["Graded",         analyticsData.assignments.graded],
                            ["New Users (7d)", analyticsData.users.new_this_week],
                          ].map(([l,v])=>(
                            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid var(--bg)",fontSize:13}}>
                              <span style={{color:"var(--muted)"}}>{l}</span>
                              <span style={{fontWeight:700,color:"var(--text)"}}>{v}</span>
                            </div>
                          ))}
                        </div>

                        <div className="a-card">
                          <div className="a-card-title">📅 Attendance Trend</div>
                          {analyticsData.attendance_trend.map((t,i)=>(
                            <div key={i} style={{marginBottom:10}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}>
                                <span style={{color:"var(--muted)"}}>{t.month}</span>
                                <span style={{fontWeight:700,color:scoreColor(t.rate)}}>{t.rate}%</span>
                              </div>
                              <div className="pbar" style={{height:7}}>
                                <div className="pfill" style={{width:`${t.rate}%`,background:scoreColor(t.rate)}}/>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="a-card">
                        <div className="a-card-title">🏆 Top Classes</div>
                        {analyticsData.top_classes.length===0
                          ? <div className="a-empty">No class data yet.</div>
                          : (
                            <div className="a-an-table">
                              <div className="a-an-row" style={{background:"var(--bg)",borderRadius:8,marginBottom:4}}>
                                {["Class","Grade","Students","Attendance","Quiz Avg"].map(h=>(
                                  <div key={h} style={{fontSize:11,fontWeight:700,color:"var(--muted)",textTransform:"uppercase"}}>{h}</div>
                                ))}
                              </div>
                              {analyticsData.top_classes.map((c,i)=>(
                                <div key={i} className="a-an-row">
                                  <span style={{fontWeight:600,color:"var(--text)"}}>Class {c.class_name}</span>
                                  <span style={{color:"var(--muted)"}}>{c.grade}</span>
                                  <span>{c.student_count}</span>
                                  <span style={{fontWeight:700,color:scoreColor(c.attendance_rate)}}>{c.attendance_rate}%</span>
                                  <span style={{fontWeight:700,color:scoreColor(c.quiz_avg)}}>{c.quiz_avg>0?c.quiz_avg+"%":"—"}</span>
                                </div>
                              ))}
                            </div>
                          )
                        }
                      </div>
                    </>
                  )
              }
            </div>
          )}

          {/* ══ TIMETABLE ══ */}
          {tab==="timetable" && (
            <div className="fade">
              <div className="a-tt-grid">
                <div>
                  <h3 style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:12}}>Select Class</h3>
                  {allClasses.length===0
                    ? <div className="a-card"><div className="a-empty"><div className="a-empty-icon">🏫</div>No classes yet.</div></div>
                    : allClasses.map(c=>(
                      <div key={c.id} className={`a-sel-item${selTTClass?.id===c.id?" active":""}`} onClick={()=>setSelTTClass(c)}>
                        <div style={{fontWeight:700,fontSize:13,color:"var(--text)"}}>
                          Class {c.name} <span style={{color:"var(--muted)",fontWeight:400}}>({c.grade_name})</span>
                        </div>
                        <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>
                          {c.student_count||0} students · {c.teacher_name||"Unassigned"}
                        </div>
                      </div>
                    ))
                  }
                </div>
                <div>
                  {!selTTClass
                    ? <div className="a-card"><div className="a-empty"><div className="a-empty-icon">📅</div>Select a class to manage its timetable</div></div>
                    : <div className="a-card">
                        <AdminTimetableManager classId={selTTClass.id} className={selTTClass.name} accentColor="#2563EB"/>
                      </div>
                  }
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══ MODALS ══ */}
      {showAddUser && (
        <div className="a-modal-bg" onClick={()=>setShowAddUser(false)}>
          <div className="a-modal" onClick={e=>e.stopPropagation()}>
            <div className="a-modal-bar"/>
            <div className="a-modal-title">Add New User</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[["first_name","First Name"],["last_name","Last Name"]].map(([k,l])=>(
                <div key={k} className="a-field">
                  <label className="a-label">{l}</label>
                  <input className={`a-input${formErrU[k]?" err":""}`} value={newUser[k]} onChange={e=>setNewUser(u=>({...u,[k]:e.target.value}))}/>
                  {formErrU[k]&&<div className="a-ferr">{formErrU[k]}</div>}
                </div>
              ))}
            </div>
            {[["email","Email","email"],["password","Password","password"]].map(([k,l,t])=>(
              <div key={k} className="a-field">
                <label className="a-label">{l}</label>
                <input type={t} className={`a-input${formErrU[k]?" err":""}`} value={newUser[k]} onChange={e=>setNewUser(u=>({...u,[k]:e.target.value}))}/>
                {formErrU[k]&&<div className="a-ferr">{formErrU[k]}</div>}
              </div>
            ))}
            <div className="a-field">
              <label className="a-label">Role</label>
              <select className="a-select" value={newUser.role} onChange={e=>setNewUser(u=>({...u,role:e.target.value}))}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="parent">Parent</option>
              </select>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn-blue" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={handleAddUser}>Create User</button>
              <button className="btn-ghost" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={()=>setShowAddUser(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddGrade && (
        <div className="a-modal-bg" onClick={()=>setShowAddGrade(false)}>
          <div className="a-modal" style={{maxWidth:360}} onClick={e=>e.stopPropagation()}>
            <div className="a-modal-bar"/>
            <div className="a-modal-title">Add New Grade</div>
            <div className="a-field">
              <label className="a-label">Grade Name</label>
              <input className="a-input" placeholder="e.g. Grade 1" value={newGradeName}
                onChange={e=>setNewGradeName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddGrade()}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn-blue" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={handleAddGrade}>Create</button>
              <button className="btn-ghost" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={()=>setShowAddGrade(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddClass && (
        <div className="a-modal-bg" onClick={()=>setShowAddClass(false)}>
          <div className="a-modal" onClick={e=>e.stopPropagation()}>
            <div className="a-modal-bar"/>
            <div className="a-modal-title">Add New Class</div>
            <p style={{fontSize:13,color:"var(--muted)",marginBottom:18}}>Grade: <strong>{selGrade?.name||"—"}</strong></p>
            <div className="a-field" style={{marginBottom:20}}>
              <label className="a-label">Class Name</label>
              <input className="a-input" placeholder="e.g. 1-A" value={newClass.name} onChange={e=>setNewClass(c=>({...c,name:e.target.value}))}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn-blue" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={handleAddClass}>Create Class</button>
              <button className="btn-ghost" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={()=>setShowAddClass(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`a-toast ${toast.type==="success"?"success":"error"}`}>{toast.msg}</div>}
    </div>
  );
}
