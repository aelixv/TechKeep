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

const API_URL = "https://backend-2-h20j.onrender.com";

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
// SEARCH SCREEN
// =====================================================

export default function SearchScreen() {
  const [searchText, setSearchText] = useState("");

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
        console.error(
          "Search products error:",
          error
        );
      }
    };

    fetchProducts();
  }, []);

  // ===================================================
  // CHECK IF USER IS SEARCHING/FILTERING
  // ===================================================

  const hasSearch =
    searchText.trim().length > 0;

  const hasCategory =
    selectedCategory !== "All";

  const shouldShowResults =
    hasSearch || hasCategory;

  // ===================================================
  // FILTER PRODUCTS
  // ===================================================

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    const search =
      searchText.toLowerCase().trim();

    const matchesSearch =
      search === "" ||
      product.name
        .toLowerCase()
        .includes(search) ||
      product.seller
        .toLowerCase()
        .includes(search) ||
      product.category
        .toLowerCase()
        .includes(search);

    return (
      matchesCategory &&
      matchesSearch
    );
  });

  // ===================================================
  // CLEAR SEARCH
  // ===================================================

  const clearSearch = () => {
    setSearchText("");
    setSelectedCategory("All");
  };

  return (
    <View style={styles.container}>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >

            <Ionicons
              name="arrow-back"
              size={22}
              color="#000000"
            />

          </Pressable>

          <Text style={styles.headerTitle}>
            Search
          </Text>

          <View style={styles.headerSpacer} />

        </View>

        {/* =================================================
            SEARCH BAR
        ================================================= */}

        <View style={styles.searchContainer}>

          <Ionicons
            name="search-outline"
            size={21}
            color="#555555"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#999999"
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
            returnKeyType="search"
          />

          {searchText.length > 0 && (

            <Pressable
              onPress={() =>
                setSearchText("")
              }
              style={styles.clearButton}
            >

              <Ionicons
                name="close-circle"
                size={20}
                color="#888888"
              />

            </Pressable>

          )}

        </View>

        {/* =================================================
            CATEGORIES
        ================================================= */}

        <View style={styles.categoryHeader}>

          <Text style={styles.sectionTitle}>
            Categories
          </Text>

        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >

          {categories.map((category) => {

            const isSelected =
              selectedCategory === category.name;

            return (

              <Pressable
                key={category.name}
                style={[
                  styles.categoryButton,
                  isSelected &&
                    styles.activeCategoryButton,
                ]}
                onPress={() =>
                  setSelectedCategory(
                    category.name
                  )
                }
              >

                <Ionicons
                  name={category.icon}
                  size={17}
                  color={
                    isSelected
                      ? "#FFFFFF"
                      : "#555555"
                  }
                />

                <Text
                  style={[
                    styles.categoryButtonText,
                    isSelected &&
                      styles.activeCategoryButtonText,
                  ]}
                >
                  {category.name}
                </Text>

              </Pressable>

            );
          })}

        </ScrollView>

        {/* =================================================
            INITIAL SEARCH STATE
        ================================================= */}

        {!shouldShowResults && (

          <View style={styles.initialContainer}>

            <View style={styles.initialIcon}>

              <Ionicons
                name="search-outline"
                size={34}
                color="#777777"
              />

            </View>

            <Text style={styles.initialTitle}>
              What are you looking for?
            </Text>

            <Text style={styles.initialText}>
              Search for products or choose a
              category to start shopping.
            </Text>

          </View>

        )}

        {/* =================================================
            RESULTS
        ================================================= */}

        {shouldShowResults && (

          <>

            {/* RESULTS HEADER */}

            <View style={styles.resultsHeader}>

              <View>

                <Text style={styles.sectionTitle}>
                  {searchText.trim()
                    ? "Search Results"
                    : `${selectedCategory} Products`}
                </Text>

                <Text style={styles.resultCount}>
                  {filteredProducts.length}{" "}
                  {filteredProducts.length === 1
                    ? "product"
                    : "products"}{" "}
                  found
                </Text>

              </View>

              {(hasSearch || hasCategory) && (

                <Pressable
                  onPress={clearSearch}
                >

                  <Text style={styles.clearText}>
                    Clear
                  </Text>

                </Pressable>

              )}

            </View>

            {/* =================================================
                NO RESULTS
            ================================================= */}

            {filteredProducts.length === 0 ? (

              <View style={styles.emptyContainer}>

                <View style={styles.emptyIcon}>

                  <Ionicons
                    name="search-outline"
                    size={32}
                    color="#777777"
                  />

                </View>

                <Text style={styles.emptyTitle}>
                  No products found
                </Text>

                <Text style={styles.emptyText}>
                  Try another search or category.
                </Text>

                <Pressable
                  style={styles.clearSearchButton}
                  onPress={clearSearch}
                >

                  <Text style={styles.clearSearchText}>
                    Clear Search
                  </Text>

                </Pressable>

              </View>

            ) : (

              /* =================================================
                 PRODUCT GRID
              ================================================= */

              <View style={styles.productRow}>

                {filteredProducts.map((product) => (

                  <Pressable
                    key={product._id}
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

                    {/* PRODUCT IMAGE */}

                    <View style={styles.imageContainer}>

                      <Image
                        source={{
                          uri: product.image,
                        }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />

                    </View>

                    {/* CATEGORY */}

                    <Text style={styles.productTag}>
                      {product.category.toUpperCase()}
                    </Text>

                    {/* NAME */}

                    <Text
                      style={styles.productName}
                      numberOfLines={2}
                    >
                      {product.name}
                    </Text>

                    {/* PRICE */}

                    <Text style={styles.productPrice}>
                      ₱{Number(product.price).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>

                    {/* SELLER */}

                    <View style={styles.sellerRow}>

                      <Ionicons
                        name="storefront-outline"
                        size={12}
                        color="#888888"
                      />

                      <Text style={styles.seller}>
                        {product.seller}
                      </Text>

                    </View>

                  </Pressable>

                ))}

              </View>

            )}

          </>

        )}

        <View style={{ height: 25 }} />

      </ScrollView>

      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <View style={styles.bottomNav}>

        {/* HOME */}

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

        {/* SEARCH */}

        <Pressable
          style={styles.navItem}
          onPress={() =>
            router.replace("/search")
          }
        >

          <Ionicons
            name="search"
            size={23}
            color="#000000"
          />

          <Text style={styles.activeNavText}>
            Search
          </Text>

        </Pressable>

        {/* CART */}

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

        {/* ORDERS */}

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

        {/* PROFILE */}

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

  // ===================================================
  // MAIN
  // ===================================================

  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 110,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
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
    fontSize: 20,
    fontWeight: "800",
    color: "#000000",
  },

  headerSpacer: {
    width: 43,
  },

  // ===================================================
  // SEARCH BAR
  // ===================================================

  searchContainer: {
    height: 54,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 13,

    flexDirection: "row",
    alignItems: "center",

    paddingLeft: 15,
    paddingRight: 12,

    marginTop: 20,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#000000",
  },

  clearButton: {
    padding: 4,
  },

  // ===================================================
  // CATEGORIES
  // ===================================================

  categoryHeader: {
    marginTop: 25,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000000",
  },

  categoryList: {
    paddingRight: 10,
  },

  categoryButton: {
    height: 40,
    paddingHorizontal: 13,

    borderRadius: 20,

    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",

    flexDirection: "row",
    alignItems: "center",

    marginRight: 8,
  },

  activeCategoryButton: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },

  categoryButtonText: {
    fontSize: 11,
    color: "#555555",
    marginLeft: 6,
  },

  activeCategoryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // ===================================================
  // INITIAL SEARCH STATE
  // ===================================================

  initialContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,

    paddingVertical: 55,
    paddingHorizontal: 25,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 30,
  },

  initialIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,

    backgroundColor: "#F1F1F1",

    alignItems: "center",
    justifyContent: "center",
  },

  initialTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
    marginTop: 15,
    textAlign: "center",
  },

  initialText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#888888",
    marginTop: 7,
    textAlign: "center",
    maxWidth: 270,
  },

  // ===================================================
  // RESULTS
  // ===================================================

  resultsHeader: {
    marginTop: 27,
    marginBottom: 13,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  resultCount: {
    fontSize: 11,
    color: "#888888",
    marginTop: 3,
  },

  clearText: {
    fontSize: 12,
    color: "#555555",
    fontWeight: "600",
  },

  // ===================================================
  // PRODUCT GRID
  // ===================================================

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
    fontSize: 8,
    color: "#777777",
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 10,
  },

  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
    marginTop: 5,
    lineHeight: 18,
  },

  productPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
    marginTop: 7,
  },

  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  seller: {
    fontSize: 10,
    color: "#888888",
    marginLeft: 4,
  },

  // ===================================================
  // EMPTY STATE
  // ===================================================

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,

    paddingVertical: 45,
    paddingHorizontal: 20,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 5,
  },

  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 33,

    backgroundColor: "#F1F1F1",

    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
    marginTop: 13,
  },

  emptyText: {
    fontSize: 12,
    color: "#888888",
    marginTop: 5,
    textAlign: "center",
  },

  clearSearchButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 17,
    paddingVertical: 10,

    borderRadius: 9,

    marginTop: 17,
  },

  clearSearchText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
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
