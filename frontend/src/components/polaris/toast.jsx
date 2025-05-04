import { Spinner } from "./spinner";

export function Toast({ children, status }) {
  if(!children && !status){
    return <>[Toast status = true or null]text of children[/Toast]</>
  }
  const toastStyle = {
    position: "fixed",
    bottom: "0",
    left: "0",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    transform: status ? "translateY(0)" : "translateY(100%)",
    opacity: status ? "1" : "0",
    transition: "transform 0.5s ease-in-out, opacity 0.5s ease-in-out",
  };

  return (
    <div style={toastStyle}>
      <div style={{ width: "fit-content", margin: "auto", display: "flex" }}>
        <div
          style={{
            border: "solid 1px #303030",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              height:"33px",
              borderRadius: "8px",
              borderTop: "1px solid #646464",
              borderLeft: "1px solid #646464",
              borderRight: "1px solid #646464",
              borderBottom: "1px solid #0a0a0a",
              backgroundColor: "#343434",
              color: "white",
              padding: "5px 30px",
              display: "flex",
              fontSize: "0.8rem",
            }}
          >
            <Spinner color="white"/>
            <div
              style={{
                marginLeft: "10px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span style={{minWidth:"60px"}}>
                <i>{children}</i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
