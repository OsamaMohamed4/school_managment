import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { quizzesAPI, attendanceAPI, notificationsAPI } from "../api";
import AssignmentsPanel from "../components/AssignmentsPanel";
import TimetablePanel   from "../components/TimetablePanel";
import MessagesPanel    from "../components/MessagesPanel";

export default function StudentDashboard() {
  const { user, logout }           = useAuth();
  const navigate                    = useNavigate();
  const [tab, setTab]               = useState("overview");

  const [quizzes,    setQuizzes]    = useState([]);
  const [myResults,  setMyResults]  = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizData,   setQuizData]   = useState(null);
  const [answers,    setAnswers]    = useState({});
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);

  const [attendance, setAttendance] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  useEffect(()=>{
    quizzesAPI.available().then(d=>setQuizzes(Array.isArray(d)?d:(d.results||[]))).catch(()=>{});
    quizzesAPI.myResults().then(d=>setMyResults(Array.isArray(d)?d:(d.results||[]))).catch(()=>{});
    attendanceAPI.myHistory().then(setAttendance).catch(()=>{});
    notificationsAPI.list().then(d=>{ setNotifications(d.notifications||[]); setUnread(d.unread||0); }).catch(()=>{});
  },[]);

  const startQuiz = async (q) => {
    setLoading(true);
    try { const data=await quizzesAPI.take(q.id); setQuizData(data); setActiveQuiz(q); setAnswers({}); setResult(null); setTab("quiz"); }
    catch(e){ showToast(e?.error||"Cannot start quiz","error"); }
    finally { setLoading(false); }
  };

  const submitQuiz = async () => {
    const answersList = Object.entries(answers).map(([qid,ans])=>{
      const q=quizData.questions.find(q=>q.id===parseInt(qid));
      if (!q) return null;
      return q.question_type==="short_answer"
        ?{question_id:parseInt(qid),short_answer_text:ans}
        :{question_id:parseInt(qid),choice_id:parseInt(ans)};
    }).filter(Boolean);
    try { const res=await quizzesAPI.submit(activeQuiz.id,answersList); setResult(res); setQuizzes(qs=>qs.filter(q=>q.id!==activeQuiz.id)); quizzesAPI.myResults().then(d=>setMyResults(Array.isArray(d)?d:(d.results||[]))).catch(()=>{}); }
    catch(e){ showToast(e?.error||"Submit failed","error"); }
  };

  const markAllRead = async () => {
    try { await notificationsAPI.markAllRead(); setNotifications(n=>n.map(x=>({...x,is_read:true}))); setUnread(0); } catch {}
  };

  const markOneRead = async (id) => {
    try { await notificationsAPI.markRead(id); setNotifications(n=>n.map(x=>x.id===id?{...x,is_read:true}:x)); setUnread(u=>Math.max(0,u-1)); } catch {}
  };

  const scoreColor=(p)=>p>=80?"#059669":p>=60?"#D97706":"#EF4444";
  const rate=attendance?.attendance_rate||0;
  const avg=myResults.length?Math.round(myResults.reduce((a,r)=>a+(r.percentage||0),0)/myResults.length):0;
  const answered=Object.keys(answers).length;
  const totalQs=quizData?.questions?.length||0;
  const remaining=totalQs-answered;

  const NAV=["overview","quizzes","attendance","grades","notifications","assignments","messages","timetable"];
  const notifColor=(t)=>t==="info"?"#2563EB":t==="warning"?"#D97706":"#059669";
  const notifBg=(t)=>t==="info"?"#EFF6FF":t==="warning"?"#FEF3C7":"#ECFDF5";

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",display:"flex",minHeight:"100vh"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        .nb{display:flex;align-items:center;padding:9px 14px;border-radius:9px;border:none;background:none;width:100%;font-size:13px;font-weight:500;color:#64748B;cursor:pointer;font-family:inherit;transition:all .18s;text-transform:capitalize;}
        .nb:hover{background:#FAF5FF;} .nb.a{background:#EDE9FE;color:#7C3AED;font-weight:700;}
        .card{background:#fff;border-radius:14px;padding:20px;border:1.5px solid #EDE9FE;}
        .btn{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .18s;}
        .bp{background:#7C3AED;color:#fff;} .bp:hover{background:#6D28D9;} .bp:disabled{background:#A78BFA;cursor:not-allowed;}
        .bgh{background:#F5F3FF;color:#7C3AED;border:1.5px solid #DDD6FE;}
        .opt{width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E2E8F0;background:#fff;text-align:left;cursor:pointer;font-size:13px;color:#374151;transition:all .2s;font-family:inherit;display:flex;align-items:center;gap:10px;margin-bottom:7px;}
        .opt:hover{border-color:#A78BFA;background:#FAF5FF;} .opt.sel{border-color:#7C3AED;background:#EDE9FE;color:#7C3AED;font-weight:600;}
        .short-inp{width:100%;padding:10px 14px;border:1.5px solid #E2E8F0;border-radius:9px;font-size:13px;font-family:inherit;outline:none;transition:border .2s;}
        .short-inp:focus{border-color:#7C3AED;}
        .toast{position:fixed;bottom:22px;right:22px;padding:12px 18px;border-radius:11px;font-size:13px;font-weight:600;z-index:200;}
        .ts{background:#7C3AED;color:#fff;} .te{background:#EF4444;color:#fff;}
        .pbar{height:7px;background:#EDE9FE;border-radius:4px;overflow:hidden;margin-top:7px;}
        .pfill{height:100%;border-radius:4px;transition:width .8s ease;}
        .badge{display:inline-flex;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;}
        .b-mcq{background:#EFF6FF;color:#2563EB;} .b-tf{background:#F0FDF4;color:#059669;} .b-sa{background:#FFF7ED;color:#D97706;}
        .fade{animation:fi .3s ease;} @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .unread-dot{width:18px;height:18px;background:#EF4444;border-radius:50%;font-size:10px;font-weight:800;color:#fff;display:flex;align-items:center;justify-content:center;margin-left:auto;}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{width:200,background:"#fff",borderRight:"1.5px solid #EDE9FE",display:"flex",flexDirection:"column",height:"100vh",position:"fixed",top:0,left:0}}>
        <div style={{padding:"16px 14px",borderBottom:"1.5px solid #FAF5FF",display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:32,height:32,background:"#7C3AED",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:15,color:"#0F172A"}}>EduPortal</span>
        </div>
        <div style={{margin:"10px 10px 4px",background:"#EDE9FE",borderRadius:9,padding:"9px 11px",border:"1px solid #DDD6FE"}}>
          <div style={{fontSize:10,color:"#7C3AED",fontWeight:700,textTransform:"uppercase"}}>Student</div>
          <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginTop:2}}>{user?.full_name||user?.first_name}</div>
        </div>
        <nav style={{flex:1,padding:"6px 8px",display:"flex",flexDirection:"column",gap:2}}>
          {NAV.map(n=>(
            <button key={n} className={`nb${tab===n?" a":""}`} onClick={()=>{setTab(n);setActiveQuiz(null);setResult(null);if(n==="notifications"&&unread>0)markAllRead();}}>
              {n}
              {n==="notifications"&&unread>0&&<span className="unread-dot">{unread}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"10px 8px",borderTop:"1.5px solid #FAF5FF"}}>
          <button className="nb" onClick={()=>navigate("/profile")} style={{marginBottom:4}}>👤 My Profile</button>
          <button className="nb" style={{color:"#EF4444"}} onClick={()=>{logout();navigate("/");}}>Logout</button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{marginLeft:200,flex:1,background:"#FAF5FF",minHeight:"100vh"}}>
        <header style={{background:"#fff",borderBottom:"1.5px solid #EDE9FE",padding:"0 26px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
          <h1 style={{fontSize:15,fontWeight:700,color:"#0F172A",textTransform:"capitalize"}}>{tab==="quiz"&&activeQuiz?activeQuiz.title:tab}</h1>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {unread>0&&tab!=="notifications"&&(
              <button onClick={()=>{setTab("notifications");markAllRead();}} style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:20,padding:"4px 10px",fontSize:12,fontWeight:700,color:"#EF4444",cursor:"pointer",fontFamily:"inherit"}}>
                🔔 {unread} new
              </button>
            )}
            <div style={{width:32,height:32,background:"#7C3AED",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:12}}>
              {(user?.first_name||"S").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div style={{padding:"24px"}}>

          {tab==="overview"&&(
            <div className="fade">
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
                {[["Attendance",`${rate}%`,"#7C3AED"],["Avg Score",`${avg}%`,"#059669"],["Quizzes Left",quizzes.filter(q=>!q.already_attempted).length,"#D97706"]].map(([l,v,c])=>(
                  <div key={l} className="card" style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',serif",color:c}}>{v}</div><div style={{fontSize:13,color:"#64748B",marginTop:3}}>{l}</div></div>
                ))}
              </div>
              {unread>0&&(
                <div style={{background:"#FEF3C7",border:"1.5px solid #FDE68A",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>🔔</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#D97706"}}>You have {unread} unread notification{unread>1?"s":""}</div>
                  </div>
                  <button className="btn" style={{background:"#D97706",color:"#fff",fontSize:12,padding:"5px 12px"}} onClick={()=>{setTab("notifications");markAllRead();}}>View →</button>
                </div>
              )}
              <div className="card">
                <h3 style={{fontSize:14,fontWeight:700,marginBottom:14}}>Available Quizzes</h3>
                {quizzes.filter(q=>!q.already_attempted).length===0?<p style={{color:"#94A3B8",fontSize:13}}>No quizzes available.</p>
                :quizzes.filter(q=>!q.already_attempted).slice(0,3).map(q=>(
                  <div key={q.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"#FAF5FF",borderRadius:11,border:"1.5px solid #EDE9FE",marginBottom:8}}>
                    <div><div style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>{q.title}</div><div style={{fontSize:12,color:"#64748B"}}>{q.question_count} questions</div></div>
                    <button className="btn bp" disabled={loading} onClick={()=>startQuiz(q)}>{loading?"...":"Start →"}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="quizzes"&&!activeQuiz&&(
            <div className="fade">
              {quizzes.map(q=>(
                <div key={q.id} className="card" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:44,height:44,borderRadius:11,background:q.already_attempted?"#ECFDF5":"#EDE9FE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{q.already_attempted?"✓":"📝"}</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>{q.title}</div>
                      <div style={{fontSize:12,color:"#64748B"}}>{q.question_count} questions · {q.class_room_name}</div>
                      {q.deadline&&<div style={{fontSize:11,color:"#D97706"}}>Due: {new Date(q.deadline).toLocaleDateString()}</div>}
                    </div>
                  </div>
                  {q.already_attempted?<span style={{background:"#ECFDF5",color:"#059669",padding:"4px 12px",borderRadius:999,fontSize:12,fontWeight:700}}>Completed ✓</span>
                  :<button className="btn bp" disabled={loading} onClick={()=>startQuiz(q)}>Start Quiz</button>}
                </div>
              ))}
              {quizzes.length===0&&<div className="card" style={{textAlign:"center",color:"#94A3B8",padding:32}}>No quizzes assigned.</div>}
            </div>
          )}

          {tab==="quiz"&&activeQuiz&&!result&&quizData&&(
            <div className="fade" style={{maxWidth:660,margin:"0 auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <p style={{fontSize:13,color:"#64748B"}}>{answered}/{totalQs} answered</p>
                <button className="btn bgh" style={{fontSize:12,padding:"5px 12px"}} onClick={()=>{setTab("quizzes");setActiveQuiz(null);}}>← Back</button>
              </div>
              <div style={{background:"#EDE9FE",borderRadius:4,height:5,marginBottom:24,overflow:"hidden"}}>
                <div style={{height:"100%",background:"#7C3AED",borderRadius:4,width:`${totalQs>0?(answered/totalQs)*100:0}%`,transition:"width .3s"}}/>
              </div>
              {quizData.questions?.map((q,i)=>(
                <div key={q.id} className="card" style={{marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <span style={{fontSize:12,fontWeight:700,color:"#94A3B8"}}>Q{i+1}</span>
                    <span className={`badge b-${q.question_type==="mcq"?"mcq":q.question_type==="true_false"?"tf":"sa"}`}>{q.question_type==="mcq"?"MCQ":q.question_type==="true_false"?"True/False":"Short Answer"}</span>
                    <span style={{fontSize:11,color:"#94A3B8",marginLeft:"auto"}}>{q.points} pt{q.points>1?"s":""}</span>
                  </div>
                  <p style={{fontSize:14,fontWeight:600,marginBottom:14,color:"#0F172A"}}>{q.text}</p>
                  {(q.question_type==="mcq"||q.question_type==="true_false")&&q.choices?.map((c,ci)=>(
                    <button key={c.id} className={`opt${answers[q.id]==c.id?" sel":""}`} onClick={()=>setAnswers(a=>({...a,[q.id]:c.id}))}>
                      <span style={{width:24,height:24,borderRadius:"50%",background:answers[q.id]==c.id?"#7C3AED":"#F1F5F9",color:answers[q.id]==c.id?"#fff":"#64748B",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,flexShrink:0}}>
                        {q.question_type==="true_false"?(c.text==="True"?"T":"F"):["A","B","C","D"][ci]}
                      </span>
                      {c.text}
                    </button>
                  ))}
                  {q.question_type==="short_answer"&&<input className="short-inp" placeholder="Type your answer..." value={answers[q.id]||""} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))}/>}
                </div>
              ))}
              <button className="btn bp" style={{width:"100%",justifyContent:"center",padding:"13px",fontSize:14}} disabled={remaining>0} onClick={submitQuiz}>
                {remaining>0?`Answer ${remaining} more question${remaining>1?"s":""}`:"Submit Quiz →"}
              </button>
            </div>
          )}

          {tab==="quiz"&&result&&(
            <div className="fade" style={{maxWidth:420,margin:"40px auto"}}>
              <div className="card" style={{textAlign:"center",padding:40}}>
                <div style={{width:100,height:100,borderRadius:"50%",background:scoreColor(result.percentage)+"18",border:`4px solid ${scoreColor(result.percentage)}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",margin:"0 auto 22px"}}>
                  <div style={{fontSize:28,fontWeight:800,color:scoreColor(result.percentage),fontFamily:"'Playfair Display',serif"}}>{result.percentage}%</div>
                </div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:800,marginBottom:8}}>{result.percentage>=80?"Excellent! 🎉":result.percentage>=60?"Good Job 👍":"Keep Going 💪"}</h2>
                <p style={{fontSize:13,color:"#64748B",marginBottom:24}}>{result.score}/{result.total_points} points</p>
                <button className="btn bp" style={{width:"100%",justifyContent:"center",padding:"12px"}} onClick={()=>{setTab("grades");setActiveQuiz(null);setResult(null);}}>View My Results →</button>
              </div>
            </div>
          )}

          {tab==="attendance"&&(
            <div className="fade">
              {!attendance?<div className="card"><p style={{color:"#94A3B8"}}>Loading...</p></div>:(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
                    {[["Rate",`${attendance.attendance_rate}%`,"#7C3AED"],["Present",attendance.present_days,"#059669"],["Absent",attendance.absent_days,"#EF4444"]].map(([l,v,c])=>(
                      <div key={l} className="card" style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',serif",color:c}}>{v}</div><div style={{fontSize:13,color:"#64748B",marginTop:3}}>{l}</div></div>
                    ))}
                  </div>
                  <div className="card">
                    <h3 style={{fontSize:14,fontWeight:700,marginBottom:14}}>History</h3>
                    {attendance.records?.length===0?<p style={{color:"#94A3B8",fontSize:13}}>No records yet.</p>
                    :attendance.records?.map(r=>(
                      <div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 12px",background:r.status==="present"?"#F0FDF4":"#FEF2F2",borderRadius:9,border:`1.5px solid ${r.status==="present"?"#A7F3D0":"#FECACA"}`,marginBottom:7}}>
                        <span style={{fontSize:13,color:"#374151"}}>{r.date}</span>
                        <span style={{fontSize:12,fontWeight:700,color:r.status==="present"?"#059669":"#EF4444"}}>{r.status==="present"?"✓ Present":"✗ Absent"}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab==="grades"&&(
            <div className="fade">
              <div className="card">
                <h3 style={{fontSize:14,fontWeight:700,marginBottom:14}}>Quiz Results</h3>
                {myResults.length===0?<p style={{color:"#94A3B8",fontSize:13}}>No completed quizzes yet.</p>
                :myResults.map(r=>(
                  <div key={r.id} style={{marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                      <div><div style={{fontSize:13,fontWeight:700,color:"#0F172A"}}>{r.quiz_title}</div><div style={{fontSize:11,color:"#94A3B8"}}>{new Date(r.submitted_at).toLocaleDateString()}</div></div>
                      <div style={{textAlign:"right"}}><span style={{fontSize:20,fontWeight:800,color:scoreColor(r.percentage),fontFamily:"'Playfair Display',serif"}}>{r.percentage}%</span><div style={{fontSize:11,color:"#94A3B8"}}>{r.score}/{r.total_points} pts</div></div>
                    </div>
                    <div className="pbar"><div className="pfill" style={{width:`${r.percentage}%`,background:scoreColor(r.percentage)}}/></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="notifications"&&(
            <div className="fade">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>Notifications ({notifications.length})</h3>
                {unread>0&&<button className="btn bgh" style={{fontSize:12}} onClick={markAllRead}>Mark all read</button>}
              </div>
              {notifications.length===0?<div className="card" style={{textAlign:"center",padding:40,color:"#94A3B8"}}><div style={{fontSize:32,marginBottom:8}}>🔔</div><p>No notifications yet.</p></div>
              :notifications.map(n=>(
                <div key={n.id} onClick={()=>!n.is_read&&markOneRead(n.id)}
                  style={{padding:"14px 16px",borderRadius:12,border:`1.5px solid ${n.is_read?"#E2E8F0":notifBg(n.notif_type)}`,background:n.is_read?"#fff":notifBg(n.notif_type),marginBottom:8,cursor:n.is_read?"default":"pointer",transition:"all .2s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {!n.is_read&&<div style={{width:8,height:8,borderRadius:"50%",background:notifColor(n.notif_type),flexShrink:0}}/>}
                      <span style={{fontWeight:700,fontSize:13,color:"#0F172A"}}>{n.title}</span>
                    </div>
                    <span style={{fontSize:11,color:"#94A3B8",flexShrink:0,marginLeft:8}}>{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{fontSize:13,color:"#374151",marginBottom:6,marginLeft:n.is_read?0:16}}>{n.message}</p>
                  <div style={{marginLeft:n.is_read?0:16,display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:11,background:notifBg(n.notif_type),color:notifColor(n.notif_type),padding:"2px 8px",borderRadius:999,fontWeight:700}}>{n.notif_type}</span>
                    <span style={{fontSize:11,color:"#94A3B8"}}>from {n.sender_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

          {tab==="assignments"&&<div className="fade"><AssignmentsPanel accentColor="#7C3AED" accentBg="#F5F3FF"/></div>}
          {tab==="messages"&&<div className="fade"><MessagesPanel accentColor="#7C3AED" accentBg="#F5F3FF"/></div>}
          {tab==="timetable"&&<div className="fade"><TimetablePanel readOnly={true} accentColor="#7C3AED"/></div>}

      {toast&&<div className={`toast ${toast.type==="success"?"ts":"te"}`}>{toast.msg}</div>}
    </div>
  );
}
