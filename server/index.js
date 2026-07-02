const express = require("express");
const pool = require("./src/config/db");
const cors = require("cors");
const passport = require("passport");
require("dotenv").config();

const app = express();

const allowedOrigins = process.env.FRONTEND_URL.split(",");

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "userid"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.raw({ type: "application/json" }));
app.use(passport.initialize());

// ROUTES
const paymentRoutes = require("./src/router/payment.routes");
//const userRoutes = require("./src/router/users.routes");
const googleRoutes = require("./src/router/google.routes");
const loginRoutes = require("./src/auth/login");
const signupRoutes = require("./src/auth/singup");
const categoriesRoutes = require("./src/router/categories.routes");
const productRoutes = require("./src/router/products.routes");
const brandRoutes = require("./src/router/brands.routes");
const cartRoutes = require("./src/router/cart.routes");
const couponsRoutes = require("./src/router/coupons.routes");
const ordersRoutes = require("./src/router/order.routes");
const adminRoutes = require("./src/router/admin.routes");
const storeRoutes = require("./src/router/store.routes");
const stockEntryRoutes = require("./src/router/entries.routes");
const exitRoutes = require("./src/router/exit.routes");
const partiesRoutes = require("./src/router/users.routes");

app.use("/api/parties", partiesRoutes);
app.use("/api", exitRoutes);
app.use("/api", stockEntryRoutes);
app.use("/api/store-settings", storeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/coupons", couponsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/products", productRoutes);
app.use("/api/payment", paymentRoutes);
//app.use("/api/users", userRoutes);
app.use("/api/auth", loginRoutes);
app.use("/api/auth", googleRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/auth", signupRoutes);

app.use("/uploads", express.static("uploads"));

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "DB Connected Successfully",
      time: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
