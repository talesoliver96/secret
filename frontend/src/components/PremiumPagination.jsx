export default function PremiumPagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = pagination;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  function getPages() {
    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        Math.abs(i - page) <= 1
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }

    return pages;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4 border-t border-slate-100 bg-white">
      <p className="text-sm text-slate-500">
        Mostrando <span className="font-medium text-slate-900">{start}</span>–
        <span className="font-medium text-slate-900">{end}</span> de{" "}
        <span className="font-medium text-slate-900">{total}</span> registros
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
        >
          ‹
        </button>

        {getPages().map((item, index) =>
          item === "..." ? (
            <span key={index} className="px-2 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={index}
              onClick={() => onPageChange(item)}
              className={`w-9 h-9 rounded-xl text-sm font-medium ${
                page === item
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
        >
          ›
        </button>
      </div>
    </div>
  );
}