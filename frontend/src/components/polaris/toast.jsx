import { Spinner } from "./spinner";
import { useEffect, useState } from "react";

export function Toast({ children, status, type = "success", duration = 3000 }) {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [toastType, setToastType] = useState(type);

  useEffect(() => {
    if (status === true) {
      setShow(true);
      setMessage(children);
      setToastType("success");
      
      // Auto-hide the toast after duration
      const timer = setTimeout(() => {
        setShow(false);
      }, duration);
      
      return () => clearTimeout(timer);
    } else if (status === false) {
      setToastType("error");
      setShow(true);
      setMessage(children);
      
      // Auto-hide the toast after duration
      const timer = setTimeout(() => {
        setShow(false);
      }, duration);
      
      return () => clearTimeout(timer);
    } else if (status && typeof status === 'object' && status.type) {
      // Handle object status with type and message
      setToastType(status.type);
      setShow(true);
      setMessage(status.message || children);
      
      // Auto-hide the toast after duration
      const timer = setTimeout(() => {
        setShow(false);
      }, duration);
      
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [status, children, duration]);

  if(!children && !status){
    return <>[Toast status = true or null]text of children[/Toast]</>
  }

  if (!show) return null;

  const getToastStyles = () => {
    // Base styles
    const baseStyle = {
      position: "fixed",
      bottom: "20px",
      left: "0",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      transition: "transform 0.5s ease-in-out, opacity 0.5s ease-in-out",
    };

    // Type-specific background colors
    const typeColors = {
      success: "#28a745",
      error: "#dc3545",
      warning: "#ffc107",
      info: "#17a2b8"
    };

    return baseStyle;
  };

  const getIconForType = () => {
    switch (toastType) {
      case "error":
        return <span style={{ color: "#ff4d4f" }}>✖</span>;
      case "warning":
        return <span style={{ color: "#faad14" }}>⚠</span>;
      case "info":
        return <span style={{ color: "#1890ff" }}>ℹ</span>;
      case "success":
      default:
        return <Spinner color="white" />;
    }
  };

  const getBorderColor = () => {
    switch (toastType) {
      case "error":
        return "#dc3545";
      case "warning":
        return "#ffc107";
      case "info":
        return "#17a2b8";
      case "success":
      default:
        return "#303030";
    }
  };

  const getBackgroundColor = () => {
    switch (toastType) {
      case "error":
        return "#450a0f";
      case "warning":
        return "#553c00";
      case "info":
        return "#0a3446";
      case "success":
      default:
        return "#343434";
    }
  };

  return (
    <div style={getToastStyles()}>
      <div style={{ width: "fit-content", margin: "auto", display: "flex" }}>
        <div
          style={{
            border: `solid 1px ${getBorderColor()}`,
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              height: "33px",
              borderRadius: "8px",
              borderTop: "1px solid #646464",
              borderLeft: "1px solid #646464",
              borderRight: "1px solid #646464",
              borderBottom: "1px solid #0a0a0a",
              backgroundColor: getBackgroundColor(),
              color: "white",
              padding: "5px 30px",
              display: "flex",
              fontSize: "0.8rem",
            }}
          >
            {getIconForType()}
            <div
              style={{
                marginLeft: "10px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span style={{ minWidth: "60px" }}>
                <i>{message}</i>
              </span>
            </div>
            <div 
              style={{ 
                marginLeft: "10px", 
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
              onClick={() => setShow(false)}
            >
              <span>✕</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
