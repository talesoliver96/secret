const supabase = require("../config/supabase");

exports.getPublicMenu = async (req, res) => {
  const { data, error } = await supabase
  .from("products")
  .select(`
    *,
    category:categories (
      id,
      name,
      slug,
      active,
      display_order
    )
  `)
  .eq("available", true)
  .order("display_order", { ascending: true })
  .order("name", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const visibleProducts = (data || [])
  .filter((product) => product.category?.active !== false)
  .sort((a, b) => {
    const categoryOrderA = a.category?.display_order || 0;
    const categoryOrderB = b.category?.display_order || 0;

    if (categoryOrderA !== categoryOrderB) {
      return categoryOrderA - categoryOrderB;
    }

    return (a.display_order || 0) - (b.display_order || 0);
  });

res.json(visibleProducts);

  return res.json(data);
};