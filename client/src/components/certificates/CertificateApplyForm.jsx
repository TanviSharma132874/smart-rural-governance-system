import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-hot-toast";

import FormField from "../common/FormField";
import apiClient from "../../api/apiClient";
import LoaderPanel from "../common/LoaderPanel";

function CertificateApplyForm({ currentUser, isSubmitting, onSubmit }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docFiles, setDocFiles] = useState({}); // { "category-label": { file, category } }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      certificateType: "",
      remarks: "",
    },
  });

  const selectedCode = useWatch({ control, name: "certificateType" });
  const activeTemplate = useMemo(() => templates.find(t => t.code === selectedCode), [templates, selectedCode]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await apiClient.get("/certificate-templates");
        setTemplates(response.data.data.templates);
        if (response.data.data.templates.length > 0) {
          setValue("certificateType", response.data.data.templates[0].code);
        }
      } catch (err) {
        toast.error("Failed to load certificate types.");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [setValue]);

  const onValidSubmit = async (form) => {
    if (!activeTemplate) return;

    const payload = new FormData();
    payload.append("certificateType", activeTemplate.code);
    payload.append("remarks", form.remarks || "");

    const details = {};
    activeTemplate.fields.forEach(field => {
      if (form[field.name]) details[field.name] = form[field.name];
    });
    payload.append("certificateDetails", JSON.stringify(details));

    // Append documents with their categories in correct order
    Object.values(docFiles).forEach(({ file, category }) => {
      payload.append("documents", file);
      payload.append("documentCategories", category);
    });

    try {
      await onSubmit(payload);
      reset();
      setDocFiles({});
      toast.success(`${activeTemplate.name} application filed.`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Application submission failed.");
    }
  };

  if (loading) return <LoaderPanel label="Retrieving government templates..." />;

  const getFullJurisdiction = () => {
    const parts = [currentUser.state, currentUser.district, currentUser.tehsil, currentUser.panchayat || currentUser.municipality, currentUser.village || currentUser.ward];
    return parts.filter(Boolean).join(" > ");
  };

  return (
    <section className="rounded-[34px] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,247,229,0.95))] p-8 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Official Service Portal</p>
          <h2 className="mt-2 font-display text-3xl text-ink-950">Certificate Application</h2>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] font-bold uppercase text-slate-400">Applying As</p>
          <p className="text-sm font-bold text-ink-950">{currentUser.name}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-amber-50/50 p-4 border border-amber-100/50">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-tighter mb-1">Identity Baseline</p>
        <p className="text-sm text-amber-900 font-medium">
          Source Profile: <span className="font-bold">{getFullJurisdiction()}</span>
        </p>
        <p className="mt-1 text-[10px] text-amber-700 italic">Personal identity fields are auto-synchronized from your verified profile.</p>
      </div>

      <form className="mt-8 space-y-8" onSubmit={handleSubmit(onValidSubmit)}>
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            label="Select Certificate Type"
            name="certificateType"
            as="select"
            registration={register("certificateType")}
            options={templates.map((t) => ({ value: t.code, label: t.name }))}
          />
          <div className="flex flex-col justify-end pb-1">
            <p className="text-[10px] font-bold uppercase text-slate-400">Target Department</p>
            <p className="text-sm font-bold text-leaf-700">{activeTemplate?.department || "Loading..."}</p>
          </div>
        </div>

        {activeTemplate && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <h3 className="md:col-span-2 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                Required Information
              </h3>
              {activeTemplate.fields.map((field) => (
                <FormField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  type={field.fieldType}
                  as={field.fieldType === 'textarea' ? 'textarea' : 'input'}
                  registration={register(field.name, { required: field.required })}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  required={field.required}
                />
              ))}
              <FormField
                label="Additional Remarks"
                name="remarks"
                as="textarea"
                registration={register("remarks")}
                placeholder="Any additional context for the reviewing officer."
                className="md:col-span-2"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                Mandatory Supporting Documents
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {activeTemplate.requiredDocuments.map((doc, idx) => {
                  const docKey = `${doc.category}-${doc.label || idx}`;
                  return (
                    <div key={docKey} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-bold text-ink-950 mb-2">
                        {doc.label || doc.category} {doc.mandatory && <span className="text-rose-500">*</span>}
                      </p>
                      <input 
                        type="file" 
                        accept=".pdf,image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setDocFiles(prev => ({ ...prev, [docKey]: { file, category: doc.category } }));
                        }}
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !activeTemplate}
          className="w-full rounded-full bg-ink-950 py-4 text-sm font-black uppercase tracking-widest text-white transition hover:bg-amber-500 hover:text-ink-950 shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? "Transmitting Application..." : "Submit Official Application"}
        </button>
      </form>
    </section>
  );
}

export default CertificateApplyForm;
