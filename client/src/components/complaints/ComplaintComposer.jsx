import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES } from "../../utils/constants";
import { complaintSchema } from "../../utils/validationSchemas";
import FormField from "../common/FormField";

function ComplaintComposer({ onSubmit, isSubmitting }) {
  const [files, setFiles] = useState([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      priority: "Medium",
      locationAddress: "",
      landmark: "",
      latitude: "",
      longitude: "",
    },
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

    files.forEach((file) => {
      payload.append("images", file);
    });

    try {
      await onSubmit(payload);
      reset();
      setFiles([]);
      toast.success("Complaint created successfully.");
    } catch (submitError) {
      toast.error(submitError.message || "Unable to create complaint right now.");
    }
  };

  return (
    <section className="glass-panel rounded-[32px] border border-white/70 bg-white/85 p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-leaf-600">Citizen Action</p>
          <h2 className="mt-2 font-display text-2xl text-ink-950">Raise a new complaint</h2>
        </div>
        <div className="rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-900">Photos supported</div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onValidSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Title"
            name="title"
            registration={register("title")}
            error={errors.title?.message}
            placeholder="Damaged road near school"
          />
          <FormField
            label="Category"
            name="category"
            as="select"
            registration={register("category")}
            error={errors.category?.message}
            options={[
              { value: "", label: "Select category" },
              ...COMPLAINT_CATEGORIES.map((category) => ({ value: category, label: category })),
            ]}
          />
        </div>

        <FormField
          label="Description"
          name="description"
          as="textarea"
          registration={register("description")}
          error={errors.description?.message}
          placeholder="Describe the issue clearly so the panchayat team can act quickly."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FormField
            label="Priority"
            name="priority"
            as="select"
            registration={register("priority")}
            error={errors.priority?.message}
            options={COMPLAINT_PRIORITIES.map((priority) => ({ value: priority, label: priority }))}
          />
          <FormField
            label="Location"
            name="locationAddress"
            registration={register("locationAddress")}
            error={errors.locationAddress?.message}
            placeholder="Ward road, near pond"
          />
          <FormField
            label="Landmark"
            name="landmark"
            registration={register("landmark")}
            error={errors.landmark?.message}
            placeholder="Temple / bus stop"
          />
          <FormField
            label="Latitude"
            name="latitude"
            registration={register("latitude")}
            error={errors.latitude?.message}
            placeholder="Optional"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <FormField
            label="Longitude"
            name="longitude"
            registration={register("longitude")}
            error={errors.longitude?.message}
            placeholder="Optional"
          />
          <label className="flex items-end">
            <span className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-ink-900">
              <span className="mb-1 block text-sm font-semibold">Upload Images</span>
              <input className="mt-2 block w-full text-xs" type="file" accept="image/*" multiple onChange={handleFileChange} />
            </span>
          </label>
        </div>

        {fileSummary ? <p className="text-xs text-ink-800">Selected: {fileSummary}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full bg-ink-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-leaf-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
    </section>
  );
}

export default ComplaintComposer;
