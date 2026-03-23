import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersAPI, academicsAPI, gradeBookAPI, analyticsAPI, parentAPI, timetableAPI } from "../api";
import TimetablePanel          from "../components/TimetablePanel";
import AdminTimetableManager from "../components/AdminTimetableManager";

const NAV = [
  { id:"overview",  label:"Overview",          icon:"⚡" },
  { id:"users",     label:"User Management",   icon:"👥" },
  { id:"academics", label:"Grades & Classes",  icon:"🏛️" },
  { id:"parents",   label:"Parent Linking",    icon:"👨‍👩‍👦" },
  { id:"gradebook", label:"Grade Book",        icon:"📊" },
  { id:"analytics", label:"Analytics",         icon:"📈" },
  { id:"timetable", label:"Timetable",          icon:"📅" },
];

const RC = { admin:"#2563EB", teacher:"#059669", student:"#7C3AED", parent:"#D97706" };
const RB = { admin:"#EFF6FF", teacher:"#ECFDF5", student:"#F5F3FF", parent:"#FEF3C7" };
const scoreColor = p => p>=80?"#059669":p>=60?"#D97706":"#EF4444";


// ── ClassCard — shows advisor + multi-subject teachers ───────
function ClassCard({ c, teachers, onDelete, onAssignTeacher, onAssignAdvisor, onAddSubject, onRemoveSubject }) {
  const [addOpen,    setAddOpen]    = React.useState(false);
  const [newTeacher, setNewTeacher] = React.useState("");
  const [newSubject, setNewSubject] = React.useState("");
  const SUBJECTS = ["Math","English","Arabic","Science","Social Studies","Islamic","Computer","Art","P.E","Karate","Music","High-Level","Other"];

  return (
    <div className="card">
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div>
          <div style={{fontWeight:800,fontSize:15,color:"#0F172A"}}>Class {c.name}</div>
          <div style={{fontSize:12,color:"#64748B"}}>{c.grade_name} · {c.student_count||0} students</div>
        </div>
        <button className="btn danger" style={{fontSize:11,padding:"4px 8px"}} onClick={()=>onDelete(c.id)}>Delete</button>
      </div>

      {/* Grade Advisor */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:700,color:"#D97706",marginBottom:4}}>⭐ Advisor (رائد الفصل)</div>
        <select value={c.advisor||""} onChange={e=>onAssignAdvisor(c.id,e.target.value)}
          style={{width:"100%",padding:"6px 10px",border:"1.5px solid #FDE68A",borderRadius:7,fontSize:12,background:"#FFFBEB",color:"#0F172A",outline:"none",fontFamily:"inherit"}}>
          <option value="">— No Advisor —</option>
          {teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}{c.advisor===t.id?" ✓":""}</option>)}
        </select>
      </div>

      {/* Subject Teachers */}
      <div>
        <div style={{fontSize:11,fontWeight:700,color:"#2563EB",marginBottom:5}}>👨‍🏫 Subject Teachers</div>
        {(c.subject_teachers||[]).map(st=>(
          <div key={st.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"4px 8px",background:"#EFF6FF",borderRadius:6,marginBottom:4,fontSize:12}}>
            <span><b>{st.subject}</b> — {st.teacher_name}</span>
            <button onClick={()=>onRemoveSubject(c.id,st.id)}
              style={{background:"none",border:"none",color:"#EF4444",cursor:"pointer",fontSize:14,lineHeight:1,padding:"0 2px"}}>✕</button>
          </div>
        ))}
        {!addOpen ? (
          <button onClick={()=>setAddOpen(true)}
            style={{fontSize:11,padding:"4px 10px",borderRadius:6,border:"1px dashed #93C5FD",
              background:"#EFF6FF",color:"#2563EB",cursor:"pointer",marginTop:4,fontFamily:"inherit"}}>
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
                style={{padding:"5px 10px",borderRadius:6,border:"none",background:"#F1F5F9",color:"#64748B",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [tab, setTab]     = useState("overview");

  // ── Users ──────────────────────────────────────────────────
  const [users,       setUsers]       = useState([]);
  const [loadingU,    setLoadingU]    = useState(false);
  const [search,      setSearch]      = useState("");
  const [roleF,       setRoleF]       = useState("all");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser,     setNewUser]     = useState({ first_name:"", last_name:"", email:"", role:"student", password:"" });
  const [formErrU,    setFormErrU]    = useState({});

  // ── Academics ──────────────────────────────────────────────
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
  const [newClass,      setNewClass]      = useState({ name:"", subject:"", teacher:"" });
  const [acView,        setAcView]        = useState("grades");

  // ── Parent Linking ─────────────────────────────────────────
  const [parents,       setParents]       = useState([]);
  const [students,      setStudents]      = useState([]);
  const [selParent,     setSelParent]     = useState(null);
  const [parentChildren,setParentChildren]= useState([]);
  const [loadingPL,     setLoadingPL]     = useState(false);
  const [parentSearch,  setParentSearch]  = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  // ── Grade Book ─────────────────────────────────────────────
  const [gradeBook,     setGradeBook]     = useState([]);
  const [loadingGB,     setLoadingGB]     = useState(false);
  const [gbClassFilter, setGbClassFilter] = useState("");
  const [gbSearch,      setGbSearch]      = useState("");

  // ── Analytics ──────────────────────────────────────────────
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAn,     setLoadingAn]     = useState(false);

  const [selTTClass, setSelTTClass] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  // ── Load helpers ───────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoadingU(true);
    try {
      const p = {};
      if (roleF !== "all") p.role = roleF;
      if (search) p.search = search;
      const d = await usersAPI.list(p);
      setUsers(d.results || d);
    } catch { showToast("Failed to load users","error"); }
    finally { setLoadingU(false); }
  }, [roleF, search]);

  // Debounce search — wait 500ms after user stops typing before API call
  const searchTimer = useRef(null);
  useEffect(()=>{
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(()=>{ loadUsers(); }, 500);
    return () => clearTimeout(searchTimer.current);
  },[loadUsers]);

  const loadGrades = useCallback(async () => {
    setLoadingG(true);
    try { const d = await academicsAPI.grades.list(); setGrades(d.results||d); }
    catch { showToast("Failed to load grades","error"); }
    finally { setLoadingG(false); }
  },[]);

  const loadTeachers   = useCallback(async () => { try { setTeachers(await academicsAPI.teachers()); } catch {} },[]);
  const loadUnassigned = useCallback(async () => { try { setUnassigned(await academicsAPI.unassignedStudents()); } catch {} },[]);

  useEffect(()=>{
    if (tab==="academics" || tab==="timetable") { loadGrades(); }
    if (tab==="academics") { loadTeachers(); loadUnassigned(); }
  },[tab, loadGrades, loadTeachers, loadUnassigned]);

  useEffect(()=>{
    if (!selClass) return;
    academicsAPI.classes.students(selClass.id)
      .then(d=>setClassStudents(d.students||[]))
      .catch(()=>setClassStudents([]));
  },[selClass]);

  // ── Parent Linking load ────────────────────────────────────
  const loadParentLinking = useCallback(async () => {
    setLoadingPL(true);
    try {
      const [pList, sAll] = await Promise.all([
        usersAPI.list({ role:"parent" }),
        usersAPI.list({ role:"student" }),
      ]);
      setParents(pList.results || pList);
      setStudents(sAll.results  || sAll);
    } catch { showToast("Failed to load data","error"); }
    finally { setLoadingPL(false); }
  },[]);

  const loadParentChildren = useCallback(async (parentId) => {
    try {
      const data = await parentAPI.adminParentChildren(parentId);
      setParentChildren(Array.isArray(data) ? data : (data.results || []));
    } catch { setParentChildren([]); }
  },[]);

  useEffect(()=>{
    if (tab==="parents") loadParentLinking();
  },[tab, loadParentLinking]);

  useEffect(()=>{
    if (selParent) loadParentChildren(selParent.id);
  },[selParent, loadParentChildren]);

  const handleLinkChild = async (parentId, childId) => {
    try {
      const res = await parentAPI.linkChild(parentId, childId);
      showToast(res.message || "Linked!");
      loadParentChildren(parentId);
    } catch(e) { showToast(e?.error || "Failed","error"); }
  };

  const handleUnlinkChild = async (parentId, childId) => {
    try {
      await parentAPI.unlinkChild(parentId, childId);
      showToast("Unlinked!");
      loadParentChildren(parentId);
    } catch { showToast("Failed","error"); }
  };

  const loadGradeBook = useCallback(async (classId) => {
    setLoadingGB(true);
    try {
      const params = {};
      if (classId) params.class_id = classId;
      const d = await gradeBookAPI.list(params);
      setGradeBook(d.students || []);
    } catch { showToast("Failed","error"); }
    finally { setLoadingGB(false); }
  },[]);

  useEffect(()=>{
    if (tab==="gradebook") { loadGrades(); loadGradeBook(gbClassFilter); }
  },[tab, gbClassFilter, loadGradeBook]);

  useEffect(()=>{
    if (tab==="analytics") {
      setLoadingAn(true);
      analyticsAPI.dashboard()
        .then(d=>{ setAnalyticsData(d); setLoadingAn(false); })
        .catch(()=>setLoadingAn(false));
    }
  },[tab]);

  // ── User handlers ──────────────────────────────────────────
  const handleToggleUser = async (id) => {
    try {
      const res = await usersAPI.toggleStatus(id);
      setUsers(u=>u.map(x=>x.id===id?{...x,is_active:res.is_active}:x));
      showToast(res.message);
    } catch { showToast("Action failed","error"); }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await usersAPI.delete(id);
      setUsers(u => u.filter(x => x.id !== id));
      showToast("User deleted!");
    } catch { showToast("Cannot delete this user","error"); }
  };

  const handleAddUser = async () => {
    const e = {};
    if (!newUser.first_name) e.first_name="Required";
    if (!newUser.last_name)  e.last_name="Required";
    if (!newUser.email||!/\S+@\S+\.\S+/.test(newUser.email)) e.email="Valid email required";
    if (!newUser.password||newUser.password.length<6) e.password="Min 6 chars";
    if (Object.keys(e).length) { setFormErrU(e); return; }
    try {
      await usersAPI.create({...newUser, username:newUser.email.split("@")[0]});
      showToast("User created!");
      setShowAddUser(false);
      setNewUser({first_name:"",last_name:"",email:"",role:"student",password:""});
      setFormErrU({});
      loadUsers();
    } catch(err){ showToast(err?.email?.[0]||"Failed","error"); }
  };

  const handleAddGrade = async () => {
    if (!newGradeName.trim()) { showToast("Enter grade name","error"); return; }
    try {
      await academicsAPI.grades.create({name:newGradeName.trim()});
      showToast("Grade created!"); setShowAddGrade(false); setNewGradeName(""); loadGrades();
    } catch(err){ showToast(err?.name?.[0]||"Failed","error"); }
  };

  const handleDeleteGrade = async (id) => {
    if (!window.confirm("Delete this grade and all its classes?")) return;
    try { await academicsAPI.grades.delete(id); showToast("Deleted!"); setSelGrade(null); setSelClass(null); loadGrades(); }
    catch { showToast("Cannot delete","error"); }
  };

  const handleAddClass = async () => {
    if (!newClass.name.trim()) { showToast("Enter class name","error"); return; }
    if (!selGrade) { showToast("Select a grade first","error"); return; }
    try {
      const payload={grade:selGrade.id,name:newClass.name.trim(),subject:newClass.subject};
      if (newClass.teacher) payload.teacher=parseInt(newClass.teacher);
      await academicsAPI.classes.create(payload);
      showToast("Class created!"); setShowAddClass(false); setNewClass({name:"",subject:"",teacher:""}); loadGrades();
    } catch(err){ showToast(err?.name?.[0]||"Failed","error"); }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm("Delete this class?")) return;
    try { await academicsAPI.classes.delete(id); showToast("Deleted!"); setSelClass(null); setClassStudents([]); loadGrades(); }
    catch { showToast("Cannot delete","error"); }
  };

  const handleAssignTeacher = async (classId, teacherId) => {
    try { const res=await academicsAPI.classes.assignTeacher(classId,teacherId); showToast(res.message); loadGrades(); }
    catch { showToast("Failed","error"); }
  };

  const handleAssignAdvisor = async (classId, teacherId) => {
    try { await academicsAPI.classes.assignAdvisor(classId, teacherId||null); showToast("Advisor updated!"); loadGrades(); }
    catch { showToast("Failed to assign advisor","error"); }
  };

  const handleAddSubjectTeacher = async (classId, teacherId, subject) => {
    if (!subject.trim()||!teacherId) { showToast("Select teacher and subject","error"); return; }
    try { await academicsAPI.classes.addSubjectTeacher(classId, teacherId, subject); showToast("Teacher added!"); loadGrades(); }
    catch(e) { showToast(e?.error||"Failed","error"); }
  };

  const handleRemoveSubjectTeacher = async (classId, stId) => {
    try { await academicsAPI.classes.removeSubjectTeacher(classId, stId); showToast("Removed!"); loadGrades(); }
    catch { showToast("Failed","error"); }
  };

  const handleAssignStudent = async (studentId) => {
    if (!selClass) return;
    try {
      const res=await academicsAPI.classes.assignStudent(selClass.id,studentId);
      showToast(res.message);
      const d=await academicsAPI.classes.students(selClass.id); setClassStudents(d.students||[]);
      loadUnassigned(); loadGrades();
    } catch { showToast("Failed","error"); }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!selClass) return;
    try {
      await academicsAPI.classes.removeStudent(selClass.id,studentId); showToast("Removed!");
      const d=await academicsAPI.classes.students(selClass.id); setClassStudents(d.students||[]);
      loadUnassigned(); loadGrades();
    } catch { showToast("Failed","error"); }
  };

  const allClasses = grades.flatMap(g=>(g.classes||[]).map(c=>({...c,grade_name:g.name})));
  const name = user?.full_name || user?.first_name || "Admin";

  // filtered lists for parent linking
  const filteredParents  = parents.filter(p=>!parentSearch || p.full_name?.toLowerCase().includes(parentSearch.toLowerCase()) || p.email?.toLowerCase().includes(parentSearch.toLowerCase()));
  const filteredStudents = students.filter(s=>!studentSearch || s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()));
  const linkedIds        = new Set(parentChildren.map(c=>c.id));

  return (
    <div style={{fontFamily:"'Sora',sans-serif",display:"flex",minHeight:"100vh",background:"#F1F5F9"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .nb{display:flex;align-items:center;gap:8px;padding:9px 13px;border-radius:10px;border:none;background:none;width:100%;font-size:13px;font-weight:500;color:#64748B;cursor:pointer;font-family:'Sora',sans-serif;transition:all .18s;}
        .nb:hover{background:#F1F5F9;color:#0F172A;transform:translateX(2px);}
        .nb.a{background:#EFF6FF;color:#2563EB;font-weight:700;box-shadow:inset 3px 0 0 #2563EB;}
        .nb.parent-active{background:#FEF3C7;color:#D97706;font-weight:700;box-shadow:inset 3px 0 0 #D97706;}
        .btn{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;border:none;font-family:'Sora',sans-serif;transition:all .18s;}
        .btn:hover:not(:disabled){transform:translateY(-1px);}
        .btn:disabled{opacity:.5;cursor:not-allowed;}
        .blue{background:#2563EB;color:#fff;} .blue:hover{background:#1D4ED8;}
        .amber{background:#D97706;color:#fff;} .amber:hover{background:#B45309;}
        .ghost{background:#F1F5F9;color:#475569;border:1.5px solid #E2E8F0;} .ghost:hover{background:#E2E8F0;}
        .red{background:#FEF2F2;color:#EF4444;border:1px solid #FECACA;}
        .green{background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;}
        .danger{background:#EF4444;color:#fff;}
        .badge{display:inline-flex;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;}
        .b-active{background:#ECFDF5;color:#059669;} .b-inactive{background:#FEF2F2;color:#EF4444;}
        .b-admin{background:#EFF6FF;color:#2563EB;} .b-teacher{background:#ECFDF5;color:#059669;}
        .b-student{background:#F5F3FF;color:#7C3AED;} .b-parent{background:#FEF3C7;color:#D97706;}
        .card{background:#fff;border-radius:14px;padding:18px;border:1.5px solid #E2E8F0;}
        .sc{background:#fff;border-radius:14px;padding:20px;border:1.5px solid #E2E8F0;transition:transform .2s,box-shadow .2s;}
        .sc:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(0,0,0,.08);}
        .sel-item{padding:10px 14px;border-radius:10px;border:1.5px solid #E2E8F0;margin-bottom:6px;cursor:pointer;transition:all .18s;background:#fff;}
        .sel-item:hover{border-color:#93C5FD;background:#EFF6FF;}
        .sel-item.active{border-color:#2563EB;background:#EFF6FF;}
        .row{display:grid;grid-template-columns:2fr 1fr 2fr .9fr 1.6fr;align-items:center;padding:12px 16px;border-bottom:1px solid #F1F5F9;font-size:13px;}
        .row:hover{background:#FAFBFD;}
        .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(4px);}
        .modal{background:#fff;border-radius:20px;padding:28px;width:430px;max-width:93vw;box-shadow:0 25px 60px rgba(0,0,0,.15);}
        .field{margin-bottom:12px;} .field label{display:block;font-size:11px;font-weight:700;color:#374151;margin-bottom:5px;text-transform:uppercase;letter-spacing:.4px;}
        .field input,.field select,.field textarea{width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:9px;font-size:13px;color:#0F172A;background:#F8FAFC;outline:none;font-family:'Sora',sans-serif;transition:border .2s;}
        .field input:focus,.field select:focus{border-color:#2563EB;background:#fff;}
        .field input.err{border-color:#EF4444;} .ferr{color:#EF4444;font-size:11px;margin-top:3px;}
        .toast{position:fixed;bottom:22px;right:22px;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:300;animation:slideUp .3s ease;font-family:'Sora',sans-serif;}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .t-s{background:linear-gradient(135deg,#059669,#10B981);color:#fff;}
        .t-e{background:linear-gradient(135deg,#DC2626,#EF4444);color:#fff;}
        .fade{animation:fi .3s ease;} @keyframes fi{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .tabs{display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap;}
        .tab-btn{padding:7px 16px;border-radius:9px;border:1.5px solid #E2E8F0;background:#fff;font-size:13px;font-weight:600;color:#64748B;cursor:pointer;font-family:'Sora',sans-serif;transition:all .18s;}
        .tab-btn.a{background:#EFF6FF;color:#2563EB;border-color:#BFDBFE;}
        .gb-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;align-items:center;padding:12px 18px;border-bottom:1px solid #F1F5F9;font-size:13px;}
        .gb-row:hover{background:#FAFBFD;}
        .pbar{height:5px;background:#F1F5F9;border-radius:3px;overflow:hidden;margin-top:4px;width:60px;}
        .pfill{height:100%;border-radius:3px;}
        /* Parent linking specific */
        .parent-card{border:2px solid #E2E8F0;border-radius:12px;padding:12px 14px;cursor:pointer;transition:all .18s;background:#fff;margin-bottom:7px;}
        .parent-card:hover{border-color:#FDE68A;background:#FFFBEB;}
        .parent-card.selected{border-color:#D97706;background:#FEF3C7;}
        .student-tag{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:600;margin:3px;}
        .student-tag.linked{background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;}
        .student-tag.unlinked{background:#F5F3FF;color:#7C3AED;border:1px solid #DDD6FE;}
        .search-inp{padding:9px 14px;border:1.5px solid #E2E8F0;border-radius:9px;font-size:13px;outline:none;font-family:'Sora',sans-serif;transition:border .2s;background:#fff;width:100%;}
        .search-inp:focus{border-color:#2563EB;}
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{width:220,background:"#fff",borderRight:"1.5px solid #E2E8F0",display:"flex",flexDirection:"column",height:"100vh",position:"fixed",top:0,left:0,zIndex:20}}>
        <div style={{padding:"16px 14px",borderBottom:"1.5px solid #F1F5F9",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,background:"linear-gradient(135deg,#2563EB,#7C3AED)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏫</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:15,color:"#0F172A"}}>EduPortal</span>
        </div>
        <div style={{margin:"10px 10px 4px",background:"#EFF6FF",borderRadius:10,padding:"10px 12px",border:"1px solid #BFDBFE"}}>
          <div style={{fontSize:10,color:"#2563EB",fontWeight:700,textTransform:"uppercase",letterSpacing:".5px"}}>Admin</div>
          <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginTop:2}}>{name}</div>
          <div style={{fontSize:11,color:"#64748B",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.email}</div>
        </div>
        <nav style={{flex:1,padding:"6px 8px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
          {NAV.map(n=>(
            <button key={n.id}
              className={`nb${tab===n.id?(n.id==="parents"?" parent-active":" a"):""}`}
              onClick={()=>setTab(n.id)}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{padding:"10px 8px",borderTop:"1.5px solid #F1F5F9"}}>
          <button className="nb" onClick={()=>navigate("/profile")} style={{marginBottom:3}}>👤 My Profile</button>
          <button className="nb" style={{color:"#EF4444"}} onClick={()=>{logout();navigate("/");}}>🚪 Logout</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{marginLeft:220,flex:1,background:"#F1F5F9",minHeight:"100vh"}}>
        <header style={{background:"#fff",borderBottom:"1.5px solid #E2E8F0",padding:"0 24px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:3,height:20,background:tab==="parents"?"#D97706":"#2563EB",borderRadius:2}}/>
            <span style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>{NAV.find(n=>n.id===tab)?.label}</span>
          </div>
          <div style={{width:34,height:34,background:"linear-gradient(135deg,#2563EB,#7C3AED)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13}}>
            {name.charAt(0).toUpperCase()}
          </div>
        </header>

        <div style={{padding:"22px"}}>

          {/* ══ OVERVIEW ══ */}
          {tab==="overview"&&(
            <div className="fade">
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
                {[
                  ["Total Users",  users.length,                                   "#2563EB","👥"],
                  ["Teachers",     users.filter(u=>u.role==="teacher").length,      "#059669","📚"],
                  ["Students",     users.filter(u=>u.role==="student").length,      "#7C3AED","🎓"],
                  ["Grades",       grades.length,                                   "#D97706","🏛️"],
                ].map(([l,v,c,icon])=>(
                  <div key={l} className="sc">
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div style={{width:38,height:38,borderRadius:10,background:RB[Object.keys(RC).find(k=>RC[k]===c)]||"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{icon}</div>
                      <div style={{fontSize:30,fontWeight:800,fontFamily:"'Playfair Display',serif",color:c}}>{v}</div>
                    </div>
                    <div style={{fontSize:13,color:"#64748B",fontWeight:600}}>{l}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <h3 style={{fontSize:14,fontWeight:700,marginBottom:14,color:"#0F172A"}}>⚡ Quick Actions</h3>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button className="btn blue"  onClick={()=>setTab("users")}>Manage Users</button>
                  <button className="btn ghost" onClick={()=>setTab("academics")}>Manage Classes</button>
                  <button className="btn amber" onClick={()=>setTab("parents")}>👨‍👩‍👦 Link Parents</button>
                  <button className="btn ghost" onClick={()=>setTab("gradebook")}>Grade Book</button>
                  <button className="btn ghost" onClick={()=>setTab("analytics")}>Analytics</button>
                  <button className="btn blue"  onClick={()=>setShowAddUser(true)}>+ Add User</button>
                </div>
              </div>
            </div>
          )}

          {/* ══ USERS ══ */}
          {tab==="users"&&(
            <div className="fade">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users..."
                    className="search-inp" style={{width:190}}/>
                  {["all","admin","teacher","student","parent"].map(r=>(
                    <button key={r} className="btn" onClick={()=>setRoleF(r)}
                      style={{background:roleF===r?"#2563EB":"#F1F5F9",color:roleF===r?"#fff":"#475569",border:roleF===r?"none":"1.5px solid #E2E8F0",textTransform:"capitalize",padding:"7px 12px"}}>
                      {r}
                    </button>
                  ))}
                </div>
                <button className="btn blue" onClick={()=>setShowAddUser(true)}>+ Add User</button>
              </div>
              <div className="card" style={{padding:0,overflow:"hidden"}}>
                <div className="row" style={{background:"#F8FAFC",borderBottom:"1.5px solid #E2E8F0"}}>
                  {["Name","Role","Email","Status","Actions"].map(h=>(
                    <div key={h} style={{fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:.4}}>{h}</div>
                  ))}
                </div>
                {loadingU?<div style={{padding:32,textAlign:"center",color:"#94A3B8"}}>Loading...</div>
                :users.length===0?<div style={{padding:32,textAlign:"center",color:"#94A3B8"}}>No users found</div>
                :users.map(u=>(
                  <div key={u.id} className="row">
                    <div style={{display:"flex",alignItems:"center",gap:9}}>
                      <div style={{width:30,height:30,borderRadius:"50%",background:RB[u.role]||"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:RC[u.role]||"#64748B",flexShrink:0}}>
                        {(u.first_name||"?").charAt(0).toUpperCase()}
                      </div>
                      <span style={{fontWeight:600,color:"#0F172A"}}>{u.full_name||`${u.first_name} ${u.last_name}`}</span>
                    </div>
                    <span className={`badge b-${u.role}`}>{u.role}</span>
                    <span style={{color:"#64748B",fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</span>
                    <span className={`badge b-${u.is_active?"active":"inactive"}`}>{u.is_active?"Active":"Inactive"}</span>
                    <div style={{display:"flex",gap:5}}>
                      <button className={u.is_active?"btn red":"btn green"} style={{fontSize:11,padding:"4px 9px"}} onClick={()=>handleToggleUser(u.id)}>
                        {u.is_active?"Deactivate":"Activate"}
                      </button>
                      <button className="btn danger" style={{fontSize:11,padding:"4px 8px"}} onClick={()=>handleDeleteUser(u.id, u.full_name||u.first_name)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ ACADEMICS ══ */}
          {tab==="academics"&&(
            <div className="fade">
              <div className="tabs">
                {[["grades","Grades"],["classes","Classes"],["students","Assign Students"]].map(([id,label])=>(
                  <button key={id} className={`tab-btn${acView===id?" a":""}`} onClick={()=>setAcView(id)}>{label}</button>
                ))}
              </div>

              {acView==="grades"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>All Grades ({grades.length})</h3>
                    <button className="btn blue" onClick={()=>setShowAddGrade(true)}>+ Add Grade</button>
                  </div>
                  {loadingG?<div className="card" style={{textAlign:"center",color:"#94A3B8",padding:32}}>Loading...</div>
                  :grades.length===0?<div className="card" style={{textAlign:"center",color:"#94A3B8",padding:32}}>No grades yet.</div>
                  :grades.map(g=>(
                    <div key={g.id} className="card" style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:g.classes?.length>0?12:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:40,height:40,background:"#EFF6FF",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#2563EB",fontSize:13}}>{g.name.replace("Grade ","")}</div>
                          <div>
                            <div style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>{g.name}</div>
                            <div style={{fontSize:12,color:"#64748B"}}>{g.classes?.length||0} classes · {g.total_students||0} students</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button className="btn ghost" style={{fontSize:12,padding:"5px 10px"}} onClick={()=>{setSelGrade(g);setShowAddClass(true);}}>+ Class</button>
                          <button className="btn danger" style={{fontSize:12,padding:"5px 10px"}} onClick={()=>handleDeleteGrade(g.id)}>Delete</button>
                        </div>
                      </div>
                      {g.classes?.length>0&&(
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8,marginTop:4}}>
                          {g.classes.map(c=>(
                            <div key={c.id} style={{background:"#F8FAFC",borderRadius:10,padding:"10px 12px",border:"1.5px solid #E2E8F0"}}>
                              <div style={{fontWeight:700,fontSize:13,color:"#0F172A",marginBottom:3}}>Class {c.name}</div>
                              <div style={{fontSize:12,color:"#64748B"}}>{c.subject||"—"}</div>
                              <div style={{fontSize:12,color:"#64748B",marginTop:2}}>Teacher: <span style={{color:c.teacher_name?"#059669":"#EF4444",fontWeight:600}}>{c.teacher_name||"Unassigned"}</span></div>
                              <div style={{fontSize:12,color:"#64748B"}}>Students: {c.student_count||0}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {acView==="classes"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>All Classes ({allClasses.length})</h3>
                    <button className="btn blue" onClick={()=>{if(!selGrade&&grades.length>0)setSelGrade(grades[0]);setShowAddClass(true);}}>+ Add Class</button>
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                    <button className="btn" style={{background:!selGrade?"#2563EB":"#F1F5F9",color:!selGrade?"#fff":"#475569",border:!selGrade?"none":"1.5px solid #E2E8F0",padding:"6px 12px"}} onClick={()=>setSelGrade(null)}>All</button>
                    {grades.map(g=>(
                      <button key={g.id} className="btn" style={{background:selGrade?.id===g.id?"#2563EB":"#F1F5F9",color:selGrade?.id===g.id?"#fff":"#475569",border:selGrade?.id===g.id?"none":"1.5px solid #E2E8F0",padding:"6px 12px"}} onClick={()=>setSelGrade(g)}>{g.name}</button>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
                    {(selGrade?allClasses.filter(c=>c.grade===selGrade.id):allClasses).map(c=>(
                      <ClassCard key={c.id} c={c} teachers={teachers}
                        onDelete={handleDeleteClass}
                        onAssignAdvisor={handleAssignAdvisor}
                        onAddSubject={handleAddSubjectTeacher}
                        onRemoveSubject={handleRemoveSubjectTeacher}
                      />
                    ))}
                    {allClasses.length===0&&<div className="card" style={{textAlign:"center",color:"#94A3B8",gridColumn:"1/-1"}}>No classes yet.</div>}
                  </div>
                </div>
              )}

              {acView==="students"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  <div>
                    <h3 style={{fontSize:14,fontWeight:700,marginBottom:12,color:"#0F172A"}}>Select Class</h3>
                    {allClasses.map(c=>(
                      <div key={c.id} className={`sel-item${selClass?.id===c.id?" active":""}`} onClick={()=>setSelClass(c)}>
                        <div style={{fontWeight:700,fontSize:13,color:"#0F172A"}}>Class {c.name} <span style={{color:"#64748B",fontWeight:400}}>({c.grade_name})</span></div>
                        <div style={{fontSize:12,color:"#64748B",marginTop:2}}>{c.student_count||0} students · Teacher: {c.teacher_name||"Unassigned"}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    {!selClass?<div className="card" style={{textAlign:"center",color:"#94A3B8",padding:40}}><div style={{fontSize:32,marginBottom:8}}>👈</div><p>Select a class</p></div>:(
                      <>
                        <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:12}}>Class {selClass.name} ({classStudents.length})</h3>
                        <div className="card" style={{marginBottom:12}}>
                          <div style={{fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Enrolled</div>
                          {classStudents.length===0?<p style={{fontSize:13,color:"#94A3B8"}}>No students enrolled.</p>
                          :classStudents.map(s=>(
                            <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F1F5F9"}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:28,height:28,borderRadius:"50%",background:"#EDE9FE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#7C3AED"}}>{s.full_name?.charAt(0)}</div>
                                <div><div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{s.full_name}</div><div style={{fontSize:11,color:"#94A3B8"}}>{s.email}</div></div>
                              </div>
                              <button className="btn red" style={{fontSize:11,padding:"4px 8px"}} onClick={()=>handleRemoveStudent(s.id)}>Remove</button>
                            </div>
                          ))}
                        </div>
                        {unassigned.length>0&&(
                          <div className="card">
                            <div style={{fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Unassigned Students</div>
                            {unassigned.map(s=>(
                              <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F1F5F9"}}>
                                <div><div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{s.full_name}</div><div style={{fontSize:11,color:"#94A3B8"}}>{s.email}</div></div>
                                <button className="btn green" style={{fontSize:11,padding:"4px 8px"}} onClick={()=>handleAssignStudent(s.id)}>+ Add</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ PARENT LINKING ══ */}
          {tab==="parents"&&(
            <div className="fade">
              <div style={{background:"#FEF3C7",border:"1.5px solid #FDE68A",borderRadius:12,padding:"12px 16px",marginBottom:18,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>👨‍👩‍👦</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#92400E"}}>Parent–Student Linking</div>
                  <div style={{fontSize:12,color:"#B45309"}}>Select a parent on the left, then link or unlink students on the right.</div>
                </div>
              </div>

              {loadingPL?(
                <div className="card" style={{textAlign:"center",color:"#94A3B8",padding:40}}>Loading...</div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:16}}>

                  {/* LEFT — parents list */}
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>Parents ({parents.length})</h3>
                      <button className="btn amber" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>{setShowAddUser(true);setNewUser(u=>({...u,role:"parent"}));}}>+ New Parent</button>
                    </div>
                    <input className="search-inp" style={{marginBottom:10}} placeholder="Search parents..."
                      value={parentSearch} onChange={e=>setParentSearch(e.target.value)}/>
                    {parents.length===0?(
                      <div className="card" style={{textAlign:"center",color:"#94A3B8",padding:32}}>
                        <div style={{fontSize:32,marginBottom:8}}>👨‍👩‍👦</div>
                        <p style={{fontSize:13}}>No parents yet. Add a user with role "Parent".</p>
                      </div>
                    ):filteredParents.map(p=>(
                      <div key={p.id} className={`parent-card${selParent?.id===p.id?" selected":""}`} onClick={()=>setSelParent(p)}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:36,height:36,borderRadius:"50%",background:"#FEF3C7",border:"2px solid #FDE68A",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:"#D97706",flexShrink:0}}>
                            {(p.first_name||"?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{fontWeight:700,fontSize:13,color:"#0F172A"}}>{p.full_name||`${p.first_name} ${p.last_name}`}</div>
                            <div style={{fontSize:11,color:"#64748B"}}>{p.email}</div>
                          </div>
                          {selParent?.id===p.id&&<span style={{marginLeft:"auto",fontSize:11,background:"#D97706",color:"#fff",padding:"2px 8px",borderRadius:999,fontWeight:700}}>Selected</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* RIGHT — student linking */}
                  <div>
                    {!selParent?(
                      <div className="card" style={{textAlign:"center",color:"#94A3B8",padding:50}}>
                        <div style={{fontSize:40,marginBottom:12}}>👈</div>
                        <p style={{fontSize:13}}>Select a parent to manage their linked students</p>
                      </div>
                    ):(
                      <>
                        {/* Linked children */}
                        <div className="card" style={{marginBottom:14}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                            <div>
                              <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>
                                {selParent.full_name||selParent.first_name}'s Children
                              </h3>
                              <p style={{fontSize:12,color:"#64748B",marginTop:2}}>{parentChildren.length} linked student{parentChildren.length!==1?"s":""}</p>
                            </div>
                          </div>
                          {parentChildren.length===0?(
                            <div style={{textAlign:"center",padding:"20px 0",color:"#94A3B8"}}>
                              <div style={{fontSize:28,marginBottom:6}}>🎓</div>
                              <p style={{fontSize:13}}>No students linked yet</p>
                            </div>
                          ):parentChildren.map(c=>(
                            <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #F1F5F9"}}>
                              <div style={{display:"flex",alignItems:"center",gap:9}}>
                                <div style={{width:30,height:30,borderRadius:"50%",background:"#EDE9FE",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"#7C3AED",flexShrink:0}}>
                                  {c.full_name?.charAt(0)||"?"}
                                </div>
                                <div>
                                  <div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{c.full_name}</div>
                                  <div style={{fontSize:11,color:"#94A3B8"}}>{c.email}</div>
                                </div>
                              </div>
                              <button className="btn red" style={{fontSize:11,padding:"4px 10px"}}
                                onClick={()=>handleUnlinkChild(selParent.id, c.id)}>
                                Unlink
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* All students — link */}
                        <div className="card">
                          <h4 style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:10}}>Link a Student</h4>
                          <input className="search-inp" style={{marginBottom:10}} placeholder="Search students..."
                            value={studentSearch} onChange={e=>setStudentSearch(e.target.value)}/>
                          <div style={{maxHeight:280,overflowY:"auto"}}>
                            {filteredStudents.length===0?(
                              <p style={{fontSize:13,color:"#94A3B8",textAlign:"center",padding:16}}>No students found</p>
                            ):filteredStudents.map(s=>{
                              const isLinked = linkedIds.has(s.id);
                              return (
                                <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #F1F5F9"}}>
                                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                                    <div style={{width:28,height:28,borderRadius:"50%",background:"#EDE9FE",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,color:"#7C3AED",flexShrink:0}}>
                                      {s.full_name?.charAt(0)||"?"}
                                    </div>
                                    <div>
                                      <div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{s.full_name}</div>
                                      <div style={{fontSize:11,color:"#94A3B8"}}>{s.email}</div>
                                    </div>
                                  </div>
                                  {isLinked?(
                                    <span style={{fontSize:11,background:"#ECFDF5",color:"#059669",border:"1px solid #A7F3D0",padding:"3px 10px",borderRadius:999,fontWeight:700}}>✓ Linked</span>
                                  ):(
                                    <button className="btn green" style={{fontSize:11,padding:"4px 10px"}}
                                      onClick={()=>handleLinkChild(selParent.id, s.id)}>
                                      + Link
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ GRADE BOOK ══ */}
          {tab==="gradebook"&&(
            <div className="fade">
              <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
                <input value={gbSearch} onChange={e=>setGbSearch(e.target.value)} placeholder="Search student..."
                  className="search-inp" style={{width:200}}/>
                <select value={gbClassFilter} onChange={e=>setGbClassFilter(e.target.value)}
                  style={{padding:"9px 12px",border:"1.5px solid #E2E8F0",borderRadius:9,fontSize:13,outline:"none",background:"#fff",fontFamily:"'Sora',sans-serif"}}>
                  <option value="">All Classes</option>
                  {grades.flatMap(g=>(g.classes||[]).map(c=>(
                    <option key={c.id} value={c.id}>{g.name} — Class {c.name}</option>
                  )))}
                </select>
                <button className="btn blue" onClick={()=>loadGradeBook(gbClassFilter)}>Refresh</button>
              </div>
              {gradeBook.length>0&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
                  {[
                    ["Students",    gradeBook.length,                                                                                                     "#2563EB"],
                    ["Avg Attend.", Math.round(gradeBook.reduce((a,s)=>a+s.attendance_rate,0)/gradeBook.length)+"%",                                      "#059669"],
                    ["Avg Quiz",    Math.round(gradeBook.reduce((a,s)=>a+s.quiz_avg,0)/gradeBook.length)+"%",                                             "#7C3AED"],
                    ["At Risk",     gradeBook.filter(s=>s.quiz_avg<60||s.attendance_rate<60).length,                                                      "#EF4444"],
                  ].map(([l,v,c])=>(
                    <div key={l} className="sc" style={{textAlign:"center"}}>
                      <div style={{fontSize:26,fontWeight:800,fontFamily:"'Playfair Display',serif",color:c}}>{v}</div>
                      <div style={{fontSize:12,color:"#64748B",marginTop:3}}>{l}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="card" style={{padding:0,overflow:"hidden"}}>
                <div className="gb-row" style={{background:"#F8FAFC",borderBottom:"1.5px solid #E2E8F0"}}>
                  {["Student","Class","Attendance","Quiz Avg","Quizzes"].map(h=>(
                    <div key={h} style={{fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:.4}}>{h}</div>
                  ))}
                </div>
                {loadingGB?<div style={{padding:32,textAlign:"center",color:"#94A3B8"}}>Loading...</div>
                :gradeBook.length===0?<div style={{padding:32,textAlign:"center",color:"#94A3B8"}}>No students found.</div>
                :gradeBook.filter(s=>!gbSearch||s.student_name.toLowerCase().includes(gbSearch.toLowerCase())).map(s=>{
                  const ac=scoreColor(s.attendance_rate), qc=scoreColor(s.quiz_avg);
                  return (
                    <div key={s.student_id} className="gb-row">
                      <div style={{display:"flex",alignItems:"center",gap:9}}>
                        <div style={{width:30,height:30,borderRadius:"50%",background:"#EDE9FE",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"#7C3AED",flexShrink:0}}>{s.student_name?.charAt(0)}</div>
                        <div><div style={{fontWeight:600,color:"#0F172A"}}>{s.student_name}</div><div style={{fontSize:11,color:"#94A3B8"}}>{s.email}</div></div>
                      </div>
                      <div style={{fontSize:12,color:"#64748B"}}>{s.grade?`${s.grade}/C${s.class_room}`:"—"}</div>
                      <div><span style={{fontWeight:700,color:ac}}>{s.attendance_rate}%</span><div className="pbar"><div className="pfill" style={{width:`${s.attendance_rate}%`,background:ac}}/></div></div>
                      <div><span style={{fontWeight:700,color:qc}}>{s.quiz_avg>0?`${s.quiz_avg}%`:"—"}</span>{s.quiz_avg>0&&<div className="pbar"><div className="pfill" style={{width:`${s.quiz_avg}%`,background:qc}}/></div>}</div>
                      <span style={{color:"#64748B"}}>{s.quizzes_taken} taken</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ ANALYTICS ══ */}
          {tab==="analytics"&&(
            <div className="fade">
              {loadingAn?(
                <div style={{textAlign:"center",color:"#94A3B8",padding:60}}>Loading analytics...</div>
              ):!analyticsData?(
                <div style={{textAlign:"center",color:"#94A3B8",padding:60}}>
                  <div style={{fontSize:40,marginBottom:12}}>📊</div>
                  <p>No data yet.</p>
                </div>
              ):(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18}}>
                    {[
                      ["Total Users",   analyticsData.users.total,               "#2563EB"],
                      ["Teachers",      analyticsData.users.teachers,            "#059669"],
                      ["Students",      analyticsData.users.students,            "#7C3AED"],
                      ["Attendance Avg",analyticsData.attendance.overall_rate+"%","#D97706"],
                      ["Quiz Avg",      analyticsData.quizzes.avg_score+"%",     "#EF4444"],
                    ].map(([l,v,c])=>(
                      <div key={l} className="sc" style={{textAlign:"center"}}>
                        <div style={{fontSize:24,fontWeight:800,fontFamily:"'Playfair Display',serif",color:c}}>{v}</div>
                        <div style={{fontSize:11,color:"#64748B",marginTop:4}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                    <div className="card">
                      <h4 style={{fontSize:13,fontWeight:700,marginBottom:14,color:"#0F172A"}}>📊 Platform Summary</h4>
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
                        <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #F1F5F9",fontSize:13}}>
                          <span style={{color:"#64748B"}}>{l}</span>
                          <span style={{fontWeight:700,color:"#0F172A"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="card">
                      <h4 style={{fontSize:13,fontWeight:700,marginBottom:14,color:"#0F172A"}}>📅 Attendance Trend</h4>
                      {analyticsData.attendance_trend.map((t,i)=>(
                        <div key={i} style={{marginBottom:10}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}>
                            <span style={{color:"#64748B"}}>{t.month}</span>
                            <span style={{fontWeight:700,color:scoreColor(t.rate)}}>{t.rate}%</span>
                          </div>
                          <div style={{height:7,background:"#F1F5F9",borderRadius:4,overflow:"hidden"}}>
                            <div style={{height:"100%",background:scoreColor(t.rate),borderRadius:4,width:`${t.rate}%`,transition:"width 1s ease"}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card">
                    <h4 style={{fontSize:13,fontWeight:700,marginBottom:14,color:"#0F172A"}}>🏆 Top Classes</h4>
                    {analyticsData.top_classes.length===0?<p style={{color:"#94A3B8",fontSize:13}}>No class data yet.</p>:(
                      <>
                        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",padding:"9px 14px",background:"#F8FAFC",borderRadius:8,marginBottom:6}}>
                          {["Class","Grade","Students","Attendance","Quiz Avg"].map(h=>(
                            <div key={h} style={{fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase"}}>{h}</div>
                          ))}
                        </div>
                        {analyticsData.top_classes.map((c,i)=>(
                          <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",padding:"10px 14px",borderBottom:"1px solid #F1F5F9",fontSize:13,alignItems:"center"}}>
                            <span style={{fontWeight:600,color:"#0F172A"}}>Class {c.class_name}</span>
                            <span style={{color:"#64748B"}}>{c.grade}</span>
                            <span>{c.student_count}</span>
                            <span style={{fontWeight:700,color:scoreColor(c.attendance_rate)}}>{c.attendance_rate}%</span>
                            <span style={{fontWeight:700,color:scoreColor(c.quiz_avg)}}>{c.quiz_avg>0?c.quiz_avg+"%":"—"}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ TIMETABLE ══ */}
          {tab==="timetable"&&(
            <div className="fade">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>📅 Timetable Management</h3>
                <p style={{fontSize:12,color:"#64748B"}}>Select a class to view and edit its timetable</p>
              </div>

              {/* Load grades if not loaded */}
              {grades.length===0&&(
                <div style={{textAlign:"center",padding:40,color:"#94A3B8"}}>
                  <p>Loading classes...</p>
                </div>
              )}

              {/* Class selector buttons */}
              {grades.length>0&&(
                <>
                  <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                    {grades.flatMap(g=>(g.classes||[]).map(c=>({...c,grade_name:g.name}))).map(c=>(
                      <button key={c.id} onClick={()=>setSelTTClass(c)}
                        style={{padding:"7px 14px",borderRadius:9,fontSize:13,fontWeight:600,
                          cursor:"pointer",fontFamily:"inherit",
                          border:`1.5px solid ${selTTClass?.id===c.id?"#2563EB":"#E2E8F0"}`,
                          background:selTTClass?.id===c.id?"#2563EB":"#F8FAFC",
                          color:selTTClass?.id===c.id?"#fff":"#475569"}}>
                        {c.grade_name} — Class {c.name}
                      </button>
                    ))}
                  </div>

                  {!selTTClass?(
                    <div className="card" style={{textAlign:"center",padding:48,color:"#94A3B8"}}>
                      <div style={{fontSize:40,marginBottom:10}}>📅</div>
                      <p style={{fontSize:14}}>Select a class to manage its timetable</p>
                    </div>
                  ):(
                    <AdminTimetableManager
                      classId={selTTClass.id}
                      className={selTTClass.name}
                      accentColor="#2563EB"
                    />
                  )}
                </>
              )}
            </div>
          )}


        </div>
      </div>

      {/* ══ MODALS ══ */}
      {showAddUser&&(
        <div className="modal-bg" onClick={()=>setShowAddUser(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{height:3,background:"linear-gradient(90deg,#2563EB,#7C3AED)",borderRadius:"20px 20px 0 0",margin:"-28px -28px 22px"}}/>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:20,marginBottom:18,color:"#0F172A"}}>Add New User</h2>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["first_name","First Name"],["last_name","Last Name"]].map(([k,l])=>(
                <div key={k} className="field"><label>{l}</label>
                  <input className={formErrU[k]?"err":""} value={newUser[k]} onChange={e=>setNewUser(u=>({...u,[k]:e.target.value}))}/>
                  {formErrU[k]&&<div className="ferr">{formErrU[k]}</div>}
                </div>
              ))}
            </div>
            {[["email","Email","email"],["password","Password","password"]].map(([k,l,t])=>(
              <div key={k} className="field"><label>{l}</label>
                <input type={t} className={formErrU[k]?"err":""} value={newUser[k]} onChange={e=>setNewUser(u=>({...u,[k]:e.target.value}))}/>
                {formErrU[k]&&<div className="ferr">{formErrU[k]}</div>}
              </div>
            ))}
            <div className="field"><label>Role</label>
              <select value={newUser.role} onChange={e=>setNewUser(u=>({...u,role:e.target.value}))}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="parent">Parent</option>
              </select>
            </div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <button className="btn blue" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={handleAddUser}>Create User</button>
              <button className="btn ghost" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={()=>setShowAddUser(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showAddGrade&&(
        <div className="modal-bg" onClick={()=>setShowAddGrade(false)}>
          <div className="modal" style={{width:340}} onClick={e=>e.stopPropagation()}>
            <div style={{height:3,background:"linear-gradient(90deg,#2563EB,#7C3AED)",borderRadius:"20px 20px 0 0",margin:"-28px -28px 22px"}}/>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:20,marginBottom:18,color:"#0F172A"}}>Add New Grade</h2>
            <div className="field"><label>Grade Name</label>
              <input placeholder="e.g. Grade 1" value={newGradeName} onChange={e=>setNewGradeName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddGrade()}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn blue" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={handleAddGrade}>Create</button>
              <button className="btn ghost" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={()=>setShowAddGrade(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showAddClass&&(
        <div className="modal-bg" onClick={()=>setShowAddClass(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{height:3,background:"linear-gradient(90deg,#2563EB,#7C3AED)",borderRadius:"20px 20px 0 0",margin:"-28px -28px 22px"}}/>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:20,marginBottom:5,color:"#0F172A"}}>Add New Class</h2>
            <p style={{fontSize:13,color:"#64748B",marginBottom:18}}>Grade: <strong>{selGrade?.name||"—"}</strong></p>
            <div className="field"><label>Class Name</label><input placeholder="e.g. 1-A" value={newClass.name} onChange={e=>setNewClass(c=>({...c,name:e.target.value}))}/></div>
            <div className="field"><label>Subject</label><input placeholder="e.g. Mathematics" value={newClass.subject} onChange={e=>setNewClass(c=>({...c,subject:e.target.value}))}/></div>
            <div className="field"><label>Assign Teacher (optional)</label>
              <select value={newClass.teacher} onChange={e=>setNewClass(c=>({...c,teacher:e.target.value}))}>
                <option value="">— Select Teacher —</option>
                {teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn blue" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={handleAddClass}>Create Class</button>
              <button className="btn ghost" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={()=>setShowAddClass(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div className={`toast t-${toast.type==="success"?"s":"e"}`}>{toast.msg}</div>}
    </div>
  );
}
