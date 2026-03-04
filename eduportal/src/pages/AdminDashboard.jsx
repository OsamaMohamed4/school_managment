import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { usersAPI } from "../api";

/* ── Shared styles ── */
const S = {
  sidebar: { width:220, background:"#fff", borderRight:"1.5px solid #E2E8F0", display:"flex", flexDirection:"column", height:"100vh", position:"fixed", top:0, left:0 },
  main:    { marginLeft:220, minHeight:"100vh", background:"#F1F5F9" },
  header:  { background:"#fff", borderBottom:"1.5px solid #E2E8F0", padding:"0 28px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 },
  content: { padding:"28px" },
  card:    { background:"#fff", borderRadius:16, padding:"22px", border:"1.5px solid #E2E8F0" },
};

const NAV = [
  { id:"overview",  label:"Overview",        icon:"grid" },
  { id:"users",     label:"User Management",  icon:"users" },
  { id:"classes",   label:"Classes",          icon:"book" },
  { id:"reports",   label:"Reports",          icon:"chart" },
];

function NavIcon({ name }) {
  const icons = {
    grid:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    users:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    book:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
    chart:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    logout: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  };
  return icons[name] || null;
}

export default function AdminDashboard() {
  const { user, logout }    = useAuth();
  const navigate             = useNavigate();
  const [tab, setTab]        = useState("overview");
  const [users, setUsers]    = useState([]);
  const [loading, setLoading]= useState(false);
  const [search, setSearch]  = useState("");
  const [roleF, setRoleF]    = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser]     = useState({ first_name:"", last_name:"", email:"", role:"student", password:"" });
  const [toast, setToast]    = useState(null);
  const [formErr, setFormErr]= useState({});

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(()=>setToast(null),3000); };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleF !== "all") params.role = roleF;
      if (search) params.search = search;
      const data = await usersAPI.list(params);
      setUsers(data.results || data);
    } catch(e) { showToast("Failed to load users","error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, [roleF, search]);

  const handleToggle = async (id) => {
    try {
      const res = await usersAPI.toggleStatus(id);
      setUsers(u => u.map(x => x.id===id ? {...x, is_active:res.is_active} : x));
      showToast(res.message);
    } catch(e) { showToast("Action failed","error"); }
  };

  const validateNew = () => {
    const e={};
    if(!newUser.first_name) e.first_name="Required";
    if(!newUser.last_name)  e.last_name="Required";
    if(!newUser.email || !/\S+@\S+\.\S+/.test(newUser.email)) e.email="Valid email required";
    if(!newUser.password || newUser.password.length<6) e.password="Min 6 chars";
    return e;
  };

  const handleAddUser = async () => {
    const e = validateNew();
    if(Object.keys(e).length){ setFormErr(e); return; }
    try {
      const created = await usersAPI.create({ ...newUser, username: newUser.email.split("@")[0] });
      showToast(`${created.full_name} added successfully!`);
      setShowModal(false);
      setNewUser({ first_name:"", last_name:"", email:"", role:"student", password:"" });
      setFormErr({});
      loadUsers();
    } catch(err) { showToast(err?.email?.[0] || "Failed to create user","error"); }
  };

  const handleLogout = () => { logout(); navigate("/", { replace:true }); };

  const filtered = users.filter(u => {
    const name = `${u.first_name} ${u.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || u.email.includes(search.toLowerCase());
  });

  return (
    <div style={{ fontFamily:"'DM Sans', sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:3px}
        .nav-btn{display:flex;align-items:center;gap:9px;padding:9px 14px;border-radius:9px;border:none;background:none;width:100%;text-align:left;font-size:13px;font-weight:500;color:#64748B;cursor:pointer;transition:all .18s;font-family:inherit;}
        .nav-btn:hover{background:#F1F5F9;color:#0F172A;}
        .nav-btn.active{background:#EFF6FF;color:#2563EB;font-weight:700;}
        .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 15px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .18s;}
        .btn-blue{background:#2563EB;color:#fff;}.btn-blue:hover{background:#1D4ED8;}
        .btn-ghost{background:#F1F5F9;color:#475569;}.btn-ghost:hover{background:#E2E8F0;}
        .btn-red{background:#FEF2F2;color:#EF4444;font-size:12px;padding:5px 10px;}
        .btn-green{background:#ECFDF5;color:#059669;font-size:12px;padding:5px 10px;}
        .badge{display:inline-flex;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:600;}
        .badge-active{background:#ECFDF5;color:#059669;}.badge-inactive{background:#FEF2F2;color:#EF4444;}
        .badge-admin{background:#EFF6FF;color:#2563EB;}.badge-teacher{background:#ECFDF5;color:#059669;}.badge-student{background:#F5F3FF;color:#7C3AED;}
        .tr{display:grid;grid-template-columns:2fr 1fr 2fr .8fr .9fr;align-items:center;padding:13px 18px;border-bottom:1px solid #F1F5F9;font-size:13px;}
        .tr:hover{background:#FAFBFD;}
        .field{margin-bottom:14px;}.field label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;}
        .field input,.field select{width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-size:13px;color:#0F172A;background:#F8FAFC;outline:none;font-family:inherit;transition:border-color .2s;}
        .field input:focus,.field select:focus{border-color:#2563EB;background:#fff;}
        .field input.err{border-color:#EF4444;}.ferr{color:#EF4444;font-size:11px;margin-top:3px;}
        .modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(3px);}
        .modal{background:#fff;border-radius:20px;padding:30px;width:420px;max-width:92vw;box-shadow:0 24px 60px rgba(0,0,0,.12);}
        .toast{position:fixed;bottom:22px;right:22px;padding:13px 18px;border-radius:12px;font-size:13px;font-weight:600;z-index:200;animation:slideUp .3s ease;}
        .toast-s{background:#059669;color:#fff;}.toast-e{background:#EF4444;color:#fff;}
        @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        .fade{animation:fadeIn .35s ease;}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={{ padding:"18px 16px", borderBottom:"1.5px solid #F1F5F9", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, background:"#2563EB", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <span style={{ fontFamily:"'Playfair Display', serif", fontWeight:800, fontSize:16, color:"#0F172A" }}>EduPortal</span>
        </div>
        <div style={{ margin:"10px 10px 4px", background:"#EFF6FF", borderRadius:10, padding:"10px 12px", border:"1px solid #BFDBFE" }}>
          <div style={{ fontSize:10, color:"#2563EB", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Admin</div>
          <div style={{ fontSize:13, fontWeight:700, color:"#0F172A", marginTop:2 }}>{user?.full_name || user?.first_name || "Admin"}</div>
        </div>
        <nav style={{ flex:1, padding:"8px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
          {NAV.map(n => (
            <button key={n.id} className={`nav-btn ${tab===n.id?"active":""}`} onClick={()=>setTab(n.id)}>
              <NavIcon name={n.icon} />{n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:"10px 8px", borderTop:"1.5px solid #F1F5F9" }}>
          <button className="nav-btn" style={{ color:"#EF4444" }} onClick={handleLogout}>
            <NavIcon name="logout" />Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={S.main}>
        <header style={S.header}>
          <div>
            <h1 style={{ fontSize:15, fontWeight:700, color:"#0F172A" }}>{NAV.find(n=>n.id===tab)?.label}</h1>
            <p style={{ fontSize:11, color:"#94A3B8" }}>Admin Dashboard</p>
          </div>
          <div style={{ width:34, height:34, background:"#2563EB", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13 }}>
            {(user?.first_name||"A").charAt(0).toUpperCase()}
          </div>
        </header>

        <div style={S.content}>

          {/* ── OVERVIEW ── */}
          {tab==="overview" && (
            <div className="fade">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
                {[["Total Users",users.length,"#2563EB"],["Teachers",users.filter(u=>u.role==="teacher").length,"#059669"],["Students",users.filter(u=>u.role==="student").length,"#7C3AED"],["Active",users.filter(u=>u.is_active).length,"#D97706"]].map(([l,v,c])=>(
                  <div key={l} style={S.card}>
                    <div style={{ fontSize:28, fontWeight:800, fontFamily:"'Playfair Display',serif", color:"#0F172A" }}>{v}</div>
                    <div style={{ fontSize:13, color:"#64748B", marginTop:2 }}>{l}</div>
                    <div style={{ height:3, background:c+"20", borderRadius:2, marginTop:10 }}>
                      <div style={{ height:"100%", width:"70%", background:c, borderRadius:2 }}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Quick Actions</h3>
                <div style={{ display:"flex", gap:10 }}>
                  <button className="btn btn-blue" onClick={()=>setTab("users")}>Manage Users →</button>
                  <button className="btn btn-ghost" onClick={()=>setTab("classes")}>View Classes →</button>
                  <button className="btn btn-ghost" onClick={()=>setTab("reports")}>Reports →</button>
                </div>
              </div>
            </div>
          )}

          {/* ── USER MANAGEMENT ── */}
          {tab==="users" && (
            <div className="fade">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users..."
                    style={{ padding:"8px 14px", border:"1.5px solid #E2E8F0", borderRadius:9, fontSize:13, outline:"none", width:200 }} />
                  {["all","admin","teacher","student"].map(r=>(
                    <button key={r} className="btn" onClick={()=>setRoleF(r)}
                      style={{ background:roleF===r?"#2563EB":"#F1F5F9", color:roleF===r?"#fff":"#475569", textTransform:"capitalize", padding:"7px 12px" }}>
                      {r}
                    </button>
                  ))}
                </div>
                <button className="btn btn-blue" onClick={()=>setShowModal(true)}>+ Add User</button>
              </div>

              <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
                <div className="tr" style={{ background:"#F8FAFC", borderBottom:"1.5px solid #E2E8F0" }}>
                  {["Name","Role","Email","Status","Actions"].map(h=>(
                    <div key={h} style={{ fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:0.4 }}>{h}</div>
                  ))}
                </div>
                {loading ? (
                  <div style={{ padding:32, textAlign:"center", color:"#94A3B8" }}>Loading...</div>
                ) : filtered.length===0 ? (
                  <div style={{ padding:32, textAlign:"center", color:"#94A3B8" }}>No users found</div>
                ) : filtered.map(u=>(
                  <div key={u.id} className="tr">
                    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                      <div style={{ width:30, height:30, borderRadius:"50%", background:u.role==="admin"?"#EFF6FF":u.role==="teacher"?"#ECFDF5":"#F5F3FF", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12, color:u.role==="admin"?"#2563EB":u.role==="teacher"?"#059669":"#7C3AED", flexShrink:0 }}>
                        {(u.first_name||"?").charAt(0)}
                      </div>
                      <span style={{ fontWeight:600, color:"#0F172A", fontSize:13 }}>{u.full_name || `${u.first_name} ${u.last_name}`}</span>
                    </div>
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                    <span style={{ color:"#64748B", fontSize:12 }}>{u.email}</span>
                    <span className={`badge badge-${u.is_active?"active":"inactive"}`}>{u.is_active?"Active":"Inactive"}</span>
                    <button className={u.is_active?"btn btn-red":"btn btn-green"} onClick={()=>handleToggle(u.id)}>
                      {u.is_active?"Deactivate":"Activate"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CLASSES ── */}
          {tab==="classes" && (
            <div className="fade" style={S.card}>
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Classes — Coming in Phase 2</h3>
              <p style={{ color:"#64748B", fontSize:13 }}>Grade & Class management will be built in Phase 2.</p>
            </div>
          )}

          {/* ── REPORTS ── */}
          {tab==="reports" && (
            <div className="fade" style={S.card}>
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Reports — Coming in Phase 5</h3>
              <p style={{ color:"#64748B", fontSize:13 }}>Detailed reports will be available after attendance & quiz modules are complete.</p>
            </div>
          )}

        </div>
      </div>

      {/* ADD USER MODAL */}
      {showModal && (
        <div className="modal-bg" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:20, marginBottom:5 }}>Add New User</h2>
            <p style={{ fontSize:13, color:"#64748B", marginBottom:20 }}>Fill in the account details</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
              {[["first_name","First Name"],["last_name","Last Name"]].map(([k,l])=>(
                <div key={k} className="field" style={{ paddingRight:k==="first_name"?8:0 }}>
                  <label>{l}</label>
                  <input className={formErr[k]?"err":""} value={newUser[k]} onChange={e=>setNewUser(u=>({...u,[k]:e.target.value}))} />
                  {formErr[k]&&<div className="ferr">{formErr[k]}</div>}
                </div>
              ))}
            </div>
            {[["email","Email","email"],["password","Password","password"]].map(([k,l,t])=>(
              <div key={k} className="field">
                <label>{l}</label>
                <input type={t} className={formErr[k]?"err":""} placeholder={k==="email"?"user@school.edu":"min 6 characters"} value={newUser[k]} onChange={e=>setNewUser(u=>({...u,[k]:e.target.value}))} />
                {formErr[k]&&<div className="ferr">{formErr[k]}</div>}
              </div>
            ))}
            <div className="field">
              <label>Role</label>
              <select value={newUser.role} onChange={e=>setNewUser(u=>({...u,role:e.target.value}))}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display:"flex", gap:8, marginTop:4 }}>
              <button className="btn btn-blue" style={{ flex:1, justifyContent:"center", padding:"11px" }} onClick={handleAddUser}>Create User</button>
              <button className="btn btn-ghost" style={{ flex:1, justifyContent:"center", padding:"11px" }} onClick={()=>setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type==="success"?"s":"e"}`}>{toast.msg}</div>}
    </div>
  );
}
