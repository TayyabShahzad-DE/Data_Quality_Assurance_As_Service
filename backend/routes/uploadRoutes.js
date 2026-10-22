import express from "express";
import multer from "multer";
import path from "path";
import { uploadFile } from "../controllers/uploadController.js";

const router = express.Router();

// ─── Multer setup ──────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ─── POST /api/upload ─────────────────────────
router.post("/", upload.single("file"), uploadFile);

export default router;