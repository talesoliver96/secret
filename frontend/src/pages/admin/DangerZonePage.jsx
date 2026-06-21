import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../api/axios";

export default function DangerZonePage() {
  const [password, setPassword] = useState("");

  async function resetOrders() {
    const confirmText = prompt(
      "Digite LIMPAR PEDIDOS"
    );

    if (confirmText !== "LIMPAR PEDIDOS") return;

    await api.post("/admin/danger/reset-orders", {
      password,
    });

    alert("Pedidos removidos.");
  }

  async function resetAll() {
    const confirmText = prompt(
      "Digite APAGAR TUDO"
    );

    if (confirmText !== "APAGAR TUDO") return;

    await api.post("/admin/danger/reset-all", {
      password,
    });

    alert("Banco resetado.");
  }

  return (
    <AdminLayout
      title="Danger Zone"
      subtitle="Área restrita."
    >
      <div className="max-w-xl bg-white border border-red-200 rounded-3xl p-8">

        <h2 className="text-2xl font-semibold text-red-600">
          Área Perigosa
        </h2>

        <p className="mt-3 text-slate-500">
          Essas ações não podem ser desfeitas.
        </p>

        <input
          type="password"
          placeholder="Senha master"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="mt-6 w-full border rounded-2xl px-4 py-3"
        />

        <div className="mt-8 space-y-3">

          <button
            onClick={resetOrders}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl"
          >
            Limpar Pedidos + Clientes
          </button>

          <button
            onClick={resetAll}
            className="w-full bg-red-600 text-white py-4 rounded-2xl"
          >
            APAGAR TUDO
          </button>

        </div>
      </div>
    </AdminLayout>
  );
}