import { useState } from "react";

import type { FormEvent } from "react";

import { Link, useNavigate } from "react-router-dom";

import { login } from "../services/api";

import { connectSocket } from "../socket/socket";

function Login() {
  const navigate = useNavigate();

  // ==============================
  // STATE
  // ==============================

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  // ==============================
  // LOGIN
  // ==============================

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Prevent double click
    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      // ==========================
      // CALL LOGIN API
      // ==========================

      const response = await login({
        email: email.trim().toLowerCase(),

        password,
      });

      console.log("========== LOGIN RESPONSE ==========");

      console.log("Response:", response);

      console.log("User:", response?.user);

      console.log("Token exists:", Boolean(response?.token));

      // ==========================
      // CHECK TOKEN
      // ==========================

      if (!response?.token) {
        throw new Error(
          "Login successful but JWT token was not received from backend.",
        );
      }

      // ==========================
      // CHECK USER
      // ==========================

      if (!response?.user) {
        throw new Error(
          "Login successful but user information was not received from backend.",
        );
      }

      // ==========================
      // CLEAR OLD SESSION
      // ==========================

      localStorage.removeItem("token");

      localStorage.removeItem("user");

      // ==========================
      // SAVE NEW TOKEN
      // ==========================

      localStorage.setItem("token", response.token);

      // ==========================
      // SAVE USER
      // ==========================

      localStorage.setItem("user", JSON.stringify(response.user));

      // ==========================
      // VERIFY STORAGE
      // ==========================

      const savedToken = localStorage.getItem("token");

      const savedUser = localStorage.getItem("user");

      console.log("========== STORAGE CHECK ==========");

      console.log("TOKEN SAVED:", Boolean(savedToken));

      console.log("USER SAVED:", Boolean(savedUser));

      if (!savedToken || !savedUser) {
        throw new Error("Login data could not be saved in browser storage.");
      }

      // ==========================
      // IMPORTANT
      // Tell App.tsx that login
      // has happened
      // ==========================

      window.dispatchEvent(new Event("auth-change"));

      console.log("AUTH CHANGE EVENT SENT");

      // ==========================
      // CONNECT SOCKET
      // ==========================

      try {
        connectSocket();

        console.log("Socket connection started.");
      } catch (socketError) {
        console.error("SOCKET CONNECTION ERROR:", socketError);

        // Socket error ko
        // login failure nahi banayenge.
      }

      // ==========================
      // GO TO DASHBOARD
      // ==========================

      console.log("Navigating to Dashboard...");

      navigate("/", {
        replace: true,
      });
    } catch (err: any) {
      console.error("========== LOGIN ERROR ==========");

      console.error(err);

      // ==========================
      // ERROR MESSAGE
      // ==========================

      let message = "Login failed. Please try again.";

      if (err?.response?.data?.message) {
        const backendMessage = err.response.data.message;

        if (Array.isArray(backendMessage)) {
          message = backendMessage.join(", ");
        } else {
          message = backendMessage;
        }
      } else if (err?.message) {
        message = err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // UI
  // ==============================

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* ========================
            LOGO
        ========================= */}

        <div className="logo">💬</div>

        {/* ========================
            TITLE
        ========================= */}

        <h1>Mentor Chat</h1>

        <p className="subtitle">Sign in to your account</p>

        {/* ========================
            ERROR
        ========================= */}

        {error && <div className="error">{error}</div>}

        {/* ========================
            LOGIN FORM
        ========================= */}

        <form onSubmit={handleSubmit}>
          {/* EMAIL */}

          <label htmlFor="email">Email</label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            autoComplete="email"
            required
            disabled={loading}
          />

          {/* PASSWORD */}

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            required
            disabled={loading}
          />

          {/* LOGIN BUTTON */}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* ========================
            SIGNUP LINK
        ========================= */}

        <p className="auth-link">
          Don't have an account? <Link to="/signup">Create account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
