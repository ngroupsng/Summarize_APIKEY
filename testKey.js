// testKey.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "Your_API_Key_Here"; // Replace with your actual API key
const genAI = new GoogleGenerativeAI(API_KEY);

async function testKey() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say hello in 1 sentence.");
    console.log("✅ API Key works! Response:", result.response.text());
  } catch (error) {
    console.error("❌ API Key not working:", error.message);
  }
}

testKey();
