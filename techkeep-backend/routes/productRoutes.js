const express = require("express");
const { productCollection } = require("../models/Product");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const products = await productCollection(req.app.locals.db)
      .find()
      .toArray();

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to get products"
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const product = req.body;

    const result = await productCollection(req.app.locals.db)
      .insertOne(product);

    res.status(201).json({
      message: "Product added successfully!",
      productId: result.insertedId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to add product"
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    const product = await productCollection(req.app.locals.db)
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to get product"
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");

    const result = await productCollection(req.app.locals.db)
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json({
      message: "Product updated successfully!"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update product"
    });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");

    const result = await productCollection(req.app.locals.db)
      .deleteOne({
        _id: new ObjectId(req.params.id)
      });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json({
      message: "Product deleted successfully!"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to delete product"
    });
  }
});

module.exports = router;