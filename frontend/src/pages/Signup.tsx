import { useState } from "react";

import type { FormEvent } from "react";

import { Link, useNavigate } from "react-router-dom";

import { signup } from "../services/api";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [role, setRole] = useState<"MENTOR" | "MENTEE" | "ADMIN">("MENTEE");

  const [adminCode, setAdminCode] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await signup({
        name,
        email,
        password,
        role,
        ...(role === "ADMIN" ? { adminCode } : {}),
      });

      alert("Account created successfully");

      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card signup-card">
        <div className="logo">💬</div>

        <h1>Create Account</h1>

        <p className="subtitle">Join Mentor–Mentee Portal</p>

        {error && (
          <div className="error">
            {Array.isArray(error) ? error.join(", ") : error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
            required
          />

          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            required
          />

          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            minLength={6}
            required
          />

          <label>Select Role</label>

          <select value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="MENTEE">Mentee</option>

            <option value="MENTOR">Mentor</option>

            <option value="ADMIN">Admin</option>
          </select>

          {role === "ADMIN" && (
            <>
              <label>Admin Code</label>

              <input
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Enter admin code"
                required
              />
            </>
          )}

          <button className="primary-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="auth-link">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
