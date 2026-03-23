import { useState, useEffect, useRef } from "react";
import { videosAPI, academicsAPI } from "../api";
import { useAuth } from "../context/AuthContext";

export default function VideosPanel({ accentColor="#059669", accentBg="#ECFDF5" }) {
  const { user }           = useAuth();
  const isTeacher           = user?.role === "teacher";
  const [videos,   setVideos]   = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [uploading,setUploading]= useState(false);
  const [progress, setProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [selVideo, setSelVideo] = useState(null);
  const [toast,    setToast]    = useState(null);
  const fileRef  = useRef(null);

  const [form, setForm] = useState({
    title:"", description:"", subject:"", class_room:"", file: null
  });

  const SUBJECTS = ["Math","English","Arabic","Science","Social Studies",
                    "Islamic","Computer","Art","P.E","Other"];

  const showToast = (msg,type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const d = await videosAPI.list();
      setVideos(d.videos||[]);
    } catch { showToast("Failed to load videos","error"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{
    load();
    if (isTeacher) {
      academicsAPI.classes.myClasses()
        .then(d => setClasses(Array.isArray(d)?d:(d.results||[])))
        .catch(()=>{});
    }
  },[]);

  const handleUpload = async () => {
    if (!form.title.trim())  { showToast("Enter a title","error"); return; }
    if (!form.class_room)    { showToast("Select a class","error"); return; }
    if (!form.file)          { showToast("Select a video file","error"); return; }
    if (form.file.size > 100*1024*1024) {
      showToast(`File too large. Max 100MB (yours: ${(form.file.size/1024/1024).toFixed(1)}MB)`,"error");
      return;
    }

    const fd = new FormData();
    fd.append("title",       form.title);
    fd.append("description", form.description);
    fd.append("subject",     form.subject);
    fd.append("class_room",  form.class_room);
    fd.append("file",        form.file);

    setUploading(true);
    setProgress(0);

    // Simulate progress (real XHR progress needs XMLHttpRequest)
    const interval = setInterval(()=>{
      setProgress(p => p < 85 ? p + Math.random()*8 : p);
    }, 400);

    try {
      await videosAPI.upload(fd);
      clearInterval(interval);
      setProgress(100);
      showToast("Video uploaded! ✓");
      setTimeout(()=>{ setProgress(0); setUploading(false); }, 800);
      setShowForm(false);
      setForm({title:"",description:"",subject:"",class_room:"",file:null});
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch(e) {
      clearInterval(interval);
      setUploading(false);
      setProgress(0);
      showToast(e?.error||"Upload failed","error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this video?")) return;
    try {
      await videosAPI.delete(id);
      showToast("Deleted!");
      setVideos(vs => vs.filter(v=>v.id!==id));
      if (selVideo?.id===id) setSelVideo(null);
    } catch { showToast("Failed","error"); }
  };

  const formatSize = (mb) => mb >= 1 ? `${mb}MB` : "<1MB";
  const formatDate = (d)  => new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});

  return (
    <div>
      <style>{`
        .vid-card{background:#fff;border-radius:13px;padding:16px;border:1.5px solid #E2E8F0;
          margin-bottom:10px;cursor:pointer;transition:all .18s;}
        .vid-card:hover{border-color:${accentColor};box-shadow:0 2px 12px ${accentColor}22;}
        .vid-card.active{border-color:${accentColor};background:${accentBg};}
        .v-inp{width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:8px;
          font-size:13px;font-family:inherit;outline:none;background:#F8FAFC;color:#0F172A;}
        .v-inp:focus{border-color:${accentColor};background:#fff;}
        .prog-bar{height:6px;background:#E2E8F0;border-radius:3px;overflow:hidden;margin-top:8px;}
        .prog-fill{height:100%;border-radius:3px;background:${accentColor};transition:width .3s ease;}
      `}</style>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h3 style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>
          🎬 Videos ({videos.length})
        </h3>
        {isTeacher && (
          <button onClick={()=>setShowForm(true)}
            style={{padding:"8px 16px",background:accentColor,color:"#fff",border:"none",
              borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            + Upload Video
          </button>
        )}
      </div>

      <div style={{display:"grid",gridTemplateColumns:selVideo?"1fr 1.5fr":"1fr",gap:14}}>
        {/* Left: video list */}
        <div>
          {loading ? (
            <div style={{padding:32,textAlign:"center",color:"#94A3B8"}}>Loading...</div>
          ) : videos.length===0 ? (
            <div style={{textAlign:"center",padding:48,background:"#fff",borderRadius:14,
              border:"1.5px solid #E2E8F0",color:"#94A3B8"}}>
              <div style={{fontSize:40,marginBottom:10}}>🎬</div>
              <p>{isTeacher ? "No videos yet. Click \"+ Upload Video\" to start." : "No videos available yet."}</p>
            </div>
          ) : videos.map(v=>(
            <div key={v.id} className={`vid-card${selVideo?.id===v.id?" active":""}`}
              onClick={()=>setSelVideo(selVideo?.id===v.id ? null : v)}>
              {/* Thumbnail placeholder */}
              <div style={{background:"#0F172A",borderRadius:9,height:100,
                display:"flex",alignItems:"center",justifyContent:"center",
                marginBottom:10,position:"relative",overflow:"hidden"}}>
                <div style={{fontSize:36}}>▶️</div>
                <div style={{position:"absolute",bottom:6,right:8,background:"rgba(0,0,0,.7)",
                  color:"#fff",fontSize:10,padding:"2px 7px",borderRadius:4}}>
                  {formatSize(v.file_size_mb)}
                </div>
              </div>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#0F172A",marginBottom:3}}>
                    {v.title}
                  </div>
                  <div style={{fontSize:12,color:"#64748B"}}>
                    {v.subject && <span style={{background:accentBg,color:accentColor,
                      padding:"1px 7px",borderRadius:999,fontSize:11,fontWeight:600,marginRight:6}}>
                      {v.subject}
                    </span>}
                    Class {v.class_name} · {v.teacher_name}
                  </div>
                  <div style={{fontSize:11,color:"#94A3B8",marginTop:3}}>
                    {formatDate(v.created_at)}
                  </div>
                </div>
                {isTeacher && (
                  <button onClick={e=>{e.stopPropagation();handleDelete(v.id);}}
                    style={{background:"none",border:"none",color:"#EF4444",
                      cursor:"pointer",fontSize:16,padding:"2px 6px",flexShrink:0}}>
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right: video player */}
        {selVideo && (
          <div style={{background:"#fff",borderRadius:14,border:"1.5px solid #E2E8F0",
            overflow:"hidden",position:"sticky",top:16,height:"fit-content"}}>
            <video controls style={{width:"100%",background:"#000",maxHeight:320}}
              src={selVideo.file_url} key={selVideo.id}>
              Your browser does not support video playback.
            </video>
            <div style={{padding:16}}>
              <div style={{fontWeight:700,fontSize:15,color:"#0F172A",marginBottom:6}}>
                {selVideo.title}
              </div>
              {selVideo.description && (
                <p style={{fontSize:13,color:"#374151",marginBottom:10}}>
                  {selVideo.description}
                </p>
              )}
              <div style={{display:"flex",gap:8,flexWrap:"wrap",fontSize:12,color:"#64748B"}}>
                {selVideo.subject && (
                  <span style={{background:accentBg,color:accentColor,padding:"2px 8px",
                    borderRadius:999,fontWeight:600}}>
                    {selVideo.subject}
                  </span>
                )}
                <span>👤 {selVideo.teacher_name}</span>
                <span>🏫 Class {selVideo.class_name}</span>
                <span>📦 {formatSize(selVideo.file_size_mb)}</span>
              </div>
              <button onClick={()=>setSelVideo(null)}
                style={{marginTop:12,width:"100%",padding:"8px",borderRadius:8,
                  border:"1.5px solid #E2E8F0",background:"#F8FAFC",color:"#475569",
                  fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                ✕ Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showForm && (
        <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",
          display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,
          backdropFilter:"blur(4px)"}}>
          <div style={{background:"#fff",borderRadius:18,padding:28,width:480,
            maxWidth:"94vw",maxHeight:"90vh",overflowY:"auto"}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,
              fontSize:18,marginBottom:4,color:"#0F172A"}}>
              Upload Video
            </h3>
            <p style={{fontSize:12,color:"#64748B",marginBottom:18}}>
              Max 100MB · MP4, MOV, AVI, MKV, WebM
            </p>

            <div style={{marginBottom:10}}>
              <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>
                Title *
              </label>
              <input className="v-inp" value={form.title}
                onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                placeholder="e.g. Chapter 5 — Fractions"/>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>
                  Class *
                </label>
                <select className="v-inp" value={form.class_room}
                  onChange={e=>setForm(f=>({...f,class_room:e.target.value}))}>
                  <option value="">— Select Class —</option>
                  {classes.map(c=>(
                    <option key={c.id} value={c.id}>
                      {c.grade_name||""} — Class {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>
                  Subject
                </label>
                <select className="v-inp" value={form.subject}
                  onChange={e=>setForm(f=>({...f,subject:e.target.value}))}>
                  <option value="">— Select Subject —</option>
                  {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{marginBottom:10}}>
              <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>
                Description
              </label>
              <textarea className="v-inp" rows={2} value={form.description}
                onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                placeholder="Optional description..." style={{resize:"none"}}/>
            </div>

            {/* File picker */}
            <div style={{marginBottom:20}}>
              <label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>
                Video File *
              </label>
              <input ref={fileRef} type="file"
                accept=".mp4,.mov,.avi,.mkv,.webm,video/*"
                onChange={e=>setForm(f=>({...f,file:e.target.files[0]||null}))}
                style={{display:"none"}} id="video-file-input"/>
              <label htmlFor="video-file-input" style={{
                display:"inline-flex",alignItems:"center",gap:8,padding:"10px 16px",
                borderRadius:9,border:`2px dashed ${accentColor}`,background:accentBg,
                color:accentColor,fontWeight:700,fontSize:13,cursor:"pointer"
              }}>
                🎬 {form.file ? form.file.name : "Choose Video File"}
              </label>
              {form.file && (
                <div style={{fontSize:12,color:"#64748B",marginTop:6}}>
                  Size: {(form.file.size/1024/1024).toFixed(1)}MB
                  {form.file.size > 100*1024*1024 && (
                    <span style={{color:"#EF4444",fontWeight:700}}> — TOO LARGE!</span>
                  )}
                </div>
              )}

              {/* Upload progress bar */}
              {uploading && (
                <div className="prog-bar">
                  <div className="prog-fill" style={{width:`${progress}%`}}/>
                </div>
              )}
              {uploading && (
                <div style={{fontSize:12,color:accentColor,marginTop:4,fontWeight:600}}>
                  Uploading... {Math.round(progress)}%
                </div>
              )}
            </div>

            <div style={{display:"flex",gap:8}}>
              <button disabled={uploading} onClick={handleUpload} style={{
                flex:1,padding:"11px",
                background:uploading?"#94A3B8":accentColor,
                color:"#fff",border:"none",borderRadius:10,fontWeight:700,
                fontSize:14,cursor:uploading?"not-allowed":"pointer",fontFamily:"inherit"
              }}>
                {uploading ? `Uploading... ${Math.round(progress)}%` : "Upload Video"}
              </button>
              <button disabled={uploading} onClick={()=>setShowForm(false)} style={{
                flex:1,padding:"11px",background:"#F1F5F9",color:"#475569",
                border:"none",borderRadius:10,fontWeight:600,fontSize:14,
                cursor:"pointer",fontFamily:"inherit"
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{position:"fixed",bottom:22,right:22,padding:"12px 20px",
          borderRadius:11,fontSize:13,fontWeight:600,zIndex:300,maxWidth:360,
          background:toast.type==="success"?accentColor:"#EF4444",color:"#fff",
          boxShadow:"0 4px 20px rgba(0,0,0,0.2)"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
