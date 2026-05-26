import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import FormField from "../components/common/FormField";
import AuthLayout from "../layouts/AuthLayout";
import { loginUser } from "../redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";

function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, loading, error } = useAppSelector((state) => state.auth);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(loginUser(form));

    if (loginUser.fulfilled.match(result)) {
      navigate("/dashboard");
    }
  };

  return (
    <AuthLayout
      title="Login to the governance console"
      subtitle="Use your existing credentials to continue into the dashboard and complaint workflow."
      footerText="Need an account?"
      footerLink="/register"
      footerLabel="Create one here"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="citizen@example.com" />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter your password"
        />

        {error ? <p className="rounded-2xl bg-alert-100 px-4 py-3 text-sm font-medium text-alert-500">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ink-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-leaf-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
