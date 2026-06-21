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

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);

  async function loadCustomers() {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.append("search", search.trim());
    }

    const { data } = await api.get(`/admin/customers?${params.toString()}`);
    setCustomers(data || []);
  }

  async function loadCustomerOrders(customer) {
    setSelectedCustomer(customer);

    const { data } = await api.get(`/admin/customers/${customer.id}/orders`);
    setCustomerOrders(data || []);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadCustomers();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  function startEdit(customer) {
    setEditing(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
    });
  }

  function resetEdit() {
    setEditing(null);
    setForm({ name: "", phone: "" });
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
      resetEdit();
      await loadCustomers();
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
      await loadCustomers();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao excluir cliente.");
    }
  }

  const totals = useMemo(() => {
    const totalSpent = customers.reduce(
      (sum, customer) => sum + Number(customer.total_spent || 0),
      0
    );

    const totalOrders = customers.reduce(
      (sum, customer) => sum + Number(customer.orders_count || 0),
      0
    );

    return {
      totalCustomers: customers.length,
      totalOrders,
      totalSpent,
    };
  }, [customers]);

  return (
    <AdminLayout
      title="Clientes"
      subtitle="Consulte clientes, telefones, histórico de pedidos e valor gasto."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Metric title="Clientes encontrados" value={totals.totalCustomers} />
        <Metric title="Pedidos vinculados" value={totals.totalOrders} />
        <Metric title="Total pago" value={money(totals.totalSpent)} />
      </div>

      <section className="grid grid-cols-1 2xl:grid-cols-3 gap-5">
        {editing && (
          <form
            onSubmit={saveCustomer}
            className="admin-card p-6 2xl:col-span-1"
          >
            <h3 className="text-2xl font-semibold">Editar cliente</h3>

            <div className="mt-5 space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome"
                className="admin-input"
              />

              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Telefone"
                className="admin-input"
              />

              <button
                disabled={loading}
                className="w-full admin-btn-primary py-4 disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Salvar alterações"}
              </button>

              <button
                type="button"
                onClick={resetEdit}
                className="w-full admin-btn-muted py-4"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <section
          className={`admin-card overflow-hidden ${
            editing ? "2xl:col-span-2" : "2xl:col-span-3"
          }`}
        >
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-2xl font-semibold">Base de clientes</h3>
            <p className="text-slate-500 text-sm">
              Busque por nome ou telefone.
            </p>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="admin-input mt-5"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 p-5">
            {customers.map((customer) => (
              <article
                key={customer.id}
                className="border border-slate-200 rounded-3xl p-5 bg-white"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <h4 className="text-xl font-semibold">{customer.name}</h4>
                    <p className="text-slate-500 text-sm">{customer.phone}</p>
                  </div>

                  <span className="h-fit px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
                    Cliente
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <Info title="Pedidos" value={customer.orders_count || 0} />
                  <Info title="Pagos" value={customer.paid_orders_count || 0} />
                  <Info title="Gasto" value={money(customer.total_spent)} />
                  <Info title="Último pedido" value={dateTime(customer.last_order_at)} />
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => loadCustomerOrders(customer)}
                    className="admin-btn-dark py-3"
                  >
                    Histórico
                  </button>

                  <button
                    onClick={() => startEdit(customer)}
                    className="admin-btn-muted py-3"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => deleteCustomer(customer)}
                    className="admin-btn-danger py-3"
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-3xl rounded-[32px] p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-blue-600 font-semibold uppercase tracking-[0.2em] text-xs">
                  Histórico do cliente
                </p>

                <h3 className="text-3xl font-semibold mt-2">
                  {selectedCustomer.name}
                </h3>

                <p className="text-slate-500">{selectedCustomer.phone}</p>
              </div>

              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerOrders([]);
                }}
                className="w-10 h-10 rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {customerOrders.length === 0 ? (
                <div className="bg-slate-50 rounded-3xl p-8 text-center">
                  <p className="text-slate-500">Nenhum pedido encontrado.</p>
                </div>
              ) : (
                customerOrders.map((order) => (
                  <div key={order.id} className="bg-slate-50 rounded-3xl p-5">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          Mesa {order.table_number}
                        </p>

                        <p className="text-sm text-slate-500">
                          {dateTime(order.created_at)}
                        </p>

                        <div className="mt-2 flex gap-2 flex-wrap">
                          <Badge>{order.status}</Badge>
                          <Badge>{order.payment_status || "pendente"}</Badge>
                        </div>
                      </div>

                      <p className="text-xl font-semibold">
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
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Metric({ title, value }) {
  return (
    <div className="admin-card p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-3">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="font-medium mt-1 break-words">{value}</p>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-medium">
      {children}
    </span>
  );
}