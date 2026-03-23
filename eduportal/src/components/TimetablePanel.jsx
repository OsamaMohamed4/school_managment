import { useState, useEffect } from "react";
import { timetableAPI } from "../api";

const DAYS      = ["sun","mon","tue","wed","thu","fri","sat"];
const DAY_NAMES = {sun:"Sunday",mon:"Monday",tue:"Tuesday",wed:"Wednesday",thu:"Thursday",fri:"Friday",sat:"Saturday"};
const COLORS    = ["#EFF6FF","#F0FDF4","#FFF7ED","#F5F3FF","#FEF3C7","#FEF2F2","#F0F9FF","#FAF5FF"];

export default function TimetablePanel({ classId=null, readOnly=true, accentColor="#2563EB", isTeacher=false }) {
  const [classes,   setClasses]   = useState([]); // for teacher: multiple classes
  const [timetable, setTimetable] = useState({});
  const [className, setClassName] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [toast,     setToast]     = useState(null);

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const load = async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        // Teacher sees all their classes timetables
        const d = await timetableAPI.myTeacher();
        setClasses(d.classes||[]);
      } else if (classId) {
        const d = await timetableAPI.get(classId);
        setTimetable(d.timetable||{});
        setClassName(d.class_room||"");
      } else {
        // Student: my class
        const d = await timetableAPI.my();
        setTimetable(d.timetable||{});
        setClassName(d.class_room||"");
      }
    } catch { showToast("Failed to load timetable","error"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); },[classId]);

  const renderTimetable = (tt, title) => {
    const activeDays = DAYS.filter(d=>tt[d]?.length>0);
    return (
      <div style={{marginBottom:20}}>
        {title && <h4 style={{fontSize:13,fontWeight:700,color:accentColor,marginBottom:10}}>📚 {title}</h4>}
        {activeDays.length===0 ? (
          <div style={{textAlign:"center",padding:32,color:"#94A3B8",background:"#F8FAFC",borderRadius:12,border:"1.5px solid #E2E8F0"}}>
            <div style={{fontSize:28,marginBottom:6}}>📅</div>
            <p style={{fontSize:13}}>No timetable set yet.</p>
          </div>
        ) : activeDays.map(day=>(
          <div key={day} style={{marginBottom:10,background:"#fff",borderRadius:12,border:"1.5px solid #E2E8F0",overflow:"hidden"}}>
            <div style={{padding:"9px 14px",background:"#F8FAFC",borderBottom:"1.5px solid #E2E8F0",fontWeight:700,fontSize:13,color:"#0F172A"}}>
              {DAY_NAMES[day]}
            </div>
            <div style={{display:"flex",gap:8,padding:"10px 12px",flexWrap:"wrap"}}>
              {(tt[day]||[]).map((slot,i)=>(
                <div key={slot.id} style={{
                  background:COLORS[i%COLORS.length],
                  border:`1.5px solid ${accentColor}22`,
                  borderRadius:9,padding:"8px 12px",minWidth:110,
                }}>
                  <div style={{fontSize:10,fontWeight:700,color:"#94A3B8",marginBottom:3}}>
                    P{slot.period} · {slot.start_time}–{slot.end_time}
                  </div>
                  <div style={{fontWeight:700,fontSize:13,color:"#0F172A"}}>{slot.subject}</div>
                  {slot.teacher_name&&(
                    <div style={{fontSize:11,color:"#64748B",marginTop:2}}>👤 {slot.teacher_name}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div style={{padding:32,textAlign:"center",color:"#94A3B8"}}>Loading timetable...</div>;

  return (
    <div>
      {/* Teacher: multiple class timetables */}
      {isTeacher && (
        <>
          <div style={{marginBottom:16}}>
            <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>📅 My Classes Timetable</h3>
            <p style={{fontSize:12,color:"#64748B",marginTop:3}}>View-only — timetable is managed by Admin</p>
          </div>
          {classes.length===0 ? (
            <div style={{textAlign:"center",padding:40,color:"#94A3B8",background:"#fff",borderRadius:14,border:"1.5px solid #E2E8F0"}}>
              <div style={{fontSize:32,marginBottom:8}}>📅</div>
              <p>No timetable set for your classes yet.</p>
            </div>
          ) : classes.map(cls=>(
            <div key={cls.class_id}>
              {renderTimetable(cls.timetable, `Grade ${cls.grade} — Class ${cls.class_name}`)}
            </div>
          ))}
        </>
      )}

      {/* Student/Parent: single class timetable */}
      {!isTeacher && !classId && (
        <>
          <div style={{marginBottom:16}}>
            <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>
              📅 {className ? `Class ${className} — Timetable` : "My Timetable"}
            </h3>
            <p style={{fontSize:12,color:"#64748B",marginTop:3}}>View-only</p>
          </div>
          {renderTimetable(timetable, null)}
        </>
      )}

      {/* Admin: single class (passed classId) — can add/delete */}
      {!isTeacher && classId && renderTimetable(timetable, className ? `Class ${className}` : null)}

      {toast&&(
        <div style={{position:"fixed",bottom:22,right:22,padding:"12px 18px",borderRadius:11,
          fontSize:13,fontWeight:600,zIndex:300,
          background:toast.type==="success"?accentColor:"#EF4444",color:"#fff"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
