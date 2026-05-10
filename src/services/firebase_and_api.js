import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
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

export const askQuestion = async (question, subject, history) => {
  const res = await api.post("/api/ask", { question, subject, history });
  
  const user = auth.currentUser;
  if (user) {
    try {
      const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
      
      const newMessages = [
        ...history,
        { role: "user", content: question },
        { role: "assistant", content: res.data.answer }
      ];

      if (currentChatId) {
        // Update existing chat
        await updateDoc(doc(db, "chats", currentChatId), {
          messages: newMessages,
          updated_at: serverTimestamp(),
        });
      } else {
        // Create new chat
        const docRef = await addDoc(collection(db, "chats"), {
          user_id: user.uid,
          subject,
          messages: newMessages,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        currentChatId = docRef.id;
      }
    } catch (e) { console.log("Chat save error:", e); }
  }
  
  return res.data;
};

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