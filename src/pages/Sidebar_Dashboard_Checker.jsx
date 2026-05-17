import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../App";
import { auth, db } from "../services/firebase_and_api";
import { signOut } from "firebase/auth";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { checkAssignment } from "../services/firebase_and_api";

const navItems = [
  { path: "/dashboard",   icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Dashboard" },
  { path: "/chat",        icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "Ask AI" },
  { path: "/past-papers", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "Past Papers" },
  { path: "/quiz",        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", label: "Quiz" },
  { path: "/simplifier",  icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", label: "Simplifier" },
  { path: "/assignments", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", label: "Assignments" },
  { path: "/checker",     icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", label: "Checker" },
  { path: "/planner",     icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Planner" },
];

function NavIcon({ d }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export function Sidebar({ user }) {
  const { darkMode, setDarkMode } = useTheme();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false); // eslint-disable-line
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleLogout = async () => { await signOut(auth); };

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center border-b ${darkMode ? "border-gray-700" : "border-gray-100"} ${collapsed ? "p-4 justify-center" : "p-5 gap-3"}`}>
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm tracking-tight">VU</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className={`font-semibold text-sm leading-tight ${darkMode ? "text-white" : "text-gray-900"}`}>Study Assistant</p>
            <p className="text-xs text-blue-500 font-medium">Pro</p>
          </div>
        )}
      </div>

      {/* Dark Mode Toggle Button */}
      <div className={`px-4 mt-4 ${collapsed ? "flex justify-center" : ""}`}>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-full flex items-center gap-2 text-sm py-2 px-3 rounded-lg transition-all font-medium ${
            darkMode 
              ? "bg-gray-700 text-yellow-400 hover:bg-gray-600 border border-gray-600" 
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
          } ${collapsed ? "justify-center px-0" : ""}`}
        >
          <div className={`w-8 h-4 rounded-full relative transition-all ${darkMode ? "bg-blue-600" : "bg-gray-300"} ${collapsed ? "hidden" : ""}`}>
            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${darkMode ? "right-0.5" : "left-0.5"}`} />
          </div>
          {!collapsed && (
            <span className={darkMode ? "text-gray-200" : "text-gray-600"}>
              {darkMode ? "Dark Mode" : "Light Mode"}
            </span>
          )}
          {collapsed && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {darkMode 
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              }
            </svg>
          )}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} title={collapsed ? item.label : ""}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                active ? "bg-blue-600 text-white shadow-sm" : `${darkMode ? "text-gray-300 hover:bg-gray-700 hover:text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`
              } ${collapsed ? "justify-center" : ""}`}>
              <span className={`flex-shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`}>
                <NavIcon d={item.icon} />
              </span>
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && <span className="ml-auto w-1.5 h-1.5 bg-blue-300 rounded-full" />}
            </Link>
          );
        })}
      </nav>

      <div className={`border-t ${darkMode ? "border-gray-700" : "border-gray-100"} ${collapsed ? "p-3" : "p-4"}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-xs">{user?.displayName?.charAt(0) || "U"}</span>
            </div>
            <button onClick={handleLogout} title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <div>
            <div className={`flex items-center gap-3 mb-3 p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-xs">{user?.displayName?.charAt(0) || "U"}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{user?.displayName}</p>
                <p className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-400"}`}>{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className={`w-full flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-lg transition-colors font-medium ${darkMode ? "text-gray-400 hover:text-red-400 hover:bg-red-900/20" : "text-gray-500 hover:text-red-600 hover:bg-red-50"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-40 border-b px-4 py-3 flex items-center justify-between ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">VU</span>
          </div>
          <span className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>Study Assistant Pro</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)}
          className={`p-2 rounded-lg transition-colors ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-40" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`lg:hidden fixed top-0 left-0 z-40 h-full w-64 shadow-xl transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <SidebarContent />
      </div>

      <div className={`hidden lg:flex flex-col h-full border-r transition-all duration-300 ${collapsed ? "w-16" : "w-60"} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <SidebarContent />
      </div>
    </>
  );
}

export function Dashboard({ user }) {
  const { darkMode } = useTheme();
  const [recentChats, setRecentChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const chatsQ = query(
          collection(db, "chats"),
          where("user_id", "==", user.uid),
          orderBy("created_at", "desc"),
          limit(5)
        );
        const snapshot = await getDocs(chatsQ);
        setRecentChats(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.log("Could not load chats", e); }
      finally { setChatsLoading(false); }
    };
    loadData();
  }, [user]);

  const quickActions = [
    { label: "Ask AI",      path: "/chat",        color: "bg-blue-600",    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { label: "Quiz",        path: "/quiz",        color: "bg-violet-600",  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { label: "Assignment",  path: "/assignments", color: "bg-emerald-600", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
    { label: "Past Papers", path: "/past-papers", color: "bg-amber-600",   icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  ];

  const features = [
    { path: "/chat",        label: "Ask AI Tutor",    desc: "Get answers to any BSCS question instantly",   icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { path: "/past-papers", label: "Past Papers",     desc: "Upload and analyze VU past papers with AI",     icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { path: "/assignments", label: "Assignment Help", desc: "Generate and check assignment drafts",          icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
    { path: "/planner",     label: "Study Planner",   desc: "Manage deadlines and weekly study plans",       icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  ];

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={`p-4 md:p-6 max-w-5xl mx-auto`}>
      <div className="mb-6">
        <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Welcome back, {user?.displayName?.split(" ")[0]}</h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>What would you like to study today?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {quickActions.map((action) => (
          <Link key={action.path} to={action.path}
            className={`${action.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-sm`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={action.icon} />
            </svg>
            <span className="font-medium text-xs md:text-sm text-center">{action.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[{ label: "Modules", value: "8" }, { label: "AI Powered", value: "Yes" }, { label: "Free", value: "100%" }].map(({ label, value }) => (
          <div key={label} className={`rounded-xl border p-4 text-center ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <p className="text-xl font-bold text-blue-600">{value}</p>
            <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Chats */}
        <div className={`rounded-xl border p-5 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Recent Chats</h2>
            <Link to="/chat" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New chat
            </Link>
          </div>
          {chatsLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg animate-pulse">
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  <div className="flex-1">
                    <div className={`h-3 rounded w-3/4 mb-1.5 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className={`h-2 rounded w-1/2 ${darkMode ? "bg-gray-600" : "bg-gray-100"}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : recentChats.length === 0 ? (
            <div className="text-center py-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? "text-gray-500" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>No chats yet</p>
              <Link to="/chat" className="text-blue-500 text-xs hover:underline mt-1 inline-block">Ask your first question</Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentChats.map(chat => (
                <Link
                  key={chat.id}
                  to={`/chat?id=${chat.id}`}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left group ${
                    darkMode 
                      ? "bg-gray-700/50 hover:bg-gray-700 border-transparent hover:border-gray-600" 
                      : "bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border-transparent"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${darkMode ? "bg-blue-900/40 group-hover:bg-blue-900/60" : "bg-blue-100 group-hover:bg-blue-200"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${darkMode ? "text-blue-400" : "text-blue-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate transition-colors ${darkMode ? "text-gray-200 group-hover:text-blue-400" : "text-gray-700 group-hover:text-blue-700"}`}>{chat.subject || "General"}</p>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-400"}`}>{chat.messages?.length || 0} messages · {formatTime(chat.created_at)}</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 flex-shrink-0 ${darkMode ? "text-gray-500 group-hover:text-blue-400" : "text-gray-300 group-hover:text-blue-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Features */}
        <div className={`rounded-xl border p-5 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <h2 className={`font-semibold text-sm mb-4 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Features</h2>
          <div className="space-y-3">
            {features.map(({ path, label, desc, icon }) => (
              <Link key={path} to={path} className="flex items-start gap-3 group">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 ${darkMode ? "bg-blue-900/40 group-hover:bg-blue-900/60" : "bg-blue-50 group-hover:bg-blue-100"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${darkMode ? "text-blue-400" : "text-blue-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium transition-colors ${darkMode ? "text-gray-200 group-hover:text-blue-400" : "text-gray-800 group-hover:text-blue-600"}`}>{label}</p>
                  <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CheckerPage() {
  const { darkMode } = useTheme();
  const [answer, setAnswer] = useState("");
  const [subject, setSubject] = useState("DBMS");
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    if (score >= 8) return darkMode ? "text-green-400 bg-green-900/20 border border-green-800" : "text-green-700 bg-green-50 border border-green-200";
    if (score >= 6) return darkMode ? "text-yellow-400 bg-yellow-900/20 border border-yellow-800" : "text-yellow-700 bg-yellow-50 border border-yellow-200";
    return darkMode ? "text-red-400 bg-red-900/20 border border-red-800" : "text-red-700 bg-red-50 border border-red-200";
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Assignment Checker</h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Get AI feedback on your answer or code</p>
      </div>
      <div className={`rounded-xl border p-5 space-y-4 mb-4 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}
              className={`w-full mt-1.5 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"}`}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Topic (optional)</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Normalization"
              className={`w-full mt-1.5 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200"}`} />
          </div>
        </div>
        <div>
          <label className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Your Answer or Code</label>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
            placeholder="Paste your answer or code here..." rows={8}
            className={`w-full mt-1.5 border rounded-lg px-3 py-2.5 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200"}`} />
        </div>
        {error && (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${darkMode ? "text-red-400 bg-red-900/20 border border-red-800" : "text-red-600 bg-red-50 border border-red-200"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
        )}
        <button onClick={handleCheck} disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {loading ? (
            <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>Analyzing...</>
          ) : "Check My Answer"}
        </button>
      </div>
      {result && (
        <div className={`rounded-xl border p-5 space-y-5 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className={`flex items-center justify-between p-4 rounded-xl ${scoreColor(result.score)}`}>
            <div>
              <p className="text-3xl font-bold">{result.score}<span className="text-lg font-medium opacity-60"> / 10</span></p>
              <p className="text-sm font-medium mt-0.5 opacity-80">Grade: {result.grade}</p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-current flex items-center justify-center opacity-20">
              <span className="text-2xl font-bold">{result.grade}</span>
            </div>
          </div>
          {[
            { title: "Strengths", items: result.strengths, bg: darkMode ? "bg-green-900/30" : "bg-green-100", text: darkMode ? "text-green-400" : "text-green-700", icon: "M5 13l4 4L19 7" },
            { title: "Weaknesses", items: result.weaknesses, bg: darkMode ? "bg-red-900/30" : "bg-red-100", text: darkMode ? "text-red-400" : "text-red-700", icon: "M6 18L18 6M6 6l12 12" },
            { title: "How to Improve", items: result.improvements, bg: darkMode ? "bg-blue-900/30" : "bg-blue-100", text: darkMode ? "text-blue-400" : "text-blue-700", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
          ].map(({ title, items, bg, text, icon }) => (
            <div key={title}>
              <h3 className={`text-sm font-semibold flex items-center gap-2 mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                <span className={`w-4 h-4 rounded flex items-center justify-center ${bg}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={icon} />
                  </svg>
                </span>
                {title}
              </h3>
              <ul className="space-y-1.5">
                {items?.map((item, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    <span className={`mt-0.5 flex-shrink-0 ${darkMode ? "text-gray-600" : "text-gray-300"}`}>—</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {result.overall_feedback && (
            <div className={`border rounded-lg p-4 ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
              <h3 className={`text-sm font-semibold mb-1.5 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Overall Feedback</h3>
              <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{result.overall_feedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}