import { GoogleGenAI } from "@google/genai"; // import class utamanya
import dotenv from 'dotenv';

// CommonJS --> require() --> module.exports = ...
// ESModule (ESM) --> import ... from ... --> export default ...

dotenv.config();

const GOOGLE_AI_STUDIO_API_KEY = process.env.GOOGLE_AI_STUDIO_API_KEY;

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
    apiKey: GOOGLE_AI_STUDIO_API_KEY
});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Halo kelas AVPN Google-Hacktiv8!",
  });
  console.log(response.text);
}

main();
