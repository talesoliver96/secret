import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../api/axios";
import PremiumPagination from "../../components/PremiumPagination";
import { formatDateTime } from "../../utils/date";

const defaultFilters = {
  search: "",
  status: "todos",
  payment_status: "todos",
  table_number: "",
  date_from: "",
  date_to: "",
  min_total: "",
  max_total: "",
};

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export default function HistoryPage() {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const itemsPerPage = 12;

  async function loadHistory(nextPage = page) {
    const params = new URLSearchParams({
      page: String(nextPage),
      limit: String(itemsPerPage),
    });

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "todos") {
        params.append(key, value);
      }
    });

    const { data } = await api.get(`/admin/orders/history?${params.toString()}`);

    setOrders(data.data || []);
    setPagination(data.pagination);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadHistory(page);
    }, 300);

    return () => clearTimeout(timeout);
  }, [page, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  async function cancelOrder(order) {
    const reason = window.prompt(
      `Motivo do cancelamento do pedido da Mesa ${order.table_number}:`
    );

    if (!reason) return;

    await api.patch(`/admin/orders/${order.id}/cancel`, {
      cancel_reason: reason,
    });

    await loadHistory(page);
  }

  function updateFilter(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function setPeriod(type) {
    if (type === "today") {
      setFilters((prev) => ({
        ...prev,
        date_from: today(),
        date_to: today(),
      }));
    }

    if (type === "7days") {
      setFilters((prev) => ({
        ...prev,
        date_from: daysAgo(7),
        date_to: today(),
      }));
    }

    if (type === "30days") {
      setFilters((prev) => ({
        ...prev,
        date_from: daysAgo(30),
        date_to: today(),
      }));
    }

    if (type === "clear") {
      setFilters(defaultFilters);
    }
  }

  const totals = useMemo(() => {
    const paidOrders = orders.filter((order) => order.payment_status === "pago");
    const canceledOrders = orders.filter((order) => order.status === "cancelado");

    const revenue = paidOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    return {
      total: pagination?.total || orders.length,
      paid: paidOrders.length,
      canceled: canceledOrders.length,
      revenue,
    };
  }, [orders, pagination]);

  return (
    <AdminLayout
      title="Histórico"
      subtitle="Audite pedidos por período, mesa, cliente, produto, status e pagamento."
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Metric title="Registros" value={totals.total} />
        <Metric title="Pagos nesta página" value={totals.paid} tone="green" />
        <Metric title="Cancelados" value={totals.canceled} tone="red" />
        <Metric title="Faturamento página" value={money(totals.revenue)} />
      </div>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Filtros avançados</h3>
              <p className="text-sm text-slate-500">
                Refine a busca por pedido, cliente, mesa, período ou pagamento.
              </p>
            </div>

            <button
              onClick={() => setPeriod("clear")}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-medium"
            >
              Limpar filtros
            </button>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setPeriod("today")}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium hover:bg-slate-50"
            >
              Hoje
            </button>

            <button
              onClick={() => setPeriod("7days")}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium hover:bg-slate-50"
            >
              Últimos 7 dias
            </button>

            <button
              onClick={() => setPeriod("30days")}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium hover:bg-slate-50"
            >
              Últimos 30 dias
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <input
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Cliente, telefone ou produto..."
              className="admin-input"
            />

            <input
              value={filters.table_number}
              onChange={(e) => updateFilter("table_number", e.target.value)}
              placeholder="Mesa"
              type="number"
              className="admin-input"
            />

            <select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
              className="admin-input"
            >
              <option value="todos">Todos status</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <select
              value={filters.payment_status}
              onChange={(e) => updateFilter("payment_status", e.target.value)}
              className="admin-input"
            >
              <option value="todos">Todos pagamentos</option>
              <option value="pendente">Pendente</option>
              <option value="fechado">Fechado</option>
              <option value="pago">Pago</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <input
              value={filters.date_from}
              onChange={(e) => updateFilter("date_from", e.target.value)}
              type="date"
              className="admin-input"
            />

            <input
              value={filters.date_to}
              onChange={(e) => updateFilter("date_to", e.target.value)}
              type="date"
              className="admin-input"
            />

            <input
              value={filters.min_total}
              onChange={(e) => updateFilter("min_total", e.target.value)}
              placeholder="Valor mínimo"
              type="number"
              className="admin-input"
            />

            <input
              value={filters.max_total}
              onChange={(e) => updateFilter("max_total", e.target.value)}
              placeholder="Valor máximo"
              type="number"
              className="admin-input"
            />
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-5xl">🕒</p>
            <h3 className="text-xl font-semibold mt-4">
              Nenhum pedido encontrado
            </h3>
            <p className="text-slate-500 mt-2">
              Ajuste os filtros ou limpe a busca.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Produtos
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Pagamento
                  </th>
                  <th className="text-right px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-medium">
                          {String(order.table_number).padStart(2, "0")}
                        </div>

                        <div>
                          <p className="font-medium text-slate-900">
                            Mesa {order.table_number}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDateTime(order.created_at)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {order.customers?.name || "-"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {order.customers?.phone || "-"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {order.order_items?.slice(0, 2).map((item) => (
                          <p key={item.id} className="text-sm text-slate-700">
                            <span className="font-medium">{item.quantity}x</span>{" "}
                            {item.product_name}
                          </p>
                        ))}

                        {order.order_items?.length > 2 && (
                          <p className="text-xs text-slate-500">
                            + {order.order_items.length - 2} item(ns)
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      {money(order.total)}
                    </td>

                    <td className="px-5 py-4">
                      <Badge type={order.status}>{order.status}</Badge>
                    </td>

                    <td className="px-5 py-4">
                      <Badge type={order.payment_status}>
                        {order.payment_status || "pendente"}
                      </Badge>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100"
                          title="Ver detalhes"
                        >
                          👁️
                        </button>

                        {order.status !== "cancelado" &&
                          order.payment_status !== "pago" && (
                            <button
                              onClick={() => cancelOrder(order)}
                              className="w-9 h-9 rounded-xl border border-red-100 text-red-600 hover:bg-red-50"
                              title="Cancelar"
                            >
                              ✕
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <PremiumPagination
              totalItems={pagination?.total || orders.length}
              itemsPerPage={itemsPerPage}
              currentPage={page}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <aside className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col">
            <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Detalhes do histórico</p>
                <h3 className="text-xl font-semibold">
                  Mesa {selectedOrder.table_number}
                </h3>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Info title="Cliente" value={selectedOrder.customers?.name || "-"} />
                <Info title="Telefone" value={selectedOrder.customers?.phone || "-"} />
                <Info title="Criado em" value={formatDateTime(selectedOrder.created_at)} />
                <Info title="Total" value={money(selectedOrder.total)} />
              </div>

              <div className="border border-slate-200 rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h4 className="font-semibold">Itens</h4>
                </div>

                <div className="divide-y divide-slate-100">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="p-5 flex justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          {item.quantity}x {item.product_name}
                        </p>
                        <p className="text-sm text-slate-500">
                          Unidade: {money(item.unit_price)}
                        </p>
                      </div>

                      <p className="font-semibold">{money(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-5 bg-amber-50 border border-amber-100 text-amber-900 rounded-3xl p-5">
                  <p className="text-sm font-medium">Observação</p>
                  <p className="mt-1">{selectedOrder.notes}</p>
                </div>
              )}

              {selectedOrder.cancel_reason && (
                <div className="mt-5 bg-red-50 border border-red-100 text-red-700 rounded-3xl p-5">
                  <p className="text-sm font-medium">Motivo do cancelamento</p>
                  <p className="mt-1">{selectedOrder.cancel_reason}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </AdminLayout>
  );
}

function Metric({ title, value, tone }) {
  const tones = {
    red: "text-red-600",
    green: "text-green-600",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`text-2xl font-semibold mt-1 ${tones[tone] || ""}`}>
        {value}
      </p>
    </div>
  );
}

function Badge({ children, type }) {
  const styles = {
    pago: "bg-green-50 text-green-700 border-green-100",
    entregue: "bg-green-50 text-green-700 border-green-100",
    cancelado: "bg-red-50 text-red-700 border-red-100",
    fechado: "bg-orange-50 text-orange-700 border-orange-100",
    pendente: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
        styles[type] || "bg-slate-50 text-slate-700 border-slate-200"
      }`}
    >
      {children}
    </span>
  );
}

function Info({ title, value }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="font-semibold mt-1 break-words">{value}</p>
    </div>
  );
}