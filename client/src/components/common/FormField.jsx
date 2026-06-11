function FormField({
  label,
  name,
  value,
  onChange,
  registration,
  error,
  type = "text",
  as = "input",
  options = [],
  className = "",
  ...props
}) {
  const baseClassName =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink-950 outline-none transition focus:border-leaf-500 focus:ring-4 focus:ring-leaf-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

  const inputProps = registration || {
    name,
    value: value ?? "",
    onChange,
  };

  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-ink-900">
        {label}
      </span>

      {as === "textarea" ? (
        <textarea
          {...inputProps}
          className={`${baseClassName} min-h-32 resize-y`}
          {...props}
        />
      ) : as === "select" ? (
        <select {...inputProps} className={baseClassName} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...inputProps}
          type={type}
          className={baseClassName}
          {...props}
        />
      )}

      {error ? (
        <span className="mt-2 block text-xs font-medium text-alert-500">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export default FormField;