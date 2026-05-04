import { useState, useRef, useEffect } from "react";
import { askQuestion, generateQuiz, generateAssignment, simplifyText, generateStudyPlan, analyzePastPaper } from "../services/firebase_and_api";

const SUBJECTS = ["Data Structures", "OOP", "DBMS", "Operating Systems", "Software Engineering", "Computer Networks"];

// ============================================================
// ChatPage
// ============================================================
export function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [subject, setSubject]   = useState("Data Structures");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages); setInput(""); setLoading(true);
    try {
      const data = await askQuestion(input, subject, messages);
      setMessages([...newMessages, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I couldn't get a response. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Ask AI Tutor</h1>
        <select value={subject} onChange={(e) => setSubject(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-200 p-4 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-medium">Ask any BSCS question!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
              msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
            }`}>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Type your question here... (Press Enter to send)" rows={2}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-medium disabled:opacity-50">Send</button>
      </div>
    </div>
  );
}

// ============================================================
// QuizPage
// ============================================================
export function QuizPage() {
  const [topic, setTopic]         = useState("");
  const [subject, setSubject]     = useState("Data Structures");
  const [count, setCount]         = useState(10);
  const [qType, setQType]         = useState("mcq");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers]     = useState({});
  const [score, setScore]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) { setError("Please enter a topic."); return; }
    setError(""); setLoading(true); setScore(null); setAnswers({});
    try {
      const data = await generateQuiz(topic, subject, count, qType);
      setQuestions(data.questions);
    } catch { setError("Failed to generate quiz. Please try again."); }
    setLoading(false);
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
    setScore(correct);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quiz Generator</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Linked Lists..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
            <select value={count} onChange={(e) => setCount(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={qType} onChange={(e) => setQType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="truefalse">True / False</option>
              <option value="short">Short Answer</option>
            </select>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button onClick={handleGenerate} disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
          {loading ? "Generating Quiz..." : "Generate Quiz"}
        </button>
      </div>
      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="font-medium text-gray-800 mb-3">Q{i+1}. {q.question}</p>
              {q.options && (
                <div className="space-y-2">
                  {q.options.map((opt, j) => (
                    <label key={j} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                      answers[i] === opt.charAt(0) ? "bg-blue-50 border-blue-400" : "border-gray-200 hover:bg-gray-50"
                    }`}>
                      <input type="radio" name={`q${i}`} value={opt.charAt(0)}
                        onChange={() => setAnswers({ ...answers, [i]: opt.charAt(0) })} className="text-blue-600" />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {score !== null && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${answers[i] === q.correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {answers[i] === q.correct ? "✅ Correct! " : `❌ Wrong. Correct: ${q.correct}. `}{q.explanation}
                </div>
              )}
            </div>
          ))}
          {score === null ? (
            <button onClick={handleSubmit} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl">Submit Quiz</button>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-blue-700">{score} / {questions.length}</p>
              <p className="text-gray-600 mt-1">{score === questions.length ? "Perfect score! 🎉" : score >= questions.length * 0.7 ? "Great job! 👍" : "Keep practicing! 💪"}</p>
              <button onClick={() => { setScore(null); setQuestions([]); setAnswers({}); }}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Try Again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// AssignmentPage
// ============================================================
export function AssignmentPage() {
  const [form, setForm]       = useState({ subject: "DBMS", topic: "", type: "theory", requirements: "" });
  const [draft, setDraft]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGenerate = async () => {
    if (!form.topic.trim()) { setError("Please enter a topic."); return; }
    setError(""); setLoading(true);
    try {
      const data = await generateAssignment(form.subject, form.topic, form.type, form.requirements);
      setDraft(data.draft);
    } catch { setError("Failed to generate assignment. Please try again."); }
    setLoading(false);
  };

  const handleCopy = () => { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="p-6 h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Assignment Generator</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Subject</label>
            <select name="subject" value={form.subject} onChange={handleChange}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Topic</label>
            <input name="topic" value={form.topic} onChange={handleChange}
              placeholder="e.g. Database Normalization..."
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Assignment Type</label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="theory">Theory (Written)</option>
              <option value="practical">Practical</option>
              <option value="code">Code (Programming)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Requirements (optional)</label>
            <textarea name="requirements" value={form.requirements} onChange={handleChange}
              placeholder="e.g. Cover 1NF, 2NF, 3NF..." rows={4}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={handleGenerate} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
            {loading ? "Generating..." : "Generate Assignment Draft"}
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Generated Draft</h2>
            {draft && (
              <button onClick={handleCopy} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100">
                {copied ? "Copied! ✓" : "Copy Draft"}
              </button>
            )}
          </div>
          {!draft && !loading && (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-center">
              <div><p className="text-4xl mb-3">📝</p><p>Your assignment draft will appear here</p></div>
            </div>
          )}
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p>Generating your assignment...</p>
              </div>
            </div>
          )}
          {draft && (
            <>
              <div className="flex-1 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{draft}</div>
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
                ⚠️ <strong>Important:</strong> This is an AI-generated draft. Please review and verify before submission.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Remaining pages placeholders
export function PastPaperPage() {
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState("DBMS");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const SUBJECTS = ["Data Structures","OOP","DBMS","Operating Systems","Software Engineering","Computer Networks"];

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setError("");
    } else {
      setError("Only PDF files are accepted.");
      setFile(null);
    }
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
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📄 Past Paper Analyzer</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-600">Select Subject</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Upload VU Past Paper (PDF)</label>
          <div className="mt-1 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
            <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="pdf-upload" />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <p className="text-4xl mb-2">📄</p>
              <p className="text-sm font-medium text-blue-600">{file ? file.name : "Click to upload PDF"}</p>
              <p className="text-xs text-gray-400 mt-1">Maximum size: 10MB</p>
            </label>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button onClick={handleAnalyze} disabled={loading || !file}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
          {loading ? "Analyzing Past Paper..." : "Analyze Past Paper"}
        </button>
        {loading && (
          <div className="text-center text-gray-500 text-sm">
            <div className="w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Extracting questions and generating answers...
          </div>
        )}
      </div>
      {results && (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-orange-700 font-medium">✅ Found {results.total_questions} questions in {results.subject}</p>
          </div>
          {results.results?.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="mb-3">
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Q{item.number}</span>
                <p className="text-sm font-medium text-gray-800 mt-2">{item.question}</p>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-bold text-green-600 mb-1">✅ Answer:</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export function SimplifierPage() {
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
    } catch { setResult("Error. Please try again."); }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Concept Simplifier</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-600">Paste your handout text</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Paste complex text from your handout here..."
            rows={6}
            className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="urdu" checked={inUrdu} onChange={(e) => setInUrdu(e.target.checked)} />
          <label htmlFor="urdu" className="text-sm text-gray-600">Explain in Urdu</label>
        </div>
        <button onClick={handleSimplify} disabled={loading || !text.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
          {loading ? "Simplifying..." : "Simplify This Text"}
        </button>
      </div>
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-700 mb-3">✅ Simplified Explanation</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{result}</p>
        </div>
      )}
    </div>
  );
}
export function CheckerPage() { return <div className="p-6"><h1 className="text-2xl font-bold">Assignment Checker</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>; }
export function PlannerPage() {
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

  const generatePlan = async () => {
    if (deadlines.length === 0) return;
    setLoading(true);
    try {
      const data = await generateStudyPlan(deadlines, hours);
      setPlan(data);
    } catch { alert("Error generating plan. Try again."); }
    setLoading(false);
  };

  const SUBJECTS = ["Data Structures","OOP","DBMS","Operating Systems","Software Engineering","Computer Networks"];
  const DAYS = ["mon","tue","wed","thu","fri","sat","sun"];
  const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📅 Study Planner</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Add Deadlines</h2>
          <div className="space-y-3">
            <select value={newDeadline.subject} onChange={(e) => setNewDeadline({...newDeadline, subject: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
            <input value={newDeadline.title} onChange={(e) => setNewDeadline({...newDeadline, title: e.target.value})}
              placeholder="Assignment title..." 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="date" value={newDeadline.due_date} onChange={(e) => setNewDeadline({...newDeadline, due_date: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={addDeadline}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">
              Add Deadline
            </button>
          </div>
          {deadlines.length > 0 && (
            <div className="mt-4 space-y-2">
              {deadlines.map((d, i) => (
                <div key={i} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 text-sm">
                  <span className="font-medium text-blue-700">{d.subject}</span>
                  <span className="text-gray-600">{d.title}</span>
                  <span className="text-gray-400">{d.due_date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Available Hours Per Day</h2>
          <div className="space-y-2">
            {DAYS.map((day, i) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600 w-8">{DAY_LABELS[i]}</span>
                <input type="range" min="0" max="8" value={hours[day]}
                  onChange={(e) => setHours({...hours, [day]: Number(e.target.value)})}
                  className="flex-1" />
                <span className="text-sm font-bold text-blue-600 w-8">{hours[day]}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button onClick={generatePlan} disabled={loading || deadlines.length === 0}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 mb-6">
        {loading ? "Generating Plan..." : "Generate Weekly Study Plan"}
      </button>
      {plan && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-700 mb-2">📋 Your Weekly Plan</h2>
          <p className="text-sm text-gray-500 mb-4">{plan.week_summary}</p>
          {plan.daily_plan?.map((day, i) => (
            <div key={i} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-blue-700 mb-2">{day.day} — {day.available_hours}h available</h3>
              {day.tasks?.map((task, j) => (
                <div key={j} className="flex items-start gap-2 text-sm text-gray-600 mb-1">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span><strong>{task.subject}:</strong> {task.task} ({task.duration})</span>
                </div>
              ))}
            </div>
          ))}
          {plan.priority_warning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
              ⚠️ {plan.priority_warning}
            </div>
          )}
        </div>
      )}
    </div>
  );
}