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
import { router } from "expo-router";

// =====================================================
// CART SCREEN
// =====================================================

export default function CartScreen() {

  // ===================================================
  // CART ITEMS
  // ===================================================

  const [cartItems, setCartItems] = useState([]);

  // ===================================================
  // LOAD CART FROM ASYNCSTORAGE
  // ===================================================

  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart =
          await AsyncStorage.getItem("cart");

        if (storedCart) {
          const cart = JSON.parse(storedCart);

          const updatedCart = cart.map((item) => ({
            ...item,
            selected:
              item.selected !== undefined
                ? item.selected
                : true,
          }));

          setCartItems(updatedCart);
        }
      } catch (error) {
        console.error(
          "Failed to load cart:",
          error
        );
      }
    };

    loadCart();
  }, []);

  // ===================================================
  // SAVE CART TO ASYNCSTORAGE
  // ===================================================

  const saveCart = async (updatedCart) => {
    try {
      setCartItems(updatedCart);

      await AsyncStorage.setItem(
        "cart",
        JSON.stringify(updatedCart)
      );
    } catch (error) {
      console.error(
        "Failed to save cart:",
        error
      );
    }
  };

  // ===================================================
  // SELECT / DESELECT PRODUCT
  // ===================================================

  const toggleItemSelection = (id) => {
    const updatedCart = cartItems.map((item) =>
      item.id === id
        ? {
            ...item,
            selected: !item.selected,
          }
        : item
    );

    saveCart(updatedCart);
  };

  // ===================================================
  // SELECT ALL / DESELECT ALL
  // ===================================================

  const allSelected =
    cartItems.length > 0 &&
    cartItems.every((item) => item.selected);

  const toggleSelectAll = () => {
    const updatedCart = cartItems.map((item) => ({
      ...item,
      selected: !allSelected,
    }));

    saveCart(updatedCart);
  };

  // ===================================================
  // INCREASE QUANTITY
  // ===================================================

  const increaseQuantity = (id) => {
    const updatedCart = cartItems.map((item) => {
      if (item.id !== id) {
        return item;
      }

      if (item.quantity >= item.stock) {
        Alert.alert(
          "Maximum Quantity",
          `Only ${item.stock} items are available.`
        );

        return item;
      }

      return {
        ...item,
        quantity: item.quantity + 1,
      };
    });

    saveCart(updatedCart);
  };

  // ===================================================
  // DECREASE QUANTITY
  // ===================================================

  const decreaseQuantity = (id) => {
    const updatedCart = cartItems.map((item) => {
      if (item.id !== id) {
        return item;
      }

      if (item.quantity <= 1) {
        return item;
      }

      return {
        ...item,
        quantity: item.quantity - 1,
      };
    });

    saveCart(updatedCart);
  };

  // ===================================================
  // REMOVE ONE PRODUCT
  // ===================================================

  const removeItem = (id) => {
    Alert.alert(
      "Remove Product",
      "Are you sure you want to remove this product from your basket?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const updatedCart =
              cartItems.filter(
                (item) => item.id !== id
              );

            saveCart(updatedCart);
          },
        },
      ]
    );
  };

  // ===================================================
  // REMOVE ALL PRODUCTS
  // ===================================================

  const clearBasket = () => {
    if (cartItems.length === 0) {
      return;
    }

    Alert.alert(
      "Clear Basket",
      "Remove all products from your basket?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Remove All",
          style: "destructive",
          onPress: () => {
            saveCart([]);
          },
        },
      ]
    );
  };

  // ===================================================
  // SELECTED ITEMS
  // ===================================================

  const selectedItems = cartItems.filter(
    (item) => item.selected
  );

  // ===================================================
  // SELECTED QUANTITY
  // ===================================================

  const selectedQuantity = selectedItems.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  // ===================================================
  // SELECTED TOTAL
  // ===================================================

  const selectedTotal = selectedItems.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  // ===================================================
  // FORMAT PRICE
  // ===================================================

  const formatPrice = (price) =>
    `₱${Number(price).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;

  // ===================================================
  // CHECKOUT
  // ===================================================

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      Alert.alert(
        "No Products Selected",
        "Please select at least one product before checking out."
      );

      return;
    }

    router.push({
      pathname: "/checkout",
      params: {
        items: JSON.stringify(selectedItems),
      },
    });
  };

  // ===================================================
  // EMPTY CART
  // ===================================================

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>

        <View style={styles.emptyHeader}>

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

          <View style={styles.emptyHeaderTitle}>

            <Text style={styles.headerTitle}>
              My Basket
            </Text>

            <Text style={styles.headerSubtitle}>
              0 products
            </Text>

          </View>

          <View style={styles.headerSpacer} />

        </View>

        <View style={styles.emptyPage}>

          <View style={styles.emptyIcon}>

            <Ionicons
              name="bag-handle-outline"
              size={40}
              color="#777777"
            />

          </View>

          <Text style={styles.emptyTitle}>
            Your basket is empty
          </Text>

          <Text style={styles.emptyText}>
            Products you add to your basket
            will appear here.
          </Text>

          <Pressable
            style={styles.shopButton}
            onPress={() =>
              router.replace("/home")
            }
          >

            <Text style={styles.shopButtonText}>
              Start Shopping
            </Text>

            <Ionicons
              name="arrow-forward"
              size={17}
              color="#FFFFFF"
            />

          </Pressable>

        </View>

        <BottomNavigation />

      </View>
    );
  }

  // ===================================================
  // MAIN CART SCREEN
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

          <View style={styles.headerTitleContainer}>

            <Text style={styles.headerTitle}>
              My Basket
            </Text>

            <Text style={styles.headerSubtitle}>
              {cartItems.length}{" "}
              {cartItems.length === 1
                ? "product"
                : "products"}
            </Text>

          </View>

          <Pressable
            style={styles.headerButton}
            onPress={clearBasket}
          >

            <Ionicons
              name="trash-outline"
              size={21}
              color="#000000"
            />

          </Pressable>

        </View>

      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* SELECT ALL */}

        <View style={styles.selectAllContainer}>

          <Pressable
            style={styles.selectAllLeft}
            onPress={toggleSelectAll}
          >

            <View
              style={[
                styles.checkbox,
                allSelected &&
                  styles.checkboxSelected,
              ]}
            >

              {allSelected && (
                <Ionicons
                  name="checkmark"
                  size={15}
                  color="#FFFFFF"
                />
              )}

            </View>

            <Text style={styles.selectAllText}>
              {allSelected
                ? "Deselect All"
                : "Select All"}
            </Text>

          </Pressable>

          <Text style={styles.selectedText}>
            {selectedItems.length} selected
          </Text>

        </View>

        {/* CART ITEMS */}

        <View style={styles.itemsContainer}>

          {cartItems.map((item) => {

            const itemSelected =
              item.selected;

            const itemTotal =
              item.price * item.quantity;

            return (
              <View
                key={item.id}
                style={[
                  styles.cartItem,
                  itemSelected &&
                    styles.selectedCartItem,
                ]}
              >

                {/* CHECKBOX */}

                <Pressable
                  style={styles.checkboxArea}
                  onPress={() =>
                    toggleItemSelection(item.id)
                  }
                >

                  <View
                    style={[
                      styles.checkbox,
                      itemSelected &&
                        styles.checkboxSelected,
                    ]}
                  >

                    {itemSelected && (
                      <Ionicons
                        name="checkmark"
                        size={15}
                        color="#FFFFFF"
                      />
                    )}

                  </View>

                </Pressable>

                {/* PRODUCT IMAGE */}

                <Pressable
                  style={styles.itemImageContainer}
                  onPress={() =>
                    router.push({
                      pathname: "/product",
                      params: {
                        id: item.id,
                      },
                    })
                  }
                >

                  <Image
                    source={{
                      uri: item.image,
                    }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />

                </Pressable>

                {/* PRODUCT INFORMATION */}

                <View style={styles.itemInformation}>

                  <Text style={styles.itemCategory}>
                    {String(
                      item.category || ""
                    ).toUpperCase()}
                  </Text>

                  <Text
                    style={styles.itemName}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>

                  <Text style={styles.itemSeller}>
                    {item.seller}
                  </Text>

                  <Text
                    style={styles.itemPrice}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {formatPrice(item.price)}
                  </Text>

                  {/* QUANTITY */}

                  <View style={styles.quantityControl}>

                    <Pressable
                      style={styles.quantityButton}
                      onPress={() =>
                        decreaseQuantity(item.id)
                      }
                    >

                      <Ionicons
                        name="remove"
                        size={15}
                        color="#000000"
                      />

                    </Pressable>

                    <Text
                      style={styles.quantityNumber}
                    >
                      {item.quantity}
                    </Text>

                    <Pressable
                      style={styles.quantityButton}
                      onPress={() =>
                        increaseQuantity(item.id)
                      }
                    >

                      <Ionicons
                        name="add"
                        size={15}
                        color="#000000"
                      />

                    </Pressable>

                  </View>

                </View>

                {/* RIGHT SIDE */}

                <View style={styles.itemRightColumn}>

                  <Pressable
                    style={styles.deleteButton}
                    onPress={() =>
                      removeItem(item.id)
                    }
                  >

                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#777777"
                    />

                  </Pressable>

                </View>

              </View>
            );
          })}

        </View>

        {/* SELECTION INFORMATION */}

        <View style={styles.selectionInfo}>

          <Ionicons
            name="information-circle-outline"
            size={17}
            color="#777777"
          />

          <Text style={styles.selectionInfoText}>
            Only selected products will be included
            in your checkout total.
          </Text>

        </View>

        {/* ORDER SUMMARY */}

        <View style={styles.summaryContainer}>

          <Text style={styles.summaryTitle}>
            Order Summary
          </Text>

          <View style={styles.summaryRow}>

            <Text style={styles.summaryLabel}>
              Selected Products
            </Text>

            <Text style={styles.summaryValue}>
              {selectedItems.length}
            </Text>

          </View>

          <View style={styles.summaryRow}>

            <Text style={styles.summaryLabel}>
              Total Items
            </Text>

            <Text style={styles.summaryValue}>
              {selectedQuantity}
            </Text>

          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>

            <Text style={styles.totalLabel}>
              Total
            </Text>

            <Text style={styles.totalPrice}>
              {formatPrice(selectedTotal)}
            </Text>

          </View>

        </View>

        <View style={{ height: 20 }} />

      </ScrollView>

      {/* BOTTOM CHECKOUT */}

      <View style={styles.bottomCheckout}>

        <View style={styles.bottomTotal}>

          <Text style={styles.bottomTotalLabel}>
            Total
          </Text>

          <Text style={styles.bottomTotalPrice}>
            {formatPrice(selectedTotal)}
          </Text>

        </View>

        <Pressable
          style={[
            styles.checkoutButton,
            selectedItems.length === 0 &&
              styles.checkoutButtonDisabled,
          ]}
          onPress={handleCheckout}
        >

          <Text style={styles.checkoutButtonText}>
            Checkout
          </Text>

          <Ionicons
            name="arrow-forward"
            size={18}
            color="#FFFFFF"
          />

        </Pressable>

      </View>

      <BottomNavigation />

    </View>
  );
}

// =====================================================
// BOTTOM NAVIGATION
// =====================================================

function BottomNavigation() {
  return (
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
          router.replace("/search")
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
          router.replace("/cart")
        }
      >

        <Ionicons
          name="bag-handle"
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
          color="#777777"
        />

        <Text style={styles.navText}>
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
    zIndex: 10,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 205,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
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

  // ===================================================
  // EMPTY CART HEADER
  // ===================================================

  emptyHeader: {
    height: 90,
    paddingHorizontal: 20,
    paddingTop: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7F7F7",
  },

  emptyHeaderTitle: {
    alignItems: "center",
  },

  // ===================================================
  // SELECT ALL
  // ===================================================

  selectAllContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  selectAllLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkboxArea: {
    paddingRight: 9,
    paddingVertical: 5,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#BBBBBB",
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxSelected: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },

  selectAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#222222",
    marginLeft: 8,
  },

  selectedText: {
    fontSize: 10,
    color: "#888888",
  },

  // ===================================================
  // CART ITEMS
  // ===================================================

  itemsContainer: {
    gap: 10,
  },

  cartItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 10,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    minHeight: 125,
  },

  selectedCartItem: {
    borderColor: "#000000",
  },

  itemImageContainer: {
    width: 90,
    height: 105,
    backgroundColor: "#F3F3F3",
    borderRadius: 12,
    overflow: "hidden",
  },

  itemImage: {
    width: "100%",
    height: "100%",
  },

  itemInformation: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    paddingRight: 5,
  },

  itemCategory: {
    fontSize: 8,
    fontWeight: "700",
    color: "#888888",
    letterSpacing: 0.5,
  },

  itemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
    marginTop: 3,
    lineHeight: 17,
  },

  itemSeller: {
    fontSize: 9,
    color: "#888888",
    marginTop: 3,
  },

  itemPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000000",
    marginTop: 5,
    flexShrink: 0,
  },

  // ===================================================
  // QUANTITY
  // ===================================================

  quantityControl: {
    height: 30,
    backgroundColor: "#F3F3F3",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 3,
    marginTop: 7,
  },

  quantityButton: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  quantityNumber: {
    width: 28,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "#000000",
  },

  // ===================================================
  // RIGHT SIDE
  // ===================================================

  itemRightColumn: {
    width: 55,
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: 1,
  },


  deleteButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  // ===================================================
  // SELECTION INFORMATION
  // ===================================================

  selectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F1F1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },

  selectionInfoText: {
    flex: 1,
    fontSize: 10,
    color: "#777777",
    lineHeight: 15,
    marginLeft: 7,
  },

  // ===================================================
  // ORDER SUMMARY
  // ===================================================

  summaryContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000000",
    marginBottom: 13,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
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
    marginVertical: 7,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },

  totalPrice: {
    fontSize: 19,
    fontWeight: "800",
    color: "#000000",
  },

  // ===================================================
  // BOTTOM CHECKOUT
  // ===================================================

  bottomCheckout: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 82,
    minHeight: 78,
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

  checkoutButton: {
    height: 50,
    paddingHorizontal: 20,
    backgroundColor: "#000000",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  checkoutButtonDisabled: {
    backgroundColor: "#AAAAAA",
  },

  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginRight: 7,
  },

  // ===================================================
  // EMPTY CART
  // ===================================================

  emptyPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
    paddingBottom: 90,
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
    fontSize: 19,
    fontWeight: "800",
    color: "#222222",
    marginTop: 17,
  },

  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#888888",
    textAlign: "center",
    marginTop: 7,
    maxWidth: 270,
  },

  shopButton: {
    height: 48,
    backgroundColor: "#000000",
    borderRadius: 24,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  shopButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginRight: 8,
  },

  // ===================================================
  // BOTTOM NAVIGATION
  // ===================================================

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
