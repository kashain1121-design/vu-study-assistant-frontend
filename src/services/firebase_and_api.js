import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore,  doc, updateDoc, serverTimestamp } from "firebase/firestore";
import axios from "axios";
// Helper function: File ko Base64 mein convert karne ke liye
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Data URL format (data:image/png;base64,xxxx) se sirf base64 string alag karna
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type // e.g., 'application/pdf' ya 'image/jpeg'
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Chat session management
let currentChatId = null;

// Updated askQuestion: Ab yeh File (PDF/Image) bhi accept karega
export async function askQuestion(text, subject, chatHistory, file = null) {
  try {
    // 1. Basic text prompt prepare karein
    let promptText = `You are a helpful AI Tutor for BSCS students. Subject: ${subject}.\n\nUser Question: ${text || "Please analyze the attached file."}`;
    
    // 2. Parts array banayein (Gemini API ko array chahiye hota hai agar file ho)
    let promptParts = [{ text: promptText }];

    // 3. Agar user ne file attach ki hai, to usay Base64 mein convert karke prompt mein add karein
    if (file) {
      const fileData = await fileToGenerativePart(file);
      promptParts.push(fileData);
    }

    // 4. Gemini API Call
    // IMPORTANT: Make sure to use gemini-1.5-flash as it supports files/images
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // Apna .env variable yahan check kar lena
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: promptParts }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "API Error");
    }

    const answer = data.candidates[0].content.parts[0].text;
    
    // Yahan par aap Firestore mein chat save karne ka logic (agar hai to) rakh sakte hain

    return { answer: answer };

  } catch (error) {
    console.error("Error in askQuestion:", error);
    throw error;
  }
}

export const resetChatSession = () => { currentChatId = null; };

export const analyzePastPaper = async (file, subject) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("subject", subject);
  const res = await api.post("/api/pdf/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const generateQuiz = async (topic, subject, count, qType) => {
  const res = await api.post("/api/quiz/generate", { topic, subject, count, q_type: qType });
  return res.data;
};

export const simplifyText = async (text, inUrdu = false) => {
  const res = await api.post("/api/simplify", { text, in_urdu: inUrdu });
  return res.data;
};

export const quickSummary = async (text) => {
  const res = await api.post("/api/quick-summary", { text });
  return res.data;
};

export const generateAssignment = async (subject, topic, assignType, requirements) => {
  const res = await api.post("/api/assignment/generate", {
    subject, topic, assign_type: assignType, requirements,
  });
  return res.data;
};

export const checkAssignment = async (answer, subject, topic) => {
  const res = await api.post("/api/assignment/check", { answer, subject, topic });
  return res.data;
};

export const generateStudyPlan = async (deadlines, hoursPerDay) => {
  const res = await api.post("/api/planner/generate", {
    deadlines, hours_per_day: hoursPerDay,
  });
  return res.data;
};

export default api;