import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const API_URL = "http://https://howard-cigarette-standings-february.trycloudflare.com";

function formatPrice(price) {
  return `₱${Number(price || 0).toLocaleString(
    "en-PH",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDate(date) {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleDateString(
    "en-PH",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
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

function getTrackingStep(status) {
  switch (status) {
    case "To Pay":
      return 1;

    case "To Ship":
      return 3;

    case "To Receive":
      return 5;

    case "Completed":
      return 6;

    case "Cancelled":
      return 0;

    default:
      return 1;
  }
}

export default function OrderDetails() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams();

  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  // ===================================================
  // LOAD ORDER
  // ===================================================

  const loadOrder = async () => {
    try {
      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to get orders"
        );
      }

      const foundOrder = data.find(
        (item) =>
          String(item._id) === String(id)
      );

      if (foundOrder) {
        const firstItem =
          foundOrder.items?.[0];

        const formattedOrder = {
          id: String(foundOrder._id),

          seller:
            firstItem?.seller ||
            firstItem?.sellerName ||
            firstItem?.shopName ||
            firstItem?.sellerId ||
            "Seller",

          status:
            foundOrder.orderStatus ||
            "To Ship",

          date: formatDate(
            foundOrder.createdAt
          ),

          customer: {
            name:
              foundOrder.customer?.name ||
              foundOrder.customerName ||
              "No name",

            phone:
              foundOrder.customer?.phone ||
              foundOrder.customerPhone ||
              "No phone number",

            address:
              foundOrder.deliveryAddress ||
              "No delivery address",
          },

          paymentMethod:
            foundOrder.paymentMethod ===
            "COD"
              ? "Cash on Delivery"
              : foundOrder.paymentMethod ||
                "Cash on Delivery",

          paymentStatus:
            foundOrder.paymentStatus ||
            "Pending",

          items: (
            foundOrder.items || []
          ).map((item) => ({
            id:
              item.productId,

            name:
              item.productName ||
              item.name ||
              "Product",

            price:
              Number(item.price || 0),

            quantity:
              Number(item.quantity || 0),

            image:
              item.image || "",
          })),

          subtotal:
            Number(
              foundOrder.subtotal || 0
            ),

          deliveryFee:
            Number(
              foundOrder.deliveryFee || 0
            ),

          total:
            Number(
              foundOrder.total || 0
            ),
        };

        setOrder(formattedOrder);
      }
    } catch (error) {
      console.error(
        "Load order error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // UPDATE ORDER STATUS
  // ===================================================

  const updateOrderStatus = async (
    newStatus
  ) => {
    try {
      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Session Expired",
          "Please log in again."
        );

        return false;
      }

      const response = await fetch(
        `${API_URL}/api/orders/${order.id}/status`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            orderStatus: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update order status"
        );
      }

      setOrder(
        (currentOrder) => ({
          ...currentOrder,

          status:
            data.orderStatus ||
            newStatus,

          paymentStatus:
            data.paymentStatus ||
            currentOrder.paymentStatus,
        })
      );

      return true;
    } catch (error) {
      console.error(
        "Update order status error:",
        error
      );

      Alert.alert(
        "Error",
        error.message ||
          "Failed to update order status."
      );

      return false;
    }
  };

  // ===================================================
  // NOT FOUND
  // ===================================================

  if (!loading && !order) {
    return (
      <View style={styles.container}>

        <View style={styles.header}>

          <Pressable
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#000000"
            />
          </Pressable>

          <View
            style={
              styles.headerTitleContainer
            }
          >
            <Text style={styles.headerTitle}>
              Order Details
            </Text>
          </View>

          <View style={styles.headerSpacer} />

        </View>

        <View
          style={
            styles.notFoundContainer
          }
        >

          <View style={styles.emptyIcon}>
            <Ionicons
              name="receipt-outline"
              size={42}
              color="#999999"
            />
          </View>

          <Text style={styles.emptyTitle}>
            Order Not Found
          </Text>

          <Text style={styles.emptyText}>
            We couldn't find the order
            you're looking for.
          </Text>

          <Pressable
            style={styles.shopButton}
            onPress={() =>
              router.replace("/orders")
            }
          >
            <Text
              style={styles.shopButtonText}
            >
              Back to Orders
            </Text>

            <Ionicons
              name="arrow-forward"
              size={16}
              color="#FFFFFF"
            />
          </Pressable>

        </View>

      </View>
    );
  }

  if (loading || !order) {
    return null;
  }

  const statusColors =
    getStatusColors(
      order.status
    );

  const trackingStep =
    getTrackingStep(
      order.status
    );

  // ===================================================
  // CANCEL ORDER
  // ===================================================

  const handleCancelOrder = () => {
    if (order.status !== "To Ship") {
      return;
    }

    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        {
          text: "No",
          style: "cancel",
        },

        {
          text: "Yes, Cancel",
          style: "destructive",

          onPress: async () => {
            const success =
              await updateOrderStatus(
                "Cancelled"
              );

            if (success) {
              Alert.alert(
                "Order Cancelled",
                "Your order has been cancelled."
              );
            }
          },
        },
      ]
    );
  };

  // ===================================================
  // CONTACT SELLER
  // ===================================================

  const handleContactSeller = () => {
    Alert.alert(
      "Contact Seller",
      `You can contact ${order.seller} through the seller support section once the backend is connected.`
    );
  };

  // ===================================================
  // PAY NOW
  // ===================================================

  const handlePayNow = () => {
    if (order.status !== "To Pay") {
      return;
    }

    Alert.alert(
      "Confirm Payment",
      `Pay ${formatPrice(
        order.total
      )} for this order?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Confirm Payment",

          onPress: async () => {
            const success =
              await updateOrderStatus(
                "To Ship"
              );

            if (success) {
              Alert.alert(
                "Payment Successful",
                "Your payment has been confirmed. The seller will now prepare your order."
              );
            }
          },
        },
      ]
    );
  };

  // ===================================================
  // ORDER RECEIVED
  // ===================================================

  const handleOrderReceived = () => {
    if (
      order.status !==
      "To Receive"
    ) {
      return;
    }

    Alert.alert(
      "Order Received",
      "Have you received your order?",
      [
        {
          text: "Not Yet",
          style: "cancel",
        },

        {
          text: "Yes, Received",

          onPress: async () => {
            const success =
              await updateOrderStatus(
                "Completed"
              );

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

  // ===================================================
  // BUY AGAIN
  // ===================================================

  const handleBuyAgain =
    async () => {
      try {
        const existingCart =
          await AsyncStorage.getItem(
            "cart"
          );

        let cart = [];

        if (existingCart) {
          try {
            const parsedCart =
              JSON.parse(
                existingCart
              );

            if (
              Array.isArray(
                parsedCart
              )
            ) {
              cart =
                parsedCart;
            }
          } catch (error) {
            cart = [];
          }
        }

        order.items.forEach(
          (item) => {
            const existingIndex =
              cart.findIndex(
                (cartItem) =>
                  String(
                    cartItem.productId ??
                      cartItem.id
                  ) ===
                  String(item.id)
              );

            if (
              existingIndex >= 0
            ) {
              cart[
                existingIndex
              ] = {
                ...cart[
                  existingIndex
                ],

                quantity:
                  Number(
                    cart[
                      existingIndex
                    ].quantity
                  ) +
                  Number(
                    item.quantity
                  ),
              };
            } else {
              cart.push({
                id: item.id,

                productId:
                  item.id,

                productName:
                  item.name,

                name: item.name,

                price:
                  item.price,

                quantity:
                  item.quantity,

                image:
                  item.image,
              });
            }
          }
        );

        await AsyncStorage.setItem(
          "cart",
          JSON.stringify(cart)
        );

        router.push("/cart");
      } catch (error) {
        console.error(
          "Buy again error:",
          error
        );

        Alert.alert(
          "Error",
          "Unable to add the items to your cart."
        );
      }
    };

  // ===================================================
  // MAIN SCREEN
  // ===================================================

  return (
    <View style={styles.container}>

      {/* FIXED HEADER */}

      <View style={styles.header}>

        <Pressable
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#000000"
          />
        </Pressable>

        <View
          style={
            styles.headerTitleContainer
          }
        >
          <Text style={styles.headerTitle}>
            Order Details
          </Text>

          <Text
            style={styles.headerSubtitle}
          >
            {order.id}
          </Text>
        </View>

        <Pressable
          style={styles.headerButton}
          onPress={
            handleContactSeller
          }
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color="#000000"
          />
        </Pressable>

      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* STATUS */}

        <View style={styles.statusCard}>

          <View
            style={
              styles.statusIconCircle
            }
          >
            <Ionicons
              name={getStatusIcon(
                order.status
              )}
              size={25}
              color={
                statusColors.text
              }
            />
          </View>

          <View style={styles.statusInfo}>

            <Text
              style={styles.statusTitle}
            >
              {order.status}
            </Text>

            <Text
              style={
                styles.statusDescription
              }
            >
              {order.status ===
              "To Pay"
                ? "Please complete your payment."
                : order.status ===
                  "To Ship"
                ? "The seller is preparing your order."
                : order.status ===
                  "To Receive"
                ? "Your order is on the way."
                : order.status ===
                  "Completed"
                ? "Your order has been completed."
                : order.status ===
                  "Cancelled"
                ? "This order has been cancelled."
                : "Your order is being processed."}
            </Text>

          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusColors.background,

                borderColor:
                  statusColors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color:
                    statusColors.text,
                },
              ]}
            >
              {order.status}
            </Text>
          </View>

        </View>

        {/* DELIVERY TRACKING */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Delivery Tracking
          </Text>

          <View
            style={styles.trackingCard}
          >

            {[
              "Order Placed",
              "Payment Confirmed",
              "Seller Preparing",
              "Shipped",
              "Out for Delivery",
              "Delivered",
            ].map(
              (step, index) => {
                const stepNumber =
                  index + 1;

                const isCompleted =
                  stepNumber <
                  trackingStep;

                const isCurrent =
                  stepNumber ===
                  trackingStep;

                return (
                  <View
                    key={step}
                    style={
                      styles.trackingRow
                    }
                  >

                    <View
                      style={
                        styles.trackingIndicatorColumn
                      }
                    >

                      <View
                        style={[
                          styles.trackingCircle,
                          (isCompleted ||
                            isCurrent) &&
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
                          size={
                            isCompleted
                              ? 14
                              : 10
                          }
                          color={
                            isCompleted ||
                            isCurrent
                              ? "#FFFFFF"
                              : "#AAAAAA"
                          }
                        />
                      </View>

                      {stepNumber <
                        6 && (
                        <View
                          style={[
                            styles.trackingLine,
                            isCompleted &&
                              styles.trackingLineActive,
                          ]}
                        />
                      )}

                    </View>

                    <View
                      style={
                        styles.trackingTextContainer
                      }
                    >

                      <Text
                        style={[
                          styles.trackingStepText,
                          (isCompleted ||
                            isCurrent) &&
                            styles.trackingStepTextActive,
                        ]}
                      >
                        {step}
                      </Text>

                      {isCurrent && (
                        <Text
                          style={
                            styles.trackingCurrentText
                          }
                        >
                          Current status
                        </Text>
                      )}

                    </View>

                  </View>
                );
              }
            )}

          </View>

        </View>

        {/* ORDER INFORMATION */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Order Information
          </Text>

          <View style={styles.infoCard}>

            <View style={styles.infoRow}>

              <View style={styles.infoIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={18}
                  color="#555555"
                />
              </View>

              <View
                style={
                  styles.infoTextContainer
                }
              >
                <Text style={styles.infoLabel}>
                  Order Number
                </Text>

                <Text style={styles.infoValue}>
                  {order.id}
                </Text>
              </View>

            </View>

            <View
              style={styles.infoDivider}
            />

            <View style={styles.infoRow}>

              <View style={styles.infoIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color="#555555"
                />
              </View>

              <View
                style={
                  styles.infoTextContainer
                }
              >
                <Text style={styles.infoLabel}>
                  Order Date
                </Text>

                <Text style={styles.infoValue}>
                  {order.date}
                </Text>
              </View>

            </View>

            <View
              style={styles.infoDivider}
            />

            <View style={styles.infoRow}>

              <View style={styles.infoIcon}>
                <Ionicons
                  name="storefront-outline"
                  size={18}
                  color="#555555"
                />
              </View>

              <View
                style={
                  styles.infoTextContainer
                }
              >
                <Text style={styles.infoLabel}>
                  Seller
                </Text>

                <Text style={styles.infoValue}>
                  {order.seller}
                </Text>
              </View>

            </View>

          </View>

        </View>

        {/* DELIVERY ADDRESS */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Delivery Address
          </Text>

          <View style={styles.infoCard}>

            <View
              style={styles.addressHeader}
            >

              <View style={styles.addressIcon}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color="#000000"
                />
              </View>

              <View
                style={styles.addressText}
              >

                <Text
                  style={styles.addressName}
                >
                  {order.customer.name}
                </Text>

                <Text
                  style={styles.addressPhone}
                >
                  {order.customer.phone}
                </Text>

              </View>

            </View>

            <Text
              style={styles.addressValue}
            >
              {order.customer.address}
            </Text>

          </View>

        </View>

        {/* PRODUCTS */}

        <View style={styles.section}>

          <View
            style={
              styles.sectionHeaderRow
            }
          >

            <Text style={styles.sectionTitle}>
              Products
            </Text>

            <Text
              style={styles.productCount}
            >
              {order.items.length}{" "}
              {order.items.length ===
              1
                ? "item"
                : "items"}
            </Text>

          </View>

          <View style={styles.infoCard}>

            {order.items.map(
              (item, index) => (
                <View
                  key={`${item.id}-${index}`}
                  style={[
                    styles.productRow,
                    index !==
                      order.items.length -
                        1 &&
                      styles.productRowBorder,
                  ]}
                >

                  {item.image ? (
                    <Image
                      source={{
                        uri: item.image,
                      }}
                      style={
                        styles.productImage
                      }
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={
                        styles.productImage
                      }
                    />
                  )}

                  <View
                    style={
                      styles.productInfo
                    }
                  >

                    <Text
                      style={
                        styles.productName
                      }
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>

                    <Text
                      style={
                        styles.productSeller
                      }
                      numberOfLines={1}
                    >
                      {order.seller}
                    </Text>

                    <Text
                      style={
                        styles.productQuantity
                      }
                    >
                      Qty: {item.quantity}
                    </Text>

                  </View>

                  <View
                    style={
                      styles.productPriceContainer
                    }
                  >

                    <Text
                      style={
                        styles.productPrice
                      }
                    >
                      {formatPrice(
                        Number(
                          item.price
                        ) *
                          Number(
                            item.quantity
                          )
                      )}
                    </Text>

                  </View>

                </View>
              )
            )}

          </View>

        </View>

        {/* PAYMENT METHOD */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Payment Method
          </Text>

          <View
            style={styles.paymentCard}
          >

            <View
              style={styles.paymentIcon}
            >
              <Ionicons
                name={
                  order.paymentMethod ===
                  "GCash"
                    ? "phone-portrait-outline"
                    : "cash-outline"
                }
                size={21}
                color="#000000"
              />
            </View>

            <View style={styles.paymentInfo}>

              <Text
                style={styles.paymentTitle}
              >
                {order.paymentMethod}
              </Text>

              <Text
                style={
                  styles.paymentSubtitle
                }
              >
                {order.paymentStatus ===
                "Paid"
                  ? "Payment confirmed"
                  : order.status ===
                    "To Pay"
                  ? "Payment is still pending"
                  : "Payment method used for this order"}
              </Text>

            </View>

          </View>

        </View>

        {/* ORDER SUMMARY */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Order Summary
          </Text>

          <View
            style={styles.summaryCard}
          >

            <View style={styles.summaryRow}>

              <Text
                style={styles.summaryLabel}
              >
                Subtotal
              </Text>

              <Text
                style={styles.summaryValue}
              >
                {formatPrice(
                  order.subtotal
                )}
              </Text>

            </View>

            <View style={styles.summaryRow}>

              <Text
                style={styles.summaryLabel}
              >
                Delivery Fee
              </Text>

              <Text
                style={styles.summaryValue}
              >
                {formatPrice(
                  order.deliveryFee
                )}
              </Text>

            </View>

            <View
              style={styles.summaryDivider}
            />

            <View style={styles.summaryRow}>

              <Text
                style={
                  styles.totalSummaryLabel
                }
              >
                Total
              </Text>

              <Text
                style={
                  styles.totalSummaryValue
                }
              >
                {formatPrice(
                  order.total
                )}
              </Text>

            </View>

          </View>

        </View>

        {/* PAY NOW */}

        {order.status ===
          "To Pay" && (
          <Pressable
            style={
              styles.primaryAction
            }
            onPress={handlePayNow}
          >
            <Ionicons
              name="card-outline"
              size={18}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.primaryActionText
              }
            >
              Pay Now
            </Text>
          </Pressable>
        )}

        {/* CANCEL */}

        {order.status ===
          "To Ship" && (
          <Pressable
            style={
              styles.cancelAction
            }
            onPress={
              handleCancelOrder
            }
          >
            <Ionicons
              name="close-circle-outline"
              size={18}
              color="#B32626"
            />

            <Text
              style={
                styles.cancelActionText
              }
            >
              Cancel Order
            </Text>
          </Pressable>
        )}

        {/* ORDER RECEIVED */}

        {order.status ===
          "To Receive" && (
          <Pressable
            style={
              styles.primaryAction
            }
            onPress={
              handleOrderReceived
            }
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.primaryActionText
              }
            >
              Order Received
            </Text>
          </Pressable>
        )}

        {/* BUY AGAIN */}

        {order.status ===
          "Completed" && (
          <Pressable
            style={
              styles.secondaryAction
            }
            onPress={
              handleBuyAgain
            }
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color="#000000"
            />

            <Text
              style={
                styles.secondaryActionText
              }
            >
              Buy Again
            </Text>
          </Pressable>
        )}

        {/* CANCELLED */}

        {order.status ===
          "Cancelled" && (
          <Pressable
            style={
              styles.secondaryAction
            }
            onPress={() =>
              router.replace(
                "/home"
              )
            }
          >
            <Ionicons
              name="bag-outline"
              size={18}
              color="#000000"
            />

            <Text
              style={
                styles.secondaryActionText
              }
            >
              Continue Shopping
            </Text>
          </Pressable>
        )}

        <View style={{ height: 115 }} />

      </ScrollView>

      {/* BOTTOM NAVIGATION */}

      <View style={styles.bottomNav}>

        <Pressable
          style={styles.navItem}
          onPress={() =>
            router.replace("/home")
          }
        >
          <Ionicons
            name="home-outline"
            size={23}
            color="#777777"
          />

          <Text style={styles.navText}>
            Home
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() =>
            router.push("/search")
          }
        >
          <Ionicons
            name="search-outline"
            size={23}
            color="#777777"
          />

          <Text style={styles.navText}>
            Search
          </Text>
        </Pressable>

        <Pressable
          style={styles.cartButton}
          onPress={() =>
            router.push("/cart")
          }
        >
          <Ionicons
            name="bag-handle-outline"
            size={24}
            color="#FFFFFF"
          />
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() =>
            router.push("/orders")
          }
        >
          <Ionicons
            name="receipt-outline"
            size={23}
            color="#000000"
          />

          <Text
            style={
              styles.activeNavText
            }
          >
            Orders
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() =>
            router.push("/profile")
          }
        >
          <Ionicons
            name="person-outline"
            size={23}
            color="#777777"
          />

          <Text style={styles.navText}>
            Profile
          </Text>
        </Pressable>

      </View>

    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  header: {
    height: 100,
    paddingTop: 45,
    paddingHorizontal: 20,
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
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#000000",
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: "#777777",
  },

  headerSpacer: {
    width: 42,
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
    padding: 15,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    flexDirection: "row",
    alignItems: "center",
  },

  statusIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },

  statusInfo: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
    minWidth: 0,
  },

  statusTitle: {
    fontSize: 15,
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },

  statusBadgeText: {
    fontSize: 9,
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
    justifyContent: "flex-start",
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
    width: 62,
    height: 62,
    borderRadius: 10,
    backgroundColor: "#EEEEEE",
    flexShrink: 0,
  },

  productInfo: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 12,
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
    flexShrink: 1,
  },

  productQuantity: {
    marginTop: 4,
    fontSize: 9,
    color: "#888888",
  },

  productPriceContainer: {
    width: 82,
    alignItems: "flex-end",
    justifyContent: "center",
    flexShrink: 0,
  },

  productPrice: {
    fontSize: 12,
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
    height: 48,
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  secondaryAction: {
    height: 48,
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  secondaryActionText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "700",
  },

  cancelAction: {
    height: 48,
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5A2A2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  cancelActionText: {
    color: "#B32626",
    fontSize: 13,
    fontWeight: "700",
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