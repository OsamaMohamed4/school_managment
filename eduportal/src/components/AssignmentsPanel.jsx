import { useState, useEffect } from "react";
import { assignmentsAPI, academicsAPI } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AssignmentsPanel({ accentColor="#059669", accentBg="#ECFDF5" }) {
  const { user }             = useAuth();
  const isTeacher             = user?.role === "teacher";
  const [assignments, setAssignments] = useState([]);
  const [selAsgn,     setSelAsgn]     = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [view,        setView]        = useState("list"); // list | detail | new | grade
  const [classes,     setClasses]     = useState([]);
  const [submitText,  setSubmitText]  = useState("");
  const [submitFile,  setSubmitFile]  = useState(null);
  const [grading,     setGrading]     = useState({score:"",feedback:""});
  const [gradingSub,  setGradingSub]  = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [newAsgn,     setNewAsgn]     = useState({title:"",description:"",class_room:"",due_date:"",max_score:100});
  const [toast,       setToast]       = useState(null);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};

  const downloadFile = async (url, filename) => {
    try {
      const token = localStorage.getItem("access_token");
      const res   = await fetch(url, { headers: token ? { Authorization: "Bearer "+token } : {} });
      const blob  = await res.blob();
      const a     = document.createElement("a");
      a.href      = URL.createObjectURL(blob);
      a.download  = filename || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch { showToast("Download failed","error"); }
  };


  const load = async()=>{
    setLoading(true);
    try { setAssignments(await assignmentsAPI.list()); } catch {}
    finally { setLoading(false); }
  };

  useEffect(()=>{
    load();
    if (isTeacher) academicsAPI.classes.myClasses().then(d=>setClasses(Array.isArray(d)?d:(d.results||[]))).catch(()=>{});
  },[]);

  const openDetail = async(a)=>{
    setSelAsgn(a); setView("detail");
    if (isTeacher) {
      const d = await assignmentsAPI.submissions(a.id);
      setSubmissions(d.submissions||[]);
    }
  };

  const handleCreate = async()=>{
    if (!newAsgn.title.trim()||!newAsgn.class_room||!newAsgn.due_date){showToast("Fill all required fields","error");return;}
    try {
      await assignmentsAPI.create({...newAsgn,class_room:parseInt(newAsgn.class_room)});
      showToast("Assignment created!"); setView("list"); load();
    } catch(e){ showToast(e?.title?.[0]||"Failed","error"); }
  };

  const handleSubmit = async()=>{
    if (!submitText.trim() && !submitFile){showToast("Write an answer or upload a file","error");return;}
    if (submitFile && submitFile.size > 50*1024*1024){showToast("File too large — max 50MB","error");return;}
    try {
      await assignmentsAPI.submit(selAsgn.id, submitText, submitFile);
      showToast("Submitted! ✓");
      setSubmitText(""); setSubmitFile(null); load(); setView("list");
    } catch(e){ showToast(e?.error||"Failed","error"); }
  };

  const handleGrade = async(subId)=>{
    if (!grading.score){showToast("Enter score","error");return;}
    try {
      await assignmentsAPI.grade(subId, parseInt(grading.score), grading.feedback);
      showToast("Graded!");
      const d = await assignmentsAPI.submissions(selAsgn.id);
      setSubmissions(d.submissions||[]); setGradingSub(null);
    } catch { showToast("Failed","error"); }
  };

  const scoreColor=(p)=>p>=80?"#059669":p>=60?"#D97706":"#EF4444";
  const now = new Date();

  return (
    <div>
      <style>{`
        .asgn-card{background:#fff;border-radius:13px;padding:16px 18px;border:1.5px solid #E2E8F0;margin-bottom:10px;cursor:pointer;transition:all .18s;}
        .asgn-card:hover{border-color:${accentColor};box-shadow:0 2px 12px ${accentColor}18;}
        .asgn-inp{width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;outline:none;background:#F8FAFC;color:#0F172A;}
        .asgn-inp:focus{border-color:${accentColor};}
        .asgn-btn{padding:8px 16px;border-radius:9px;border:none;font-weight:600;font-size:13px;cursor:pointer;font-family:inherit;transition:all .18s;}
      `}</style>

      {view==="list"&&(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>Assignments ({assignments.length})</h3>
            {isTeacher&&<button className="asgn-btn" style={{background:accentColor,color:"#fff"}} onClick={()=>setView("new")}>+ New Assignment</button>}
          </div>
          {loading?<div style={{padding:32,textAlign:"center",color:"#94A3B8"}}>Loading...</div>
          :assignments.length===0?<div style={{textAlign:"center",padding:40,background:"#fff",borderRadius:14,border:"1.5px solid #E2E8F0",color:"#94A3B8"}}><div style={{fontSize:32,marginBottom:8}}>📝</div><p>No assignments yet.</p></div>
          :assignments.map(a=>{
            const isPast = new Date(a.due_date) < now;
            const sub    = a.my_submission;
            return (
              <div key={a.id} className="asgn-card" onClick={()=>openDetail(a)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:"#0F172A",marginBottom:3}}>{a.title}</div>
                    <div style={{fontSize:12,color:"#64748B"}}>{a.class_room_name} · Max: {a.max_score} pts</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0,marginLeft:10}}>
                    {isPast&&<span style={{background:"#FEF2F2",color:"#EF4444",padding:"2px 8px",borderRadius:999,fontSize:11,fontWeight:700}}>Past Due</span>}
                    {sub&&<span style={{background:sub.status==="graded"?"#ECFDF5":"#FEF3C7",color:sub.status==="graded"?"#059669":"#D97706",padding:"2px 8px",borderRadius:999,fontSize:11,fontWeight:700}}>{sub.status==="graded"?`Graded: ${sub.score}/${a.max_score}`:"Submitted"}</span>}
                    {!sub&&!isTeacher&&<span style={{background:accentBg,color:accentColor,padding:"2px 8px",borderRadius:999,fontSize:11,fontWeight:700}}>Pending</span>}
                    {isTeacher&&<span style={{background:"#F1F5F9",color:"#64748B",padding:"2px 8px",borderRadius:999,fontSize:11,fontWeight:700}}>{a.submission_count} submitted</span>}
                  </div>
                </div>
                <div style={{fontSize:12,color:"#94A3B8"}}>Due: {new Date(a.due_date).toLocaleString()}</div>
              </div>
            );
          })}
        </>
      )}

      {view==="new"&&isTeacher&&(
        <div style={{background:"#fff",borderRadius:14,padding:24,border:"1.5px solid #E2E8F0",maxWidth:560}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
            <button className="asgn-btn" style={{background:"#F1F5F9",color:"#475569"}} onClick={()=>setView("list")}>← Back</button>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,color:"#0F172A"}}>New Assignment</h3>
          </div>
          <div style={{marginBottom:11}}><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Title *</label><input className="asgn-inp" value={newAsgn.title} onChange={e=>setNewAsgn(a=>({...a,title:e.target.value}))}/></div>
          <div style={{marginBottom:11}}><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Description</label><textarea className="asgn-inp" rows={3} value={newAsgn.description} onChange={e=>setNewAsgn(a=>({...a,description:e.target.value}))} style={{resize:"vertical"}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:11}}>
            <div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Class *</label>
              <select className="asgn-inp" value={newAsgn.class_room} onChange={e=>setNewAsgn(a=>({...a,class_room:e.target.value}))}>
                <option value="">— Select Class —</option>
                {classes.map(c=><option key={c.id} value={c.id}>Class {c.name}</option>)}
              </select>
            </div>
            <div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Max Score</label><input className="asgn-inp" type="number" value={newAsgn.max_score} onChange={e=>setNewAsgn(a=>({...a,max_score:parseInt(e.target.value)||100}))}/></div>
          </div>
          <div style={{marginBottom:18}}><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>Due Date *</label><input className="asgn-inp" type="datetime-local" value={newAsgn.due_date} onChange={e=>setNewAsgn(a=>({...a,due_date:e.target.value}))}/></div>
          <div style={{display:"flex",gap:8}}>
            <button className="asgn-btn" style={{background:accentColor,color:"#fff",flex:1,padding:"11px"}} onClick={handleCreate}>Create Assignment</button>
            <button className="asgn-btn" style={{background:"#F1F5F9",color:"#475569",flex:1,padding:"11px"}} onClick={()=>setView("list")}>Cancel</button>
          </div>
        </div>
      )}

      {view==="detail"&&selAsgn&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <button className="asgn-btn" style={{background:"#F1F5F9",color:"#475569"}} onClick={()=>setView("list")}>← Back</button>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,color:"#0F172A"}}>{selAsgn.title}</h3>
          </div>
          <div style={{background:"#fff",borderRadius:14,padding:20,border:"1.5px solid #E2E8F0",marginBottom:14}}>
            <p style={{fontSize:13,color:"#374151",marginBottom:10}}>{selAsgn.description||"No description."}</p>
            <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:12,color:"#64748B"}}>
              <span>📅 Due: {new Date(selAsgn.due_date).toLocaleString()}</span>
              <span>🏆 Max: {selAsgn.max_score} pts</span>
              <span>👥 Class: {selAsgn.class_room_name}</span>
            </div>
          </div>

          {/* Student: submit */}
          {!isTeacher&&!selAsgn.my_submission&&(
            <div style={{background:"#fff",borderRadius:14,padding:20,border:"1.5px solid #E2E8F0",marginBottom:14}}>
              <h4 style={{fontSize:13,fontWeight:700,marginBottom:10}}>Your Submission</h4>
              <textarea className="asgn-inp" rows={4} placeholder="Write your answer here... (optional if uploading a file)"
                value={submitText} onChange={e=>setSubmitText(e.target.value)} style={{resize:"vertical",marginBottom:10}}/>
              {/* File Upload */}
              <div style={{marginBottom:12}}>
                <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>
                  📎 Attach File <span style={{color:"#94A3B8",fontWeight:400}}>(PDF, Word, image — max 50MB)</span>
                </label>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                  onChange={e=>setSubmitFile(e.target.files[0]||null)}
                  style={{display:"none"}} id="sub-file-input"/>
                <label htmlFor="sub-file-input" style={{
                  display:"inline-flex",alignItems:"center",gap:7,padding:"8px 14px",
                  borderRadius:8,border:`1.5px dashed ${accentColor}`,background:accentBg,
                  color:accentColor,fontWeight:600,fontSize:12,cursor:"pointer"
                }}>
                  {submitFile ? `✓ ${submitFile.name}` : "Choose File"}
                </label>
                {submitFile&&(
                  <button onClick={()=>setSubmitFile(null)}
                    style={{marginLeft:8,background:"none",border:"none",color:"#EF4444",cursor:"pointer",fontSize:12,fontWeight:600}}>
                    ✕ Remove
                  </button>
                )}
                {submitFile&&(
                  <div style={{fontSize:11,color:"#64748B",marginTop:4}}>
                    Size: {(submitFile.size/1024/1024).toFixed(1)}MB
                    {submitFile.size > 50*1024*1024 && <span style={{color:"#EF4444",fontWeight:700}}> — TOO LARGE!</span>}
                  </div>
                )}
              </div>
              <button className="asgn-btn" style={{background:accentColor,color:"#fff",padding:"10px 20px"}} onClick={handleSubmit}>
                Submit Assignment
              </button>
            </div>
          )}
          {!isTeacher&&selAsgn.my_submission&&(
            <div style={{background:"#ECFDF5",border:"1.5px solid #A7F3D0",borderRadius:12,padding:16,marginBottom:14}}>
              <div style={{fontWeight:700,color:"#059669",marginBottom:6}}>✓ Already Submitted</div>
              {selAsgn.my_submission.text&&<p style={{fontSize:13,color:"#374151",marginBottom:6}}>{selAsgn.my_submission.text}</p>}
              {selAsgn.my_submission.file_url&&(
                <button onClick={()=>downloadFile(selAsgn.my_submission.file_url, selAsgn.my_submission.file_name)} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:accentColor,fontWeight:600,marginBottom:8,background:accentBg,padding:"5px 10px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"inherit"}}>⬇️ {selAsgn.my_submission.file_name||"Download File"}</button>
              )}
              {selAsgn.my_submission.score!=null&&<div style={{fontSize:13,fontWeight:700,color:scoreColor(selAsgn.my_submission.score/selAsgn.max_score*100)}}>Score: {selAsgn.my_submission.score}/{selAsgn.max_score}</div>}
              {selAsgn.my_submission.feedback&&<div style={{fontSize:12,color:"#64748B",marginTop:4}}>💬 {selAsgn.my_submission.feedback}</div>}
            </div>
          )}

          {/* Teacher: see submissions */}
          {isTeacher&&(
            <div style={{background:"#fff",borderRadius:14,padding:20,border:"1.5px solid #E2E8F0"}}>
              <h4 style={{fontSize:13,fontWeight:700,marginBottom:14}}>Submissions ({submissions.length})</h4>
              {submissions.length===0?<p style={{color:"#94A3B8",fontSize:13}}>No submissions yet.</p>
              :submissions.map(s=>(
                <div key={s.id} style={{padding:"12px 14px",borderRadius:10,border:"1.5px solid #E2E8F0",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:"#0F172A"}}>{s.student_name}</div>
                      <div style={{fontSize:11,color:"#94A3B8"}}>{new Date(s.submitted_at).toLocaleString()} · <span style={{color:s.status==="late"?"#EF4444":s.status==="graded"?"#059669":"#D97706",fontWeight:600}}>{s.status}</span></div>
                    </div>
                    {s.score!=null&&<span style={{fontWeight:700,color:scoreColor(s.score/selAsgn.max_score*100)}}>{s.score}/{selAsgn.max_score}</span>}
                  </div>
                  {s.text&&<p style={{fontSize:12,color:"#374151",marginBottom:6,background:"#F8FAFC",padding:"8px 10px",borderRadius:7}}>{s.text}</p>}
                  {s.file_url&&(
                    <a href={s.file_url} target="_blank" rel="noreferrer"
                      style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:accentColor,fontWeight:600,marginBottom:8,textDecoration:"none",background:accentBg,padding:"5px 10px",borderRadius:7}}>
                      📎 Download: {s.file_name||"Attachment"}
                    </a>
                  )}
                  {gradingSub===s.id?(
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <input className="asgn-inp" type="number" placeholder="Score" style={{width:80}} value={grading.score} onChange={e=>setGrading(g=>({...g,score:e.target.value}))}/>
                      <input className="asgn-inp" placeholder="Feedback (optional)" style={{flex:1}} value={grading.feedback} onChange={e=>setGrading(g=>({...g,feedback:e.target.value}))}/>
                      <button className="asgn-btn" style={{background:accentColor,color:"#fff"}} onClick={()=>handleGrade(s.id)}>Save</button>
                      <button className="asgn-btn" style={{background:"#F1F5F9",color:"#475569"}} onClick={()=>setGradingSub(null)}>✕</button>
                    </div>
                  ):(
                    <button className="asgn-btn" style={{background:accentBg,color:accentColor,fontSize:12,padding:"5px 12px"}} onClick={()=>{setGradingSub(s.id);setGrading({score:s.score||"",feedback:s.feedback||""});}}>
                      {s.status==="graded"?"Edit Grade":"Grade"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {toast&&<div style={{position:"fixed",bottom:22,right:22,padding:"12px 18px",borderRadius:11,fontSize:13,fontWeight:600,zIndex:300,background:toast.type==="success"?accentColor:"#EF4444",color:"#fff"}}>{toast.msg}</div>}
    </div>
  );
}
