import "../../src/animations.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api";

const ROLE_COLOR = { admin:"#2563EB", teacher:"#059669", student:"#7C3AED", parent:"#D97706" };
const ROLE_BG    = { admin:"#EFF6FF", teacher:"#ECFDF5", student:"#F5F3FF", parent:"#FEF3C7" };

export default function ProfilePage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const color    = ROLE_COLOR[user?.role] || "#2563EB";
  const bg       = ROLE_BG[user?.role]    || "#EFF6FF";

  const [profile,   setProfile]   = useState({ first_name:"", last_name:"", email:"", role:"", date_joined:"" });
  const [editing,   setEditing]   = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [saving,    setSaving]    = useState(false);

  const [oldPass,   setOldPass]   = useState("");
  const [newPass,   setNewPass]   = useState("");
  const [confPass,  setConfPass]  = useState("");
  const [passErr,   setPassErr]   = useState("");
  const [passOk,    setPassOk]    = useState("");
  const [changingP, setChangingP] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(()=>{
    authAPI.me().then(d=>{
      setProfile(d);
      setFirstName(d.first_name);
      setLastName(d.last_name);
    }).catch(()=>{});
  },[]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ first_name: firstName, last_name: lastName });
      showToast("Profile updated!");
      setProfile(p=>({...p, first_name:firstName, last_name:lastName, full_name:res.full_name}));
      login({...user, first_name:firstName, last_name:lastName, full_name:res.full_name});
      setEditing(false);
    } catch { showToast("Failed to update","error"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    setPassErr(""); setPassOk("");
    if (!oldPass||!newPass||!confPass){ setPassErr("All fields required."); return; }
    if (newPass !== confPass){ setPassErr("New passwords don't match."); return; }
    if (newPass.length < 6){ setPassErr("Password must be at least 6 characters."); return; }
    setChangingP(true);
    try {
      await authAPI.changePassword(oldPass, newPass);
      setPassOk("Password changed! Please login again.");
      setOldPass(""); setNewPass(""); setConfPass("");
      setTimeout(()=>{ logout(); navigate("/"); }, 2000);
    } catch(e){ setPassErr(e?.error||"Failed."); }
    finally { setChangingP(false); }
  };

  const DASHBOARD = { admin:"/admin/dashboard", teacher:"/teacher/dashboard", student:"/student/dashboard", parent:"/parent/dashboard" };

  return (
    <div style={{minHeight:"100vh",background:"#0F172A",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  .nb{display:flex;align-items:center;gap:9px;padding:9px 13px;border-radius:10px;border:none;background:none;width:100%;font-size:13px;font-weight:500;color:#64748B;cursor:pointer;font-family:'Sora',sans-serif;transition:all 0.18s ease;}
  .nb:hover{background:rgba(255,255,255,0.05);color:#CBD5E1;transform:translateX(3px);}
  .nb.a{background:#3B82F622;color:#60A5FA;font-weight:700;box-shadow:inset 2px 0 0 #3B82F6;}
  .btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;border:none;font-family:'Sora',sans-serif;transition:all 0.18s;}
  .btn:hover:not(:disabled){transform:translateY(-1px);}
  .bp{background:#3B82F6;color:#fff;} .bp:hover{opacity:0.9;}
  .bgh{background:#3B82F622;color:#60A5FA;border:1px solid #3B82F644;}
  .bgr{background:rgba(239,68,68,0.15);color:#F87171;border:1px solid rgba(239,68,68,0.2);}
  .bgs{background:rgba(16,185,129,0.15);color:#34D399;border:1px solid rgba(16,185,129,0.2);}
  .bgl{background:rgba(255,255,255,0.06);color:#94A3B8;border:1px solid rgba(255,255,255,0.1);}
  .card{background:rgba(255,255,255,0.04);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.08);}
  .stat-card{background:rgba(255,255,255,0.04);border-radius:16px;padding:22px 20px;border:1px solid rgba(255,255,255,0.08);animation:fadeUp 0.5s ease both;transition:transform 0.2s,box-shadow 0.2s;}
  .stat-card:hover{transform:translateY(-5px);box-shadow:0 20px 48px rgba(0,0,0,0.3);}
  .fade{animation:fadeUp 0.4s ease both;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  .s1{animation-delay:0.05s;}.s2{animation-delay:0.1s;}.s3{animation-delay:0.15s;}.s4{animation-delay:0.2s;}
  .inp{width:100%;padding:10px 13px;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;font-size:13px;color:#F1F5F9;outline:none;font-family:'Sora',sans-serif;transition:all 0.2s;}
  .inp::placeholder{color:#475569;} .inp:focus{border-color:#3B82F6;background:rgba(255,255,255,0.08);}
  .inp.err{border-color:#EF4444;} .ferr{color:#F87171;font-size:11px;margin-top:3px;}
  .sel{width:100%;padding:10px 13px;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;font-size:13px;color:#F1F5F9;outline:none;font-family:'Sora',sans-serif;}
  .lbl{display:block;font-size:11px;font-weight:700;color:#475569;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;}
  .field{margin-bottom:13px;}
  .trow{display:grid;padding:12px 16px;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.05);color:#94A3B8;transition:background 0.15s;}
  .trow:hover{background:rgba(255,255,255,0.03);}
  .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:100;}
  .modal{background:#1E293B;border-radius:20px;padding:28px;width:440px;max-width:94vw;border:1px solid rgba(255,255,255,0.1);animation:fadeUp 0.3s ease;box-shadow:0 40px 100px rgba(0,0,0,0.5);}
  .toast{position:fixed;bottom:24px;right:24px;padding:13px 18px;border-radius:12px;font-size:13px;font-weight:700;z-index:300;animation:slideToast 0.3s ease;font-family:'Sora',sans-serif;max-width:320px;}
  @keyframes slideToast{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  .ts{background:linear-gradient(135deg,#059669,#10B981);color:#fff;} .te{background:linear-gradient(135deg,#DC2626,#EF4444);color:#fff;}
  .badge{display:inline-flex;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;}
  .tab-btn{padding:7px 14px;border-radius:9px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);font-size:12px;font-weight:700;color:#64748B;cursor:pointer;font-family:'Sora',sans-serif;transition:all 0.18s;}
  .tab-btn.a{background:#3B82F622;color:#60A5FA;border-color:#3B82F644;}
  .sel-item{padding:11px 14px;border-radius:11px;border:1px solid rgba(255,255,255,0.08);margin-bottom:6px;cursor:pointer;background:rgba(255,255,255,0.03);transition:all 0.18s;}
  .sel-item:hover{border-color:#3B82F644;background:#3B82F611;}
  .sel-item.active{border-color:#3B82F6;background:#3B82F618;}
  .pbar{height:5px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;margin-top:5px;}
  .pfill{height:100%;border-radius:3px;transition:width 0.8s ease;}
  .spinner{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;animation:spin .6s linear infinite;display:inline-block;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .srow{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);margin-bottom:7px;cursor:pointer;transition:all 0.18s;background:rgba(255,255,255,0.03);}
  .srow:hover{border-color:#3B82F644;} .srow.p{border-color:#10B981;background:rgba(16,185,129,0.08);} .srow.ab{border-color:#EF4444;background:rgba(239,68,68,0.08);}
  .qcard{background:rgba(255,255,255,0.03);border-radius:11px;padding:14px 16px;border:1px solid rgba(255,255,255,0.08);margin-bottom:10px;}
  .b-mcq{background:rgba(59,130,246,0.2);color:#60A5FA;} .b-tf{background:rgba(16,185,129,0.2);color:#34D399;} .b-sa{background:rgba(245,158,11,0.2);color:#FBBF24;}
  .opt{width:100%;padding:11px 14px;border-radius:9px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);text-align:left;cursor:pointer;font-size:13px;color:#94A3B8;transition:all 0.2s;font-family:'Sora',sans-serif;display:flex;align-items:center;gap:10px;margin-bottom:7px;}
  .opt:hover{border-color:#3B82F644;background:#3B82F611;color:#E2E8F0;} .opt.sel{border-color:#3B82F6;background:#3B82F622;color:#60A5FA;font-weight:600;}
  .short-inp{width:100%;padding:10px 14px;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.1);border-radius:9px;font-size:13px;color:#F1F5F9;font-family:'Sora',sans-serif;outline:none;transition:border 0.2s;}
  .short-inp:focus{border-color:#3B82F6;}
  .gb-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;align-items:center;padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;color:#94A3B8;}
  .gb-row:hover{background:rgba(255,255,255,0.03);}
  .notif-type-btn{padding:7px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);font-size:12px;font-weight:600;cursor:pointer;font-family:'Sora',sans-serif;transition:all 0.18s;color:#64748B;}
  .tabbtn{padding:7px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);font-size:13px;font-weight:600;color:#64748B;cursor:pointer;font-family:'Sora',sans-serif;transition:all 0.18s;}
  .tabbtn.a{background:#3B82F622;color:#60A5FA;border-color:#3B82F644;}
  .unread-dot{width:18px;height:18px;background:#EF4444;border-radius:50%;font-size:10px;font-weight:800;color:#fff;display:flex;align-items:center;justify-content:center;margin-left:auto;}
  .choice-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
  .msg-item{padding:12px 14px;border-radius:11px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);cursor:pointer;transition:all .18s;margin-bottom:7px;}
  .msg-item:hover,.msg-item.sel{border-color:#3B82F644;background:#3B82F611;}
  .bubble{max-width:72%;padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.5;word-break:break-word;}
  .bubble.mine{background:#3B82F6;color:#fff;border-bottom-right-radius:4px;margin-left:auto;}
  .bubble.theirs{background:rgba(255,255,255,0.08);color:#E2E8F0;border-bottom-left-radius:4px;}
  .contact-btn{width:100%;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);cursor:pointer;font-family:'Sora',sans-serif;font-size:13px;text-align:left;transition:all .18s;margin-bottom:6px;color:#94A3B8;}
  .contact-btn:hover{border-color:#3B82F644;background:#3B82F611;color:#E2E8F0;}
  .msg-inp{flex:1;padding:10px 14px;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;font-size:13px;font-family:'Sora',sans-serif;outline:none;color:#F1F5F9;transition:border .2s;}
  .msg-inp:focus{border-color:#3B82F6;}
  .msg-inp::placeholder{color:#475569;}
  .asgn-card{background:rgba(255,255,255,0.04);border-radius:13px;padding:16px 18px;border:1px solid rgba(255,255,255,0.08);margin-bottom:10px;cursor:pointer;transition:all .18s;}
  .asgn-card:hover{border-color:#3B82F644;box-shadow:0 4px 20px rgba(0,0,0,0.2);}
  .asgn-inp{width:100%;padding:9px 12px;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.1);border-radius:8px;font-size:13px;font-family:'Sora',sans-serif;outline:none;color:#F1F5F9;}
  .asgn-inp:focus{border-color:#3B82F6;}
  .asgn-btn{padding:8px 16px;border-radius:9px;border:none;font-weight:600;font-size:13px;cursor:pointer;font-family:'Sora',sans-serif;transition:all .18s;}
  .tt-cell{padding:8px 10px;border-radius:9px;font-size:12px;position:relative;transition:all 0.2s;}
  .tt-del{position:absolute;top:4px;right:4px;background:#EF4444;color:#fff;border:none;border-radius:4px;font-size:10px;padding:2px 5px;cursor:pointer;opacity:0;transition:opacity .2s;}
  .tt-cell:hover .tt-del{opacity:1;}
  .tt-inp{width:100%;padding:8px 11px;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.1);border-radius:8px;font-size:13px;font-family:'Sora',sans-serif;outline:none;color:#F1F5F9;}
  .tt-inp:focus{border-color:#3B82F6;}
  .tt-sel{width:100%;padding:8px 11px;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.1);border-radius:8px;font-size:13px;font-family:'Sora',sans-serif;color:#F1F5F9;outline:none;}
`}</style>

      {/* Header */}
      <header style={{background:"rgba(13,21,38,0.9)",backdropFilter:"blur(12px)",borderBottom:"1px solid rgba(255,255,255,0.08)",padding:"0 24px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>navigate(DASHBOARD[user?.role]||"/")}
          style={{background:"none",border:"none",color:color,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
          ← Back to Dashboard
        </button>
        <span className="page-enter" style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:15,color:"#F1F5F9"}}>EduPortal</span>
      </header>

      <div style={{maxWidth:600,margin:"32px auto",padding:"0 16px"}}>

        {/* Avatar + name */}
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:18,padding:28,border:"1px solid rgba(255,255,255,0.08)",marginBottom:16,textAlign:"center"}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:bg,border:`3px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:800,color:color,margin:"0 auto 14px"}}>
            {(profile.first_name||"?").charAt(0).toUpperCase()}
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:800,color:"#F1F5F9"}}>{profile.full_name||`${profile.first_name} ${profile.last_name}`}</div>
          <div style={{display:"inline-flex",marginTop:8,padding:"3px 14px",borderRadius:999,background:bg,color:color,fontSize:13,fontWeight:700,textTransform:"capitalize"}}>{profile.role}</div>
          <div style={{fontSize:12,color:"#94A3B8",marginTop:8}}>Member since {profile.date_joined}</div>
        </div>

        {/* Edit profile */}
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:18,padding:24,border:"1px solid rgba(255,255,255,0.08)",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <h3 style={{fontSize:15,fontWeight:700,color:"#F1F5F9"}}>Profile Information</h3>
            {!editing&&<button className="btn" style={{background:bg,color:color,padding:"7px 16px",fontSize:13}} onClick={()=>setEditing(true)}>Edit</button>}
          </div>
          {!editing?(
            <div style={{display:"grid",gap:10}}>
              {[["Email",profile.email],["First Name",profile.first_name],["Last Name",profile.last_name]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:"#F8FAFC",borderRadius:9,fontSize:13}}>
                  <span style={{color:"#64748B",fontWeight:600}}>{l}</span>
                  <span style={{color:"#F1F5F9",fontWeight:500}}>{v}</span>
                </div>
              ))}
            </div>
          ):(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div><label style={{fontSize:12,fontWeight:600,color:"#CBD5E1",display:"block",marginBottom:5}}>First Name</label><input className="inp" value={firstName} onChange={e=>setFirstName(e.target.value)}/></div>
                <div><label style={{fontSize:12,fontWeight:600,color:"#CBD5E1",display:"block",marginBottom:5}}>Last Name</label><input className="inp" value={lastName} onChange={e=>setLastName(e.target.value)}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn" style={{background:color,color:"#fff",flex:1}} onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
                <button className="btn" style={{background:"#0F172A",color:"#64748B",flex:1}} onClick={()=>setEditing(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Change password */}
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:18,padding:24,border:"1px solid rgba(255,255,255,0.08)"}}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#F1F5F9",marginBottom:18}}>Change Password</h3>
          <div style={{display:"grid",gap:10,marginBottom:14}}>
            {[["Current Password",oldPass,setOldPass],["New Password",newPass,setNewPass],["Confirm New Password",confPass,setConfPass]].map(([l,v,set])=>(
              <div key={l}><label style={{fontSize:12,fontWeight:600,color:"#CBD5E1",display:"block",marginBottom:5}}>{l}</label><input className={`inp${passErr?" err":""}`} type="password" value={v} onChange={e=>{set(e.target.value);setPassErr("");setPassOk("");}}/></div>
            ))}
          </div>
          {passErr&&<div style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#EF4444"}}>{passErr}</div>}
          {passOk&&<div style={{background:"#ECFDF5",border:"1.5px solid #A7F3D0",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#059669"}}>{passOk}</div>}
          <button className="btn" style={{background:color,color:"#fff",width:"100%"}} onClick={handleChangePassword} disabled={changingP}>
            {changingP?"Changing...":"Change Password"}
          </button>
        </div>

      </div>
      {toast&&<div style={{position:"fixed",bottom:22,right:22,padding:"12px 18px",borderRadius:11,fontSize:13,fontWeight:600,zIndex:300,background:toast.type==="success"?"#059669":"#EF4444",color:"#fff"}}>{toast.msg}</div>}
    </div>
  );
}
