import { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [message, setMessage] = useState(null);

    const showToast = (text) => {
        setMessage(text);

        setTimeout(() => {
            setMessage(null);
        }, 2000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {message && (
                <div className="toast-overlay">
                    <div className="toast">
                        {message}
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);