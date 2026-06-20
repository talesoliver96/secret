import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";

export default function MenuPage() {
  const { numero, token } = useParams();

  const [tableValid, setTableValid] = useState(false);
  const [tableError, setTableError] = useState("");

  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("todos");
  const [cart, setCart] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  async function loadMenu() {
    const response = await api.get("/menu");
    setProducts(response.data);
  }

  useEffect(() => {
  async function init() {
    try {
      await api.get(`/public/table/${numero}/${token}`);
      setTableValid(true);
      loadMenu();
    } catch (error) {
      setTableError(
        error.response?.data?.error || "QR Code inválido ou restaurante fechado."
      );
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

    return [{ name: "Todos", slug: "todos" }, ...unique];
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
          quantity: 1,
        },
      ]);
    }

    setDrawerOpen(true);
  }

  function decreaseItem(productId) {
    setCart(
      cart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function increaseItem(productId) {
    setCart(
      cart.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  async function submitOrder() {
    if (!customer.name.trim() || !customer.phone.trim()) {
      alert("Informe seu nome e telefone.");
      return;
    }

    if (cart.length === 0) {
      alert("Adicione pelo menos um item.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/orders", {
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

      setSuccessOrder(response.data);
      setCart([]);
      setDrawerOpen(false);
      setCustomer({ name: "", phone: "" });
      setNotes("");
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao criar pedido.");
    } finally {
      setLoading(false);
    }
  }

  if (successOrder) {
    return (
      <main className="min-h-screen bg-[#070707] text-white px-5 py-10">
        <section className="max-w-md mx-auto text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-amber-400 text-black flex items-center justify-center text-5xl shadow-[0_0_60px_rgba(251,191,36,0.35)]">
            ✓
          </div>

          <p className="mt-8 text-amber-400 uppercase tracking-[0.35em] text-xs">
            The Secret Burger
          </p>

          <h1 className="text-4xl font-black mt-3">Pedido recebido</h1>

          <p className="text-zinc-400 mt-3">
            A cozinha já recebeu seu pedido. Agora é só aguardar.
          </p>

          <div className="mt-8 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 text-left">
            <p className="text-sm text-zinc-500">Mesa</p>
            <p className="text-xl font-bold">#{numero}</p>

            <p className="text-sm text-zinc-500 mt-5">Status</p>
            <p className="text-amber-400 font-bold uppercase">
              {successOrder.status}
            </p>

            <p className="text-sm text-zinc-500 mt-5">Total</p>
            <p className="text-3xl font-black">
              R$ {Number(successOrder.total).toFixed(2)}
            </p>
          </div>

          <button
            onClick={() => setSuccessOrder(null)}
            className="mt-8 w-full bg-amber-400 text-black py-4 rounded-2xl font-black"
          >
            Fazer outro pedido
          </button>
        </section>
      </main>
    );
  }

  if (tableError) {
  return (
    <main className="min-h-screen bg-[#070707] text-white px-5 py-10 flex items-center">
      <section className="max-w-md mx-auto text-center">
        <div className="text-6xl">🔒</div>
        <h1 className="text-3xl font-black mt-6">Acesso indisponível</h1>
        <p className="text-zinc-400 mt-3">{tableError}</p>
      </section>
    </main>
  );
}

if (!tableValid) {
  return (
    <main className="min-h-screen bg-[#070707] text-white px-5 py-10 flex items-center">
      <section className="max-w-md mx-auto text-center">
        <p className="text-amber-400 font-black">Carregando cardápio...</p>
      </section>
    </main>
  );
}

  return (
    <main className="min-h-screen bg-[#070707] text-white pb-32">
      <section className="relative overflow-hidden px-5 pt-8 pb-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.22),transparent_45%)]" />

        <div className="relative max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-400 text-xs tracking-[0.35em] uppercase">
                Mesa #{numero}
              </p>
              <h1 className="text-4xl font-black mt-3 leading-none">
                The Secret
                <br />
                Burger
              </h1>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black text-2xl shadow-[0_0_40px_rgba(251,191,36,0.35)]">
              SB
            </div>
          </div>

          <p className="mt-5 text-zinc-400 text-sm leading-relaxed">
            Burgers artesanais, combos e sobremesas direto da sua mesa.
          </p>

          <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.slug}
                onClick={() => setActiveCategory(category.slug)}
                className={`px-5 py-3 rounded-full whitespace-nowrap text-sm font-bold border ${
                  activeCategory === category.slug
                    ? "bg-amber-400 text-black border-amber-400"
                    : "bg-zinc-900 text-zinc-300 border-zinc-800"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-md mx-auto px-5 space-y-5">
        {filteredProducts.map((product) => (
          <article
            key={product.id}
            className="rounded-[28px] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl"
          >
            <div className="h-40 bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center">
              <span className="text-6xl">🍔</span>
            </div>

            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-400">
                {product.category?.name}
              </p>

              <h2 className="text-2xl font-black mt-2">{product.name}</h2>

              <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                {product.description}
              </p>

              <div className="flex items-center justify-between mt-5">
                <strong className="text-2xl text-amber-400">
                  R$ {Number(product.price).toFixed(2)}
                </strong>

                <button
                  onClick={() => addToCart(product)}
                  className="bg-white text-black px-5 py-3 rounded-2xl font-black"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {cart.length > 0 && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="fixed bottom-5 left-5 right-5 max-w-md mx-auto bg-amber-400 text-black py-4 rounded-2xl font-black shadow-[0_0_50px_rgba(251,191,36,0.35)]"
        >
          🛒 {totalItems} itens • R$ {total.toFixed(2)}
        </button>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
          <div className="bg-zinc-950 border-t border-zinc-800 rounded-t-[32px] p-5 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Seu pedido</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-zinc-400 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
                >
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm text-zinc-400">
                      R$ {Number(item.price).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => decreaseItem(item.id)}
                      className="w-9 h-9 rounded-full bg-zinc-800"
                    >
                      -
                    </button>
                    <span className="font-bold">{item.quantity}</span>
                    <button
                      onClick={() => increaseItem(item.id)}
                      className="w-9 h-9 rounded-full bg-zinc-800"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              <input
                placeholder="Seu nome"
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 outline-none"
              />

              <input
                placeholder="Telefone"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 outline-none"
              />

              <textarea
                placeholder="Observações do pedido"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 outline-none min-h-24"
              />
            </div>

            <button
              onClick={submitOrder}
              disabled={loading}
              className="mt-5 w-full bg-amber-400 text-black py-4 rounded-2xl font-black disabled:opacity-60"
            >
              {loading ? "Enviando..." : `Finalizar • R$ ${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}