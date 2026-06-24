import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import logo from "../../assets/logo.png";
import heroBurger from "../../assets/hero-burger.png";
import { formatDateTime } from "../../utils/date";

const CUSTOMER_CACHE_KEY = "@secretburger:customer";
const CUSTOMER_CACHE_TTL = 3 * 60 * 60 * 1000;

function getCachedCustomer() {
  const raw = localStorage.getItem(CUSTOMER_CACHE_KEY);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    if (Date.now() - parsed.savedAt > CUSTOMER_CACHE_TTL) {
      localStorage.removeItem(CUSTOMER_CACHE_KEY);
      return null;
    }

    return parsed.customer;
  } catch {
    localStorage.removeItem(CUSTOMER_CACHE_KEY);
    return null;
  }
}

function saveCachedCustomer(customer) {
  localStorage.setItem(
    CUSTOMER_CACHE_KEY,
    JSON.stringify({
      customer,
      savedAt: Date.now(),
    })
  );
}

export default function MenuPage() {
  const { numero, token } = useParams();

  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("todos");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [notes, setNotes] = useState("");
  const [tableValid, setTableValid] = useState(false);
  const [tableError, setTableError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  const [customerReady, setCustomerReady] = useState(false);
  const [myOrdersOpen, setMyOrdersOpen] = useState(false);
  const [myOrders, setMyOrders] = useState([]);

  async function loadMenu() {
    const { data } = await api.get("/menu");
    setProducts(data || []);
  }

  async function loadMyOrders() {
    try {
      if (!customer.phone) {
        alert("Telefone não encontrado");
        return;
      }

      const { data } = await api.get(
        `/public/my-orders?phone=${encodeURIComponent(customer.phone)}`
      );

      console.log(data);

      setMyOrders(data || []);
      setMyOrdersOpen(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar pedidos");
    }
  }

  useEffect(() => {
    async function init() {
      try {
        await api.get(`/public/table/${numero}/${token}`);
        setTableValid(true);

        const cached = getCachedCustomer();

        if (cached?.name && cached?.phone) {
          setCustomer(cached);
          setCustomerReady(true);
        }

        loadMenu();
      } catch (error) {
        setTableError(
          error.response?.data?.error ||
            "QR Code inválido ou restaurante fechado."
        );
      }
    }

    init();
  }, [numero, token]);

  function getCategoryIcon(category) {
    const slug = category?.slug?.toLowerCase() || "";
    const name = category?.name?.toLowerCase() || "";

    if (slug === "todos") return "🍔";
    if (slug.includes("bebida") || name.includes("bebida")) return "🥤";
    if (slug.includes("sobremesa") || name.includes("sobremesa")) return "🍰";
    if (slug.includes("combo") || name.includes("combo")) return "✦";
    if (slug.includes("burger") || name.includes("burger")) return "🍔";

    return "◌";
  }

  const categories = useMemo(() => {
    const unique = products
      .map((p) => p.category)
      .filter(Boolean)
      .reduce((acc, cat) => {
        if (!acc.find((item) => item.slug === cat.slug)) acc.push(cat);
        return acc;
      }, []);

    return [
      { name: "Menu", slug: "todos", icon: "🍔" },
      ...unique.map((category) => ({
        ...category,
        icon: getCategoryIcon(category),
      })),
    ];
  }, [products]);

  const filteredProducts =
    activeCategory === "todos"
      ? products
      : products.filter((p) => p.category?.slug === activeCategory);

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const heroImage = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1400&auto=format&fit=crop";
  // const heroImage = heroBurger

  function addToCart(product) {
    const exists = cart.find((item) => item.id === product.id);

    if (exists) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          quantity: 1,
        },
      ]);
    }

    setCartOpen(true);
  }

  function decreaseItem(id) {
    setCart(
      cart
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function increaseItem(id) {
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  function removeItem(id) {
    setCart(cart.filter((item) => item.id !== id));
  }

  async function submitOrder() {
    if (!customer.name.trim() || !customer.phone.trim()) {
      alert("Informe seu nome e telefone.");
      return;
    }

    try {
      setLoading(true);

      saveCachedCustomer(customer);

      const { data } = await api.post("/orders", {
        table_number: Number(numero),
        table_token: token,
        name: customer.name,
        phone: customer.phone,
        notes,
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      });

      setSuccessOrder(data);
      setCart([]);
      setCartOpen(false);
      setCheckoutOpen(false);
      setCustomer({ name: "", phone: "" });
      setNotes("");
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao criar pedido.");
    } finally {
      setLoading(false);
    }
  }

  if (tableError) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <section className="text-center max-w-md">
          <div className="text-6xl">🔒</div>
          <h1 className="text-3xl font-semibold mt-6">Acesso indisponível</h1>
          <p className="text-zinc-400 mt-3">{tableError}</p>
        </section>
      </main>
    );
  }

  if (!tableValid) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-amber-400 tracking-[0.3em] uppercase">
          Carregando cardápio...
        </p>
      </main>
    );
  }

  if (successOrder) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-5">
        <section className="max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full bg-amber-400 text-black flex items-center justify-center text-5xl mx-auto">
            ✓
          </div>

          <h1 className="text-4xl font-semibold mt-8">Pedido recebido</h1>

          <p className="text-zinc-400 mt-3">
            Seu pedido foi enviado para a cozinha.
          </p>

          <button
            onClick={() => setSuccessOrder(null)}
            className="mt-8 w-full bg-amber-400 text-black py-4 rounded-full font-semibold"
          >
            Fazer outro pedido
          </button>
        </section>
      </main>
    );
  }

  if (!customerReady) {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-5">
      <section className="w-full max-w-md bg-[#111] border border-white/10 rounded-[32px] p-6">
        <h1 className="text-3xl font-semibold">Antes de pedir</h1>

        <p className="text-zinc-400 mt-3">
          Informe seu nome e telefone para acompanhar seus pedidos nesta mesa.
        </p>

        <div className="mt-6 space-y-3">
          <input
            value={customer.name}
            onChange={(e) =>
              setCustomer({ ...customer, name: e.target.value })
            }
            placeholder="Seu nome"
            className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 outline-none"
          />

          <input
            value={customer.phone}
            onChange={(e) =>
              setCustomer({ ...customer, phone: e.target.value })
            }
            placeholder="Telefone"
            className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 outline-none"
          />
        </div>

        <button
          onClick={() => {
            if (!customer.name.trim() || !customer.phone.trim()) {
              alert("Informe nome e telefone.");
              return;
            }

            saveCachedCustomer(customer);
            setCustomerReady(true);
          }}
          className="mt-6 w-full bg-amber-400 text-black py-4 rounded-full font-semibold"
        >
          Entrar no cardápio
        </button>
      </section>
    </main>
  );
}

