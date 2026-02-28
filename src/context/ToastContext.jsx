import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null);

  const showToast = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {message &&
        createPortal(
          <div className="toast-overlay">
            <div className="toast">{message}</div>
          </div>,
          document.body
        )
      }
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);