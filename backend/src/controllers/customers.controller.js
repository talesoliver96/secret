const supabase = require("../config/supabase");

exports.getCustomers = async (req, res) => {
  const search = req.query.search || "";

  let query = supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data: customers, error } = await query;

  if (error) return res.status(500).json({ error: error.message });

  const customerIds = customers.map((customer) => customer.id);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, customer_id, total, payment_status, created_at")
    .in("customer_id", customerIds.length ? customerIds : ["00000000-0000-0000-0000-000000000000"]);

  const result = customers.map((customer) => {
    const customerOrders = orders?.filter(
      (order) => order.customer_id === customer.id
    ) || [];

    const paidOrders = customerOrders.filter(
      (order) => order.payment_status === "pago"
    );

    const totalSpent = paidOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    return {
      ...customer,
      orders_count: customerOrders.length,
      paid_orders_count: paidOrders.length,
      total_spent: totalSpent,
      last_order_at: customerOrders[0]?.created_at || null,
    };
  });

  res.json(result);
};

exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;

  const { data, error } = await supabase
    .from("customers")
    .update({ name, phone })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
};

exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;

  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", id);

  if (count > 0) {
    return res.status(400).json({
      error: "Não é possível excluir cliente com pedidos vinculados.",
    });
  }

  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Cliente excluído." });
};

exports.getCustomerOrders = async (req, res) => {
  const { id } = req.params;

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
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
};