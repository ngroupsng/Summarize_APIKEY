const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Gemini API setup
const API_KEY = "Your_API_Key_Here"; // Replace with your actual API key
const genAI = new GoogleGenerativeAI(API_KEY);

// SQLite DB setup
const db = new sqlite3.Database("summaries.db");
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      input_text TEXT,
      summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// POST: Upload PDF and summarize
app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ output: "No file uploaded" });

    const dataBuffer = fs.readFileSync(file.path);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Summarize this text:\n\n" + text);
    const summary = result.response.text();

    // Save in DB
    db.run(
      "INSERT INTO summaries (input_text, summary) VALUES (?, ?)",
      [text, summary],
      function (err) {
        if (err) console.error("DB insert error:", err.message);
      }
    );

    // Delete uploaded PDF after processing
    fs.unlinkSync(file.path);

    res.json({ output: summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ output: "⚠️ Error processing PDF / Gemini API" });
  }
});

// GET: Fetch all saved summaries
app.get("/api/history", (req, res) => {
  db.all("SELECT * FROM summaries ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: "DB fetch error" });
    res.json(rows);
  });
});

// Start server
app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));
