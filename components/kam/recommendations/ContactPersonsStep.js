import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import FormField from "./FormField";

function ContactFields({ prefix, form, onChange, requiredMobile = false, disabled = false }) {
  return (
    <div className="field-grid contact-grid">
      <FormField label="Name" name={`${prefix}Name`} required={requiredMobile} placeholder={prefix === "senior" ? "Full Legal Name" : prefix === "key" ? "Full Legal Name" : "Finance Lead Name"} value={form[`${prefix}Name`]} onChange={onChange} disabled={disabled} />
      <FormField label="Designation (Optional)" name={`${prefix}Designation`} placeholder={prefix === "senior" ? "e.g. General Manager" : prefix === "key" ? "e.g. Operations Manager" : "e.g. CFO / Accounts Payable"} value={form[`${prefix}Designation`]} onChange={onChange} disabled={disabled} />
      <FormField label={`Mobile${requiredMobile ? "" : " (Optional)"}`} name={`${prefix}Mobile`} required={requiredMobile} placeholder="+1 (555) 000-0000" value={form[`${prefix}Mobile`]} onChange={onChange} disabled={disabled} />
      <FormField label="Email" name={`${prefix}Email`} required type="email" placeholder={prefix === "financial" ? "billing@company.com" : "contact@company.com"} value={form[`${prefix}Email`]} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export default function ContactPersonsStep({ form, onChange, onSave, onNext, onPrevious }) {
  return (
    <section className="form-card contact-persons-card">
      <div className="form-card-title contact-title">
        <h2>Step 3: Contact Persons</h2>
        <p>Provide expected volume and routing information to calculate initial viability.</p>
      </div>

      <div className="contact-section">
        <h3><strong>1. Senior Management</strong></h3>
        <ContactFields prefix="senior" form={form} onChange={onChange} requiredMobile />
      </div>
      <div className="contact-section">
        <h3><strong>2. Key Contact Person</strong></h3>
        <ContactFields prefix="key" form={form} onChange={onChange} requiredMobile />
      </div>
      <div className="contact-section">
        <h3><strong>3. Financial Contact</strong></h3>
        <label className="same-contact">
          <input type="checkbox" name="useKeyAsFinancial" checked={form.useKeyAsFinancial} onChange={onChange} />
          <span>Same as Key Contact Person</span>
        </label>
        <ContactFields prefix="financial" form={form} onChange={onChange} disabled={form.useKeyAsFinancial} />
      </div>
      <div className="form-actions contact-actions">
        <button className="outline-action" type="button" onClick={onPrevious}><FiArrowLeft /> Previous Step</button>
        <div>
          <button className="draft-action" type="button" onClick={onSave}>Save Draft</button>
          <button className="next-action" type="submit" onClick={onNext}>Next Step <FiArrowRight /></button>
        </div>
      </div>
    </section>
  );
}
