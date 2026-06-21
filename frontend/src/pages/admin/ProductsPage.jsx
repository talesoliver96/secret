import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../api/axios";
import PremiumPagination from "../../components/PremiumPagination";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  image_url: "",
  category_id: "",
  available: true,
};

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [availabilityFilter, setAvailabilityFilter] = useState("todos");
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
const itemsPerPage = 10;

  async function loadData() {
    const [productsResponse, categoriesResponse] = await Promise.all([
      api.get("/admin/products"),
      api.get("/admin/categories"),
    ]);

    setProducts(productsResponse.data || []);
    setCategories(categoriesResponse.data || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const term = search.toLowerCase();

      const matchSearch =
        !term ||
        product.name?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.category?.name?.toLowerCase().includes(term);

      const matchCategory =
        categoryFilter === "todos" || product.category_id === categoryFilter;

      const matchAvailability =
        availabilityFilter === "todos" ||
        (availabilityFilter === "disponivel" && product.available) ||
        (availabilityFilter === "indisponivel" && !product.available);

      return matchSearch && matchCategory && matchAvailability;
    });
  }, [products, search, categoryFilter, availabilityFilter]);

  const paginatedProducts = filteredProducts.slice(
  (page - 1) * itemsPerPage,
  page * itemsPerPage
);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      image_url: product.image_url || "",
      category_id: product.category_id || "",
      available: product.available,
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setEditing(null);
    setForm(emptyForm);
    setDrawerOpen(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name || !form.category_id || !form.price) {
      alert("Nome, categoria e preço são obrigatórios.");
      return;
    }

    setLoading(true);

    const payload = {
      ...form,
      price: Number(String(form.price).replace(",", ".")),
    };

    try {
      if (editing) {
        await api.patch(`/admin/products/${editing.id}`, payload);
      } else {
        await api.post("/admin/products", payload);
      }

      closeDrawer();
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao salvar produto.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleProduct(product) {
    await api.patch(`/admin/products/${product.id}`, {
      category_id: product.category_id,
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      available: !product.available,
    });

    await loadData();
  }

  async function handleDelete(product) {
    if (!confirm(`Excluir produto "${product.name}"?`)) return;

    try {
      await api.delete(`/admin/products/${product.id}`);
      await loadData();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao excluir produto.");
    }
  }

  useEffect(() => {
  setPage(1);
}, [search, categoryFilter, availabilityFilter]);

  return (
    <AdminLayout
      title="Cardápio"
      subtitle="Gerencie produtos, preços, categorias, disponibilidade e imagens do cardápio."
    >
      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Produtos</h3>
            <p className="text-sm text-slate-500">
              {filteredProducts.length} produto(s) encontrado(s)
            </p>
          </div>

          <button
            onClick={openCreate}
            className="bg-slate-950 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-medium"
          >
            + Novo produto
          </button>
        </div>

        <div className="p-5 border-b border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-3 bg-slate-50/60">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            <option value="todos">Todas categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            <option value="todos">Todos status</option>
            <option value="disponivel">Disponível</option>
            <option value="indisponivel">Indisponível</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Preço
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
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">🍔</span>
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-slate-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-slate-500 line-clamp-1 max-w-md">
                          {product.description || "Sem descrição"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {product.category?.name || "Sem categoria"}
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-slate-900">
                    {money(product.price)}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                        product.available
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-red-50 text-red-700 border-red-100"
                      }`}
                    >
                      {product.available ? "Disponível" : "Indisponível"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100"
                        title="Editar"
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() => toggleProduct(product)}
                        className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100"
                        title={product.available ? "Desativar" : "Ativar"}
                      >
                        {product.available ? "🙈" : "👁️"}
                      </button>

                      <button
                        onClick={() => handleDelete(product)}
                        className="w-9 h-9 rounded-xl border border-red-100 text-red-600 hover:bg-red-50"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-14 text-center">
                    <p className="text-slate-500">Nenhum produto encontrado.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PremiumPagination
  totalItems={filteredProducts.length}
  itemsPerPage={itemsPerPage}
  currentPage={page}
  onPageChange={setPage}
/>
        </div>
      </section>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col">
            <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  {editing ? "Edição de produto" : "Cadastro de produto"}
                </p>
                <h3 className="text-xl font-semibold">
                  {editing ? "Editar produto" : "Novo produto"}
                </h3>
              </div>

              <button
                onClick={closeDrawer}
                className="w-10 h-10 rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                <Field label="Nome do produto">
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Secret Burger"
                    className="admin-input"
                  />
                </Field>

                <Field label="Descrição">
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Descrição curta do produto"
                    className="admin-input min-h-28"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Preço">
                    <input
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                      placeholder="29.90"
                      className="admin-input"
                    />
                  </Field>

                  <Field label="Categoria">
                    <select
                      value={form.category_id}
                      onChange={(e) =>
                        setForm({ ...form, category_id: e.target.value })
                      }
                      className="admin-input"
                    >
                      <option value="">Selecione</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="URL da imagem">
                  <input
                    value={form.image_url}
                    onChange={(e) =>
                      setForm({ ...form, image_url: e.target.value })
                    }
                    placeholder="https://..."
                    className="admin-input"
                  />
                </Field>

                {form.image_url && (
                  <div className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={form.image_url}
                      alt="Prévia"
                      className="w-full h-52 object-cover"
                    />
                  </div>
                )}

                <label className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div>
                    <p className="font-medium">Disponível no cardápio</p>
                    <p className="text-sm text-slate-500">
                      Produtos indisponíveis não aparecem para o cliente.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={(e) =>
                      setForm({ ...form, available: e.target.checked })
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
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-medium disabled:opacity-50"
              >
                {loading
                  ? "Salvando..."
                  : editing
                  ? "Salvar alterações"
                  : "Criar produto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
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