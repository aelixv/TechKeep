import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// =====================================================
// API
// =====================================================

const API_URL = "http://https://howard-cigarette-standings-february.trycloudflare.com";

// =====================================================
// CATEGORIES
// =====================================================

const categories = [
  {
    name: "All",
    icon: "grid-outline",
  },
  {
    name: "Shoes",
    icon: "footsteps-outline",
  },
  {
    name: "Clothing",
    icon: "shirt-outline",
  },
  {
    name: "Accessories",
    icon: "watch-outline",
  },
  {
    name: "School",
    icon: "book-outline",
  },
  {
    name: "Electronics",
    icon: "phone-portrait-outline",
  },
  {
    name: "Others",
    icon: "ellipsis-horizontal-outline",
  },
];

// =====================================================
// HOME SCREEN
// =====================================================

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [products, setProducts] = useState([]);

  // ===================================================
  // GET PRODUCTS FROM MONGODB
  // ===================================================

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/products`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to get products"
          );
        }

        setProducts(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchProducts();
  }, []);

  // ===================================================
  // FILTER PRODUCTS BY CATEGORY
  // ===================================================

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter(
          (product) =>
            product.category === selectedCategory
        );

  // ===================================================
  // NEW ARRIVAL
  // ===================================================

  const newArrival = products[0];

  return (
    <View style={styles.container}>

      {/* =================================================
          FIXED HEADER
      ================================================= */}

      <View style={styles.headerContainer}>

        <View style={styles.header}>

          <View>

            <Text style={styles.greeting}>
              Welcome to
            </Text>

            <Text style={styles.logo}>
              TechKeep
            </Text>

          </View>

          <Pressable
            style={styles.notificationButton}
          >

            <Ionicons
              name="notifications-outline"
              size={23}
              color="#000000"
            />

            <View
              style={styles.notificationDot}
            />

          </Pressable>

        </View>

      </View>

      {/* =================================================
          MAIN SCROLL CONTENT
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* =================================================
            SEARCH BAR
        ================================================= */}

        <Pressable
          style={styles.searchContainer}
          onPress={() =>
            router.push("/search")
          }
        >

          <Ionicons
            name="search-outline"
            size={21}
            color="#555555"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="What are you looking for?"
            placeholderTextColor="#999999"
            editable={false}
            pointerEvents="none"
          />

        </Pressable>

        {/* =================================================
            PROMOTIONAL BANNER
        ================================================= */}

        <Pressable
          style={styles.promoBanner}
          onPress={() =>
            router.push("/search")
          }
        >

          <View style={styles.promoContent}>

            <Text style={styles.promoSmallText}>
              TECHKEEP MARKETPLACE
            </Text>

            <Text style={styles.promoTitle}>
              Find What{"\n"}
              You Need
            </Text>

            <Text style={styles.promoDescription}>
              Discover useful products and everyday
              essentials from local sellers.
            </Text>

            <View style={styles.shopButton}>

              <Text style={styles.shopButtonText}>
                Shop Now
              </Text>

              <Ionicons
                name="arrow-forward"
                size={15}
                color="#000000"
              />

            </View>

          </View>

          <View style={styles.promoImageContainer}>

            <Image
              source={{
                uri:
                  "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600",
              }}
              style={styles.promoImage}
              resizeMode="cover"
            />

          </View>

        </Pressable>

        {/* =================================================
            CATEGORIES HEADER
        ================================================= */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Categories
          </Text>

          <Pressable
            onPress={() =>
              router.push("/search")
            }
          >

            <Text style={styles.seeAll}>
              See all
            </Text>

          </Pressable>

        </View>

        {/* =================================================
            CATEGORIES
        ================================================= */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >

          {categories.map((category) => {

            const isSelected =
              selectedCategory ===
              category.name;

            return (
              <Pressable
                key={category.name}
                style={styles.category}
                onPress={() =>
                  setSelectedCategory(
                    category.name
                  )
                }
              >

                <View
                  style={[
                    styles.categoryIcon,
                    isSelected &&
                      styles.activeCategoryIcon,
                  ]}
                >

                  <Ionicons
                    name={category.icon}
                    size={22}
                    color={
                      isSelected
                        ? "#FFFFFF"
                        : "#000000"
                    }
                  />

                </View>

                <Text
                  style={[
                    styles.categoryText,
                    isSelected &&
                      styles.activeCategoryText,
                  ]}
                >
                  {category.name}
                </Text>

              </Pressable>
            );
          })}

        </ScrollView>

        {/* =================================================
            POPULAR PRODUCTS HEADER
        ================================================= */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Popular Products
          </Text>

          <Pressable
            onPress={() =>
              router.push("/search")
            }
          >

            <Text style={styles.seeAll}>
              See all
            </Text>

          </Pressable>

        </View>

        {/* =================================================
            PRODUCT GRID
        ================================================= */}

        {filteredProducts.length === 0 ? (

          <View style={styles.emptyContainer}>

            <Ionicons
              name="cube-outline"
              size={45}
              color="#AAAAAA"
            />

            <Text style={styles.emptyTitle}>
              No products found
            </Text>

            <Text style={styles.emptyText}>
              There are no products in this
              category yet.
            </Text>

          </View>

        ) : (

          <View style={styles.productRow}>

            {filteredProducts.map((product) => (

              <Pressable
                key={String(product._id)}
                style={styles.productCard}
                onPress={() =>
                  router.push({
                    pathname: "/product",
                    params: {
                      id: String(product._id),
                    },
                  })
                }
              >

                <View
                  style={styles.imageContainer}
                >

                  <Image
                    source={{
                      uri: product.image,
                    }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />

                </View>

                <Text style={styles.productTag}>
                  BEST SELLER
                </Text>

                <Text
                  style={styles.productName}
                  numberOfLines={1}
                >
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

                <Text style={styles.seller}>
                  {product.seller ||
                    product.sellerName ||
                    product.shopName ||
                    "Seller"}
                </Text>

              </Pressable>

            ))}

          </View>

        )}

        {/* =================================================
            NEW ARRIVALS
        ================================================= */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            New Arrivals
          </Text>

          <Pressable
            onPress={() =>
              router.push("/search")
            }
          >

            <Text style={styles.seeAll}>
              See all
            </Text>

          </Pressable>

        </View>

        {newArrival ? (

          <Pressable
            style={styles.newArrival}
            onPress={() =>
              router.push({
                pathname: "/product",
                params: {
                  id: String(newArrival._id),
                },
              })
            }
          >

            <View style={styles.newArrivalText}>

              <Text style={styles.productTag}>
                NEW ARRIVAL
              </Text>

              <Text style={styles.newArrivalTitle}>
                {newArrival.name}
              </Text>

              <Text style={styles.newArrivalPrice}>
                ₱
                {Number(
                  newArrival.price
                ).toLocaleString(
                  "en-PH",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </Text>

            </View>

            <Image
              source={{
                uri: newArrival.image,
              }}
              style={styles.newArrivalImage}
              resizeMode="contain"
            />

          </Pressable>

        ) : null}

        <View style={{ height: 25 }} />

      </ScrollView>

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <View style={styles.bottomNav}>

        <Pressable
          style={styles.navItem}
          onPress={() =>
            router.replace("/home")
          }
        >

          <Ionicons
            name="home"
            size={23}
            color="#000000"
          />

          <Text style={styles.activeNavText}>
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

  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 15,
    backgroundColor: "#F7F7F7",
    zIndex: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greeting: {
    fontSize: 13,
    color: "#777777",
  },

  logo: {
    fontSize: 30,
    fontWeight: "800",
    color: "#000000",
    marginTop: 2,
  },

  notificationButton: {
    width: 45,
    height: 45,
    borderRadius: 23,

    backgroundColor: "#FFFFFF",

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  notificationDot: {
    position: "absolute",

    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: "#000000",

    top: 9,
    right: 10,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 115,
  },

  searchContainer: {
    height: 53,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#DDDDDD",

    borderRadius: 12,

    flexDirection: "row",
    alignItems: "center",

    paddingLeft: 15,
    paddingRight: 15,

    marginTop: 6,
  },

  searchInput: {
    flex: 1,

    marginLeft: 10,

    fontSize: 14,

    color: "#000000",
  },

  promoBanner: {
    height: 185,

    backgroundColor: "#000000",

    borderRadius: 18,

    marginTop: 18,

    overflow: "hidden",

    flexDirection: "row",
  },

  promoContent: {
    flex: 1,

    padding: 18,

    zIndex: 2,
  },

  promoSmallText: {
    color: "#AAAAAA",

    fontSize: 8,

    fontWeight: "700",

    letterSpacing: 1,
  },

  promoTitle: {
    color: "#FFFFFF",

    fontSize: 22,

    fontWeight: "800",

    lineHeight: 25,

    marginTop: 8,
  },

  promoDescription: {
    color: "#AAAAAA",

    fontSize: 9,

    lineHeight: 14,

    marginTop: 7,

    width: 150,
  },

  shopButton: {
    backgroundColor: "#FFFFFF",

    borderRadius: 8,

    paddingHorizontal: 11,
    paddingVertical: 8,

    flexDirection: "row",

    alignItems: "center",

    alignSelf: "flex-start",

    marginTop: 11,
  },

  shopButtonText: {
    color: "#000000",

    fontSize: 10,

    fontWeight: "800",

    marginRight: 6,
  },

  promoImageContainer: {
    width: 130,
    height: "100%",

    position: "absolute",

    right: 0,
    top: 0,

    opacity: 0.65,
  },

  promoImage: {
    width: "100%",
    height: "100%",
  },

  sectionHeader: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginTop: 28,

    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 17,

    fontWeight: "700",

    color: "#000000",
  },

  seeAll: {
    fontSize: 12,

    color: "#777777",
  },

  categoryList: {
    paddingRight: 10,
  },

  category: {
    alignItems: "center",

    width: 72,

    marginRight: 12,
  },

  categoryIcon: {
    width: 52,
    height: 52,

    borderRadius: 26,

    backgroundColor: "#FFFFFF",

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  activeCategoryIcon: {
    backgroundColor: "#000000",

    borderColor: "#000000",
  },

  categoryText: {
    fontSize: 10,

    color: "#555555",

    textAlign: "center",

    marginTop: 7,
  },

  activeCategoryText: {
    color: "#000000",

    fontWeight: "700",
  },

  productRow: {
    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent: "space-between",
  },

  productCard: {
    width: "48%",

    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    padding: 10,

    marginBottom: 12,

    overflow: "hidden",
  },

  imageContainer: {
    height: 140,

    backgroundColor: "#F3F3F3",

    borderRadius: 12,

    justifyContent: "center",

    alignItems: "center",

    overflow: "hidden",
  },

  productImage: {
    width: "100%",

    height: "100%",
  },

  productTag: {
    fontSize: 9,

    color: "#777777",

    fontWeight: "600",

    marginTop: 10,
  },

  productName: {
    fontSize: 14,

    fontWeight: "600",

    color: "#111111",

    marginTop: 5,
  },

  productPrice: {
    fontSize: 14,

    fontWeight: "700",

    color: "#000000",

    marginTop: 7,
  },

  seller: {
    fontSize: 10,

    color: "#888888",

    marginTop: 4,
  },

  emptyContainer: {
    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    paddingVertical: 35,

    alignItems: "center",

    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 15,

    fontWeight: "700",

    color: "#333333",

    marginTop: 10,
  },

  emptyText: {
    fontSize: 12,

    color: "#888888",

    marginTop: 5,

    textAlign: "center",
  },

  newArrival: {
    height: 145,

    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    padding: 18,

    flexDirection: "row",

    overflow: "hidden",
  },

  newArrivalText: {
    flex: 1,

    justifyContent: "center",
  },

  newArrivalTitle: {
    fontSize: 19,

    fontWeight: "700",

    color: "#000000",

    marginTop: 5,
  },

  newArrivalPrice: {
    fontSize: 14,

    fontWeight: "600",

    color: "#222222",

    marginTop: 8,
  },

  newArrivalImage: {
    width: 145,

    height: 125,
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

