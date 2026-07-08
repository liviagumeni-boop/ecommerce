import { useEffect, useRef, useState } from "react";

/* =========================================================
   Custom date-range filter — no MUI, no default library look.
   A single trigger button (matches your existing outline-
   secondary filter buttons) opens a small popover with:
     - quick presets (Today / 7d / 30d / This month)
     - two native date inputs for a custom range
   Fully self-contained: styles are scoped under .drf- classes
   via an injected <style> tag, so it drops in anywhere.
   ========================================================= */

const PRESETS = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 6 },
  { label: "Last 30 days", days: 29 },
  { label: "This month", type: "month" },
];

const toISO = (d) => d.toISOString().split("T")[0];

const formatDisplay = (start, end) => {
  if (!start && !end) return "All dates";
  const opts = { month: "short", day: "numeric" };
  const s = start ? new Date(start + "T00:00:00").toLocaleDateString(undefined, opts) : "…";
  const e = end ? new Date(end + "T00:00:00").toLocaleDateString(undefined, opts) : "…";
  return start === end ? s : `${s} – ${e}`;
};

export default function DateRangeFilter({ startDate, endDate, onChange }) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(startDate || "");
  const [draftEnd, setDraftEnd] = useState(endDate || "");
  const rootRef = useRef(null);

  useEffect(() => {
    setDraftStart(startDate || "");
    setDraftEnd(endDate || "");
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const applyPreset = (preset) => {
    const today = new Date();
    let start, end;

    if (preset.type === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = today;
    } else {
      start = new Date(today);
      start.setDate(start.getDate() - preset.days);
      end = today;
    }

    const s = toISO(start);
    const e = toISO(end);
    setDraftStart(s);
    setDraftEnd(e);
    onChange(s, e);
    setOpen(false);
  };

  const applyCustom = () => {
    onChange(draftStart, draftEnd);
    setOpen(false);
  };

  const clearAll = () => {
    setDraftStart("");
    setDraftEnd("");
    onChange("", "");
    setOpen(false);
  };

  const hasValue = Boolean(startDate || endDate);

  return (
    <div className="drf-root" ref={rootRef}>
      <style>{`
        .drf-root { position: relative; display: inline-block; }

        .drf-trigger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          min-width: 190px;
          padding: 0 16px;
          border-radius: 8px;
          border: 1px solid #d7dbe0;
          background: #fff;
          color: #33373d;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .drf-trigger:hover { border-color: #b7bdc6; }
        .drf-trigger.drf-active {
          border-color: #5b6cf9;
          box-shadow: 0 0 0 3px rgba(91,108,249,0.12);
        }
        .drf-icon { flex-shrink: 0; opacity: .65; }
        .drf-clear {
          margin-left: 2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: none;
          background: #eef0f3;
          color: #6b7078;
          font-size: 12px;
          line-height: 18px;
          text-align: center;
          cursor: pointer;
        }
        .drf-clear:hover { background: #e2e5ea; color: #33373d; }

        .drf-panel {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          z-index: 50;
          width: 340px;
          background: #fff;
          border: 1px solid #e4e6ea;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(20,20,30,0.12);
          padding: 14px;
          box-sizing: border-box;
        }

        .drf-section-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .04em;
          text-transform: uppercase;
          color: #9096a1;
          margin: 2px 0 8px;
        }

        .drf-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 14px;
        }
        .drf-preset-btn {
          border: 1px solid #e4e6ea;
          background: #f7f8fa;
          color: #33373d;
          font-size: 12.5px;
          padding: 6px 10px;
          border-radius: 999px;
          cursor: pointer;
          transition: background .15s ease, border-color .15s ease;
        }
        .drf-preset-btn:hover { background: #edf0ff; border-color: #c7cdfb; color: #3948d1; }

        .drf-divider { height: 1px; background: #edeef1; margin: 12px 0; }

        .drf-inputs { display: flex; align-items: center; gap: 6px; }
        .drf-input-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .drf-input-wrap label { font-size: 11px; color: #9096a1; }
        .drf-input-wrap input[type="date"] {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          height: 34px;
          border: 1px solid #d7dbe0;
          border-radius: 7px;
          padding: 0 6px;
          font-size: 12.5px;
          color: #33373d;
          background: #fff;
        }
        .drf-input-wrap input[type="date"]:focus {
          outline: none;
          border-color: #5b6cf9;
          box-shadow: 0 0 0 3px rgba(91,108,249,0.12);
        }
        .drf-arrow { color: #c3c7ce; font-size: 13px; margin-top: 14px; }

        .drf-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 14px;
        }
        .drf-link-btn {
          border: none;
          background: none;
          color: #6b7078;
          font-size: 13px;
          cursor: pointer;
          padding: 4px 2px;
        }
        .drf-link-btn:hover { color: #33373d; text-decoration: underline; }
        .drf-apply-btn {
          border: none;
          background: #4653e0;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 7px;
          cursor: pointer;
        }
        .drf-apply-btn:hover { background: #3a46c9; }
      `}</style>

      <button
        type="button"
        className={`drf-trigger${open ? " drf-active" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <svg className="drf-icon" width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 2v3M17 2v3M3.5 9h17M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {formatDisplay(startDate, endDate)}
        {hasValue && (
          <span
            className="drf-clear"
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
            }}
            title="Clear dates"
          >
            ×
          </span>
        )}
      </button>

      {open && (
        <div className="drf-panel">
          <div className="drf-section-label">Quick ranges</div>
          <div className="drf-presets">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="drf-preset-btn"
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="drf-divider" />

          <div className="drf-section-label">Custom range</div>
          <div className="drf-inputs">
            <div className="drf-input-wrap">
              <label>From</label>
              <input
                type="date"
                value={draftStart}
                max={draftEnd || undefined}
                onChange={(e) => setDraftStart(e.target.value)}
              />
            </div>
            <span className="drf-arrow">→</span>
            <div className="drf-input-wrap">
              <label>To</label>
              <input
                type="date"
                value={draftEnd}
                min={draftStart || undefined}
                onChange={(e) => setDraftEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="drf-footer">
            <button type="button" className="drf-link-btn" onClick={clearAll}>
              Clear
            </button>
            <button type="button" className="drf-apply-btn" onClick={applyCustom}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
