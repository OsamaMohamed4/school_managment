import "../../src/animations.css";
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
      const kids = Array.isArray(d)?d:(d.children||d.results||[]);
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
    <div className="page-enter" style={{fontFamily:"'DM Sans',sans-serif",display:"flex",minHeight:"100vh"}}>
      <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  .nb{display:flex;align-items:center;gap:9px;padding:9px 13px;border-radius:10px;border:none;background:none;width:100%;font-size:13px;font-weight:500;color:#64748B;cursor:pointer;font-family:'Sora',sans-serif;transition:all 0.18s ease;}
  .nb:hover{background:#FEF3C7;color:#0F172A;transform:translateX(3px);}
  .nb.a{background:#FEF3C7;color:#D97706;font-weight:700;box-shadow:inset 3px 0 0 #D97706;}
  .btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;border:none;font-family:'Sora',sans-serif;transition:all 0.18s;}
  .btn:hover:not(:disabled){transform:translateY(-1px);}
  .bp{background:#F59E0B;color:#fff;} .bp:hover{opacity:0.9;}
  .bgh{background:#F59E0B22;color:#FBBF24;border:1px solid #F59E0B44;}
  .bgr{background:rgba(239,68,68,0.15);color:#F87171;border:1px solid rgba(239,68,68,0.2);}
  .bgs{background:rgba(16,185,129,0.15);color:#34D399;border:1px solid rgba(16,185,129,0.2);}
  .bgl{background:rgba(255,255,255,0.06);color:#94A3B8;border:1px solid rgba(255,255,255,0.1);}
  .card{background:#fff;border-radius:16px;padding:20px;border:1.5px solid #E2E8F0;}
  .stat-card{background:rgba(255,255,255,0.04);border-radius:16px;padding:22px 20px;border:1px solid rgba(255,255,255,0.08);animation:fadeUp 0.5s ease both;transition:transform 0.2s,box-shadow 0.2s;}
  .stat-card:hover{transform:translateY(-5px);box-shadow:0 20px 48px rgba(0,0,0,0.3);}
  .fade{animation:fadeUp 0.4s ease both;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  .s1{animation-delay:0.05s;}.s2{animation-delay:0.1s;}.s3{animation-delay:0.15s;}.s4{animation-delay:0.2s;}
  .inp{width:100%;padding:10px 13px;background:#fff;border:1.5px solid #E2E8F0;border-radius:10px;font-size:13px;color:#0F172A;outline:none;font-family:'Sora',sans-serif;transition:all 0.2s;}
  .inp::placeholder{color:#475569;} .inp:focus{border-color:#F59E0B;background:rgba(255,255,255,0.08);}
  .inp.err{border-color:#EF4444;} .ferr{color:#F87171;font-size:11px;margin-top:3px;}
  .sel{width:100%;padding:10px 13px;background:#fff;border:1.5px solid #E2E8F0;border-radius:10px;font-size:13px;color:#0F172A;outline:none;font-family:'Sora',sans-serif;}
  .lbl{display:block;font-size:11px;font-weight:700;color:#475569;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;}
  .field{margin-bottom:13px;}
  .trow{display:grid;padding:12px 16px;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.05);color:#94A3B8;transition:background 0.15s;}
  .trow:hover{background:rgba(255,255,255,0.03);}
  .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:100;}
  .modal{background:#fff;border-radius:20px;padding:28px;width:440px;max-width:94vw;border:1px solid rgba(255,255,255,0.1);animation:fadeUp 0.3s ease;box-shadow:0 40px 100px rgba(0,0,0,0.5);}
  .toast{position:fixed;bottom:22px;right:22px;padding:13px 18px;border-radius:12px;font-size:13px;font-weight:700;z-index:300;animation:slideToast 0.3s ease;font-family:'Sora',sans-serif;max-width:320px;}
  @keyframes slideToast{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  .ts{background:linear-gradient(135deg,#059669,#10B981);color:#fff;} .te{background:linear-gradient(135deg,#DC2626,#EF4444);color:#fff;}
  .badge{display:inline-flex;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;}
  .tab-btn{padding:7px 14px;border-radius:9px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);font-size:12px;font-weight:700;color:#64748B;cursor:pointer;font-family:'Sora',sans-serif;transition:all 0.18s;}
  .tab-btn.a{background:#F59E0B22;color:#FBBF24;border-color:#F59E0B44;}
  .sel-item{padding:11px 14px;border-radius:11px;border:1px solid rgba(255,255,255,0.08);margin-bottom:6px;cursor:pointer;background:rgba(255,255,255,0.03);transition:all 0.18s;}
  .sel-item:hover{border-color:#F59E0B44;background:#F59E0B11;}
  .sel-item.active{border-color:#F59E0B;background:#F59E0B18;}
  .pbar{height:5px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;margin-top:5px;}
  .pfill{height:100%;border-radius:3px;transition:width 0.8s ease;}
  .spinner{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;animation:spin .6s linear infinite;display:inline-block;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .srow{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);margin-bottom:7px;cursor:pointer;transition:all 0.18s;background:rgba(255,255,255,0.03);}
  .srow:hover{border-color:#F59E0B44;} .srow.p{border-color:#10B981;background:rgba(16,185,129,0.08);} .srow.ab{border-color:#EF4444;background:rgba(239,68,68,0.08);}
  .qcard{background:rgba(255,255,255,0.03);border-radius:11px;padding:14px 16px;border:1px solid rgba(255,255,255,0.08);margin-bottom:10px;}
  .b-mcq{background:rgba(59,130,246,0.2);color:#60A5FA;} .b-tf{background:rgba(16,185,129,0.2);color:#34D399;} .b-sa{background:rgba(245,158,11,0.2);color:#FBBF24;}
  .opt{width:100%;padding:11px 14px;border-radius:9px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);text-align:left;cursor:pointer;font-size:13px;color:#94A3B8;transition:all 0.2s;font-family:'Sora',sans-serif;display:flex;align-items:center;gap:10px;margin-bottom:7px;}
  .opt:hover{border-color:#F59E0B44;background:#F59E0B11;color:#E2E8F0;} .opt.sel{border-color:#F59E0B;background:#F59E0B22;color:#FBBF24;font-weight:600;}
  .short-inp{width:100%;padding:10px 14px;background:#fff;border:1.5px solid #E2E8F0;border-radius:9px;font-size:13px;color:#0F172A;font-family:'Sora',sans-serif;outline:none;transition:border 0.2s;}
  .short-inp:focus{border-color:#F59E0B;}
  .gb-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;align-items:center;padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#94A3B8;}
  .gb-row:hover{background:rgba(255,255,255,0.03);}
  .notif-type-btn{padding:7px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);font-size:12px;font-weight:600;cursor:pointer;font-family:'Sora',sans-serif;transition:all 0.18s;color:#64748B;}
  .tabbtn{padding:7px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);font-size:13px;font-weight:600;color:#64748B;cursor:pointer;font-family:'Sora',sans-serif;transition:all 0.18s;}
  .tabbtn.a{background:#F59E0B22;color:#FBBF24;border-color:#F59E0B44;}
  .unread-dot{width:18px;height:18px;background:#EF4444;border-radius:50%;font-size:10px;font-weight:800;color:#fff;display:flex;align-items:center;justify-content:center;margin-left:auto;}
  .choice-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
  .msg-item{padding:12px 14px;border-radius:11px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);cursor:pointer;transition:all .18s;margin-bottom:7px;}
  .msg-item:hover,.msg-item.sel{border-color:#F59E0B44;background:#F59E0B11;}
  .bubble{max-width:72%;padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.5;word-break:break-word;}
  .bubble.mine{background:#F59E0B;color:#fff;border-bottom-right-radius:4px;margin-left:auto;}
  .bubble.theirs{background:rgba(255,255,255,0.08);color:#E2E8F0;border-bottom-left-radius:4px;}
  .contact-btn{width:100%;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);cursor:pointer;font-family:'Sora',sans-serif;font-size:13px;text-align:left;transition:all .18s;margin-bottom:6px;color:#94A3B8;}
  .contact-btn:hover{border-color:#F59E0B44;background:#F59E0B11;color:#E2E8F0;}
  .msg-inp{flex:1;padding:10px 14px;background:#fff;border:1.5px solid #E2E8F0;border-radius:10px;font-size:13px;font-family:'Sora',sans-serif;outline:none;color:#0F172A;transition:border .2s;}
  .msg-inp:focus{border-color:#F59E0B;}
  .msg-inp::placeholder{color:#475569;}
  .asgn-card{background:rgba(255,255,255,0.04);border-radius:13px;padding:16px 18px;border:1px solid rgba(255,255,255,0.08);margin-bottom:10px;cursor:pointer;transition:all .18s;}
  .asgn-card:hover{border-color:#F59E0B44;box-shadow:0 4px 20px rgba(0,0,0,0.2);}
  .asgn-inp{width:100%;padding:9px 12px;background:#fff;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:'Sora',sans-serif;outline:none;color:#0F172A;}
  .asgn-inp:focus{border-color:#F59E0B;}
  .asgn-btn{padding:8px 16px;border-radius:9px;border:none;font-weight:600;font-size:13px;cursor:pointer;font-family:'Sora',sans-serif;transition:all .18s;}
  .tt-cell{padding:8px 10px;border-radius:9px;font-size:12px;position:relative;transition:all 0.2s;}
  .tt-del{position:absolute;top:4px;right:4px;background:#EF4444;color:#fff;border:none;border-radius:4px;font-size:10px;padding:2px 5px;cursor:pointer;opacity:0;transition:opacity .2s;}
  .tt-cell:hover .tt-del{opacity:1;}
  .tt-inp{width:100%;padding:8px 11px;background:#fff;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:'Sora',sans-serif;outline:none;color:#0F172A;}
  .tt-inp:focus{border-color:#F59E0B;}
  .tt-sel{width:100%;padding:8px 11px;background:#fff;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:'Sora',sans-serif;color:#0F172A;outline:none;}
`}</style>

      {/* Sidebar */}
      <aside style={{width:210,background:"#fff",borderRight:"1.5px solid #FDE68A",display:"flex",flexDirection:"column",height:"100vh",position:"fixed",top:0,left:0}}>
        <div style={{padding:"16px 14px",borderBottom:"1.5px solid #FEF3C7",display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:32,height:32,background:"#D97706",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>👨‍👩‍👦</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:15,color:"#0F172A"}}>EduPortal</span>
        </div>
        <div style={{margin:"10px 10px 4px",background:"#FEF3C7",borderRadius:9,padding:"9px 11px",border:"1px solid #FDE68A"}}>
          <div style={{fontSize:10,color:"#D97706",fontWeight:700,textTransform:"uppercase"}}>Parent</div>
          <div style={{fontSize:13,fontWeight:700,color:"#92400E",marginTop:2}}>{user?.full_name||user?.first_name||"Parent"}</div>
        </div>
        <nav style={{flex:1,padding:"6px 8px",display:"flex",flexDirection:"column",gap:2}}>
          {NAV.map(n=><button key={n.id} className={`nb${tab===n.id?" a":""}`} onClick={()=>setTab(n.id)}>{n.label}</button>)}
          <button className="nb" onClick={()=>navigate("/profile")} style={{marginTop:4}}>👤 Profile</button>
        </nav>
        <div style={{padding:"10px 8px",borderTop:"1.5px solid #FEF3C7"}}>
          <button className="nb" style={{color:"#EF4444"}} onClick={()=>{logout();navigate("/");}}>Logout</button>
        </div>
      </aside>

      {/* Main */}
      <div style={{marginLeft:210,flex:1,background:"#FFFBEB",minHeight:"100vh"}}>
        <header style={{background:"#fff",borderBottom:"1.5px solid #FDE68A",padding:"0 24px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
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
                      style={{padding:"8px 16px",borderRadius:10,border:`1.5px solid ${selChild?.id===c.id?"#D97706":"#E2E8F0"}`,background:selChild?.id===c.id?"#FEF3C7":"#F8FAFC",color:selChild?.id===c.id?"#D97706":"#64748B",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
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
                      ["Attendance Rate", detail?detail.attendance?.rate+"%":"—", scoreColor(detail?.attendance?.rate||0)],
                      ["Quiz Average",    detail?detail.quizzes?.avg_score+"%":"—", scoreColor(detail?.quizzes?.avg_score||0)],
                      ["Total Quizzes",   detail?detail.quizzes?.total_taken:"—",  "#2563EB"],
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
                          <span style={{fontSize:13,fontWeight:700,color:scoreColor(detail.attendance?.rate)}}>{detail.attendance?.rate}% rate</span>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                          {detail.attendance?.records?.map((r,i)=>(
                            <div key={i} title={r.date} style={{width:28,height:28,borderRadius:6,background:r.status==="present"?"#ECFDF5":r.status==="absent"?"#FEF2F2":"#FEF3C7",border:`1.5px solid ${r.status==="present"?"#A7F3D0":r.status==="absent"?"#FECACA":"#FDE68A"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,title:r.date}}>
                              {r.status==="present"?"✓":r.status==="absent"?"✗":"~"}
                            </div>
                          ))}
                          {(!detail.attendance?.records||detail.attendance.records.length===0)&&<p style={{fontSize:13,color:"#94A3B8"}}>No attendance records yet.</p>}
                        </div>
                        <div style={{display:"flex",gap:14,marginTop:10,fontSize:11,color:"#64748B"}}>
                          <span>✓ Present</span><span>✗ Absent</span><span>~ Late</span>
                        </div>
                      </div>

                      {/* Quiz results */}
                      <div className="card" style={{marginBottom:14}}>
                        <h4 style={{fontSize:13,fontWeight:700,color:"#0F172A",marginBottom:14}}>📝 Quiz Results</h4>
                        {!detail.quizzes?.attempts?.length?<p style={{fontSize:13,color:"#94A3B8"}}>No quiz attempts yet.</p>
                        :<div style={{overflowX:"auto"}}>
                          {detail.quizzes?.attempts?.map((q,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #F1F5F9",fontSize:13}}>
                              <span style={{color:"#0F172A",fontWeight:500}}>{q.quiz_title}</span>
                              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                                <span style={{color:"#64748B"}}>{q.score}/{q.total_points}</span>
                                <span style={{fontWeight:700,color:scoreColor(q.percentage)}}>{q.percentage}%</span>
                                <span style={{fontSize:11,color:"#94A3B8"}}>{q.submitted_at}</span>
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
