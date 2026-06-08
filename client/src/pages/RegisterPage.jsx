import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { Navigate, useNavigate } from "react-router-dom";

import FormField from "../components/common/FormField";
import AuthLayout from "../layouts/AuthLayout";
import { registerUser } from "../redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { JURISDICTION_TYPES } from "../utils/constants";
import { registerSchema } from "../utils/validationSchemas";

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
      fatherName: "",
      motherName: "",
      dateOfBirth: "",
      gender: "",
      aadhaarNumber: "",
      email: "",
      password: "",
      role: "citizen",
      department: "",
      designation: "",
      employeeId: "",
      jurisdictionType: "Rural",
      state: "Rajasthan",
      address: "",
      district: "",
      tehsil: "",
      panchayat: "",
      village: "",
      municipality: "",
      ward: "",
      pincode: "",
      occupation: "",
      phone: "",
    },
  });

  const jurisdictionType = useWatch({
    control,
    name: "jurisdictionType",
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
      subtitle="Register as a citizen with the jurisdiction profile that will govern your access inside the platform."
      footerText="Already registered?"
      footerLink="/login"
      footerLabel="Login here"
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" value="citizen" {...register("role")} />
        <FormField label="Full Name" name="name" registration={register("name")} error={errors.name?.message} placeholder="Your name" className="md:col-span-2" />
        <FormField label="Father's Name" name="fatherName" registration={register("fatherName")} error={errors.fatherName?.message} placeholder="Father's name" />
        <FormField label="Mother's Name" name="motherName" registration={register("motherName")} error={errors.motherName?.message} placeholder="Mother's name" />
        <FormField label="Date of Birth" name="dateOfBirth" type="date" registration={register("dateOfBirth")} error={errors.dateOfBirth?.message} />
        <FormField label="Gender" name="gender" as="select" registration={register("gender")} error={errors.gender?.message} options={[{ value: "", label: "Select gender" }, { value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} />
        <FormField label="Aadhaar Number" name="aadhaarNumber" registration={register("aadhaarNumber")} error={errors.aadhaarNumber?.message} placeholder="12-digit Aadhaar" />
        <FormField label="Occupation" name="occupation" registration={register("occupation")} error={errors.occupation?.message} placeholder="Occupation" />
        <FormField label="Email" name="email" type="email" registration={register("email")} error={errors.email?.message} placeholder="you@example.com" />
        <FormField label="Password" name="password" type="password" registration={register("password")} error={errors.password?.message} placeholder="Minimum 6 characters" />
        <FormField label="Phone" name="phone" registration={register("phone")} error={errors.phone?.message} placeholder="Contact number" />
        <FormField
          label="Jurisdiction Type"
          name="jurisdictionType"
          as="select"
          registration={register("jurisdictionType")}
          error={errors.jurisdictionType?.message}
          options={JURISDICTION_TYPES.map((item) => ({ value: item, label: item }))}
        />
        <FormField label="Address" name="address" registration={register("address")} error={errors.address?.message} placeholder="House / street address" className="md:col-span-2" />
        <FormField label="State" name="state" registration={register("state")} error={errors.state?.message} placeholder="State" />
        <FormField label="District" name="district" registration={register("district")} error={errors.district?.message} placeholder="District" />
        <FormField label="Tehsil / Block" name="tehsil" registration={register("tehsil")} error={errors.tehsil?.message} placeholder="Tehsil or block" />
        <FormField label="Panchayat" name="panchayat" registration={register("panchayat")} error={errors.panchayat?.message} placeholder="Gram Panchayat" />
        <FormField label="Ward" name="ward" registration={register("ward")} error={errors.ward?.message} placeholder="Ward number" />
        <FormField label="Pincode" name="pincode" registration={register("pincode")} error={errors.pincode?.message} placeholder="Pincode" />

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
