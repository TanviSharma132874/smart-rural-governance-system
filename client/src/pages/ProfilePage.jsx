import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { z } from "zod";

import FormField from "../components/common/FormField";
import LoaderPanel from "../components/common/LoaderPanel";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { updateProfile } from "../redux/slices/authSlice";
import { JURISDICTION_TYPES } from "../utils/constants";
import { getApiErrorMessage } from "../utils/formatters";

const profileSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address must be descriptive"),
  tehsil: z.string().optional(),
  panchayat: z.string().optional(),
  village: z.string().optional(),
  municipality: z.string().optional(),
  ward: z.string().optional(),
  pincode: z.string().optional(),
  occupation: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
});

function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      tehsil: user?.tehsil || "",
      panchayat: user?.panchayat || "",
      village: user?.village || "",
      municipality: user?.municipality || "",
      ward: user?.ward || "",
      pincode: user?.pincode || "",
      occupation: user?.occupation || "",
      fatherName: user?.fatherName || "",
      motherName: user?.motherName || "",
    },
  });

  const onSubmit = async (data) => {
    const result = await dispatch(updateProfile(data));
    if (updateProfile.fulfilled.match(result)) {
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } else {
      toast.error(result.payload || "Failed to update profile");
    }
  };

  if (!user) return <LoaderPanel label="Loading profile..." />;

  return (
    <div className="space-y-6">
      <header className="rounded-[34px] border border-slate-700 bg-ink-950 p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">Personal Governance Profile</p>
        <h1 className="mt-3 font-display text-3xl">Manage your identity and contact details</h1>
      </header>

      <div className="glass-panel rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink-950">Identity Information</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-full bg-leaf-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-leaf-700"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Read-Only Fields */}
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase text-slate-500">Full Name</p>
            <p className="text-sm font-medium text-ink-900">{user.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase text-slate-500">Aadhaar Number</p>
            <p className="text-sm font-medium text-ink-900">XXXX-XXXX-{user.aadhaarNumber?.slice(-4)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase text-slate-500">Role</p>
            <p className="text-sm font-medium capitalize text-leaf-700">{user.role}</p>
          </div>
          {user.employeeId && (
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase text-slate-500">Employee ID</p>
              <p className="text-sm font-medium text-ink-900">{user.employeeId}</p>
            </div>
          )}
          {user.department && (
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase text-slate-500">Department</p>
              <p className="text-sm font-medium text-ink-900">{user.department}</p>
            </div>
          )}
          {user.designation && (
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase text-slate-500">Designation</p>
              <p className="text-sm font-medium text-ink-900">{user.designation}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6 border-t border-slate-100 pt-8">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Email Address"
              name="email"
              registration={register("email")}
              disabled={!isEditing}
              error={errors.email?.message}
            />
            <FormField
              label="Phone Number"
              name="phone"
              registration={register("phone")}
              disabled={!isEditing}
              error={errors.phone?.message}
            />
            <FormField
              label="Address"
              name="address"
              registration={register("address")}
              disabled={!isEditing}
              error={errors.address?.message}
              className="md:col-span-2"
            />
            <FormField
              label="Tehsil / Block"
              name="tehsil"
              registration={register("tehsil")}
              disabled={!isEditing}
            />
            <FormField
              label="Panchayat"
              name="panchayat"
              registration={register("panchayat")}
              disabled={!isEditing}
            />
            {user.jurisdictionType === "Rural" ? (
              <FormField
                label="Village"
                name="village"
                registration={register("village")}
                disabled={!isEditing}
              />
            ) : (
              <FormField
                label="Municipality"
                name="municipality"
                registration={register("municipality")}
                disabled={!isEditing}
              />
            )}
            <FormField
              label="Ward"
              name="ward"
              registration={register("ward")}
              disabled={!isEditing}
            />
            <FormField
              label="Pincode"
              name="pincode"
              registration={register("pincode")}
              disabled={!isEditing}
            />
            <FormField
              label="Occupation"
              name="occupation"
              registration={register("occupation")}
              disabled={!isEditing}
            />
            <FormField
              label="Father's Name"
              name="fatherName"
              registration={register("fatherName")}
              disabled={!isEditing}
            />
            <FormField
              label="Mother's Name"
              name="motherName"
              registration={register("motherName")}
              disabled={!isEditing}
            />
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-ink-950 px-6 py-2 text-sm font-bold text-white transition hover:bg-leaf-600 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
                className="rounded-full border border-slate-300 px-6 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
