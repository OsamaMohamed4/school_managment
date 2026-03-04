import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { academicsAPI, attendanceAPI } from "../api";

export default function TeacherDashboard() {
  const { user, logout }         = useAuth();
  const navigate                  = useNavigate();
  const [tab, setTab]             = useState("overview");
  const [classes, setClasses]     = useState([]);
  const [selClass, setSelClass]   = useState(null);
  const [students, setStudents]   = useState([]);
  const [attendance, setAtt]      = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [date, setDate]           = useState(new Date().toISOString().split("T")[0]);
  const [loadCls, setLoadCls]     = useState(false);
  const [loadAtt, setLoadAtt]     = useState(false);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  // Load teacher classes
  useEffect(()=>{
    setLoadCls(true);
    academicsAPI.classes.myClasses()
      .then(data => { setClasses(data); if(data.length) setSelClass(data[0]); })
      .catch(()=>showToast("Failed to load classes","error"))
      .finally(()=>setLoadCls(false));
  },[]);

  // Load existing attendance when class/date changes
  useEffect(()=>{
    if(!selClass) return;
    setLoadAtt(true);
    setSubmitted(false);
    attendanceAPI.byClass(selClass.id, date)
      .then(records => {
        const map = {};
        records.forEach(r => map[r.student] = r.status);
        setAtt(map);
        // Build student list from class
        const studentList = selClass.students_list || [];
        setStudents(studentList);
      })
      .catch(()=>{ setStudents([]); setAtt({}); })
      .finally(()=>setLoadAtt(false));
  },[selClass, date]);

  const toggle = (sid) => setAtt(a => ({...a, [sid]: a[sid]==="present"?"absent":"present"}));
  const markAll = (val) => {
    const map = {};
    students.forEach(s => map[s.id] = val);
    setAtt(map);
  };

  const handleSubmit = async () => {
    if(!selClass) return;
    const records = students.map(s=>({ student_id:s.id, status: attendance[s.id]||"absent" }));
    try {
      await attendanceAPI.submitBulk(selClass.id, date, records);
      setSubmitted(true);
      showToast("✅ Attendance submitted successfully!");
    } catch(e) { showToast("Failed to submit attendance","error"); }
  };

  const present = students.filter(s=>attendance[s.id]==="present").length;
  const absent  = students.filter(s=>attendance[s.id]==="absent").length;
  const unmarked= students.filter(s=>!attendance[s.id]).length;

  const NAV = [
    { id:"overview",   label:"Overview",   col:"#059669" },
    { id:"attendance", label:"Attendance", col:"#059669" },
    { id:"quizzes",    label:"Quizzes",    col:"#059669" },
    { id:"results",    label:"Results",    col:"#059669" },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", display:"flex", minHeight:"100vh" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#BBF7D0;border-radius:3px}
        .nb{display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:9px;border:none;background:none;width:100%;font-size:13px;font-weight:500;color:#475569;cursor:pointer;font-family:inherit;transition:all .18s;}
        .nb:hover{background:#F0FDF4;color:#0F172A;}
        .nb.a{background:#DCFCE7;color:#059669;font-weight:700;}
        .card{background:#fff;border-radius:14px;padding:20px;border:1.5px solid #D1FAE5;}
        .btn{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .18s;}
        .bg{background:#059669;color:#fff;}.bg:hover{background:#047857;}
        .bgh{background:#F0FDF4;color:#059669;border:1.5px solid #A7F3D0;}
        .br{background:#FEF2F2;color:#EF4444;}
        .srow{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:10px;border:1.5px solid #E2E8F0;margin-bottom:7px;cursor:pointer;transition:all .18s;}
        .srow:hover{border-color:#6EE7B7;}
        .srow.p{border-color:#059669;background:#F0FDF4;}
        .srow.ab{border-color:#EF4444;background:#FEF2F2;}
        .toast{position:fixed;bottom:22px;right:22px;padding:12px 18px;border-radius:11px;font-size:13px;font-weight:600;z-index:200;animation:su .3s ease;}
        .ts{background:#059669;color:#fff;}.te{background:#EF4444;color:#fff;}
        @keyframes su{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
        .fade{animation:fi .35s ease;}@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width:210, background:"#fff", borderRight:"1.5px solid #D1FAE5", display:"flex", flexDirection:"column", height:"100vh", position:"fixed", top:0, left:0 }}>
        <div style={{ padding:"16px 14px", borderBottom:"1.5px solid #F0FDF4", display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:32, height:32, background:"#059669", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:15, color:"#0F172A" }}>EduPortal</span>
        </div>
        <div style={{ margin:"10px 10px 4px", background:"#DCFCE7", borderRadius:9, padding:"9px 11px", border:"1px solid #A7F3D0" }}>
          <div style={{ fontSize:10, color:"#059669", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Teacher</div>
          <div style={{ fontSize:13, fontWeight:700, color:"#0F172A", marginTop:2 }}>{user?.full_name || user?.first_name || "Teacher"}</div>
        </div>
        <nav style={{ flex:1, padding:"6px 8px", display:"flex", flexDirection:"column", gap:2 }}>
          {NAV.map(n => <button key={n.id} className={`nb${tab===n.id?" a":""}`} onClick={()=>setTab(n.id)}>{n.label}</button>)}
        </nav>
        <div style={{ padding:"10px 8px", borderTop:"1.5px solid #F0FDF4" }}>
          <button className="nb" style={{ color:"#EF4444" }} onClick={()=>{ logout(); navigate("/"); }}>Logout</button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft:210, flex:1, background:"#F0FDF4", minHeight:"100vh" }}>
        <header style={{ background:"#fff", borderBottom:"1.5px solid #D1FAE5", padding:"0 26px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#0F172A" }}>{NAV.find(n=>n.id===tab)?.label}</h1>
          <div style={{ width:32, height:32, background:"#059669", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:12 }}>
            {(user?.first_name||"T").charAt(0).toUpperCase()}
          </div>
        </header>

        <div style={{ padding:"24px 26px" }}>

          {/* ── OVERVIEW ── */}
          {tab==="overview" && (
            <div className="fade">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
                {[["My Classes",classes.length,"Classes assigned to you"],["Total Students",classes.reduce((a,c)=>a+(c.student_count||0),0),"Across all classes"],["Active Quizzes","—","Quizzes you created"]].map(([l,v,s])=>(
                  <div key={l} className="card">
                    <div style={{ fontSize:26, fontWeight:800, fontFamily:"'Playfair Display',serif", color:"#0F172A" }}>{loadCls?"…":v}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#0F172A", marginTop:2 }}>{l}</div>
                    <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>{s}</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>My Classes</h3>
                {loadCls ? <p style={{ color:"#94A3B8", fontSize:13 }}>Loading...</p> :
                  classes.length===0 ? <p style={{ color:"#94A3B8", fontSize:13 }}>No classes assigned yet.</p> :
                  classes.map(c=>(
                    <div key={c.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"#F0FDF4", borderRadius:11, border:"1.5px solid #D1FAE5", marginBottom:8 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:"#0F172A" }}>Class {c.name} — {c.subject||c.grade_name}</div>
                        <div style={{ fontSize:12, color:"#64748B" }}>{c.student_count||0} students</div>
                      </div>
                      <button className="btn bgh" onClick={()=>{ setSelClass(c); setTab("attendance"); }}>Mark Attendance →</button>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* ── ATTENDANCE ── */}
          {tab==="attendance" && (
            <div className="fade">
              {/* Class & Date selectors */}
              <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
                {classes.map(c=>(
                  <button key={c.id} className="btn" onClick={()=>{ setSelClass(c); setSubmitted(false); }}
                    style={{ background:selClass?.id===c.id?"#059669":"#fff", color:selClass?.id===c.id?"#fff":"#475569", border:`1.5px solid ${selClass?.id===c.id?"#059669":"#E2E8F0"}` }}>
                    Class {c.name}
                  </button>
                ))}
                <input type="date" value={date} onChange={e=>{ setDate(e.target.value); setSubmitted(false); }}
                  style={{ padding:"8px 12px", border:"1.5px solid #E2E8F0", borderRadius:8, fontSize:13, outline:"none", background:"#fff", fontFamily:"inherit" }} />
              </div>

              {!selClass ? <div className="card"><p style={{ color:"#94A3B8" }}>Select a class above</p></div> : (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:16 }}>
                  {/* Student List */}
                  <div className="card">
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                      <div>
                        <h3 style={{ fontSize:14, fontWeight:700, color:"#0F172A" }}>Class {selClass.name} · {date}</h3>
                        <p style={{ fontSize:12, color:"#64748B" }}>Click student to toggle present/absent</p>
                      </div>
                      <div style={{ display:"flex", gap:7 }}>
                        <button className="btn bgh" style={{ fontSize:12, padding:"5px 10px" }} onClick={()=>markAll("present")}>✅ All Present</button>
                        <button className="btn br"  style={{ fontSize:12, padding:"5px 10px" }} onClick={()=>markAll("absent")}>✗ All Absent</button>
                      </div>
                    </div>

                    {loadAtt ? <p style={{ color:"#94A3B8", fontSize:13 }}>Loading...</p> :
                      students.length===0 ? (
                        <div style={{ padding:"24px", textAlign:"center", color:"#94A3B8", background:"#F0FDF4", borderRadius:10 }}>
                          <p style={{ fontSize:13 }}>Student list will load from the API.</p>
                          <p style={{ fontSize:12, marginTop:6 }}>Make sure students are assigned to this class in Django Admin.</p>
                        </div>
                      ) :
                      students.map(s=>(
                        <div key={s.id} className={`srow ${attendance[s.id]==="present"?"p":attendance[s.id]==="absent"?"ab":""}`} onClick={()=>toggle(s.id)}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:32, height:32, borderRadius:"50%", background:"#F1F5F9", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12 }}>{s.first_name?.charAt(0)}</div>
                            <span style={{ fontSize:13, fontWeight:500 }}>{s.full_name||`${s.first_name} ${s.last_name}`}</span>
                          </div>
                          <div style={{ width:28, height:28, borderRadius:"50%", background:attendance[s.id]==="present"?"#059669":attendance[s.id]==="absent"?"#EF4444":"#E2E8F0", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:13 }}>
                            {attendance[s.id]==="present"?"✓":attendance[s.id]==="absent"?"✗":""}
                          </div>
                        </div>
                      ))
                    }
                  </div>

                  {/* Summary */}
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <div className="card">
                      <h4 style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Today's Summary</h4>
                      {[["Present",present,"#059669","#DCFCE7"],["Absent",absent,"#EF4444","#FEE2E2"],["Unmarked",unmarked,"#D97706","#FEF3C7"]].map(([l,v,c,bg])=>(
                        <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", background:bg, borderRadius:9, marginBottom:7 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:c }}>{l}</span>
                          <span style={{ fontSize:20, fontWeight:800, color:c, fontFamily:"'Playfair Display',serif" }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {!submitted ? (
                      <button className="btn bg" style={{ width:"100%", justifyContent:"center", padding:"12px", fontSize:14 }} onClick={handleSubmit}>
                        Submit Attendance
                      </button>
                    ) : (
                      <div style={{ background:"#DCFCE7", borderRadius:12, padding:"16px", textAlign:"center", border:"1.5px solid #A7F3D0" }}>
                        <div style={{ fontSize:22, marginBottom:4 }}>✅</div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#059669" }}>Submitted!</div>
                        <div style={{ fontSize:12, color:"#64748B" }}>Saved to database</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── QUIZZES (Placeholder) ── */}
          {tab==="quizzes" && (
            <div className="fade card">
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Quiz Management — Phase 4</h3>
              <p style={{ color:"#64748B", fontSize:13 }}>Create and manage quizzes for your classes. Coming in Phase 4.</p>
            </div>
          )}

          {/* ── RESULTS (Placeholder) ── */}
          {tab==="results" && (
            <div className="fade card">
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Quiz Results — Phase 4</h3>
              <p style={{ color:"#64748B", fontSize:13 }}>View student quiz results after Phase 4 is complete.</p>
            </div>
          )}

        </div>
      </div>

      {toast && <div className={`toast ${toast.type==="success"?"ts":"te"}`}>{toast.msg}</div>}
    </div>
  );
}
