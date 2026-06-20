import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export default function AdminLayout({
  children,
  title,
  subtitle,
  alertCount = 0,
  onEnableAlerts,
}) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menu = [
    { label: "Pedidos", path: "/admin/orders" },
    { label: "Mesas", path: "/admin/tables" },
    { label: "Histórico", path: "/admin/history" },
    { label: "Configurações", path: "/admin/settings" },
  ];

  function logout() {
    localStorage.removeItem("@secretburger:token");
    window.location.href = "/admin/login";
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-black">The Secret Burger</p>
          <p className="text-xs text-slate-500">Admin</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEnableAlerts}
            className={`relative w-11 h-11 rounded-2xl text-white ${
              alertCount > 0 ? "bg-red-600" : "bg-slate-950"
            }`}
          >
            🔔
            {alertCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-6 h-6 rounded-full bg-white text-red-600 text-xs font-black flex items-center justify-center">
                {alertCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-11 h-11 rounded-2xl bg-slate-950 text-white font-black"
          >
            ☰
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
          <div className="bg-white w-80 max-w-[85%] min-h-screen p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-lg">The Secret Burger</p>
                <p className="text-sm text-slate-500">Painel Admin</p>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <nav className="mt-8 space-y-2">
              {menu.map((item) => {
                const active = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-2xl font-semibold ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <button
                onClick={logout}
                className="w-full text-left px-4 py-3 rounded-2xl font-semibold text-red-600 hover:bg-red-50"
              >
                Sair
              </button>
            </nav>
          </div>
        </div>
      )}

      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 p-6 flex-col">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center font-black">
            SB
          </div>

          <div>
            <h1 className="font-black">The Secret</h1>
            <p className="text-sm text-slate-500">Burger Admin</p>
          </div>
        </div>

        <nav className="mt-10 space-y-2">
          {menu.map((item) => {
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-3 rounded-2xl font-semibold ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={logout}
            className="w-full text-left px-4 py-3 rounded-2xl font-semibold text-red-600 hover:bg-red-50"
          >
            Sair
          </button>
        </nav>

        <button
          onClick={onEnableAlerts}
          className={`mt-auto rounded-3xl p-5 text-left text-white ${
            alertCount > 0
              ? "bg-red-600 shadow-xl shadow-red-200"
              : "bg-slate-950"
          }`}
        >
          <div className="flex justify-between">
            <span className="text-2xl">🔔</span>

            {alertCount > 0 && (
              <span className="min-w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center font-black">
                {alertCount}
              </span>
            )}
          </div>

          <p className="font-black text-lg mt-3">
            {alertCount > 0 ? "Pedidos recebidos" : "Alertas"}
          </p>

          <p className="text-sm opacity-80">Clique para ativar som</p>
        </button>
      </aside>

      <section className="flex-1 p-4 sm:p-5 lg:p-8 overflow-x-hidden">
        <header>
          <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.25em]">
            The Secret Burger
          </p>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-2">
            {title}
          </h2>

          <p className="text-slate-500 mt-2 max-w-2xl">{subtitle}</p>
        </header>

        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}