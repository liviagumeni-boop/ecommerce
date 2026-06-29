import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* TOAST CONTAINER */}
 <div
  style={{
    position: "fixed",
    top: 20,
    right: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 10,
    zIndex: 99999,
  }}
>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              color: "white",
              fontWeight: 500,
              fontSize: 14,
              minWidth: 220,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              background:
                t.type === "success" ? "#22c55e" :
                t.type === "error"   ? "#ef4444" :
                t.type === "warning" ? "#f59e0b" :
                                       "#3b82f6",
              animation: "slideIn 0.3s ease",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(50px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}