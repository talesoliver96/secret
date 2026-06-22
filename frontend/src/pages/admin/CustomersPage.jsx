import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import PremiumPagination from "../../components/PremiumPagination";
import api from "../../api/axios";
import { formatDateTime } from "../../utils/date";

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);

  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 10;

  async function loadCustomers(nextPage = page) {
    const params = new URLSearchParams({
      page: String(nextPage),
      limit: String(itemsPerPage),
    });

    if (search.trim()) {
      params.append("search", search.trim());
    }

    const { data } = await api.get(`/admin/customers?${params.toString()}`);

    setCustomers(data.data || []);
    setPagination(data.pagination);
  }

  async function openHistory(customer) {
    setSelectedCustomer(customer);
    setHistoryOpen(true);

    const { data } = await api.get(`/admin/customers/${customer.id}/orders`);
    setCustomerOrders(data || []);
  }

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadCustomers(page);
    }, 300);

    return () => clearTimeout(timeout);
  }, [page, search]);

  function openEdit(customer) {
    setEditing(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setEditing(null);
    setForm({ name: "", phone: "" });
    setDrawerOpen(false);
  }

  async function saveCustomer(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim()) {
      alert("Nome e telefone são obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      await api.patch(`/admin/customers/${editing.id}`, form);
      closeDrawer();
      await loadCustomers(page);
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao salvar cliente.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteCustomer(customer) {
    if (!confirm(`Excluir cliente "${customer.name}"?`)) return;

    try {
      await api.delete(`/admin/customers/${customer.id}`);
      await loadCustomers(page);
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao excluir cliente.");
    }
  }

  const pageTotals = useMemo(() => {
    const totalSpent = customers.reduce(
      (sum, customer) => sum + Number(customer.total_spent || 0),
      0
    );

    const totalOrders = customers.reduce(
      (sum, customer) => sum + Number(customer.orders_count || 0),
      0
    );

    const paidOrders = customers.reduce(
      (sum, customer) => sum + Number(customer.paid_orders_count || 0),
      0
    );

    return {
      customers: pagination?.total || customers.length,
      totalOrders,
      paidOrders,
      totalSpent,
    };
  }, [customers, pagination]);

  return (
    <AdminLayout
      title="Clientes"
      subtitle="Base de clientes, histórico de pedidos, telefone e comportamento de compra."
    >
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Metric title="Clientes" value={pageTotals.customers} />
        <Metric title="Pedidos nesta página" value={pageTotals.totalOrders} />
        <Metric title="Pedidos pagos" value={pageTotals.paidOrders} tone="green" />
        <Metric title="Total pago página" value={money(pageTotals.totalSpent)} />
      </div>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Base de clientes</h3>
            <p className="text-sm text-slate-500">
              {pagination?.total || customers.length} cliente(s) encontrado(s)
            </p>
          </div>
        </div>

        <div className="p-5 border-b border-slate-100 bg-slate-50/60">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {customers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-5xl">👥</p>
            <h3 className="text-xl font-semibold mt-4">
              Nenhum cliente encontrado
            </h3>
            <p className="text-slate-500 mt-2">
              Clientes aparecem aqui após realizarem pedidos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Pedidos
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Pagos
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Total gasto
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Último pedido
                  </th>
                  <th className="text-right px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50/70 transition"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-medium">
                          {customer.name?.charAt(0)?.toUpperCase() || "C"}
                        </div>

                        <div>
                          <p className="font-medium text-slate-900">
                            {customer.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            Cliente cadastrado
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {customer.phone}
                    </td>

                    <td className="px-5 py-4">
                      <Badge>{customer.orders_count || 0} pedido(s)</Badge>
                    </td>

                    <td className="px-5 py-4">
                      <Badge tone="green">
                        {customer.paid_orders_count || 0} pago(s)
                      </Badge>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      {money(customer.total_spent)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDateTime(customer.last_order_at)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openHistory(customer)}
                          className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100"
                          title="Histórico"
                        >
                          🕒
                        </button>

                        <button
                          onClick={() => openEdit(customer)}
                          className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100"
                          title="Editar"
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() => deleteCustomer(customer)}
                          className="w-9 h-9 rounded-xl border border-red-100 text-red-600 hover:bg-red-50"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <PremiumPagination
              totalItems={pagination?.total || customers.length}
              itemsPerPage={itemsPerPage}
              currentPage={page}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <aside className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col">
            <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Edição de cliente</p>
                <h3 className="text-xl font-semibold">Editar cliente</h3>
              </div>

              <button
                onClick={closeDrawer}
                className="w-10 h-10 rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={saveCustomer} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                <Field label="Nome">
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Nome do cliente"
                    className="admin-input"
                  />
                </Field>

                <Field label="Telefone">
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="Telefone"
                    className="admin-input"
                  />
                </Field>
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={closeDrawer}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-medium"
              >
                Cancelar
              </button>

              <button
                onClick={saveCustomer}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-medium disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </aside>
        </div>
      )}

      {historyOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <aside className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col">
            <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Histórico do cliente</p>
                <h3 className="text-xl font-semibold">
                  {selectedCustomer.name}
                </h3>
              </div>

              <button
                onClick={() => {
                  setHistoryOpen(false);
                  setSelectedCustomer(null);
                  setCustomerOrders([]);
                }}
                className="w-10 h-10 rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {customerOrders.length === 0 ? (
                <div className="bg-slate-50 rounded-3xl p-8 text-center">
                  <p className="text-slate-500">Nenhum pedido encontrado.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-slate-200 rounded-3xl p-5"
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            Mesa {order.table_number}
                          </p>

                          <p className="text-sm text-slate-500">
                            {formatDateTime(order.created_at)}
                          </p>

                          <div className="mt-2 flex gap-2 flex-wrap">
                            <Badge>{order.status}</Badge>
                            <Badge>{order.payment_status || "pendente"}</Badge>
                          </div>
                        </div>

                        <p className="text-lg font-semibold">
                          {money(order.total)}
                        </p>
                      </div>

                      <div className="mt-4 space-y-2">
                        {order.order_items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between gap-3 text-sm"
                          >
                            <p>
                              {item.quantity}x {item.product_name}
                            </p>

                            <p className="font-medium">
                              {money(item.subtotal)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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

function Badge({ children, tone }) {
  const tones = {
    green: "bg-green-50 text-green-700 border-green-100",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
        tones[tone] || "bg-blue-50 text-blue-700 border-blue-100"
      }`}
    >
      {children}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <p className="text-sm font-medium text-slate-700 mb-2">{label}</p>
      {children}
    </label>
  );
}