const activeMyOrders = myOrders.filter((order) =>
  ["recebido", "preparando", "pronto"].includes(order.status)
);

const finishedMyOrders = myOrders.filter((order) =>
  ["entregue", "cancelado"].includes(order.status)
);

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <section className="relative min-h-[560px] overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-black" />

        <img
          src={heroImage}
          alt="Burger"
          className="absolute right-[-160px] md:right-0 top-0 h-full w-[85%] object-cover opacity-95"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

        <div className="relative max-w-7xl mx-auto px-5 py-8">
          <header>
            <img
              src={logo}
              alt="The Secret Burger"
              className="h-24 md:h-28 w-auto object-contain"
            />
          </header>

          <div className="mt-24 max-w-xl">
            <p className="text-amber-400 tracking-[0.55em] uppercase text-sm">
              O hambúrguer
            </p>

            <h1 className="text-7xl md:text-8xl font-semibold leading-[0.85] mt-5">
              SECRETO
            </h1>

            <p className="text-2xl md:text-3xl text-amber-400 tracking-wide mt-5">
              que você nunca esquece!
            </p>
          </div>
        </div>
      </section>

      <nav className="sticky top-0 z-30 bg-black/90 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5">
          <div className="h-28 flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <div className="hidden md:block mr-8 shrink-0 leading-none">
              <p className="text-sm font-semibold text-white">THE SECRET</p>
              <p className="text-sm font-semibold text-amber-400">BURGER.</p>
            </div>
                                        <button
  onClick={loadMyOrders}
  className="border border-white/15 rounded-full px-5 py-3 text-sm bg-black/30 backdrop-blur-xl"
>
  Meus pedidos
