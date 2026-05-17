import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import axios from "axios";

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

// CORRECTED askQuestion: Sends text + file to your Railway Backend
export async function askQuestion(text, subject, chatHistory, file = null) {
  try {
    const formData = new FormData();
    formData.append("text", text || "");
    formData.append("subject", subject);
    
    // Convert array to string so backend can parse it
    formData.append("chatHistory", JSON.stringify(chatHistory || []));

    // Agar user ne PDF/Image attach ki hai, toh usay form mein add karein
    if (file) {
      formData.append("file", file);
    }

    // Call your FastAPI Backend (Railway)
    const res = await api.post("/api/ask", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data; // Backend should return { answer: "..." }
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