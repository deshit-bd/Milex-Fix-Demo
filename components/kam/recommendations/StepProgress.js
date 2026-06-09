import { FiCheck } from "react-icons/fi";
import { STEPS } from "./recommendationData";

export default function StepProgress({ currentStep }) {
  return (
    <div className="step-progress">
      {STEPS.map((label, index) => (
        <div className={`step-item ${index + 1 === currentStep ? "active" : ""} ${index + 1 < currentStep ? "complete" : ""}`} key={label}>
          <div className="step-number">{index + 1 < currentStep ? <FiCheck /> : index + 1}</div>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
