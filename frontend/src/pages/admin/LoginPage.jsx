import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "admin@thesecretburger.com",
    password: "123456",
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      const { data } = await api.post("/auth/login", form);

      localStorage.setItem("@secretburger:token", data.token);

      navigate("/admin/orders");
    } catch {
      alert("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <section className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black">
          SB
        </div>

        <h1 className="text-3xl font-black mt-6">Painel Admin</h1>

        <p className="text-slate-500 mt-2">
          Entre para gerenciar pedidos, mesas e histórico.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="E-mail"
            className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-4 outline-none"
          />

          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Senha"
            className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-4 outline-none"
          />

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}