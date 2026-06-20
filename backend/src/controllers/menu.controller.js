const supabase = require("../config/supabase");

exports.getPublicMenu = async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      price,
      image_url,
      category:categories (
        id,
        name,
        slug
      )
    `)
    .eq("available", true)
    .order("name");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(data);
};