import { useEffect, useState } from "react";

import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ReportsPanel from "./components/ReportsPanel";

function App() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  useEffect(() => {
    const handleAuthChange = () => {
      const currentToken = localStorage.getItem("token");

      setToken(currentToken);
    };

    window.addEventListener("auth-change", handleAuthChange);

    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);

      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  return (
    <Routes>
      {/* LOGIN */}

      <Route
        path="/login"
        element={token ? <Navigate to="/" replace /> : <Login />}
      />

      {/* SIGNUP */}

      <Route
        path="/signup"
        element={token ? <Navigate to="/" replace /> : <Signup />}
      />

      {/* DASHBOARD */}

      <Route
        path="/"
        element={token ? <Dashboard /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/reports"
        element={token ? <ReportsPanel /> : <Navigate to="/login" replace />}
      />

      {/* UNKNOWN ROUTE */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
