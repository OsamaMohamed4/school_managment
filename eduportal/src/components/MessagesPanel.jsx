import { useState, useEffect, useRef } from "react";
import { messagingAPI } from "../api";

export default function MessagesPanel({ accentColor="#2563EB", accentBg="#EFF6FF" }) {
  const [contacts,     setContacts]     = useState([]);
  const [convs,        setConvs]        = useState([]);
  const [selConv,      setSelConv]      = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [text,         setText]         = useState("");
  const [sending,      setSending]      = useState(false);
  const [view,         setView]         = useState("list"); // list | chat | new
  const bottomRef = useRef(null);

  useEffect(()=>{
    messagingAPI.conversations().then(setConvs).catch(()=>{});
    messagingAPI.contacts().then(setContacts).catch(()=>{});
  },[]);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[messages]);

  const openConv = async (conv) => {
    setSelConv(conv);
    const d = await messagingAPI.getConversation(conv.id);
    setMessages(d.messages||[]);
    setConvs(cs=>cs.map(c=>c.id===conv.id?{...c,unread_count:0}:c));
    setView("chat");
  };

  const startNew = async (userId) => {
    const conv = await messagingAPI.start(userId);
    setSelConv(conv);
    const d = await messagingAPI.getConversation(conv.id);
    setMessages(d.messages||[]);
    setView("chat");
    messagingAPI.conversations().then(setConvs).catch(()=>{});
  };

  const sendMsg = async () => {
    if (!text.trim()||!selConv) return;
    setSending(true);
    try {
      const msg = await messagingAPI.send(selConv.id, text.trim());
      setMessages(m=>[...m,msg]);
      setText("");
      setConvs(cs=>cs.map(c=>c.id===selConv.id?{...c,last_message:{text:msg.text,sender:"You"}}:c));
    } catch {}
    finally { setSending(false); }
  };

  const totalUnread = convs.reduce((a,c)=>a+(c.unread_count||0),0);

  return (
    <div style={{height:"calc(100vh - 120px)",display:"flex",gap:14,minHeight:400}}>
      <style>{`
        .msg-item{padding:12px 14px;border-radius:11px;border:1.5px solid #E2E8F0;background:#fff;cursor:pointer;transition:all .18s;margin-bottom:7px;}
        .msg-item:hover{border-color:${accentColor};background:${accentBg};}
        .msg-item.sel{border-color:${accentColor};background:${accentBg};}
        .bubble{max-width:72%;padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.5;word-break:break-word;}
        .bubble.mine{background:${accentColor};color:#fff;border-bottom-right-radius:4px;margin-left:auto;}
        .bubble.theirs{background:#F1F5F9;color:#0F172A;border-bottom-left-radius:4px;}
        .contact-btn{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid #E2E8F0;background:#fff;cursor:pointer;font-family:inherit;font-size:13px;text-align:left;transition:all .18s;margin-bottom:6px;}
        .contact-btn:hover{border-color:${accentColor};background:${accentBg};}
        .msg-inp{flex:1;padding:10px 14px;border:1.5px solid #E2E8F0;border-radius:10px;font-size:13px;font-family:inherit;outline:none;transition:border .2s;}
        .msg-inp:focus{border-color:${accentColor};}
      `}</style>

      {/* LEFT: Conversations list */}
      <div style={{width:240,display:"flex",flexDirection:"column",gap:0,flexShrink:0}}>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <button onClick={()=>setView("list")} style={{flex:1,padding:"7px",borderRadius:8,border:`1.5px solid ${view==="list"?accentColor:"#E2E8F0"}`,background:view==="list"?accentBg:"#fff",color:view==="list"?accentColor:"#64748B",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
            Chats {totalUnread>0&&<span style={{background:"#EF4444",color:"#fff",borderRadius:999,padding:"1px 6px",fontSize:10,marginLeft:4}}>{totalUnread}</span>}
          </button>
          <button onClick={()=>setView("new")} style={{flex:1,padding:"7px",borderRadius:8,border:`1.5px solid ${view==="new"?accentColor:"#E2E8F0"}`,background:view==="new"?accentBg:"#fff",color:view==="new"?accentColor:"#64748B",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
            + New
          </button>
        </div>

        <div style={{flex:1,overflowY:"auto"}}>
          {view==="list"&&(
            convs.length===0
              ?<div style={{textAlign:"center",color:"#94A3B8",padding:24,fontSize:13}}>No conversations yet.<br/>Click "+ New" to start.</div>
              :convs.map(c=>(
                <div key={c.id} className={`msg-item${selConv?.id===c.id?" sel":""}`} onClick={()=>openConv(c)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <span style={{fontWeight:700,fontSize:13,color:"#0F172A"}}>{c.other_user?.full_name||"Chat"}</span>
                    {c.unread_count>0&&<span style={{background:"#EF4444",color:"#fff",borderRadius:999,padding:"1px 7px",fontSize:10,fontWeight:700}}>{c.unread_count}</span>}
                  </div>
                  <div style={{fontSize:11,color:"#94A3B8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {c.last_message?.text||"No messages yet"}
                  </div>
                </div>
              ))
          )}
          {view==="new"&&(
            <>
              <p style={{fontSize:12,color:"#64748B",marginBottom:10,fontWeight:600}}>Start conversation with:</p>
              {contacts.length===0
                ?<p style={{fontSize:13,color:"#94A3B8"}}>No contacts available.</p>
                :contacts.map(c=>(
                  <button key={c.id} className="contact-btn" onClick={()=>startNew(c.id)}>
                    <div style={{fontWeight:700,color:"#0F172A"}}>{c.full_name}</div>
                    <div style={{fontSize:11,color:"#94A3B8",textTransform:"capitalize"}}>{c.role}</div>
                  </button>
                ))
              }
            </>
          )}
        </div>
      </div>

      {/* RIGHT: Chat */}
      <div style={{flex:1,display:"flex",flexDirection:"column",background:"#fff",borderRadius:14,border:"1.5px solid #E2E8F0",overflow:"hidden"}}>
        {!selConv?(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#94A3B8"}}>
            <div style={{fontSize:40,marginBottom:10}}>💬</div>
            <p style={{fontSize:14}}>Select a conversation or start a new one</p>
          </div>
        ):(
          <>
            <div style={{padding:"12px 16px",borderBottom:"1.5px solid #F1F5F9",background:"#FAFBFD"}}>
              <div style={{fontWeight:700,fontSize:14,color:"#0F172A"}}>{selConv.other_user?.full_name}</div>
              <div style={{fontSize:11,color:"#94A3B8",textTransform:"capitalize"}}>{selConv.other_user?.role}</div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:8}}>
              {messages.length===0&&<div style={{textAlign:"center",color:"#94A3B8",fontSize:13,margin:"auto"}}>No messages yet. Say hi! 👋</div>}
              {messages.map(m=>(
                <div key={m.id} style={{display:"flex",flexDirection:m.is_mine?"row-reverse":"row",gap:8,alignItems:"flex-end"}}>
                  {!m.is_mine&&<div style={{width:26,height:26,borderRadius:"50%",background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#64748B",flexShrink:0}}>{m.sender_name?.charAt(0)}</div>}
                  <div className={`bubble ${m.is_mine?"mine":"theirs"}`}>{m.text}</div>
                </div>
              ))}
              <div ref={bottomRef}/>
            </div>
            <div style={{padding:"10px 14px",borderTop:"1.5px solid #F1F5F9",display:"flex",gap:8}}>
              <input className="msg-inp" placeholder="Type a message..." value={text}
                onChange={e=>setText(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMsg()}/>
              <button onClick={sendMsg} disabled={sending||!text.trim()}
                style={{padding:"10px 18px",background:accentColor,color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",opacity:!text.trim()?0.5:1}}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
