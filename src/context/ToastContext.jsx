/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext();

const DEFAULT_DURATION = 2200;

export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null);
  const timeoutRef = useRef(null);

  const clearToastTimeout = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const hideToast = () => {
    clearToastTimeout();
    setMessage(null);
  };

  const showToast = (text, options = {}) => {
    clearToastTimeout();

    const nextMessage = typeof text === "string"
      ? { text, ...options }
      : { ...text };

    setMessage(nextMessage);
    timeoutRef.current = window.setTimeout(() => {
      setMessage(null);
      timeoutRef.current = null;
    }, nextMessage.duration || DEFAULT_DURATION);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {message &&
        createPortal(
          <div className="toast-overlay">
            <div className="toast">
              <span className="toast-text">{message.text}</span>

              {message.actionLabel && typeof message.onAction === "function" && (
                <button
                  type="button"
                  className="toast-action"
                  onClick={() => {
                    const onAction = message.onAction;
                    hideToast();
                    onAction();
                  }}
                >
                  {message.actionLabel}
                </button>
              )}
            </div>
          </div>,
          document.body
        )
      }
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
