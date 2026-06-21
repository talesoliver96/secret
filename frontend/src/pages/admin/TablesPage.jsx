import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../api/axios";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dateTime(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedTable, setSelectedTable] = useState(null);
  const [paymentTable, setPaymentTable] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [loading, setLoading] = useState(false);

  async function loadTables() {
    const { data } = await api.get("/admin/tables/open");

    const formatted = (data || []).map((table) => ({
      id: table.table_number,
      number: table.table_number,
      name: `Mesa ${table.table_number}`,
      orders_count: table.orders?.length || 0,
      total: table.total || 0,
      payment_status: table.payment_status || "pendente",
      customers: table.customers || [],
      orders: table.orders || [],
    }));

    setTables(formatted);
  }

  useEffect(() => {
    loadTables();

    const interval = setInterval(loadTables, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const term = search.toLowerCase();

      const matchSearch =
        !term ||
        String(table.number).includes(term) ||
        table.name?.toLowerCase().includes(term) ||
        table.customers?.some((customer) =>
          customer?.toLowerCase().includes(term)
        );

      const matchStatus =
        statusFilter === "todos" ||
        table.payment_status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [tables, search, statusFilter]);

  async function closeTable(table) {
    const confirmClose = window.confirm(
      `Fechar a conta da Mesa ${table.number}?`
    );

    if (!confirmClose) return;

    setLoading(true);

    try {
      await api.patch(`/admin/tables/${table.number}/close`);
      await loadTables();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao fechar mesa.");
    } finally {
      setLoading(false);
    }
  }

  async function payTable() {
    if (!paymentTable) return;

    setLoading(true);

    try {
      await api.patch(`/admin/tables/${paymentTable.number}/pay`, {
        payment_method: paymentMethod,
      });

      setPaymentTable(null);
      setPaymentMethod("pix");
      await loadTables();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao marcar mesa como paga.");
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => {
    const totalOpen = tables.reduce(
      (sum, table) => sum + Number(table.total || 0),
      0
    );

    const closedTables = tables.filter(
      (table) => table.payment_status === "fechado"
    ).length;

    return {
      openTables: tables.length,
      closedTables,
      totalOpen,
    };
  }, [tables]);

  return (
    <AdminLayout
      title="Mesas"
      subtitle="Fechamento de contas, conferência de pedidos entregues e controle de pagamento."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Metric title="Mesas abertas" value={totals.openTables} />
        <Metric title="Contas fechadas" value={totals.closedTables} />
        <Metric title="Total em aberto" value={money(totals.totalOpen)} />
      </div>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Fechamento de mesas</h3>
            <p className="text-sm text-slate-500">
              {filteredTables.length} mesa(s) com pedidos entregues aguardando pagamento.
            </p>
          </div>
        </div>

        <div className="p-5 border-b border-slate-100 bg-slate-50/60 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por mesa ou cliente..."
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            <option value="todos">Todos os pagamentos</option>
            <option value="pendente">Pendente</option>
            <option value="fechado">Conta fechada</option>
          </select>
        </div>

        {filteredTables.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-5xl">✅</p>
            <h3 className="text-xl font-semibold mt-4">
              Nenhuma mesa aguardando pagamento
            </h3>
            <p className="text-slate-500 mt-2">
              Quando um pedido for marcado como entregue, ele aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Mesa
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Clientes
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Pedidos
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTables.map((table) => (
                  <tr
                    key={table.number}
                    className="hover:bg-slate-50/70 transition"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-medium">
                          {String(table.number).padStart(2, "0")}
                        </div>

                        <div>
                          <p className="font-medium text-slate-900">
                            Mesa {table.number}
                          </p>
                          <p className="text-sm text-slate-500">
                            Conta da mesa
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {table.customers?.length
                        ? table.customers.join(", ")
                        : "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
                        {table.orders_count} pedido(s)
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      {money(table.total)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                          table.payment_status === "fechado"
                            ? "bg-orange-50 text-orange-700 border-orange-100"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {table.payment_status === "fechado"
                          ? "Conta fechada"
                          : "Pendente"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedTable(table)}
                          className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100"
                          title="Ver detalhes"
                        >
                          👁️
                        </button>

                        <button
                          onClick={() => closeTable(table)}
                          disabled={
                            loading || table.payment_status === "fechado"
                          }
                          className="w-9 h-9 rounded-xl border border-orange-100 text-orange-600 hover:bg-orange-50 disabled:opacity-40"
                          title="Fechar conta"
                        >
                          🧾
                        </button>

                        <button
                          onClick={() => setPaymentTable(table)}
                          disabled={loading}
                          className="w-9 h-9 rounded-xl border border-green-100 text-green-700 hover:bg-green-50 disabled:opacity-40"
                          title="Marcar pago"
                        >
                          💳
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedTable && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <aside className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col">
            <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Detalhes da mesa</p>
                <h3 className="text-xl font-semibold">
                  Mesa {selectedTable.number}
                </h3>
              </div>

              <button
                onClick={() => setSelectedTable(null)}
                className="w-10 h-10 rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Info title="Pedidos" value={selectedTable.orders_count} />
                <Info title="Total" value={money(selectedTable.total)} />
              </div>

              <div className="space-y-4">
                {selectedTable.orders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-slate-200 rounded-3xl p-5"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          {order.customers?.name || "Cliente"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {order.customers?.phone || "-"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {dateTime(order.created_at)}
                        </p>
                      </div>

                      <p className="font-semibold">{money(order.total)}</p>
                    </div>

                    <div className="mt-4 space-y-2">
                      {order.order_items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between gap-3 text-sm"
                        >
                          <span>
                            {item.quantity}x {item.product_name}
                          </span>

                          <span className="font-medium">
                            {money(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="mt-4 bg-amber-50 border border-amber-100 text-amber-900 rounded-2xl p-3 text-sm">
                        <strong>Obs:</strong> {order.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => closeTable(selectedTable)}
                disabled={
                  loading || selectedTable.payment_status === "fechado"
                }
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-medium disabled:opacity-40"
              >
                Fechar conta
              </button>

              <button
                onClick={() => setPaymentTable(selectedTable)}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-medium"
              >
                Marcar pago
              </button>
            </div>
          </aside>
        </div>
      )}

      {paymentTable && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Pagamento</p>
                <h3 className="text-2xl font-semibold">
                  Mesa {paymentTable.number}
                </h3>
              </div>

              <button
                onClick={() => setPaymentTable(null)}
                className="w-10 h-10 rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-3xl p-5">
              <p className="text-sm text-slate-500">Total da mesa</p>
              <p className="text-4xl font-semibold mt-1">
                {money(paymentTable.total)}
              </p>
            </div>

            <label className="block mt-5">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Método de pagamento
              </p>

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="debito">Cartão de débito</option>
                <option value="credito">Cartão de crédito</option>
                <option value="outro">Outro</option>
              </select>
            </label>

            <button
              onClick={payTable}
              disabled={loading}
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-medium disabled:opacity-50"
            >
              {loading ? "Confirmando..." : "Confirmar pagamento"}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Metric({ title, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}