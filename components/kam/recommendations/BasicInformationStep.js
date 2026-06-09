import { FiArrowLeft, FiArrowRight, FiUser } from "react-icons/fi";
import FormField from "./FormField";

export default function BasicInformationStep({ form, session, onChange, onSave, onNext }) {
  const handlerEmail = session?.email || session?.name || "KAM";

  return (
    <>
      <section className="form-card">
        <div className="form-card-title">
          <h2>Step 1: Basic Information</h2>
          <p>Provide expected volume and routing information to calculate initial viability.</p>
        </div>
        <FormField label="Account Name" name="accountName" required placeholder="Enter legally registered company name" value={form.accountName} onChange={onChange} />
        <FormField label="Primary Address" name="primaryAddress" required>
          <textarea name="primaryAddress" placeholder="Street address, building, suite" value={form.primaryAddress} onChange={onChange} required />
        </FormField>
        <div className="field-grid">
          <FormField label="Area Name" name="areaName" placeholder="Enter Area name" value={form.areaName} onChange={onChange} />
          <FormField label="Zone Name" name="zoneName" placeholder="Enter Zone name" value={form.zoneName} onChange={onChange} />
        </div>
      </section>

      <section className="form-card">
        <div className="form-card-title"><h2>Contact &amp; Communications</h2></div>
        <div className="field-grid">
          <FormField label="Mobile Number" name="mobileNumber" required placeholder="+1 (555) 000-0000" value={form.mobileNumber} onChange={onChange} />
          <FormField label="Email Address" name="emailAddress" required type="email" placeholder="dispatch@company.com" value={form.emailAddress} onChange={onChange} />
          <FormField label="Office Phone" name="officePhone" placeholder="Ext. or Direct Line" value={form.officePhone} onChange={onChange} />
          <FormField label="Fax Number" name="faxNumber" placeholder="Facsimile line" value={form.faxNumber} onChange={onChange} />
        </div>
      </section>

      <section className="form-card">
        <div className="form-card-title"><h2>Service &amp; Logistics Profile</h2></div>
        <div className="field-grid">
          <FormField label="Business Type" name="businessType" placeholder="e.g., E-Commerce, Retail, B2B" value={form.businessType} onChange={onChange} />
          <FormField label="Service Required" name="serviceRequired">
            <select name="serviceRequired" value={form.serviceRequired} onChange={onChange}>
              <option value="">Select Inbound/Outbound</option><option>Inbound</option><option>Outbound</option><option>Inbound &amp; Outbound</option>
            </select>
          </FormField>
          <FormField label="Account Mode" name="accountMode">
            <select name="accountMode" value={form.accountMode} onChange={onChange}>
              <option value="">Select Tier</option><option>Tier 1</option><option>Tier 2</option><option>Tier 3</option>
            </select>
          </FormField>
          <FormField label="Handled By (KAM)" className="handled-field">
            <div><FiUser /> Auto-filled: {handlerEmail}</div>
          </FormField>
        </div>
        <div className="form-actions">
          <button className="outline-action" type="button"><FiArrowLeft /> Previous Step</button>
          <div>
            <button className="draft-action" type="button" onClick={onSave}>Save Draft</button>
            <button className="next-action" type="submit" onClick={onNext}>Next Step <FiArrowRight /></button>
          </div>
        </div>
      </section>
    </>
  );
}
