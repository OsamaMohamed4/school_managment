import { useState, useEffect } from "react";
import { timetableAPI } from "../api";

const DAYS     = ["mon","tue","wed","thu","fri","sat"];
const DAY_NAMES= {mon:"Monday",tue:"Tuesday",wed:"Wednesday",thu:"Thursday",fri:"Friday",sat:"Saturday"};
const PERIODS  = [1,2,3,4,5,6,7,8];
const COLORS   = ["#EFF6FF","#F0FDF4","#FFF7ED","#F5F3FF","#FEF3C7","#FEF2F2","#F0F9FF","#FAF5FF"];

export default function TimetablePanel({ classId=null, readOnly=false, accentColor="#2563EB" }) {
  const [timetable, setTimetable] = useState({});
  const [className, setClassName] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [showAdd,   setShowAdd]   = useState(false);
  const [newSlot,   setNewSlot]   = useState({day:"mon",period:1,subject:"",teacher_name:"",start_time:"08:00",end_time:"09:00"});
  const [adding,    setAdding]    = useState(false);
  const [toast,     setToast]     = useState(null);

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const load = async () => {
    setLoading(true);
    try {
      const d = classId ? await timetableAPI.get(classId) : await timetableAPI.my();
      setTimetable(d.timetable||{});
      setClassName(d.class_room||"");
    } catch { showToast("Failed to load timetable","error"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[classId]);

  const handleAdd = async () => {
    if (!newSlot.subject.trim()){ showToast("Enter subject","error"); return; }
    setAdding(true);
    try {
      await timetableAPI.addSlot(classId, newSlot);
      showToast("Slot added!"); setShowAdd(false); load();
    } catch(e){ showToast(e?.non_field_errors?.[0]||"Failed — slot may already exist","error"); }
    finally { setAdding(false); }
  };

  const handleDelete = async (slotId) => {
    try { await timetableAPI.deleteSlot(slotId); showToast("Deleted!"); load(); }
    catch { showToast("Failed","error"); }
  };

  const activeDays = DAYS.filter(d=>timetable[d]?.length>0);

  return (
    <div>
      <style>{`
        .tt-cell{padding:8px 10px;border-radius:9px;font-size:12px;position:relative;}
        .tt-del{position:absolute;top:4px;right:4px;background:#EF4444;color:#fff;border:none;border-radius:4px;font-size:10px;padding:2px 5px;cursor:pointer;opacity:0;transition:opacity .2s;}
        .tt-cell:hover .tt-del{opacity:1;}
        .tt-inp{width:100%;padding:8px 11px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;outline:none;background:#fff;color:#0F172A;}
        .tt-inp:focus{border-color:${accentColor};}
        .tt-sel{width:100%;padding:8px 11px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;background:#fff;color:#0F172A;outline:none;}
      `}</style>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>{className ? `Class ${className} — Timetable` : "My Timetable"}</h3>
          {loading&&<span style={{fontSize:12,color:"#94A3B8"}}>Loading...</span>}
        </div>
        {!readOnly&&classId&&(
          <button onClick={()=>setShowAdd(true)}
            style={{padding:"7px 14px",background:accentColor,color:"#fff",border:"none",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            + Add Slot
          </button>
        )}
      </div>

      {activeDays.length===0&&!loading&&(
        <div style={{textAlign:"center",padding:40,color:"#94A3B8",background:"#fff",borderRadius:14,border:"1.5px solid #E2E8F0"}}>
          <div style={{fontSize:32,marginBottom:8}}>📅</div>
          <p>{readOnly?"No timetable set for your class yet.":"No slots added yet. Click '+ Add Slot' to start."}</p>
        </div>
      )}

      {activeDays.map(day=>(
        <div key={day} style={{marginBottom:14,background:"#fff",borderRadius:14,border:"1.5px solid #E2E8F0",overflow:"hidden"}}>
          <div style={{padding:"10px 16px",background:"#F8FAFC",borderBottom:"1.5px solid #E2E8F0",fontWeight:700,fontSize:13,color:"#0F172A"}}>
            {DAY_NAMES[day]}
          </div>
          <div style={{display:"flex",gap:8,padding:"12px 14px",flexWrap:"wrap"}}>
            {(timetable[day]||[]).map((slot,i)=>(
              <div key={slot.id} className="tt-cell" style={{background:COLORS[i%COLORS.length],border:`1.5px solid ${accentColor}22`,minWidth:120}}>
                <div style={{fontSize:10,fontWeight:700,color:"#94A3B8",marginBottom:3}}>P{slot.period} · {slot.start_time}–{slot.end_time}</div>
                <div style={{fontWeight:700,fontSize:13,color:"#0F172A"}}>{slot.subject}</div>
                {slot.teacher_name&&<div style={{fontSize:11,color:"#64748B",marginTop:2}}>{slot.teacher_name}</div>}
                {!readOnly&&<button className="tt-del" onClick={()=>handleDelete(slot.id)}>✕</button>}
              </div>
            ))}
          </div>
        </div>
      ))}

      {showAdd&&(
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:"#fff",borderRadius:18,padding:28,width:400,maxWidth:"93vw",color:"#0F172A"}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:20,marginBottom:18}}>Add Timetable Slot</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Day</label>
                <select className="tt-sel" value={newSlot.day} onChange={e=>setNewSlot(s=>({...s,day:e.target.value}))}>
                  {DAYS.map(d=><option key={d} value={d}>{DAY_NAMES[d]}</option>)}
                </select>
              </div>
              <div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Period</label>
                <select className="tt-sel" value={newSlot.period} onChange={e=>setNewSlot(s=>({...s,period:parseInt(e.target.value)}))}>
                  {PERIODS.map(p=><option key={p} value={p}>Period {p}</option>)}
                </select>
              </div>
              <div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Start Time</label>
                <input className="tt-inp" type="time" value={newSlot.start_time} onChange={e=>setNewSlot(s=>({...s,start_time:e.target.value}))}/>
              </div>
              <div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>End Time</label>
                <input className="tt-inp" type="time" value={newSlot.end_time} onChange={e=>setNewSlot(s=>({...s,end_time:e.target.value}))}/>
              </div>
            </div>
            <div style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Subject *</label>
              <input className="tt-inp" placeholder="e.g. Mathematics" value={newSlot.subject} onChange={e=>setNewSlot(s=>({...s,subject:e.target.value}))}/>
            </div>
            <div style={{marginBottom:18}}><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Teacher Name</label>
              <input className="tt-inp" placeholder="Optional" value={newSlot.teacher_name} onChange={e=>setNewSlot(s=>({...s,teacher_name:e.target.value}))}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button disabled={adding} onClick={handleAdd} style={{flex:1,padding:"11px",background:accentColor,color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                {adding?"Adding...":"Add Slot"}
              </button>
              <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:"11px",background:"#F1F5F9",color:"#475569",border:"none",borderRadius:10,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div style={{position:"fixed",bottom:22,right:22,padding:"12px 18px",borderRadius:11,fontSize:13,fontWeight:600,zIndex:300,background:toast.type==="success"?accentColor:"#EF4444",color:"#fff"}}>{toast.msg}</div>}
    </div>
  );
}
