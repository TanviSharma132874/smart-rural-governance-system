import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { z } from "zod";

import FormField from "../components/common/FormField";
import LoaderPanel from "../components/common/LoaderPanel";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { updateProfile } from "../redux/slices/authSlice";

const profileSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address must be descriptive"),
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
    values: {
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
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

  const isCitizen = user.role === "citizen";

  const getFullJurisdiction = () => {
    const parts = [user.state, user.district];
    if (user.tehsil) parts.push(user.tehsil);
    if (user.panchayat) parts.push(user.panchayat);
    if (user.municipality) parts.push(user.municipality);
    if (user.village) parts.push(user.village);
    if (user.ward) parts.push(user.ward);
    return parts.filter(Boolean).join(" > ");
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="rounded-[34px] border border-slate-700 bg-[linear-gradient(135deg,#172033,#0f172a)] p-8 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-200 text-2xl font-bold text-ink-950 shadow-inner">
            {user.name?.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">Governance Identity</p>
            <h1 className="mt-1 font-display text-3xl">{user.name}</h1>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Identity Section */}
          <section className="glass-panel rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl text-ink-950 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-leaf-600" />
                Verified Identity Information
              </h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Immutable Source of Truth
              </span>
            </div>

            <div className="grid gap-y-8 gap-x-6 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Legal Name</p>
                <p className="text-sm font-semibold text-ink-900">{user.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Administrative Role</p>
                <p className="text-sm font-semibold capitalize text-leaf-700">{user.role}</p>
              </div>

              {isCitizen ? (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Aadhaar Identification</p>
                    <p className="text-sm font-mono font-semibold text-ink-900">
                      XXXX-XXXX-{user.aadhaarNumber?.slice(-4) || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date of Birth</p>
                    <p className="text-sm font-semibold text-ink-900">
                      {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("en-IN", { day: '2-digit', month: 'long', year: 'numeric' }) : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gender</p>
                    <p className="text-sm font-semibold text-ink-900">{user.gender || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Father's Full Name</p>
                    <p className="text-sm font-semibold text-ink-900">{user.fatherName || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mother's Full Name</p>
                    <p className="text-sm font-semibold text-ink-900">{user.motherName || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Professional Occupation</p>
                    <p className="text-sm font-semibold text-ink-900">{user.occupation || "N/A"}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Government Employee ID</p>
                    <p className="text-sm font-mono font-semibold text-ink-900">{user.employeeId || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Official Designation</p>
                    <p className="text-sm font-semibold text-ink-900">{user.designation || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned Department</p>
                    <p className="text-sm font-semibold text-ink-900">{user.department || "N/A"}</p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Contact Section */}
          <section className="glass-panel rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl text-ink-950 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Citizen Contact Registry
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-full bg-ink-950 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-leaf-600"
                >
                  Edit Contact Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  label="Verified Email Communication"
                  name="email"
                  registration={register("email")}
                  disabled={!isEditing}
                  error={errors.email?.message}
                />
                <FormField
                  label="Registered Mobile Network"
                  name="phone"
                  registration={register("phone")}
                  disabled={!isEditing}
                  error={errors.phone?.message}
                />
                <FormField
                  label="Permanent Residential Address"
                  name="address"
                  as="textarea"
                  registration={register("address")}
                  disabled={!isEditing}
                  error={errors.address?.message}
                  className="md:col-span-2"
                />
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-full bg-leaf-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-leaf-700 disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Confirm Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      reset();
                    }}
                    className="rounded-full border border-slate-300 px-6 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Discard Changes
                  </button>
                </div>
              )}
            </form>
          </section>
        </div>

        <div className="space-y-6">
          {/* Jurisdiction Card */}
          <section className="glass-panel rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Primary Administrative Jurisdiction</h3>
            <p className="mt-4 font-display text-lg leading-relaxed text-ink-950">
              {getFullJurisdiction()}
            </p>
            <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium uppercase tracking-tighter">Jurisdiction Type</span>
                <span className="font-bold text-ink-900">{user.jurisdictionType}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium uppercase tracking-tighter">Regional Pincode</span>
                <span className="font-bold text-ink-900">{user.pincode || "N/A"}</span>
              </div>
            </div>
          </section>

          {/* Security Notice */}
          <div className="rounded-[32px] bg-amber-50 p-6 border border-amber-100 shadow-sm">
            <h4 className="text-sm font-bold text-amber-900">Official Data Security</h4>
            <p className="mt-2 text-xs leading-relaxed text-amber-800">
              Identity data is synchronized with your verified Government credentials. For security, only contact information can be self-managed. To request changes to identity or family fields, please submit a **Profile Correction Request** through the authorized administrative portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;