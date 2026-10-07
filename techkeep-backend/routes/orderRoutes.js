const express = require("express");
const { ObjectId } = require("mongodb");
const { orderCollection } = require("../models/Order");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
  try {
    const order = {
      buyerId: req.user.userId,

      customer: {
        name: req.body.customer?.name || "",
        phone: req.body.customer?.phone || "",
      },

      customerName: req.body.customerName || "",
      customerPhone: req.body.customerPhone || "",

      items: req.body.items,
      subtotal: req.body.subtotal,
      deliveryFee: req.body.deliveryFee,
      total: req.body.total,
      paymentMethod: req.body.paymentMethod,
      paymentStatus: req.body.paymentStatus || "Pending",
      orderStatus: req.body.orderStatus || "To Ship",
      deliveryAddress: req.body.deliveryAddress,

      createdAt: new Date(),
    };

    const result = await orderCollection(req.app.locals.db)
      .insertOne(order);

    res.status(201).json({
      message: "Order created successfully!",
      orderId: result.insertedId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create order",
    });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  try {
    const orders = await orderCollection(req.app.locals.db)
      .find({ buyerId: req.user.userId })
      .toArray();

    res.json(orders);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get orders",
    });
  }
});

router.put("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "To Pay",
      "To Ship",
      "To Receive",
      "Completed",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const updateData = {
      orderStatus,
    };

    if (orderStatus === "To Ship") {
      const existingOrder =
        await orderCollection(req.app.locals.db).findOne({
          _id: new ObjectId(id),
        });

      if (
        existingOrder &&
        existingOrder.paymentMethod === "GCash"
      ) {
        updateData.paymentStatus = "Paid";
      }
    }

    const result =
      await orderCollection(req.app.locals.db).updateOne(
        {
          _id: new ObjectId(id),
          buyerId: req.user.userId,
        },
        {
          $set: updateData,
        }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json({
      message: "Order status updated successfully!",
      orderStatus,
      paymentStatus:
        updateData.paymentStatus || undefined,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update order status",
    });
  }
});

module.exports = router;