</button>

            <div className="flex items-center gap-3">
              {categories.map((category) => {
                const active = activeCategory === category.slug;

                return (
                  <button
                    key={category.slug}
                    onClick={() => setActiveCategory(category.slug)}
                    className={`relative min-w-[104px] h-20 rounded-[22px] border transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                      active
                        ? "bg-white/[0.08] border-white/15 text-amber-400 shadow-[0_0_45px_rgba(245,158,11,.12)]"
                        : "bg-transparent border-transparent text-zinc-500 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    {active && (
                      <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-[2px] bg-amber-400 rounded-full" />
                    )}

                    <span className="text-xl leading-none">{category.icon}</span>

                    <span className="text-xs md:text-sm font-medium">
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {cart.length > 0 && (
              <button
                onClick={() => setCartOpen(true)}
                className="ml-auto hidden lg:flex items-center gap-4 rounded-full border border-amber-400/40 px-6 py-3 text-sm shrink-0 hover:bg-amber-400 hover:text-black transition"
              >
                <span className="relative text-xl">
                  🛒
                  <span className="absolute -top-3 -right-3 bg-amber-400 text-black text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                </span>

                <span className="font-semibold">R$ {total.toFixed(2)}</span>
              </button>
            )}
          </div>
        </div>
      </nav>


      <section id="menu" className="max-w-7xl mx-auto px-5 py-12">
        <div className="grid lg:grid-cols-[1fr_440px] gap-10 items-start">
          <div>
            <p className="text-amber-400 uppercase tracking-[0.3em] text-sm">
              {activeCategory === "todos"
                ? "Burgers"
                : categories.find((c) => c.slug === activeCategory)?.name}
            </p>

            <h2 className="text-4xl font-semibold mt-2">
              Feitos para quem leva o sabor a sério.
            </h2>

            <div className="mt-8 space-y-4">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="bg-[#111] border border-white/10 rounded-[24px] overflow-hidden hover:border-amber-400/40 transition min-h-[160px]"
                >
                  <div className="grid sm:grid-cols-[180px_1fr_80px]">
                    <div className="h-44 sm:h-40 bg-zinc-950/70 border-r border-white/10 flex items-center justify-center p-4">
  {product.image_url ? (
    <img
      src={product.image_url}
      alt={product.name}
      className="max-w-full max-h-full object-contain drop-shadow-2xl"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-6xl">
      🍔
    </div>
  )}
</div>

                    <div className="p-6">
                      <h3 className="text-2xl font-semibold">
                        {product.name}
                      </h3>

                      <p className="text-zinc-400 mt-3 leading-relaxed">
                        {product.description}
                      </p>

                      <p className="text-amber-400 text-2xl font-semibold mt-5">
                        R$ {Number(product.price).toFixed(2)}
                      </p>
                    </div>

                    <div className="p-6 flex items-end">
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full sm:w-14 h-14 rounded-full border border-amber-400 text-amber-400 text-3xl hover:bg-amber-400 hover:text-black transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="hidden lg:block sticky top-32 bg-[#111] border border-white/10 rounded-[32px] p-6">
            <CartContent
              cart={cart}
              total={total}
              increaseItem={increaseItem}
              decreaseItem={decreaseItem}
              removeItem={removeItem}
              onCheckout={() => setCheckoutOpen(true)}
            />
          </aside>
        </div>
      </section>

      {cart.length > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 left-5 right-5 md:left-1/2 md:-translate-x-1/2 md:w-[520px] z-40 bg-black/90 backdrop-blur-xl border border-white/15 rounded-[28px] px-6 py-4 flex items-center justify-between shadow-2xl"
        >
          <span className="flex items-center gap-4">
            <span className="relative text-2xl">
              🛒
              <span className="absolute -top-2 -right-3 bg-amber-400 text-black text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            </span>

            <strong>R$ {total.toFixed(2)}</strong>
          </span>

          <span>Ver pedido ↑</span>
        </button>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex justify-end lg:hidden">
          <aside className="w-full max-w-lg bg-[#111] h-full p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold">Meu pedido</h3>

              <button
                onClick={() => setCartOpen(false)}
                className="text-2xl"
              >
                ×
              </button>
            </div>

            <CartContent
              cart={cart}
              total={total}
              increaseItem={increaseItem}
              decreaseItem={decreaseItem}
              removeItem={removeItem}
              onCheckout={() => setCheckoutOpen(true)}
            />
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-end md:items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-[32px] w-full max-w-md p-6">
            <div className="flex justify-between">
              <h3 className="text-2xl font-semibold">Finalizar pedido</h3>

              <button
                onClick={() => setCheckoutOpen(false)}
                className="text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <input
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
                placeholder="Seu nome"
                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 outline-none"
              />

              <input
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
                placeholder="Telefone"
                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 outline-none"
              />

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações"
                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 outline-none min-h-24"
              />
            </div>

            <button
              onClick={submitOrder}
              disabled={loading}
              className="mt-6 w-full bg-amber-400 text-black py-4 rounded-full font-semibold disabled:opacity-50"
            >
              {loading
                ? "Enviando..."
                : `Enviar pedido • R$ ${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}

  {myOrdersOpen && (
  <div className="fixed inset-0 z-50 bg-black/70 flex justify-end">
    <aside className="w-full max-w-lg bg-[#111] h-full p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-zinc-500 text-sm">{customer.name}</p>
          <h3 className="text-2xl font-semibold">Meus pedidos</h3>
        </div>

        <button
          onClick={() => setMyOrdersOpen(false)}
          className="text-2xl"
        >
          ×
        </button>
      </div>

      {myOrders.length === 0 ? (
        <div className="border border-white/10 rounded-3xl p-6 text-center">
          <p className="text-4xl">🧾</p>
          <p className="text-zinc-400 mt-3">Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <OrderGroup title="Em andamento" orders={activeMyOrders} />
          <OrderGroup title="Finalizados" orders={finishedMyOrders} />
        </div>
      )}
    </aside>
  </div>
)}
    </main>
  );
}

function CartContent({
  cart,
  total,
  increaseItem,
  decreaseItem,
  removeItem,
  onCheckout,
}) {
  return (
    <>
      <h3 className="text-2xl font-semibold hidden lg:block">Meu pedido</h3>

      {cart.length === 0 ? (
        <div className="py-16 text-center text-zinc-500">
          Seu carrinho está vazio.
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 border-b border-white/10 pb-5"
            >
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-3xl">
                    🍔
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="font-semibold">{item.name}</p>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-zinc-500"
                  >
                    🗑️
                  </button>
                </div>

                <p className="text-zinc-500 text-sm">
                  1x R$ {Number(item.price).toFixed(2)}
                </p>

                <div className="mt-3 flex justify-between items-center">
                  <div className="flex border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => decreaseItem(item.id)}
                      className="w-8 h-8 bg-white/5"
                    >
                      -
                    </button>

                    <span className="w-8 h-8 flex items-center justify-center">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => increaseItem(item.id)}
                      className="w-8 h-8 bg-white/5"
                    >
                      +
                    </button>
                  </div>

                  <p className="text-amber-400 font-semibold">
                    R$ {(Number(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xl mt-4">
              <strong>Total</strong>
              <strong className="text-amber-400">
                R$ {total.toFixed(2)}
              </strong>
            </div>

            <button
              onClick={onCheckout}
              className="mt-6 w-full bg-amber-400 text-black py-4 rounded-full font-semibold"
            >
              Finalizar pedido
            </button>

            <p className="text-center text-zinc-500 text-sm mt-4">
              Pedido seguro e protegido
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function OrderGroup({ title, orders }) {
  if (!orders.length) {
    return (
      <section>
        <h4 className="text-sm uppercase tracking-[0.25em] text-amber-400 mb-3">
          {title}
        </h4>

        <div className="border border-white/10 rounded-3xl p-5 text-zinc-500 text-sm">
          Nenhum pedido aqui.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h4 className="text-sm uppercase tracking-[0.25em] text-amber-400 mb-3">
        {title}
      </h4>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-white/10 rounded-3xl p-5 bg-black/20"
          >
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold">Mesa {order.table_number}</p>

                <p className="text-xs text-zinc-500 mt-1">
                  {formatDateTime(order.created_at)}
                </p>

                <StatusPill status={order.status} />
              </div>

              <p className="text-amber-400 font-semibold">
                R$ {Number(order.total).toFixed(2)}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {order.order_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm text-zinc-300 gap-3"
                >
                  <span>
                    {item.quantity}x {item.product_name}
                  </span>

                  <span>R$ {Number(item.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusPill({ status }) {
  const labels = {
    recebido: "Recebido",
    preparando: "Preparando",
    pronto: "Pronto para entrega",
    entregue: "Entregue",
    cancelado: "Cancelado",
  };

  const styles = {
    recebido: "bg-red-500/15 text-red-300 border-red-500/20",
    preparando: "bg-blue-500/15 text-blue-300 border-blue-500/20",
    pronto: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    entregue: "bg-green-500/15 text-green-300 border-green-500/20",
    cancelado: "bg-zinc-500/15 text-zinc-300 border-zinc-500/20",
  };

  return (
    <span
      className={`inline-flex mt-3 px-3 py-1 rounded-full text-xs border ${
        styles[status] || styles.recebido
      }`}
    >
      {labels[status] || status}
    </span>
  );
}