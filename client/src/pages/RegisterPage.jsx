import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import FormField from "../components/common/FormField";
import AuthLayout from "../layouts/AuthLayout";
import { registerUser } from "../redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "citizen",
  phone: "",
  village: "",
  district: "",
};

function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, loading, error } = useAppSelector((state) => state.auth);
  const [form, setForm] = useState(initialForm);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(registerUser(form));

    if (registerUser.fulfilled.match(result)) {
      navigate("/dashboard");
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Register as a citizen or officer role that already exists in your backend authorization model."
      footerText="Already registered?"
      footerLink="/login"
      footerLabel="Login here"
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <FormField label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="Your name" className="md:col-span-2" />
        <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
        <FormField label="Password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimum 6 characters" />
        <FormField
          label="Role"
          name="role"
          as="select"
          value={form.role}
          onChange={handleChange}
          options={[
            { value: "citizen", label: "Citizen" },
            { value: "panchayatOfficer", label: "Panchayat Officer" },
            { value: "districtAdmin", label: "District Admin" },
            { value: "superAdmin", label: "Super Admin" },
            { value: "volunteer", label: "Volunteer" },
          ]}
        />
        <FormField label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="Contact number" />
        <FormField label="Village" name="village" value={form.village} onChange={handleChange} placeholder="Village name" />
        <FormField label="District" name="district" value={form.district} onChange={handleChange} placeholder="District name" />

        {error ? <p className="rounded-2xl bg-alert-100 px-4 py-3 text-sm font-medium text-alert-500 md:col-span-2">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="md:col-span-2 w-full rounded-full bg-ink-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-leaf-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
