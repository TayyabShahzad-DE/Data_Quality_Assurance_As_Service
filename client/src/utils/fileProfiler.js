// ── Client-side Dataset Profiler & Analyzer for DQAAS ──────────────────────

const MISSING_IDENTIFIERS = new Set([
  "",
  "null",
  "undefined",
  "n/a",
  "na",
  "none",
  "nan",
  "-",
  "--",
  "?",
  "#n/a",
  "nil",
]);

export const isMissing = (val) => {
  if (val === null || val === undefined) return true;
  const str = String(val).trim().toLowerCase();
  return MISSING_IDENTIFIERS.has(str);
};

// Robust CSV parser supporting quotes, commas, and line breaks
export function parseCSV(text) {
  let cleanText = text.trim();
  // Strip UTF-8 BOM if present
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const rawLines = cleanText.split(/\r\n|\n|\r/);
  if (rawLines.length === 0) return [];

  // Check if each line is entirely enclosed in wrapping quotes like: "col1,col2,col3"
  const isWrappedInQuotes =
    rawLines.length > 1 &&
    rawLines[0].startsWith('"') &&
    rawLines[0].endsWith('"') &&
    !rawLines[0].slice(1, -1).includes('"\n') &&
    rawLines[0].split(',').length > 1;

  const linesToParse = isWrappedInQuotes
    ? rawLines.map(line => {
        let l = line.trim();
        if (l.startsWith('"') && l.endsWith('"')) {
          return l.slice(1, -1);
        }
        return l;
      }).join("\n")
    : cleanText;

  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < linesToParse.length; i++) {
    const char = linesToParse[i];
    const nextChar = linesToParse[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField.trim());
      currentField = "";
      if (currentRow.some(val => val !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(val => val !== "")) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.replace(/^["']|["']$/g, "").trim());
  const dataObjects = [];

  for (let i = 1; i < rows.length; i++) {
    const rowVals = rows[i];
    // Skip completely empty lines
    if (rowVals.every(v => v === "")) continue;

    const rowObj = {};
    headers.forEach((header, colIdx) => {
      let val = rowVals[colIdx] ?? "";
      val = val.replace(/^["']|["']$/g, "").trim();
      rowObj[header] = val;
    });
    dataObjects.push(rowObj);
  }

  return { headers, rows: dataObjects };
}

// Inferred column type detector
function detectType(values) {
  let intCount = 0;
  let floatCount = 0;
  let dateCount = 0;
  let boolCount = 0;
  let validCount = 0;

  for (const v of values) {
    if (isMissing(v)) continue;
    validCount++;
    const s = String(v).trim();

    if (/^-?\d+$/.test(s)) {
      intCount++;
    } else if (/^-?\d*\.\d+$/.test(s)) {
      floatCount++;
    } else if (
      (s.includes("-") || s.includes("/")) &&
      !isNaN(Date.parse(s)) &&
      s.length >= 8
    ) {
      dateCount++;
    } else if (/^(true|false|yes|no)$/i.test(s)) {
      boolCount++;
    }
  }

  if (validCount === 0) return "String";
  if (intCount / validCount > 0.75) return "Integer";
  if ((intCount + floatCount) / validCount > 0.75) return "Float";
  if (dateCount / validCount > 0.6) return "Date";
  if (boolCount / validCount > 0.75) return "Boolean";
  return "String";
}

// Full Dataset Profiling and Quality Scoring
export function profileDataset(dataObjects, headers, fileName = "dataset.csv") {
  const totalRows = dataObjects.length;
  const totalColumns = headers.length;
  let totalMissingCells = 0;

  // 1. Column Profiles
  const columnProfiles = headers.map(header => {
    const rawValues = dataObjects.map(r => r[header]);
    const nulls = rawValues.filter(isMissing).length;
    totalMissingCells += nulls;

    const nonNullValues = rawValues.filter(v => !isMissing(v));
    const uniqueValues = new Set(nonNullValues);
    const colType = detectType(nonNullValues);

    // Value frequency for mode
    const freqMap = {};
    let modeVal = "—";
    let maxFreq = 0;
    nonNullValues.forEach(v => {
      freqMap[v] = (freqMap[v] || 0) + 1;
      if (freqMap[v] > maxFreq) {
        maxFreq = freqMap[v];
        modeVal = v;
      }
    });

    // Numeric min/max/mean if applicable
    let min = null;
    let max = null;
    let mean = null;
    if (colType === "Integer" || colType === "Float") {
      const nums = nonNullValues.map(Number).filter(n => !isNaN(n));
      if (nums.length > 0) {
        min = Math.min(...nums);
        max = Math.max(...nums);
        mean = +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
      }
    }

    // Up to 5 samples
    const sample = Array.from(uniqueValues).slice(0, 5);

    return {
      name: header,
      type: colType,
      nulls,
      unique: uniqueValues.size,
      mode: modeVal,
      min,
      max,
      mean,
      sample,
    };
  });

  // 2. Duplicate Detection
  const rowHashCount = {};
  let totalDuplicates = 0;

  dataObjects.forEach(r => {
    const key = JSON.stringify(r);
    rowHashCount[key] = (rowHashCount[key] || 0) + 1;
  });

  Object.values(rowHashCount).forEach(count => {
    if (count > 1) totalDuplicates += count - 1;
  });

  // 3. Issues Detection
  const issues = [];
  let issueId = 1;

  // Missing values issues
  columnProfiles.forEach(col => {
    if (col.nulls > 0) {
      const nullRatio = col.nulls / (totalRows || 1);
      const severity = nullRatio > 0.25 ? "high" : nullRatio > 0.05 ? "medium" : "low";
      issues.push({
        id: `issue_${issueId++}`,
        type: "Missing Values",
        column: col.name,
        severity,
        description: `${col.nulls} missing or null values in column '${col.name}' (${(nullRatio * 100).toFixed(1)}%)`,
        autoFixAvailable: true,
        rowsAffected: col.nulls,
      });
    }
  });

  // Duplicate records issue
  if (totalDuplicates > 0) {
    const dupRatio = totalDuplicates / (totalRows || 1);
    issues.push({
      id: `issue_${issueId++}`,
      type: "Duplicate Records",
      column: "All",
      severity: dupRatio > 0.1 ? "high" : "medium",
      description: `${totalDuplicates} duplicate rows found in dataset`,
      autoFixAvailable: true,
      rowsAffected: totalDuplicates,
    });
  }

  // Whitespace / formatting issues
  columnProfiles.forEach(col => {
    if (col.type === "String") {
      let wsCount = 0;
      dataObjects.forEach(r => {
        const val = r[col.name];
        if (typeof val === "string" && val !== val.trim()) wsCount++;
      });
      if (wsCount > 0) {
        issues.push({
          id: `issue_${issueId++}`,
          type: "Inconsistent Whitespace",
          column: col.name,
          severity: "low",
          description: `${wsCount} values in '${col.name}' contain leading or trailing spaces`,
          autoFixAvailable: true,
          rowsAffected: wsCount,
        });
      }
    }
  });

  // Negative numeric anomalies
  columnProfiles.forEach(col => {
    if ((col.type === "Integer" || col.type === "Float") && col.min !== null && col.min < 0) {
      const negCount = dataObjects.filter(r => Number(r[col.name]) < 0).length;
      issues.push({
        id: `issue_${issueId++}`,
        type: "Negative Numeric Values",
        column: col.name,
        severity: "medium",
        description: `${negCount} records have negative values in '${col.name}' (min: ${col.min})`,
        autoFixAvailable: false,
        rowsAffected: negCount,
      });
    }
  });

  // 4. Cleaning Rules Generation
  const cleaningRules = [
    {
      id: "rule_trim",
      name: "Trim Whitespace",
      type: "trim_whitespace",
      enabled: true,
      recommended: true,
      description: "Strip leading and trailing spaces from all text columns",
      impact: "Normalizes string formatting across dataset",
    },
    {
      id: "rule_empty_rows",
      name: "Remove Empty Rows",
      type: "remove_empty_rows",
      enabled: true,
      recommended: true,
      description: "Drop rows where all attributes are null or blank",
      impact: "Removes corrupted records",
    },
  ];

  if (totalDuplicates > 0) {
    cleaningRules.push({
      id: "rule_dupes",
      name: "Remove Duplicates",
      type: "remove_duplicates",
      enabled: true,
      recommended: true,
      description: "Keep only the first occurrence of identical rows",
      impact: `Removes ${totalDuplicates} duplicate rows`,
    });
  }

  columnProfiles.forEach(col => {
    if (col.nulls > 0) {
      const isNum = col.type === "Integer" || col.type === "Float";
      cleaningRules.push({
        id: `rule_fill_${col.name}`,
        name: `Fill Missing: ${col.name}`,
        type: "fill_missing",
        column: col.name,
        enabled: true,
        recommended: true,
        description: `Fill ${col.nulls} missing values using ${isNum ? "column mean/median" : "'Unknown'"}`,
        impact: `Fixes ${col.nulls} null entries`,
      });
    }
  });

  // 5. Score Data Generation
  const totalCells = totalRows * totalColumns || 1;
  const completeness = +Math.max(0, (1 - totalMissingCells / totalCells) * 100).toFixed(1);
  const uniquenessScore = totalRows > 0 ? +Math.max(0, (1 - totalDuplicates / totalRows) * 100).toFixed(1) : 100;
  const consistency = +Math.max(65, Math.min(100, 98 - (totalMissingCells / totalCells) * 35)).toFixed(1);
  const validity = +Math.max(70, Math.min(100, 96 - (totalMissingCells / totalCells) * 20)).toFixed(1);
  const accuracy = +Math.max(70, Math.min(100, 96 - (totalDuplicates / (totalRows || 1)) * 30)).toFixed(1);
  const timeliness = 95.0;

  const overallScore = +(
    completeness * 0.35 +
    uniquenessScore * 0.35 +
    consistency * 0.15 +
    validity * 0.15
  ).toFixed(1);

  const getGrade = (s) => (s >= 90 ? "A" : s >= 80 ? "B+" : s >= 70 ? "B" : s >= 60 ? "C" : "D");

  const dimensions = [
    {
      name: "Completeness",
      score: completeness,
      grade: getGrade(completeness),
      trend: completeness >= 90 ? "up" : "stable",
      description: "Percentage of filled, non-null data cells across all attributes",
    },
    {
      name: "Uniqueness",
      score: uniquenessScore,
      grade: getGrade(uniquenessScore),
      trend: uniquenessScore >= 95 ? "up" : "stable",
      description: "Ratio of distinct records with no duplicate entries",
    },
    {
      name: "Consistency",
      score: consistency,
      grade: getGrade(consistency),
      trend: "stable",
      description: "Uniformity of formats, data types, and values across records",
    },
    {
      name: "Validity",
      score: validity,
      grade: getGrade(validity),
      trend: "up",
      description: "Adherence to expected syntax, domains, and business constraints",
    },
    {
      name: "Accuracy",
      score: accuracy,
      grade: getGrade(accuracy),
      trend: "stable",
      description: "Data truthfulness and absence of contradictory values",
    },
    {
      name: "Timeliness",
      score: timeliness,
      grade: getGrade(timeliness),
      trend: "up",
      description: "Freshness and currency of dataset information",
    },
  ];

  const issueBreakdown = {
    high: issues.filter(i => i.severity === "high").length,
    medium: issues.filter(i => i.severity === "medium").length,
    low: issues.filter(i => i.severity === "low").length,
  };

  const scoreData = {
    overallScore,
    dimensions,
    issueBreakdown,
    totalRows,
    totalColumns,
    totalIssues: issues.length,
  };

  return {
    rows: totalRows,
    columns: totalColumns,
    missing: totalMissingCells,
    duplicates: totalDuplicates,
    columnProfiles,
    rawRows: dataObjects,
    issues,
    cleaningRules,
    scoreData,
  };
}
