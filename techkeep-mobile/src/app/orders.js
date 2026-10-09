import React, { useCallback, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";


const API_URL = "https://backend-2-h20j.onrender.com";


const tabs = [
  "All",
  "To Pay",
  "To Ship",
  "To Receive",
  "Completed",
  "Cancelled",
];


function formatPrice(price) {
  return `₱${Number(price || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}


function formatOrderDate(date) {
  if (!date) return "Date unavailable";


  const parsedDate = new Date(date);


  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }


  return parsedDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}


function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .trim();
}


function getDisplayStatus(order) {
  const rawStatus = normalizeText(order.status);
  const paymentMethod = normalizeText(order.paymentMethod);
  const isGCash =
    paymentMethod.includes("gcash") ||
    paymentMethod.includes("g cash");


  if (
    ["cancelled", "canceled"].includes(rawStatus)
  ) {
    return "Cancelled";
  }


  if (
    ["completed", "delivered"].includes(rawStatus)
  ) {
    return "Completed";
  }


  if (
    [
      "out for delivery",
      "to receive",
      "to receive order",
    ].includes(rawStatus)
  ) {
    return "To Receive";
  }


  if (
    [
      "seller preparing",
      "processing",
      "to ship",
      "to shipped",
      "shipped",
    ].includes(rawStatus)
  ) {
    return "To Ship";
  }


  if (
    [
      "to pay",
      "unpaid",
      "pending payment",
    ].includes(rawStatus)
  ) {
    return isGCash ? "To Pay" : "Order Placed";
  }


  if (
    [
      "pending",
      "order placed",
      "placed",
      "",
    ].includes(rawStatus)
  ) {
    if (isGCash) {
      const paymentStatus = normalizeText(
        order.paymentStatus
      );


      const isPaid = [
        "paid",
        "completed",
        "successful",
        "success",
      ].includes(paymentStatus);


      return isPaid ? "To Ship" : "To Pay";
    }


    return "Order Placed";
  }


  return order.status || "Order Placed";
}


function getStatusIcon(status) {
  switch (status) {
    case "Order Placed":
      return "receipt-outline";
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
    case "Order Placed":
      return {
        background: "#F1F1F1",
        border: "#D5D5D5",
        text: "#555555",
      };
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



function getSellerDisplayName(seller) {
  if (!seller) return "";

  if (typeof seller === "string") {
    const value = seller.trim();

    if (/^\d+$/.test(value) || /^[a-f\d]{24}$/i.test(value)) {
      return "";
    }

    return value;
  }

  if (typeof seller === "object") {
    return (
      getSellerDisplayName(seller.name) ||
      getSellerDisplayName(seller.shopName) ||
      getSellerDisplayName(seller.storeName) ||
      getSellerDisplayName(seller.username) ||
      getSellerDisplayName(seller.businessName) ||
      ""
    );
  }

  return "";
}


async function getOrderProductImage(item) {
  let image =
    item?.image ||
    item?.productImage ||
    item?.product?.image ||
    "";

  if (image && typeof image === "object") {
    image = image.url || image.uri || "";
  }

  if (image) return image;

  const productId =
    item?.productId ||
    item?.product?._id ||
    (typeof item?.product === "string" ? item.product : null) ||
    item?.id;

  if (!productId) return "";

  try {
    const response = await fetch(
      `${API_URL}/api/products/${productId}`
    );

    if (!response.ok) {
      console.log(
        "Could not load product image:",
        productId,
        response.status
      );
      return "";
    }

    const data = await response.json();
    const product = data.product || data;

    const productImage =
      product.image ||
      product.imageUrl ||
      product.images?.[0] ||
      "";

    if (typeof productImage === "string") {
      return productImage;
    }

    return productImage?.url || productImage?.uri || "";
  } catch (error) {
    console.error("ORDER PRODUCT IMAGE ERROR:", error);
    return "";
  }
}


async function getOrderProductSellerName(item) {
  const existingName =
    getSellerDisplayName(item?.seller) ||
    getSellerDisplayName(item?.sellerName) ||
    getSellerDisplayName(item?.shopName);

  if (existingName) return existingName;

  const productId =
    item?.productId ||
    item?.product?._id ||
    (typeof item?.product === "string" ? item.product : null) ||
    item?.id;

  if (!productId) return "";

  try {
    const response = await fetch(
      `${API_URL}/api/products/${productId}`
    );

    if (!response.ok) return "";

    const data = await response.json();
    const product = data.product || data;

    return (
      getSellerDisplayName(product.seller) ||
      getSellerDisplayName(product.sellerName) ||
      getSellerDisplayName(product.shopName) ||
      getSellerDisplayName(product.storeName) ||
      ""
    );
  } catch (error) {
    console.error("Load seller name error:", error);
    return "";
  }
}


export default function Orders() {
  const router = useRouter();


  const [selectedTab, setSelectedTab] = useState("All");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);


  
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadOrders = async () => {
        setLoading(true);

        try {
          const token = await AsyncStorage.getItem("token");

          if (!token) {
            if (isActive) {
              setOrders([]);
            }
            return;
          }

          const response = await fetch(
            `${API_URL}/api/orders/mine`,
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
              data.message || "Failed to get orders"
            );
          }

          const rawOrders = Array.isArray(data)
            ? data
            : Array.isArray(data.orders)
            ? data.orders
            : [];

          
const normalizedOrders = await Promise.all(
  rawOrders.map(async (order) => {
    const items = await Promise.all(
      (Array.isArray(order.items) ? order.items : []).map(
        async (item) => {
          const [image, sellerName] = await Promise.all([
            getOrderProductImage(item),
            getOrderProductSellerName(item),
          ]);

          return {
            ...item,
            image,
            sellerName,
          };
        }
      )
    );

    

const calculatedSubtotal = items.reduce(
  (sum, item) =>
    sum +
    Number(item.price || 0) * Number(item.quantity || 1),
  0
);

const savedSubtotal = Number(order.subtotal);

const subtotal =
  order.subtotal != null &&
  Number.isFinite(savedSubtotal)
    ? savedSubtotal
    : calculatedSubtotal;

const savedFee = Number(order.deliveryFee);

const deliveryFee =
  order.deliveryFee != null &&
  Number.isFinite(savedFee) &&
  savedFee > 0
    ? savedFee
    : 49;

const total = subtotal + deliveryFee;

return {
  ...order,
  subtotal,
  deliveryFee,
  total,
  displayStatus: getDisplayStatus(order),
  paymentStatus: order.paymentStatus || "Pending",
  paymentMethod: order.paymentMethod || "",
  items,
};
  })
);

          if (isActive) {
            setOrders(normalizedOrders);
          }
        } catch (error) {
          console.error("Load orders error:", error);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      loadOrders();

      return () => {
        isActive = false;
      };
    }, [])
  );


  const filteredOrders = useMemo(() => {
    if (selectedTab === "All") {
      return orders;
    }


    return orders.filter((order) => {
      const status =
        order.displayStatus || getDisplayStatus(order);


      if (selectedTab === "To Ship") {
        return (
          status === "To Ship" ||
          status === "Order Placed"
        );
      }


      return status === selectedTab;
    });
  }, [selectedTab, orders]);


  const openOrderDetails = (order) => {
    router.push({
      pathname: "/order-details",
      params: {
        id: String(order._id),
      },
    });
  };


  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            Loading Orders...
          </Text>
        </View>
      </View>
    );
  }


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


        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            My Orders
          </Text>
          <Text style={styles.headerSubtitle}>
            Track and manage your purchases
          </Text>
        </View>


        <View style={styles.headerSpacer} />
      </View>


      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {tabs.map((tab) => {
            const isSelected = selectedTab === tab;


            return (
              <Pressable
                key={tab}
                style={[
                  styles.tab,
                  isSelected && styles.selectedTab,
                ]}
                onPress={() => setSelectedTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    isSelected && styles.selectedTabText,
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>


      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="receipt-outline"
                size={42}
                color="#999999"
              />
            </View>


            <Text style={styles.emptyTitle}>
              No Orders Yet
            </Text>


            <Text style={styles.emptyText}>
              You don't have any orders under this category.
            </Text>


            <Pressable
              style={styles.shopButton}
              onPress={() => router.replace("/home")}
            >
              <Text style={styles.shopButtonText}>
                Start Shopping
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const status =
              order.displayStatus || getDisplayStatus(order);


            const statusColors = getStatusColors(status);
            const firstItem = order.items?.[0];


            const additionalProducts = Math.max(
              (order.items?.length || 0) - 1,
              0
            );


            
const sellerName =
  getSellerDisplayName(firstItem?.sellerName) ||
  getSellerDisplayName(firstItem?.shopName) ||
  getSellerDisplayName(firstItem?.seller) ||
  "Seller";

            return (
              <Pressable
                key={String(order._id)}
                style={styles.orderCard}
                onPress={() => openOrderDetails(order)}
              >
                <View style={styles.orderTop}>
                  <View style={styles.orderBasicInfo}>
                    <Text
                      style={styles.orderNumber}
                      numberOfLines={1}
                    >
                      {order._id}
                    </Text>


                    <Text style={styles.orderDate}>
                      {formatOrderDate(order.createdAt)}
                    </Text>
                  </View>


                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          statusColors.background,
                        borderColor: statusColors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getStatusIcon(status)}
                      size={13}
                      color={statusColors.text}
                    />


                    <Text
                      style={[
                        styles.statusText,
                        { color: statusColors.text },
                      ]}
                    >
                      {status}
                    </Text>
                  </View>
                </View>


                <View style={styles.sellerRow}>
                  <Ionicons
                    name="storefront-outline"
                    size={16}
                    color="#555555"
                  />


                  <Text
                    style={styles.sellerName}
                    numberOfLines={1}
                  >
                    {sellerName}
                  </Text>


                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color="#AAAAAA"
                  />
                </View>


                <View style={styles.productPreview}>
                  {firstItem?.image ? (
                    <Image
                      source={{ uri: firstItem.image }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={styles.productImagePlaceholder}
                    >
                      <Ionicons
                        name="image-outline"
                        size={25}
                        color="#AAAAAA"
                      />
                    </View>
                  )}


                  <View style={styles.productInfo}>
                    <Text
                      style={styles.productName}
                      numberOfLines={2}
                    >
                      {firstItem?.productName ||
                        firstItem?.name ||
                        "Product"}
                    </Text>


                    <Text style={styles.productQuantity}>
                      Qty: {firstItem?.quantity || 0}
                    </Text>


                    {additionalProducts > 0 && (
                      <Text style={styles.moreProductsText}>
                        +{additionalProducts}{" "}
                        {additionalProducts === 1
                          ? "more product"
                          : "more products"}
                      </Text>
                    )}
                  </View>


                  <Text style={styles.itemPrice}>
                    {formatPrice(firstItem?.price || 0)}
                  </Text>
                </View>


                <View style={styles.orderBottom}>
                  <View>
                    <Text style={styles.totalLabel}>
                      Order Total
                    </Text>


                    <Text style={styles.totalPrice}>
                      {formatPrice(order.total)}
                    </Text>
                  </View>


                  <Pressable
                    style={styles.detailsButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      openOrderDetails(order);
                    }}
                  >
                    <Text style={styles.detailsButtonText}>
                      View Details
                    </Text>


                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color="#FFFFFF"
                    />
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}


        <View style={{ height: 25 }} />
      </ScrollView>


      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/home")}
        >
          <Ionicons
            name="home-outline"
            size={23}
            color="#777777"
          />
          <Text style={styles.navText}>Home</Text>
        </Pressable>


        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/search")}
        >
          <Ionicons
            name="search-outline"
            size={23}
            color="#777777"
          />
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
          <Ionicons
            name="receipt"
            size={23}
            color="#000000"
          />
          <Text style={styles.activeNavText}>Orders</Text>
        </Pressable>


        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/profile")}
        >
          <Ionicons
            name="person-outline"
            size={23}
            color="#777777"
          />
          <Text style={styles.navText}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}


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
    fontSize: 22,
    fontWeight: "800",
    color: "#000000",
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#777777",
  },
  headerSpacer: {
    width: 42,
  },
  tabsWrapper: {
    backgroundColor: "#F7F7F7",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },
  selectedTab: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555555",
  },
  selectedTabText: {
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 115,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E7E7E7",
  },
  orderTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  orderBasicInfo: {
    flex: 1,
    paddingRight: 10,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111111",
  },
  orderDate: {
    marginTop: 4,
    fontSize: 10,
    color: "#888888",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  sellerName: {
    flex: 1,
    marginLeft: 7,
    marginRight: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#333333",
  },
  productPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 9,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
  },
  productImage: {
    width: 58,
    height: 58,
    borderRadius: 9,
    backgroundColor: "#EEEEEE",
  },
  productImagePlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 9,
    backgroundColor: "#EEEEEE",
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 8,
  },
  productName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111111",
    lineHeight: 17,
  },
  productQuantity: {
    marginTop: 4,
    fontSize: 10,
    color: "#888888",
  },
  moreProductsText: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "700",
    color: "#555555",
  },
  itemPrice: {
    fontSize: 11,
    fontWeight: "700",
    color: "#333333",
    textAlign: "right",
  },
  orderBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  totalLabel: {
    fontSize: 9,
    color: "#888888",
  },
  totalPrice: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "800",
    color: "#000000",
  },
  detailsButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  detailsButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyState: {
    minHeight: 420,
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

