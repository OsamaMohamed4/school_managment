import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { parentAPI, reportsAPI, notificationsAPI } from "../api";
import MessagesPanel from "../components/MessagesPanel";
import LoadingSpinner from "../components/LoadingSpinner";

const NAV = [
  { id:"overview",       label:"Overview",       icon:"⊞" },
  { id:"detail",         label:"Child Details",  icon:"📊" },
  { id:"notifications",  label:"Notifications",  icon:"🔔" },
  { id:"messages",       label:"Messages",       icon:"✉" },
];

const NOTIF_TYPES = [
  { value:"info",    color:"#2563EB", bg:"#EFF6FF" },
  { value:"warning", color:"#D97706", bg:"#FEF3C7" },
  { value:"success", color:"#059669", bg:"#ECFDF5" },
];

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap');

  :root {
    --amber: #D97706;
    --amber-light: #FBBF24;
    --amber-soft: #FEF3C7;
    --amber-mid: #FDE68A;
    --bg: #FFFBEB;
    --surface: #FFFFFF;
    --surface2: #FAFAF9;
    --border: #E5E7EB;
    --border-amber: #FDE68A;
    --text: #0F172A;
    --muted: #64748B;
    --faint: #94A3B8;
    --green: #059669;
    --blue: #2563EB;
    --red: #EF4444;
    --purple: #7C3AED;
    --sidebar-w: 220px;
    --header-h: 56px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  .p-root { display: flex; min-height: 100vh; font-family: 'Sora', sans-serif; background: var(--bg); }

  /* ── OVERLAY ── */
  .p-overlay { display: none; position: fixed; inset: 0; background: rgba(15,23,42,.45); backdrop-filter: blur(3px); z-index: 40; }
  .p-overlay.open { display: block; }

  /* ── SIDEBAR ── */
  .p-sidebar {
    position: fixed; top: 0; left: 0; bottom: 0; width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1.5px solid var(--border-amber);
    display: flex; flex-direction: column; z-index: 50;
    transform: translateX(-100%);
    transition: transform .28s cubic-bezier(.4,0,.2,1);
  }
  .p-sidebar.open { transform: translateX(0); }
  @media (min-width: 768px) { .p-sidebar { transform: translateX(0); } }

  .p-logo { display: flex; align-items: center; gap: 10px; padding: 16px 14px; border-bottom: 1.5px solid var(--amber-soft); }
  .p-logo-icon { width: 32px; height: 32px; background: var(--amber); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .p-logo-text { font-family: 'Playfair Display',serif; font-weight: 800; font-size: 15px; color: var(--text); }

  .p-user-chip { margin: 10px 10px 4px; background: var(--amber-soft); border: 1px solid var(--amber-mid); border-radius: 10px; padding: 10px 12px; }
  .p-user-role { font-size: 10px; font-weight: 700; color: var(--amber); text-transform: uppercase; letter-spacing: .5px; }
  .p-user-name { font-size: 13px; font-weight: 700; color: #92400E; margin-top: 2px; }

  .p-nav { flex: 1; padding: 6px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
  .p-nav-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 12px; border-radius: 9px; border: none; background: none; width: 100%;
    font-size: 13px; font-weight: 500; color: var(--muted);
    cursor: pointer; font-family: 'Sora',sans-serif; transition: all .18s; text-align: left;
  }
  .p-nav-btn:hover { background: var(--amber-soft); color: var(--text); transform: translateX(2px); }
  .p-nav-btn.active { background: var(--amber-soft); color: var(--amber); font-weight: 700; box-shadow: inset 3px 0 0 var(--amber); }
  .p-nav-footer { padding: 8px 8px 12px; border-top: 1.5px solid var(--amber-soft); display: flex; flex-direction: column; gap: 2px; }

  /* ── MAIN ── */
  .p-main { flex: 1; display: flex; flex-direction: column; min-height: 100vh; }
  @media (min-width: 768px) { .p-main { margin-left: var(--sidebar-w); } }

  /* ── HEADER ── */
  .p-header {
    position: sticky; top: 0; z-index: 30; height: var(--header-h);
    background: var(--surface); border-bottom: 1.5px solid var(--border-amber);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 16px; gap: 12px;
  }
  .p-header-left { display: flex; align-items: center; gap: 10px; }
  .p-hamburger {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; background: var(--bg);
    border: 1.5px solid var(--border-amber); border-radius: 9px;
    cursor: pointer; transition: all .15s;
  }
  .p-hamburger:hover { background: var(--amber-soft); }
  @media (min-width: 768px) { .p-hamburger { display: none; } }
  .p-header-title { font-size: 14px; font-weight: 700; color: var(--text); }
  .p-avatar { width: 34px; height: 34px; background: var(--amber); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 13px; flex-shrink: 0; }

  /* ── CONTENT ── */
  .p-content { padding: 20px 16px; }
  @media (min-width: 640px) { .p-content { padding: 24px 20px; } }
  @media (min-width: 1024px) { .p-content { padding: 28px 28px; } }

  .fade { animation: fadeUp .35s ease both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

  /* ── CHILD SELECTOR ── */
  .p-child-tabs { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
  .p-child-tab {
    padding: 8px 16px; border-radius: 10px; cursor: pointer;
    font-size: 13px; font-weight: 700; font-family: 'Sora',sans-serif;
    transition: all .18s; border: 1.5px solid var(--border); background: var(--surface); color: var(--muted);
  }
  .p-child-tab.active { background: var(--amber-soft); color: var(--amber); border-color: var(--amber-mid); }

  /* ── CHILD INFO CARD ── */
  .p-child-card {
    background: var(--surface); border: 1.5px solid var(--border-amber);
    border-radius: 16px; padding: 20px 16px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  }
  .p-child-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--amber-soft); border: 2.5px solid var(--amber);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 800; color: var(--amber); flex-shrink: 0;
  }
  .p-child-info { flex: 1; min-width: 140px; }
  .p-child-name { font-family: 'Playfair Display',serif; font-size: 18px; font-weight: 800; color: var(--text); }
  .p-child-meta { font-size: 13px; color: var(--muted); margin-top: 4px; }

  /* ── KPI ── */
  .p-kpi-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px; }
  @media (min-width: 480px) { .p-kpi-grid { grid-template-columns: repeat(3,1fr); } }

  .p-kpi { background: var(--surface); border: 1.5px solid var(--border); border-radius: 14px; padding: 18px 16px; text-align: center; transition: box-shadow .2s; }
  .p-kpi:hover { box-shadow: 0 4px 16px rgba(217,119,6,.1); }
  .p-kpi-val { font-family: 'Playfair Display',serif; font-size: 28px; font-weight: 800; }
  .p-kpi-label { font-size: 12px; color: var(--muted); margin-top: 4px; font-weight: 500; }

  /* ── CARD ── */
  .p-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 14px; padding: 20px 16px; margin-bottom: 14px; }
  @media (min-width: 640px) { .p-card { padding: 20px; } }
  .p-card-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 14px; display: flex; align-items: center; gap: 7px; }

  /* ── QUICK ACTIONS ── */
  .p-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .btn-amber {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 8px 16px; border-radius: 9px; background: var(--amber-soft); color: var(--amber);
    border: 1.5px solid var(--amber-mid); font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: 'Sora',sans-serif; transition: all .18s; white-space: nowrap;
  }
  .btn-amber:hover { background: var(--amber-mid); }
  .btn-amber-solid {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 9px 18px; border-radius: 9px; background: var(--amber); color: #fff;
    border: none; font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: 'Sora',sans-serif; transition: all .18s; white-space: nowrap;
  }
  .btn-amber-solid:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .btn-amber-solid:disabled { opacity: .6; cursor: not-allowed; }
  .btn-blue {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 8px 16px; border-radius: 9px; background: #EFF6FF; color: var(--blue);
    border: 1.5px solid #BFDBFE; font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: 'Sora',sans-serif; transition: all .18s; white-space: nowrap;
  }
  .btn-blue:hover { background: #DBEAFE; }
  .btn-green-soft {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 8px 16px; border-radius: 9px; background: #ECFDF5; color: var(--green);
    border: 1.5px solid #A7F3D0; font-size: 13px; font-weight: 700;
    cursor: pointer; font-family: 'Sora',sans-serif; transition: all .18s; white-space: nowrap;
  }
  .btn-green-soft:hover { background: #D1FAE5; }

  /* ── ATTENDANCE CALENDAR ── */
  .p-att-dots { display: flex; flex-wrap: wrap; gap: 5px; }
  .p-att-dot {
    width: 28px; height: 28px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; cursor: default;
    border: 1.5px solid;
  }
  .p-att-legend { display: flex; gap: 14px; margin-top: 10px; font-size: 11px; color: var(--muted); }

  /* ── QUIZ RESULTS ── */
  .p-quiz-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 9px 0; border-bottom: 1px solid var(--bg); font-size: 13px; gap: 10px;
  }
  .p-quiz-title { color: var(--text); font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .p-quiz-meta  { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }

  /* ── ASSIGNMENTS ── */
  .p-asgn-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 9px 0; border-bottom: 1px solid var(--bg); font-size: 13px; gap: 10px;
    flex-wrap: wrap;
  }
  .p-asgn-title { font-weight: 600; color: var(--text); }
  .p-asgn-due   { font-size: 11px; color: var(--faint); margin-top: 1px; }
  .p-status-chip {
    padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; flex-shrink: 0;
  }

  /* ── PBAR ── */
  .pbar { height: 5px; background: var(--border); border-radius: 3px; overflow: hidden; margin-top: 4px; }
  .pfill { height: 100%; border-radius: 3px; transition: width .8s ease; }

  /* ── NOTIFICATIONS ── */
  .p-notif-item { padding: 12px 14px; border-radius: 10px; margin-bottom: 8px; border: 1.5px solid; }
  .p-notif-item.unread { border-color: var(--amber-mid); background: var(--amber-soft); }
  .p-notif-item.read   { border-color: var(--border);    background: var(--bg); }

  /* ── EMPTY ── */
  .p-empty { text-align: center; padding: 32px 16px; color: var(--faint); font-size: 13px; }
  .p-empty-icon { font-size: 36px; margin-bottom: 10px; }

  /* ── NO CHILDREN ── */
  .p-no-children {
    background: var(--surface); border: 1.5px solid var(--border-amber);
    border-radius: 18px; padding: 60px 24px; text-align: center; margin-top: 20px;
  }
  .p-no-children-icon { font-size: 56px; margin-bottom: 16px; }
  .p-no-children-title { font-family: 'Playfair Display',serif; font-size: 20px; font-weight: 800; color: var(--text); margin-bottom: 8px; }
  .p-no-children-sub { font-size: 13px; color: var(--muted); }

  /* ── SUBMITTED BANNER ── */
  .p-submitted-banner {
    background: #ECFDF5; border: 1.5px solid #A7F3D0; border-radius: 12px;
    padding: 14px 16px; margin-bottom: 14px;
    display: flex; align-items: flex-start; gap: 10px;
  }
`;

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab]     = useState("overview");

  const [children,    setChildren]    = useState([]);
  const [selChild,    setSelChild]    = useState(null);
  const [detail,      setDetail]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [loadingD,    setLoadingD]    = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [inboxNotifs, setInboxNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const markAllRead = async () => {
    try { await notificationsAPI.markAllRead(); setInboxNotifs(n=>n.map(x=>({...x,is_read:true}))); setUnreadCount(0); } catch{}
  };

  useEffect(()=>{
    notificationsAPI.list().then(d=>{ setInboxNotifs(d.notifications||[]); setUnreadCount(d.unread||0); }).catch(()=>{});
  },[]);

  useEffect(()=>{
    parentAPI.children().then(d=>{
      const kids = Array.isArray(d) ? d : (d.children||d.results||[]);
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
  const scoreBg    = p => p>=80?"#ECFDF5":p>=60?"#FEF3C7":"#FEF2F2";

  const navTo = (id) => { setTab(id); setSidebarOpen(false); };
  const firstName = user?.first_name || user?.full_name || "P";

  return (
    <div className="p-root">
      <style>{S}</style>

      <div className={`p-overlay${sidebarOpen?" open":""}`} onClick={()=>setSidebarOpen(false)}/>

      {/* ── SIDEBAR ── */}
      <aside className={`p-sidebar${sidebarOpen?" open":""}`}>
        <div className="p-logo">
          <div className="p-logo-icon">👨‍👩‍👦</div>
          <span className="p-logo-text">EduPortal</span>
        </div>
        <div className="p-user-chip">
          <div className="p-user-role">Parent</div>
          <div className="p-user-name">{user?.full_name||user?.first_name||"Parent"}</div>
        </div>
        <nav className="p-nav">
          {NAV.map(n=>(
            <button key={n.id} className={`p-nav-btn${tab===n.id?" active":""}`} onClick={()=>navTo(n.id)}>
              <span style={{fontSize:14,width:18,textAlign:"center"}}>{n.icon}</span>
              {n.label}
            </button>
          ))}
          <button className="p-nav-btn" onClick={()=>{ navigate("/profile"); setSidebarOpen(false); }}>
            <span style={{fontSize:14,width:18,textAlign:"center"}}>👤</span> My Profile
          </button>
        </nav>
        <div className="p-nav-footer">
          <button className="p-nav-btn" style={{color:"var(--red)"}} onClick={()=>{logout();navigate("/");}}>
            <span style={{fontSize:14}}>→</span> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="p-main">
        <header className="p-header">
          <div className="p-header-left">
            <button className="p-hamburger" onClick={()=>setSidebarOpen(true)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="p-header-title">{NAV.find(n=>n.id===tab)?.label||"Parent Portal"}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>{setTab("notifications");markAllRead();}}
              style={{position:"relative",background:"none",border:"none",cursor:"pointer",fontSize:20,padding:4,lineHeight:1}}>
              🔔
              {unreadCount>0 && (
                <span style={{position:"absolute",top:-2,right:-2,background:"#EF4444",color:"#fff",
                  borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:800,
                  display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
                  {unreadCount>9?"9+":unreadCount}
                </span>
              )}
            </button>
            <div className="p-avatar">{firstName.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="p-content">

          {/* Loading */}
          {loading && (
            <LoadingSpinner color="#D97706" text="Loading your children's data..."/>
          )}

          {/* No children */}
          {!loading && children.length===0 && (
            <div className="p-no-children fade">
              <div className="p-no-children-icon">👨‍👩‍👦</div>
              <div className="p-no-children-title">No children linked yet</div>
              <div className="p-no-children-sub">Please ask the school admin to link your children to your account.</div>
            </div>
          )}

          {/* Has children */}
          {!loading && children.length>0 && (
            <>
              {/* Child selector — only if multiple */}
              {children.length>1 && (
                <div className="p-child-tabs">
                  {children.map(c=>(
                    <button key={c.id} className={`p-child-tab${selChild?.id===c.id?" active":""}`}
                      onClick={()=>setSelChild(c)}>
                      {c.full_name}
                    </button>
                  ))}
                </div>
              )}

              {/* ══ OVERVIEW ══ */}
              {tab==="overview" && selChild && (
                <div className="fade">
                  {/* Child info */}
                  <div className="p-child-card">
                    <div className="p-child-avatar">{selChild.full_name?.charAt(0)}</div>
                    <div className="p-child-info">
                      <div className="p-child-name">{selChild.full_name}</div>
                      <div className="p-child-meta">
                        {selChild.grade_name && <span>{selChild.grade_name}</span>}
                        {selChild.class_name && <span> · Class {selChild.class_name}</span>}
                        {selChild.teacher    && <span> · Teacher: <strong>{selChild.teacher}</strong></span>}
                      </div>
                    </div>
                    <button className="btn-amber-solid" onClick={handleDownloadPDF} disabled={downloading}>
                      {downloading ? "Downloading..." : "📄 Report Card"}
                    </button>
                  </div>

                  {/* KPIs */}
                  <div className="p-kpi-grid">
                    {[
                      ["Attendance Rate", detail ? detail.attendance?.rate+"%" : "—", scoreColor(detail?.attendance?.rate||0)],
                      ["Quiz Average",    detail ? detail.quizzes?.avg_score+"%" : "—", scoreColor(detail?.quizzes?.avg_score||0)],
                      ["Total Quizzes",   detail ? detail.quizzes?.total_taken : "—",  "#2563EB"],
                    ].map(([l,v,c])=>(
                      <div key={l} className="p-kpi">
                        <div className="p-kpi-val" style={{color:c}}>{v}</div>
                        <div className="p-kpi-label">{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Quick actions */}
                  <div className="p-card">
                    <div className="p-card-title">⚡ Quick Actions</div>
                    <div className="p-actions">
                      <button className="btn-blue" onClick={()=>navTo("detail")}>View Full Report →</button>
                      {selChild.teacher_id && (
                        <button className="btn-green-soft" onClick={()=>navTo("messages")}>Message Teacher →</button>
                      )}
                    </div>
                  </div>

                  {/* Recent attendance preview */}
                  {detail?.attendance?.records?.length>0 && (
                    <div className="p-card">
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                        <div className="p-card-title" style={{marginBottom:0}}>📅 Recent Attendance</div>
                        <span style={{fontWeight:700,fontSize:13,color:scoreColor(detail.attendance?.rate)}}>{detail.attendance?.rate}% rate</span>
                      </div>
                      <div className="p-att-dots">
                        {detail.attendance.records.slice(0,20).map((r,i)=>(
                          <div key={i} title={r.date} className="p-att-dot"
                            style={{
                              background: r.status==="present"?"#ECFDF5":r.status==="absent"?"#FEF2F2":"#FEF3C7",
                              borderColor: r.status==="present"?"#A7F3D0":r.status==="absent"?"#FECACA":"#FDE68A",
                              color: r.status==="present"?"#059669":r.status==="absent"?"#EF4444":"#D97706",
                            }}>
                            {r.status==="present"?"✓":r.status==="absent"?"✗":"~"}
                          </div>
                        ))}
                      </div>
                      <div className="p-att-legend">
                        <span>✓ Present</span><span>✗ Absent</span><span>~ Late</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ DETAIL ══ */}
              {tab==="detail" && (
                <div className="fade">
                  {loadingD
                    ? <LoadingSpinner color="#D97706" text="Loading details..."/>
                    : !detail
                      ? <div className="p-card"><div className="p-empty">No data available.</div></div>
                      : (
                        <>
                          {/* Attendance full */}
                          <div className="p-card">
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                              <div className="p-card-title" style={{marginBottom:0}}>📅 Attendance (last 30 days)</div>
                              <span style={{fontSize:13,fontWeight:700,color:scoreColor(detail.attendance?.rate)}}>{detail.attendance?.rate}% rate</span>
                            </div>
                            <div className="p-att-dots">
                              {detail.attendance?.records?.map((r,i)=>(
                                <div key={i} title={r.date} className="p-att-dot"
                                  style={{
                                    background: r.status==="present"?"#ECFDF5":r.status==="absent"?"#FEF2F2":"#FEF3C7",
                                    borderColor: r.status==="present"?"#A7F3D0":r.status==="absent"?"#FECACA":"#FDE68A",
                                    color: r.status==="present"?"#059669":r.status==="absent"?"#EF4444":"#D97706",
                                  }}>
                                  {r.status==="present"?"✓":r.status==="absent"?"✗":"~"}
                                </div>
                              ))}
                            </div>
                            {(!detail.attendance?.records||detail.attendance.records.length===0) && (
                              <div className="p-empty">No attendance records yet.</div>
                            )}
                            <div className="p-att-legend">
                              <span>✓ Present</span><span>✗ Absent</span><span>~ Late</span>
                            </div>
                          </div>

                          {/* Quiz results */}
                          <div className="p-card">
                            <div className="p-card-title">📝 Quiz Results</div>
                            {!detail.quizzes?.attempts?.length
                              ? <div className="p-empty">No quiz attempts yet.</div>
                              : detail.quizzes.attempts.map((q,i)=>(
                                <div key={i} className="p-quiz-row">
                                  <span className="p-quiz-title">{q.quiz_title}</span>
                                  <div className="p-quiz-meta">
                                    <span style={{color:"var(--muted)"}}>{q.score}/{q.total_points}</span>
                                    <span style={{fontWeight:700,color:scoreColor(q.percentage)}}>{q.percentage}%</span>
                                    <span style={{fontSize:11,color:"var(--faint)"}}>{q.submitted_at}</span>
                                  </div>
                                </div>
                              ))
                            }
                          </div>

                          {/* Assignments */}
                          {detail.assignments?.length>0 && (
                            <div className="p-card">
                              <div className="p-card-title">📋 Assignments</div>
                              {detail.assignments.map((a,i)=>(
                                <div key={i} className="p-asgn-row">
                                  <div style={{minWidth:0}}>
                                    <div className="p-asgn-title">{a.title}</div>
                                    <div className="p-asgn-due">Due: {a.due_date}</div>
                                  </div>
                                  <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                                    {a.score!=null && (
                                      <span style={{fontWeight:700,color:scoreColor(a.score/a.max_score*100)}}>
                                        {a.score}/{a.max_score}
                                      </span>
                                    )}
                                    <span className="p-status-chip" style={{
                                      background: a.status==="graded"?"#ECFDF5":a.status==="submitted"?"#EFF6FF":a.status==="late"?"#FEF2F2":"#F1F5F9",
                                      color: a.status==="graded"?"#059669":a.status==="submitted"?"#2563EB":a.status==="late"?"#EF4444":"#64748B"
                                    }}>
                                      {a.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Download PDF button */}
                          <div className="p-card">
                            <div className="p-card-title">📄 Report Card</div>
                            <p style={{fontSize:13,color:"var(--muted)",marginBottom:14}}>
                              Download a full PDF report card for {selChild?.full_name}.
                            </p>
                            <button className="btn-amber-solid" onClick={handleDownloadPDF} disabled={downloading}>
                              {downloading ? "Downloading..." : "📄 Download PDF Report Card"}
                            </button>
                          </div>
                        </>
                      )
                  }
                </div>
              )}

              {/* ══ NOTIFICATIONS ══ */}
              {tab==="notifications" && (
                <div className="fade">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                    <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>
                      🔔 My Notifications
                      {unreadCount>0 && (
                        <span style={{marginLeft:8,background:"#EF4444",color:"#fff",
                          borderRadius:999,fontSize:10,fontWeight:800,padding:"2px 8px"}}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount>0 && (
                      <button className="btn-amber" style={{fontSize:12,padding:"6px 12px"}} onClick={markAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  {inboxNotifs.length===0 ? (
                    <div className="p-card">
                      <div className="p-empty">
                        <div className="p-empty-icon">📭</div>
                        No notifications yet.
                      </div>
                    </div>
                  ) : inboxNotifs.map(n=>{
                    const nt = NOTIF_TYPES.find(t=>t.value===n.notif_type);
                    return (
                      <div key={n.id} className={`p-notif-item ${n.is_read?"read":"unread"}`}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:999,
                              background:nt?.bg||"var(--bg)",color:nt?.color||"var(--muted)"}}>
                              {n.notif_type}
                            </span>
                            <span style={{fontWeight:700,fontSize:13,color:"var(--text)"}}>{n.title}</span>
                            {!n.is_read && <span style={{width:7,height:7,borderRadius:"50%",background:"#EF4444",display:"inline-block",flexShrink:0}}/>}
                          </div>
                          <span style={{fontSize:11,color:"var(--faint)",whiteSpace:"nowrap"}}>
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{fontSize:12,color:"var(--muted)",lineHeight:1.5,marginBottom:n.file_url?6:0}}>{n.message}</p>
                        {n.file_url && (
                          <a href={n.file_url} target="_blank" rel="noreferrer"
                            style={{fontSize:11,color:"var(--amber)",fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}>
                            📎 View Attachment
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ══ MESSAGES ══ */}
              {tab==="messages" && (
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
