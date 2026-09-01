import { createContext, useCallback, useContext, useRef, useState } from "react";

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const close = useCallback((result) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setDialog(null);
  }, []);

  const open = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog(options);
    });
  }, []);

  const confirm = useCallback((title, message, options = {}) =>
    open({ type: "confirm", title, message, ...options }), [open]);

  const prompt = useCallback((title, message, defaultValue = "", options = {}) =>
    open({ type: "prompt", title, message, defaultValue, ...options }), [open]);

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      {dialog && <AppDialog dialog={dialog} onClose={close} />}
    </DialogContext.Provider>
  );
}

function AppDialog({ dialog, onClose }) {
  const [value, setValue] = useState(dialog.defaultValue || "");
  const isPrompt = dialog.type === "prompt";

  return (
    <div className="app-dialog-overlay" onMouseDown={() => onClose(isPrompt ? null : false)}>
      <div
        className="app-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="app-dialog-close"
          aria-label="Close dialog"
          onClick={() => onClose(isPrompt ? null : false)}
        >
          ×
        </button>
        <div className={`app-dialog-icon ${dialog.tone || "default"}`} aria-hidden="true">
          {dialog.tone === "danger" ? "!" : isPrompt ? "✎" : "?"}
        </div>
        <h2 id="app-dialog-title">{dialog.title}</h2>
        <p>{dialog.message}</p>
        {isPrompt && (
          <input
            className="app-dialog-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={dialog.placeholder}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter") onClose(value.trim());
              if (event.key === "Escape") onClose(null);
            }}
          />
        )}
        <div className="app-dialog-actions">
          <button type="button" className="btn-secondary" onClick={() => onClose(isPrompt ? null : false)}>
            {dialog.cancelLabel || "Cancel"}
          </button>
          <button
            type="button"
            className={dialog.tone === "danger" ? "app-dialog-danger-button" : "btn-primary"}
            onClick={() => onClose(isPrompt ? value.trim() : true)}
            disabled={isPrompt && !value.trim()}
          >
            {dialog.confirmLabel || (isPrompt ? "Continue" : "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used within DialogProvider");
  return context;
}
