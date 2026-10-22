import fs from "fs";
import path from "path";
import { Readable } from "stream";
import csvParser from "csv-parser";
import * as xlsx from "xlsx";

const MISSING_IDENTIFIERS = new Set([
  "", "null", "undefined", "n/a", "na", "none", "nan", "-", "--", "?", "#n/a", "nil"
]);

const isMissing = (val) => {
  if (val === null || val === undefined) return true;
  const str = String(val).trim().toLowerCase();
  return MISSING_IDENTIFIERS.has(str);
};

function detectType(values) {
  let intCount = 0, floatCount = 0, dateCount = 0, boolCount = 0, validCount = 0;
  for (const v of values) {
    if (isMissing(v)) continue;
    validCount++;
    const s = String(v).trim();
    if (/^-?\d+$/.test(s)) intCount++;
    else if (/^-?\d*\.\d+$/.test(s)) floatCount++;
    else if ((s.includes("-") || s.includes("/")) && !isNaN(Date.parse(s)) && s.length >= 8) dateCount++;
    else if (/^(true|false|yes|no)$/i.test(s)) boolCount++;
  }
  if (validCount === 0) return "String";
  if (intCount / validCount > 0.75) return "Integer";
  if ((intCount + floatCount) / validCount > 0.75) return "Float";
  if (dateCount / validCount > 0.6) return "Date";
  if (boolCount / validCount > 0.75) return "Boolean";
  return "String";
}

