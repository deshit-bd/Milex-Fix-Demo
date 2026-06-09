import { FiArrowLeft, FiArrowRight, FiBriefcase, FiLock, FiPlus, FiTrash2, FiTruck } from "react-icons/fi";
import FormField from "./FormField";

const COUNTRY_OPTIONS = [
  "Bangladesh",
  "China",
  "Dubai",
  "India",
  "Singapore",
  "Turkey",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
];

export default function ShippingDetailsStep({ form, onChange, onSave, onNext, onPrevious }) {
  function addRoute() {
    onChange({
      target: {
        name: "additionalRoutes",
        value: [...(form.additionalRoutes || []), { country: "", rateFor: "" }],
      },
    });
  }

  function updateRoute(index, field, value) {
    const routes = (form.additionalRoutes || []).map((route, routeIndex) =>
      routeIndex === index ? { ...route, [field]: value } : route
    );
    onChange({ target: { name: "additionalRoutes", value: routes } });
  }

  function removeRoute(index) {
    const routes = (form.additionalRoutes || []).filter((_, routeIndex) => routeIndex !== index);
    onChange({ target: { name: "additionalRoutes", value: routes } });
  }

  return (
    <section className="form-card shipping-card">
      <div className="form-card-title shipping-title">
        <h2>Step 4: Shipping Details</h2>
        <p>Provide expected volume and routing information to calculate initial viability.</p>
      </div>
      <div className="shipping-fields">
        <div className="field-grid shipping-grid">
          <div className="recommendation-field">
            <span>Shipment Type</span>
            <div className="shipment-options">
              <label><input type="checkbox" name="shipmentDocument" checked={form.shipmentDocument} onChange={onChange} /> Document</label>
              <label><input type="checkbox" name="shipmentNonDocument" checked={form.shipmentNonDocument} onChange={onChange} /> Non-Document</label>
              <label><input type="checkbox" name="shipmentOthers" checked={form.shipmentOthers} onChange={onChange} /> Others</label>
            </div>
            {form.shipmentOthers && (
              <input
                className="shipment-other-input"
                name="shipmentOtherText"
                placeholder="Please type shipment type here"
                value={form.shipmentOtherText}
                onChange={onChange}
              />
            )}
          </div>
          <FormField label="Rate For" name="rateFor">
            <select name="rateFor" value={form.rateFor} onChange={onChange}>
              <option value="">Select Import or Export</option>
              <option>Import</option>
              <option>Export</option>
              <option>Import &amp; Export</option>
            </select>
          </FormField>
          <FormField label="Primary Destination Country" name="destinationCountry">
            <select name="destinationCountry" value={form.destinationCountry} onChange={onChange}>
              <option value="">Select country</option>
              {COUNTRY_OPTIONS.map((country) => <option key={country}>{country}</option>)}
            </select>
          </FormField>
          <FormField label="Avg Monthly Volume (CBM/TEU)" name="monthlyVolume">
            <div className="icon-input"><input name="monthlyVolume" type="number" min="0" placeholder="e.g. 150" value={form.monthlyVolume} onChange={onChange} /><FiBriefcase /></div>
          </FormField>
          <FormField label="Avg Monthly Weight (KG)" name="monthlyWeight">
            <div className="icon-input"><input name="monthlyWeight" type="number" min="0" placeholder="e.g. 5000" value={form.monthlyWeight} onChange={onChange} /><FiLock /></div>
          </FormField>
          <FormField label="Expected Monthly Revenue (USD)" name="monthlyRevenue" placeholder="$ 10000" value={form.monthlyRevenue} onChange={onChange} />
          <FormField label="Current Service Provider" name="serviceProvider">
            <div className="icon-input"><input name="serviceProvider" placeholder="e.g. Maersk, DHL" value={form.serviceProvider} onChange={onChange} /><FiTruck /></div>
          </FormField>
        </div>
        {(form.additionalRoutes || []).map((route, index) => (
          <div className="additional-route" key={`route-${index}`}>
            <strong>Route {index + 1}</strong>
            <input list="milex-country-options" placeholder="Country" value={route.country || route.destination || ""} onChange={(event) => updateRoute(index, "country", event.target.value)} />
            <select value={route.rateFor || ""} onChange={(event) => updateRoute(index, "rateFor", event.target.value)}>
              <option value="">Select rate for</option>
              <option>Import</option>
              <option>Export</option>
              <option>Import &amp; Export</option>
            </select>
            <button type="button" aria-label={`Remove route ${index + 1}`} onClick={() => removeRoute(index)}><FiTrash2 /></button>
          </div>
        ))}
        <datalist id="milex-country-options">
          {COUNTRY_OPTIONS.map((country) => <option key={country} value={country} />)}
        </datalist>
        <button className="add-route" type="button" onClick={addRoute}><FiPlus /> Add Country Rate</button>
      </div>
      <div className="form-actions shipping-actions">
        <button className="outline-action" type="button" onClick={onPrevious}><FiArrowLeft /> Previous Step</button>
        <div>
          <button className="draft-action" type="button" onClick={onSave}>Save Draft</button>
          <button className="next-action" type="submit" onClick={onNext}>Next Step <FiArrowRight /></button>
        </div>
      </div>
    </section>
  );
}
