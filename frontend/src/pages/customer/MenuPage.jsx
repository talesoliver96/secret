import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import logo from "../../assets/logo.png";
import heroBurger from "../../assets/hero-burger.png";
import { formatDateTime } from "../../utils/date";

const CUSTOMER_CACHE_KEY = "@secretburger:customer";
const CUSTOMER_CACHE_TTL = 3 * 60 * 60 * 1000;
const PRODUCTS_PER_PAGE = 8;

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

function formatMoney(value) {
  return `R$ ${Number(value || 0).toFixed(2)}`;
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
  const [visibleProducts, setVisibleProducts] = useState(PRODUCTS_PER_PAGE);
  const [visibleFinishedOrders, setVisibleFinishedOrders] = useState(5);

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

      setMyOrders(data || []);
      setVisibleFinishedOrders(5);
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

        await loadMenu();
      } catch (error) {
        setTableError(
          error.response?.data?.error ||
            "QR Code inválido ou restaurante fechado."
        );
      }
    }

    init();
  }, [numero, token]);

  useEffect(() => {
    setVisibleProducts(PRODUCTS_PER_PAGE);
  }, [activeCategory]);

  const categories = useMemo(() => {
    const unique = products
      .map((product) => product.category)
      .filter(Boolean)
      .reduce((acc, category) => {
        if (!acc.some((item) => item.slug === category.slug)) {
          acc.push(category);
        }

        return acc;
      }, []);

    return [{ name: "Todos", slug: "todos" }, ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "todos") return products;

    return products.filter(
      (product) => product.category?.slug === activeCategory
    );
  }, [products, activeCategory]);

  const productsToShow = filteredProducts.slice(0, visibleProducts);
  const hasMoreProducts = visibleProducts < filteredProducts.length;

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const activeMyOrders = myOrders.filter((order) =>
    ["recebido", "preparando", "pronto"].includes(order.status)
  );

  const finishedMyOrders = myOrders.filter((order) =>
    ["entregue", "cancelado"].includes(order.status)
  );

  const finishedOrdersToShow = finishedMyOrders.slice(0, visibleFinishedOrders);

  const hasMoreFinishedOrders = visibleFinishedOrders < finishedMyOrders.length;

  function addToCart(product) {
    setCart((currentCart) => {
      const exists = currentCart.find((item) => item.id === product.id);

      if (exists) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          quantity: 1,
        },
      ];
    });

    setCartOpen(true);
  }

  function decreaseItem(id) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function increaseItem(id) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  function removeItem(id) {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  }

  async function submitOrder() {
    if (!customer.name.trim() || !customer.phone.trim()) {
      alert("Informe seu nome e telefone.");
      return;
    }

    if (cart.length === 0) {
      alert("Seu carrinho está vazio.");
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
      setNotes("");
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao criar pedido.");
    } finally {
      setLoading(false);
    }
  }

  if (tableError) {
    return (
      <main className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-6">
        <section className="text-center max-w-md bg-white/[0.04] border border-white/10 rounded-[32px] p-8">
          <div className="text-6xl">🔒</div>
          <h1 className="text-3xl font-semibold mt-6">Acesso indisponível</h1>
          <p className="text-zinc-400 mt-3">{tableError}</p>
        </section>
      </main>
    );
  }

  if (!tableValid) {
    return (
      <main className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
        <p className="text-amber-400 tracking-[0.3em] uppercase text-sm">
          Carregando cardápio...
        </p>
      </main>
    );
  }

  if (successOrder) {
    return (
      <main className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-5">
        <section className="max-w-md w-full text-center bg-white/[0.04] border border-white/10 rounded-[36px] p-8">
          <div className="w-24 h-24 rounded-full bg-amber-400 text-black flex items-center justify-center text-5xl mx-auto shadow-[0_0_80px_rgba(251,191,36,.35)]">
            ✓
          </div>

          <h1 className="text-4xl font-semibold mt-8">Pedido recebido</h1>

          <p className="text-zinc-400 mt-3">
            Seu pedido foi enviado para a cozinha.
          </p>

          <div className="mt-7 grid gap-3">
            <button
              onClick={() => setSuccessOrder(null)}
              className="w-full bg-amber-400 text-black py-4 rounded-full font-semibold hover:bg-amber-300 transition"
            >
              Fazer outro pedido
            </button>

            <button
              onClick={() => {
                setSuccessOrder(null);
                loadMyOrders();
              }}
              className="w-full border border-white/10 text-white py-4 rounded-full font-semibold hover:border-amber-400/50 transition"
            >
              Ver meus pedidos
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!customerReady) {
    return (
      <main className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-5">
        <section className="w-full max-w-md bg-[#111] border border-white/10 rounded-[36px] p-6 shadow-2xl">
          <img
            src={logo}
            alt="The Secret Burger"
            className="h-20 object-contain"
          />

          <h1 className="text-3xl font-semibold mt-8">Antes de pedir</h1>

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
              className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-amber-400/60 transition"
            />

            <input
              value={customer.phone}
              onChange={(e) =>
                setCustomer({ ...customer, phone: e.target.value })
              }
              placeholder="Telefone"
              className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-amber-400/60 transition"
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
            className="mt-6 w-full bg-amber-400 text-black py-4 rounded-full font-semibold hover:bg-amber-300 transition"
          >
            Entrar no cardápio
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black pb-28">
      <section className="relative min-h-[460px] overflow-hidden text-white">
        <div className="absolute inset-0 bg-black" />

        <img
          src={heroBurger}
          alt="Burger"
          className="absolute inset-0 w-full h-full object-cover opacity-75"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/20" />

        <div className="relative max-w-7xl mx-auto px-5 py-7">
          <header className="flex items-center justify-between gap-4">
            <img
              src={logo}
              alt="The Secret Burger"
              className="h-20 md:h-24 w-auto object-contain"
            />

            <button
              onClick={loadMyOrders}
              className="flex items-center gap-3 bg-black/45 backdrop-blur-xl border border-white/10 rounded-full px-3 py-2 hover:border-amber-400/50 transition"
            >
              <div className="w-9 h-9 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold">
                {customer.name?.charAt(0)?.toUpperCase() || "C"}
              </div>

              <div className="hidden sm:block text-left leading-tight">
                <p className="text-sm font-semibold max-w-32 truncate">
                  {customer.name}
                </p>
                <p className="text-xs text-zinc-400">Meus pedidos</p>
              </div>
            </button>
          </header>

          <div className="mt-14 max-w-xl">
            <p className="text-amber-400 tracking-[0.45em] uppercase text-xs">
              Mesa {numero} • Cardápio digital
            </p>

            <p className="text-amber-400 tracking-[0.45em] uppercase text-xs mt-6">
              O hambúrguer
            </p>

            <h1 className="text-6xl md:text-8xl font-semibold leading-[0.85] mt-5">
              SECRETO
            </h1>

            <p className="text-2xl md:text-3xl text-amber-400 tracking-wide mt-5">
              que você nunca esquece!
            </p>

            <p className="text-zinc-300 mt-5 max-w-md leading-relaxed">
              Hambúrguer artesanal, ingredientes selecionados e uma experiência
              feita para pedir sem complicação.
            </p>
          </div>
        </div>
      </section>

      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-2xl border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-5">
          <div className="h-20 flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {categories.map((category) => {
              const active = activeCategory === category.slug;

              return (
                <button
                  key={category.slug}
                  onClick={() => setActiveCategory(category.slug)}
                  className={`shrink-0 px-5 py-3 rounded-full text-sm font-semibold border transition ${
                    active
                      ? "bg-amber-400 text-black border-amber-400 shadow-[0_10px_30px_rgba(251,191,36,.25)]"
                      : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <section id="menu" className="bg-[#f5f5f5] text-black">
        <div className="max-w-7xl mx-auto px-5 py-10">
          <div className="grid lg:grid-cols-[1fr_390px] gap-8 items-start">
            <div>
              <p className="text-amber-500 uppercase tracking-[0.3em] text-xs font-bold">
                {activeCategory === "todos"
                  ? "Cardápio"
                  : categories.find((c) => c.slug === activeCategory)?.name}
              </p>

              <div className="mt-2">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Escolha seu pedido
                </h2>

                <p className="text-zinc-500 mt-2">
                  {filteredProducts.length} produto(s) disponível(is)
                </p>
              </div>

              <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                {productsToShow.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={addToCart}
                  />
                ))}
              </div>

              {hasMoreProducts && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() =>
                      setVisibleProducts((prev) => prev + PRODUCTS_PER_PAGE)
                    }
                    className="px-8 py-4 rounded-full border border-zinc-300 bg-white text-black font-semibold hover:border-amber-400 hover:bg-amber-50 transition"
                  >
                    Ver mais produtos
                  </button>
                </div>
              )}
            </div>

            <aside className="hidden lg:block sticky top-28 bg-white text-black border border-zinc-200 rounded-[32px] p-5 shadow-[0_20px_80px_rgba(0,0,0,.08)]">
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
        </div>
      </section>

      {cart.length > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 left-5 right-5 md:left-1/2 md:-translate-x-1/2 md:w-[520px] z-40 bg-neutral-950 text-white border border-white/15 rounded-full px-5 py-4 flex items-center justify-between shadow-2xl hover:border-amber-400/50 transition"
        >
          <span className="flex items-center gap-3">
            <span className="relative text-2xl">
              🛒
              <span className="absolute -top-2 -right-3 bg-amber-400 text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            </span>

            <strong>{totalItems} item(ns)</strong>
          </span>

          <strong className="text-amber-400">{formatMoney(total)}</strong>
        </button>
      )}

      {cartOpen && (
        <Drawer onClose={() => setCartOpen(false)} title="Meu pedido">
          <CartContent
            cart={cart}
            total={total}
            increaseItem={increaseItem}
            decreaseItem={decreaseItem}
            removeItem={removeItem}
            onCheckout={() => setCheckoutOpen(true)}
          />
        </Drawer>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-end md:items-center justify-center p-4">
          <div className="bg-white text-black rounded-[32px] w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold">Finalizar pedido</h3>

              <button
                onClick={() => setCheckoutOpen(false)}
                className="w-10 h-10 rounded-full bg-zinc-100 text-2xl"
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
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-4 outline-none focus:border-amber-400 transition"
              />

              <input
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
                placeholder="Telefone"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-4 outline-none focus:border-amber-400 transition"
              />

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-4 outline-none min-h-24 focus:border-amber-400 transition"
              />
            </div>

            <button
              onClick={submitOrder}
              disabled={loading}
              className="mt-6 w-full bg-neutral-950 text-white py-4 rounded-full font-semibold disabled:opacity-50 hover:bg-black transition"
            >
              {loading
                ? "Enviando..."
                : `Enviar pedido • ${formatMoney(total)}`}
            </button>
          </div>
        </div>
      )}

      {myOrdersOpen && (
        <Drawer onClose={() => setMyOrdersOpen(false)} title="Meus pedidos">
          <div className="mb-6">
            <p className="text-zinc-500 text-sm">{customer.name}</p>
          </div>

          {myOrders.length === 0 ? (
            <div className="border border-zinc-200 rounded-3xl p-6 text-center">
              <p className="text-4xl">🧾</p>
              <p className="text-zinc-500 mt-3">Nenhum pedido encontrado.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <OrderGroup title="Em andamento" orders={activeMyOrders} />
              <div className="space-y-4">
                <OrderGroup
                  title="Finalizados"
                  orders={finishedMyOrders.slice(0, visibleFinishedOrders)}
                />

                {hasMoreFinishedOrders && (
                  <button
                    onClick={() =>
                      setVisibleFinishedOrders((prev) => prev + 5)
                    }
                    className="w-full py-4 rounded-2xl border border-zinc-200 bg-white text-zinc-700 font-semibold hover:bg-zinc-50 transition"
                  >
                    Ver mais pedidos finalizados
                  </button>
                )}
              </div>
            </div>
          )}
        </Drawer>
      )}
    </main>
  );
}

function ProductCard({ product, onAdd }) {
  return (
    <article className="group bg-white text-black rounded-[22px] overflow-hidden border border-zinc-200 hover:border-zinc-300 hover:shadow-[0_18px_50px_rgba(0,0,0,.10)] transition">
      <div className="flex gap-4 p-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold leading-tight line-clamp-2">
            {product.name}
          </h3>

          <p className="mt-2 text-sm text-zinc-500 line-clamp-2 min-h-10">
            {product.description || "Produto artesanal da casa."}
          </p>

          <p className="mt-4 text-xl font-extrabold text-black">
            {formatMoney(product.price)}
          </p>

          <button
            onClick={() => onAdd(product)}
            className="mt-4 bg-amber-400 text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-amber-300 active:scale-[0.98] transition"
          >
            Adicionar
          </button>
        </div>

        <div className="w-32 h-32 md:w-36 md:h-36 rounded-[18px] bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="text-5xl">🍔</div>
          )}
        </div>
      </div>
    </article>
  );
}

function Drawer({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex justify-end">
      <aside className="w-full max-w-lg bg-white text-black h-full p-6 overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold">{title}</h3>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-100 text-2xl"
          >
            ×
          </button>
        </div>

        {children}
      </aside>
    </div>
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
              className="flex gap-4 border-b border-zinc-200 pb-5"
            >
              <div className="w-20 h-20 rounded-2xl bg-zinc-100 overflow-hidden shrink-0">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-3xl">
                    🍔
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between gap-3">
                  <p className="font-semibold leading-tight">{item.name}</p>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-zinc-400"
                  >
                    🗑️
                  </button>
                </div>

                <p className="text-zinc-500 text-sm mt-1">
                  1x {formatMoney(item.price)}
                </p>

                <div className="mt-3 flex justify-between items-center">
                  <div className="flex border border-zinc-200 rounded-xl overflow-hidden bg-white text-black">
                    <button
                      onClick={() => decreaseItem(item.id)}
                      className="w-8 h-8 bg-zinc-50"
                    >
                      -
                    </button>

                    <span className="w-8 h-8 flex items-center justify-center">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => increaseItem(item.id)}
                      className="w-8 h-8 bg-zinc-50"
                    >
                      +
                    </button>
                  </div>

                  <p className="text-amber-500 font-semibold">
                    {formatMoney(Number(item.price) * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal</span>
              <span>{formatMoney(total)}</span>
            </div>

            <div className="flex justify-between text-xl mt-4">
              <strong>Total</strong>
              <strong className="text-amber-500">{formatMoney(total)}</strong>
            </div>

            <button
              onClick={onCheckout}
              className="mt-6 w-full bg-neutral-950 text-white py-4 rounded-full font-semibold hover:bg-black transition"
            >
              Finalizar pedido
            </button>
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
        <h4 className="text-sm uppercase tracking-[0.25em] text-zinc-400 mb-3">
          {title}
        </h4>

        <div className="border border-zinc-200 rounded-3xl p-5 text-zinc-500 text-sm">
          Nenhum pedido aqui.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h4 className="text-sm uppercase tracking-[0.25em] text-zinc-400 mb-3">
        {title}
      </h4>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-zinc-200 rounded-3xl p-5 bg-white"
          >
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold">Mesa {order.table_number}</p>

                <p className="text-xs text-zinc-500 mt-1">
                  {formatDateTime(order.created_at)}
                </p>

                <StatusPill status={order.status} />
              </div>

              <p className="text-amber-500 font-semibold">
                {formatMoney(order.total)}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {order.order_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm text-zinc-600 gap-3"
                >
                  <span>
                    {item.quantity}x {item.product_name}
                  </span>

                  <span>{formatMoney(item.subtotal)}</span>
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
    recebido: "bg-red-50 text-red-600 border-red-100",
    preparando: "bg-blue-50 text-blue-600 border-blue-100",
    pronto: "bg-emerald-50 text-emerald-600 border-emerald-100",
    entregue: "bg-green-50 text-green-600 border-green-100",
    cancelado: "bg-zinc-100 text-zinc-600 border-zinc-200",
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