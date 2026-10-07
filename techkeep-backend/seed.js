const connectDB = require("./config/db");

async function seedProducts() {
  try {
    const db = await connectDB();

    const products = [
      {
        name: "Running Shoes",
        price: 1299,
        seller: "StepUp PH",
        category: "Shoes",
        stock: 25
      },
      {
        name: "Basic Oversized Shirt",
        price: 399,
        seller: "Urban Wear",
        category: "Clothing",
        stock: 30
      },
      {
        name: "Wireless Headphones",
        price: 899,
        seller: "TechStore",
        category: "Accessories",
        stock: 15
      },
      {
        name: "Study Notebook",
        price: 149,
        seller: "SchoolHub",
        category: "School",
        stock: 50
      },
      {
        name: "Mechanical Keyboard",
        price: 1499,
        seller: "KeyHub",
        category: "Electronics",
        stock: 10
      },
      {
        name: "Smart Watch",
        price: 1999,
        seller: "TechStore",
        category: "Electronics",
        stock: 12
      },
      {
        name: "Desk Lamp",
        price: 599,
        seller: "HomeHub",
        category: "Others",
        stock: 20
      },
      {
        name: "USB-C Cable",
        price: 199,
        seller: "TechStore",
        category: "Accessories",
        stock: 40
      }
    ];

    await db.collection("products").deleteMany({});
    await db.collection("products").insertMany(products);

    console.log("Products added successfully!");

    process.exit(0);
  } catch (error) {
    console.error("Failed to add products:", error);
    process.exit(1);
  }
}

seedProducts();