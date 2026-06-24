const supabase = require("../config/supabase");

const ACTIVE_STATUSES = ["recebido", "preparando", "pronto"];

function getPagination(req) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { page, limit, from, to };
}

function buildPagination(page, limit, count) {
  return {
    page,
    limit,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

exports.getOrders = async (req, res) => {
  const { page, limit, from, to } = getPagination(req);
  const { status, search } = req.query;

  let query = supabase
    .from("orders")
    .select(`
      *,
      customers (
        id,
        name,
        phone
      ),
      order_items (
        id,
        product_name,
        quantity,
        unit_price,
        subtotal,
        notes
      )
    `, { count: "exact" })
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false });

  if (status && status !== "todos") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(
      `table_number.eq.${Number(search) || 0},customers.name.ilike.%${search}%,customers.phone.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    data,
    pagination: buildPagination(page, limit, count),
  });
};

exports.getHistory = async (req, res) => {
  const { page, limit, from, to } = getPagination(req);

  const {
    search,
    status,
    payment_status,
    table_number,
    date_from,
    date_to,
    min_total,
    max_total,
  } = req.query;

  let customerIds = [];
  let productOrderIds = [];

  if (search) {
    const term = search.trim();

    const { data: matchedCustomers, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .or(`name.ilike.%${term}%,phone.ilike.%${term}%`);

    if (customerError) {
      return res.status(500).json({ error: customerError.message });
    }

    customerIds = (matchedCustomers || []).map((customer) => customer.id);

    const { data: matchedItems, error: itemsError } = await supabase
      .from("order_items")
      .select("order_id")
      .ilike("product_name", `%${term}%`);

    if (itemsError) {
      return res.status(500).json({ error: itemsError.message });
    }

    productOrderIds = [
      ...new Set((matchedItems || []).map((item) => item.order_id)),
    ];

    if (customerIds.length === 0 && productOrderIds.length === 0) {
      return res.json({
        data: [],
        pagination: buildPagination(page, limit, 0),
      });
    }
  }

  let query = supabase
    .from("orders")
    .select(
      `
      *,
      customers (
        id,
        name,
        phone
      ),
      order_items (
        id,
        product_name,
        quantity,
        unit_price,
        subtotal,
        notes
      )
    `,
      { count: "exact" }
    )
    .not("status", "in", `(${ACTIVE_STATUSES.join(",")})`)
    .order("created_at", { ascending: false });

  if (search) {
    const orFilters = [];

    if (customerIds.length > 0) {
      orFilters.push(`customer_id.in.(${customerIds.join(",")})`);
    }

    if (productOrderIds.length > 0) {
      orFilters.push(`id.in.(${productOrderIds.join(",")})`);
    }

    query = query.or(orFilters.join(","));
  }

  if (status && status !== "todos") {
    query = query.eq("status", status);
  }

  if (payment_status && payment_status !== "todos") {
    query = query.eq("payment_status", payment_status);
  }

  if (table_number) {
    query = query.eq("table_number", Number(table_number));
  }

  if (date_from) {
    query = query.gte("created_at", `${date_from}T00:00:00`);
  }

  if (date_to) {
    query = query.lte("created_at", `${date_to}T23:59:59`);
  }

  if (min_total) {
    query = query.gte("total", Number(min_total));
  }

  if (max_total) {
    query = query.lte("total", Number(max_total));
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    data: data || [],
    pagination: buildPagination(page, limit, count),
  });
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatus = [
    "recebido",
    "preparando",
    "pronto",
    "entregue",
    "cancelado",
  ];

  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ error: "Status inválido." });
  }

  const payload = {
    status,
    updated_at: new Date(),
  };

  if (status === "cancelado") {
    payload.payment_status = "cancelado";
    payload.canceled_at = new Date();
  }

  const { data, error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
};

exports.cancelOrder = async (req, res) => {
  const { id } = req.params;
  const { cancel_reason } = req.body;

  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "cancelado",
      payment_status: "cancelado",
      cancel_reason: cancel_reason || "Cancelado pelo admin",
      canceled_at: new Date(),
      updated_at: new Date(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
};

exports.getOpenTables = async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      customers (
        id,
        name,
        phone
      ),
      order_items (
        id,
        product_name,
        quantity,
        unit_price,
        subtotal,
        notes
      )
    `)
    .eq("status", "entregue")
    .in("payment_status", ["pendente", "fechado"])
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const tablesMap = {};

  data.forEach((order) => {
    const tableNumber = order.table_number;

    if (!tablesMap[tableNumber]) {
      tablesMap[tableNumber] = {
        table_number: tableNumber,
        orders: [],
        total: 0,
        customers: [],
        payment_status: "pendente",
      };
    }

    tablesMap[tableNumber].orders.push(order);
    tablesMap[tableNumber].total += Number(order.total || 0);

    if (order.payment_status === "fechado") {
      tablesMap[tableNumber].payment_status = "fechado";
    }

    const customerName = order.customers?.name;

    if (customerName && !tablesMap[tableNumber].customers.includes(customerName)) {
      tablesMap[tableNumber].customers.push(customerName);
    }
  });

  res.json(Object.values(tablesMap));
};

exports.closeTable = async (req, res) => {
  const { tableNumber } = req.params;

  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "fechado",
      closed_at: new Date(),
      updated_at: new Date(),
    })
    .eq("table_number", Number(tableNumber))
    .eq("status", "entregue")
    .eq("payment_status", "pendente")
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    message: "Mesa fechada para cobrança.",
    orders: data,
  });
};

exports.payTable = async (req, res) => {
  const { tableNumber } = req.params;
  const { payment_method } = req.body;

  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "pago",
      payment_method: payment_method || "não informado",
      paid_at: new Date(),
      updated_at: new Date(),
    })
    .eq("table_number", Number(tableNumber))
    .eq("status", "entregue")
    .in("payment_status", ["pendente", "fechado"])
    .select();

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    message: "Mesa marcada como paga.",
    orders: data,
  });
};