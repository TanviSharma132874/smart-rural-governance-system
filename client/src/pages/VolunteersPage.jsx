import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import DataTable from "../components/common/DataTable";
import FormField from "../components/common/FormField";
import LoaderPanel from "../components/common/LoaderPanel";
import PaginationControls from "../components/common/PaginationControls";
import StatusBadge from "../components/common/StatusBadge";
import { useAppSelector } from "../redux/hooks";
import { connectLiveUpdates, getLiveUpdatesSocket } from "../services/liveUpdatesService";
import volunteerService from "../services/volunteerService";
import { JURISDICTION_TYPES, VOLUNTEER_APPROVAL_STATUSES, VOLUNTEER_AVAILABILITY, VOLUNTEER_SKILLS } from "../utils/constants";
import { getApiErrorMessage } from "../utils/formatters";
import { volunteerSchema } from "../utils/validationSchemas";

function VolunteersPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isCitizenFacing = ["citizen", "volunteer"].includes(user?.role);
  const canApprove = ["districtAdmin", "stateAdmin", "superAdmin"].includes(user?.role);
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalVolunteers: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(volunteerSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      district: user?.district || "",
      jurisdictionType: user?.jurisdictionType || "Rural",
      tehsil: user?.tehsil || "",
      village: user?.village || "",
      municipality: user?.municipality || "",
      availabilityStatus: "Available",
      skills: ["Medical"],
      bloodGroup: "",
      experience: "",
      emergencyContact: "",
      certifications: "",
    },
  });

  useEffect(() => {
    const loadVolunteers = async () => {
      setLoading(true);

      try {
        if (isCitizenFacing) {
          const response = await volunteerService.getProfile();
          setProfile(response.volunteer);
        } else {
          const response = await volunteerService.list({ page, limit: 10, ...(approvalFilter ? { approvalStatus: approvalFilter } : {}) });
          setRecords(response.data);
          setPagination(response.pagination || { page: 1, totalPages: 0, totalVolunteers: 0 });
        }
      } catch (requestError) {
        if (isCitizenFacing) {
          setProfile(null);
        } else {
          toast.error(getApiErrorMessage(requestError));
        }
      } finally {
        setLoading(false);
      }
    };

    loadVolunteers();
  }, [approvalFilter, isCitizenFacing, page]);

  useEffect(() => {
    const socket = connectLiveUpdates();

    const handleVolunteerApproved = async ({ volunteer }) => {
      if (isCitizenFacing) {
        if (profile?.id === volunteer.id) {
          const response = await volunteerService.getProfile();
          setProfile(response.volunteer);
        }
      } else {
        const response = await volunteerService.list({ page, limit: 10, ...(approvalFilter ? { approvalStatus: approvalFilter } : {}) });
        setRecords(response.data);
        setPagination(response.pagination || { page: 1, totalPages: 0, totalVolunteers: 0 });
      }
      toast.success(`Volunteer updated: ${volunteer.approvalStatus}`);
    };

    socket.on("volunteer:approved", handleVolunteerApproved);

    return () => {
      const activeSocket = getLiveUpdatesSocket();
      activeSocket?.off("volunteer:approved", handleVolunteerApproved);
    };
  }, [approvalFilter, isCitizenFacing, page, profile?.id, user]);

  const onSubmit = async (form) => {
    setBusy(true);

    try {
      await volunteerService.register({ ...form, skills: Array.isArray(form.skills) ? form.skills : [form.skills] });
      toast.success("Volunteer profile submitted.");
      const response = await volunteerService.getProfile();
      setProfile(response.volunteer);
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <LoaderPanel label="Loading volunteer workspace..." />;
  }

  if (isCitizenFacing) {
    return (
      <div className="space-y-5">
        <section className="rounded-[34px] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,245,220,0.94))] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Volunteer Registry</p>
          <h1 className="mt-3 font-display text-3xl text-ink-950">Offer verified help during emergencies</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-800">Register once, list your skills, and let the district response team mobilize trusted volunteers faster.</p>
        </section>

        {profile ? (
          <section className="glass-panel rounded-[32px] border border-white/70 bg-white/92 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">My Volunteer Profile</p>
                <h2 className="mt-2 font-display text-2xl text-ink-950">{profile.name}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={profile.approvalStatus} />
                <StatusBadge value={profile.availabilityStatus} />
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-ink-800">
              <p>{profile.skills.join(", ")}</p>
              {profile.bloodGroup ? <p><span className="font-semibold text-ink-950">Blood Group:</span> {profile.bloodGroup}</p> : null}
              {profile.experience ? <p><span className="font-semibold text-ink-950">Experience:</span> {profile.experience}</p> : null}
              {profile.emergencyContact ? <p><span className="font-semibold text-ink-950">Emergency Contact:</span> {profile.emergencyContact}</p> : null}
              {profile.certifications?.length ? <p><span className="font-semibold text-ink-950">Certifications:</span> {profile.certifications.join(", ")}</p> : null}
            </div>
          </section>
        ) : (
          <form className="glass-panel rounded-[32px] border border-white/70 bg-white/92 p-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Name" name="name" registration={register("name")} error={errors.name?.message} />
              <FormField label="Phone" name="phone" registration={register("phone")} error={errors.phone?.message} />
              <FormField label="District" name="district" registration={register("district")} error={errors.district?.message} />
              <FormField label="Jurisdiction" name="jurisdictionType" as="select" registration={register("jurisdictionType")} error={errors.jurisdictionType?.message} options={JURISDICTION_TYPES.map((item) => ({ value: item, label: item }))} />
              <FormField label="Tehsil / Block" name="tehsil" registration={register("tehsil")} error={errors.tehsil?.message} />
              <FormField label="Village" name="village" registration={register("village")} error={errors.village?.message} />
              <FormField label="Municipality" name="municipality" registration={register("municipality")} error={errors.municipality?.message} />
              <FormField label="Blood Group" name="bloodGroup" registration={register("bloodGroup")} error={errors.bloodGroup?.message} />
              <FormField label="Emergency Contact" name="emergencyContact" registration={register("emergencyContact")} error={errors.emergencyContact?.message} />
              <FormField label="Availability" name="availabilityStatus" as="select" registration={register("availabilityStatus")} error={errors.availabilityStatus?.message} options={VOLUNTEER_AVAILABILITY.map((item) => ({ value: item, label: item }))} />
              <FormField label="Primary Skill" name="skills" as="select" registration={register("skills")} error={errors.skills?.message} options={VOLUNTEER_SKILLS.map((item) => ({ value: item, label: item }))} className="md:col-span-2" />
              <FormField label="Experience" name="experience" registration={register("experience")} error={errors.experience?.message} className="md:col-span-2" />
              <FormField label="Certifications" name="certifications" registration={register("certifications")} error={errors.certifications?.message} placeholder="Comma separated certifications" className="md:col-span-2" />
            </div>
            <button type="submit" disabled={busy} className="mt-5 rounded-full bg-ink-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-leaf-600 disabled:opacity-60">
              Submit Volunteer Profile
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[34px] border border-slate-700 bg-[linear-gradient(135deg,rgba(24,30,51,0.98),rgba(41,60,32,0.95))] p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">Volunteer Dashboard</p>
        <h1 className="mt-3 font-display text-3xl md:text-4xl">Approve and mobilize community responders</h1>
      </section>

      <section className="glass-panel rounded-[32px] border border-white/70 bg-white/92 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <FormField label="Approval Filter" name="approvalFilter" as="select" value={approvalFilter} onChange={(event) => { setApprovalFilter(event.target.value); setPage(1); }} options={[{ value: "", label: "All profiles" }, ...VOLUNTEER_APPROVAL_STATUSES.map((item) => ({ value: item, label: item }))]} />
          <div className="self-end">
            <PaginationControls page={pagination.page || page} totalPages={pagination.totalPages || 1} onPageChange={setPage} />
          </div>
        </div>
      </section>

      <DataTable
        columns={[
          {
            key: "name",
            label: "Volunteer",
            render: (row) => (
              <div>
                <p className="font-semibold text-ink-950">{row.name}</p>
                <p className="mt-1 text-xs text-ink-800">{row.skills.join(", ")}</p>
                {row.bloodGroup ? <p className="mt-1 text-xs text-ink-800">Blood Group: {row.bloodGroup}</p> : null}
              </div>
            ),
          },
          {
            key: "approvalStatus",
            label: "Approval",
            render: (row) => <StatusBadge value={row.approvalStatus} />,
          },
          {
            key: "availabilityStatus",
            label: "Availability",
            render: (row) => <StatusBadge value={row.availabilityStatus} />,
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                {canApprove && row.approvalStatus !== "Approved" && (
                  <button type="button" onClick={async () => { try { await volunteerService.approve(row.id, { approvalStatus: "Approved" }); toast.success("Volunteer approved."); const response = await volunteerService.list({ page, limit: 10, ...(approvalFilter ? { approvalStatus: approvalFilter } : {}) }); setRecords(response.data); setPagination(response.pagination || { page: 1, totalPages: 0, totalVolunteers: 0 }); } catch (requestError) { toast.error(getApiErrorMessage(requestError)); } }} className="rounded-full bg-ink-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-leaf-600">
                    Approve
                  </button>
                )}
                {canApprove && row.approvalStatus === "Approved" && row.availabilityStatus === "Completed" && (
                  <button type="button" onClick={async () => { try { await volunteerService.updateAvailability(row.id, { availabilityStatus: "Available" }); toast.success("Volunteer marked as available."); const response = await volunteerService.list({ page, limit: 10, ...(approvalFilter ? { approvalStatus: approvalFilter } : {}) }); setRecords(response.data); setPagination(response.pagination || { page: 1, totalPages: 0, totalVolunteers: 0 }); } catch (requestError) { toast.error(getApiErrorMessage(requestError)); } }} className="rounded-full bg-leaf-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-leaf-500">
                    Mark Available
                  </button>
                )}
                {row.approvalStatus === "Approved" && row.availabilityStatus !== "Completed" && <span className="text-xs font-bold text-leaf-700">Ready</span>}
              </div>
            )
          },
        ]}
        rows={records}
        emptyMessage="No volunteers found."
      />
    </div>
  );
}

export default VolunteersPage;
