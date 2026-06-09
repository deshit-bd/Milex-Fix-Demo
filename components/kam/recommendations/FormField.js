export default function FormField({ label, name, required, className = "", children, ...inputProps }) {
  return (
    <label className={`recommendation-field ${className}`}>
      <span>{label}{required && <i> *</i>}</span>
      {children || <input name={name} required={required} {...inputProps} />}
    </label>
  );
}
