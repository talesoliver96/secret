import { useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../api/axios";
import PremiumPagination from "../../components/PremiumPagination";
import { formatDateTime } from "../../utils/date";

const statuses = ["recebido", "preparando", "pronto", "entregue", "cancelado"];

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dateTime(date) {
  return new Date(date).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function minutesAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff <= 0) return "agora";
  if (diff === 1) return "1 min";
  return `${diff} min`;
}

function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = 920;
    gain.gain.value = 0.1;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch {}
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("todos");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const itemsPerPage = 12;

  const titleRef = useRef(document.title || "The Secret Burger Admin");

  async function loadOrders({ sound = false, nextPage = page } = {}) {
    const params = new URLSearchParams({
      page: String(nextPage),
      limit: String(itemsPerPage),
      status: activeStatus,
    });

    if (search.trim()) {
      params.append("search", search.trim());
    }

    const { data } = await api.get(`/admin/orders?${params.toString()}`);

    const ordersData = data.data || [];
    const received = ordersData.filter((order) => order.status === "recebido");

    if (sound && soundEnabled && received.length > 0) beep();

    setOrders(ordersData);
    setPagination(data.pagination);
  }

  async function updateStatus(order, status) {
    await api.patch(`/admin/orders/${order.id}/status`, { status });

    if (selectedOrder?.id === order.id) {
      setSelectedOrder({ ...selectedOrder, status });
    }

    await loadOrders();
  }

  function enableAlerts() {
    setSoundEnabled(true);
    beep();
  }

  useEffect(() => {
    setPage(1);
  }, [activeStatus, search]);

  useEffect(() => {
    loadOrders({ nextPage: page });

    const interval = setInterval(() => {
      loadOrders({ sound: true, nextPage: page });
    }, 5000);

    return () => clearInterval(interval);
  }, [page, activeStatus, search, soundEnabled]);

  const receivedCount = orders.filter((order) => order.status === "recebido").length;

  useEffect(() => {
    document.title =
      receivedCount > 0
        ? `(${receivedCount}) The Secret Burger Admin`
        : titleRef.current;
  }, [receivedCount]);

  const totals = useMemo(() => {
    return {
      active: pagination?.total || orders.length,
      received: orders.filter((order) => order.status === "recebido").length,
      preparing: orders.filter((order) => order.status === "preparando").length,
      ready: orders.filter((order) => order.status === "pronto").length,
    };
  }, [orders, pagination]);

  return (
    <AdminLayout
      title="Pedidos"
      subtitle="Acompanhe a fila da cozinha, altere status e envie pedidos entregues para fechamento de mesa."
      alertCount={receivedCount}
      onEnableAlerts={enableAlerts}
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Metric title="Pedidos ativos" value={totals.active} />
        <Metric title="Recebidos" value={totals.received} tone="red" />
        <Metric title="Preparando" value={totals.preparing} tone="blue" />
        <Metric title="Prontos" value={totals.ready} tone="green" />
      </div>

      {receivedCount > 0 && (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-700 rounded-3xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="font-semibold">{receivedCount} pedido(s) aguardando preparo</p>
            <p className="text-sm text-red-500">
              O alerta sonoro toca a cada 5 segundos até mudar o status.
            </p>
          </div>

          <button
            onClick={enableAlerts}
            className="bg-red-600 text-white px-5 py-3 rounded-2xl font-medium"
          >
            Ativar som
          </button>
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Fila de pedidos</h3>
            <p className="text-sm text-slate-500">
              {pagination?.total || orders.length} pedido(s) encontrado(s)
            </p>
          </div>
        </div>

        <div className="p-5 border-b border-slate-100 bg-slate-50/60 space-y-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por mesa, cliente, telefone ou produto..."
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />

          <div className="flex gap-2 overflow-x-auto">
            {["todos", "recebido", "preparando", "pronto"].map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap border transition ${
                  activeStatus === status
                    ? "bg-slate-950 text-white border-slate-950"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {status === "todos" ? "Todos" : status}
              </button>
            ))}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-5xl">🧾</p>
            <h3 className="text-xl font-semibold mt-4">Nenhum pedido ativo</h3>
            <p className="text-slate-500 mt-2">
              Novos pedidos aparecerão aqui automaticamente.
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
                  <th className="text-right px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`transition ${
                      order.status === "recebido"
                        ? "bg-red-50/40 hover:bg-red-50"
                        : "hover:bg-slate-50/70"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-medium ${
                            order.status === "recebido"
                              ? "bg-red-600 text-white"
                              : "bg-slate-950 text-white"
                          }`}
                        >
                          {String(order.table_number).padStart(2, "0")}
                        </div>

                        <div>
                          <p className="font-medium text-slate-900">
                            Mesa {order.table_number}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDateTime(order.created_at)} • {minutesAgo(order.created_at)}
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
                      <StatusBadge status={order.status} />
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

                        <button
                          onClick={() => updateStatus(order, "preparando")}
                          disabled={order.status === "preparando"}
                          className="w-9 h-9 rounded-xl border border-blue-100 text-blue-700 hover:bg-blue-50 disabled:opacity-40"
                          title="Preparando"
                        >
                          👨‍🍳
                        </button>

                        <button
                          onClick={() => updateStatus(order, "pronto")}
                          disabled={order.status === "pronto"}
                          className="w-9 h-9 rounded-xl border border-emerald-100 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                          title="Pronto"
                        >
                          ✅
                        </button>

                        <button
                          onClick={() => updateStatus(order, "entregue")}
                          className="w-9 h-9 rounded-xl border border-green-100 text-green-700 hover:bg-green-50"
                          title="Entregue"
                        >
                          🛎️
                        </button>

                        <button
                          onClick={() => updateStatus(order, "cancelado")}
                          className="w-9 h-9 rounded-xl border border-red-100 text-red-600 hover:bg-red-50"
                          title="Cancelar"
                        >
                          ✕
                        </button>
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
                <p className="text-sm text-slate-500">Detalhes do pedido</p>
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
                  <h4 className="font-semibold">Itens do pedido</h4>
                </div>

                <div className="divide-y divide-slate-100">
                  {selectedOrder.order_items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 flex justify-between gap-4"
                    >
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
            </div>

            <div className="p-6 border-t border-slate-100 grid grid-cols-2 md:grid-cols-5 gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(selectedOrder, status)}
                  className={`py-3 rounded-2xl text-sm font-medium border ${
                    selectedOrder.status === status
                      ? "bg-slate-950 text-white border-slate-950"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {status}
                </button>
              ))}
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
    blue: "text-blue-600",
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

function StatusBadge({ status }) {
  const styles = {
    recebido: "bg-red-50 text-red-700 border-red-100",
    preparando: "bg-blue-50 text-blue-700 border-blue-100",
    pronto: "bg-emerald-50 text-emerald-700 border-emerald-100",
    entregue: "bg-green-50 text-green-700 border-green-100",
    cancelado: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
        styles[status] || "bg-slate-50 text-slate-700 border-slate-200"
      }`}
    >
      {status}
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