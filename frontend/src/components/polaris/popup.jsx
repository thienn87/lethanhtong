export function Popup({status,children}) {
    if(!status && !children){
        return <>[Popup status true or null]text of children[/Popup]</>;
    }
  return (
    <>
        <div style={{
            position: "fixed",
            top: "0",
            left: "0",
            zIndex: "9999999",
            height: "100vh",
            width: "100vw",
            backgroundColor: "#0000007a", 
            display: status !== null ? "flex" : "none",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
        }}>
            <div style={{
                width: "calc(100vw - 50px)",
                maxHeight: "calc(100vh - 100px)", /* Limit height to viewport minus margins */
                maxWidth: "1000px",
                margin: "auto",
                backgroundColor: "#f3f3f3",
                borderRadius: "25px",
                padding: "0",
                overflowY: "auto", /* Enable vertical scrolling */
                overflowX: "hidden", /* Prevent horizontal scrolling */
                display: "flex",
                flexDirection: "column"
            }}>
                {children}
            </div>
        </div>
    </>
  );
}
