import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth, db } from "../services/firebase_and_api";
import { signOut } from "firebase/auth";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { checkAssignment } from "../services/firebase_and_api";

const navItems = [
  { path: "/dashboard",   icon: "📊", label: "Dashboard"   },
  { path: "/chat",        icon: "💬", label: "Ask AI"      },
  { path: "/past-papers", icon: "📄", label: "Past Papers" },
  { path: "/quiz",        icon: "🧠", label: "Quiz"        },
  { path: "/simplifier",  icon: "📖", label: "Simplifier"  },
  { path: "/assignments", icon: "📝", label: "Assignments" },
  { path: "/checker",     icon: "✅", label: "Checker"     },
  { path: "/planner",     icon: "📅", label: "Planner"     },
];

export function Sidebar({ user }) {
  const location = useLocation();
  const handleLogout = async () => { await signOut(auth); };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">VU</span>
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Study Assistant</p>
            <p className="text-xs text-gray-400">Pro</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              location.pathname === item.path ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
            }`}>
            <span>{item.icon}</span><span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">{user?.displayName?.charAt(0) || "K"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.displayName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full text-sm text-red-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function Dashboard({ user }) {
  const [recentChats, setRecentChats] = useState([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const chatsQ = query(collection(db, "chats"), where("user_id", "==", user.uid), orderBy("created_at", "desc"), limit(3));
        const snapshot = await getDocs(chatsQ);
        setRecentChats(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.log("Could not load chats", e); }
    };
    loadData();
  }, [user]);

  const quickActions = [
    { label: "Ask AI",     path: "/chat",        icon: "💬", color: "bg-blue-500"   },
    { label: "New Quiz",   path: "/quiz",        icon: "🧠", color: "bg-purple-500" },
    { label: "Assignment", path: "/assignments", icon: "📝", color: "bg-green-500"  },
    { label: "Past Paper", path: "/past-papers", icon: "📄", color: "bg-orange-500" },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Good day, {user?.displayName?.split(" ")[0]}! 👋</h1>
        <p className="text-gray-500 mt-1">What would you like to study today?</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link key={action.path} to={action.path}
            className={`${action.color} text-white rounded-xl p-5 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity`}>
            <span className="text-3xl">{action.icon}</span>
            <span className="font-medium text-sm">{action.label}</span>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Recent Chats</h2>
          {recentChats.length === 0 ? (
            <p className="text-gray-400 text-sm">No chats yet. <Link to="/chat" className="text-blue-500">Ask your first question!</Link></p>
          ) : (
            <div className="space-y-3">
              {recentChats.map(chat => (
                <div key={chat.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-blue-500">💬</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{chat.subject || "General"}</p>
                    <p className="text-xs text-gray-400">{chat.messages?.length || 0} messages</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Feature Overview</h2>
          <div className="space-y-3 text-sm text-gray-600">
            {[["💬","Ask AI","Get answers to any BSCS question"],["📄","Past Papers","Upload & solve VU past papers"],["📝","Assignments","Generate assignment drafts"],["📅","Planner","Manage deadlines & study plan"]].map(([icon, title, desc]) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-lg">{icon}</span>
                <div><p className="font-medium text-gray-700">{title}</p><p className="text-xs">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckerPage() {
  const [answer, setAnswer]   = useState("");
  const [subject, setSubject] = useState("DBMS");
  const [topic, setTopic]     = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const SUBJECTS = ["Data Structures","OOP","DBMS","Operating Systems","Software Engineering","Computer Networks"];

  const handleCheck = async () => {
    if (answer.trim().length < 20) { setError("Please enter a longer answer (min 20 characters)."); return; }
    setError(""); setLoading(true);
    try {
      const data = await checkAssignment(answer, subject, topic);
      setResult(data);
    } catch { setError("Failed to check assignment. Please try again."); }
    setLoading(false);
  };

  const scoreColor = (score) => {
    if (score >= 8) return "text-green-600 bg-green-50";
    if (score >= 6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Assignment Checker</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Topic (optional)</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Normalization"
              className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Your Answer or Code</label>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
            placeholder="Paste your assignment answer or code here..." rows={8}
            className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button onClick={handleCheck} disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
          {loading ? "Checking..." : "Check My Answer"}
        </button>
      </div>
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className={`text-center p-4 rounded-xl ${scoreColor(result.score)}`}>
            <p className="text-4xl font-bold">{result.score} / 10</p>
            <p className="text-lg font-medium mt-1">Grade: {result.grade}</p>
          </div>
          <div>
            <h3 className="font-semibold text-green-700 mb-2">✅ Strengths</h3>
            <ul className="space-y-1">{result.strengths?.map((s, i) => <li key={i} className="text-sm text-gray-600">• {s}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-semibold text-red-600 mb-2">❌ Weaknesses</h3>
            <ul className="space-y-1">{result.weaknesses?.map((w, i) => <li key={i} className="text-sm text-gray-600">• {w}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-semibold text-blue-600 mb-2">💡 How to Improve</h3>
            <ul className="space-y-1">{result.improvements?.map((imp, i) => <li key={i} className="text-sm text-gray-600">• {imp}</li>)}</ul>
          </div>
          {result.overall_feedback && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">📋 Overall Feedback</h3>
              <p className="text-sm text-gray-600">{result.overall_feedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}