const { ObjectId } = require("mongodb");
const { productCollection } = require("../models/Product");

async function getProducts(req, res) {
  try {
    const products = await productCollection(req.app.locals.db)
      .find({ status: { $ne: "inactive" } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to get products",
    });
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await productCollection(req.app.locals.db)
      .findOne({
        _id: new ObjectId(id),
        status: { $ne: "inactive" },
      });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to get product",
    });
  }
}

async function createProduct(req, res) {
  try {
    const {
      sellerId,
      name,
      description,
      price,
      category,
      stock,
      image,
      details,
    } = req.body;

    if (
      !sellerId ||
      !name ||
      price === undefined ||
      !category ||
      stock === undefined
    ) {
      return res.status(400).json({
        message: "Missing required product information",
      });
    }

    const product = {
      sellerId,
      name,
      description: description || "",
      price: Number(price),
      category,
      stock: Number(stock),
      image: image || "",
      details: Array.isArray(details) ? details : [],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await productCollection(req.app.locals.db)
      .insertOne(product);

    res.status(201).json({
      message: "Product created successfully!",
      productId: result.insertedId,
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create product",
    });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const updates = {};

    const allowedFields = [
      "name",
      "description",
      "price",
      "category",
      "stock",
      "image",
      "details",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
    }

    if (updates.stock !== undefined) {
      updates.stock = Number(updates.stock);
    }

    updates.updatedAt = new Date();

    const result = await productCollection(req.app.locals.db)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updates }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      message: "Product updated successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update product",
    });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const result = await productCollection(req.app.locals.db)
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: "inactive",
            updatedAt: new Date(),
          },
        }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      message: "Product deleted successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to delete product",
    });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};