import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
  useFocusEffect,
} from "expo-router";

const API_URL = "https://backend-2-h20j.onrender.com";

export default function CheckoutScreen() {
  const { items, productId, quantity } = useLocalSearchParams();

  const [checkoutItems, setCheckoutItems] = useState([]);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [loadingCustomer, setLoadingCustomer] = useState(true);

  const [paymentMethod, setPaymentMethod] =
    useState("Cash on Delivery");

  // ===================================================
  // LOAD CHECKOUT ITEMS
  // ===================================================

  useEffect(() => {
    const loadCheckoutItems = async () => {
      try {
        if (items) {
          const parsedItems = JSON.parse(items);

          setCheckoutItems(
            Array.isArray(parsedItems)
              ? parsedItems
              : []
          );

          return;
        }

        if (productId) {
          const response = await fetch(
            `${API_URL}/api/products/${productId}`
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message || "Failed to get product"
            );
          }

          const buyNowItem = {
            id: String(data._id),
            name: data.name,
            price: Number(data.price),
            seller:
              data.seller ||
              data.sellerName ||
              data.shopName ||
              "Seller",
            sellerId: data.sellerId || "",
            category: data.category || "",
            stock: Number(data.stock),
            image: data.image || "",
            description: data.description || "",
            details: Array.isArray(data.details)
              ? data.details
              : [],
            quantity: Number(quantity) || 1,
          };

          setCheckoutItems([buyNowItem]);
        }
      } catch (error) {
        console.error(
          "Checkout loading error:",
          error
        );

        Alert.alert(
          "Error",
          "Failed to load the product for checkout."
        );
      }
    };

    loadCheckoutItems();
  }, [items, productId, quantity]);

  // ===================================================
  // LOAD CUSTOMER INFORMATION
  // ===================================================

  useFocusEffect(
    React.useCallback(() => {
      const loadCustomerInfo = async () => {
        try {
          setLoadingCustomer(true);

          const token =
            await AsyncStorage.getItem("token");

          if (!token) {
            setLoadingCustomer(false);
            return;
          }

          const response = await fetch(
            `${API_URL}/api/auth/me`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();

          if (!response.ok) {
            console.error(
              "Failed to load customer information:",
              data.message
            );

            setLoadingCustomer(false);
            return;
          }

          const user = data.user || data;
          console.log("USER FROM API:", JSON.stringify(user, null, 2));

          setCustomer({
            name:
              user.name ||
              user.fullName ||
              user.full_name ||
              user.username ||
              "No name",

            phone:
              user.phone ||
              user.phoneNumber ||
              user.phone_number ||
              user.mobile ||
              user.mobileNumber ||
              user.contactNumber ||
              "No phone number",

            address:
  user.address ||
  user.deliveryAddress ||
  user.delivery_address ||
  "No delivery address",

          });
        } catch (error) {
          console.error(
            "Customer information error:",
            error
          );
        } finally {
          setLoadingCustomer(false);
        }
      };

      loadCustomerInfo();
    }, [])
  );

  // ===================================================
  // PRICE CALCULATIONS
  // ===================================================

  const subtotal = checkoutItems.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  const deliveryFee = 49;

  const total = subtotal + deliveryFee;

  // ===================================================
  // FORMAT PRICE
  // ===================================================

  const formatPrice = (price) => {
    return `₱${Number(price || 0).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // ===================================================
  // EDIT ADDRESS
  // ===================================================

  const handleEditAddress = () => {
    router.push("/addresses");
  };

  // ===================================================
  // PLACE ORDER
  // ===================================================

  const handlePlaceOrder = async () => {
    try {
      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Login Required",
          "Please log in before placing an order."
        );

        return;
      }

      if (checkoutItems.length === 0) {
        Alert.alert(
          "No Products",
          "There are no products to checkout."
        );

        return;
      }

      if (
        !customer.address ||
        customer.address === "No delivery address"
      ) {
        Alert.alert(
          "Delivery Address Required",
          "Please add your delivery address before placing your order."
        );

        return;
      }

      
const isGCash = paymentMethod === "GCash";

const orderData = {
  customer: {
    name: customer.name,
    phone: customer.phone,
  },

  customerName: customer.name,
  customerPhone: customer.phone,

  items: checkoutItems.map((item) => ({
    productId: item.id,
    productName: item.name || "Product",
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 1),
    image: item.image || "",

    seller:
      typeof item.seller === "string"
        ? item.seller
        : item.seller?.name ||
          item.sellerName ||
          item.shopName ||
          "Seller",

    sellerId: item.sellerId || "",
  })),

  subtotal,
  deliveryFee,
  total,

  paymentMethod: isGCash ? "GCash" : "COD",
  paymentStatus: "Pending",

  // Use the status field read by the Orders screens.
  status: isGCash ? "To Pay" : "To Ship",

  // Keep this for compatibility if your backend uses it.
  orderStatus: isGCash ? "To Pay" : "To Ship",

  deliveryAddress: customer.address,
  createdAt: new Date().toISOString(),
};


      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(orderData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to place order"
        );
      }

      Alert.alert(
        "Order Placed!",
        isGCash
          ? "Your order has been placed. Please complete your GCash payment."
          : "Your order has been placed. The seller will now prepare your order.",
        [
          {
            text: "View Orders",

            onPress: () => {
              router.replace("/orders");
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "Place order error:",
        error
      );

      Alert.alert(
        "Order Failed",
        error.message ||
          "Unable to place your order. Please try again."
      );
    }
  };

  // ===================================================
  // PAYMENT OPTION
  // ===================================================

  const PaymentOption = ({
    title,
    subtitle,
    icon,
  }) => {
    const selected =
      paymentMethod === title;

    return (
      <Pressable
        style={[
          styles.paymentOption,
          selected &&
            styles.paymentOptionSelected,
        ]}
        onPress={() =>
          setPaymentMethod(title)
        }
      >
        <View style={styles.paymentLeft}>
          <View
            style={[
              styles.paymentIcon,
              selected &&
                styles.paymentIconSelected,
            ]}
          >
            <Ionicons
              name={icon}
              size={19}
              color={
                selected
                  ? "#FFFFFF"
                  : "#555555"
              }
            />
          </View>

          <View
            style={styles.paymentTextContainer}
          >
            <Text style={styles.paymentTitle}>
              {title}
            </Text>

            <Text style={styles.paymentSubtitle}>
              {subtitle}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.radioOuter,
            selected &&
              styles.radioOuterSelected,
          ]}
        >
          {selected && (
            <View style={styles.radioInner} />
          )}
        </View>
      </Pressable>
    );
  };

  // ===================================================
  // MAIN SCREEN
  // ===================================================

  return (
    <View style={styles.container}>

      {/* FIXED HEADER */}

      <View style={styles.fixedHeader}>
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
              Checkout
            </Text>

            <Text style={styles.headerSubtitle}>
              Complete your order
            </Text>
          </View>

          <View style={styles.headerSpacer} />

        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* DELIVERY ADDRESS */}

        <View style={styles.section}>

          <View style={styles.sectionHeader}>

            <View
              style={styles.sectionTitleRow}
            >
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color="#000000"
                />
              </View>

              <Text style={styles.sectionTitle}>
                Delivery Address
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                pressed &&
                  styles.editButtonPressed,
              ]}
              onPress={handleEditAddress}
            >
              <Ionicons
                name="create-outline"
                size={13}
                color="#000000"
              />

              <Text style={styles.editText}>
                Edit
              </Text>
            </Pressable>

          </View>

          <View style={styles.addressCard}>

            <View style={styles.addressTopRow}>

              <Text style={styles.customerName}>
                {loadingCustomer
                  ? "Loading..."
                  : customer.name}
              </Text>

              <Text style={styles.customerPhone}>
                {loadingCustomer
                  ? ""
                  : customer.phone}
              </Text>

            </View>

            <Text style={styles.addressText}>
              {loadingCustomer
                ? "Loading delivery address..."
                : customer.address}
            </Text>

          </View>

        </View>

        {/* PRODUCTS */}

        <View style={styles.section}>

          <View style={styles.sectionHeader}>

            <View
              style={styles.sectionTitleRow}
            >
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="bag-handle-outline"
                  size={18}
                  color="#000000"
                />
              </View>

              <Text style={styles.sectionTitle}>
                Products
              </Text>
            </View>

          </View>

          <View
            style={styles.productsContainer}
          >
            {checkoutItems.map((item) => {

              const itemTotal =
                Number(item.price || 0) *
                Number(item.quantity || 0);

              return (
                <View
                  key={item.id}
                  style={styles.productItem}
                >

                  <Image
                    source={{
                      uri: item.image || "",
                    }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />

                  <View
                    style={
                      styles.productInformation
                    }
                  >

                    <Text
                      style={styles.productCategory}
                    >
                      {String(
                        item.category || ""
                      ).toUpperCase()}
                    </Text>

                    <Text
                      style={styles.productName}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>

                    <Text
  style={styles.productSeller}
>
  {item.seller?.name}
</Text>

                    <Text
                      style={styles.productQuantity}
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
                      style={styles.productPrice}
                    >
                      {formatPrice(itemTotal)}
                    </Text>
                  </View>

                </View>
              );
            })}
          </View>

        </View>

        {/* PAYMENT METHOD */}

        <View style={styles.section}>

          <View style={styles.sectionHeader}>

            <View
              style={styles.sectionTitleRow}
            >
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="card-outline"
                  size={18}
                  color="#000000"
                />
              </View>

              <Text style={styles.sectionTitle}>
                Payment Method
              </Text>
            </View>

          </View>

          <View
            style={styles.paymentContainer}
          >

            <PaymentOption
              title="Cash on Delivery"
              subtitle="Pay when your order arrives"
              icon="cash-outline"
            />

            <PaymentOption
              title="GCash"
              subtitle="Pay using your GCash account"
              icon="phone-portrait-outline"
            />

          </View>

        </View>

        {/* ORDER SUMMARY */}

        <View
          style={styles.summaryContainer}
        >

          <Text style={styles.summaryTitle}>
            Order Summary
          </Text>

          <View style={styles.summaryRow}>

            <Text style={styles.summaryLabel}>
              Items
            </Text>

            <Text style={styles.summaryValue}>
              {checkoutItems.reduce(
                (total, item) =>
                  total +
                  Number(item.quantity || 0),
                0
              )}
            </Text>

          </View>

          <View style={styles.summaryRow}>

            <Text style={styles.summaryLabel}>
              Subtotal
            </Text>

            <Text style={styles.summaryValue}>
              {formatPrice(subtotal)}
            </Text>

          </View>

          <View style={styles.summaryRow}>

            <Text style={styles.summaryLabel}>
              Delivery Fee
            </Text>

            <Text style={styles.summaryValue}>
              {formatPrice(deliveryFee)}
            </Text>

          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>

            <View>

              <Text style={styles.totalLabel}>
                Total
              </Text>

              <Text style={styles.totalSubtext}>
                Including delivery fee
              </Text>

            </View>

            <Text style={styles.totalPrice}>
              {formatPrice(total)}
            </Text>

          </View>

        </View>

        {/* INFORMATION */}

        <View style={styles.infoBox}>

          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color="#777777"
          />

          <Text style={styles.infoText}>
            Your order information is securely
            handled by TechKeep.
          </Text>

        </View>

        <View style={{ height: 110 }} />

      </ScrollView>

      {/* BOTTOM PLACE ORDER */}

      <View
        style={styles.bottomCheckout}
      >

        <View style={styles.bottomTotal}>

          <Text
            style={styles.bottomTotalLabel}
          >
            Total
          </Text>

          <Text
            style={styles.bottomTotalPrice}
          >
            {formatPrice(total)}
          </Text>

        </View>

        <Pressable
          style={({ pressed }) => [
            styles.placeOrderButton,
            pressed &&
              styles.placeOrderButtonPressed,
          ]}
          onPress={handlePlaceOrder}
        >

          <Text
            style={styles.placeOrderText}
          >
            Place Order
          </Text>

          <Ionicons
            name="arrow-forward"
            size={18}
            color="#FFFFFF"
          />

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

  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 12,
    backgroundColor: "#F7F7F7",
    zIndex: 10,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 120,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  headerTitleContainer: {
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000000",
  },

  headerSubtitle: {
    fontSize: 10,
    color: "#888888",
    marginTop: 2,
  },

  headerSpacer: {
    width: 43,
  },

  section: {
    marginBottom: 14,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111111",
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    gap: 4,
  },

  editButtonPressed: {
    opacity: 0.6,
  },

  editText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000000",
  },

  itemCount: {
    fontSize: 10,
    color: "#888888",
  },

  addressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  addressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  customerName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#111111",
  },

  customerPhone: {
    fontSize: 10,
    color: "#777777",
  },

  addressText: {
    fontSize: 11,
    lineHeight: 17,
    color: "#777777",
  },

  productsContainer: {
    gap: 9,
  },

  productItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  productImage: {
    width: 70,
    height: 70,
    borderRadius: 11,
    backgroundColor: "#F2F2F2",
  },

  productInformation: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 7,
  },

  productCategory: {
    fontSize: 8,
    fontWeight: "700",
    color: "#999999",
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  productName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111111",
    lineHeight: 16,
  },

  productSeller: {
    fontSize: 9,
    color: "#888888",
    marginTop: 3,
  },

  productQuantity: {
    fontSize: 9,
    color: "#777777",
    marginTop: 5,
  },

  productPriceContainer: {
    width: 75,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  productPrice: {
    fontSize: 11,
    fontWeight: "800",
    color: "#111111",
    textAlign: "right",
  },

  unitPrice: {
    fontSize: 8,
    color: "#999999",
    marginTop: 4,
    textAlign: "right",
  },

  eachText: {
    fontSize: 8,
    color: "#999999",
    textAlign: "right",
  },

  paymentContainer: {
    gap: 9,
  },

  paymentOption: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  paymentOptionSelected: {
    borderColor: "#000000",
  },

  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  paymentIconSelected: {
    backgroundColor: "#000000",
  },

  paymentTextContainer: {
    flex: 1,
  },

  paymentTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111111",
  },

  paymentSubtitle: {
    fontSize: 9,
    color: "#888888",
    marginTop: 3,
  },

  radioOuter: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#BBBBBB",
    alignItems: "center",
    justifyContent: "center",
  },

  radioOuterSelected: {
    borderColor: "#000000",
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#000000",
  },

  summaryContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginTop: 1,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 14,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  summaryLabel: {
    fontSize: 11,
    color: "#888888",
  },

  summaryValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333333",
  },

  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 8,
  },

  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#000000",
  },

  totalSubtext: {
    fontSize: 9,
    color: "#999999",
    marginTop: 2,
  },

  totalPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000000",
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F1F1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },

  infoText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    color: "#777777",
    marginLeft: 7,
  },

  bottomCheckout: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 82,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  bottomTotal: {
    flex: 1,
  },

  bottomTotalLabel: {
    fontSize: 10,
    color: "#888888",
  },

  bottomTotalPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000000",
    marginTop: 2,
  },

  placeOrderButton: {
    height: 50,
    paddingHorizontal: 20,
    backgroundColor: "#000000",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  placeOrderButtonPressed: {
    opacity: 0.8,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  placeOrderText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginRight: 7,
  },
});