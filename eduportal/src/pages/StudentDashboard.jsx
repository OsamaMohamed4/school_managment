import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { quizzesAPI, attendanceAPI } from "../api";

export default function StudentDashboard() {
  const { user, logout }          = useAuth();
  const navigate                   = useNavigate();
  const [tab, setTab]              = useState("overview");
  const [quizzes, setQuizzes]      = useState([]);
  const [myResults, setMyResults]  = useState([]);
  const [attendance, setAttendance]= useState(null);
  const [activeQuiz, setActiveQuiz]= useState(null);
  const [answers, setAnswers]      = useState({});
  const [quizData, setQuizData]    = useState(null);
  const [result, setResult]        = useState(null);
  const [loading, setLoading]      = useState(false);
  const [toast, setToast]          = useState(null);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3200); };

  useEffect(()=>{
    quizzesAPI.available().then(setQuizzes).catch(()=>{});
    quizzesAPI.myResults().then(setMyResults).catch(()=>{});
    attendanceAPI.myHistory().then(setAttendance).catch(()=>{});
  },[]);

  const startQuiz = async (q) => {
    setLoading(true);
    try {
      const data = await quizzesAPI.take(q.id);
      setQuizData(data);
      setActiveQuiz(q);
      setAnswers({});
      setResult(null);
      setTab("quiz");
    } catch(e) { showToast(e?.error||"Cannot start quiz","error"); }
    finally { setLoading(false); }
  };

  const submitQuiz = async () => {
    const answersList = Object.entries(answers).map(([qid, cid])=>({ question_id:parseInt(qid), choice_id:parseInt(cid) }));
    try {
      const res = await quizzesAPI.submit(activeQuiz.id, answersList);
      setResult(res);
      setQuizzes(qs => qs.filter(q=>q.id!==activeQuiz.id));
      quizzesAPI.myResults().then(setMyResults).catch(()=>{});
    } catch(e) { showToast(e?.error||"Submit failed","error"); }
  };

  const attendanceRate = attendance?.attendance_rate || 0;
  const completedCount = myResults.length;
  const avgScore = myResults.length ? Math.round(myResults.reduce((a,r)=>a+(r.percentage||0),0)/myResults.length) : 0;
  const scoreColor = (s) => s>=80?"#059669":s>=60?"#D97706":"#EF4444";

  const NAV = ["overview","quizzes","attendance","grades"];

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif", display:"flex", minHeight:"100vh" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#DDD6FE;border-radius:3px}
        .nb{display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:9px;border:none;background:none;width:100%;font-size:13px;font-weight:500;color:#64748B;cursor:pointer;font-family:inherit;transition:all .18s;text-transform:capitalize;}
        .nb:hover{background:#FAF5FF;color:#0F172A;}
        .nb.a{background:#EDE9FE;color:#7C3AED;font-weight:700;}
        .card{background:#fff;border-radius:14px;padding:20px;border:1.5px solid #EDE9FE;}
        .btn{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .18s;}
        .bp{background:#7C3AED;color:#fff;}.bp:hover{background:#6D28D9;}
        .bgh{background:#F5F3FF;color:#7C3AED;border:1.5px solid #DDD6FE;}
        .opt{width:100%;padding:11px 14px;border-radius:9px;border:1.5px solid #E2E8F0;background:#fff;text-align:left;cursor:pointer;font-size:13px;color:#374151;transition:all .2s;font-family:inherit;display:flex;align-items:center;gap:10px;margin-bottom:7px;}
        .opt:hover{border-color:#A78BFA;background:#FAF5FF;}
        .opt.sel{border-color:#7C3AED;background:#EDE9FE;color:#7C3AED;font-weight:600;}
        .toast{position:fixed;bottom:22px;right:22px;padding:12px 18px;border-radius:11px;font-size:13px;font-weight:600;z-index:200;animation:su .3s ease;}
        .ts{background:#7C3AED;color:#fff;}.te{background:#EF4444;color:#fff;}
        @keyframes su{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
        .fade{animation:fi .35s ease;}@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .pbar{height:7px;background:#EDE9FE;border-radius:4px;overflow:hidden;margin-top:7px;}
        .pfill{height:100%;border-radius:4px;transition:width .8s ease;}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width:200, background:"#fff", borderRight:"1.5px solid #EDE9FE", display:"flex", flexDirection:"column", height:"100vh", position:"fixed", top:0, left:0 }}>
        <div style={{ padding:"16px 14px", borderBottom:"1.5px solid #FAF5FF", display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:32, height:32, background:"#7C3AED", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:15, color:"#0F172A" }}>EduPortal</span>
        </div>
        <div style={{ margin:"10px 10px 4px", background:"#EDE9FE", borderRadius:9, padding:"9px 11px", border:"1px solid #DDD6FE" }}>
          <div style={{ fontSize:10, color:"#7C3AED", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Student</div>
          <div style={{ fontSize:13, fontWeight:700, color:"#0F172A", marginTop:2 }}>{user?.full_name || user?.first_name || "Student"}</div>
        </div>
        <nav style={{ flex:1, padding:"6px 8px", display:"flex", flexDirection:"column", gap:2 }}>
          {NAV.map(n => <button key={n} className={`nb${tab===n?" a":""}`} onClick={()=>{ setTab(n); setActiveQuiz(null); setResult(null); }}>{n}</button>)}
        </nav>
        <div style={{ padding:"10px 8px", borderTop:"1.5px solid #FAF5FF" }}>
          <button className="nb" style={{ color:"#EF4444" }} onClick={()=>{ logout(); navigate("/"); }}>Logout</button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft:200, flex:1, background:"#FAF5FF", minHeight:"100vh" }}>
        <header style={{ background:"#fff", borderBottom:"1.5px solid #EDE9FE", padding:"0 26px", height:58, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#0F172A", textTransform:"capitalize" }}>
            {tab==="quiz" && activeQuiz ? activeQuiz.title : tab}
          </h1>
          <div style={{ width:32, height:32, background:"#7C3AED", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:12 }}>
            {(user?.first_name||"S").charAt(0).toUpperCase()}
          </div>
        </header>

        <div style={{ padding:"24px 26px" }}>

          {/* ── OVERVIEW ── */}
          {tab==="overview" && (
            <div className="fade">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
                {[["Attendance Rate",`${attendanceRate}%`,"#059669"],["Avg Quiz Score",`${avgScore}%`,"#7C3AED"],["Quizzes Available",quizzes.filter(q=>!q.already_attempted).length,"#D97706"]].map(([l,v,c])=>(
                  <div key={l} className="card">
                    <div style={{ fontSize:30, fontWeight:800, fontFamily:"'Playfair Display',serif", color:c }}>{v}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#0F172A", marginTop:3 }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Available quizzes */}
              <div className="card" style={{ marginBottom:14 }}>
                <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Available Quizzes</h3>
                {quizzes.filter(q=>!q.already_attempted).length===0 ? (
                  <p style={{ color:"#94A3B8", fontSize:13 }}>No quizzes available right now.</p>
                ) : quizzes.filter(q=>!q.already_attempted).map(q=>(
                  <div key={q.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"#FAF5FF", borderRadius:11, border:"1.5px solid #EDE9FE", marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#0F172A" }}>{q.title}</div>
                      <div style={{ fontSize:12, color:"#64748B" }}>{q.class_room_name} · {q.question_count} questions · Due {q.deadline ? new Date(q.deadline).toLocaleDateString() : "—"}</div>
                    </div>
                    <button className="btn bp" disabled={loading} onClick={()=>startQuiz(q)}>
                      {loading?"...":"Start →"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Recent results */}
              {myResults.length>0 && (
                <div className="card">
                  <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Recent Results</h3>
                  {myResults.slice(0,3).map(r=>(
                    <div key={r.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #F5F3FF" }}>
                      <div style={{ fontSize:13, fontWeight:500, color:"#0F172A" }}>{r.quiz_title}</div>
                      <span style={{ fontSize:16, fontWeight:800, color:scoreColor(r.percentage), fontFamily:"'Playfair Display',serif" }}>{r.percentage}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── QUIZZES LIST ── */}
          {tab==="quizzes" && !activeQuiz && (
            <div className="fade">
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14, color:"#0F172A" }}>
                Available Quizzes ({quizzes.filter(q=>!q.already_attempted).length})
              </h3>
              {quizzes.length===0 ? <div className="card"><p style={{ color:"#94A3B8", fontSize:13 }}>No quizzes assigned to your class yet.</p></div> :
                quizzes.map(q=>(
                  <div key={q.id} className="card" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                      <div style={{ width:44, height:44, borderRadius:11, background:q.already_attempted?"#ECFDF5":"#EDE9FE", display:"flex", alignItems:"center", justifyContent:"center", color:q.already_attempted?"#059669":"#7C3AED", fontSize:20 }}>
                        {q.already_attempted?"✓":"📝"}
                      </div>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:"#0F172A" }}>{q.title}</div>
                        <div style={{ fontSize:12, color:"#64748B" }}>{q.question_count} questions · {q.class_room_name}</div>
                      </div>
                    </div>
                    {q.already_attempted ? (
                      <span style={{ background:"#ECFDF5", color:"#059669", padding:"4px 12px", borderRadius:999, fontSize:12, fontWeight:700 }}>Completed</span>
                    ) : (
                      <button className="btn bp" disabled={loading} onClick={()=>startQuiz(q)}>{loading?"...":"Start Quiz"}</button>
                    )}
                  </div>
                ))
              }
            </div>
          )}

          {/* ── TAKE QUIZ ── */}
          {tab==="quiz" && activeQuiz && !result && quizData && (
            <div className="fade" style={{ maxWidth:640, margin:"0 auto" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <div>
                  <p style={{ fontSize:13, color:"#64748B" }}>{Object.keys(answers).length}/{quizData.questions?.length||0} answered</p>
                </div>
                <button className="btn bgh" onClick={()=>{ setTab("quizzes"); setActiveQuiz(null); }}>← Back</button>
              </div>
              {/* Progress */}
              <div style={{ background:"#EDE9FE", borderRadius:4, height:5, marginBottom:24, overflow:"hidden" }}>
                <div style={{ height:"100%", background:"#7C3AED", borderRadius:4, width:`${(Object.keys(answers).length/(quizData.questions?.length||1))*100}%`, transition:"width .3s" }} />
              </div>

              {quizData.questions?.map((q,i)=>(
                <div key={q.id} className="card" style={{ marginBottom:14 }}>
                  <p style={{ fontSize:14, fontWeight:600, color:"#0F172A", marginBottom:14 }}>
                    <span style={{ color:"#7C3AED", marginRight:8 }}>Q{i+1}.</span>{q.text}
                  </p>
                  {q.choices?.map((c,ci)=>(
                    <button key={c.id} className={`opt ${answers[q.id]==c.id?"sel":""}`}
                      onClick={()=>setAnswers(a=>({...a,[q.id]:c.id}))}>
                      <span style={{ width:24, height:24, borderRadius:"50%", background:answers[q.id]==c.id?"#7C3AED":"#F1F5F9", color:answers[q.id]==c.id?"#fff":"#64748B", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:11, flexShrink:0 }}>
                        {["A","B","C","D"][ci]}
                      </span>
                      {c.text}
                    </button>
                  ))}
                </div>
              ))}

              <button className="btn bp" style={{ width:"100%", justifyContent:"center", padding:"13px", fontSize:14, marginTop:8 }}
                disabled={!quizData.questions || Object.keys(answers).length < quizData.questions.length}
                onClick={submitQuiz}>
                {Object.keys(answers).length < (quizData.questions?.length||0)
                  ? `Answer ${(quizData.questions?.length||0)-Object.keys(answers).length} more`
                  : "Submit Quiz →"}
              </button>
            </div>
          )}

          {/* ── QUIZ RESULT ── */}
          {tab==="quiz" && result && (
            <div className="fade" style={{ maxWidth:440, margin:"40px auto" }}>
              <div className="card" style={{ textAlign:"center", padding:40 }}>
                <div style={{ width:110, height:110, borderRadius:"50%", background:scoreColor(result.percentage)+"15", border:`4px solid ${scoreColor(result.percentage)}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", margin:"0 auto 22px" }}>
                  <div style={{ fontSize:30, fontWeight:800, color:scoreColor(result.percentage), fontFamily:"'Playfair Display',serif" }}>{result.percentage}%</div>
                  <div style={{ fontSize:11, color:"#64748B" }}>Score</div>
                </div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:800, marginBottom:8 }}>
                  {result.percentage>=80?"Excellent! 🎉":result.percentage>=60?"Good Job 👍":"Keep Practicing 💪"}
                </h2>
                <p style={{ fontSize:13, color:"#64748B", marginBottom:28 }}>
                  {result.score}/{result.total} correct answers
                </p>
                <button className="btn bp" style={{ width:"100%", justifyContent:"center", padding:"12px" }} onClick={()=>{ setTab("quizzes"); setActiveQuiz(null); setResult(null); }}>
                  Back to Quizzes
                </button>
              </div>
            </div>
          )}

          {/* ── ATTENDANCE ── */}
          {tab==="attendance" && (
            <div className="fade">
              {!attendance ? <div className="card"><p style={{ color:"#94A3B8", fontSize:13 }}>Loading...</p></div> : (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:18 }}>
                    {[["Rate",`${attendance.attendance_rate}%`,"#7C3AED"],["Present",attendance.present_days,"#059669"],["Absent",attendance.absent_days,"#EF4444"]].map(([l,v,c])=>(
                      <div key={l} className="card" style={{ textAlign:"center" }}>
                        <div style={{ fontSize:28, fontWeight:800, fontFamily:"'Playfair Display',serif", color:c }}>{v}</div>
                        <div style={{ fontSize:13, color:"#64748B", marginTop:3 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="card">
                    <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Attendance History</h3>
                    {attendance.records?.length===0 ? <p style={{ color:"#94A3B8", fontSize:13 }}>No records yet.</p> :
                      attendance.records?.map(r=>(
                        <div key={r.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:r.status==="present"?"#F0FDF4":"#FEF2F2", borderRadius:9, border:`1.5px solid ${r.status==="present"?"#A7F3D0":"#FECACA"}`, marginBottom:7 }}>
                          <span style={{ fontSize:13, fontWeight:500, color:"#374151" }}>{r.date}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:r.status==="present"?"#059669":"#EF4444" }}>
                            {r.status==="present"?"✓ Present":"✗ Absent"}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── GRADES ── */}
          {tab==="grades" && (
            <div className="fade">
              <div className="card" style={{ marginBottom:14 }}>
                <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Quiz Results</h3>
                {myResults.length===0 ? <p style={{ color:"#94A3B8", fontSize:13 }}>No completed quizzes yet.</p> :
                  myResults.map(r=>(
                    <div key={r.id} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:"#0F172A" }}>{r.quiz_title}</div>
                          <div style={{ fontSize:11, color:"#94A3B8" }}>{new Date(r.submitted_at).toLocaleDateString()}</div>
                        </div>
                        <span style={{ fontSize:18, fontWeight:800, fontFamily:"'Playfair Display',serif", color:scoreColor(r.percentage) }}>{r.percentage}%</span>
                      </div>
                      <div className="pbar"><div className="pfill" style={{ width:`${r.percentage}%`, background:scoreColor(r.percentage) }}/></div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

        </div>
      </div>

      {toast && <div className={`toast ${toast.type==="success"?"ts":"te"}`}>{toast.msg}</div>}
    </div>
  );
}
