import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { z } from "zod";

import BaseModal from "../components/common/BaseModal";
import DataTable from "../components/common/DataTable";
import FormField from "../components/common/FormField";
import LoaderPanel from "../components/common/LoaderPanel";
import PaginationControls from "../components/common/PaginationControls";
import StatusBadge from "../components/common/StatusBadge";
import { useAppSelector } from "../redux/hooks";
import authService from "../services/authService";
import {
  GOVERNMENT_DEPARTMENTS,
  JURISDICTION_TYPES,
  USER_ROLES,
} from "../utils/constants";
import { getApiErrorMessage } from "../utils/formatters";

const userCreationSchema = z.object({
  name: z.string().min(2, "Full Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Temporary password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number is required"),
  role: z.enum(["panchayatOfficer", "departmentOfficer", "districtAdmin", "stateAdmin", "superAdmin"]),
  department: z.string().optional(),
  designation: z.string().min(2, "Designation is required"),
  employeeId: z.string().min(2, "Employee ID is required"),
  jurisdictionType: z.enum(JURISDICTION_TYPES),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  tehsil: z.string().optional(),
  panchayat: z.string().optional(),
  municipality: z.string().optional(),
  ward: z.string().optional(),
});

const transferSchema = z.object({
  department: z.string().optional(),
  jurisdictionType: z.enum(JURISDICTION_TYPES),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  tehsil: z.string().optional(),
  panchayat: z.string().optional(),
  municipality: z.string().optional(),
  ward: z.string().optional(),
});

