import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

export default function RecommendationDetailsStep({ form, onChange, onSave, onPrevious, onSubmit }) {
  return (
    <section className="form-card details-card">
      <div className="details-content">
        <h2>Step 5: Recommendation Details</h2>
        <label className="recommendation-field">
          <span>Recommendation Note <i>*</i></span>
          <textarea
            className="recommendation-note"
            name="recommendationNote"
            placeholder="Enter detailed justification for approval, highlighting key strengths from the risk assessment and any specific conditions for the credit limit..."
            value={form.recommendationNote}
            onChange={onChange}
            required
          />
        </label>
        <p className="note-help">Provide a summary for the Sales Coordinator.</p>
      </div>
      <div className="form-actions details-actions">
        <button className="outline-action" type="button" onClick={onPrevious}><FiArrowLeft /> Previous Step</button>
        <div>
          <button className="draft-action" type="button" onClick={onSave}>Save Draft</button>
          <button className="submit-action" type="submit" onClick={onSubmit}>Submit to Sales Coordinator <FiArrowRight /></button>
        </div>
      </div>
    </section>
  );
}
