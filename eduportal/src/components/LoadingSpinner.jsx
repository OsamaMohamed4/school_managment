export default function LoadingSpinner({ size=40, color="#2563EB", text="" }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,gap:14}}>
      <div style={{
        width:size, height:size, border:`3px solid #E2E8F0`,
        borderTop:`3px solid ${color}`, borderRadius:"50%",
        animation:"spin .8s linear infinite"
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {text&&<p style={{fontSize:13,color:"#64748B"}}>{text}</p>}
    </div>
  );
}
