import { useState, useEffect } from "react";
import { lessonPlanAPI } from "../api";
import { useAuth } from "../context/AuthContext";

const DAYS = [
  { key:"sun", label:"Sunday / الأحد" },
  { key:"mon", label:"Monday / الاثنين" },
  { key:"tue", label:"Tuesday / الثلاثاء" },
  { key:"wed", label:"Wednesday / الأربعاء" },
  { key:"thu", label:"Thursday / الخميس" },
  { key:"fri", label:"Friday / الجمعة" },
  { key:"sat", label:"Saturday / السبت" },
];

const SUBJECTS = [
  "ENGLISH","ARABIC","MATH","SCIENCE","SOCIAL STUDIES",
  "ISLAMIC","COMPUTER","ART","P.E","KARATE",
  "HIGH-LEVEL","MUSIC","OTHER"
];

export default function LessonPlanPanel({ accentColor="#059669", accentBg="#ECFDF5", readOnly=false }) {
  const { user }        = useAuth();
  const isAdvisor        = !readOnly && user?.role === "teacher";

  const [plans,         setPlans]         = useState([]);
  const [selPlan,       setSelPlan]       = useState(null);
  const [advisingClasses, setAdvisingClasses] = useState([]);
  const [view,          setView]          = useState("list"); // list | detail | new | add-entry
  const [loading,       setLoading]       = useState(false);
  const [toast,         setToast]         = useState(null);

  // New plan form
  const [newPlan, setNewPlan] = useState({ class_room:"", week_start:"", week_end:"", notes:"" });

  // Add entry form
  const [newEntry, setNewEntry] = useState({ day:"sun", subject:"ENGLISH", classwork:"", homework:"" });

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};

  const load = async () => {
    setLoading(true);
    try {
      const d = await lessonPlanAPI.list();
      setPlans(d.plans || []);
    } catch { showToast("Failed to load plans","error"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{
    load();
    if (isAdvisor) {
      lessonPlanAPI.isAdvisor().then(d => setAdvisingClasses(d.advising_classes||[])).catch(()=>{});
    }
  },[]);

  const openPlan = async (p) => {
    setLoading(true);
    try {
      const d = await lessonPlanAPI.get(p.id);
      setSelPlan(d);
      setView("detail");
    } catch { showToast("Failed to load plan","error"); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!newPlan.class_room||!newPlan.week_start||!newPlan.week_end) {
      showToast("Fill all required fields","error"); return;
    }
    try {
      const d = await lessonPlanAPI.create({
        ...newPlan, class_room: parseInt(newPlan.class_room)
      });
      showToast("Weekly plan created!");
      setSelPlan(d); setView("detail"); load();
    } catch(e){ showToast(e?.error||"Failed to create plan","error"); }
  };

  const handleAddEntry = async () => {
    if (!newEntry.subject) { showToast("Select a subject","error"); return; }
    if (!newEntry.classwork && !newEntry.homework) { showToast("Enter classwork or homework","error"); return; }
    try {
      const d = await lessonPlanAPI.addEntry(selPlan.id, newEntry);
      setSelPlan(d);
      setNewEntry({ day:"sun", subject:"ENGLISH", classwork:"", homework:"" });
      showToast("Entry added!");
    } catch(e){ showToast(e?.error||"Failed","error"); }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      const d = await lessonPlanAPI.deleteEntry(selPlan.id, entryId);
      setSelPlan(d);
      showToast("Entry removed!");
    } catch { showToast("Failed","error"); }
  };

  const handleDeletePlan = async () => {
    if (!window.confirm("Delete this entire weekly plan?")) return;
    try {
      await lessonPlanAPI.delete(selPlan.id);
      showToast("Plan deleted!");
      setView("list"); setSelPlan(null); load();
    } catch { showToast("Failed","error"); }
  };

  // Group entries by day
  const groupByDay = (entries=[]) => {
    const map = {};
    entries.forEach(e => {
      if (!map[e.day]) map[e.day] = [];
      map[e.day].push(e);
    });
    return map;
  };

  return (
    <div>
      <style>{`
        .lp-card{background:#fff;border-radius:13px;padding:16px 18px;border:1.5px solid #E2E8F0;margin-bottom:10px;cursor:pointer;transition:all .18s;}
        .lp-card:hover{border-color:${accentColor};box-shadow:0 2px 12px ${accentColor}22;}
        .lp-inp{width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;outline:none;background:#F8FAFC;color:#0F172A;}
        .lp-inp:focus{border-color:${accentColor};background:#fff;}
        .lp-btn{padding:8px 16px;border-radius:9px;border:none;font-weight:600;font-size:13px;cursor:pointer;font-family:inherit;transition:all .18s;}
        .day-header{background:${accentBg};color:${accentColor};font-weight:700;font-size:13px;padding:8px 14px;border-radius:8px;margin:12px 0 6px;}
        .entry-row{display:grid;grid-template-columns:1fr 1.5fr 1.5fr auto;gap:8px;align-items:center;padding:8px 12px;border-radius:8px;border:1px solid #F1F5F9;background:#FAFAFA;margin-bottom:5px;font-size:13px;}
        .entry-row:hover{background:${accentBg}44;}
        .del-btn{background:none;border:none;color:#EF4444;cursor:pointer;font-size:14px;padding:2px 6px;border-radius:4px;}
        .del-btn:hover{background:#FEF2F2;}
      `}</style>

      {/* LIST VIEW */}
      {view==="list" && (
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>
              📋 Weekly Plans ({plans.length})
            </h3>
            {isAdvisor && advisingClasses.length > 0 && (
              <button className="lp-btn" style={{background:accentColor,color:"#fff"}} onClick={()=>setView("new")}>
                + New Plan
              </button>
            )}
          </div>

          {isAdvisor && advisingClasses.length === 0 && (
            <div style={{background:"#FEF3C7",border:"1.5px solid #FDE68A",borderRadius:12,padding:16,marginBottom:14,fontSize:13,color:"#92400E"}}>
              ⚠️ You are not assigned as advisor (رائد الفصل) to any class yet. Ask admin to assign you.
            </div>
          )}

          {loading ? <div style={{padding:32,textAlign:"center",color:"#94A3B8"}}>Loading...</div>
          : plans.length === 0 ? (
            <div style={{textAlign:"center",padding:48,background:"#fff",borderRadius:14,border:"1.5px solid #E2E8F0",color:"#94A3B8"}}>
              <div style={{fontSize:36,marginBottom:8}}>📋</div>
              <p>No weekly plans yet.</p>
              {isAdvisor && <p style={{fontSize:12,marginTop:4}}>Create your first plan!</p>}
            </div>
          ) : plans.map(p => (
            <div key={p.id} className="lp-card" onClick={()=>openPlan(p)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:"#0F172A",marginBottom:3}}>
                    Grade {p.grade_name} — Class {p.class_name}
                  </div>
                  <div style={{fontSize:12,color:"#64748B"}}>
                    📅 {p.week_start} → {p.week_end} · {p.entry_count} entries
                  </div>
                  <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>
                    By: {p.advisor_name}
                  </div>
                </div>
                <span style={{background:accentBg,color:accentColor,padding:"3px 10px",borderRadius:999,fontSize:11,fontWeight:700}}>
                  Week {p.week_start}
                </span>
              </div>
            </div>
          ))}
        </>
      )}

      {/* NEW PLAN FORM */}
      {view==="new" && isAdvisor && (
        <div style={{background:"#fff",borderRadius:14,padding:24,border:"1.5px solid #E2E8F0",maxWidth:520}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <button className="lp-btn" style={{background:"#F1F5F9",color:"#475569"}} onClick={()=>setView("list")}>← Back</button>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,color:"#0F172A"}}>New Weekly Plan</h3>
          </div>

          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Class *</label>
            <select className="lp-inp" value={newPlan.class_room} onChange={e=>setNewPlan(p=>({...p,class_room:e.target.value}))}>
              <option value="">— Select Your Class —</option>
              {advisingClasses.map(c=><option key={c.id} value={c.id}>Grade {c.grade} — Class {c.name}</option>)}
            </select>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Week Start *</label>
              <input className="lp-inp" type="date" value={newPlan.week_start} onChange={e=>setNewPlan(p=>({...p,week_start:e.target.value}))}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Week End *</label>
              <input className="lp-inp" type="date" value={newPlan.week_end} onChange={e=>setNewPlan(p=>({...p,week_end:e.target.value}))}/>
            </div>
          </div>

          <div style={{marginBottom:18}}>
            <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Notes (optional)</label>
            <textarea className="lp-inp" rows={2} placeholder="e.g. Exam week, field trip..." value={newPlan.notes} onChange={e=>setNewPlan(p=>({...p,notes:e.target.value}))} style={{resize:"vertical"}}/>
          </div>

          <div style={{display:"flex",gap:8}}>
            <button className="lp-btn" style={{background:accentColor,color:"#fff",flex:1,padding:"11px"}} onClick={handleCreate}>Create Plan</button>
            <button className="lp-btn" style={{background:"#F1F5F9",color:"#475569",flex:1,padding:"11px"}} onClick={()=>setView("list")}>Cancel</button>
          </div>
        </div>
      )}

      {/* PLAN DETAIL VIEW */}
      {view==="detail" && selPlan && (
        <div>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            <button className="lp-btn" style={{background:"#F1F5F9",color:"#475569"}} onClick={()=>setView("list")}>← Back</button>
            <div style={{flex:1}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:17,color:"#0F172A"}}>
                Grade {selPlan.grade_name} — Class {selPlan.class_name}
              </h3>
              <div style={{fontSize:12,color:"#64748B"}}>
                📅 {selPlan.week_start} → {selPlan.week_end} · By: {selPlan.advisor_name}
              </div>
            </div>
            {isAdvisor && selPlan.advisor === (JSON.parse(localStorage.getItem("user")||"{}"))?.id && (
              <button className="lp-btn" style={{background:"#FEF2F2",color:"#EF4444",fontSize:12}} onClick={handleDeletePlan}>
                🗑 Delete Plan
              </button>
            )}
          </div>

          {selPlan.notes && (
            <div style={{background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#92400E"}}>
              📝 {selPlan.notes}
            </div>
          )}

          {/* Plan table grouped by day */}
          {DAYS.filter(d => groupByDay(selPlan.entries)[d.key]).map(d => {
            const dayEntries = groupByDay(selPlan.entries)[d.key] || [];
            return (
              <div key={d.key} style={{marginBottom:12}}>
                <div className="day-header">{d.label}</div>
                {/* Header row */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr 1.5fr auto",gap:8,padding:"5px 12px",fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.4}}>
                  <span>Subject</span><span>Classwork</span><span>Homework</span><span></span>
                </div>
                {dayEntries.map(e => (
                  <div key={e.id} className="entry-row">
                    <span style={{fontWeight:700,color:"#0F172A"}}>{e.subject}</span>
                    <span style={{color:"#374151",direction:"rtl",textAlign:"right"}}>{e.classwork||"—"}</span>
                    <span style={{color:"#374151",direction:"rtl",textAlign:"right"}}>{e.homework||"—"}</span>
                    {isAdvisor && (
                      <button className="del-btn" onClick={()=>handleDeleteEntry(e.id)} title="Delete">✕</button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {selPlan.entries?.length === 0 && (
            <div style={{textAlign:"center",padding:32,color:"#94A3B8",background:"#F8FAFC",borderRadius:12}}>
              No entries yet. {isAdvisor ? "Add subjects below." : ""}
            </div>
          )}

          {/* Add entry form — only for advisor */}
          {isAdvisor && (
            <div style={{background:"#fff",borderRadius:12,padding:18,border:`1.5px dashed ${accentColor}`,marginTop:16}}>
              <h4 style={{fontSize:13,fontWeight:700,marginBottom:14,color:accentColor}}>+ Add Entry</h4>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Day</label>
                  <select className="lp-inp" value={newEntry.day} onChange={e=>setNewEntry(n=>({...n,day:e.target.value}))}>
                    {DAYS.map(d=><option key={d.key} value={d.key}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Subject</label>
                  <select className="lp-inp" value={newEntry.subject} onChange={e=>setNewEntry(n=>({...n,subject:e.target.value}))}>
                    {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Classwork</label>
                  <textarea className="lp-inp" rows={2} placeholder="e.g. Lesson 2 Dic p.117" value={newEntry.classwork} onChange={e=>setNewEntry(n=>({...n,classwork:e.target.value}))} style={{resize:"none"}}/>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Homework</label>
                  <textarea className="lp-inp" rows={2} placeholder="e.g. Page 141" value={newEntry.homework} onChange={e=>setNewEntry(n=>({...n,homework:e.target.value}))} style={{resize:"none"}}/>
                </div>
              </div>
              <button className="lp-btn" style={{background:accentColor,color:"#fff",padding:"9px 20px"}} onClick={handleAddEntry}>
                + Add Entry
              </button>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div style={{position:"fixed",bottom:22,right:22,padding:"12px 18px",borderRadius:11,fontSize:13,fontWeight:600,zIndex:300,
          background:toast.type==="success"?accentColor:"#EF4444",color:"#fff",boxShadow:"0 4px 20px rgba(0,0,0,0.2)"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
