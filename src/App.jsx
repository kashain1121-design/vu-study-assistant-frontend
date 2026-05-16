import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { auth } from "./services/firebase_and_api";
import { onAuthStateChanged } from "firebase/auth";
import ErrorBoundary from "./ErrorBoundary";

import { Login, Register } from "./pages/Auth_Pages";
import { ChatPage, PastPaperPage, QuizPage, SimplifierPage, AssignmentPage, PlannerPage } from "./pages/Feature_Pages";
import { Sidebar, Dashboard, CheckerPage } from "./pages/Sidebar_Dashboard_Checker";

export const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>Loading VU Study Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
        <Router>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
            <Route path="/*" element={
              <ProtectedRoute user={user}>
                <div className={`flex h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                  <Sidebar user={user} />
                  <main className={`flex-1 overflow-y-auto pt-14 lg:pt-0 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                    <Routes>
                      <Route path="/dashboard"   element={<Dashboard user={user} />} />
                      <Route path="/chat"        element={<ChatPage />} />
                      <Route path="/past-papers" element={<PastPaperPage />} />
                      <Route path="/quiz"        element={<QuizPage />} />
                      <Route path="/simplifier"  element={<SimplifierPage />} />
                      <Route path="/assignments" element={<AssignmentPage />} />
                      <Route path="/checker"     element={<CheckerPage />} />
                      <Route path="/planner"     element={<PlannerPage />} />
                      <Route path="*"            element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          </Routes>
        </Router>
      </ThemeContext.Provider>
    </ErrorBoundary>
  );
}

export default App;