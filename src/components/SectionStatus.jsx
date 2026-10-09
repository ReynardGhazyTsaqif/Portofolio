// Tampilan loading / error / kosong untuk section yang datanya dari Sanity.
const SectionStatus = ({ status, label, onRetry, rows = 3 }) => {
  if (status === "loading") {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={`Loading ${label}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-16 lg:h-20 rounded-2xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="py-12 text-center font-poppins">
        <p className="text-sm text-gray-500">Couldn't load {label}.</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 text-[11px] font-semibold uppercase tracking-[0.1em] px-4 py-2 rounded-full border border-black/10 hover:bg-black hover:text-white transition-colors duration-200"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <p className="py-12 text-center text-sm text-gray-400 font-poppins">
      No {label} yet.
    </p>
  );
};

export default SectionStatus;
