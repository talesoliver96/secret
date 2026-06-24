const supabase = require("../config/supabase");

exports.createOrder = async (req, res) => {
  try {
    const { table_number, table_token, name, phone, items, notes } = req.body;

    if (!table_number || !name || !phone || !items || !items.length) {
      return res.status(400).json({
        error: "Mesa, nome, telefone e itens são obrigatórios."
      });
    }

    if (!table_token) {
  return res.status(400).json({
    error: "Token da mesa é obrigatório.",
  });
}

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
  });
}

const { data: table, error: tableError } = await supabase
  .from("restaurant_tables")
  .select("*")
  .eq("number", Number(table_number))
  .eq("token", table_token)
  .eq("active", true)
  .single();

if (tableError || !table) {
  return res.status(403).json({
    error: "Mesa inválida ou QR Code desativado.",
  });
}

    let { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", phone)
      .single();

    if (!customer) {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({ name, phone })
        .select()
        .single();

      if (customerError) {
        return res.status(500).json({ error: customerError.message });
      }

      customer = newCustomer;
    }

    const productIds = items.map((item) => item.product_id);

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds)
      .eq("available", true);

    if (productsError) {
      return res.status(500).json({ error: productsError.message });
    }

    let total = 0;

    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);

      if (!product) {
        throw new Error("Produto inválido ou indisponível.");
      }

      const quantity = Number(item.quantity || 1);
      const subtotal = Number(product.price) * quantity;
      total += subtotal;

      return {
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: product.price,
        subtotal,
        notes: item.notes || null
      };
    });

    const { data: order, error: orderError } = await supabase
  .from("orders")
  .insert({
    customer_id: customer.id,
    table_id: table.id,
    table_number,
    status: "recebido",
    total,
    notes: notes || null
  })
  .select()
  .single();
    if (orderError) {
      return res.status(500).json({ error: orderError.message });
    }

    const itemsToInsert = orderItems.map((item) => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      return res.status(500).json({ error: itemsError.message });
    }

    return res.status(201).json({
      message: "Pedido criado com sucesso.",
      order_id: order.id,
      status: order.status,
      total
    });
  } catch (err) {
    return res.status(400).json({
      error: err.message
    });
  }
};

exports.getCustomerOrdersByPhone = async (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ error: "Telefone é obrigatório." });
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, name, phone")
    .eq("phone", phone)
    .single();

  if (customerError || !customer) {
    return res.json([]);
  }

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        product_name,
        quantity,
        unit_price,
        subtotal
      )
    `)
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });

  res.json(data || []);
};