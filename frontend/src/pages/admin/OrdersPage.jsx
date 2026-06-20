import { useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../api/axios";
import Pagination from "../../components/Pagination";

const statusConfig = {
  recebido: "bg-red-100 text-red-800 border-red-200",
  preparando: "bg-blue-100 text-blue-800 border-blue-200",
  pronto: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const statuses = ["recebido", "preparando", "pronto", "entregue", "cancelado"];

function money(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateTime(d) {
  return new Date(d).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
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
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
const [pagination, setPagination] = useState(null);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("todos");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const titleRef = useRef(document.title || "The Secret Burger Admin");

async function loadOrders({ sound = false, nextPage = page } = {}) {
  const params = new URLSearchParams({
    page: String(nextPage),
    limit: "12",
    status: activeStatus,
  });

  if (search.trim()) {
    params.append("search", search.trim());
  }

  const { data } = await api.get(`/admin/orders?${params.toString()}`);

  const ordersData = data.data || [];
  const received = ordersData.filter((o) => o.status === "recebido");

  if (sound && soundEnabled && received.length > 0) beep();

  setOrders(ordersData);
  setPagination(data.pagination);
}

function handlePageChange(newPage) {
  setPage(newPage);
}

  async function updateStatus(id, status) {
    await api.patch(`/admin/orders/${id}/status`, { status });
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

  const receivedCount = orders.filter((o) => o.status === "recebido").length;

  useEffect(() => {
    document.title =
      receivedCount > 0
        ? `(${receivedCount}) The Secret Burger Admin`
        : titleRef.current;
  }, [receivedCount]);

  const filtered = orders;

  return (
    <AdminLayout
      title="Pedidos ativos"
      subtitle="Aqui ficam apenas os pedidos em preparo. Ao marcar como entregue, o pedido sai daqui e vai para Mesas."
      alertCount={receivedCount}
      onEnableAlerts={enableAlerts}
    >
      {receivedCount > 0 && (
        <div className="mb-6 bg-red-600 text-white rounded-[24px] p-5 shadow-xl shadow-red-100">
          <p className="text-2xl font-black">🔔 {receivedCount} pedido(s) aguardando preparo</p>
          <p className="text-red-100 text-sm mt-1">
            O som continua a cada 5 segundos até mudar para Preparando.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Metric title="Ativos" value={orders.length} />
        <Metric title="Recebidos" value={receivedCount} />
        <Metric title="Prontos" value={orders.filter((o) => o.status === "pronto").length} />
      </div>

      <section className="bg-white border border-slate-200 rounded-[28px] overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
          <div>
            <h3 className="text-2xl font-black">Fila da cozinha</h3>
            <p className="text-slate-500 text-sm">{filtered.length} pedidos encontrados</p>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por mesa, cliente, telefone ou produto..."
            className="w-full xl:w-96 bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 outline-none"
          />
        </div>

        <div className="p-5 flex gap-3 overflow-x-auto border-b border-slate-100">
          {["todos", "recebido", "preparando", "pronto"].map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`px-5 py-3 rounded-2xl font-bold whitespace-nowrap border ${
                activeStatus === status
                  ? "bg-slate-950 text-white border-slate-950"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {status === "todos" ? "Todos" : status}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5 p-5">
          {filtered.map((order) => (
            <article
              key={order.id}
              className={`rounded-[24px] border p-5 bg-white ${
                order.status === "recebido"
                  ? "border-red-300 shadow-lg shadow-red-100"
                  : "border-slate-200"
              }`}
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-2xl font-black">Mesa {order.table_number}</p>
                  <p className="text-sm text-slate-500">{dateTime(order.created_at)}</p>
                </div>

                <span className={`h-fit px-3 py-1 rounded-full border text-xs font-black ${statusConfig[order.status]}`}>
                  {order.status}
                </span>
              </div>

              <div className="mt-4 bg-slate-50 rounded-2xl p-4">
                <p className="font-black">{order.customers?.name}</p>
                <p className="text-sm text-slate-500">{order.customers?.phone}</p>
              </div>

              <div className="mt-4 space-y-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 text-sm">
                    <div>
                      <p className="font-black">{item.quantity}x {item.product_name}</p>
                      <p className="text-slate-500">Unidade: {money(item.unit_price)}</p>
                    </div>
                    <p className="font-black">{money(item.subtotal)}</p>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="mt-4 bg-amber-50 border border-amber-100 text-amber-900 rounded-2xl p-4 text-sm">
                  <strong>Obs:</strong> {order.notes}
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-slate-100 flex justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="text-2xl font-black">{money(order.total)}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(order.id, status)}
                    className={`px-3 py-3 rounded-xl text-xs font-black border ${
                      order.status === status
                        ? "bg-blue-600 text-white border-blue-600"
                        : status === "cancelado"
                        ? "bg-red-50 text-red-700 border-red-100"
                        : status === "entregue"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
        <Pagination pagination={pagination} onPageChange={handlePageChange} />
      </section>
    </AdminLayout>
  );
}

function Metric({ title, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[24px] p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-3xl font-black mt-1">{value}</p>
    </div>
  );
}