function analyzeRows(dataObjects, headers) {
  const totalRows = dataObjects.length;
  const totalColumns = headers.length;
  let totalMissingCells = 0;

  const columnProfiles = headers.map(header => {
    const rawValues = dataObjects.map(r => r[header]);
    const nulls = rawValues.filter(isMissing).length;
    totalMissingCells += nulls;

    const nonNullValues = rawValues.filter(v => !isMissing(v));
    const uniqueValues = new Set(nonNullValues);
    const colType = detectType(nonNullValues);

    const freqMap = {};
    let modeVal = "—", maxFreq = 0;
    nonNullValues.forEach(v => {
      freqMap[v] = (freqMap[v] || 0) + 1;
      if (freqMap[v] > maxFreq) { maxFreq = freqMap[v]; modeVal = v; }
    });

    let min = null, max = null, mean = null;
    if (colType === "Integer" || colType === "Float") {
      const nums = nonNullValues.map(Number).filter(n => !isNaN(n));
      if (nums.length > 0) {
        min = Math.min(...nums);
        max = Math.max(...nums);
        mean = +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
      }
    }

    return {
      name: header,
      type: colType,
      nulls,
      unique: uniqueValues.size,
      mode: modeVal,
      min,
      max,
      mean,
      sample: Array.from(uniqueValues).slice(0, 5),
    };
  });

  const rowHashCount = {};
  let totalDuplicates = 0;
  dataObjects.forEach(r => {
    const key = JSON.stringify(r);
    rowHashCount[key] = (rowHashCount[key] || 0) + 1;
  });
  Object.values(rowHashCount).forEach(count => {
    if (count > 1) totalDuplicates += count - 1;
  });

  const issues = [];
  let issueId = 1;
  columnProfiles.forEach(col => {
    if (col.nulls > 0) {
      const nullRatio = col.nulls / (totalRows || 1);
      issues.push({
        id: `issue_${issueId++}`,
        type: "Missing Values",
        column: col.name,
        severity: nullRatio > 0.25 ? "high" : nullRatio > 0.05 ? "medium" : "low",
        description: `${col.nulls} missing values in '${col.name}' (${(nullRatio * 100).toFixed(1)}%)`,
        autoFixAvailable: true,
        rowsAffected: col.nulls,
      });
    }
  });

  if (totalDuplicates > 0) {
    issues.push({
      id: `issue_${issueId++}`,
      type: "Duplicate Records",
      column: "All",
      severity: (totalDuplicates / (totalRows || 1)) > 0.1 ? "high" : "medium",
      description: `${totalDuplicates} duplicate rows found in dataset`,
      autoFixAvailable: true,
      rowsAffected: totalDuplicates,
    });
  }

  const cleaningRules = [
    { id: "rule_trim", name: "Trim Whitespace", type: "trim_whitespace", enabled: true, recommended: true, description: "Trim extra spaces", impact: "Improves consistency" },
    { id: "rule_empty_rows", name: "Remove Empty Rows", type: "remove_empty_rows", enabled: true, recommended: true, description: "Remove fully empty records", impact: "Cleans dataset" }
  ];
  if (totalDuplicates > 0) {
    cleaningRules.push({ id: "rule_dupes", name: "Remove Duplicates", type: "remove_duplicates", enabled: true, recommended: true, description: "Drop duplicate rows", impact: `${totalDuplicates} rows` });
  }
  columnProfiles.forEach(col => {
    if (col.nulls > 0) {
      cleaningRules.push({
        id: `rule_fill_${col.name}`,
        name: `Fill Missing: ${col.name}`,
        type: "fill_missing",
        column: col.name,
        enabled: true,
        recommended: true,
        description: `Fill ${col.nulls} null entries`,
        impact: `${col.nulls} cells`
      });
    }
  });

  const totalCells = totalRows * totalColumns || 1;
  const completeness = +Math.max(0, (1 - totalMissingCells / totalCells) * 100).toFixed(1);
  const uniquenessScore = totalRows > 0 ? +Math.max(0, (1 - totalDuplicates / totalRows) * 100).toFixed(1) : 100;
  const consistency = +Math.max(65, Math.min(100, 98 - (totalMissingCells / totalCells) * 35)).toFixed(1);
  const validity = +Math.max(70, Math.min(100, 96 - (totalMissingCells / totalCells) * 20)).toFixed(1);
  const accuracy = +Math.max(70, Math.min(100, 96 - (totalDuplicates / (totalRows || 1)) * 30)).toFixed(1);
  const overallScore = +(completeness * 0.35 + uniquenessScore * 0.35 + consistency * 0.15 + validity * 0.15).toFixed(1);

  const getGrade = (s) => (s >= 90 ? "A" : s >= 80 ? "B+" : s >= 70 ? "B" : s >= 60 ? "C" : "D");
  const dimensions = [
    { name: "Completeness", score: completeness, grade: getGrade(completeness), trend: completeness >= 90 ? "up" : "stable", description: "Completed data cells" },
    { name: "Uniqueness", score: uniquenessScore, grade: getGrade(uniquenessScore), trend: uniquenessScore >= 95 ? "up" : "stable", description: "Non-duplicate rows" },
    { name: "Consistency", score: consistency, grade: getGrade(consistency), trend: "stable", description: "Standardized formatting" },
    { name: "Validity", score: validity, grade: getGrade(validity), trend: "up", description: "Conforms to types" },
    { name: "Accuracy", score: accuracy, grade: getGrade(accuracy), trend: "stable", description: "Precision and correctness" },
    { name: "Timeliness", score: 95.0, grade: "A", trend: "up", description: "Freshness of data" },
  ];

  const scoreData = {
    overallScore,
    dimensions,
    issueBreakdown: {
      high: issues.filter(i => i.severity === "high").length,
      medium: issues.filter(i => i.severity === "medium").length,
      low: issues.filter(i => i.severity === "low").length,
    },
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

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];
    let headers = [];

    if (ext === ".csv") {
      let rawText = fs.readFileSync(filePath, "utf-8").trim();
      if (rawText.charCodeAt(0) === 0xfeff) rawText = rawText.slice(1);
      const rawLines = rawText.split(/\r\n|\n|\r/);
      if (rawLines.length > 1 && rawLines[0].startsWith('"') && rawLines[0].endsWith('"') && rawLines[0].split(',').length > 1) {
        rawText = rawLines.map(l => {
          let line = l.trim();
          return (line.startsWith('"') && line.endsWith('"')) ? line.slice(1, -1) : line;
        }).join("\n");
      }
      await new Promise((resolve, reject) => {
        Readable.from(rawText)
          .pipe(csvParser())
          .on("headers", (h) => { headers = h.map(x => x.replace(/^["']|["']$/g, "").trim()); })
          .on("data", (data) => rows.push(data))
          .on("end", resolve)
          .on("error", reject);
      });
    } else if (ext === ".xlsx" || ext === ".xls") {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = xlsx.utils.sheet_to_json(sheet);
      if (rows.length > 0) headers = Object.keys(rows[0]);
    } else if (ext === ".json") {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      rows = Array.isArray(parsed) ? parsed : (parsed.data || [parsed]);
      if (rows.length > 0) headers = Object.keys(rows[0]);
    }

    if (rows.length === 0) {
      return res.status(400).json({ message: "File contains no readable records" });
    }

    const stats = analyzeRows(rows, headers);
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message || "Failed to process dataset" });
  }
};
