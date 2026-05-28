import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { Navigate, useNavigate } from "react-router-dom";

import FormField from "../components/common/FormField";
import AuthLayout from "../layouts/AuthLayout";
import { registerUser } from "../redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { GOVERNMENT_DEPARTMENTS, JURISDICTION_TYPES, USER_ROLES } from "../utils/constants";
import { registerSchema } from "../utils/validationSchemas";

const roleLabel = (role) => {
  const labels = {
    citizen: "Citizen",
    volunteer: "Volunteer",
    panchayatOfficer: "Panchayat Officer",
    departmentOfficer: "Department Officer",
    districtAdmin: "District Admin",
    stateAdmin: "State Admin",
    superAdmin: "Super Admin",
  };

  return labels[role] || role;
};

function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, loading, error } = useAppSelector((state) => state.auth);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "citizen",
      department: "",
      jurisdictionType: "Rural",
      state: "Rajasthan",
      district: "",
      tehsil: "",
      village: "",
      municipality: "",
      phone: "",
    },
  });

  const jurisdictionType = useWatch({
    control,
    name: "jurisdictionType",
  });
  const role = useWatch({
    control,
    name: "role",
  });

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (form) => {
    const result = await dispatch(registerUser(form));

    if (registerUser.fulfilled.match(result)) {
      toast.success("Account created successfully.");
      navigate("/dashboard");
      return;
    }

    toast.error(result.payload || "Unable to create account.");
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Register with the role, department, and jurisdiction profile that will govern your access inside the platform."
      footerText="Already registered?"
      footerLink="/login"
      footerLabel="Login here"
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Full Name" name="name" registration={register("name")} error={errors.name?.message} placeholder="Your name" className="md:col-span-2" />
        <FormField label="Email" name="email" type="email" registration={register("email")} error={errors.email?.message} placeholder="you@example.com" />
        <FormField label="Password" name="password" type="password" registration={register("password")} error={errors.password?.message} placeholder="Minimum 6 characters" />
        <FormField
          label="Role"
          name="role"
          as="select"
          registration={register("role")}
          error={errors.role?.message}
          options={USER_ROLES.map((item) => ({ value: item, label: roleLabel(item) }))}
        />
        <FormField label="Phone" name="phone" registration={register("phone")} error={errors.phone?.message} placeholder="Contact number" />
        <FormField
          label="Jurisdiction Type"
          name="jurisdictionType"
          as="select"
          registration={register("jurisdictionType")}
          error={errors.jurisdictionType?.message}
          options={JURISDICTION_TYPES.map((item) => ({ value: item, label: item }))}
        />
        <FormField label="State" name="state" registration={register("state")} error={errors.state?.message} placeholder="State" />
        <FormField label="District" name="district" registration={register("district")} error={errors.district?.message} placeholder="District" />
        <FormField label="Tehsil / Block" name="tehsil" registration={register("tehsil")} error={errors.tehsil?.message} placeholder="Tehsil or block" />

        {jurisdictionType === "Rural" ? (
          <FormField label="Village" name="village" registration={register("village")} error={errors.village?.message} placeholder="Village name" />
        ) : (
          <FormField
            label="Municipality"
            name="municipality"
            registration={register("municipality")}
            error={errors.municipality?.message}
            placeholder="Municipality or corporation"
          />
        )}

        {["departmentOfficer", "panchayatOfficer"].includes(role) ? (
          <FormField
            label="Department"
            name="department"
            as="select"
            registration={register("department")}
            error={errors.department?.message}
            options={[{ value: "", label: "Select department" }, ...GOVERNMENT_DEPARTMENTS.map((item) => ({ value: item, label: item }))]}
            className="md:col-span-2"
          />
        ) : null}

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
