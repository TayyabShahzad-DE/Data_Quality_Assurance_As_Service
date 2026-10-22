import { useState, useRef } from "react";
import "../styles/cleaning.css";

// ── Helper: check missing value ──────────────────────────────────────────
const isMissingVal = (v) =>
  v === "" || v === null || v === undefined ||
  (typeof v === "string" &&
    ["n/a", "null", "na", "none", "undefined", "nan", "-", "--", "?"].includes(
      v.trim().toLowerCase()
    ));

// ── Helper: escape HTML for report ──────────────────────────────────────
const escHtml = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// ── Generate color-coded HTML Report ────────────────────────────────────
const generateHTMLReport = (cleanedWithChanges, removedRows, headers, meta, statsArray, selectedIds, cleaningRules) => {
  const totalModifiedRows = cleanedWithChanges.filter(r => Object.keys(r.changes).length > 0).length;
  const totalCellsChanged = cleanedWithChanges.reduce((s, r) => s + Object.keys(r.changes).length, 0);
  const fileName = statsArray[0]?.fileName ?? "data";
  const dateStr = new Date().toLocaleString();

  const rulesApplied = selectedIds
    .map(id => cleaningRules.find(r => r.id === id))
    .filter(Boolean);

  // ── Cleaned rows table ───────────────────────────────────────────────
  const rowsHtml = cleanedWithChanges.map((item, i) => {
    const hasChanges = Object.keys(item.changes).length > 0;
    const rowStyle = hasChanges ? "background:#f0fdf4;" : i % 2 === 0 ? "background:#fff;" : "background:#fafafa;";
    const cells = headers.map((h) => {
      const change = item.changes[h];
      if (change) {
        const wasMissing = isMissingVal(change.before) || change.before === "" || change.before === null || change.before === undefined;
        const cellBg = wasMissing ? "#d1fae5" : "#fef9c3";
        const beforeLabel = wasMissing ? "(empty)" : escHtml(change.before);
        return `<td style="padding:8px 12px;background:${cellBg};border-bottom:1px solid #e5e7eb;vertical-align:top;">
          <span style="display:block;color:#ef4444;text-decoration:line-through;font-size:0.75em;margin-bottom:3px;" title="Before">${beforeLabel}</span>
          <span style="color:#10b981;font-weight:700;" title="After">${escHtml(change.after)}</span>
        </td>`;
      }
      return `<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151;">${escHtml(item.row[h])}</td>`;
    }).join("");
    return `<tr style="${rowStyle}"><td style="padding:8px 12px;color:#9ca3af;font-size:0.78rem;font-weight:600;">${i + 1}</td>${cells}</tr>`;
  }).join("");

  // ── Rules list ───────────────────────────────────────────────────────
  const rulesHtml = rulesApplied.map(rule => `
    <div style="display:inline-flex;align-items:center;gap:6px;background:#ede9fe;color:#6c56f5;padding:4px 14px;border-radius:20px;font-size:0.8rem;font-weight:600;margin:4px;">
      ${rule.name}
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Cleaning Report — ${escHtml(fileName)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f3f4f6;padding:28px;color:#1f2937;}
    .header{background:linear-gradient(135deg,#6c56f5,#8b5cf6);color:white;padding:28px 32px;border-radius:16px;margin-bottom:24px;box-shadow:0 4px 20px rgba(108,86,245,0.3);}
    .header h1{font-size:1.9rem;margin-bottom:6px;}
    .header p{opacity:0.85;font-size:0.9rem;}
    .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px;}
    .card{background:white;padding:18px;border-radius:12px;box-shadow:0 1px 6px rgba(0,0,0,0.08);text-align:center;}
    .card h2{font-size:2.1rem;font-weight:800;margin-bottom:4px;}
    .card p{color:#6b7280;font-size:0.82rem;font-weight:500;}
    .section{background:white;border-radius:14px;padding:22px;margin-bottom:20px;box-shadow:0 1px 6px rgba(0,0,0,0.07);}
    .section h3{font-size:1rem;font-weight:700;color:#374151;margin-bottom:14px;display:flex;align-items:center;gap:8px;}
    .legend{display:flex;gap:18px;flex-wrap:wrap;align-items:center;padding:16px 20px;background:white;border-radius:12px;margin-bottom:20px;box-shadow:0 1px 6px rgba(0,0,0,0.07);}
    .leg{display:flex;align-items:center;gap:8px;font-size:0.82rem;color:#374151;}
    .dot{width:18px;height:18px;border-radius:4px;flex-shrink:0;}
    .table-wrap{overflow-x:auto;border-radius:10px;border:1px solid #e5e7eb;}
    table{width:100%;border-collapse:collapse;font-size:0.81rem;}
    thead tr{background:linear-gradient(135deg,#6c56f5,#8b5cf6);}
    thead th{padding:11px 12px;color:white;text-align:left;white-space:nowrap;font-weight:600;}
    .badge{display:inline-block;background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:12px;font-size:0.75rem;font-weight:700;margin-left:8px;}
    .badge.red{background:#fee2e2;color:#991b1b;}
    .badge.yellow{background:#fef9c3;color:#92400e;}
    .footer{text-align:center;color:#9ca3af;font-size:0.8rem;padding:20px;margin-top:4px;}
    @media print{body{padding:12px;} .header{padding:16px;}}
  </style>
</head>
<body>

  <div class="header">
    <h1>🧹 Data Cleaning Report</h1>
    <p>📄 File: <strong>${escHtml(fileName)}</strong> &nbsp;|&nbsp; 📅 Generated: ${dateStr}</p>
  </div>

  <div class="grid4">
    <div class="card"><h2 style="color:#6c56f5">${(meta.totalRows + meta.rowsRemoved).toLocaleString()}</h2><p>Original Rows</p></div>
    <div class="card"><h2 style="color:#10b981">${meta.totalRows.toLocaleString()}</h2><p>Rows After Cleaning</p></div>
    <div class="card"><h2 style="color:#ef4444">${meta.rowsRemoved.toLocaleString()}</h2><p>Rows Removed</p></div>
    <div class="card"><h2 style="color:#f59e0b">${totalCellsChanged.toLocaleString()}</h2><p>Cells Changed</p></div>
  </div>

  <div class="legend">
    <strong style="color:#374151;font-size:0.85rem;">🔑 Color Legend:</strong>
    <div class="leg"><div class="dot" style="background:#d1fae5;border:1px solid #6ee7b7;"></div>🟢 Filled — was missing/zero → new value</div>
    <div class="leg"><div class="dot" style="background:#fef9c3;border:1px solid #fcd34d;"></div>🟡 Modified — old value → new value</div>
    <div class="leg"><div class="dot" style="background:#fef2f2;border:1px solid #fca5a5;"></div>🔴 Removed row</div>
    <div class="leg" style="color:#ef4444;text-decoration:line-through;font-size:0.8rem;">Red strikethrough = Before</div>
    <div class="leg" style="color:#10b981;font-weight:700;font-size:0.8rem;">Green bold = After</div>
  </div>

  <div class="section">
    <h3>🔧 Rules Applied <span class="badge">${rulesApplied.length} rules</span></h3>
    <div style="display:flex;flex-wrap:wrap;">${rulesHtml}</div>
  </div>

  <div class="section">
    <h3>📋 Cleaned Data
      <span class="badge">${meta.totalRows.toLocaleString()} rows</span>
      <span class="badge yellow">${totalModifiedRows} rows modified</span>
    </h3>
    <p style="font-size:0.8rem;color:#6b7280;margin-bottom:12px;">Changed cells show: <span style="color:#ef4444;text-decoration:line-through;">before</span> → <span style="color:#10b981;font-weight:700;">after</span></p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            ${headers.map(h => `<th>${escHtml(h)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <h3>🗑️ Removed Rows <span class="badge red">${removedRows.length} rows</span></h3>
    <p style="font-size:0.8rem;color:#6b7280;margin-bottom:12px;">These rows were deleted (duplicates / completely empty)</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            ${headers.map(h => `<th>${escHtml(h)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${removedRows.length > 0
            ? removedRows.map((row, i) => {
                const cells = headers.map(h => `<td style="padding:8px 12px;color:#9ca3af;text-decoration:line-through;">${escHtml(row[h] ?? "")}</td>`).join("");
                return `<tr style="background:#fef2f2;"><td style="padding:8px 12px;color:#fca5a5;font-size:0.78rem;">${i + 1}</td>${cells}</tr>`;
              }).join("")
            : `<tr><td colspan="${headers.length + 1}" style="padding:20px;text-align:center;color:#10b981;font-weight:600;">✅ No rows were removed</td></tr>`
          }
        </tbody>
      </table>
    </div>
  </div>

  <div class="footer">
    Generated by <strong>Data Quality Platform</strong> &nbsp;|&nbsp; ${dateStr}
  </div>

</body>
</html>`;
};

// ════════════════════════════════════════════════════════════════════════════
export default function Cleaning({ datasetStats, onGoToUpload }) {
  const [activeTab, setActiveTab]                   = useState("rules");
  const [selectedRules, setSelectedRules]           = useState([]);
  const [cleaningInProgress, setCleaningInProgress] = useState(false);
  const [cleaningProgress, setCleaningProgress]     = useState(0);
  const [cleaningStep, setCleaningStep]             = useState("");
  const [showResults, setShowResults]               = useState(false);
  const [localRules, setLocalRules]                 = useState(null);
  const [cleanedData, setCleanedData]               = useState(null);
  const [cleanedMeta, setCleanedMeta]               = useState(null);
  const [cleaningResult, setCleaningResult]         = useState(null); // full result with originalRows

  const cleanedDataRef    = useRef(null);
  const validSelectedRef  = useRef([]);

  // ── No data guard ────────────────────────────────────────────────────
  if (!datasetStats) {
    return (
      <div className="cleaning-container">
        <div className="cleaning-header">
          <h2>🧹 Data Cleaning</h2>
          <p>No dataset loaded yet.</p>
        </div>
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📂</div>
          <h3 style={{ color: "#6b7280", marginBottom: "1rem" }}>Please upload a file first</h3>
          {onGoToUpload && (
            <button className="btn-action primary" onClick={onGoToUpload}>
              📤 Go to Upload
            </button>
          )}
        </div>
      </div>
    );
  }

  const statsArray    = Array.isArray(datasetStats) ? datasetStats : [datasetStats];
  const primaryStats  = statsArray[0];
  const cleaningRules = localRules ?? primaryStats.cleaningRules ?? [];

  const cleaningStats = {
    totalRules:       cleaningRules.length,
    enabledRules:     cleaningRules.filter((r) => r.enabled).length,
    recommendedRules: cleaningRules.filter((r) => r.recommended).length,
  };

  const totalMissing = statsArray.reduce((s, st) => s + (st.missing ?? 0), 0);
  const totalDupes   = statsArray.reduce((s, st) => s + (st.duplicates ?? 0), 0);
  const totalRows    = statsArray.reduce((s, st) => s + (st.rawRows?.length ?? 0), 0);

  const getSeverityColor = (s) =>
    ({ high: "#ef4444", medium: "#f59e0b", low: "#3b82f6" }[s] ?? "#6b7280");

  const toggleRule = (ruleId) => {
    const base    = localRules ?? primaryStats.cleaningRules ?? [];
    const updated = base.map((r) => r.id === ruleId ? { ...r, enabled: !r.enabled } : r);
    setLocalRules(updated);
    const rule = base.find((r) => r.id === ruleId);
    if (rule?.enabled) setSelectedRules((p) => p.filter((id) => id !== ruleId));
  };

  const handleRuleSelect = (ruleId) => {
    const rule = cleaningRules.find((r) => r.id === ruleId);
    if (!rule?.enabled) return;
    setSelectedRules((p) =>
      p.includes(ruleId) ? p.filter((x) => x !== ruleId) : [...p, ruleId]
    );
  };

  const selectAllRecommended = () =>
    setSelectedRules(
      cleaningRules.filter((r) => r.recommended && r.enabled).map((r) => r.id)
    );

  const validSelected = selectedRules.filter((id) => {
    const rule = cleaningRules.find((r) => r.id === id);
    return rule?.enabled;
  });

  // ════════════════════════════════════════════════════════════════════
  // ✅ CORE CLEANING ENGINE — ALL RULES + ORIGINAL ROWS TRACKING
  // ════════════════════════════════════════════════════════════════════
  const applyCleaningRules = (allStats, selectedIds, rules) => {
    let combinedRows     = [];   // cleaned rows (with __origIdx)
    let combinedOrigRows = [];   // original rows (with __origIdx, before rule application)
    let totalRemoved     = 0;
    let totalFilled      = 0;
    let filesProcessed   = 0;

    allStats.forEach((stats) => {
      if (!stats.rawRows || stats.rawRows.length === 0) return;

      const fileTag      = `f${filesProcessed}`;
      const originalCount = stats.rawRows.length;

      // ── Deep copy + type coerce + assign unique __origIdx ────────────
      let rows = stats.rawRows.map((r, idx) => {
        const newRow = { __origIdx: `${fileTag}_${idx}` };
        Object.keys(r).forEach((k) => {
          const profile = stats.columnProfiles?.find((c) => c.name === k);
          const val     = r[k];
          if (
            profile &&
            (profile.type === "Integer" || profile.type === "Float") &&
            !isMissingVal(val)
          ) {
            const num = parseFloat(val);
            newRow[k] = isNaN(num) ? val : num;
          } else {
            newRow[k] = val === null || val === undefined ? "" : val;
          }
        });
        return newRow;
      });

      // Save originals (after type coerce, before rule application)
      const origRows = rows.map((r) => ({ ...r }));
      combinedOrigRows = [...combinedOrigRows, ...origRows];

      // ── Apply selected rules ─────────────────────────────────────────
      selectedIds.forEach((id) => {
        const rule = rules.find((r) => r.id === id);
        if (!rule) return;

        // ── 1. REMOVE EMPTY ROWS ────────────────────────────────────────
        if (rule.type === "remove_empty_rows") {
          rows = rows.filter(
            (row) => !Object.entries(row).filter(([k]) => k !== "__origIdx").every(([, v]) => isMissingVal(v))
          );
        }

        // ── 2. TRIM WHITESPACE ──────────────────────────────────────────
        if (rule.type === "trim_whitespace") {
          rows = rows.map((row) => {
            const trimmed = { ...row };
            Object.keys(row).forEach((k) => {
              if (k === "__origIdx") return;
              if (typeof row[k] === "string") trimmed[k] = row[k].trim();
            });
            return trimmed;
          });
        }

        // ── 3. FILL MISSING VALUES ──────────────────────────────────────
        if (rule.type === "fill_missing") {
          const colName = rule.column ?? rule.name?.replace("Fill Missing: ", "").trim();
          if (colName) {
            const profile  = stats.columnProfiles?.find((c) => c.name === colName);
            const isNumCol = profile?.type === "Integer" || profile?.type === "Float";
            let fillValue;
            if (rule.fillValue !== undefined && rule.fillValue !== null) {
              fillValue = rule.fillValue;
            } else if (isNumCol) {
              const m = profile?.numericStats?.mean ?? 0;
              fillValue = typeof m === "string" ? parseFloat(m) : m;
            } else {
              fillValue = "N/A";
            }
            rows = rows.map((row) => {
              if (isMissingVal(row[colName])) {
                totalFilled++;
                return { ...row, [colName]: fillValue };
              }
              return row;
            });
          }
        }

        // ── 4. REMOVE DUPLICATES ────────────────────────────────────────
        if (rule.type === "remove_duplicates") {
          const seen = new Set();
          rows = rows.filter((row) => {
            const { _sourceFile, __origIdx, ...rest } = row;
            const norm = {};
            Object.keys(rest).forEach((k) => {
              const v = rest[k];
              norm[k] =
                typeof v === "string" ? v.trim().toLowerCase()
                : v === null || v === undefined ? "" : v;
            });
            const key = JSON.stringify(norm, Object.keys(norm).sort());
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }

        // ── 5. REMOVE OUTLIERS (disabled by default) ────────────────────
        if (rule.type === "remove_outliers") {
          const colName = rule.column;
          if (colName) {
            const vals = rows.map((r) => parseFloat(r[colName])).filter((v) => !isNaN(v));
            if (vals.length > 0) {
              const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
              const std  = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
              rows = rows.filter((row) => {
                const v = parseFloat(row[colName]);
                return isNaN(v) || Math.abs(v - mean) <= 3 * std;
              });
            }
          }
        }

        // ── 6. FIX OUTLIERS WITH MEAN (replace, not remove) ─────────────
        if (rule.type === "fix_outliers_mean") {
          const colName = rule.column;
          if (colName) {
            const profile  = stats.columnProfiles?.find((c) => c.name === colName);
            const colMean  = profile?.numericStats?.mean ?? 0;
            const vals     = rows.map((r) => parseFloat(r[colName])).filter((v) => !isNaN(v));
            if (vals.length > 0) {
              const m   = vals.reduce((a, b) => a + b, 0) / vals.length;
              const std = Math.sqrt(vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length);
              rows = rows.map((row) => {
                const v = parseFloat(row[colName]);
                if (!isNaN(v) && Math.abs(v - m) > 3 * std) {
                  const rounded = Math.round(colMean * 100) / 100;
                  return { ...row, [colName]: rounded };
                }
                return row;
              });
            }
          }
        }

        // ── 7. FIX AGE OUTLIERS (age outside 0–120 → replace with mean) ─
        if (rule.type === "fix_age_outliers") {
          const colName = rule.column;
          if (colName) {
            const profile = stats.columnProfiles?.find((c) => c.name === colName);
            const mean    = Math.round(profile?.numericStats?.mean ?? 27);
            rows = rows.map((row) => {
              const v = parseFloat(row[colName]);
              if (!isNaN(v) && (v < 0 || v > 120)) {
                return { ...row, [colName]: mean };
              }
              return row;
            });
          }
        }

        // ── 8. STANDARDIZE CASE ─────────────────────────────────────────
        if (rule.type === "standardize_case") {
          const colName = rule.column;
          if (colName) {
            rows = rows.map((row) => {
              if (typeof row[colName] === "string" && row[colName].trim()) {
                const v = row[colName].trim();
                return {
                  ...row,
                  [colName]: v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(),
                };
              }
              return row;
            });
          }
        }

        // ── 9. TITLE CASE ("ali" → "Ali", "lahore" → "Lahore") ──────────
        if (rule.type === "title_case") {
          const colName = rule.column;
          if (colName) {
            rows = rows.map((row) => {
              if (typeof row[colName] === "string" && row[colName].trim() && !isMissingVal(row[colName])) {
                const v       = row[colName].trim();
                const titled  = v
                  .split(" ")
                  .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
                  .join(" ");
                return { ...row, [colName]: titled };
              }
              return row;
            });
          }
        }

        // ── 10. FIX NEGATIVE VALUES ─────────────────────────────────────
        if (rule.type === "fix_negatives") {
          const colName = rule.column;
          if (colName) {
            rows = rows.map((row) => {
              const v = parseFloat(row[colName]);
              if (!isNaN(v) && v < 0) return { ...row, [colName]: Math.abs(v) };
              return row;
            });
          }
        }

        // ── 11. FIX ZERO VALUES (salary=0 → mean) ───────────────────────
        if (rule.type === "fix_zero") {
          const colName = rule.column;
          if (colName) {
            const profile  = stats.columnProfiles?.find((c) => c.name === colName);
            const meanVal  = profile?.numericStats?.mean ?? 0;
            const fillWith = rule.fillValue !== undefined ? rule.fillValue : meanVal;
            rows = rows.map((row) => {
              const v = parseFloat(row[colName]);
              if (!isNaN(v) && v === 0) {
                totalFilled++;
                return { ...row, [colName]: Math.round(fillWith * 100) / 100 };
              }
              return row;
            });
          }
        }
      });

      totalRemoved   += originalCount - rows.length;
      // Tag source file (keep __origIdx for change tracking)
      rows            = rows.map((row) => ({ ...row, _sourceFile: stats.fileName ?? "unknown" }));
      combinedRows    = [...combinedRows, ...rows];
      filesProcessed += 1;
    });

    return {
      rows:         combinedRows,       // cleaned (with __origIdx)
      originalRows: combinedOrigRows,   // before rules (with __origIdx)
      meta: {
        filesProcessed,
        totalRows:   combinedRows.length,
        rowsRemoved: totalRemoved,
        cellsFilled: totalFilled,
      },
    };
  };

  // ── Start Cleaning ───────────────────────────────────────────────────
  const startCleaning = () => {
    if (validSelected.length === 0) {
      alert("❌ Please select at least one rule");
      return;
    }

    validSelectedRef.current = [...validSelected];
    setCleaningInProgress(true);
    setCleaningProgress(0);
    setCleaningStep("Initializing...");
    setShowResults(false);
    setCleanedData(null);
    setCleanedMeta(null);
    setCleaningResult(null);
    cleanedDataRef.current = null;

    const steps = [
      "Scanning for empty rows...",
      "Removing duplicates...",
      "Filling missing values...",
      "Trimming whitespace...",
      "Standardizing formats...",
      "Fixing invalid values...",
      "Generating clean file...",
    ];

    let p = 0;
    let stepIdx = 0;

    const iv = setInterval(() => {
      p += Math.random() * 18 + 5;
      stepIdx = Math.min(Math.floor((p / 100) * steps.length), steps.length - 1);
      setCleaningStep(steps[stepIdx]);

      if (p >= 100) {
        p = 100;
        clearInterval(iv);

        const result = applyCleaningRules(
          statsArray,
          validSelectedRef.current,
          cleaningRules
        );

        cleanedDataRef.current = result.rows;
        setCleanedData(result.rows);
        setCleanedMeta(result.meta);
        setCleaningResult(result);
        setCleaningInProgress(false);
        setShowResults(true);
      }
      setCleaningProgress(Math.min(p, 100));
    }, 280);
  };

  // ── Download Cleaned CSV ─────────────────────────────────────────────
  const downloadCleanedData = () => {
    let rows = cleaningResult?.rows ?? cleanedDataRef.current ?? cleanedData;

    if (!rows || rows.length === 0) {
      const result = applyCleaningRules(statsArray, validSelectedRef.current, cleaningRules);
      rows = result.rows;
      cleanedDataRef.current = rows;
    }

    if (!rows || rows.length === 0) {
      rows = statsArray.flatMap((s) => s.rawRows ?? []);
    }

    if (!rows || rows.length === 0) {
      alert("❌ No data to download. Please re-upload and try again.");
      return;
    }

    // Strip internal columns
    const headers = Object.keys(rows[0]).filter(
      (h) => h !== "_sourceFile" && h !== "__origIdx"
    );

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => escapeCSV(row[h])).join(",")),
    ].join("\n");

    const filename =
      statsArray.length > 1
        ? "cleaned_combined_data.csv"
        : `cleaned_${primaryStats.fileName ?? "data.csv"}`;

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Download Color-Coded HTML Change Report ──────────────────────────
  const downloadChangeReport = () => {
    const result = cleaningResult;
    if (!result?.rows) {
      alert("❌ Please run cleaning first before downloading the report.");
      return;
    }

    const { rows: cleanedRows, originalRows, meta } = result;

    // Headers (excluding internal fields)
    const headers = originalRows.length > 0
      ? Object.keys(originalRows[0]).filter((h) => h !== "__origIdx" && h !== "_sourceFile")
      : Object.keys(cleanedRows[0] ?? {}).filter((h) => h !== "__origIdx" && h !== "_sourceFile");

    // Build lookup: origIdx → original row
    const origMap = new Map(originalRows.map((r) => [r.__origIdx, r]));

    // Which origIdxs survived cleaning
    const survivedIdxs = new Set(cleanedRows.map((r) => r.__origIdx));

    // Removed rows (originals whose __origIdx is gone)
    const removedRows = originalRows.filter((r) => !survivedIdxs.has(r.__origIdx));

    // Cleaned rows with per-cell change info
    const cleanedWithChanges = cleanedRows.map((row, i) => {
      const orig    = origMap.get(row.__origIdx);
      const changes = {};
      if (orig) {
        headers.forEach((col) => {
          const origVal = orig[col];
          const newVal  = row[col];
          if (String(origVal ?? "") !== String(newVal ?? "")) {
            changes[col] = { before: origVal, after: newVal };
          }
        });
      }
      return { row, changes, index: i };
    });

    const html = generateHTMLReport(
      cleanedWithChanges,
      removedRows,
      headers,
      meta,
      statsArray,
      validSelectedRef.current,
      cleaningRules
    );

    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = `change_report_${primaryStats.fileName?.replace(/\.[^.]+$/, "") ?? "data"}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Issue summary counts ─────────────────────────────────────────────
  const allIssues   = primaryStats.issues ?? [];
  const highCount   = allIssues.filter((i) => i.severity === "high").length;
  const mediumCount = allIssues.filter((i) => i.severity === "medium").length;
  const lowCount    = allIssues.filter((i) => i.severity === "low").length;

  return (
    <div className="cleaning-container">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="cleaning-header">
        <h2>🧹 Data Cleaning</h2>
        <p>
          Smart cleaning for{" "}
          <strong>
            {statsArray.length > 1 ? `${statsArray.length} files` : primaryStats.fileName}
          </strong>
        </p>

        {allIssues.length > 0 && (
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {highCount > 0 && (
              <span style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "20px", padding: "4px 12px", fontSize: "0.8rem", fontWeight: 600 }}>
                🔴 {highCount} High
              </span>
            )}
            {mediumCount > 0 && (
              <span style={{ background: "#fffbeb", color: "#f59e0b", border: "1px solid #fcd34d", borderRadius: "20px", padding: "4px 12px", fontSize: "0.8rem", fontWeight: 600 }}>
                🟡 {mediumCount} Medium
              </span>
            )}
            {lowCount > 0 && (
              <span style={{ background: "#eff6ff", color: "#3b82f6", border: "1px solid #93c5fd", borderRadius: "20px", padding: "4px 12px", fontSize: "0.8rem", fontWeight: 600 }}>
                🔵 {lowCount} Low
              </span>
            )}
            <span style={{ background: "#f0fdf4", color: "#10b981", border: "1px solid #6ee7b7", borderRadius: "20px", padding: "4px 12px", fontSize: "0.8rem", fontWeight: 600 }}>
              📊 {totalRows.toLocaleString()} rows
            </span>
            <span style={{ background: "#fdf4ff", color: "#9333ea", border: "1px solid #d8b4fe", borderRadius: "20px", padding: "4px 12px", fontSize: "0.8rem", fontWeight: 600 }}>
              ⚠️ {totalMissing} missing
            </span>
            <span style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fdba74", borderRadius: "20px", padding: "4px 12px", fontSize: "0.8rem", fontWeight: 600 }}>
              🔁 {totalDupes} duplicates
            </span>
          </div>
        )}
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────── */}
      <div className="cleaning-stats-grid">
        {[
          { icon: "📋", title: "Total Rules",  val: cleaningStats.totalRules,       label: "Available" },
          { icon: "✅", title: "Enabled",       val: cleaningStats.enabledRules,     label: "Active rules" },
          { icon: "⭐", title: "Recommended",   val: cleaningStats.recommendedRules, label: "Suggested" },
          { icon: "☑️", title: "Selected",      val: validSelected.length,           label: "To apply" },
        ].map((s) => (
          <div key={s.title} className="stat-card-clean">
            <div className="stat-icon-clean">{s.icon}</div>
            <div className="stat-content-clean">
              <h3>{s.title}</h3>
              <p className="stat-number-clean">{s.val}</p>
              <span className="stat-label-clean">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="cleaning-tabs">
        {[
          ["rules",   "🔧 Cleaning Rules"],
          ["preview", "👁️ Preview"],
          ["history", "📜 History"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`tab-btn-clean ${activeTab === id ? "active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="tab-content-clean">

        {/* ── RULES TAB ─────────────────────────────────────────────────── */}
        {activeTab === "rules" && (
          <div className="rules-section">
            <div className="rules-action-bar">
              <div className="action-left">
                <button className="btn-select-recommended" onClick={selectAllRecommended}>
                  ⭐ Select All Recommended ({cleaningStats.recommendedRules})
                </button>
                <span className="selected-count">{validSelected.length} selected</span>
              </div>
              <button
                className="btn-apply-cleaning"
                onClick={startCleaning}
                disabled={validSelected.length === 0}
              >
                🧹 Apply & Clean ({validSelected.length})
              </button>
            </div>

            {cleaningRules.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <div style={{ fontSize: "3rem" }}>✅</div>
                <h3 style={{ color: "#10b981" }}>No Cleaning Needed!</h3>
                <p style={{ color: "#6b7280" }}>Your dataset is already clean.</p>
              </div>
            ) : (
              <>
                {["Missing Values", "Duplicates", "Formatting", "Consistency", "Invalid Values", "Outliers"].map((cat) => {
                  const catRules = cleaningRules.filter((r) => r.category === cat);
                  if (catRules.length === 0) return null;
                  const catIcon = { "Missing Values": "⚠️", Duplicates: "🔁", Formatting: "✂️", Consistency: "🔡", "Invalid Values": "🚫", Outliers: "📊" }[cat] ?? "🔧";
                  return (
                    <div key={cat} style={{ marginBottom: "1.5rem" }}>
                      <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px solid #e5e7eb" }}>
                        {catIcon} {cat}
                      </h4>
                      <div className="rules-grid">
                        {catRules.map((rule) => (
                          <div
                            key={rule.id}
                            className={`rule-card ${selectedRules.includes(rule.id) && rule.enabled ? "selected" : ""} ${rule.recommended ? "recommended" : ""} ${!rule.enabled ? "disabled-card" : ""}`}
                          >
                            <div className="rule-header">
                              <input
                                type="checkbox"
                                checked={selectedRules.includes(rule.id) && rule.enabled}
                                disabled={!rule.enabled}
                                onChange={() => handleRuleSelect(rule.id)}
                              />
                              <h4 style={{ color: !rule.enabled ? "#9ca3af" : "#1f2937" }}>{rule.name}</h4>
                              {rule.recommended && <span className="recommended-badge">⭐</span>}
                            </div>
                            <div className="rule-body">
                              <div className="rule-category">
                                <span className="severity-tag" style={{ background: getSeverityColor(rule.severity) + "20", color: getSeverityColor(rule.severity) }}>
                                  {rule.severity}
                                </span>
                              </div>
                              <p className="rule-description" style={{ color: !rule.enabled ? "#9ca3af" : "#6b7280" }}>
                                {rule.description}
                              </p>
                              <div className="rule-impact">
                                <span className="impact-label">Impact:</span>
                                <span className="impact-value">{rule.impact}</span>
                              </div>
                            </div>
                            <div className="rule-footer">
                              <label className="toggle-switch">
                                <input type="checkbox" checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                                <span className="toggle-slider" />
                              </label>
                              <span style={{ color: rule.enabled ? "#10b981" : "#ef4444", fontSize: "0.8rem" }}>
                                {rule.enabled ? "✅ On" : "🚫 Off"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ── PREVIEW TAB ───────────────────────────────────────────────── */}
        {activeTab === "preview" && (
          <div className="preview-section">
            <div className="preview-header">
              <h3>👁️ Data Preview</h3>
              <p>First 8 rows of your dataset — red = missing/issue</p>
            </div>
            {primaryStats.rawRows && primaryStats.rawRows.length > 0 ? (
              <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "linear-gradient(135deg, #6c56f5, #8b5cf6)" }}>
                      <th style={{ padding: "10px 12px", color: "white", textAlign: "left" }}>#</th>
                      {Object.keys(primaryStats.rawRows[0]).filter((h) => h !== "_sourceFile" && h !== "__origIdx").map((h) => (
                        <th key={h} style={{ padding: "10px 12px", color: "white", textAlign: "left", whiteSpace: "nowrap", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {primaryStats.rawRows.slice(0, 8).map((row, i) => {
                      const hdrs = Object.keys(row).filter((h) => h !== "_sourceFile" && h !== "__origIdx");
                      return (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "8px 12px", color: "#9ca3af", borderBottom: "1px solid #f3f4f6", fontWeight: 500 }}>{i + 1}</td>
                          {hdrs.map((h) => {
                            const val      = row[h];
                            const isBad    = isMissingVal(val);
                            const isNum    = typeof val === "number";
                            const isNeg    = isNum && val < 0;
                            const colLower = h.toLowerCase();
                            const shouldPos = colLower.includes("age") || colLower.includes("salary") || colLower.includes("price") || colLower.includes("amount");
                            const isInvalid = isNeg && shouldPos;
                            return (
                              <td key={h} style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", color: isBad ? "#ef4444" : isInvalid ? "#f59e0b" : "#1f2937", fontWeight: isBad || isInvalid ? 600 : "normal", background: isBad ? "#fef2f2" : isInvalid ? "#fffbeb" : "transparent", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(val ?? "")}>
                                {isBad ? "⚠️ Missing" : isInvalid ? `⚠️ ${val}` : String(val ?? "")}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: "#6b7280", padding: "2rem", textAlign: "center" }}>No data to preview.</p>
            )}

            {allIssues.length > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <h4 style={{ marginBottom: "0.75rem", color: "#374151" }}>🔍 Issues Found ({allIssues.length} total):</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {allIssues.map((issue) => (
                    <div key={issue.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "10px 14px", borderRadius: "8px", background: issue.severity === "high" ? "#fef2f2" : issue.severity === "medium" ? "#fffbeb" : "#eff6ff", border: `1px solid ${issue.severity === "high" ? "#fca5a5" : issue.severity === "medium" ? "#fcd34d" : "#93c5fd"}` }}>
                      <span>{issue.severity === "high" ? "🔴" : issue.severity === "medium" ? "🟡" : "🔵"}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, color: "#1f2937", fontSize: "0.85rem" }}>{issue.type}</span>
                        {issue.column && issue.column !== "All columns" && (
                          <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", background: "#e5e7eb", borderRadius: "4px", padding: "1px 6px", color: "#6b7280" }}>{issue.column}</span>
                        )}
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280", marginTop: "2px" }}>{issue.description}</p>
                      </div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: getSeverityColor(issue.severity) }}>{issue.rowsAffected} rows</span>
                      {issue.autoFixAvailable && <span style={{ fontSize: "0.7rem", background: "#d1fae5", color: "#065f46", borderRadius: "4px", padding: "2px 6px" }}>Auto-fix ✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validSelected.length > 0 && (
              <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #6ee7b7" }}>
                <h4 style={{ color: "#065f46", marginBottom: "0.5rem" }}>✅ {validSelected.length} Rule(s) Selected — Ready to Clean</h4>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#374151", fontSize: "0.85rem" }}>
                  {validSelected.map((id) => {
                    const rule = cleaningRules.find((r) => r.id === id);
                    return rule ? <li key={id}>{rule.name} — <em>{rule.impact}</em></li> : null;
                  })}
                </ul>
                <button onClick={startCleaning} style={{ marginTop: "0.75rem", padding: "8px 20px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
                  🧹 Apply Cleaning Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ───────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="history-section">
            <div className="history-header"><h3>📜 Upload History</h3></div>
            <div className="history-timeline">
              {statsArray.map((stats, idx) => (
                <div key={idx} className="history-entry">
                  <div className="history-dot" />
                  <div className="history-card">
                    <div className="history-card-header">
                      <span className="history-date">📅 {stats.uploadDate ?? new Date().toLocaleDateString()}</span>
                      <span className="history-status">⏳ Pending</span>
                    </div>
                    <div className="history-stats">
                      {[
                        ["File",       stats.fileName],
                        ["Rows",       stats.rawRows?.length ?? 0],
                        ["Issues",     stats.issues?.length ?? 0],
                        ["Missing",    stats.missing ?? 0],
                        ["Duplicates", stats.duplicates ?? 0],
                        ["Rules",      cleaningRules.length],
                      ].map(([label, val]) => (
                        <div key={label} className="history-stat">
                          <span className="stat-label">{label}:</span>
                          <span className="stat-value">{val}</span>
                        </div>
                      ))}
                    </div>
                    <button className="btn-view-details" onClick={() => setActiveTab("rules")}>Apply Rules →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Cleaning Progress Modal ──────────────────────────────────────── */}
      {cleaningInProgress && (
        <div className="cleaning-modal-overlay">
          <div className="cleaning-modal">
            <div className="cleaning-animation">
              <div className="spinner" />
              <h3>🧹 Cleaning in Progress...</h3>
            </div>
            <p style={{ color: "#6c56f5", fontSize: "0.875rem", marginBottom: "0.75rem", fontWeight: 500 }}>
              {cleaningStep}
            </p>
            <div className="progress-bar-clean">
              <div className="progress-fill-clean" style={{ width: `${cleaningProgress}%`, transition: "width 0.3s ease" }} />
            </div>
            <p className="progress-text">{Math.round(cleaningProgress)}% Complete</p>
            <p className="progress-status">Applying {validSelected.length} rule(s) to {totalRows.toLocaleString()} rows</p>
          </div>
        </div>
      )}

      {/* ── Results Modal ────────────────────────────────────────────────── */}
      {showResults && cleanedMeta && (
        <div className="cleaning-modal-overlay">
          <div className="results-modal">
            <div className="results-icon">✅</div>
            <h3>Cleaning Complete!</h3>

            <div className="results-stats">
              {[
                { label: "Rules Applied",    val: validSelectedRef.current.length,              color: "#6c56f5" },
                { label: "Output Rows",      val: cleanedMeta.totalRows?.toLocaleString(),       color: "#10b981" },
                { label: "Rows Removed",     val: cleanedMeta.rowsRemoved,                       color: "#ef4444" },
                { label: "Cells Filled",     val: cleanedMeta.cellsFilled,                       color: "#f59e0b" },
                { label: "Files Processed",  val: cleanedMeta.filesProcessed,                    color: "#3b82f6" },
                { label: "File",             val: statsArray.length > 1 ? `${statsArray.length} combined` : primaryStats.fileName, color: "#6b7280" },
              ].map(({ label, val, color }) => (
                <div key={label} className="result-stat">
                  <span className="result-label">{label}:</span>
                  <span className="result-value" style={{ color }}>{val}</span>
                </div>
              ))}
            </div>

            <div style={{ margin: "0.75rem 0", padding: "0.75rem 1rem", background: "#f0fdf4", borderRadius: "8px", fontSize: "0.82rem", color: "#065f46" }}>
              ✅ Duplicates removed &nbsp;|&nbsp; Missing values filled &nbsp;|&nbsp; Whitespace trimmed &nbsp;|&nbsp; Format standardized
            </div>

            {/* ── Download buttons ───────────────────────────────────────── */}
            <div className="results-actions">
              <button className="btn-download-cleaned" onClick={downloadCleanedData}>
                📥 Download Clean CSV
              </button>
              <button
                onClick={downloadChangeReport}
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                📊 Download Change Report
              </button>
            </div>

            {/* Legend for report */}
            <div style={{ marginTop: "0.75rem", padding: "0.6rem 1rem", background: "#fffbeb", borderRadius: "8px", fontSize: "0.78rem", color: "#92400e", border: "1px solid #fcd34d" }}>
              📊 Change Report shows: &nbsp;
              <span style={{ color: "#10b981", fontWeight: 700 }}>🟢 Filled</span> &nbsp;
              <span style={{ color: "#d97706", fontWeight: 700 }}>🟡 Modified</span> &nbsp;
              <span style={{ color: "#ef4444", fontWeight: 700 }}>🔴 Removed</span>
              &nbsp;— before &amp; after in one HTML file
            </div>

            <button
              className="btn-close-results"
              style={{ marginTop: "0.75rem" }}
              onClick={() => {
                setShowResults(false);
                setSelectedRules([]);
                setCleanedData(null);
                setCleanedMeta(null);
                setCleaningResult(null);
                cleanedDataRef.current   = null;
                validSelectedRef.current = [];
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Tips ─────────────────────────────────────────────────────────── */}
      <div className="cleaning-tips">
        <h3>💡 Cleaning Tips</h3>
        <div className="tips-grid">
          {[
            ["⭐", "Select all recommended rules for best results"],
            ["🔢", "Numeric missing values → filled with column mean"],
            ["🔡", "Text fields (name/city) → Title Case applied"],
            ["🔁", "Duplicates are detected case-insensitively"],
            ["🚫", "Negative age/salary → converted to positive"],
            ["📊", "Outliers → replaced with mean (not removed)"],
            ["0️⃣", "Zero salary/price → replaced with column mean"],
            ["💾", "Download Change Report to see before & after with colors"],
          ].map(([icon, text]) => (
            <div key={text} className="tip-card">
              <span className="tip-icon">{icon}</span>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}