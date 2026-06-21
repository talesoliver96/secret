import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../api/axios";
import PremiumPagination from "../../components/PremiumPagination";

const emptyForm = {
  name: "",
  slug: "",
  active: true,
  display_order: 0,
};

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
const itemsPerPage = 10;

  async function loadCategories() {
    const { data } = await api.get("/admin/categories");
    setCategories(data || []);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const term = search.toLowerCase();

    return categories.filter((category) => {
      return (
        !term ||
        category.name?.toLowerCase().includes(term) ||
        category.slug?.toLowerCase().includes(term)
      );
    });
  }, [categories, search]);

  const paginatedCategories = filteredCategories.slice(
  (page - 1) * itemsPerPage,
  page * itemsPerPage
);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  }

  function openEdit(category) {
    setEditing(category);
    setForm({
  name: category.name || "",
  slug: category.slug || "",
  active: category.active,
  display_order: category.display_order || 0,
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

    if (!form.name || !form.slug) {
      alert("Nome e slug são obrigatórios.");
      return;
    }

    if (editing) {
      await api.patch(`/admin/categories/${editing.id}`, form);
    } else {
      await api.post("/admin/categories", form);
    }

    closeDrawer();
    await loadCategories();
  }

  async function toggleCategory(category) {
    await api.patch(`/admin/categories/${category.id}`, {
      name: category.name,
      slug: category.slug,
      active: !category.active,
    });

    await loadCategories();
  }

  async function handleDelete(category) {
    if (!confirm(`Excluir categoria "${category.name}"?`)) return;

    try {
      await api.delete(`/admin/categories/${category.id}`);
      await loadCategories();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao excluir categoria.");
    }
  }

  useEffect(() => {
  setPage(1);
}, [search]);

  return (
    <AdminLayout
      title="Categorias"
      subtitle="Organize o cardápio por grupos como burgers, combos, bebidas e sobremesas."
    >
      <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Categorias</h3>
            <p className="text-sm text-slate-500">
              {filteredCategories.length} categoria(s) encontrada(s)
            </p>
          </div>

          <button
            onClick={openCreate}
            className="bg-slate-950 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-medium"
          >
            + Nova categoria
          </button>
        </div>

        <div className="p-5 border-b border-slate-100 bg-slate-50/60">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar categoria..."
            className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Ações
                </th>
                <th className="text-left px-5 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
  Ordem
</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedCategories.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
                        🏷️
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {category.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          Grupo do cardápio
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {category.slug}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
  {category.display_order || 0}
</td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                        category.active
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-red-50 text-red-700 border-red-100"
                      }`}
                    >
                      {category.active ? "Ativa" : "Inativa"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(category)}
                        className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100"
                        title="Editar"
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-9 h-9 rounded-xl border border-slate-200 hover:bg-slate-100"
                        title={category.active ? "Desativar" : "Ativar"}
                      >
                        {category.active ? "🙈" : "👁️"}
                      </button>

                      <button
                        onClick={() => handleDelete(category)}
                        className="w-9 h-9 rounded-xl border border-red-100 text-red-600 hover:bg-red-50"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-14 text-center">
                    <p className="text-slate-500">Nenhuma categoria encontrada.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PremiumPagination
  totalItems={filteredCategories.length}
  itemsPerPage={itemsPerPage}
  currentPage={page}
  onPageChange={setPage}
/>
        </div>
      </section>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col">
            <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  {editing ? "Edição de categoria" : "Cadastro de categoria"}
                </p>
                <h3 className="text-xl font-semibold">
                  {editing ? "Editar categoria" : "Nova categoria"}
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
                <Field label="Nome da categoria">
                  <input
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm({ ...form, name, slug: slugify(name) });
                    }}
                    placeholder="Ex: Burgers"
                    className="admin-input"
                  />
                </Field>

                <Field label="Slug">
                  <input
                    value={form.slug}
                    onChange={(e) =>
                      setForm({ ...form, slug: e.target.value })
                    }
                    placeholder="burgers"
                    className="admin-input"
                  />
                </Field>

                <Field label="Ordem de exibição">
  <input
    type="number"
    value={form.display_order}
    onChange={(e) =>
      setForm({ ...form, display_order: Number(e.target.value) })
    }
    placeholder="0"
    className="admin-input"
  />
</Field>

                <label className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div>
                    <p className="font-medium">Categoria ativa</p>
                    <p className="text-sm text-slate-500">
                      Categorias inativas podem ser ocultadas no cardápio.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.checked })
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-medium"
              >
                {editing ? "Salvar alterações" : "Criar categoria"}
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