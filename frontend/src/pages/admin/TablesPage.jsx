import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../api/axios";

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

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [paymentTable, setPaymentTable] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [loading, setLoading] = useState(false);

  async function loadTables() {
    const { data } = await api.get("/admin/tables/open");
    setTables(data || []);
  }

  async function closeTable(tableNumber) {
    setLoading(true);
    await api.patch(`/admin/tables/${tableNumber}/close`);
    await loadTables();
    setLoading(false);
  }

  async function payTable() {
    if (!paymentTable) return;

    setLoading(true);

    await api.patch(`/admin/tables/${paymentTable.table_number}/pay`, {
      payment_method: paymentMethod,
    });

    setPaymentTable(null);
    setPaymentMethod("dinheiro");
    await loadTables();

    setLoading(false);
  }

  useEffect(() => {
    loadTables();
    const interval = setInterval(loadTables, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalToCharge = tables.reduce((sum, table) => sum + Number(table.total || 0), 0);
  const closedTables = tables.filter((table) => table.payment_status === "fechado");

  return (
    <AdminLayout
      title="Mesas"
      subtitle="Aqui ficam os pedidos já entregues, agrupados por mesa, prontos para fechar conta e marcar pagamento."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Metric title="Mesas abertas" value={tables.length} />
        <Metric title="Aguardando cobrança" value={closedTables.length} />
        <Metric title="Total em aberto" value={money(totalToCharge)} />
      </div>

      <section className="bg-white border border-slate-200 rounded-[28px] overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-2xl font-black">Fechamento de mesas</h3>
          <p className="text-slate-500 text-sm">
            {tables.length} mesa(s) com pedidos entregues e ainda não pagos.
          </p>
        </div>

        {tables.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-5xl">✅</p>
            <h3 className="text-2xl font-black mt-4">Nenhuma mesa aberta</h3>
            <p className="text-slate-500 mt-2">
              Quando um pedido for marcado como entregue, ele aparecerá aqui para cobrança.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5 p-5">
            {tables.map((table) => (
              <article
                key={table.table_number}
                className={`rounded-[28px] border p-5 bg-white ${
                  table.payment_status === "fechado"
                    ? "border-orange-300 shadow-lg shadow-orange-100"
                    : "border-slate-200 hover:shadow-xl"
                }`}
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-3xl font-black">Mesa {table.table_number}</p>
                    <p className="text-slate-500 text-sm mt-1">
                      {table.orders.length} pedido(s) entregue(s)
                    </p>
                  </div>

                  <span
                    className={`h-fit px-3 py-1 rounded-full text-xs font-black border ${
                      table.payment_status === "fechado"
                        ? "bg-orange-100 text-orange-800 border-orange-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {table.payment_status === "fechado" ? "Conta fechada" : "Pendente"}
                  </span>
                </div>

                <div className="mt-5 bg-slate-50 rounded-2xl p-4">
                  <p className="text-sm text-slate-500">Cliente(s)</p>
                  <p className="font-black">
                    {table.customers?.length ? table.customers.join(", ") : "-"}
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  {table.orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="bg-white border border-slate-100 rounded-2xl p-4">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-black">{order.customers?.name}</p>
                          <p className="text-xs text-slate-500">{dateTime(order.created_at)}</p>
                        </div>

                        <p className="font-black">{money(order.total)}</p>
                      </div>

                      <div className="mt-3 text-sm text-slate-700">
                        {order.order_items?.map((item) => (
                          <p key={item.id}>
                            {item.quantity}x {item.product_name}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}

                  {table.orders.length > 3 && (
                    <p className="text-sm text-slate-500">
                      + {table.orders.length - 3} pedido(s) oculto(s)
                    </p>
                  )}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total da mesa</p>
                    <p className="text-3xl font-black">{money(table.total)}</p>
                  </div>

                  <button
                    onClick={() => setSelectedTable(table)}
                    className="bg-slate-950 text-white px-4 py-3 rounded-2xl font-black"
                  >
                    Ver tudo
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => closeTable(table.table_number)}
                    disabled={loading || table.payment_status === "fechado"}
                    className="bg-orange-500 text-white px-4 py-3 rounded-2xl font-black disabled:opacity-40"
                  >
                    Fechar conta
                  </button>

                  <button
                    onClick={() => setPaymentTable(table)}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-3 rounded-2xl font-black disabled:opacity-40"
                  >
                    Marcar pago
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedTable && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-3xl rounded-[32px] p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-blue-600 font-bold uppercase tracking-[0.2em] text-xs">
                  Detalhes da mesa
                </p>
                <h3 className="text-3xl font-black mt-2">
                  Mesa {selectedTable.table_number}
                </h3>
              </div>

              <button
                onClick={() => setSelectedTable(null)}
                className="w-10 h-10 rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {selectedTable.orders.map((order) => (
                <div key={order.id} className="bg-slate-50 rounded-3xl p-5">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-black text-lg">{order.customers?.name}</p>
                      <p className="text-sm text-slate-500">{order.customers?.phone}</p>
                      <p className="text-xs text-slate-500 mt-1">{dateTime(order.created_at)}</p>
                    </div>

                    <p className="font-black text-xl">{money(order.total)}</p>
                  </div>

                  <div className="mt-4 space-y-2">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between gap-3 text-sm">
                        <p className="font-bold">
                          {item.quantity}x {item.product_name}
                        </p>
                        <p className="font-black">{money(item.subtotal)}</p>
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

            <div className="mt-6 border-t pt-5 flex justify-between items-center">
              <p className="text-slate-500">Total da mesa</p>
              <p className="text-4xl font-black">{money(selectedTable.total)}</p>
            </div>
          </div>
        </div>
      )}

      {paymentTable && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-[32px] p-6 shadow-2xl">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-green-600 font-bold uppercase tracking-[0.2em] text-xs">
                  Pagamento da mesa
                </p>
                <h3 className="text-3xl font-black mt-2">
                  Mesa {paymentTable.table_number}
                </h3>
              </div>

              <button
                onClick={() => setPaymentTable(null)}
                className="w-10 h-10 rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <div className="mt-6 bg-slate-50 rounded-2xl p-5">
              <p className="text-slate-500">Total a cobrar</p>
              <p className="text-4xl font-black">{money(paymentTable.total)}</p>

              <p className="text-slate-500 mt-4">Pedidos</p>
              <p className="font-black">{paymentTable.orders.length} pedido(s)</p>
            </div>

            <div className="mt-5">
              <p className="font-bold mb-2">Método de pagamento</p>

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-4 outline-none"
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">Pix</option>
                <option value="debito">Cartão de débito</option>
                <option value="credito">Cartão de crédito</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <button
              onClick={payTable}
              disabled={loading}
              className="mt-6 w-full bg-green-600 text-white py-4 rounded-2xl font-black disabled:opacity-50"
            >
              Confirmar pagamento
            </button>
          </div>
        </div>
      )}
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