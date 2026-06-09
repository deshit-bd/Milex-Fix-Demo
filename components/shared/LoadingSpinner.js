export default function LoadingSpinner({ label = "Loading data..." }) {
  return (
    <div className="data-loader" role="status" aria-live="polite">
      <span className="loader-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
