
import React, { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const API_URL = "https://backend-2-h20j.onrender.com";

function formatPrice(price) {
  return `₱${Number(price || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date) {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "N/A";

  return parsedDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function normalizeRawStatus(status) {
  const value = String(status || "To Pay")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .trim();

  const statuses = {
    pending: "To Pay",
    unpaid: "To Pay",
    "order placed": "To Pay",
    "to pay": "To Pay",

    processing: "Seller Preparing",
    "seller preparing": "Seller Preparing",
    "to ship": "Seller Preparing",

    "to shipped": "To Shipped",
    shipped: "Shipped",

    "out for delivery": "Out for Delivery",
    "to receive": "To Receive",

    delivered: "Completed",
    completed: "Completed",

    cancelled: "Cancelled",
    canceled: "Cancelled",
  };

  return statuses[value] || status || "To Pay";
}

function normalizeStatus(status) {
  const rawStatus = normalizeRawStatus(status);

  switch (rawStatus) {
    case "To Pay":
      return "To Pay";

    case "Seller Preparing":
    case "To Shipped":
      return "To Ship";

    case "Shipped":
    case "Out for Delivery":
    case "To Receive":
      return "To Receive";

    case "Completed":
      return "Completed";

    case "Cancelled":
      return "Cancelled";

    default:
      return "To Pay";
  }
}

function normalizePaymentMethod(method) {
  if (!method) return "Cash on Delivery";

  const value = String(method).toLowerCase().trim();

  if (value === "cod" || value === "cash on delivery") {
    return "Cash on Delivery";
  }

  if (value === "gcash") {
    return "GCash";
  }

  return method;
}

function normalizePaymentStatus(status) {
  if (!status) return "Pending";

  const value = String(status).toLowerCase().trim();

  if (
    value === "paid" ||
    value === "completed" ||
    value === "successful"
  ) {
    return "Paid";
  }

  if (value === "pending" || value === "unpaid") {
    return "Pending";
  }

  return status;
}

function getSellerName(value, fallback = "Seller") {
  if (value && typeof value === "object") {
    return (
      getSellerName(value.name, "") ||
      getSellerName(value.shopName, "") ||
      getSellerName(value.storeName, "") ||
      getSellerName(value.username, "") ||
      getSellerName(value.businessName, "") ||
      fallback
    );
  }

  if (typeof value === "string") {
    const name = value.trim();

    if (
      !name ||
      /^\d+$/.test(name) ||
      /^[a-f\d]{24}$/i.test(name)
    ) {
      return fallback;
    }

    return name;
  }

  return fallback;
}

function getStatusIcon(status) {
  switch (status) {
    case "To Pay":
      return "card-outline";
    case "To Ship":
      return "cube-outline";
    case "To Receive":
      return "bicycle-outline";
    case "Completed":
      return "checkmark-circle-outline";
    case "Cancelled":
      return "close-circle-outline";
    default:
      return "receipt-outline";
  }
}

function getStatusColors(status) {
  switch (status) {
    case "To Pay":
      return {
        background: "#FFF4D6",
        border: "#F0C36A",
        text: "#9A6500",
      };

    case "To Ship":
      return {
        background: "#EAF2FF",
        border: "#9ABCF5",
        text: "#245DA8",
      };

    case "To Receive":
      return {
        background: "#E8F7F0",
        border: "#8DD5B4",
        text: "#19734A",
      };

    case "Completed":
      return {
        background: "#E9F7EA",
        border: "#91D39A",
        text: "#287A32",
      };

    case "Cancelled":
      return {
        background: "#FDECEC",
        border: "#E5A2A2",
        text: "#B32626",
      };

    default:
      return {
        background: "#F1F1F1",
        border: "#D5D5D5",
        text: "#555555",
      };
  }
}

function getTrackingSteps(order) {
  const isGCashPaid =
    order.paymentMethod === "GCash" &&
    order.paymentStatus === "Paid";

  if (isGCashPaid) {
    return [
      "Order Placed",
      "Payment Confirmed",
      "Seller Preparing",
      "Shipped",
      "Out for Delivery",
      "Delivered",
    ];
  }

  return [
    "Order Placed",
    "Seller Preparing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];
}

function getTrackingStep(rawStatus, steps) {
  const status = normalizeRawStatus(rawStatus);

  let targetStep;

  switch (status) {
    case "To Pay":
    case "Order Placed":
      targetStep = "Order Placed";
      break;

    case "Seller Preparing":
    case "To Ship":
    case "To Shipped":
      targetStep = "Seller Preparing";
      break;

    case "Shipped":
      targetStep = "Shipped";
      break;

    case "Out for Delivery":
    case "To Receive":
      targetStep = "Out for Delivery";
      break;

    case "Completed":
      targetStep = "Delivered";
      break;

    case "Cancelled":
      return 0;

    default:
      targetStep = "Order Placed";
  }

  const index = steps.indexOf(targetStep);
  return index >= 0 ? index + 1 : 1;
}

function getStatusDescription(status) {
  switch (status) {
    case "To Pay":
      return "Please complete your payment.";
    case "To Ship":
      return "The seller is preparing your order.";
    case "To Receive":
      return "Your order is on the way.";
    case "Completed":
      return "Your order has been completed.";
    case "Cancelled":
      return "This order has been cancelled.";
    default:
      return "Your order is being processed.";
  }
}

async function readResponse(response) {
  const responseText = await response.text();

  if (!responseText) return {};

  try {
    return JSON.parse(responseText);
  } catch {
    return { message: responseText };
  }
}

export default function OrderDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const orderId = Array.isArray(id) ? id[0] : id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      let savedPhone = "";

try {
  const profileResponse = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (profileResponse.ok) {
    const profileData = await readResponse(profileResponse);
    const user = profileData.user || profileData;
    savedPhone = user.phone || "";
  }
} catch (error) {
  console.error("LOAD SAVED PHONE ERROR:", error);
}

      if (!token) {
        Alert.alert("Login Required", "Please log in again.");
        setOrder(null);
        return;
      }

      const response = await fetch(`${API_URL}/api/orders/mine`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to load your orders.");
      }

      const orders = Array.isArray(data)
        ? data
        : Array.isArray(data.orders)
        ? data.orders
        : [];

      const foundOrder = orders.find(
        (item) => String(item._id || item.id) === String(orderId)
      );

      if (!foundOrder) {
        setOrder(null);
        return;
      }

      const rawStatus = normalizeRawStatus(
        foundOrder.status || foundOrder.orderStatus
      );

      const items = await Promise.all(
        (foundOrder.items || []).map(async (item) => {
          const productId =
            item.productId ||
            item.product?._id ||
            (typeof item.product === "string" ? item.product : null) ||
            item.id;

          let image =
            item.image ||
            item.productImage ||
            item.product?.image ||
            "";

          // Use the product's existing image if the order has no saved image.
          if (!image && productId) {
            try {
              const productResponse = await fetch(
                `${API_URL}/api/products/${productId}`
              );

              const productData = await readResponse(productResponse);

              if (productResponse.ok) {
                const product = productData.product || productData;

                image =
                  product.image ||
                  product.imageUrl ||
                  product.images?.[0] ||
                  "";
              } else {
                console.log(
                  "PRODUCT IMAGE REQUEST FAILED:",
                  productId,
                  productResponse.status,
                  productData
                );
              }
            } catch (error) {
              console.error("LOAD PRODUCT IMAGE ERROR:", productId, error);
            }
          }

          if (image && typeof image === "object") {
            image = image.url || image.uri || "";
          }

          return {
            id: productId || item._id,
            name: item.productName || item.name || "Product",
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 1),
            image: typeof image === "string" ? image : "",
          };
        })
      );

      const firstItem = foundOrder.items?.[0];

      let sellerName =
        getSellerName(firstItem?.sellerName, "") ||
        getSellerName(firstItem?.shopName, "") ||
        getSellerName(firstItem?.seller, "") ||
        getSellerName(foundOrder.sellerName, "") ||
        getSellerName(foundOrder.shopName, "");

      const firstProductId =
        firstItem?.productId ||
        firstItem?.product?._id ||
        (typeof firstItem?.product === "string"
          ? firstItem.product
          : null) ||
        firstItem?.id;

      if (firstProductId && !sellerName) {
        try {
          const sellerResponse = await fetch(
            `${API_URL}/api/products/${firstProductId}`
          );

          const sellerData = await readResponse(sellerResponse);

          if (sellerResponse.ok) {
            const product = sellerData.product || sellerData;

            sellerName =
              getSellerName(product.sellerName, "") ||
              getSellerName(product.shopName, "") ||
              getSellerName(product.storeName, "") ||
              getSellerName(product.seller, "");
          }
        } catch (error) {
          console.error("LOAD ORDER SELLER ERROR:", error);
        }
      }

      // Calculate the subtotal, delivery fee, and final total once.
      const calculatedSubtotal = (foundOrder.items || []).reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) * Number(item.quantity || 1),
        0
      );

      const savedSubtotal = Number(foundOrder.subtotal);
      const subtotal =
        foundOrder.subtotal != null && Number.isFinite(savedSubtotal)
          ? savedSubtotal
          : calculatedSubtotal;

      const savedFee = Number(foundOrder.deliveryFee);
      const deliveryFee =
        foundOrder.deliveryFee != null &&
        Number.isFinite(savedFee) &&
        savedFee > 0
          ? savedFee
          : 49;

      setOrder({
        id: foundOrder._id || foundOrder.id,
        seller: sellerName || "Seller",
        rawStatus,
        status: normalizeStatus(rawStatus),
        date: formatDate(foundOrder.createdAt),
        customer: {
          name:
            foundOrder.customerName ||
            foundOrder.shippingAddress?.name ||
            "TechKeep User",
          phone:
  foundOrder.phone ||
  foundOrder.shippingAddress?.phone ||
  savedPhone ||
  "Not provided",
          address:
            foundOrder.deliveryAddress ||
            foundOrder.shippingAddress?.address ||
            foundOrder.shippingAddress ||
            "No delivery address provided",
        },
        paymentMethod: normalizePaymentMethod(foundOrder.paymentMethod),
        paymentStatus: normalizePaymentStatus(foundOrder.paymentStatus),
        items,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
      });
    } catch (error) {
      console.error("LOAD ORDER ERROR:", error);

      Alert.alert(
        "Unable to Load Order",
        error.message || "Please try again."
      );

      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const updateOrderStatus = async (newStatus) => {
    if (!order) return false;

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please log in again.");
        return false;
      }

      const url = `${API_URL}/api/orders/${order.id}/status`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || `Request failed: ${response.status}`);
      }

      const updatedRawStatus = normalizeRawStatus(data.status || newStatus);

      setOrder((currentOrder) => ({
        ...currentOrder,
        rawStatus: updatedRawStatus,
        status: normalizeStatus(updatedRawStatus),
        paymentStatus: normalizePaymentStatus(
          data.paymentStatus || currentOrder.paymentStatus
        ),
      }));

      return true;
    } catch (error) {
      console.error("UPDATE ORDER STATUS ERROR:", error);
      Alert.alert(
        "Update Failed",
        error.message || "Could not update the order."
      );
      return false;
    }
  };

  // CANCEL ORDER (COD)
  const cancelOrder = async () => {
    if (!order || requesting) return;

    if (order.paymentMethod !== "Cash on Delivery") {
      Alert.alert(
        "Cancellation Unavailable",
        "This cancellation action is currently for Cash on Delivery orders."
      );
      return;
    }

    if (!["To Pay", "To Ship"].includes(order.status)) {
      Alert.alert(
        "Cannot Cancel",
        "This order can no longer be cancelled at its current status."
      );
      return;
    }

    try {
      setRequesting(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please log in again.");
        return;
      }

      const url = `${API_URL}/api/orders/${order.id}/cancel`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || `Request failed: ${response.status}`);
      }

      const updatedRawStatus = normalizeRawStatus(data.status || "Cancelled");

      setOrder((currentOrder) => ({
        ...currentOrder,
        rawStatus: updatedRawStatus,
        status: normalizeStatus(updatedRawStatus),
        paymentStatus: normalizePaymentStatus(
          data.paymentStatus || currentOrder.paymentStatus
        ),
      }));

      Alert.alert(
        "Order Cancelled",
        data.message || "Your order has been cancelled."
      );
    } catch (error) {
      console.error("CANCEL ORDER ERROR:", error);
      Alert.alert(
        "Cancellation Failed",
        error.message || "Could not cancel this order."
      );
    } finally {
      setRequesting(false);
    }
  };

  // PAY NOW (SIMULATED GCASH)
  const payOrder = async () => {
    if (!order || requesting) return;

    if (order.paymentMethod !== "GCash") {
      Alert.alert(
        "Payment Unavailable",
        "Pay Now is currently available for GCash orders only."
      );
      return;
    }

    try {
      setRequesting(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Login Required", "Please log in again.");
        return;
      }

      const url = `${API_URL}/api/orders/${order.id}/pay`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(data.message || `Request failed: ${response.status}`);
      }

      const updatedRawStatus = normalizeRawStatus(data.status || "To Ship");

      setOrder((currentOrder) => ({
        ...currentOrder,
        rawStatus: updatedRawStatus,
        status: normalizeStatus(updatedRawStatus),
        paymentStatus: normalizePaymentStatus(data.paymentStatus || "Paid"),
      }));

      Alert.alert(
        "Payment Successful",
        data.message || "Your simulated GCash payment was successful."
      );
    } catch (error) {
      console.error("PAY ORDER ERROR:", error);
      Alert.alert(
        "Payment Failed",
        error.message || "Could not process payment. Please try again."
      );
    } finally {
      setRequesting(false);
    }
  };

  const handleCancelOrder = () => {
    if (!order || !["To Pay", "To Ship"].includes(order.status)) {
      Alert.alert(
        "Cannot Cancel",
        "This order cannot be cancelled at its current status."
      );
      return;
    }

    if (order.paymentMethod !== "Cash on Delivery") {
      Alert.alert(
        "Cancellation Unavailable",
        "This cancellation action is currently for Cash on Delivery orders."
      );
      return;
    }

    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this COD order?",
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: cancelOrder,
        },
      ]
    );
  };

  const handlePayNow = () => {
    if (!order || order.status !== "To Pay") {
      Alert.alert(
        "Payment Unavailable",
        "This order is not waiting for payment."
      );
      return;
    }

    if (order.paymentMethod !== "GCash") {
      Alert.alert(
        "Payment Unavailable",
        "Pay Now is currently available for GCash orders only."
      );
      return;
    }

    Alert.alert(
      "Confirm Payment",
      `Confirm your simulated GCash payment of ${formatPrice(order.total)}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Pay Now", onPress: payOrder },
      ]
    );
  };

  const handleOrderReceived = () => {
    if (!order || order.status !== "To Receive") {
      Alert.alert(
        "Unavailable",
        "This order is not waiting for delivery confirmation."
      );
      return;
    }

    Alert.alert(
      "Confirm Order Received",
      "Have you received your order?",
      [
        { text: "Not Yet", style: "cancel" },
        {
          text: "Yes, Received",
          onPress: async () => {
            const success = await updateOrderStatus("Completed");

            if (success) {
              Alert.alert(
                "Order Completed",
                "Thank you for confirming your order."
              );
            }
          },
        },
      ]
    );
  };

  const handleContactSeller = () => {
    Alert.alert(
      "Contact Seller",
      `Contact ${order?.seller || "the seller"} through the seller support section.`
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#000000" />
          </Pressable>

          <Text style={styles.headerTitle}>Order Details</Text>

          <View style={styles.headerButton} />
        </View>

        <View style={styles.notFoundContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="receipt-outline" size={42} color="#999999" />
          </View>

          <Text style={styles.emptyTitle}>Order Not Found</Text>

          <Text style={styles.emptyText}>
            We couldn't find the order you're looking for.
          </Text>

          <Pressable
            style={styles.shopButton}
            onPress={() => router.replace("/orders")}
          >
            <Text style={styles.shopButtonText}>Back to Orders</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    );
  }

  const statusColors = getStatusColors(order.status);
  const trackingSteps = getTrackingSteps(order);
  const trackingStep = getTrackingStep(order.rawStatus, trackingSteps);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#000000" />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {order.id}
          </Text>
        </View>

        <Pressable
          style={styles.headerButton}
          onPress={handleContactSeller}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#000000" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusCard}>
          <View style={styles.statusIconCircle}>
            <Ionicons
              name={getStatusIcon(order.status)}
              size={25}
              color={statusColors.text}
            />
          </View>

          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{order.status}</Text>
            <Text style={styles.statusDescription}>
              {getStatusDescription(order.status)}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusColors.background,
                borderColor: statusColors.border,
              },
            ]}
          >
            <Text
              style={[styles.statusBadgeText, { color: statusColors.text }]}
            >
              {order.status}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Tracking</Text>

          {order.status === "Cancelled" ? (
            <View style={styles.trackingCard}>
              <View style={styles.cancelledTracking}>
                <Ionicons
                  name="close-circle-outline"
                  size={24}
                  color="#B32626"
                />
                <Text style={styles.cancelledTrackingText}>
                  This order has been cancelled.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.trackingCard}>
              {trackingSteps.map((step, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < trackingStep;
                const isCurrent = stepNumber === trackingStep;

                return (
                  <View key={step} style={styles.trackingRow}>
                    <View style={styles.trackingIndicatorColumn}>
                      <View
                        style={[
                          styles.trackingCircle,
                          (isCompleted || isCurrent) &&
                            styles.trackingCircleActive,
                        ]}
                      >
                        <Ionicons
                          name={
                            isCompleted
                              ? "checkmark"
                              : isCurrent
                              ? "ellipse"
                              : "ellipse-outline"
                          }
                          size={isCompleted ? 14 : 10}
                          color={
                            isCompleted || isCurrent ? "#FFFFFF" : "#AAAAAA"
                          }
                        />
                      </View>

                      {stepNumber < trackingSteps.length && (
                        <View
                          style={[
                            styles.trackingLine,
                            isCompleted && styles.trackingLineActive,
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.trackingTextContainer}>
                      <Text
                        style={[
                          styles.trackingStepText,
                          (isCompleted || isCurrent) &&
                            styles.trackingStepTextActive,
                        ]}
                      >
                        {step}
                      </Text>

                      {isCurrent && (
                        <Text style={styles.trackingCurrentText}>
                          Current status
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>

          <View style={styles.infoCard}>
            <InfoRow
              icon="receipt-outline"
              label="Order Number"
              value={order.id}
            />

            <View style={styles.infoDivider} />

            <InfoRow
              icon="calendar-outline"
              label="Order Date"
              value={order.date}
            />

            <View style={styles.infoDivider} />

            <InfoRow
              icon="storefront-outline"
              label="Seller"
              value={order.seller}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>

          <View style={styles.infoCard}>
            <View style={styles.addressHeader}>
              <View style={styles.addressIcon}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color="#000000"
                />
              </View>

              <View style={styles.addressText}>
                <Text style={styles.addressName}>
                  {order.customer.name}
                </Text>
                <Text style={styles.addressPhone}>
                  {order.customer.phone}
                </Text>
              </View>
            </View>

            <Text style={styles.addressValue}>
              {typeof order.customer.address === "string"
                ? order.customer.address
                : JSON.stringify(order.customer.address)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Products</Text>
            <Text style={styles.productCount}>
              {order.items.length}{" "}
              {order.items.length === 1 ? "item" : "items"}
            </Text>
          </View>

          <View style={styles.infoCard}>
            {order.items.map((item, index) => (
              <View
                key={`${item.id}-${index}`}
                style={[
                  styles.productRow,
                  index !== order.items.length - 1 &&
                    styles.productRowBorder,
                ]}
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.productImage}>
                    <Ionicons
                      name="image-outline"
                      size={24}
                      color="#999999"
                    />
                  </View>
                )}

                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>

                  <Text style={styles.productSeller} numberOfLines={1}>
                    {order.seller}
                  </Text>

                  <Text style={styles.productQuantity}>
                    Qty: {item.quantity}
                  </Text>
                </View>

                <View style={styles.productPriceContainer}>
                  <Text style={styles.productPrice}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                  
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <View style={styles.paymentCard}>
            <View style={styles.paymentIcon}>
              <Ionicons
                name={
                  order.paymentMethod === "GCash"
                    ? "phone-portrait-outline"
                    : "cash-outline"
                }
                size={21}
                color="#000000"
              />
            </View>

            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>{order.paymentMethod}</Text>
              <Text style={styles.paymentSubtitle}>
                Payment status: {order.paymentStatus}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(order.subtotal)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(order.deliveryFee)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalSummaryLabel}>Total</Text>
              <Text style={styles.totalSummaryValue}>
                {formatPrice(order.total)}
              </Text>
            </View>
          </View>
        </View>

        {order.status === "To Pay" &&
          order.paymentMethod === "GCash" && (
            <Pressable
              style={[
                styles.primaryAction,
                requesting && styles.disabledAction,
              ]}
              disabled={requesting}
              onPress={handlePayNow}
            >
              {requesting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="card-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryActionText}>Pay Now</Text>
                </>
              )}
            </Pressable>
          )}

        {["To Pay", "To Ship"].includes(order.status) &&
          order.paymentMethod === "Cash on Delivery" && (
            <Pressable
              style={[
                styles.cancelAction,
                requesting && styles.disabledAction,
              ]}
              disabled={requesting}
              onPress={handleCancelOrder}
            >
              {requesting ? (
                <ActivityIndicator color="#B32626" />
              ) : (
                <>
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color="#B32626"
                  />
                  <Text style={styles.cancelActionText}>Cancel Order</Text>
                </>
              )}
            </Pressable>
          )}

        {order.status === "To Receive" && (
          <Pressable
            style={[
              styles.primaryAction,
              requesting && styles.disabledAction,
            ]}
            disabled={requesting}
            onPress={handleOrderReceived}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.primaryActionText}>Order Received</Text>
          </Pressable>
        )}

        {order.status === "Completed" && (
          <Pressable
            style={styles.secondaryAction}
            onPress={() => router.replace("/home")}
          >
            <Ionicons name="refresh-outline" size={18} color="#000000" />
            <Text style={styles.secondaryActionText}>Continue Shopping</Text>
          </Pressable>
        )}

        {order.status === "Cancelled" && (
          <Pressable
            style={styles.secondaryAction}
            onPress={() => router.replace("/home")}
          >
            <Ionicons name="bag-outline" size={18} color="#000000" />
            <Text style={styles.secondaryActionText}>Continue Shopping</Text>
          </Pressable>
        )}

        <View style={{ height: 115 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/home")}
        >
          <Ionicons name="home-outline" size={23} color="#777777" />
          <Text style={styles.navText}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/search")}
        >
          <Ionicons name="search-outline" size={23} color="#777777" />
          <Text style={styles.navText}>Search</Text>
        </Pressable>

        <Pressable
          style={styles.cartButton}
          onPress={() => router.push("/cart")}
        >
          <Ionicons
            name="bag-handle-outline"
            size={24}
            color="#FFFFFF"
          />
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/orders")}
        >
          <Ionicons name="receipt-outline" size={23} color="#000000" />
          <Text style={styles.activeNavText}>Orders</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/profile")}
        >
          <Ionicons name="person-outline" size={23} color="#777777" />
          <Text style={styles.navText}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color="#555555" />
      </View>

      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{String(value || "N/A")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  centerContainer: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: "#777777",
  },

  header: {
    height: 100,
    paddingTop: 45,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7F7F7",
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#000000",
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: "#777777",
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },

  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    flexDirection: "row",
    alignItems: "center",
  },

  statusIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },

  statusInfo: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 6,
    minWidth: 0,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111111",
  },

  statusDescription: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    color: "#777777",
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: "700",
  },

  section: {
    marginTop: 18,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  sectionTitle: {
    marginBottom: 9,
    fontSize: 15,
    fontWeight: "800",
    color: "#111111",
  },

  productCount: {
    fontSize: 10,
    color: "#888888",
    marginBottom: 9,
  },

  trackingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E7E7E7",
  },

  trackingRow: {
    flexDirection: "row",
    minHeight: 48,
  },

  trackingIndicatorColumn: {
    width: 28,
    alignItems: "center",
  },

  trackingCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D5D5D5",
  },

  trackingCircleActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },

  trackingLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E2E2",
    marginVertical: 3,
  },

  trackingLineActive: {
    backgroundColor: "#000000",
  },

  trackingTextContainer: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 18,
  },

  trackingStepText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999999",
  },

  trackingStepTextActive: {
    color: "#111111",
  },

  trackingCurrentText: {
    marginTop: 3,
    fontSize: 9,
    color: "#777777",
  },

  cancelledTracking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  cancelledTrackingText: {
    flex: 1,
    fontSize: 12,
    color: "#B32626",
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E7E7E7",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  infoTextContainer: {
    flex: 1,
    marginLeft: 11,
    minWidth: 0,
  },

  infoLabel: {
    fontSize: 9,
    color: "#888888",
  },

  infoValue: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#222222",
  },

  infoDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 12,
  },

  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  addressIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
  },

  addressText: {
    flex: 1,
    marginLeft: 11,
    minWidth: 0,
  },

  addressName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111111",
  },

  addressPhone: {
    marginTop: 3,
    fontSize: 10,
    color: "#777777",
  },

  addressValue: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    fontSize: 11,
    lineHeight: 17,
    color: "#555555",
  },

  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    width: "100%",
  },

  productRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingBottom: 12,
    marginBottom: 12,
  },

  productImage: {
    width: 58,
    height: 58,
    borderRadius: 10,
    backgroundColor: "#EEEEEE",
    flexShrink: 0,
  },

  productInfo: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 8,
    minWidth: 0,
  },

  productName: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    color: "#111111",
  },

  productSeller: {
    marginTop: 3,
    fontSize: 9,
    color: "#777777",
  },

  productQuantity: {
    marginTop: 4,
    fontSize: 9,
    color: "#888888",
  },

  productPriceContainer: {
    width: 86,
    alignItems: "flex-end",
    justifyContent: "center",
    flexShrink: 0,
  },

  productPrice: {
    fontSize: 11,
    fontWeight: "800",
    color: "#222222",
    textAlign: "right",
  },

  unitPrice: {
    marginTop: 3,
    fontSize: 8,
    color: "#999999",
    textAlign: "right",
  },

  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    flexDirection: "row",
    alignItems: "center",
  },

  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  paymentInfo: {
    flex: 1,
    marginLeft: 11,
    minWidth: 0,
  },

  paymentTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111111",
  },

  paymentSubtitle: {
    marginTop: 3,
    fontSize: 9,
    color: "#888888",
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E7E7E7",
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  summaryLabel: {
    fontSize: 11,
    color: "#777777",
  },

  summaryValue: {
    fontSize: 11,
    color: "#333333",
    fontWeight: "600",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 4,
    marginBottom: 13,
  },

  totalSummaryLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111111",
  },

  totalSummaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000000",
  },

  primaryAction: {
    minHeight: 48,
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },

  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  secondaryAction: {
    minHeight: 48,
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },

  secondaryActionText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "700",
  },

  cancelAction: {
    minHeight: 48,
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5A2A2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },

  cancelActionText: {
    color: "#B32626",
    fontSize: 13,
    fontWeight: "700",
  },

  disabledAction: {
    opacity: 0.6,
  },

  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  emptyTitle: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#777777",
    textAlign: "center",
  },

  shopButton: {
    marginTop: 22,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  shopButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 82,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },

  navItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 55,
  },

  navText: {
    fontSize: 9,
    color: "#777777",
    marginTop: 4,
  },

  activeNavText: {
    fontSize: 9,
    color: "#000000",
    fontWeight: "600",
    marginTop: 4,
  },

  cartButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -25,
    borderWidth: 5,
    borderColor: "#F7F7F7",
  },
});