import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { Navigate, useNavigate } from "react-router-dom";

import FormField from "../components/common/FormField";
import AuthLayout from "../layouts/AuthLayout";
import { loginUser } from "../redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { loginSchema } from "../utils/validationSchemas";

function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, loading, error } = useAppSelector((state) => state.auth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (form) => {
    const result = await dispatch(loginUser(form));

    if (loginUser.fulfilled.match(result)) {
      toast.success("Login successful.");
      navigate("/dashboard");
      return;
    }

    toast.error(result.payload || "Unable to log in.");
  };

  return (
    <AuthLayout
      title="Login to the governance console"
      subtitle="Use your existing credentials to continue into the dashboard and complaint workflow."
      footerText="Need an account?"
      footerLink="/register"
      footerLabel="Create one here"
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          label="Email"
          name="email"
          type="email"
          registration={register("email")}
          error={errors.email?.message}
          placeholder="citizen@example.com"
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          registration={register("password")}
          error={errors.password?.message}
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
