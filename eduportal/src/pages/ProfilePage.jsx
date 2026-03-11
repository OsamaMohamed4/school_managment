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
    <div style={{minHeight:"100vh",background:"#F1F5F9",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;} .inp{width:100%;padding:10px 13px;border:1.5px solid #E2E8F0;border-radius:9px;font-size:14px;font-family:inherit;outline:none;background:#F8FAFC;transition:border .2s;} .inp:focus{border-color:${color};background:#fff;} .inp.err{border-color:#EF4444;} .btn{padding:10px 20px;border-radius:9px;border:none;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;transition:all .2s;}`}</style>

      {/* Header */}
      <header style={{background:"#fff",borderBottom:"1.5px solid #E2E8F0",padding:"0 24px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>navigate(DASHBOARD[user?.role]||"/")}
          style={{background:"none",border:"none",color:color,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
          ← Back to Dashboard
        </button>
        <span style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:15,color:"#0F172A"}}>EduPortal</span>
      </header>

      <div style={{maxWidth:600,margin:"32px auto",padding:"0 16px"}}>

        {/* Avatar + name */}
        <div style={{background:"#fff",borderRadius:18,padding:28,border:"1.5px solid #E2E8F0",marginBottom:16,textAlign:"center"}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:bg,border:`3px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:800,color:color,margin:"0 auto 14px"}}>
            {(profile.first_name||"?").charAt(0).toUpperCase()}
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:800,color:"#0F172A"}}>{profile.full_name||`${profile.first_name} ${profile.last_name}`}</div>
          <div style={{display:"inline-flex",marginTop:8,padding:"3px 14px",borderRadius:999,background:bg,color:color,fontSize:13,fontWeight:700,textTransform:"capitalize"}}>{profile.role}</div>
          <div style={{fontSize:12,color:"#94A3B8",marginTop:8}}>Member since {profile.date_joined}</div>
        </div>

        {/* Edit profile */}
        <div style={{background:"#fff",borderRadius:18,padding:24,border:"1.5px solid #E2E8F0",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <h3 style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>Profile Information</h3>
            {!editing&&<button className="btn" style={{background:bg,color:color,padding:"7px 16px",fontSize:13}} onClick={()=>setEditing(true)}>Edit</button>}
          </div>
          {!editing?(
            <div style={{display:"grid",gap:10}}>
              {[["Email",profile.email],["First Name",profile.first_name],["Last Name",profile.last_name]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:"#F8FAFC",borderRadius:9,fontSize:13}}>
                  <span style={{color:"#64748B",fontWeight:600}}>{l}</span>
                  <span style={{color:"#0F172A",fontWeight:500}}>{v}</span>
                </div>
              ))}
            </div>
          ):(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>First Name</label><input className="inp" value={firstName} onChange={e=>setFirstName(e.target.value)}/></div>
                <div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Last Name</label><input className="inp" value={lastName} onChange={e=>setLastName(e.target.value)}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn" style={{background:color,color:"#fff",flex:1}} onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
                <button className="btn" style={{background:"#F1F5F9",color:"#475569",flex:1}} onClick={()=>setEditing(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Change password */}
        <div style={{background:"#fff",borderRadius:18,padding:24,border:"1.5px solid #E2E8F0"}}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:18}}>Change Password</h3>
          <div style={{display:"grid",gap:10,marginBottom:14}}>
            {[["Current Password",oldPass,setOldPass],["New Password",newPass,setNewPass],["Confirm New Password",confPass,setConfPass]].map(([l,v,set])=>(
              <div key={l}><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>{l}</label><input className={`inp${passErr?" err":""}`} type="password" value={v} onChange={e=>{set(e.target.value);setPassErr("");setPassOk("");}}/></div>
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
