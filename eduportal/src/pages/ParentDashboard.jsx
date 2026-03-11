import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { parentAPI, reportsAPI } from "../api";
import MessagesPanel from "../components/MessagesPanel";
import LoadingSpinner from "../components/LoadingSpinner";

const NAV = [
  { id:"overview",  label:"Overview" },
  { id:"detail",    label:"Child Details" },
  { id:"messages",  label:"Messages" },
];

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [tab, setTab]     = useState("overview");
  const [children, setChildren]   = useState([]);
  const [selChild, setSelChild]   = useState(null);
  const [detail,   setDetail]     = useState(null);
  const [loading,  setLoading]    = useState(true);
  const [loadingD, setLoadingD]   = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(()=>{
    parentAPI.children().then(d=>{
      const kids = d.children||[];
      setChildren(kids);
      if (kids.length>0) setSelChild(kids[0]);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    if (!selChild) return;
    setLoadingD(true);
    parentAPI.childDetail(selChild.id)
      .then(d=>setDetail(d))
      .catch(()=>setDetail(null))
      .finally(()=>setLoadingD(false));
  },[selChild]);

  const handleDownloadPDF = async () => {
    if (!selChild) return;
    setDownloading(true);
    try { await reportsAPI.studentPDF(selChild.id); }
    catch { alert("Failed to download PDF"); }
    finally { setDownloading(false); }
  };

  const scoreColor = p => p>=80?"#059669":p>=60?"#D97706":"#EF4444";

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",display:"flex",minHeight:"100vh"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} .nb{display:flex;align-items:center;padding:9px 14px;border-radius:9px;border:none;background:none;width:100%;font-size:13px;font-weight:500;color:#64748B;cursor:pointer;font-family:inherit;transition:all .18s;} .nb:hover{background:#FEF3C7;color:#92400E;} .nb.a{background:#FEF3C7;color:#D97706;font-weight:700;} .card{background:#fff;border-radius:14px;padding:18px;border:1.5px solid #E2E8F0;} .fade{animation:fi .3s ease;} @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Sidebar */}
      <aside style={{width:210,background:"#fff",borderRight:"1.5px solid #E2E8F0",display:"flex",flexDirection:"column",height:"100vh",position:"fixed",top:0,left:0}}>
        <div style={{padding:"16px 14px",borderBottom:"1.5px solid #F1F5F9",display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:32,height:32,background:"#D97706",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👨‍👩‍👦</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:15,color:"#0F172A"}}>EduPortal</span>
        </div>
        <div style={{margin:"10px 10px 4px",background:"#FEF3C7",borderRadius:9,padding:"9px 11px",border:"1px solid #FDE68A"}}>
          <div style={{fontSize:10,color:"#D97706",fontWeight:700,textTransform:"uppercase"}}>Parent</div>
          <div style={{fontSize:13,fontWeight:700,color:"#0F172A",marginTop:2}}>{user?.full_name||user?.first_name||"Parent"}</div>
        </div>
        <nav style={{flex:1,padding:"6px 8px",display:"flex",flexDirection:"column",gap:2}}>
          {NAV.map(n=><button key={n.id} className={`nb${tab===n.id?" a":""}`} onClick={()=>setTab(n.id)}>{n.label}</button>)}
          <button className="nb" onClick={()=>navigate("/profile")} style={{marginTop:4}}>👤 Profile</button>
        </nav>
        <div style={{padding:"10px 8px",borderTop:"1.5px solid #F1F5F9"}}>
          <button className="nb" style={{color:"#EF4444"}} onClick={()=>{logout();navigate("/");}}>Logout</button>
        </div>
      </aside>

      {/* Main */}
      <div style={{marginLeft:210,flex:1,background:"#F1F5F9",minHeight:"100vh"}}>
        <header style={{background:"#fff",borderBottom:"1.5px solid #E2E8F0",padding:"0 24px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
          <h1 style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>{NAV.find(n=>n.id===tab)?.label||"Parent Portal"}</h1>
          <div style={{width:32,height:32,background:"#D97706",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:12}}>
            {(user?.first_name||"P").charAt(0).toUpperCase()}
          </div>
        </header>

        <div style={{padding:22}}>

          {loading&&<LoadingSpinner color="#D97706" text="Loading your children's data..."/>}

          {!loading&&children.length===0&&(
            <div className="card fade" style={{textAlign:"center",padding:60}}>
              <div style={{fontSize:48,marginBottom:16}}>👨‍👩‍👦</div>
              <h3 style={{fontSize:18,fontWeight:700,color:"#0F172A",marginBottom:8}}>No children linked yet</h3>
              <p style={{fontSize:13,color:"#64748B"}}>Please ask the school admin to link your children to your account.</p>
            </div>
          )}

          {!loading&&children.length>0&&(

            <>
              {/* Child selector */}
              {children.length>1&&(
                <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
                  {children.map(c=>(
                    <button key={c.id} onClick={()=>setSelChild(c)}
                      style={{padding:"8px 16px",borderRadius:10,border:`1.5px solid ${selChild?.id===c.id?"#D97706":"#E2E8F0"}`,background:selChild?.id===c.id?"#FEF3C7":"#fff",color:selChild?.id===c.id?"#D97706":"#64748B",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                      {c.full_name}
                    </button>
                  ))}
                </div>
              )}

              {/* OVERVIEW */}
              {tab==="overview"&&selChild&&(
                <div className="fade">
                  {/* Child info card */}
                  <div className="card" style={{marginBottom:14,display:"flex",alignItems:"center",gap:16}}>
                    <div style={{width:56,height:56,borderRadius:"50%",background:"#FEF3C7",border:"2px solid #D97706",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#D97706",flexShrink:0}}>
                      {selChild.full_name?.charAt(0)}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:18,fontWeight:800,color:"#0F172A",fontFamily:"'Playfair Display',serif"}}>{selChild.full_name}</div>
                      <div style={{fontSize:13,color:"#64748B",marginTop:3}}>
                        {selChild.grade_name&&<span>{selChild.grade_name} · </span>}
                        {selChild.class_name&&<span>Class {selChild.class_name} · </span>}
                        {selChild.teacher&&<span>Teacher: <strong>{selChild.teacher}</strong></span>}
                      </div>
                    </div>
                    <button onClick={handleDownloadPDF} disabled={downloading}
                      style={{padding:"9px 16px",background:"#D97706",color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                      {downloading?"Downloading...":"📄 Report Card PDF"}
                    </button>
                  </div>

                  {/* KPI */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
                    {[
                      ["Attendance Rate", selChild.attendance_rate+"%", scoreColor(selChild.attendance_rate)],
                      ["Quiz Average",    selChild.quiz_avg+"%",         scoreColor(selChild.quiz_avg)],
                      ["Total Quizzes",   selChild.total_quizzes,        "#2563EB"],
                    ].map(([l,v,c])=>(
                      <div key={l} className="card" style={{textAlign:"center"}}>
                        <div style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',serif",color:c}}>{v}</div>
                        <div style={{fontSize:12,color:"#64748B",marginTop:4}}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Quick actions */}
                  <div className="card">
                    <h4 style={{fontSize:13,fontWeight:700,marginBottom:12}}>Quick Actions</h4>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>setTab("detail")} style={{padding:"8px 16px",background:"#EFF6FF",color:"#2563EB",border:"none",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>View Full Report →</button>
                      {selChild.teacher_id&&<button onClick={()=>setTab("messages")} style={{padding:"8px 16px",background:"#ECFDF5",color:"#059669",border:"none",borderRadius:8,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Message Teacher →</button>}
                    </div>
                  </div>
                </div>
              )}

              {/* DETAIL */}
              {tab==="detail"&&(
                <div className="fade">
                  {loadingD?<LoadingSpinner color="#D97706" text="Loading details..."/>
                  :!detail?<div className="card" style={{textAlign:"center",color:"#94A3B8",padding:40}}>No data available.</div>
                  :(
                    <>
                      {/* Attendance recent */}
                      <div className="card" style={{marginBottom:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                          <h4 style={{fontSize:13,fontWeight:700,color:"#0F172A"}}>📅 Recent Attendance (last 30 days)</h4>
                          <span style={{fontSize:13,fontWeight:700,color:scoreColor(detail.attendance_rate)}}>{detail.attendance_rate}% rate</span>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                          {detail.attendance?.map((r,i)=>(
                            <div key={i} title={r.date} style={{width:28,height:28,borderRadius:6,background:r.status==="present"?"#ECFDF5":r.status==="absent"?"#FEF2F2":"#FEF3C7",border:`1.5px solid ${r.status==="present"?"#A7F3D0":r.status==="absent"?"#FECACA":"#FDE68A"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,title:r.date}}>
                              {r.status==="present"?"✓":r.status==="absent"?"✗":"~"}
                            </div>
                          ))}
                          {(!detail.attendance||detail.attendance.length===0)&&<p style={{fontSize:13,color:"#94A3B8"}}>No attendance records yet.</p>}
                        </div>
                        <div style={{display:"flex",gap:14,marginTop:10,fontSize:11,color:"#64748B"}}>
                          <span>✓ Present</span><span>✗ Absent</span><span>~ Late</span>
                        </div>
                      </div>

                      {/* Quiz results */}
                      <div className="card" style={{marginBottom:14}}>
                        <h4 style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:14}}>📝 Quiz Results</h4>
                        {detail.quizzes?.length===0?<p style={{fontSize:13,color:"#94A3B8"}}>No quiz attempts yet.</p>
                        :<div style={{overflowX:"auto"}}>
                          {detail.quizzes?.map((q,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #F1F5F9",fontSize:13}}>
                              <span style={{color:"#0F172A",fontWeight:500}}>{q.quiz_title}</span>
                              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                                <span style={{color:"#64748B"}}>{q.score}/{q.total}</span>
                                <span style={{fontWeight:700,color:scoreColor(q.percentage)}}>{q.percentage}%</span>
                                <span style={{fontSize:11,color:"#94A3B8"}}>{q.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>}
                      </div>

                      {/* Assignments */}
                      {detail.assignments?.length>0&&(
                        <div className="card">
                          <h4 style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:14}}>📋 Assignments</h4>
                          {detail.assignments.map((a,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #F1F5F9",fontSize:13}}>
                              <div>
                                <div style={{fontWeight:600,color:"#0F172A"}}>{a.title}</div>
                                <div style={{fontSize:11,color:"#94A3B8"}}>Due: {a.due_date}</div>
                              </div>
                              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                                {a.score!=null&&<span style={{fontWeight:700,color:scoreColor(a.score/a.max_score*100)}}>{a.score}/{a.max_score}</span>}
                                <span style={{padding:"2px 10px",borderRadius:999,fontSize:11,fontWeight:700,background:a.status==="graded"?"#ECFDF5":a.status==="submitted"?"#EFF6FF":a.status==="late"?"#FEF2F2":"#F1F5F9",color:a.status==="graded"?"#059669":a.status==="submitted"?"#2563EB":a.status==="late"?"#EF4444":"#64748B"}}>{a.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* MESSAGES */}
              {tab==="messages"&&(
                <div className="fade">
                  <MessagesPanel accentColor="#D97706" accentBg="#FEF3C7"/>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
