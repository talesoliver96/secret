import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../api/axios";
import Pagination from "../../components/Pagination";

function money(v) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dateTime(d) {
  return new Date(d).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function HistoryPage() {
const [page, setPage] = useState(1);
const [pagination, setPagination] = useState(null);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  

async function loadHistory(nextPage = page) {
  const { data } = await api.get(`/admin/orders/history?page=${nextPage}&limit=12`);

  setOrders(data.data || []);
  setPagination(data.pagination);
}

function handlePageChange(newPage) {
  setPage(newPage);
}

  async function cancelOrder(order) {
    const reason = window.prompt(
      `Motivo do cancelamento do pedido da Mesa ${order.table_number}:`
    );

    if (!reason) return;

    await api.patch(`/admin/orders/${order.id}/cancel`, {
      cancel_reason: reason,
    });

    await loadHistory();
  }

  useEffect(() => {
  loadHistory(page);
}, [page]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();

    return orders.filter((order) => {
      return (
        !term ||
        String(order.table_number).includes(term) ||
        order.status?.toLowerCase().includes(term) ||
        order.payment_status?.toLowerCase().includes(term) ||
        order.customers?.name?.toLowerCase().includes(term) ||
        order.customers?.phone?.toLowerCase().includes(term) ||
        order.order_items?.some((item) =>
          item.product_name?.toLowerCase().includes(term)
        )
      );
    });
  }, [orders, search]);

  const paidOrders = orders.filter((order) => order.payment_status === "pago");
  const canceledOrders = orders.filter((order) => order.status === "cancelado");

  const revenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  return (
    <AdminLayout
      title="Histórico"
      subtitle="Pedidos entregues, pagos ou cancelados. Aqui você pode auditar e cancelar pedidos entregues por erro."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Metric title="Pedidos no histórico" value={orders.length} />
        <Metric title="Faturamento pago" value={money(revenue)} />
        <Metric title="Cancelados" value={canceledOrders.length} />
      </div>

      <section className="bg-white border border-slate-200 rounded-[28px] overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
          <div>
            <h3 className="text-2xl font-black">Histórico de pedidos</h3>
            <p className="text-slate-500 text-sm">
              {filtered.length} pedido(s) encontrado(s)
            </p>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por mesa, cliente, telefone, produto ou status..."
            className="w-full xl:w-96 bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5 p-5">
          {filtered.map((order) => (
            <article
              key={order.id}
              className={`rounded-[24px] border p-5 bg-white ${
                order.status === "cancelado"
                  ? "border-red-200 bg-red-50/40"
                  : order.payment_status === "pago"
                  ? "border-green-200"
                  : "border-slate-200"
              }`}
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-2xl font-black">Mesa {order.table_number}</p>
                  <p className="text-sm text-slate-500">
                    {dateTime(order.created_at)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge>{order.status}</Badge>
                  <Badge>{order.payment_status || "pendente"}</Badge>
                </div>
              </div>

              <div className="mt-4 bg-slate-50 rounded-2xl p-4">
                <p className="font-black">{order.customers?.name}</p>
                <p className="text-sm text-slate-500">{order.customers?.phone}</p>
              </div>

              <div className="mt-4 space-y-3">
                {order.order_items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-black">
                        {item.quantity}x {item.product_name}
                      </p>
                      <p className="text-slate-500">
                        Unidade: {money(item.unit_price)}
                      </p>
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

              {order.cancel_reason && (
                <div className="mt-4 bg-red-100 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">
                  <strong>Cancelamento:</strong> {order.cancel_reason}
                </div>
              )}

              <div className="mt-5 border-t border-slate-100 pt-5 flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="text-2xl font-black">{money(order.total)}</p>
                </div>

                {order.status !== "cancelado" && order.payment_status !== "pago" && (
                  <button
                    onClick={() => cancelOrder(order)}
                    className="bg-red-600 text-white px-4 py-3 rounded-2xl font-black"
                  >
                    Cancelar
                  </button>
                )}
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

function Badge({ children }) {
  return (
    <span className="px-3 py-1 rounded-full border border-slate-200 bg-slate-100 text-slate-700 text-xs font-black">
      {children}
    </span>
  );
}