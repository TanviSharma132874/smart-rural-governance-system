import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import {
  CERTIFICATE_TYPES,
  GOVERNMENT_DEPARTMENTS,
  JURISDICTION_TYPES,
} from "../../utils/constants";
import { certificateApplySchema } from "../../utils/validationSchemas";
import FormField from "../common/FormField";

function CertificateApplyForm({ currentUser, isSubmitting, onSubmit }) {
  const [files, setFiles] = useState([]);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(certificateApplySchema),
    defaultValues: {
      certificateType: "Birth Certificate",
      department: "Civil Registration Department",
      jurisdictionType: currentUser?.jurisdictionType || "Rural",
      state: currentUser?.state || "Rajasthan",
      district: currentUser?.district || "",
      tehsil: currentUser?.tehsil || "",
      village: currentUser?.village || "",
      municipality: currentUser?.municipality || "",
      remarks: "",
    },
  });

  const jurisdictionType = useWatch({
    control,
    name: "jurisdictionType",
  });
  const fileSummary = useMemo(() => files.map((file) => file.name).join(", "), [files]);

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const onValidSubmit = async (form) => {
    const payload = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (value !== "") {
        payload.append(key, value);
      }
    });

    files.forEach((file) => payload.append("documents", file));

    try {
      await onSubmit(payload);
      reset();
      setFiles([]);
      toast.success("Certificate application submitted.");
    } catch (error) {
      toast.error(error.message || "Unable to submit certificate application.");
    }
  };

  return (
    <section className="rounded-[34px] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,247,229,0.95))] p-6 shadow-[0_18px_50px_rgba(197,141,47,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Citizen Service</p>
      <h2 className="mt-2 font-display text-3xl text-ink-950">Apply for a government certificate</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-800">
        Complete one guided application, upload proof documents, and track your certificate through the official review and approval chain.
      </p>

      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onValidSubmit)}>
        <FormField
          label="Certificate Type"
          name="certificateType"
          as="select"
          registration={register("certificateType")}
          error={errors.certificateType?.message}
          options={CERTIFICATE_TYPES.map((item) => ({ value: item, label: item }))}
        />
        <FormField
          label="Department"
          name="department"
          as="select"
          registration={register("department")}
          error={errors.department?.message}
          options={GOVERNMENT_DEPARTMENTS.map((item) => ({ value: item, label: item }))}
        />
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
          <FormField label="Village" name="village" registration={register("village")} error={errors.village?.message} placeholder="Village" />
        ) : (
          <FormField
            label="Municipality"
            name="municipality"
            registration={register("municipality")}
            error={errors.municipality?.message}
            placeholder="Municipality or corporation"
          />
        )}
        <FormField
          label="Remarks"
          name="remarks"
          as="textarea"
          registration={register("remarks")}
          error={errors.remarks?.message}
          placeholder="Add optional supporting context for the reviewing officer."
          className="md:col-span-2"
        />
        <label className="md:col-span-2 block">
          <span className="mb-2 block text-sm font-semibold text-ink-900">Supporting Documents</span>
          <span className="block rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-ink-900">
            <input type="file" multiple accept=".pdf,image/*" onChange={handleFileChange} className="block w-full text-xs" />
          </span>
          {fileSummary ? <span className="mt-2 block text-xs text-ink-800">Selected: {fileSummary}</span> : null}
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="md:col-span-2 inline-flex w-full justify-center rounded-full bg-ink-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-amber-500 hover:text-ink-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit Certificate Application"}
        </button>
      </form>
    </section>
  );
}

export default CertificateApplyForm;
