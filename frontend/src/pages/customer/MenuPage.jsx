import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";
import logo from "../../assets/logo.png";

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
  

  async function loadMenu() {
    const { data } = await api.get("/menu");
    setProducts(data || []);
  }

  useEffect(() => {
    async function init() {
      try {
        await api.get(`/public/table/${numero}/${token}`);
        setTableValid(true);
        loadMenu();
      } catch (error) {
        setTableError(error.response?.data?.error || "QR Code inválido ou restaurante fechado.");
      }
    }

    init();
  }, [numero, token]);

  const categories = useMemo(() => {
    const unique = products
      .map((p) => p.category)
      .filter(Boolean)
      .reduce((acc, cat) => {
        if (!acc.find((item) => item.slug === cat.slug)) acc.push(cat);
        return acc;
      }, []);

    return [{ name: "Burgers", slug: "todos", icon: "🍔" }, ...unique.map((c) => ({ ...c, icon: "✦" }))];
  }, [products]);

  const filteredProducts =
    activeCategory === "todos"
      ? products
      : products.filter((p) => p.category?.slug === activeCategory);

  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const heroImage =
    products.find((p) => p.image_url)?.image_url ||
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1400&auto=format&fit=crop";

  function addToCart(product) {
    const exists = cart.find((item) => item.id === product.id);

    if (exists) {
      setCart(cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
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
    setCart(cart.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity - 1 } : item
    ).filter((item) => item.quantity > 0));
  }

  function increaseItem(id) {
    setCart(cart.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
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
        <p className="text-amber-400 tracking-[0.3em] uppercase">Carregando cardápio...</p>
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
          <p className="text-zinc-400 mt-3">Seu pedido foi enviado para a cozinha.</p>
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

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <section className="relative min-h-[560px] overflow-hidden">
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
              que você nunca esquece
            </p>

    
          </div>
        </div>
      </section>

      <nav className="sticky top-0 z-30 bg-black/85 backdrop-blur-2xl border-y border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center gap-4 overflow-x-auto">
          <div className="hidden md:block mr-6 leading-none">
            <p className="font-semibold">THE SECRET</p>
            <p className="font-semibold text-amber-400">BURGER.</p>
          </div>

          {categories.map((category) => (
            <button
              key={category.slug}
              onClick={() => setActiveCategory(category.slug)}
              className={`min-w-24 px-5 py-4 rounded-2xl text-sm transition border ${
                activeCategory === category.slug
                  ? "bg-white/10 border-white/10 text-amber-400"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <div className="text-xl mb-1">{category.icon}</div>
              {category.name}
            </button>
          ))}

          {cart.length > 0 && (
            <button
              onClick={() => setCartOpen(true)}
              className="ml-auto hidden lg:flex items-center gap-3 border border-amber-400/40 rounded-full px-6 py-3"
            >
              <span className="relative">
                🛒
                <span className="absolute -top-3 -right-3 bg-amber-400 text-black text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              </span>
              R$ {total.toFixed(2)}
            </button>
          )}
        </div>
      </nav>

      <section id="menu" className="max-w-7xl mx-auto px-5 py-12">
        <div className="grid lg:grid-cols-[1fr_440px] gap-10 items-start">
          <div>
            <p className="text-amber-400 uppercase tracking-[0.3em] text-sm">
              {activeCategory === "todos" ? "Burgers" : categories.find((c) => c.slug === activeCategory)?.name}
            </p>
            <h2 className="text-4xl font-semibold mt-2">Feitos para quem leva o sabor a sério.</h2>

            <div className="mt-8 space-y-4">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="bg-[#111] border border-white/10 rounded-[24px] overflow-hidden hover:border-amber-400/40 transition"
                >
                  <div className="grid sm:grid-cols-[220px_1fr_80px]">
                    <div className="h-48 sm:h-full bg-zinc-900">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-7xl">🍔</div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-2xl font-semibold">{product.name}</h3>
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

          <aside className="hidden lg:block sticky top-28 bg-[#111] border border-white/10 rounded-[32px] p-6">
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
              <button onClick={() => setCartOpen(false)} className="text-2xl">×</button>
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
              <button onClick={() => setCheckoutOpen(false)} className="text-2xl">×</button>
            </div>

            <div className="mt-6 space-y-3">
              <input
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                placeholder="Seu nome"
                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-4 outline-none"
              />
              <input
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
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
              {loading ? "Enviando..." : `Enviar pedido • R$ ${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function CartContent({ cart, total, increaseItem, decreaseItem, removeItem, onCheckout }) {
  return (
    <>
      <h3 className="text-2xl font-semibold hidden lg:block">Meu pedido</h3>

      {cart.length === 0 ? (
        <div className="py-16 text-center text-zinc-500">Seu carrinho está vazio.</div>
      ) : (
        <div className="mt-6 space-y-5">
          {cart.map((item) => (
            <div key={item.id} className="flex gap-4 border-b border-white/10 pb-5">
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center text-3xl">🍔</div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="font-semibold">{item.name}</p>
                  <button onClick={() => removeItem(item.id)} className="text-zinc-500">🗑️</button>
                </div>

                <p className="text-zinc-500 text-sm">1x R$ {Number(item.price).toFixed(2)}</p>

                <div className="mt-3 flex justify-between items-center">
                  <div className="flex border border-white/10 rounded-xl overflow-hidden">
                    <button onClick={() => decreaseItem(item.id)} className="w-8 h-8 bg-white/5">-</button>
                    <span className="w-8 h-8 flex items-center justify-center">{item.quantity}</span>
                    <button onClick={() => increaseItem(item.id)} className="w-8 h-8 bg-white/5">+</button>
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
              <strong className="text-amber-400">R$ {total.toFixed(2)}</strong>
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

function Feature({ icon, title, subtitle }) {
  return (
    <div className="text-center">
      <p className="text-2xl text-amber-400">{icon}</p>
      <p className="mt-2 text-sm font-semibold uppercase">{title}</p>
      <p className="text-xs text-zinc-500 uppercase">{subtitle}</p>
    </div>
  );
}