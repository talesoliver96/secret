import { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../api/axios";

const emptyTable = {
  number: "",
  name: "",
  active: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState(emptyTable);
  const [editing, setEditing] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const appUrl = window.location.origin;

  async function loadData() {
    const [settingsResponse, tablesResponse] = await Promise.all([
      api.get("/admin/settings"),
      api.get("/admin/restaurant-tables"),
    ]);

    setSettings(settingsResponse.data);
    setTables(tablesResponse.data || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredTables = useMemo(() => {
    const term = search.toLowerCase();

    return tables.filter((table) => {
      return (
        !term ||
        String(table.number).includes(term) ||
        table.name?.toLowerCase().includes(term)
      );
    });
  }, [tables, search]);

  function tableLink(table) {
    return `${appUrl}/mesa/${table.number}/${table.token}`;
  }

  async function toggleRestaurant() {
    await api.patch("/admin/settings", {
      restaurant_open: !settings.restaurant_open,
    });

    await loadData();
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyTable);
    setDrawerOpen(true);
  }

  function openEdit(table) {
    setEditing(table);
    setForm({
      number: table.number || "",
      name: table.name || "",
      active: table.active,
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setEditing(null);
    setForm(emptyTable);
    setDrawerOpen(false);
  }

  async function saveTable(e) {
    e.preventDefault();

    if (!form.number) {
      alert("Informe o número da mesa.");
      return;
    }

    setLoading(true);

    try {
      if (editing) {
        await api.patch(`/admin/restaurant-tables/${editing.id}`, {
          number: Number(form.number),
          name: form.name || `Mesa ${form.number}`,
          active: form.active,
        });
      } else {
        await api.post("/admin/restaurant-tables", {
          number: Number(form.number),
          name: form.name || `Mesa ${form.number}`,
        });
      }

      closeDrawer();
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao salvar mesa.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleTable(table) {
    await api.patch(`/admin/restaurant-tables/${table.id}`, {
      number: table.number,
      name: table.name,
      active: !table.active,
    });

    await loadData();
  }

  async function regenerateToken(table) {
    const confirmRegenerate = confirm(
      `Gerar novo QR Code para a Mesa ${table.number}? O QR antigo deixará de funcionar.`
    );

    if (!confirmRegenerate) return;

    await api.patch(`/admin/restaurant-tables/${table.id}/regenerate-token`);
    await loadData();
  }

  async function deleteTable(table) {
    if (!confirm(`Excluir Mesa ${table.number}?`)) return;

    try {
      await api.delete(`/admin/restaurant-tables/${table.id}`);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao excluir mesa.");
    }
  }

  function copyLink(table) {
    navigator.clipboard.writeText(tableLink(table));
    alert("Link copiado.");
  }

  return (
    <AdminLayout
      title="Configurações"
      subtitle="Controle o funcionamento do restaurante, mesas, QR Codes e acesso dos clientes."
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 xl:col-span-1">
          <p className="text-sm text-slate-500">Status do restaurante</p>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold">
                {settings?.restaurant_open ? "Aberto" : "Fechado"}
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                {settings?.restaurant_open
                  ? "Clientes podem acessar o cardápio."
                  : "O cardápio fica bloqueado para clientes."}
              </p>
            </div>

            <span
              className={`w-3 h-3 rounded-full ${
                settings?.restaurant_open ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </div>

          <button
            onClick={toggleRestaurant}
            className={`mt-6 w-full py-3 rounded-2xl font-medium text-white ${
              settings?.restaurant_open
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {settings?.restaurant_open ? "Fechar restaurante" : "Abrir restaurante"}
          </button>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 xl:col-span-2">
          <p className="text-sm text-slate-500">Resumo</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <Info title="Mesas cadastradas" value={tables.length} />
            <Info
              title="Mesas ativas"
              value={tables.filter((table) => table.active).length}
            />
            <Info
              title="Mesas inativas"
              value={tables.filter((table) => !table.active).length}
            />
          </div>
        </section>
      </div>

      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Mesas e QR Codes</h3>
            <p className="text-sm text-slate-500">
              {filteredTables.length} mesa(s) encontrada(s)
            </p>
          </div>

          <button
            onClick={openCreate}
            className="bg-slate-950 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-medium"
          >
            + Nova mesa
          </button>
        </div>

        <div className="p-5 border-b border-slate-100 bg-slate-50/60">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número ou nome da mesa..."
            className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Mesa
                </th>
                <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Link seguro
                </th>
                <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  QR Code
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
                <tr key={table.id} className="hover:bg-slate-50/70 transition">
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
                          {table.name || "Sem nome"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-600 max-w-sm truncate">
                      {tableLink(table)}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl p-1">
                      <QRCodeCanvas value={tableLink(table)} size={56} />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                        table.active
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-red-50 text-red-700 border-red-100"
                      }`}
                    >
                      {table.active ? "Ativa" : "Inativa"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => copyLink(table)}
                        className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100"
                        title="Copiar link"
                      >
                        🔗
                      </button>

                      <button
                        onClick={() => openEdit(table)}
                        className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100"
                        title="Editar"
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() => toggleTable(table)}
                        className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100"
                        title={table.active ? "Desativar" : "Ativar"}
                      >
                        {table.active ? "🙈" : "👁️"}
                      </button>

                      <button
                        onClick={() => regenerateToken(table)}
                        className="w-9 h-9 rounded-xl border border-orange-100 text-orange-600 hover:bg-orange-50"
                        title="Novo QR"
                      >
                        ♻️
                      </button>

                      <button
                        onClick={() => deleteTable(table)}
                        className="w-9 h-9 rounded-xl border border-red-100 text-red-600 hover:bg-red-50"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTables.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-14 text-center">
                    <p className="text-slate-500">Nenhuma mesa encontrada.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <aside className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col">
            <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  {editing ? "Edição de mesa" : "Cadastro de mesa"}
                </p>
                <h3 className="text-xl font-semibold">
                  {editing ? "Editar mesa" : "Nova mesa"}
                </h3>
              </div>

              <button
                onClick={closeDrawer}
                className="w-10 h-10 rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={saveTable} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                <Field label="Número da mesa">
                  <input
                    type="number"
                    value={form.number}
                    onChange={(e) =>
                      setForm({ ...form, number: e.target.value })
                    }
                    placeholder="Ex: 1"
                    className="admin-input"
                  />
                </Field>

                <Field label="Nome da mesa">
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Ex: Mesa 01"
                    className="admin-input"
                  />
                </Field>

                <label className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div>
                    <p className="font-medium">Mesa ativa</p>
                    <p className="text-sm text-slate-500">
                      Mesas inativas bloqueiam o QR Code.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.checked })
                    }
                  />
                </label>
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
                onClick={saveTable}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-medium disabled:opacity-50"
              >
                {loading ? "Salvando..." : editing ? "Salvar" : "Criar mesa"}
              </button>
            </div>
          </aside>
        </div>
      )}
    </AdminLayout>
  );
}

function Info({ title, value }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
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