function UserManagementPage() {
  const performer = useAppSelector((state) => state.auth.user);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalUsers: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userCreationSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "Welcome@123",
      phone: "",
      role: "panchayatOfficer",
      department: "",
      designation: "",
      employeeId: "",
      jurisdictionType: "Rural",
      state: performer?.state || "Rajasthan",
      district: performer?.district || "",
      tehsil: "",
      panchayat: "",
      municipality: "",
      ward: "",
    },
  });

  const {
    register: registerTransfer,
    handleSubmit: handleSubmitTransfer,
    control: controlTransfer,
    reset: resetTransfer,
  } = useForm({
    resolver: zodResolver(transferSchema),
  });

  const selectedRole = useWatch({ control, name: "role" });
  const jurisdictionType = useWatch({ control, name: "jurisdictionType" });
  const transferJurisdictionType = useWatch({ control: controlTransfer, name: "jurisdictionType" });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await authService.listUsers({
        page,
        limit: 10,
        search,
        role: roleFilter,
      });
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter]);

  const onSubmit = async (data) => {
    setBusy(true);
    try {
      await authService.provisionUser(data);
      toast.success("User provisioned successfully");
      reset();
      loadUsers();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";
    try {
      await authService.updateStatus(user.id, nextStatus);
      toast.success(`User set to ${nextStatus}`);
      loadUsers();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      await authService.resetPassword(editingUser.id, newPassword);
      toast.success("Password reset successfully");
      setIsResetModalOpen(false);
      setNewPassword("");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onTransferSubmit = async (data) => {
    setBusy(true);
    try {
      await authService.transferUser(editingUser.id, data);
      toast.success("User transferred successfully");
      setIsTransferModalOpen(false);
      loadUsers();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to archive this user account?")) return;
    try {
      await authService.archiveUser(id);
      toast.success("User archived");
      loadUsers();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const provisionableRoles = USER_ROLES.filter((r) => {
    if (performer?.role === "superAdmin") return ["stateAdmin", "districtAdmin", "panchayatOfficer", "departmentOfficer"].includes(r);
    if (performer?.role === "stateAdmin") return ["districtAdmin", "panchayatOfficer", "departmentOfficer"].includes(r);
    if (performer?.role === "districtAdmin") return ["panchayatOfficer", "departmentOfficer"].includes(r);
    return false;
  });

  return (
    <div className="space-y-6">
      <header className="rounded-[34px] border border-slate-700 bg-ink-950 p-6 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">System Administration</p>
        <h1 className="mt-3 font-display text-3xl">Officer Provisioning & Registry</h1>
      </header>

      <section className="grid gap-6 xl:grid-cols-[400px_1fr]">
        {/* Provisioning Form */}
        <aside className="glass-panel rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm">
          <h2 className="mb-6 font-display text-xl text-ink-950">Provision New Officer</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Full Name" name="name" registration={register("name")} error={errors.name?.message} />
            <FormField label="Email" name="email" registration={register("email")} error={errors.email?.message} />
            <FormField label="Phone" name="phone" registration={register("phone")} error={errors.phone?.message} />
            <FormField label="Temp Password" type="password" name="password" registration={register("password")} error={errors.password?.message} />
            
            <FormField 
              label="Role" 
              name="role" 
              as="select" 
              registration={register("role")} 
              error={errors.role?.message}
              options={provisionableRoles.map(r => ({ value: r, label: r }))}
            />

            {(selectedRole === "panchayatOfficer" || selectedRole === "departmentOfficer") && (
              <FormField 
                label="Department" 
                name="department" 
                as="select" 
                registration={register("department")}
                options={GOVERNMENT_DEPARTMENTS.map(d => ({ value: d, label: d }))}
              />
            )}

            <FormField label="Designation" name="designation" registration={register("designation")} error={errors.designation?.message} />
            <FormField label="Employee ID" name="employeeId" registration={register("employeeId")} error={errors.employeeId?.message} />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Jurisdiction" name="jurisdictionType" as="select" registration={register("jurisdictionType")} options={JURISDICTION_TYPES.map(t => ({ value: t, label: t }))} />
              <FormField label="State" name="state" registration={register("state")} disabled={performer?.role !== "superAdmin"} />
            </div>

            <FormField label="District" name="district" registration={register("district")} disabled={performer?.role === "districtAdmin"} />

            {jurisdictionType === "Rural" ? (
              <>
                <FormField label="Tehsil" name="tehsil" registration={register("tehsil")} />
                <FormField label="Panchayat" name="panchayat" registration={register("panchayat")} />
              </>
            ) : (
              <>
                <FormField label="Municipality" name="municipality" registration={register("municipality")} />
                <FormField label="Ward" name="ward" registration={register("ward")} />
              </>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-ink-950 py-3 text-sm font-bold text-white transition hover:bg-leaf-600 disabled:opacity-50"
            >
              {busy ? "Provisioning..." : "Create Account"}
            </button>
          </form>
        </aside>

        {/* User List */}
        <main className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/80 p-4 shadow-sm">
            <div className="flex flex-1 gap-4">
              <input 
                type="text" 
                placeholder="Search name, email or ID..." 
                className="w-full max-w-xs rounded-full border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leaf-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select 
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <PaginationControls page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
          </div>

          <DataTable 
            columns={[
              { 
                key: "name", 
                label: "Identity", 
                render: (row) => (
                  <div>
                    <p className="font-bold text-ink-950">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.email}</p>
                    <p className="text-[10px] text-slate-400">ID: {row.id}</p>
                  </div>
                )
              },
              { 
                key: "role", 
                label: "Role", 
                render: (row) => (
                  <div className="space-y-1">
                    <StatusBadge value={row.role} /> 
                    <button 
                      onClick={() => handleToggleStatus(row)}
                      className={`block text-[10px] font-bold uppercase tracking-wider ${row.status === 'Active' ? 'text-leaf-600' : 'text-rose-600'}`}
                    >
                      {row.status} (Toggle)
                    </button>
                  </div>
                )
              },
              { 
                key: "jurisdiction", 
                label: "Scope", 
                render: (row) => (
                  <div className="text-xs">
                    <p className="font-semibold">{row.district}, {row.state}</p>
                    <p className="text-slate-400">{row.village || row.municipality || row.tehsil || row.panchayat}</p>
                    <p className="text-[10px] italic">{row.jurisdictionType}</p>
                  </div>
                )
              },
              { 
                key: "employeeId", 
                label: "Officer Metadata", 
                render: (row) => (
                  <div className="text-xs">
                    <p className="font-semibold">{row.employeeId || "N/A"}</p>
                    <p>{row.designation}</p>
                    <p className="text-leaf-700">{row.department}</p>
                  </div>
                )
              },
              {
                key: "actions",
                label: "Actions",
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => {
                        setEditingUser(row);
                        resetTransfer({
                          department: row.department,
                          jurisdictionType: row.jurisdictionType,
                          state: row.state,
                          district: row.district,
                          tehsil: row.tehsil,
                          panchayat: row.panchayat,
                          municipality: row.municipality,
                          ward: row.ward,
                        });
                        setIsTransferModalOpen(true);
                      }}
                      className="rounded-full bg-leaf-50 px-3 py-1 text-xs font-bold text-leaf-700 transition hover:bg-leaf-100"
                    >
                      Transfer
                    </button>
                    <button 
                      onClick={() => {
                        setEditingUser(row);
                        setIsResetModalOpen(true);
                      }}
                      className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                    >
                      Reset PWD
                    </button>
                    <button 
                      onClick={() => handleDelete(row.id)}
                      className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                    >
                      Archive
                    </button>
                  </div>
                )
              }
            ]}
            rows={users}
            emptyMessage="No users found in your jurisdiction."
          />
        </main>
      </section>

      {/* Transfer Modal */}
      <BaseModal isOpen={isTransferModalOpen} title={`Transfer: ${editingUser?.name}`} onClose={() => setIsTransferModalOpen(false)}>
        <form onSubmit={handleSubmitTransfer(onTransferSubmit)} className="space-y-4">
          {["panchayatOfficer", "departmentOfficer"].includes(editingUser?.role) && (
            <FormField 
              label="Department" 
              name="department" 
              as="select" 
              registration={registerTransfer("department")}
              options={GOVERNMENT_DEPARTMENTS.map(d => ({ value: d, label: d }))}
            />
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Jurisdiction" name="jurisdictionType" as="select" registration={registerTransfer("jurisdictionType")} options={JURISDICTION_TYPES.map(t => ({ value: t, label: t }))} />
            <FormField label="State" name="state" registration={registerTransfer("state")} disabled={performer?.role !== "superAdmin"} />
          </div>

          <FormField label="District" name="district" registration={registerTransfer("district")} disabled={performer?.role === "districtAdmin"} />

          {transferJurisdictionType === "Rural" ? (
            <>
              <FormField label="Tehsil" name="tehsil" registration={registerTransfer("tehsil")} />
              <FormField label="Panchayat" name="panchayat" registration={registerTransfer("panchayat")} />
            </>
          ) : (
            <>
              <FormField label="Municipality" name="municipality" registration={registerTransfer("municipality")} />
              <FormField label="Ward" name="ward" registration={registerTransfer("ward")} />
            </>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-ink-950 py-3 text-sm font-bold text-white transition hover:bg-leaf-600 disabled:opacity-50"
          >
            {busy ? "Processing..." : "Confirm Transfer"}
          </button>
        </form>
      </BaseModal>

      {/* Reset Password Modal */}
      <BaseModal isOpen={isResetModalOpen} title={`Reset Password: ${editingUser?.name}`} onClose={() => setIsResetModalOpen(false)}>
        <div className="space-y-4">
          <FormField 
            label="New Temporary Password" 
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 6 characters"
          />
          <button
            onClick={handleResetPassword}
            disabled={busy}
            className="w-full rounded-full bg-amber-600 py-3 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {busy ? "Updating..." : "Update Password"}
          </button>
        </div>
      </BaseModal>
    </div>
  );
}

export default UserManagementPage;