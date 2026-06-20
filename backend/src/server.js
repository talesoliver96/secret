const express = require("express");
const cors = require("cors");
require("dotenv").config();


const settingsController = require("./controllers/settings.controller");

const testRoutes = require("./routes/test.routes");
const menuRoutes = require("./routes/menu.routes");
const ordersRoutes = require("./routes/orders.routes");
const adminRoutes = require("./routes/admin.routes");
const settingsRoutes = require("./routes/settings.routes");

const authRoutes = require("./routes/auth.routes");
const authMiddleware = require("./middlewares/auth.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", testRoutes);
app.use("/api", menuRoutes);
app.use("/api", ordersRoutes);

app.use("/api", authRoutes);

// rota pública de validação da mesa
app.get(
  "/api/public/table/:number/:token",
  settingsController.validatePublicTable
);

// admin protegido
app.use("/api", authMiddleware, adminRoutes);
app.use("/api", authMiddleware, settingsRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "The Secret Burger API online"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});