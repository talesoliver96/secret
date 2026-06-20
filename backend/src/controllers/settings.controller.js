const supabase = require("../config/supabase");

function generateToken() {
  return Math.random().toString(36).substring(2, 14) + Date.now().toString(36);
}

exports.getSettings = async (req, res) => {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};

exports.updateSettings = async (req, res) => {
  const { restaurant_open } = req.body;

  const { data: currentSettings } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from("settings")
    .update({
      restaurant_open,
    })
    .eq("id", currentSettings.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};

exports.getAdminTables = async (req, res) => {
  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("*")
    .order("number", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};

exports.createTable = async (req, res) => {
  const { number, name } = req.body;

  if (!number) {
    return res.status(400).json({
      error: "Número da mesa é obrigatório.",
    });
  }

  const token = generateToken();

  const { data, error } = await supabase
    .from("restaurant_tables")
    .insert({
      number,
      name: name || `Mesa ${number}`,
      token,
      active: true,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
};

exports.updateTable = async (req, res) => {
  const { id } = req.params;
  const { number, name, active } = req.body;

  const { data, error } = await supabase
    .from("restaurant_tables")
    .update({
      number,
      name,
      active,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};

exports.regenerateTableToken = async (req, res) => {
  const { id } = req.params;

  const token = generateToken();

  const { data, error } = await supabase
    .from("restaurant_tables")
    .update({ token })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};

exports.validatePublicTable = async (req, res) => {
  const { number, token } = req.params;

  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  if (settingsError) {
    return res.status(500).json({ error: settingsError.message });
  }

  if (!settings.restaurant_open) {
    return res.status(403).json({
      error: "Restaurante fechado no momento.",
      restaurant_open: false,
    });
  }

  const { data: table, error: tableError } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("number", Number(number))
    .eq("token", token)
    .eq("active", true)
    .single();

  if (tableError || !table) {
    return res.status(404).json({
      error: "Mesa inválida ou QR Code desativado.",
    });
  }

  res.json({
    restaurant_open: true,
    table,
  });
};