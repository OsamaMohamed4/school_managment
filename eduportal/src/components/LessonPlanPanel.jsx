import { useState, useEffect } from "react";
import { lessonPlanAPI, academicsAPI } from "../api";
import { useAuth } from "../context/AuthContext";

const DAYS = [
  { key:"sun", label:"Sunday " },
  { key:"mon", label:"Monday " },
  { key:"tue", label:"Tuesday " },
  { key:"wed", label:"Wednesday " },
  { key:"thu", label:"Thursday " },
  { key:"fri", label:"Friday " },
  { key:"sat", label:"Saturday" },
];

const SUBJECTS = [
  "ENGLISH","ARABIC","MATH","SCIENCE","SOCIAL STUDIES",
  "ISLAMIC","COMPUTER","ART","P.E","KARATE","HIGH-LEVEL","MUSIC","OTHER"
];

// Get Monday of current week as default week_start
function getThisWeekSunday() {
  const d = new Date();
  const day = d.getDay(); // 0=sun
  d.setDate(d.getDate() - day);
  return d.toISOString().split("T")[0];
}

export default function LessonPlanPanel({ accentColor="#059669", accentBg="#ECFDF5", readOnly=false }) {
  const { user } = useAuth();
  const isTeacher = !readOnly && user?.role === "teacher";

  const [weekStart, setWeekStart] = useState(getThisWeekSunday());
  const [classes,   setClasses]   = useState([]);
  const [selClass,  setSelClass]  = useState(null);
  const [entries,   setEntries]   = useState([]); // flat list
  const [loading,   setLoading]   = useState(false);
  const [toast,     setToast]     = useState(null);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({
    day: "sun", subject: "ENGLISH", classwork: "", homework: ""
  });
  const [saving, setSaving] = useState(false);

  // Edit
  const [editId,    setEditId]    = useState(null);
  const [editData,  setEditData]  = useState({});

  const showToast = (msg, type="success") => {
    setToast({msg,type}); setTimeout(()=>setToast(null), 3500);
  };

  // Load teacher's classes
  useEffect(() => {
    if (isTeacher) {
      academicsAPI.classes.myClasses()
        .then(d => {
          const list = Array.isArray(d) ? d : (d.results||[]);
          setClasses(list);
          if (list.length > 0 && !selClass) setSelClass(list[0]);
        })
        .catch(()=>{});
    }
  }, [isTeacher]);

  // Load entries
  const load = async () => {
    setLoading(true);
    try {
      const params = { week: weekStart };
      if (selClass) params.class_id = selClass.id;
      const d = await lessonPlanAPI.list(params);
      setEntries(d.flat || []);
    } catch { showToast("Failed to load","error"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isTeacher || selClass) load();
  }, [weekStart, selClass, isTeacher]);

  // Group by day
  const grouped = {};
  DAYS.forEach(d => {
    const dayEntries = entries.filter(e => e.day === d.key);
    if (dayEntries.length > 0) grouped[d.key] = dayEntries;
  });

  const handleAdd = async () => {
    if (!newEntry.classwork && !newEntry.homework) {
      showToast("Enter classwork or homework","error"); return;
    }
    if (!selClass) { showToast("Select a class","error"); return; }
    setSaving(true);
    try {
      await lessonPlanAPI.create({
        class_room: selClass.id,
        week_start: weekStart,
        day:        newEntry.day,
        subject:    newEntry.subject,
        classwork:  newEntry.classwork,
        homework:   newEntry.homework,
      });
      showToast("Entry added!");
      setNewEntry({ day:"sun", subject:"ENGLISH", classwork:"", homework:"" });
      setShowAdd(false);
      load();
    } catch(e) { showToast(e?.error||"Failed","error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await lessonPlanAPI.delete(id);
      showToast("Deleted!");
      load();
    } catch { showToast("Failed","error"); }
  };

  const handleEdit = async (id) => {
    try {
      await lessonPlanAPI.update(id, editData);
      showToast("Updated!");
      setEditId(null);
      load();
    } catch { showToast("Failed","error"); }
  };

  // Week navigation
  const changeWeek = (dir) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d.toISOString().split("T")[0]);
  };

  // Week end = weekStart + 4 days (Thu)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 4);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  return (
    <div>
      <style>{`
        .lp-inp{width:100%;padding:8px 11px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;outline:none;background:#F8FAFC;color:#0F172A;}
        .lp-inp:focus{border-color:${accentColor};background:#fff;}
        .lp-btn{padding:7px 14px;border-radius:8px;border:none;font-weight:600;font-size:13px;cursor:pointer;font-family:inherit;transition:all .18s;}
        
        .entry-row {
          display: grid;
          grid-template-columns: 120px 1fr 1fr ${isTeacher ? "80px" : ""};
          gap: 12px;
          align-items: start;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          background: #fff;
          margin-bottom: 8px;
          font-size: 13px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .entry-row:hover { border-color: ${accentColor}66; }
        
        .day-hdr {
          background: ${accentBg};
          color: ${accentColor};
          font-weight: 700;
          font-size: 13px;
          padding: 8px 14px;
          border-radius: 8px;
          margin: 16px 0 8px;
          text-transform: uppercase;
          letter-spacing: .5px;
        }

        .tbl-hdr {
          display: grid;
          grid-template-columns: 120px 1fr 1fr ${isTeacher ? "80px" : ""};
          gap: 12px;
          padding: 0 12px;
          font-size: 11px;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: .5px;
          margin-bottom: 8px;
        }

        .entry-actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        @media (max-width: 768px) {
          .tbl-hdr { display: none; }
          .entry-row {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px;
          }
          .entry-actions {
            flex-direction: row;
            border-top: 1px solid #E2E8F0;
            padding-top: 12px;
            margin-top: 4px;
            justify-content: flex-end;
          }
          .cell-label {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            color: #94A3B8;
            margin-bottom: 4px;
            font-weight: 700;
            letter-spacing: .5px;
          }
        }
        @media (min-width: 769px) {
          .cell-label { display: none; }
        }
      `}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>📋 Weekly Lesson Plan</h3>
        {isTeacher && (
          <button className="lp-btn" style={{background:accentColor,color:"#fff"}}
            onClick={()=>setShowAdd(true)}>
            + Add Entry
          </button>
        )}
      </div>

      {/* Week navigator */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <button className="lp-btn" style={{background:"#F1F5F9",color:"#475569",padding:"6px 12px"}}
          onClick={()=>changeWeek(-1)}>← Prev</button>
        <div style={{flex:1,textAlign:"center",fontSize:13,fontWeight:600,color:"#0F172A"}}>
          📅 {weekStart} → {weekEndStr}
        </div>
        <button className="lp-btn" style={{background:"#F1F5F9",color:"#475569",padding:"6px 12px"}}
          onClick={()=>changeWeek(1)}>Next →</button>
      </div>

      {/* Class selector — teacher only */}
      {isTeacher && classes.length > 1 && (
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          {classes.map(c=>(
            <button key={c.id} onClick={()=>setSelClass(c)}
              style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,
                cursor:"pointer",fontFamily:"inherit",border:"1.5px solid #E2E8F0",
                background:selClass?.id===c.id?accentColor:"#F8FAFC",
                color:selClass?.id===c.id?"#fff":"#475569"}}>
              Grade {c.grade_name} — Class {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Table header */}
      {Object.keys(grouped).length > 0 && (
        <div className="tbl-hdr">
          <span>Subject</span><span>Classwork</span><span>Homework</span>{isTeacher&&<span></span>}
        </div>
      )}

      {/* Entries grouped by day */}
      {loading ? (
        <div style={{padding:32,textAlign:"center",color:"#94A3B8"}}>Loading...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{textAlign:"center",padding:48,background:"#fff",borderRadius:14,border:"1.5px solid #E2E8F0",color:"#94A3B8"}}>
          <div style={{fontSize:36,marginBottom:8}}>📋</div>
          <p>No lesson plan for this week.</p>
          {isTeacher && <p style={{fontSize:12,marginTop:4}}>Click "+ Add Entry" to start.</p>}
        </div>
      ) : (
        DAYS.filter(d => grouped[d.key]).map(d => (
          <div key={d.key}>
            <div className="day-hdr">{d.label}</div>
            {grouped[d.key].map(e => (
              <div key={e.id} className="entry-row">
                {editId === e.id ? (
                  <>
                    <div>
                      <span className="cell-label">Subject</span>
                      <span style={{fontWeight:700,display:"block",paddingTop:8}}>{e.subject}</span>
                    </div>
                    <div>
                      <span className="cell-label">Classwork</span>
                      <textarea className="lp-inp" dir="auto" rows={2} value={editData.classwork||""} onChange={ev=>setEditData(x=>({...x,classwork:ev.target.value}))} style={{resize:"none"}}/>
                    </div>
                    <div>
                      <span className="cell-label">Homework</span>
                      <textarea className="lp-inp" dir="auto" rows={2} value={editData.homework||""} onChange={ev=>setEditData(x=>({...x,homework:ev.target.value}))} style={{resize:"none"}}/>
                    </div>
                    {isTeacher && (
                      <div className="entry-actions">
                        <button className="lp-btn" style={{background:accentColor,color:"#fff",padding:"6px 10px",fontSize:11,flex:1}} onClick={()=>handleEdit(e.id)}>Save</button>
                        <button className="lp-btn" style={{background:"#F1F5F9",color:"#64748B",padding:"6px 10px",fontSize:11,flex:1}} onClick={()=>setEditId(null)}>Cancel</button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <span className="cell-label">Subject</span>
                      <span style={{fontWeight:700,color:"#0F172A",display:"block"}}>{e.subject}</span>
                    </div>
                    <div>
                      <span className="cell-label">Classwork</span>
                      <div dir="auto" style={{color:"#374151",lineHeight:1.6}}>{e.classwork||"—"}</div>
                    </div>
                    <div>
                      <span className="cell-label">Homework</span>
                      <div dir="auto" style={{color:"#374151",lineHeight:1.6}}>{e.homework||"—"}</div>
                    </div>
                    {isTeacher && (
                      <div className="entry-actions">
                        <button onClick={()=>{setEditId(e.id);setEditData({classwork:e.classwork,homework:e.homework});}}
                          style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:6,padding:"6px 10px",color:accentColor,cursor:"pointer",fontSize:12,fontWeight:600}}>✏️ Edit</button>
                        <button onClick={()=>handleDelete(e.id)}
                          style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:6,padding:"6px 10px",color:"#EF4444",cursor:"pointer",fontSize:12}}>🗑 Delete</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ))
      )}

      {/* Add Entry Modal */}
      {showAdd && isTeacher && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(3px)"}}>
          <div style={{background:"#fff",borderRadius:18,padding:28,width:460,maxWidth:"94vw"}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,marginBottom:18,color:"#0F172A"}}>
              Add Lesson Plan Entry
            </h3>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
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

            <div style={{marginBottom:10}}>
              <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Classwork</label>
              <textarea className="lp-inp" dir="auto" rows={2} 
                value={newEntry.classwork} onChange={e=>setNewEntry(n=>({...n,classwork:e.target.value}))} style={{resize:"none"}}/>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Homework</label>
              <textarea className="lp-inp" dir="auto" rows={2}
                value={newEntry.homework} onChange={e=>setNewEntry(n=>({...n,homework:e.target.value}))} style={{resize:"none"}}/>
            </div>

            <div style={{display:"flex",gap:8}}>
              <button className="lp-btn" disabled={saving} onClick={handleAdd}
                style={{flex:1,padding:"11px",background:accentColor,color:"#fff"}}>
                {saving ? "Saving..." : "Add Entry"}
              </button>
              <button className="lp-btn" onClick={()=>setShowAdd(false)}
                style={{flex:1,padding:"11px",background:"#F1F5F9",color:"#475569"}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{position:"fixed",bottom:22,right:22,padding:"12px 18px",borderRadius:11,fontSize:13,fontWeight:600,zIndex:300,
          background:toast.type==="success"?accentColor:"#EF4444",color:"#fff",boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
