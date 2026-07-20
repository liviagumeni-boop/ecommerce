import { useEffect, useMemo, useRef, useState } from "react";

/* =========================================================
   Custom date-range filter — zero external libraries.
   A single trigger button opens a popover with:
     - quick presets (Today / 7d / 30d / This month)
     - ONE calendar month grid for picking a custom range
       (click a start day, then click an end day)
   Fully self-contained: styles are scoped under .drf- classes
   via an injected <style> tag, so it drops in anywhere.
   ========================================================= */

const PRESETS = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 6 },
  { label: "Last 30 days", days: 29 },
  { label: "This month", type: "month" },
];

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const pad2 = (n) => String(n).padStart(2, "0");

const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const isoToDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const todayISO = () => toISO(new Date());

const formatDisplay = (start, end) => {
  if (!start && !end) return "All dates";
  const opts = { month: "short", day: "numeric" };
  const s = start ? isoToDate(start).toLocaleDateString(undefined, opts) : "…";
  const e = end ? isoToDate(end).toLocaleDateString(undefined, opts) : "…";
  return start === end ? s : `${s} – ${e}`;
};

const formatMonthLabel = (year, month) =>
  new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

// Builds a 6-week (42 cell) grid for the given month, including
// leading/trailing days from adjacent months for a full calendar look.
const buildMonthGrid = (year, month) => {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({
      iso: toISO(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
};

export default function DateRangeFilter({ startDate, endDate, onChange }) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(startDate || "");
  const [draftEnd, setDraftEnd] = useState(endDate || "");
  const [hoverIso, setHoverIso] = useState(null);

  const initial = isoToDate(startDate || todayISO());
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

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

  const handleDayClick = (iso) => {
    // Start a fresh selection whenever there's no start, or a
    // complete range is already set (start a new pick).
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(iso);
      setDraftEnd("");
      return;
    }
    // We have a start but no end yet — this click sets the end.
    if (iso < draftStart) {
      setDraftEnd(draftStart);
      setDraftStart(iso);
    } else {
      setDraftEnd(iso);
    }
  };

  const applyCustom = () => {
    if (draftStart && !draftEnd) {
      onChange(draftStart, draftStart);
    } else {
      onChange(draftStart, draftEnd);
    }
    setOpen(false);
  };

  const clearAll = () => {
    setDraftStart("");
    setDraftEnd("");
    onChange("", "");
    setOpen(false);
  };

  const goMonth = (delta) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const today = todayISO();

  // Range preview: confirmed range, or start→hover while picking the end.
  const rangeStart = draftStart || null;
  const rangeEnd =
    draftEnd || (draftStart && hoverIso ? (hoverIso < draftStart ? draftStart : hoverIso) : null);
  const rangeStartForCompare =
    draftStart && hoverIso && !draftEnd && hoverIso < draftStart ? hoverIso : rangeStart;

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
          width: 300px;
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

        .drf-cal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .drf-cal-title {
          font-size: 13px;
          font-weight: 600;
          color: #33373d;
        }
        .drf-cal-nav {
          display: flex;
          gap: 4px;
        }
        .drf-nav-btn {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: 1px solid #e4e6ea;
          background: #fff;
          color: #6b7078;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .drf-nav-btn:hover { background: #f2f3f6; color: #33373d; }

        .drf-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 2px;
        }
        .drf-weekday {
          text-align: center;
          font-size: 10.5px;
          font-weight: 600;
          color: #a5aab3;
          padding: 4px 0;
        }

        .drf-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .drf-day-cell { position: relative; }
        .drf-day-btn {
          width: 100%;
          aspect-ratio: 1 / 1;
          border: none;
          background: transparent;
          color: #33373d;
          font-size: 12.5px;
          border-radius: 7px;
          cursor: pointer;
          position: relative;
          z-index: 1;
        }
        .drf-day-btn:hover { background: #edf0ff; }
        .drf-day-btn.drf-out { color: #c7cacf; }
        .drf-day-btn.drf-today { box-shadow: inset 0 0 0 1px #c7cdfb; }

        .drf-day-btn.drf-endpoint {
          background: #4653e0;
          color: #fff;
          font-weight: 600;
        }
        .drf-day-btn.drf-endpoint:hover { background: #3a46c9; }

        .drf-day-cell.drf-in-range::before {
          content: "";
          position: absolute;
          inset: 0 -1px;
          background: #eceeff;
          z-index: 0;
        }
        .drf-day-cell.drf-range-start::before { left: 50%; border-radius: 7px 0 0 7px; }
        .drf-day-cell.drf-range-end::before { right: 50%; border-radius: 0 7px 7px 0; }

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
        .drf-apply-btn:disabled { background: #c7cbf5; cursor: not-allowed; }
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

          <div className="drf-cal-head">
            <button type="button" className="drf-nav-btn" onClick={() => goMonth(-1)} aria-label="Previous month">
              ‹
            </button>
            <div className="drf-cal-title">{formatMonthLabel(viewYear, viewMonth)}</div>
            <button type="button" className="drf-nav-btn" onClick={() => goMonth(1)} aria-label="Next month">
              ›
            </button>
          </div>

          <div className="drf-weekdays">
            {WEEKDAY_LABELS.map((w) => (
              <div className="drf-weekday" key={w}>
                {w}
              </div>
            ))}
          </div>

          <div className="drf-days" onMouseLeave={() => setHoverIso(null)}>
            {grid.map((cell) => {
              const isEndpoint = cell.iso === draftStart || cell.iso === draftEnd;
              const inRange =
                rangeStartForCompare &&
                rangeEnd &&
                cell.iso > rangeStartForCompare &&
                cell.iso < rangeEnd;
              const isRangeStart = rangeStartForCompare && cell.iso === rangeStartForCompare;
              const isRangeEnd = rangeEnd && cell.iso === rangeEnd;

              const cellClasses = [
                "drf-day-cell",
                inRange || isRangeStart || isRangeEnd ? "drf-in-range" : "",
                isRangeStart ? "drf-range-start" : "",
                isRangeEnd ? "drf-range-end" : "",
              ]
                .filter(Boolean)
                .join(" ");

              const btnClasses = [
                "drf-day-btn",
                !cell.inMonth ? "drf-out" : "",
                cell.iso === today ? "drf-today" : "",
                isEndpoint ? "drf-endpoint" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div className={cellClasses} key={cell.iso}>
                  <button
                    type="button"
                    className={btnClasses}
                    onClick={() => handleDayClick(cell.iso)}
                    onMouseEnter={() => setHoverIso(cell.iso)}
                  >
                    {cell.day}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="drf-footer">
            <button type="button" className="drf-link-btn" onClick={clearAll}>
              Clear
            </button>
            <button
              type="button"
              className="drf-apply-btn"
              onClick={applyCustom}
              disabled={!draftStart}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}