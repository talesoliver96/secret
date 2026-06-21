const supabase = require("../config/supabase");

exports.getCategories = async (req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true })
.order("name", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
};

exports.createCategory = async (req, res) => {
  const { name, slug, active = true, display_order = 0 } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: "Nome e slug são obrigatórios." });
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, slug, active, display_order })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json(data);
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, active, display_order } = req.body;

  const { data, error } = await supabase
    .from("categories")
    .update({ name, slug, active, display_order })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);

  if (count > 0) {
    return res.status(400).json({
      error: "Não é possível excluir categoria com produtos vinculados.",
    });
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Categoria excluída." });
};

exports.getProducts = async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories (
        id,
        name,
        slug
      )
    `)
    .order("display_order", { ascending: true })
.order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
};

exports.createProduct = async (req, res) => {
  const {
    category_id,
    name,
    description,
    price,
    image_url,
    available = true,
    display_order = 0,
  } = req.body;

  if (!category_id || !name || !price) {
    return res.status(400).json({
      error: "Categoria, nome e preço são obrigatórios.",
    });
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      category_id,
      name,
      description,
      price,
      image_url,
      available,
      display_order,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json(data);
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;

  const {
    category_id,
    name,
    description,
    price,
    image_url,
    available,
    display_order,
  } = req.body;

  const { data, error } = await supabase
    .from("products")
    .update({
      category_id,
      name,
      description,
      price,
      image_url,
      available,
      display_order,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  const { count } = await supabase
    .from("order_items")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id);

  if (count > 0) {
    return res.status(400).json({
      error: "Não é possível excluir produto que já possui pedidos. Desative-o.",
    });
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Produto excluído." });
};