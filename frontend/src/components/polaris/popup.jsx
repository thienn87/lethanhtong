export function Popup({status,children}) {
    if(!status && !children){
        return <>[Popup status true or null]text of children[/Popup]</>;
    }
  return (
    <>
        <div style={{position:"fixed",top:"0",left:"0",zIndex:"9999999",height:"100vh",width:"100vw",backgroundColor:"#0000007a", display: status !== null ? "flex" : "none",}}>
            <div style={{width:"calc(100vw - 50px)",height:"fit-content",maxWidth:"1000px",margin:"50px auto",backgroundColor:"#f3f3f3",borderRadius:"25px",padding:" 0"}}>
                    {children}
            </div>
        </div>
    </>
    );
}
