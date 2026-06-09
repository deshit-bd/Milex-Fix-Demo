import { FiArrowLeft, FiArrowRight, FiInfo } from "react-icons/fi";
import FormField from "./FormField";

export default function FinancialTermsStep({ form, onChange, onSave, onNext, onPrevious }) {
  return (
    <>
      <section className="action-alert">
        <FiInfo />
        <div>
          <strong>Action Required</strong>
          <p>These fields are required if Account Type = Credit. Ensure limits align with the master risk assessment policy before proceeding.</p>
        </div>
      </section>
      <section className="form-card financial-card">
        <div className="form-card-title">
          <h2>Step 2: Financial Terms</h2>
          <p>Provide expected volume and routing information to calculate initial viability.</p>
        </div>
        <div className="financial-fields">
          <FormField label="Account Type" name="accountType">
            <select name="accountType" value={form.accountType} onChange={onChange}>
              <option value="">Select Payment Term</option>
              <option>Cash</option>
              <option>Credit</option>
              <option>Prepaid</option>
            </select>
          </FormField>
          <div className="field-grid">
            <FormField label="Credit Limit" name="creditLimit" required>
              <div className="unit-input"><input name="creditLimit" type="number" min="0" placeholder="0.00" value={form.creditLimit} onChange={onChange} required /><span>TK</span></div>
            </FormField>
            <FormField label="Credit Period" name="creditPeriod" required>
              <div className="unit-input"><input name="creditPeriod" type="number" min="0" placeholder="0" value={form.creditPeriod} onChange={onChange} required /><span>Days</span></div>
            </FormField>
          </div>
          <div className="field-help-grid">
            <p>Maximum allowable outstanding balance.</p>
            <p>Standard settlement window.</p>
          </div>
        </div>
      </section>
      <section className="step-action-bar">
        <button className="outline-action" type="button" onClick={onPrevious}><FiArrowLeft /> Previous Step</button>
        <div>
          <button className="draft-action" type="button" onClick={onSave}>Save Draft</button>
          <button className="next-action" type="submit" onClick={onNext}>Next Step <FiArrowRight /></button>
        </div>
      </section>
    </>
  );
}
