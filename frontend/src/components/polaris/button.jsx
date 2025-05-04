export function Button({children,click,disabled,tone}) {
  return (
  !children && !disabled && !click ?
  <>
  [Button click=function to handle] your text [/Button]
  </> :
  <>
    <div style={{opacity:disabled ? "0.5" : "1",border: tone === "white" ? "" : "solid 1px #303030",borderRadius:"10px",cursor:"pointer"}}
        onClick={click}
        >
            <div style={{
                borderRadius:"8px",
                borderTop: tone === "white" ? "1px solid #f1f1f1" : "1px solid #646464",
                borderLeft: tone === "white" ? "1px solid #f1f1f1" : "1px solid #646464",
                borderRight: tone === "white" ? "1px solid #f1f1f1" : "1px solid #646464",
                borderBottom: tone === "white" ? "1px solid #d6d6d6" : "1px solid #0a0a0a",
                color: tone === "white" ? "black" : "white",
                backgroundColor: tone === "white" ? "white" : "#343434",
                padding:"2px 0",
                textAlign:"center",
                fontSize:"0.8rem"}}>
                {children}
            </div>
        </div>
  </>
  )
}
