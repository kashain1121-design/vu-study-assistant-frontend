import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { askQuestion, generateQuiz, generateAssignment, simplifyText, generateStudyPlan, analyzePastPaper, resetChatSession } from "../services/firebase_and_api";
import { useTheme } from "../App";

const SUBJECTS = ["Data Structures", "OOP", "DBMS", "Operating Systems", "Software Engineering", "Computer Networks"];

function Spinner({ color = "border-blue-600" }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${color}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

function ErrorBox({ message }) {
  const { darkMode } = useTheme();
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${darkMode ? "text-red-400 bg-red-900/20 border border-red-800" : "text-red-600 bg-red-50 border border-red-200"}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function Label({ children }) {
  const { darkMode } = useTheme();
  return <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{children}</label>;
}

function SelectInput({ value, onChange, name, children }) {
  const { darkMode } = useTheme();
  return (
    <select value={value} onChange={onChange} name={name}
      className={`w-full mt-1.5 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}>
      {children}
    </select>
  );
}

function TextInput({ value, onChange, placeholder, name }) {
  const { darkMode } = useTheme();
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} name={name}
      className={`w-full mt-1.5 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900"}`} />
  );
}

// ============================================================
// ChatPage
// ============================================================
// ============================================================
// ChatPage
// ============================================================
export function ChatPage() {
  const { darkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState("Data Structures");
  const [loading, setLoading] = useState(false);
  
  // NEW: State and Ref for File Upload
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
 
  const bottomRef = useRef(null);
  
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Load existing chat from Firestore
  useEffect(() => {
    const chatId = new URLSearchParams(window.location.search).get("id");
    if (!chatId) {
      resetChatSession();
      return;
    }
    const load = async () => {
      try {
        const { db } = await import("../services/firebase_and_api");
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "chats", chatId));
        if (snap.exists()) {
          const data = snap.data();
          setMessages(data.messages || []);
          setSubject(data.subject || "Data Structures");
        }
      } catch(e) { console.log(e); }
    };
    load();
  }, []);

  // NEW: Handle File Selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
      
  const sendMessage = async () => {
    if ((!input.trim() && !selectedFile) || loading) return;
    
    // Prepare message content (showing file name if attached)
    let displayContent = input;
    if (selectedFile) {
      displayContent = `[Attached File: ${selectedFile.name}]\n${input}`;
    }

    const userMessage = { role: "user", content: displayContent };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages); 
    setInput(""); 
    setLoading(true);
    
    // Save file reference locally before clearing state
    const fileToSend = selectedFile; 
    setSelectedFile(null); // Clear attachment UI immediately

    try {
      // NOTE: You will need to update your askQuestion API to accept and process 'fileToSend'
      const data = await askQuestion(input, subject, messages, fileToSend);
      setMessages([...newMessages, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Unable to get a response. This may be due to API rate limits. Please wait a moment and try again." }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center justify-between px-4 md:px-6 py-4 border-b z-10 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        <div>
          <h1 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Ask AI Tutor</h1>
          <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>Powered by Gemini AI</p>
        </div>
        <select value={subject} onChange={(e) => setSubject(e.target.value)}
          className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[160px] ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${darkMode ? "bg-blue-900/30" : "bg-blue-50"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className={`font-semibold mb-1 ${darkMode ? "text-white" : "text-gray-700"}`}>Ask any BSCS question</h3>
            <p className={`text-sm max-w-xs ${darkMode ? "text-gray-400" : "text-gray-400"}`}>Get detailed explanations, code examples, and step-by-step solutions</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
            )}
            <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed relative group ${
              msg.role === "user"
                ? "bg-blue-600 text-white rounded-br-sm"
                : `${darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border border-gray-200 text-gray-800"} rounded-bl-sm shadow-sm`
            }`}>
              {msg.role === "assistant" ? (
                <>
                  <ReactMarkdown className={`prose prose-sm max-w-none ${darkMode ? "prose-invert" : ""}`}>{msg.content}</ReactMarkdown>
                  <button
                    onClick={() => navigator.clipboard.writeText(msg.content)}
                    className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-500"}`}
                    title="Copy"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm`}>
              <div className="flex space-x-1 items-center h-4">
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${darkMode ? "bg-gray-500" : "bg-gray-400"}`} style={{animationDelay:"0ms"}}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${darkMode ? "bg-gray-500" : "bg-gray-400"}`} style={{animationDelay:"150ms"}}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${darkMode ? "bg-gray-500" : "bg-gray-400"}`} style={{animationDelay:"300ms"}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className={`px-4 md:px-6 py-4 border-t sticky bottom-0 z-10 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        
        {/* Attachment Preview Chip */}
        {selectedFile && (
          <div className="mb-3 flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "bg-blue-50 border-blue-100 text-blue-800"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-xs font-medium max-w-[200px] truncate">{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className={`ml-1 hover:text-red-500 transition-colors ${darkMode ? "text-gray-400" : "text-blue-400"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,image/*,.txt,.doc,.docx" 
          />

          {/* Plus / Attachment Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`p-3 rounded-xl transition-colors flex-shrink-0 border border-transparent ${darkMode ? "text-gray-400 hover:bg-gray-700 hover:text-gray-200" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
            title="Attach file or image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Text Area */}
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Ask a question or attach a file..."
            rows={selectedFile ? 1 : 2}
            className={`flex-1 border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900"}`} />
          
          {/* Send Button */}
          <button onClick={sendMessage} disabled={loading || (!input.trim() && !selectedFile)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl disabled:opacity-50 transition-colors flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// QuizPage
// ============================================================
export function QuizPage() {
  const { darkMode } = useTheme();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Data Structures");
  const [count, setCount] = useState(10);
  const [qType, setQType] = useState("mcq");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) { setError("Please enter a topic."); return; }
    setError(""); setLoading(true); setScore(null); setAnswers({});
    try {
      const data = await generateQuiz(topic, subject, count, qType);
      setQuestions(data.questions);
    } catch { setError("Service temporarily unavailable. Please check your connection and try again in a moment."); }
    setLoading(false);
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
    setScore(correct);
  };

  const scorePercent = score !== null ? Math.round((score / questions.length) * 100) : 0;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Quiz Generator</h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Test your knowledge with AI-generated questions</p>
      </div>

      <div className={`rounded-xl border p-5 mb-6 space-y-4 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Subject</Label>
            <SelectInput value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </SelectInput>
          </div>
          <div>
            <Label>Topic</Label>
            <TextInput value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Linked Lists, SQL Joins..." />
          </div>
          <div>
            <Label>Number of Questions</Label>
            <SelectInput value={count} onChange={(e) => setCount(Number(e.target.value))}>
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
            </SelectInput>
          </div>
          <div>
            <Label>Question Type</Label>
            <SelectInput value={qType} onChange={(e) => setQType(e.target.value)}>
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="truefalse">True / False</option>
              <option value="short">Short Answer</option>
            </SelectInput>
          </div>
        </div>
        {error && <ErrorBox message={error} />}
        <button onClick={handleGenerate} disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {loading ? <><Spinner /><span>Generating Quiz...</span></> : "Generate Quiz"}
        </button>
      </div>

      {questions.length === 0 && !loading && topic && (
        <div className={`text-center py-12 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${darkMode ? "text-gray-400" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No questions generated. Please try again.</p>
        </div>
      )}
      
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className={`rounded-xl border p-4 md:p-5 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <p className={`font-medium mb-3 text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>
              <span className="text-blue-600 font-bold mr-2">Q{i+1}.</span>{q.question}
            </p>
            {q.options && (
              <div className="space-y-2">
                {q.options.map((opt, j) => (
                  <label key={j} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border text-sm transition-all ${
                    answers[i] === opt.charAt(0)
                      ? (darkMode ? "bg-blue-900/30 border-blue-500 text-blue-300" : "bg-blue-50 border-blue-400 text-blue-800")
                      : (darkMode ? "border-gray-600 hover:bg-gray-700 text-gray-300" : "border-gray-200 hover:bg-gray-50 text-gray-700")
                  }`}>
                    <input type="radio" name={`q${i}`} value={opt.charAt(0)}
                      onChange={() => setAnswers({ ...answers, [i]: opt.charAt(0) })}
                      className="text-blue-600 flex-shrink-0" />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}
            {score !== null && (
              <div className={`mt-3 p-3 rounded-lg text-sm border ${
                answers[i] === q.correct
                  ? (darkMode ? "bg-green-900/20 border-green-800 text-green-400" : "bg-green-50 border-green-200 text-green-700")
                  : (darkMode ? "bg-red-900/20 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-700")
              }`}>
                <span className="font-semibold">{answers[i] === q.correct ? "Correct!" : `Wrong. Answer: ${q.correct}`}</span>
                {q.explanation && <span className="ml-1 opacity-80">{q.explanation}</span>}
              </div>
            )}
          </div>
        ))}

        {questions.length > 0 && (
          score === null ? (
            <button onClick={handleSubmit}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
              Submit Quiz
            </button>
          ) : (
            <div className={`border rounded-xl p-6 text-center ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="w-20 h-20 rounded-full border-4 border-blue-200 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-blue-600">{scorePercent}%</span>
              </div>
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{score} / {questions.length}</p>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {score === questions.length ? "Perfect score!" : score >= questions.length * 0.7 ? "Great job!" : "Keep practicing!"}
              </p>
              <button onClick={() => { setScore(null); setQuestions([]); setAnswers({}); setTopic(""); }}
                className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                Try Again
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ============================================================
// AssignmentPage
// ============================================================
export function AssignmentPage() {
  const { darkMode } = useTheme();
  const [form, setForm] = useState({ subject: "DBMS", topic: "", type: "theory", requirements: "" });
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGenerate = async () => {
    if (!form.topic.trim()) { setError("Please enter a topic."); return; }
    setError(""); setLoading(true);
    try {
      const data = await generateAssignment(form.subject, form.topic, form.type, form.requirements);
      setDraft(data.draft);
    } catch { setError("Service temporarily unavailable. Please check your connection and try again in a moment."); }
    setLoading(false);
  };

  const handleCopy = () => { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Assignment Generator</h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Generate professional assignment drafts with AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Form */}
        <div className={`rounded-xl border p-5 space-y-4 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div>
            <Label>Subject</Label>
            <SelectInput name="subject" value={form.subject} onChange={handleChange}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </SelectInput>
          </div>
          <div>
            <Label>Topic</Label>
            <TextInput name="topic" value={form.topic} onChange={handleChange} placeholder="e.g. Database Normalization..." />
          </div>
          <div>
            <Label>Assignment Type</Label>
            <SelectInput name="type" value={form.type} onChange={handleChange}>
              <option value="theory">Theory (Written)</option>
              <option value="practical">Practical</option>
              <option value="code">Code (Programming)</option>
            </SelectInput>
          </div>
          <div>
            <Label>Requirements (optional)</Label>
            <textarea name="requirements" value={form.requirements} onChange={handleChange}
              placeholder="e.g. Cover 1NF, 2NF, 3NF. Minimum 400 words..." rows={4}
              className={`w-full mt-1.5 border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900"}`} />
          </div>
          {error && <ErrorBox message={error} />}
          <button onClick={handleGenerate} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {loading ? <><Spinner /><span>Generating...</span></> : "Generate Assignment Draft"}
          </button>
        </div>

        {/* Output */}
        <div className={`rounded-xl border p-5 flex flex-col min-h-64 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Generated Draft</h2>
            {draft && (
              <button onClick={handleCopy}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                {copied ? (
                  <><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied</>
                ) : (
                  <><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                )}
              </button>
            )}
          </div>

          {!draft && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${darkMode ? "text-gray-500" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Your draft will appear here</p>
            </div>
          )}
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Generating your assignment...</p>
              </div>
            </div>
          )}
          {draft && (
            <>
              <div className={`flex-1 overflow-y-auto text-sm whitespace-pre-wrap leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{draft}</div>
              <div className={`mt-4 border rounded-lg p-3 ${darkMode ? "bg-amber-900/20 border-amber-800" : "bg-amber-50 border-amber-200"}`}>
                <p className={`text-xs ${darkMode ? "text-amber-400" : "text-amber-700"}`}><strong>Note:</strong> This is an AI-generated draft. Review and personalize before submission.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PastPaperPage
// ============================================================
export function PastPaperPage() {
  const { darkMode } = useTheme();
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState("DBMS");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (selected) => {
    if (selected && selected.type === "application/pdf") {
      setFile(selected); setError("");
    } else {
      setError("Only PDF files are accepted."); setFile(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) { setError("Please upload a PDF file."); return; }
    setLoading(true); setError(""); setResults(null);
    try {
      const data = await analyzePastPaper(file, subject);
      setResults(data);
    } catch { setError("Failed to analyze. Please try again."); }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Past Paper Analyzer</h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Upload a VU past paper and get AI-generated answers</p>
      </div>

      <div className={`rounded-xl border p-5 space-y-4 mb-4 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div>
          <Label>Subject</Label>
          <SelectInput value={subject} onChange={(e) => setSubject(e.target.value)}>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </SelectInput>
        </div>

        <div>
          <Label>Upload PDF</Label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`mt-1.5 border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragOver 
                ? (darkMode ? "border-blue-500 bg-blue-900/20" : "border-blue-400 bg-blue-50") 
                : file 
                  ? (darkMode ? "border-green-500 bg-green-900/20" : "border-green-400 bg-green-50") 
                  : (darkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-200 hover:border-gray-300")
            }`}
          >
            <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e.target.files[0])} className="hidden" id="pdf-upload" />
            <label htmlFor="pdf-upload" className="cursor-pointer block">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${file ? (darkMode ? "bg-green-900/40" : "bg-green-100") : (darkMode ? "bg-gray-700" : "bg-gray-100")}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${file ? "text-green-500" : (darkMode ? "text-gray-400" : "text-gray-400")}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {file ? (
                <p className={`text-sm font-medium ${darkMode ? "text-green-400" : "text-green-700"}`}>{file.name}</p>
              ) : (
                <>
                  <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Drop PDF here or click to browse</p>
                  <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Maximum size: 10MB</p>
                </>
              )}
            </label>
          </div>
        </div>

        {error && <ErrorBox message={error} />}
        <button onClick={handleAnalyze} disabled={loading || !file}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {loading ? <><Spinner /><span>Analyzing...</span></> : "Analyze Past Paper"}
        </button>
      </div>

      {results && (
        <div className="space-y-3">
          <div className={`border rounded-xl p-4 flex items-center gap-3 ${darkMode ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-sm font-medium ${darkMode ? "text-blue-400" : "text-blue-700"}`}>Found {results.total_questions} questions in {results.subject}</p>
          </div>
          {results.results?.map((item, i) => (
            <div key={i} className={`rounded-xl border p-4 md:p-5 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${darkMode ? "text-blue-300 bg-blue-900/40" : "text-blue-600 bg-blue-50"}`}>Q{item.number}</span>
                <p className={`text-sm font-medium mt-2 ${darkMode ? "text-white" : "text-gray-800"}`}>{item.question}</p>
              </div>
              <div className={`border-t pt-3 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                <p className={`text-xs font-semibold mb-2 uppercase tracking-wide ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Answer</p>
                <p className={`text-sm whitespace-pre-wrap leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SimplifierPage
// ============================================================
export function SimplifierPage() {
  const { darkMode } = useTheme();
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [inUrdu, setInUrdu] = useState(false);

  const handleSimplify = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const data = await simplifyText(text, inUrdu);
      setResult(data.simplified);
    } catch { setResult("Unable to simplify text. Please try again in a moment."); }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Concept Simplifier</h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Paste complex text and get a plain-language explanation</p>
      </div>

      <div className={`rounded-xl border p-5 space-y-4 mb-4 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div>
          <Label>Handout Text</Label>
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Paste complex text from your handout here..."
            rows={7}
            className={`w-full mt-1.5 border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900"}`} />
          <p className={`text-xs mt-1 text-right ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{text.length} / 2000 characters</p>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div className={`w-10 h-5 rounded-full transition-colors relative ${inUrdu ? "bg-blue-600" : (darkMode ? "bg-gray-600" : "bg-gray-200")}`}
            onClick={() => setInUrdu(!inUrdu)}>
            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${inUrdu ? "right-0.5" : "left-0.5"}`} />
          </div>
          <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Explain in Urdu</span>
        </label>

        <button onClick={handleSimplify} disabled={loading || !text.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {loading ? <><Spinner /><span>Simplifying...</span></> : "Simplify This Text"}
        </button>
      </div>

      {result && (
        <div className={`rounded-xl border p-5 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-5 h-5 rounded flex items-center justify-center ${darkMode ? "bg-green-900/40" : "bg-green-100"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${darkMode ? "text-green-400" : "text-green-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className={`font-semibold text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Simplified Explanation</h2>
          </div>
          <p className={`text-sm whitespace-pre-wrap leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{result}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PlannerPage
// ============================================================
export function PlannerPage() {
  const { darkMode } = useTheme();
  const [deadlines, setDeadlines] = useState([]);
  const [newDeadline, setNewDeadline] = useState({ subject: "DBMS", title: "", due_date: "" });
  const [hours, setHours] = useState({ mon: 2, tue: 2, wed: 1, thu: 2, fri: 1, sat: 3, sun: 3 });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const addDeadline = () => {
    if (!newDeadline.title || !newDeadline.due_date) return;
    setDeadlines([...deadlines, newDeadline]);
    setNewDeadline({ subject: "DBMS", title: "", due_date: "" });
  };

  const removeDeadline = (i) => setDeadlines(deadlines.filter((_, idx) => idx !== i));

  const generatePlan = async () => {
    if (deadlines.length === 0) return;
    setLoading(true);
    try {
      const data = await generateStudyPlan(deadlines, hours);
      setPlan(data);
    } catch { alert("Error generating plan. Try again."); }
    setLoading(false);
  };

  const DAYS = ["mon","tue","wed","thu","fri","sat","sun"];
  const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Study Planner</h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Add deadlines and get a personalized weekly study plan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Add Deadline */}
        <div className={`rounded-xl border p-5 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <h2 className={`font-semibold text-sm mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Add Deadline</h2>
          <div className="space-y-3">
            <SelectInput value={newDeadline.subject} onChange={(e) => setNewDeadline({...newDeadline, subject: e.target.value})}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </SelectInput>
            <TextInput value={newDeadline.title} onChange={(e) => setNewDeadline({...newDeadline, title: e.target.value})} placeholder="Assignment title..." />
            <input type="date" value={newDeadline.due_date} onChange={(e) => setNewDeadline({...newDeadline, due_date: e.target.value})}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white color-scheme-dark" : "bg-gray-50 border-gray-200 text-gray-900"}`} />
            <button onClick={addDeadline}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium">
              Add Deadline
            </button>
          </div>

          {deadlines.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Added Deadlines</p>
              {deadlines.map((d, i) => (
                <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{d.title}</p>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-400"}`}>{d.subject} — {d.due_date}</p>
                  </div>
                  <button onClick={() => removeDeadline(i)} className={`ml-2 transition-colors flex-shrink-0 ${darkMode ? "text-gray-400 hover:text-red-400" : "text-gray-300 hover:text-red-500"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hours */}
        <div className={`rounded-xl border p-5 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <h2 className={`font-semibold text-sm mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Available Hours Per Day</h2>
          <div className="space-y-3">
            {DAYS.map((day, i) => (
              <div key={day} className="flex items-center gap-3">
                <span className={`text-xs font-semibold w-7 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{DAY_LABELS[i]}</span>
                <input type="range" min="0" max="8" value={hours[day]}
                  onChange={(e) => setHours({...hours, [day]: Number(e.target.value)})}
                  className="flex-1 accent-blue-600" />
                <span className={`text-sm font-bold w-8 text-right ${darkMode ? "text-blue-400" : "text-blue-600"}`}>{hours[day]}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={generatePlan} disabled={loading || deadlines.length === 0}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mb-4">
        {loading ? <><Spinner /><span>Generating Plan...</span></> : "Generate Weekly Study Plan"}
      </button>

      {plan && (
        <div className={`rounded-xl border p-5 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <h2 className={`font-semibold text-sm mb-1 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Your Weekly Plan</h2>
          <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{plan.week_summary}</p>
          <div className="space-y-3">
            {plan.daily_plan?.map((day, i) => (
              <div key={i} className={`border rounded-xl p-4 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-semibold text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{day.day}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${darkMode ? "text-blue-300 bg-blue-900/40" : "text-blue-600 bg-blue-50"}`}>{day.available_hours}h available</span>
                </div>
                <div className="space-y-1.5">
                  {day.tasks?.map((task, j) => (
                    <div key={j} className={`flex items-start gap-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span><strong className={darkMode ? "text-gray-300" : "text-gray-700"}>{task.subject}:</strong> {task.task} <span className={darkMode ? "text-gray-500" : "text-gray-400"}>({task.duration})</span></span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {plan.priority_warning && (
            <div className={`mt-3 border rounded-lg p-3 ${darkMode ? "bg-amber-900/20 border-amber-800" : "bg-amber-50 border-amber-200"}`}>
              <p className={`text-xs ${darkMode ? "text-amber-400" : "text-amber-700"}`}>{plan.priority_warning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}