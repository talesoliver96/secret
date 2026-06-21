const supabase = require("../config/supabase");

function validatePassword(password) {
  return password === process.env.MASTER_RESET_PASSWORD;
}

exports.resetOrders = async (req, res) => {
  const { password } = req.body;

  if (!validatePassword(password)) {
    return res.status(401).json({
      error: "Senha master inválida.",
    });
  }

  try {
    await supabase
      .from("order_items")
      .delete()
      .neq("id", 0);

    await supabase
      .from("orders")
      .delete()
      .neq("id", 0);

    await supabase
      .from("customers")
      .delete()
      .neq("id", 0);

    return res.json({
      success: true,
      message: "Pedidos e clientes removidos.",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

exports.resetAll = async (req, res) => {
  const { password } = req.body;

  if (!validatePassword(password)) {
    return res.status(401).json({
      error: "Senha master inválida.",
    });
  }

  try {
    await supabase
      .from("order_items")
      .delete()
      .neq("id", 0);

    await supabase
      .from("orders")
      .delete()
      .neq("id", 0);

    await supabase
      .from("customers")
      .delete()
      .neq("id", 0);

    await supabase
      .from("products")
      .delete()
      .neq("id", 0);

    await supabase
      .from("categories")
      .delete()
      .neq("id", 0);

    await supabase
      .from("restaurant_tables")
      .delete()
      .neq("id", 0);

    return res.json({
      success: true,
      message: "Banco resetado completamente.",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};