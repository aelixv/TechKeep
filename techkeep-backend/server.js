const express = require("express");
const connectDB = require("./config/db");

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

app.put("/test-put", (req, res) => {
  res.json({
    message: "PUT works!"
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "TechKeep Backend is running!"
  });
});

async function startServer() {
  try {
    const db = await connectDB();
    app.locals.db = db;

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
}

startServer();

