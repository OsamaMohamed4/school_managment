import { useState, useEffect } from "react";
import { timetableAPI } from "../api";

const DAYS      = ["sun","mon","tue","wed","thu","fri","sat"];
const DAY_NAMES = {
  sun:"Sunday / الأحد", mon:"Monday / الاثنين", tue:"Tuesday / الثلاثاء",
  wed:"Wednesday / الأربعاء", thu:"Thursday / الخميس",
  fri:"Friday / الجمعة", sat:"Saturday / السبت"
};
const PERIODS = [1,2,3,4,5,6,7,8];
const COLORS  = ["#EFF6FF","#F0FDF4","#FFF7ED","#F5F3FF","#FEF3C7","#FEF2F2","#F0F9FF","#FAF5FF"];
const SUBJECTS = [
  "Math","English","Arabic","Science","Social Studies","Islamic",
  "Computer","Art","P.E","Karate","Music","High-Level","Other"
];

export default function AdminTimetableManager({ classId, className, accentColor="#2563EB" }) {
  const [timetable, setTimetable] = useState({});
  const [teachers,  setTeachers]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [showAdd,   setShowAdd]   = useState(false);
  const [adding,    setAdding]    = useState(false);
  const [toast,     setToast]     = useState(null);
  const [newSlot,   setNewSlot]   = useState({
    day:"sun", period:1, subject:"", teacher_name:"", start_time:"07:30", end_time:"08:15"
  });

  const showToast = (msg,type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const d = await timetableAPI.get(classId);
      setTimetable(d.timetable || {});
    } catch { showToast("Failed to load","error"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (classId) {
      load();
      // Load only teachers assigned to THIS class
      timetableAPI.classTeachers(classId)
        .then(d => setTeachers(Array.isArray(d.teachers) ? d.teachers : []))
        .catch(()=>{});
    }
  }, [classId]);

  // Check if period already taken on selected day
  const isPeriodTaken = (day, period) => {
    return (timetable[day]||[]).some(s => s.period === parseInt(period));
  };

  const handleAdd = async () => {
    if (!newSlot.subject)      { showToast("Select a subject","error"); return; }
    if (!newSlot.teacher_name) { showToast("Select a teacher","error"); return; }
    if (isPeriodTaken(newSlot.day, newSlot.period)) {
      showToast(`Period ${newSlot.period} on ${DAY_NAMES[newSlot.day].split("/")[0].trim()} is already taken — delete it first`, "error");
      return;
    }
    setAdding(true);
    try {
      await timetableAPI.addSlot(classId, newSlot);
      showToast("Slot added! ✓");
      setShowAdd(false);
      setNewSlot({day:"sun",period:1,subject:"",teacher_name:"",start_time:"07:30",end_time:"08:15"});
      load();
    } catch(e) {
      showToast(e?.non_field_errors?.[0] || "This slot already exists. Choose a different period.", "error");
    }
    finally { setAdding(false); }
  };

  const handleDelete = async (slotId) => {
    if (!window.confirm("Delete this slot?")) return;
    try {
      await timetableAPI.deleteSlot(slotId);
      showToast("Deleted!");
      load();
    } catch { showToast("Failed to delete","error"); }
  };

  const activeDays  = DAYS.filter(d => timetable[d]?.length > 0);
  const totalSlots  = activeDays.reduce((a,d) => a + (timetable[d]?.length||0), 0);
  const takenPeriod = isPeriodTaken(newSlot.day, newSlot.period);

  return (
    <div>
      <style>{`
        .tt-inp{width:100%;padding:8px 11px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;outline:none;background:#fff;color:#0F172A;}
        .tt-inp:focus{border-color:${accentColor};}
        .tt-sel{width:100%;padding:8px 11px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;background:#fff;color:#0F172A;outline:none;}
        .tt-sel.taken{border-color:#EF4444;background:#FEF2F2;}
      `}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <h4 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>Class {className} — Timetable</h4>
          <div style={{fontSize:12,color:"#64748B",marginTop:2}}>
            {totalSlots} slots · {activeDays.length} days
          </div>
        </div>
        <button onClick={()=>setShowAdd(true)}
          style={{padding:"8px 16px",background:accentColor,color:"#fff",border:"none",
            borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
          + Add Slot
        </button>
      </div>

      {/* Timetable grid */}
      {loading ? (
        <div style={{padding:32,textAlign:"center",color:"#94A3B8"}}>Loading...</div>
      ) : activeDays.length === 0 ? (
        <div style={{textAlign:"center",padding:40,color:"#94A3B8",background:"#fff",
          borderRadius:14,border:"1.5px solid #E2E8F0"}}>
          <div style={{fontSize:36,marginBottom:8}}>📅</div>
          <p>No timetable yet. Click "+ Add Slot" to start.</p>
        </div>
      ) : activeDays.map(day=>(
        <div key={day} style={{marginBottom:12,background:"#fff",borderRadius:12,
          border:"1.5px solid #E2E8F0",overflow:"hidden"}}>
          <div style={{padding:"9px 14px",background:"#F8FAFC",
            borderBottom:"1.5px solid #E2E8F0",fontWeight:700,fontSize:13,color:"#0F172A"}}>
            {DAY_NAMES[day]}
          </div>
          <div style={{display:"flex",gap:8,padding:"10px 12px",flexWrap:"wrap"}}>
            {(timetable[day]||[]).map((slot,i)=>(
              <div key={slot.id} style={{
                background:COLORS[i%COLORS.length],
                border:`1.5px solid ${accentColor}22`,
                borderRadius:9,padding:"8px 12px",minWidth:130,position:"relative"
              }}>
                <div style={{fontSize:10,fontWeight:700,color:"#94A3B8",marginBottom:3}}>
                  P{slot.period} · {slot.start_time}–{slot.end_time}
                </div>
                <div style={{fontWeight:700,fontSize:13,color:"#0F172A"}}>{slot.subject}</div>
                {slot.teacher_name && (
                  <div style={{fontSize:11,color:"#64748B",marginTop:2}}>👤 {slot.teacher_name}</div>
                )}
                <button onClick={()=>handleDelete(slot.id)} style={{
                  position:"absolute",top:4,right:4,background:"#EF4444",color:"#fff",
                  border:"none",borderRadius:4,fontSize:10,padding:"2px 5px",
                  cursor:"pointer",opacity:0.75
                }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add Slot Modal */}
      {showAdd && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",display:"flex",
          alignItems:"center",justifyContent:"center",zIndex:100,backdropFilter:"blur(4px)"}}>
          <div style={{background:"#fff",borderRadius:18,padding:28,width:460,maxWidth:"94vw"}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,
              marginBottom:4,color:"#0F172A"}}>
              Add Slot — Class {className}
            </h3>
            <p style={{fontSize:12,color:"#64748B",marginBottom:18}}>All fields required</p>

            {/* Day + Period */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Day *</label>
                <select className="tt-sel" value={newSlot.day}
                  onChange={e=>setNewSlot(s=>({...s,day:e.target.value}))}>
                  {DAYS.map(d=><option key={d} value={d}>{DAY_NAMES[d]}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Period *</label>
                <select className={`tt-sel${takenPeriod?" taken":""}`} value={newSlot.period}
                  onChange={e=>setNewSlot(s=>({...s,period:parseInt(e.target.value)}))}>
                  {PERIODS.map(p=>(
                    <option key={p} value={p}>
                      Period {p} {isPeriodTaken(newSlot.day, p) ? "⛔ taken" : ""}
                    </option>
                  ))}
                </select>
                {takenPeriod && (
                  <div style={{fontSize:11,color:"#EF4444",marginTop:3}}>
                    ⛔ This period is taken — choose another
                  </div>
                )}
              </div>
            </div>

            {/* Start + End time */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Start Time *</label>
                <input className="tt-inp" type="time" value={newSlot.start_time}
                  onChange={e=>setNewSlot(s=>({...s,start_time:e.target.value}))}/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>End Time *</label>
                <input className="tt-inp" type="time" value={newSlot.end_time}
                  onChange={e=>setNewSlot(s=>({...s,end_time:e.target.value}))}/>
              </div>
            </div>

            {/* Subject */}
            <div style={{marginBottom:10}}>
              <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Subject *</label>
              <select className="tt-sel" value={newSlot.subject}
                onChange={e=>setNewSlot(s=>({...s,subject:e.target.value}))}>
                <option value="">— Select Subject —</option>
                {SUBJECTS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Teacher — dropdown from real teachers list */}
            <div style={{marginBottom:20}}>
              <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Teacher *</label>
              <select className="tt-sel" value={newSlot.teacher_name}
                onChange={e=>setNewSlot(s=>({...s,teacher_name:e.target.value}))}>
                <option value="">— Select Teacher —</option>
                {teachers.length === 0 ? (
                  <option disabled value="">⚠️ No teachers assigned to this class</option>
                ) : teachers.map(t=>(
                  <option key={t.id} value={t.full_name}>{t.full_name} ({t.subject})</option>
                ))}
              </select>
              {teachers.length === 0 ? (
                <div style={{fontSize:11,color:"#EF4444",marginTop:4}}>
                  ⚠️ No teachers assigned. Go to Grades &amp; Classes → assign subject teachers first.
                </div>
              ) : !newSlot.teacher_name ? (
                <div style={{fontSize:11,color:"#94A3B8",marginTop:3}}>Choose the teacher for this slot</div>
              ) : null}
            </div>

            {/* Buttons */}
            <div style={{display:"flex",gap:8}}>
              <button disabled={adding || takenPeriod} onClick={handleAdd} style={{
                flex:1,padding:"11px",
                background: takenPeriod ? "#94A3B8" : accentColor,
                color:"#fff",border:"none",borderRadius:10,fontWeight:700,
                fontSize:14,cursor: takenPeriod ? "not-allowed" : "pointer",
                fontFamily:"inherit"
              }}>
                {adding ? "Adding..." : "Add Slot"}
              </button>
              <button onClick={()=>setShowAdd(false)} style={{
                flex:1,padding:"11px",background:"#F1F5F9",color:"#475569",
                border:"none",borderRadius:10,fontWeight:600,fontSize:14,
                cursor:"pointer",fontFamily:"inherit"
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{position:"fixed",bottom:22,right:22,padding:"12px 20px",borderRadius:11,
          fontSize:13,fontWeight:600,zIndex:300,maxWidth:340,
          background:toast.type==="success"?accentColor:"#EF4444",color:"#fff",
          boxShadow:"0 4px 20px rgba(0,0,0,0.2)"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
