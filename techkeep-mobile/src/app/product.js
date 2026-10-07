import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

const API_URL = "http://https://howard-cigarette-standings-february.trycloudflare.com";

export default function ProductScreen() {
  const { id } = useLocalSearchParams();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // =====================================================
  // GET PRODUCT FROM BACKEND
  // =====================================================

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/products/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to get product"
          );
        }

        setProduct(data);
      } catch (error) {
        console.error(error);

        Alert.alert(
          "Error",
          "Failed to load product."
        );
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // =====================================================
  // QUANTITY CONTROLS
  // =====================================================

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  // =====================================================
  // ADD TO BASKET
  // =====================================================

  const handleAddToBasket = async () => {
    if (!product) {
      return;
    }

    try {
      const storedCart = await AsyncStorage.getItem("cart");

      const cart = storedCart
        ? JSON.parse(storedCart)
        : [];

      const existingIndex = cart.findIndex(
        (item) =>
          String(item.id) === String(product._id)
      );

      const cartProduct = {
        id: String(product._id),
        name: product.name,
        price: Number(product.price),
        seller:
          product.seller ||
          product.sellerName ||
          product.shopName ||
          "Seller",
        sellerId: product.sellerId || "",
        category: product.category,
        stock: Number(product.stock),
        image: product.image || "",
        description: product.description || "",
        details: Array.isArray(product.details)
          ? product.details
          : [],
        quantity,
      };

      if (existingIndex >= 0) {
        const newQuantity =
          cart[existingIndex].quantity + quantity;

        cart[existingIndex].quantity =
          Math.min(newQuantity, product.stock);
      } else {
        cart.push(cartProduct);
      }

      await AsyncStorage.setItem(
        "cart",
        JSON.stringify(cart)
      );

      Alert.alert(
        "Added to Basket",
        `${quantity} ${product.name} added to your basket.`,
        [
          {
            text: "Continue Shopping",
            style: "cancel",
          },
          {
            text: "View Basket",
            onPress: () => router.push("/cart"),
          },
        ]
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Error",
        "Failed to add product to basket."
      );
    }
  };

  // =====================================================
  // BUY NOW
  // =====================================================

  const handleBuyNow = () => {
    if (!product) {
      return;
    }

    router.push({
      pathname: "/checkout",
      params: {
        productId: String(product._id),
        quantity: String(quantity),
      },
    });
  };

  // =====================================================
  // WAIT FOR PRODUCT
  // =====================================================

  if (!product) {
    return null;
  }

  // =====================================================
  // TOTAL PRICE
  // =====================================================

  const totalPrice = product.price * quantity;

  return (
    <View style={styles.container}>

      {/* =================================================
          FIXED TOP HEADER
      ================================================= */}

      <View style={styles.fixedHeader}>

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

        <Text style={styles.headerTitle}>
          Product Details
        </Text>

        <Pressable
          style={styles.headerButton}
          onPress={() => router.push("/cart")}
        >
          <Ionicons
            name="bag-handle-outline"
            size={22}
            color="#000000"
          />
        </Pressable>

      </View>

      {/* =================================================
          SCROLLABLE CONTENT
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* =================================================
            PRODUCT IMAGE
        ================================================= */}

        <View style={styles.imageContainer}>

          <Image
            source={{
              uri: product.image,
            }}
            style={styles.productImage}
            resizeMode="cover"
          />

          <View style={styles.categoryBadge}>

            <Text style={styles.categoryBadgeText}>
              {String(
                product.category || ""
              ).toUpperCase()}
            </Text>

          </View>

        </View>

        {/* =================================================
            PRODUCT INFORMATION
        ================================================= */}

        <View style={styles.productInfo}>

          <View style={styles.sellerRow}>

            <View style={styles.sellerIcon}>

              <Ionicons
                name="storefront-outline"
                size={15}
                color="#555555"
              />

            </View>

            <Text style={styles.sellerText}>
              {product.seller ||
                product.sellerName ||
                product.shopName ||
                "Seller"}
            </Text>

          </View>

          <Text style={styles.productName}>
            {product.name}
          </Text>

          <Text style={styles.productPrice}>
            ₱
            {Number(product.price).toLocaleString(
              "en-PH",
              {
                minimumFractionDigits: 2,
              }
            )}
          </Text>

          <View style={styles.stockRow}>

            <View style={styles.stockDot} />

            <Text style={styles.stockText}>
              {product.stock} items available
            </Text>

          </View>

        </View>

        {/* =================================================
            DESCRIPTION
        ================================================= */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Description
          </Text>

          <Text style={styles.description}>
            {product.description}
          </Text>

        </View>

        {/* =================================================
            PRODUCT DETAILS
        ================================================= */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Product Details
          </Text>

          <View style={styles.detailsContainer}>

            {(Array.isArray(product.details)
              ? product.details
              : []
            ).map((detail, index) => (

              <View
                key={index}
                style={styles.detailRow}
              >

                <View
                  style={styles.detailBullet}
                />

                <Text
                  style={styles.detailText}
                >
                  {detail}
                </Text>

              </View>

            ))}

          </View>

        </View>

        {/* =================================================
            QUANTITY
        ================================================= */}

        <View style={styles.quantitySection}>

          <View>

            <Text style={styles.quantityTitle}>
              Quantity
            </Text>

            <Text style={styles.quantityStock}>
              Max. {product.stock} items
            </Text>

          </View>

          <View style={styles.quantityControl}>

            <Pressable
              style={styles.quantityButton}
              onPress={decreaseQuantity}
            >

              <Ionicons
                name="remove"
                size={18}
                color="#000000"
              />

            </Pressable>

            <Text style={styles.quantityNumber}>
              {quantity}
            </Text>

            <Pressable
              style={styles.quantityButton}
              onPress={increaseQuantity}
            >

              <Ionicons
                name="add"
                size={18}
                color="#000000"
              />

            </Pressable>

          </View>

        </View>

        {/* =================================================
            ORDER SUMMARY
        ================================================= */}

        <View style={styles.summaryContainer}>

          <Text style={styles.summaryLabel}>
            Total
          </Text>

          <Text style={styles.summaryPrice}>
            ₱
            {totalPrice.toLocaleString(
              "en-PH",
              {
                minimumFractionDigits: 2,
              }
            )}
          </Text>

        </View>

        <View style={{ height: 30 }} />

      </ScrollView>

      {/* =================================================
          FIXED BOTTOM ACTIONS
      ================================================= */}

      <View style={styles.bottomActions}>

        <Pressable
          style={styles.basketButton}
          onPress={handleAddToBasket}
        >

          <Ionicons
            name="bag-add-outline"
            size={20}
            color="#000000"
          />

        </Pressable>

        <Pressable
          style={styles.buyButton}
          onPress={handleBuyNow}
        >

          <Text style={styles.buyButtonText}>
            Buy Now
          </Text>

          <Ionicons
            name="arrow-forward"
            size={19}
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

  // ===================================================
  // FIXED HEADER
  // ===================================================

  fixedHeader: {
  paddingHorizontal: 20,
  paddingTop: 55,
  paddingBottom: 12,
  backgroundColor: "#F7F7F7",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  zIndex: 10,
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

  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#000000",
  },

  // ===================================================
  // SCROLL CONTENT
  // ===================================================

  scrollContent: {
  paddingHorizontal: 20,
  paddingTop: 6,
  paddingBottom: 125,
},

  imageContainer: {
    height: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  categoryBadge: {
    position: "absolute",
    left: 15,
    top: 15,
    backgroundColor: "#000000",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
  },

  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  productInfo: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginTop: 14,
  },

  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  sellerIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
  },

  sellerText: {
    fontSize: 11,
    color: "#777777",
    marginLeft: 8,
    fontWeight: "600",
  },

  productName: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "800",
    color: "#111111",
    marginTop: 12,
  },

  productPrice: {
    fontSize: 21,
    fontWeight: "800",
    color: "#000000",
    marginTop: 9,
  },

  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  stockDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#000000",
    marginRight: 6,
  },

  stockText: {
    fontSize: 11,
    color: "#777777",
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginTop: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000000",
  },

  description: {
    fontSize: 13,
    lineHeight: 20,
    color: "#777777",
    marginTop: 9,
  },

  detailsContainer: {
    marginTop: 11,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  detailBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#000000",
    marginRight: 9,
  },

  detailText: {
    fontSize: 12,
    color: "#666666",
  },

  quantitySection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  quantityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
  },

  quantityStock: {
    fontSize: 10,
    color: "#999999",
    marginTop: 4,
  },

  quantityControl: {
    height: 43,
    backgroundColor: "#F3F3F3",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  quantityButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  quantityNumber: {
    width: 34,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },

  summaryContainer: {
    backgroundColor: "#000000",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryLabel: {
    color: "#AAAAAA",
    fontSize: 12,
    fontWeight: "600",
  },

  summaryPrice: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  // ===================================================
  // FIXED BOTTOM ACTIONS
  // ===================================================

  bottomActions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 92,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  basketButton: {
    width: 58,
    height: 53,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },

  buyButton: {
    flex: 1,
    height: 53,
    backgroundColor: "#000000",
    borderRadius: 27,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  buyButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginRight: 7,
  },

});

