import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const menuGroups = [
  {
    title: "Dashboard",
    items: [{ label: "Visão geral", path: "/admin/dashboard", icon: "📊" }],
  },
  {
    title: "Operação",
    items: [
      { label: "Pedidos", path: "/admin/orders", icon: "🧾" },
      { label: "Mesas", path: "/admin/tables", icon: "🍽️" },
      { label: "Histórico", path: "/admin/history", icon: "🕒" },
    ],
  },
  {
    title: "Cardápio",
    items: [
      { label: "Produtos", path: "/admin/products", icon: "🍔" },
      { label: "Categorias", path: "/admin/categories", icon: "🏷️" },
    ],
  },
  {
    title: "Relacionamento",
    items: [{ label: "Clientes", path: "/admin/customers", icon: "👥" }],
  },
  {
    title: "Configurações",
    items: [{ label: "Geral e QR Codes", path: "/admin/settings", icon: "⚙️" }],
  },
];

export default function AdminLayout({
  children,
  title,
  subtitle,
  alertCount = 0,
  onEnableAlerts,
}) {
  const [globalAlertCount, setGlobalAlertCount] = useState(0);

const visibleAlertCount = alertCount || globalAlertCount;

async function loadGlobalAlerts() {
  try {
    const { data } = await api.get(
      "/admin/orders?page=1&limit=1&status=recebido"
    );

    setGlobalAlertCount(data.pagination?.total || 0);
  } catch {}
}

useEffect(() => {
  loadGlobalAlerts();

  const interval = setInterval(loadGlobalAlerts, 5000);

  return () => clearInterval(interval);
}, []);

async function loadGlobalAlerts() {
  try {
    const { data } = await api.get("/admin/orders?page=1&limit=1&status=recebido");
    setGlobalAlertCount(data.pagination?.total || 0);
  } catch {}
}

useEffect(() => {
  loadGlobalAlerts();

  const interval = setInterval(loadGlobalAlerts, 5000);

  return () => clearInterval(interval);
}, []);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const currentSection = useMemo(() => {
    for (const group of menuGroups) {
      const item = group.items.find((i) => i.path === location.pathname);
      if (item) return item.label;
    }
    return "Painel";
  }, [location.pathname]);

  function logout() {
    localStorage.removeItem("@secretburger:token");
    window.location.href = "/admin/login";
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-900 lg:flex">
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col fixed left-0 top-0 bottom-0">
        <div className="h-20 px-6 flex items-center border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-semibold">
              SB
            </div>

            <div>
              <p className="font-semibold leading-tight">The Secret Burger</p>
              <p className="text-xs text-slate-500">Restaurant OS</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {group.title}
              </p>

              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const active = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition ${
                        active
                          ? "bg-slate-950 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>

                      {item.path === "/admin/orders" && visibleAlertCount > 0 && (
                        <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center">
                          {visibleAlertCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <button
            onClick={onEnableAlerts}
            className={`w-full rounded-2xl px-4 py-3 text-left transition ${
              visibleAlertCount > 0
                ? "bg-red-50 text-red-700 border border-red-100"
                : "bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Alertas de pedidos</span>
              <span>{visibleAlertCount > 0 ? "🔴" : "🔔"}</span>
            </div>
            <p className="text-xs mt-1 opacity-75">
              {visibleAlertCount > 0
                ? `${visibleAlertCount} aguardando preparo`
                : "Clique para ativar som"}
            </p>
          </button>

          <button
            onClick={logout}
            className="w-full px-4 py-3 rounded-2xl text-sm font-medium text-red-600 hover:bg-red-50 text-left"
          >
            Sair
          </button>
        </div>
      </aside>

      <section className="lg:ml-72 flex-1 min-h-screen">
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200">
          <div className="h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="w-11 h-11 rounded-2xl bg-slate-950 text-white"
              >
                ☰
              </button>

              <div>
                <p className="font-semibold">Secret Burger</p>
                <p className="text-xs text-slate-500">{currentSection}</p>
              </div>
            </div>

            <div className="hidden lg:block">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-[0.2em]">
                {currentSection}
              </p>
              <p className="text-sm text-slate-500">
                Gestão operacional da lanchonete
              </p>
            </div>

            <div className="flex-1 max-w-xl hidden md:block">
              <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Buscar pedidos, clientes, produtos..."
                className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onEnableAlerts}
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center ${
                  visibleAlertCount > 0
                    ? "bg-red-600 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                🔔
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-white text-red-600 text-[11px] font-semibold flex items-center justify-center">
                    {visibleAlertCount}
                  </span>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-3 pl-2">
                <div className="text-right">
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-slate-500">Online</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center text-sm font-semibold">
                  A
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-[1500px] mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-slate-500 mt-2 max-w-3xl">{subtitle}</p>
              )}
            </div>

            {children}
          </div>
        </div>
      </section>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden">
          <div className="bg-white w-80 max-w-[88%] min-h-screen shadow-2xl flex flex-col">
            <div className="h-20 px-5 flex items-center justify-between border-b border-slate-100">
              <div>
                <p className="font-semibold">The Secret Burger</p>
                <p className="text-xs text-slate-500">Restaurant OS</p>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
              {menuGroups.map((group) => (
                <div key={group.title}>
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {group.title}
                  </p>

                  <div className="mt-2 space-y-1">
                    {group.items.map((item) => {
                      const active = location.pathname === item.path;

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium ${
                            active
                              ? "bg-slate-950 text-white"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-100">
              <button
                onClick={logout}
                className="w-full px-4 py-3 rounded-2xl text-sm font-medium text-red-600 hover:bg-red-50 text-left"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}