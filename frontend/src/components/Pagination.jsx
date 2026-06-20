export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-t border-slate-100">
      <p className="text-sm text-slate-500">
        Página <strong>{page}</strong> de <strong>{totalPages}</strong> •{" "}
        {total} registro(s)
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-4 py-2 rounded-xl border border-slate-200 font-bold disabled:opacity-40"
        >
          Anterior
        </button>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-4 py-2 rounded-xl bg-slate-950 text-white font-bold disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}