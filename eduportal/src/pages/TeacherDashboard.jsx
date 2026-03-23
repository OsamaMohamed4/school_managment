import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { academicsAPI, attendanceAPI, quizzesAPI, notificationsAPI } from "../api";
import VideosPanel      from "../components/VideosPanel";
import AssignmentsPanel from "../components/AssignmentsPanel";
import LessonPlanPanel  from "../components/LessonPlanPanel";
import TimetablePanel   from "../components/TimetablePanel";
import MessagesPanel    from "../components/MessagesPanel";

const NAV = ["overview","attendance","quizzes","results","reports","notifications","assignments","messages","timetable","lesson-plan","videos"];
const Q_TYPES = [
  { value:"mcq",          label:"Multiple Choice" },
  { value:"true_false",   label:"True / False" },
  { value:"short_answer", label:"Short Answer" },
];
const NOTIF_TYPES = [
  {value:"info",    label:"ℹ️ Info",    color:"#2563EB"},
  {value:"warning", label:"⚠️ Warning", color:"#D97706"},
  {value:"success", label:"✅ Success", color:"#059669"},
];

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [tab, setTab]     = useState("overview");

  // ── Attendance ───────────────────────────────────────────
  const [classes,   setClasses]   = useState([]);
  const [selClass,  setSelClass]  = useState(null);
  const [students,  setStudents]  = useState([]);
  const [att,       setAtt]       = useState({});
  const [attDate,   setAttDate]   = useState(new Date().toISOString().split("T")[0]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting,setSubmitting]= useState(false);

  // ── Report ────────────────────────────────────────────────
  const [repClass, setRepClass] = useState(null);
  const [report,   setReport]   = useState(null);
  const [loadRep,  setLoadRep]  = useState(false);

  // ── Quizzes ───────────────────────────────────────────────
  const [quizzes,     setQuizzes]     = useState([]);
  const [loadingQ,    setLoadingQ]    = useState(false);
  const [selQuiz,     setSelQuiz]     = useState(null);
  const [showNewQuiz, setShowNewQuiz] = useState(false);
  const [newQuiz,     setNewQuiz]     = useState({title:"",description:"",class_room:"",deadline:""});
  const [newQ,        setNewQ]        = useState({text:"",question_type:"mcq",points:1,correct_answer_text:"",choices:[{text:"",is_correct:true},{text:"",is_correct:false},{text:"",is_correct:false},{text:"",is_correct:false}]});
  const [addingQ,     setAddingQ]     = useState(false);
  const [quizResults, setQuizResults] = useState([]);

  // ── Notifications ─────────────────────────────────────────
  const [notifClass,   setNotifClass]   = useState("");
  const [notifTitle,   setNotifTitle]   = useState("");
  const [notifMsg,     setNotifMsg]     = useState("");
  const [notifType,    setNotifType]    = useState("info");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [sentHistory,  setSentHistory]  = useState([]);

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

  useEffect(()=>{ loadClasses(); loadQuizzes(); },[loadClasses, loadQuizzes]);

  useEffect(()=>{
    if (!selClass) return;
    setSubmitted(false); setAtt({});
    setStudents(selClass.students_list||[]);
    attendanceAPI.byClass(selClass.id, attDate)
      .then(recs=>{const m={};recs.forEach(r=>{m[r.student]=r.status;});setAtt(m);})
      .catch(()=>{});
  },[selClass, attDate]);

  const toggle  = (sid) => setAtt(a=>({...a,[sid]:a[sid]==="present"?"absent":"present"}));
  const markAll = (val) => { const m={}; students.forEach(s=>{m[s.id]=val;}); setAtt(m); };

  const handleSubmitAtt = async () => {
    if (!selClass||students.length===0){showToast("No students","error");return;}
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
    if (!newQuiz.title.trim()){showToast("Enter title","error");return;}
    if (!newQuiz.class_room){showToast("Select class","error");return;}
    try {
      const payload={title:newQuiz.title,description:newQuiz.description,class_room:parseInt(newQuiz.class_room)};
      if(newQuiz.deadline) payload.deadline=newQuiz.deadline;
      const quiz = await quizzesAPI.create(payload);
      showToast("Quiz created!"); setShowNewQuiz(false);
      setNewQuiz({title:"",description:"",class_room:"",deadline:""});
      await loadQuizzes(); setSelQuiz(quiz); setTab("quizzes");
    } catch(e){ showToast(e?.title?.[0]||"Failed","error"); }
  };

  const handleAddQuestion = async () => {
    if (!newQ.text.trim()){showToast("Enter question text","error");return;}
    const payload={text:newQ.text,question_type:newQ.question_type,points:newQ.points};
    if(newQ.question_type==="short_answer"){ payload.correct_answer_text=newQ.correct_answer_text; payload.choices=[]; }
    else if(newQ.question_type==="true_false"){ payload.choices=[]; }
    else {
      const filled=newQ.choices.filter(c=>c.text.trim());
      if(filled.length<2){showToast("Add at least 2 choices","error");return;}
      if(!filled.some(c=>c.is_correct)){showToast("Mark 1 correct answer","error");return;}
      payload.choices=filled;
    }
    setAddingQ(true);
    try {
      await quizzesAPI.addQuestion(selQuiz.id, payload);
      showToast("Question added!");
      setNewQ({text:"",question_type:"mcq",points:1,correct_answer_text:"",choices:[{text:"",is_correct:true},{text:"",is_correct:false},{text:"",is_correct:false},{text:"",is_correct:false}]});
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
    try { const res=await quizzesAPI.toggle(id); setQuizzes(qs=>qs.map(q=>q.id===id?{...q,is_active:res.is_active}:q)); if(selQuiz?.id===id) setSelQuiz(q=>({...q,is_active:res.is_active})); }
    catch { showToast("Failed","error"); }
  };

  const loadResults = async (quiz) => {
    try { const d=await quizzesAPI.results(quiz.id); setQuizResults(d); setSelQuiz(quiz); setTab("results"); }
    catch { showToast("Failed","error"); }
  };

  // ── Send Notification ────────────────────────────────────
  const handleSendNotif = async () => {
    if (!notifTitle.trim()||!notifMsg.trim()){showToast("Title and message required","error");return;}
    if (!notifClass){showToast("Select a class","error");return;}
    setSendingNotif(true);
    try {
      const res = await notificationsAPI.send({
        title:      notifTitle,
        message:    notifMsg,
        notif_type: notifType,
        class_id:   parseInt(notifClass),
      });
      showToast(res.message||"Sent!");
      setSentHistory(h=>[{title:notifTitle,message:notifMsg,notif_type:notifType,sent_at:new Date().toLocaleString(),count:res.count},...h]);
      setNotifTitle(""); setNotifMsg(""); setNotifType("info");
    } catch(e){ showToast(e?.error||"Failed","error"); }
    finally { setSendingNotif(false); }
  };

  const present  = students.filter(s=>att[s.id]==="present").length;
  const absent   = students.filter(s=>att[s.id]==="absent").length;
  const unmarked = students.filter(s=>!att[s.id]).length;
  const scoreColor = (p)=>p>=80?"#059669":p>=60?"#D97706":"#EF4444";
  const allClasses = classes;

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",display:"flex",minHeight:"100vh"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        .nb{display:flex;align-items:center;padding:9px 14px;border-radius:9px;border:none;background:none;width:100%;font-size:13px;font-weight:500;color:#64748B;cursor:pointer;font-family:inherit;transition:all .18s;text-transform:capitalize;}
        .nb:hover{background:#F0FDF4;} .nb.a{background:#DCFCE7;color:#059669;font-weight:700;}
        .card{background:#fff;border-radius:14px;padding:20px;border:1.5px solid #D1FAE5;}
        .btn{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .18s;}
        .bg{background:#059669;color:#fff;} .bg:hover{background:#047857;} .bg:disabled{background:#6EE7B7;cursor:not-allowed;}
        .bgh{background:#F0FDF4;color:#059669;border:1.5px solid #A7F3D0;}
        .bgr{background:#FEF2F2;color:#EF4444;} .bgl{background:#F1F5F9;color:#475569;}
        .srow{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:10px;border:1.5px solid #E2E8F0;margin-bottom:7px;cursor:pointer;transition:all .18s;}
        .srow:hover{border-color:#6EE7B7;} .srow.p{border-color:#059669;background:#F0FDF4;} .srow.ab{border-color:#EF4444;background:#FEF2F2;}
        .inp{width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;color:#0F172A;background:#F8FAFC;outline:none;font-family:inherit;transition:border .2s;}
        .inp:focus{border-color:#059669;background:#fff;}
        .sel{width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;background:#F8FAFC;color:#0F172A;outline:none;font-family:inherit;}
        .lbl{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;}
        .field{margin-bottom:12px;}
        .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(3px);}
        .modal{background:#fff;border-radius:18px;padding:28px;width:480px;max-width:94vw;max-height:90vh;overflow-y:auto;}
        .toast{position:fixed;bottom:22px;right:22px;padding:12px 18px;border-radius:11px;font-size:13px;font-weight:600;z-index:300;max-width:340px;}
        .ts{background:#059669;color:#fff;} .te{background:#EF4444;color:#fff;}
        .qcard{background:#F8FAFC;border-radius:11px;padding:14px 16px;border:1.5px solid #E2E8F0;margin-bottom:10px;}
        .badge{display:inline-flex;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;}
        .b-mcq{background:#EFF6FF;color:#2563EB;} .b-tf{background:#F0FDF4;color:#059669;} .b-sa{background:#FFF7ED;color:#D97706;}
        .pbar{height:6px;background:#E2E8F0;border-radius:3px;overflow:hidden;margin-top:5px;}
        .pfill{height:100%;border-radius:3px;transition:width .6s ease;}
        .choice-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
        .fade{animation:fi .3s ease;} @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .tab-row{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;}
        .tabbtn{padding:7px 14px;border-radius:8px;border:1.5px solid #E2E8F0;background:#fff;font-size:13px;font-weight:600;color:#64748B;cursor:pointer;font-family:inherit;transition:all .18s;}
        .tabbtn.a{background:#F0FDF4;color:#059669;border-color:#A7F3D0;}
        .notif-type-btn{padding:7px 14px;border-radius:8px;border:1.5px solid #E2E8F0;background:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .18s;}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{width:210,background:"#fff",borderRight:"1.5px solid #D1FAE5",display:"flex",flexDirection:"column",height:"100vh",position:"fixed",top:0,left:0}}>
        <div style={{padding:"16px 14px",borderBottom:"1.5px solid #F0FDF4",display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:32,height:32,background:"#059669",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:15,color:"#0F172A"}}>EduPortal</span>
        </div>
        <div style={{margin:"10px 10px 4px",background:"#DCFCE7",borderRadius:9,padding:"9px 11px",border:"1px solid #A7F3D0"}}>
          <div style={{fontSize:10,color:"#059669",fontWeight:700,textTransform:"uppercase"}}>Teacher</div>
          <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginTop:2}}>{user?.full_name||user?.first_name}</div>
        </div>
        <nav style={{flex:1,padding:"6px 8px",display:"flex",flexDirection:"column",gap:2}}>
          {NAV.map(n=><button key={n} className={`nb${tab===n?" a":""}`} onClick={()=>setTab(n)}>{n==="notifications"?"🔔 "+n:n}</button>)}
        </nav>
        <div style={{padding:"10px 8px",borderTop:"1.5px solid #F0FDF4"}}>
          <button className="nb" onClick={()=>navigate("/profile")} style={{marginBottom:4}}>👤 My Profile</button>
          <button className="nb" style={{color:"#EF4444"}} onClick={()=>{logout();navigate("/");}}>Logout</button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{marginLeft:210,flex:1,background:"#F0FDF4",minHeight:"100vh"}}>
        <header style={{background:"#fff",borderBottom:"1.5px solid #D1FAE5",padding:"0 26px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
          <h1 style={{fontSize:15,fontWeight:700,color:"#0F172A",textTransform:"capitalize"}}>{tab}</h1>
          <div style={{width:32,height:32,background:"#059669",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:12}}>
            {(user?.first_name||"T").charAt(0).toUpperCase()}
          </div>
        </header>

        <div style={{padding:"24px"}}>

          {/* ══ OVERVIEW ══ */}
          {tab==="overview"&&(
            <div className="fade">
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
                {[["Classes",classes.length,"#059669"],["Quizzes",quizzes.length,"#2563EB"],["Students",classes.reduce((a,c)=>a+(c.student_count||0),0),"#7C3AED"]].map(([l,v,c])=>(
                  <div key={l} className="card"><div style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',serif",color:c}}>{v}</div><div style={{fontSize:13,color:"#64748B",marginTop:3}}>{l}</div></div>
                ))}
              </div>
              <div className="card">
                <h3 style={{fontSize:14,fontWeight:700,marginBottom:14}}>My Classes</h3>
                {classes.length===0?<p style={{color:"#94A3B8",fontSize:13}}>No classes assigned yet.</p>
                :classes.map(c=>(
                  <div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"#F0FDF4",borderRadius:11,border:"1.5px solid #D1FAE5",marginBottom:8}}>
                    <div><div style={{fontWeight:700,fontSize:14}}>Class {c.name} — {c.subject||c.grade_name}</div><div style={{fontSize:12,color:"#64748B"}}>{c.student_count||0} students</div></div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="btn bgh" onClick={()=>{setSelClass(c);setTab("attendance");}}>Attendance</button>
                      <button className="btn bgl" onClick={()=>loadReport(c)}>Report</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ ATTENDANCE ══ */}
          {tab==="attendance"&&(
            <div className="fade">
              <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
                {classes.map(c=>(
                  <button key={c.id} className="btn" onClick={()=>{setSelClass(c);setSubmitted(false);}} style={{background:selClass?.id===c.id?"#059669":"#fff",color:selClass?.id===c.id?"#fff":"#475569",border:`1.5px solid ${selClass?.id===c.id?"#059669":"#E2E8F0"}`}}>Class {c.name}</button>
                ))}
                <input type="date" value={attDate} onChange={e=>{setAttDate(e.target.value);setSubmitted(false);}} style={{padding:"8px 12px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:13,outline:"none",background:"#fff",fontFamily:"inherit"}}/>
              </div>
              {!selClass?<div className="card"><p style={{color:"#94A3B8"}}>Select a class</p></div>:(
                <div style={{display:"grid",gridTemplateColumns:"1fr 260px",gap:16}}>
                  <div className="card">
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                      <div><h3 style={{fontSize:14,fontWeight:700}}>Class {selClass.name} · {attDate}</h3><p style={{fontSize:12,color:"#64748B",marginTop:2}}>{students.length===0?"No students":"Click to toggle"}</p></div>
                      {students.length>0&&(<div style={{display:"flex",gap:7}}><button className="btn bgh" style={{fontSize:12,padding:"5px 10px"}} onClick={()=>markAll("present")}>✅ All Present</button><button className="btn bgr" style={{fontSize:12,padding:"5px 10px"}} onClick={()=>markAll("absent")}>✗ All Absent</button></div>)}
                    </div>
                    {students.length===0?<div style={{padding:24,textAlign:"center",background:"#F0FDF4",borderRadius:10,color:"#64748B",fontSize:13}}>No students assigned.</div>
                    :students.map(s=>(
                      <div key={s.id} className={`srow${att[s.id]==="present"?" p":att[s.id]==="absent"?" ab":""}`} onClick={()=>toggle(s.id)}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:32,height:32,borderRadius:"50%",background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12}}>{(s.first_name||s.full_name||"?").charAt(0).toUpperCase()}</div>
                          <span style={{fontSize:13,fontWeight:500}}>{s.full_name||`${s.first_name} ${s.last_name}`}</span>
                        </div>
                        <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,background:att[s.id]==="present"?"#059669":att[s.id]==="absent"?"#EF4444":"#E2E8F0"}}>{att[s.id]==="present"?"✓":att[s.id]==="absent"?"✗":""}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <div className="card">
                      <h4 style={{fontSize:13,fontWeight:700,marginBottom:14}}>Today's Summary</h4>
                      {[["Present",present,"#059669","#DCFCE7"],["Absent",absent,"#EF4444","#FEE2E2"],["Unmarked",unmarked,"#D97706","#FEF3C7"]].map(([l,v,c,bg])=>(
                        <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:bg,borderRadius:9,marginBottom:7}}>
                          <span style={{fontSize:13,fontWeight:600,color:c}}>{l}</span>
                          <span style={{fontSize:22,fontWeight:800,color:c,fontFamily:"'Playfair Display',serif"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    {submitted?<div style={{background:"#DCFCE7",borderRadius:12,padding:18,textAlign:"center",border:"1.5px solid #A7F3D0"}}><div style={{fontSize:26,marginBottom:4}}>✅</div><div style={{fontSize:14,fontWeight:700,color:"#059669"}}>Submitted!</div><button className="btn bgh" style={{marginTop:12,width:"100%",justifyContent:"center"}} onClick={()=>setSubmitted(false)}>Edit</button></div>
                    :<button className="btn bg" style={{width:"100%",justifyContent:"center",padding:"13px",fontSize:14}} disabled={submitting||students.length===0} onClick={handleSubmitAtt}>{submitting?<span className="spinner"/>:"Submit Attendance"}</button>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ QUIZZES ══ */}
          {tab==="quizzes"&&(
            <div className="fade">
              {!selQuiz?(
                <>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>My Quizzes ({quizzes.length})</h3>
                    <button className="btn bg" onClick={()=>setShowNewQuiz(true)}>+ New Quiz</button>
                  </div>
                  {loadingQ?<div className="card"><p style={{color:"#94A3B8"}}>Loading...</p></div>
                  :quizzes.length===0?<div className="card" style={{textAlign:"center",padding:40,color:"#94A3B8"}}><p style={{fontSize:32,marginBottom:8}}>📝</p><p>No quizzes yet.</p></div>
                  :quizzes.map(q=>(
                    <div key={q.id} className="card" style={{marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <span style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>{q.title}</span>
                          <span style={{background:q.is_active?"#DCFCE7":"#FEE2E2",color:q.is_active?"#059669":"#EF4444",padding:"2px 8px",borderRadius:999,fontSize:11,fontWeight:700}}>{q.is_active?"Active":"Inactive"}</span>
                        </div>
                        <div style={{fontSize:12,color:"#64748B"}}>{q.class_room_name} · {q.question_count} questions · {q.attempt_count} attempts</div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button className="btn bgh" onClick={()=>setSelQuiz(q)}>Build</button>
                        <button className="btn bgl" onClick={()=>handleToggleQuiz(q.id)}>{q.is_active?"Deactivate":"Activate"}</button>
                        <button className="btn bgl" onClick={()=>loadResults(q)}>Results</button>
                      </div>
                    </div>
                  ))}
                </>
              ):(
                <>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                    <button className="btn bgl" onClick={()=>setSelQuiz(null)}>← Back</button>
                    <h3 style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>{selQuiz.title}</h3>
                    <span style={{background:selQuiz.is_active?"#DCFCE7":"#FEE2E2",color:selQuiz.is_active?"#059669":"#EF4444",padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:700}}>{selQuiz.is_active?"Active":"Inactive"}</span>
                  </div>
                  <div className="card" style={{marginBottom:16}}>
                    <h4 style={{fontSize:13,fontWeight:700,marginBottom:12}}>Questions ({selQuiz.questions?.length||0})</h4>
                    {(!selQuiz.questions||selQuiz.questions.length===0)?<p style={{color:"#94A3B8",fontSize:13}}>No questions yet.</p>
                    :selQuiz.questions.map((q,i)=>(
                      <div key={q.id} className="qcard">
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                              <span style={{fontSize:12,fontWeight:700,color:"#64748B"}}>Q{i+1}</span>
                              <span className={`badge b-${q.question_type==="mcq"?"mcq":q.question_type==="true_false"?"tf":"sa"}`}>{q.question_type==="mcq"?"MCQ":q.question_type==="true_false"?"T/F":"Short"}</span>
                              <span style={{fontSize:11,color:"#94A3B8"}}>{q.points} pt{q.points>1?"s":""}</span>
                            </div>
                            <p style={{fontSize:13,color:"#0F172A",marginBottom:6}}>{q.text}</p>
                            {q.question_type==="short_answer"&&q.correct_answer_text&&<p style={{fontSize:12,color:"#059669"}}>✓ {q.correct_answer_text}</p>}
                            {q.choices?.map(c=><div key={c.id} style={{fontSize:12,color:c.is_correct?"#059669":"#64748B",marginBottom:2}}>{c.is_correct?"✓":"◦"} {c.text}</div>)}
                          </div>
                          <button className="btn bgr" style={{fontSize:11,padding:"4px 8px",flexShrink:0,marginLeft:10}} onClick={()=>handleDeleteQuestion(q.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="card">
                    <h4 style={{fontSize:13,fontWeight:700,marginBottom:14}}>Add New Question</h4>
                    <div className="field"><label className="lbl">Type</label><select className="sel" value={newQ.question_type} onChange={e=>setNewQ(q=>({...q,question_type:e.target.value,choices:[{text:"",is_correct:true},{text:"",is_correct:false},{text:"",is_correct:false},{text:"",is_correct:false}]}))}>{Q_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                    <div className="field"><label className="lbl">Question Text</label><textarea className="inp" rows={3} value={newQ.text} onChange={e=>setNewQ(q=>({...q,text:e.target.value}))} style={{resize:"vertical"}}/></div>
                    <div className="field" style={{width:100}}><label className="lbl">Points</label><input className="inp" type="number" min={1} max={10} value={newQ.points} onChange={e=>setNewQ(q=>({...q,points:parseInt(e.target.value)||1}))}/></div>
                    {newQ.question_type==="mcq"&&<div className="field"><label className="lbl">Choices</label>{newQ.choices.map((c,i)=><div key={i} className="choice-row"><input type="checkbox" checked={c.is_correct} onChange={e=>{const u=[...newQ.choices];u[i]={...c,is_correct:e.target.checked};setNewQ(q=>({...q,choices:u}));}}/><input className="inp" placeholder={`Choice ${i+1}`} value={c.text} onChange={e=>{const u=[...newQ.choices];u[i]={...c,text:e.target.value};setNewQ(q=>({...q,choices:u}));}}/></div>)}</div>}
                    {newQ.question_type==="true_false"&&<div style={{background:"#F0FDF4",borderRadius:9,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#059669"}}>✓ True/False choices created automatically</div>}
                    {newQ.question_type==="short_answer"&&<div className="field"><label className="lbl">Correct Answer</label><input className="inp" value={newQ.correct_answer_text} onChange={e=>setNewQ(q=>({...q,correct_answer_text:e.target.value}))}/></div>}
                    <button className="btn bg" disabled={addingQ} onClick={handleAddQuestion}>{addingQ?<span className="spinner"/>:"+ Add Question"}</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ RESULTS ══ */}
          {tab==="results"&&(
            <div className="fade">
              {!selQuiz?(
                <>
                  <h3 style={{fontSize:14,fontWeight:700,marginBottom:14,color:"#0F172A"}}>Select a quiz to view results</h3>
                  {quizzes.map(q=>(
                    <div key={q.id} className="card" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <div><div style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>{q.title}</div><div style={{fontSize:12,color:"#64748B"}}>{q.attempt_count} attempts</div></div>
                      <button className="btn bgh" onClick={()=>loadResults(q)}>View Results</button>
                    </div>
                  ))}
                  {quizzes.length===0&&<div className="card" style={{textAlign:"center",color:"#94A3B8",padding:32}}>No quizzes yet.</div>}
                </>
              ):(
                <>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                    <button className="btn bgl" onClick={()=>setSelQuiz(null)}>← Back</button>
                    <h3 style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>{selQuiz.title} — Results</h3>
                  </div>
                  {quizResults.length>0&&(
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
                      {[["Attempts",quizResults.length],["Avg Score",Math.round(quizResults.reduce((a,r)=>a+(r.percentage||0),0)/quizResults.length)+"%"],["Pass Rate",Math.round(quizResults.filter(r=>r.percentage>=60).length/quizResults.length*100)+"%"]].map(([l,v])=>(
                        <div key={l} className="card" style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:800,fontFamily:"'Playfair Display',serif",color:"#059669"}}>{v}</div><div style={{fontSize:13,color:"#64748B",marginTop:3}}>{l}</div></div>
                      ))}
                    </div>
                  )}
                  {quizResults.length===0?<div className="card" style={{textAlign:"center",color:"#94A3B8",padding:32}}>No attempts yet.</div>
                  :quizResults.map(r=>(
                    <div key={r.id} className="card" style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                        <div><div style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>{r.student_name}</div><div style={{fontSize:12,color:"#64748B"}}>{new Date(r.submitted_at).toLocaleString()}</div></div>
                        <div style={{textAlign:"right"}}><div style={{fontSize:22,fontWeight:800,color:scoreColor(r.percentage),fontFamily:"'Playfair Display',serif"}}>{r.percentage}%</div><div style={{fontSize:12,color:"#64748B"}}>{r.score}/{r.total_points} pts</div></div>
                      </div>
                      <div className="pbar"><div className="pfill" style={{width:`${r.percentage}%`,background:scoreColor(r.percentage)}}/></div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ══ REPORTS ══ */}
          {tab==="reports"&&(
            <div className="fade">
              <h3 style={{fontSize:14,fontWeight:700,marginBottom:14,color:"#0F172A"}}>Attendance Reports</h3>
              <div className="tab-row">{classes.map(c=><button key={c.id} className={`tabbtn${repClass?.id===c.id?" a":""}`} onClick={()=>loadReport(c)}>Class {c.name}</button>)}</div>
              {!repClass&&<div className="card" style={{textAlign:"center",color:"#94A3B8",padding:40}}>Select a class</div>}
              {repClass&&loadRep&&<div className="card"><p style={{color:"#94A3B8"}}>Loading...</p></div>}
              {repClass&&!loadRep&&report&&(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
                    {[["Total Students",report.total_students,"#0F172A"],["Avg Attendance",report.student_stats.length>0?Math.round(report.student_stats.reduce((a,s)=>a+s.attendance_rate,0)/report.student_stats.length)+"%":"0%","#059669"],["Below 75%",report.student_stats.filter(s=>s.attendance_rate<75).length,"#EF4444"]].map(([l,v,c])=>(
                      <div key={l} className="card" style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:800,fontFamily:"'Playfair Display',serif",color:c}}>{v}</div><div style={{fontSize:13,color:"#64748B",marginTop:3}}>{l}</div></div>
                    ))}
                  </div>
                  <div className="card" style={{padding:0,overflow:"hidden"}}>
                    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",padding:"11px 18px",background:"#F8FAFC",borderBottom:"1.5px solid #E2E8F0"}}>
                      {["Student","Total","Present","Absent","Rate"].map(h=><div key={h} style={{fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase"}}>{h}</div>)}
                    </div>
                    {report.student_stats.length===0?<div style={{padding:24,textAlign:"center",color:"#94A3B8"}}>No records.</div>
                    :[...report.student_stats].sort((a,b)=>a.attendance_rate-b.attendance_rate).map(s=>(
                      <div key={s.student_id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",padding:"12px 18px",borderBottom:"1px solid #F1F5F9",fontSize:13,alignItems:"center"}}>
                        <div><div style={{fontWeight:600,color:"#0F172A"}}>{s.student_name}</div></div>
                        <span>{s.total_days}</span>
                        <span style={{color:"#059669",fontWeight:600}}>{s.present_days}</span>
                        <span style={{color:"#EF4444",fontWeight:600}}>{s.absent_days}</span>
                        <div><span style={{fontWeight:700,color:scoreColor(s.attendance_rate)}}>{s.attendance_rate}%</span><div className="pbar" style={{width:70}}><div className="pfill" style={{width:`${s.attendance_rate}%`,background:scoreColor(s.attendance_rate)}}/></div></div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══ NOTIFICATIONS ══ */}
          {tab==="notifications"&&(
            <div className="fade">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {/* Send form */}
                <div className="card">
                  <h3 style={{fontSize:14,fontWeight:700,marginBottom:16,color:"#0F172A"}}>Send Notification</h3>
                  <div className="field">
                    <label className="lbl">Send to Class</label>
                    <select className="sel" value={notifClass} onChange={e=>setNotifClass(e.target.value)}>
                      <option value="">— Select Class —</option>
                      {classes.map(c=><option key={c.id} value={c.id}>Class {c.name} ({c.grade_name})</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="lbl">Type</label>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {NOTIF_TYPES.map(t=>(
                        <button key={t.value} className="notif-type-btn"
                          style={{background:notifType===t.value?t.color:"#fff",color:notifType===t.value?"#fff":t.color,borderColor:notifType===t.value?t.color:"#E2E8F0"}}
                          onClick={()=>setNotifType(t.value)}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <label className="lbl">Title</label>
                    <input className="inp" placeholder="Notification title..." value={notifTitle} onChange={e=>setNotifTitle(e.target.value)}/>
                  </div>
                  <div className="field">
                    <label className="lbl">Message</label>
                    <textarea className="inp" rows={4} placeholder="Write your message..." value={notifMsg} onChange={e=>setNotifMsg(e.target.value)} style={{resize:"vertical"}}/>
                  </div>
                  <button className="btn bg" style={{width:"100%",justifyContent:"center",padding:"12px"}} disabled={sendingNotif} onClick={handleSendNotif}>
                    {sendingNotif?<span className="spinner"/>:"🔔 Send Notification"}
                  </button>
                </div>

                {/* Sent history */}
                <div className="card">
                  <h3 style={{fontSize:14,fontWeight:700,marginBottom:14,color:"#0F172A"}}>Sent This Session ({sentHistory.length})</h3>
                  {sentHistory.length===0
                    ?<div style={{textAlign:"center",padding:32,color:"#94A3B8"}}><div style={{fontSize:32,marginBottom:8}}>🔔</div><p>No notifications sent yet.</p></div>
                    :sentHistory.map((n,i)=>(
                      <div key={i} style={{padding:"12px 14px",borderRadius:10,border:"1.5px solid #E2E8F0",marginBottom:8,background:"#F8FAFC"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                          <span style={{fontWeight:700,fontSize:13,color:"#0F172A"}}>{n.title}</span>
                          <span style={{fontSize:11,color:"#94A3B8"}}>{n.sent_at}</span>
                        </div>
                        <p style={{fontSize:12,color:"#64748B",marginBottom:6}}>{n.message}</p>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <span style={{fontSize:11,background:n.notif_type==="info"?"#EFF6FF":n.notif_type==="warning"?"#FEF3C7":"#ECFDF5",color:n.notif_type==="info"?"#2563EB":n.notif_type==="warning"?"#D97706":"#059669",padding:"2px 8px",borderRadius:999,fontWeight:700}}>{n.notif_type}</span>
                          <span style={{fontSize:11,color:"#64748B"}}>→ {n.count} student{n.count>1?"s":""}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {tab==="assignments"&&<div className="fade"><AssignmentsPanel accentColor="#059669" accentBg="#ECFDF5"/></div>}
          {tab==="messages"&&<div className="fade"><MessagesPanel accentColor="#059669" accentBg="#ECFDF5"/></div>}
          {tab==="lesson-plan"&&<div className="fade"><LessonPlanPanel accentColor="#059669" accentBg="#ECFDF5"/></div>}

          {tab==="videos"&&<div className="fade"><VideosPanel accentColor="#059669" accentBg="#ECFDF5"/></div>}

          {tab==="timetable"&&(
            <div className="fade">
              {classes.map(c=>(
                <div key={c.id} style={{marginBottom:24}}>
                  <TimetablePanel isTeacher={true} readOnly={true} accentColor="#059669"/>
                </div>
              ))}
              {classes.length===0&&<div style={{textAlign:"center",color:"#94A3B8",padding:40}}>No classes assigned.</div>}
            </div>
          )}

        </div>
      </div>

      {showNewQuiz&&(
        <div className="modal-bg" onClick={()=>setShowNewQuiz(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:20,marginBottom:18}}>Create New Quiz</h2>
            <div className="field"><label className="lbl">Title *</label><input className="inp" placeholder="Quiz title..." value={newQuiz.title} onChange={e=>setNewQuiz(q=>({...q,title:e.target.value}))}/></div>
            <div className="field"><label className="lbl">Description</label><textarea className="inp" rows={2} value={newQuiz.description} onChange={e=>setNewQuiz(q=>({...q,description:e.target.value}))} style={{resize:"none"}}/></div>
            <div className="field"><label className="lbl">Class *</label><select className="sel" value={newQuiz.class_room} onChange={e=>setNewQuiz(q=>({...q,class_room:e.target.value}))}><option value="">— Select —</option>{classes.map(c=><option key={c.id} value={c.id}>Class {c.name} ({c.grade_name})</option>)}</select></div>
            <div className="field"><label className="lbl">Deadline (optional)</label><input className="inp" type="datetime-local" value={newQuiz.deadline} onChange={e=>setNewQuiz(q=>({...q,deadline:e.target.value}))}/></div>
            <div style={{display:"flex",gap:8}}><button className="btn bg" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={handleCreateQuiz}>Create</button><button className="btn bgl" style={{flex:1,justifyContent:"center",padding:"11px"}} onClick={()=>setShowNewQuiz(false)}>Cancel</button></div>
          </div>
        </div>
      )}

      {toast&&<div className={`toast ${toast.type==="success"?"ts":"te"}`}>{toast.msg}</div>}
    </div>
  );
}
