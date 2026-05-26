import { useMemo, useState } from "react";

import FormField from "../common/FormField";

const initialForm = {
  title: "",
  description: "",
  category: "",
  priority: "Medium",
  locationAddress: "",
  landmark: "",
  latitude: "",
  longitude: "",
};

function ComplaintComposer({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");

  const fileSummary = useMemo(() => files.map((file) => file.name).join(", "), [files]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.title || !form.description || !form.category) {
      setError("Title, description, and category are required.");
      return;
    }

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
      setForm(initialForm);
      setFiles([]);
    } catch (submitError) {
      setError(submitError.message || "Unable to create complaint right now.");
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

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Title" name="title" value={form.title} onChange={handleChange} placeholder="Damaged road near school" />
          <FormField
            label="Category"
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="Roads, Water, Electricity"
          />
        </div>

        <FormField
          label="Description"
          name="description"
          as="textarea"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe the issue clearly so the panchayat team can act quickly."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FormField
            label="Priority"
            name="priority"
            as="select"
            value={form.priority}
            onChange={handleChange}
            options={[
              { value: "Low", label: "Low" },
              { value: "Medium", label: "Medium" },
              { value: "High", label: "High" },
              { value: "Critical", label: "Critical" },
            ]}
          />
          <FormField label="Location" name="locationAddress" value={form.locationAddress} onChange={handleChange} placeholder="Ward road, near pond" />
          <FormField label="Landmark" name="landmark" value={form.landmark} onChange={handleChange} placeholder="Temple / bus stop" />
          <FormField label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} placeholder="Optional" />
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <FormField label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} placeholder="Optional" />
          <label className="flex items-end">
            <span className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-ink-900">
              <span className="mb-1 block text-sm font-semibold">Upload Images</span>
              <input className="mt-2 block w-full text-xs" type="file" accept="image/*" multiple onChange={handleFileChange} />
            </span>
          </label>
        </div>

        {fileSummary ? <p className="text-xs text-ink-800">Selected: {fileSummary}</p> : null}
        {error ? <p className="rounded-2xl bg-alert-100 px-4 py-3 text-sm font-medium text-alert-500">{error}</p> : null}

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
