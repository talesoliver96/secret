import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../api/axios";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  async function loadTables() {
  const { data } = await api.get("/admin/tables/open");

  const formatted = (data || []).map((table) => ({
    id: table.table_number,
    number: table.table_number,
    name: `Mesa ${table.table_number}`,
    active_orders: table.orders?.length || 0,
    open_total: table.total || 0,
    payment_status: table.payment_status,
    orders: table.orders || [],
  }));

  setTables(formatted);
}

  useEffect(() => {
    loadTables();
  }, []);

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchSearch =
        !search ||
        String(table.number).includes(search) ||
        table.name?.toLowerCase().includes(search.toLowerCase());

      const occupied =
        Number(table.active_orders || 0) > 0;

      const matchStatus =
        statusFilter === "todos" ||
        (statusFilter === "ocupadas" && occupied) ||
        (statusFilter === "livres" && !occupied);

      return matchSearch && matchStatus;
    });
  }, [tables, search, statusFilter]);

  return (
    <AdminLayout
      title="Mesas"
      subtitle="Controle de mesas, pedidos ativos e fechamento."
    >
      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">
              Controle de mesas
            </h3>

            <p className="text-sm text-slate-500">
              {filteredTables.length} mesa(s)
            </p>
          </div>

          <button className="bg-slate-950 text-white px-5 py-3 rounded-2xl font-medium">
            + Nova mesa
          </button>
        </div>

        <div className="p-5 border-b border-slate-100 bg-slate-50/60 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar mesa..."
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3"
          >
            <option value="todos">
              Todas
            </option>

            <option value="ocupadas">
              Ocupadas
            </option>

            <option value="livres">
              Livres
            </option>
          </select>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const occupied =
              Number(table.active_orders || 0) > 0;

            return (
              <article
                key={table.id}
                className="border border-slate-200 rounded-3xl p-5 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      Mesa
                    </p>

                    <h3 className="text-3xl font-semibold mt-1">
                      {String(table.number).padStart(
                        2,
                        "0"
                      )}
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      occupied
                        ? "bg-red-50 text-red-700 border-red-100"
                        : "bg-green-50 text-green-700 border-green-100"
                    }`}
                  >
                    {occupied
                      ? "Ocupada"
                      : "Livre"}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">
                      Pedidos ativos
                    </span>

                    <span className="font-medium">
                      {table.active_orders || 0}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">
                      Total aberto
                    </span>

                    <span className="font-medium">
                      {money(
                        table.open_total || 0
                      )}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-5">
                  <button className="border border-slate-200 rounded-xl py-2.5 text-sm hover:bg-slate-50">
                    👁 Ver
                  </button>

                  <button className="bg-slate-950 text-white rounded-xl py-2.5 text-sm">
                    💳 Fechar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </AdminLayout>
  );
}