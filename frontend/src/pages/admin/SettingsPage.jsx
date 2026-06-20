import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../api/axios";

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({ number: "", name: "" });
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

  async function toggleRestaurant() {
    await api.patch("/admin/settings", {
      restaurant_open: !settings.restaurant_open,
    });

    await loadData();
  }

  async function createTable(e) {
    e.preventDefault();

    if (!newTable.number) {
      alert("Informe o número da mesa.");
      return;
    }

    setLoading(true);

    await api.post("/admin/restaurant-tables", {
      number: Number(newTable.number),
      name: newTable.name || `Mesa ${newTable.number}`,
    });

    setNewTable({ number: "", name: "" });
    await loadData();

    setLoading(false);
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
    const confirm = window.confirm(
      `Regenerar QR Code da Mesa ${table.number}? O QR antigo vai parar de funcionar.`
    );

    if (!confirm) return;

    await api.patch(`/admin/restaurant-tables/${table.id}/regenerate-token`);
    await loadData();
  }

  function tableLink(table) {
    return `${appUrl}/mesa/${table.number}/${table.token}`;
  }

  function copyLink(table) {
    navigator.clipboard.writeText(tableLink(table));
    alert("Link copiado.");
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminLayout
      title="Configurações"
      subtitle="Controle o funcionamento do restaurante, crie mesas e gere QR Codes seguros."
    >
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-1 bg-white border border-slate-200 rounded-[28px] p-6">
          <p className="text-sm text-slate-500">Status do restaurante</p>

          <h3 className="text-3xl font-black mt-2">
            {settings?.restaurant_open ? "Aberto" : "Fechado"}
          </h3>

          <p className="text-slate-500 mt-2">
            Quando estiver fechado, clientes não conseguem abrir o cardápio nem fazer pedidos.
          </p>

          <button
            onClick={toggleRestaurant}
            className={`mt-6 w-full py-4 rounded-2xl font-black text-white ${
              settings?.restaurant_open ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {settings?.restaurant_open ? "Fechar restaurante" : "Abrir restaurante"}
          </button>
        </div>

        <form
          onSubmit={createTable}
          className="xl:col-span-2 bg-white border border-slate-200 rounded-[28px] p-6"
        >
          <h3 className="text-2xl font-black">Criar nova mesa</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <input
              value={newTable.number}
              onChange={(e) =>
                setNewTable({ ...newTable, number: e.target.value })
              }
              type="number"
              placeholder="Número da mesa"
              className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-4 outline-none"
            />

            <input
              value={newTable.name}
              onChange={(e) =>
                setNewTable({ ...newTable, name: e.target.value })
              }
              placeholder="Nome opcional"
              className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-4 outline-none"
            />

            <button
              disabled={loading}
              className="bg-blue-600 text-white rounded-2xl font-black disabled:opacity-50"
            >
              Criar mesa
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8 bg-white border border-slate-200 rounded-[28px] overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-2xl font-black">Mesas e QR Codes</h3>
          <p className="text-slate-500 text-sm">
            {tables.length} mesa(s) cadastrada(s)
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5 p-5">
          {tables.map((table) => (
            <article
              key={table.id}
              className="border border-slate-200 rounded-[28px] p-5"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-3xl font-black">Mesa {table.number}</p>
                  <p className="text-slate-500">{table.name || "Sem nome"}</p>
                </div>

                <span
                  className={`h-fit px-3 py-1 rounded-full text-xs font-black border ${
                    table.active
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-red-100 text-red-800 border-red-200"
                  }`}
                >
                  {table.active ? "Ativa" : "Inativa"}
                </span>
              </div>

              <div className="mt-5 bg-slate-50 rounded-3xl p-5 flex justify-center">
                <QRCodeCanvas value={tableLink(table)} size={180} />
              </div>

              <div className="mt-5 bg-slate-50 rounded-2xl p-4">
                <p className="text-xs text-slate-500">Link seguro</p>
                <p className="text-sm font-bold break-all mt-1">
                  {tableLink(table)}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => copyLink(table)}
                  className="bg-slate-950 text-white py-3 rounded-2xl font-black"
                >
                  Copiar
                </button>

                <button
                  onClick={() => toggleTable(table)}
                  className={`py-3 rounded-2xl font-black text-white ${
                    table.active ? "bg-red-600" : "bg-green-600"
                  }`}
                >
                  {table.active ? "Desativar" : "Ativar"}
                </button>

                <button
                  onClick={() => regenerateToken(table)}
                  className="bg-orange-500 text-white py-3 rounded-2xl font-black"
                >
                  Novo QR
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}