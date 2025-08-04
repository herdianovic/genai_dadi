import "dotenv/config";
import express from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Helper function to extract the generated text from the AI response.
 * It tries to find the text in various possible locations within the response object.
 * @param {object} data - The response object from the GoogleGenAI API.
 * @returns {string} The extracted text or the full stringified JSON if not found.
 */
const extractGeneratedText = (data) => {
  try {
    const text = data?.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? data?.candidates?.[0]?.content?.parts?.[0]?.text ?? data?.response?.candidates?.[0]?.content?.text;

    return text ?? JSON.stringify(data, null, 2);
  } catch (err) {
    console.error("Galat ketika mengambil text:", err);
    return JSON.stringify(data, null, 2);
  }
};

// --- Inisialisasi Aplikasi ---
const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // Menggunakan memoryStorage agar file ada di buffer

// --- Konfigurasi dan Konstanta ---
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"; // Menggunakan model yang lebih baru dan mendukung banyak format
const DEFAULT_PORT = 3000;

// --- Inisialisasi Google GenAI ---
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_API_KEY);
const model = genAI.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });

// --- Middleware ---
app.use(express.json());

// --- Routes ---

// Endpoint untuk generate teks dari prompt
app.post("/generate-text", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Belum ada prompt yang diisi!" });
    }

    const result = await model.generateContent(prompt);
    res.json({ result: extractGeneratedText(result) });
  } catch (err) {
    console.error("Error in /generate-text:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * Helper function to convert a file buffer to a Generative Part.
 * @param {Buffer} buffer - The file buffer from multer.
 * @param {string} mimeType - The mimetype of the file.
 * @returns {object} The generative part object for the API.
 */
const fileToGenerativePart = (buffer, mimeType) => {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
};

// Endpoint untuk generate teks dari gambar dan prompt
app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  try {
    const { prompt } = req.body;
    const file = req.file;

    if (!prompt) {
      return res.status(400).json({ message: "Belum ada prompt yang diisi!" });
    }
    if (!file) {
      return res.status(400).json({ message: "File 'image' harus di-upload!" });
    }

    const imagePart = fileToGenerativePart(file.buffer, file.mimetype);
    const result = await model.generateContent([prompt, imagePart]);

    res.json({ result: extractGeneratedText(result) });
  } catch (err) {
    console.error("Error in /generate-from-image:", err);
    res.status(500).json({ message: err.message });
  }
});

// Endpoint untuk generate teks dari dokumen dan prompt
app.post("/generate-from-document", upload.single("document"), async (req, res) => {
  try {
    // Gunakan prompt dari request, atau gunakan nilai default jika tidak ada
    const prompt = req.body.prompt || "Ringkas dokumen ini";
    const file = req.file;

    // Guard clause untuk file tetap diperlukan
    if (!file) {
      return res.status(400).json({ message: "File 'document' harus di-upload!" });
    }

    const documentPart = fileToGenerativePart(file.buffer, file.mimetype);
    const result = await model.generateContent([prompt, documentPart]);

    res.json({ result: extractGeneratedText(result) });
  } catch (err) {
    console.error("Error in /generate-from-document:", err);
    res.status(500).json({ message: err.message });
  }
});

// Endpoint untuk generate teks dari audio dan prompt
app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  try {
    // Gunakan prompt dari request, atau gunakan nilai default jika tidak ada
    const prompt = req.body.prompt || "Transkripsikan audio ini";
    const file = req.file;

    // Guard clause untuk file tetap diperlukan
    if (!file) {
      return res.status(400).json({ message: "File 'audio' harus di-upload!" });
    }

    const audioPart = fileToGenerativePart(file.buffer, file.mimetype);
    const result = await model.generateContent([prompt, audioPart]);

    res.json({ result: extractGeneratedText(result) });
  } catch (err) {
    console.error("Error in /generate-from-audio:", err);
    res.status(500).json({ message: err.message });
  }
});

// Endpoint utama untuk mengecek status server
app.get("/", (req, res) => {
  res.status(200).send(`
    <h1>API Server GenAI Berjalan!</h1>
    <p>Server aktif dan siap menerima permintaan POST di endpoint:</p>
    <ul>
      <li><code>/generate-text</code></li>
      <li><code>/generate-from-image</code></li>
      <li><code>/generate-from-document</code></li>
      <li><code>/generate-from-audio</code></li>
    </ul>
  `);
});

// --- Menjalankan Server ---
app.listen(DEFAULT_PORT, () => {
  console.log("Aya servernya nih Gaes!");
  console.log(`Sok Mangga Buka di palih dieu : http://localhost:${DEFAULT_PORT}`);
});
