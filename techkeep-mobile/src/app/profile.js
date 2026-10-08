import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const API_URL = "https://backend-2-h20j.onrender.com";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          router.replace("/auth");
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

        console.log("Profile response:", response.status, data);

        if (response.status === 401 || response.status === 403) {
          await AsyncStorage.removeItem("token");
          router.replace("/auth");
          return;
        }

        if (!response.ok) {
          console.error(
            "Failed to load profile:",
            data.message
          );
          return;
        }

        setUser(data.user || data);
      } catch (error) {
        console.error(
          "Failed to load profile:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      router.replace("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    danger = false,
  }) => {
    return (
      <Pressable
        style={styles.menuItem}
        onPress={onPress}
      >
        <View
          style={[
            styles.menuIcon,
            danger && styles.dangerIcon,
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={
              danger
                ? "#B32626"
                : "#000000"
            }
          />
        </View>

        <View style={styles.menuContent}>
          <Text
            style={[
              styles.menuTitle,
              danger && styles.dangerText,
            ]}
          >
            {title}
          </Text>

          {subtitle && (
            <Text style={styles.menuSubtitle}>
              {subtitle}
            </Text>
          )}
        </View>

        <Ionicons
          name="chevron-forward"
          size={17}
          color="#AAAAAA"
        />
      </Pressable>
    );
  };

  const userName =
    user?.name ||
    user?.fullName ||
    "TechKeep User";

  const userEmail =
    user?.email ||
    "No email";

  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >

        <View style={styles.header}>
          <View>
            <Text style={styles.headerSmall}>
              Account
            </Text>

            <Text style={styles.headerTitle}>
              My Profile
            </Text>
          </View>
        </View>

        <View style={styles.profileCard}>

          <View style={styles.avatar}>
            <Ionicons
              name="person"
              size={32}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.profileInfo}>

            <Text style={styles.profileName}>
              {loading
                ? "Loading..."
                : userName}
            </Text>

            <Text style={styles.profileEmail}>
              {loading
                ? "Loading..."
                : userEmail}
            </Text>

          </View>

        </View>

        <Text style={styles.sectionTitle}>
          Account
        </Text>

        <View style={styles.menuCard}>

          <MenuItem
            icon="person-outline"
            title="Personal Information"
            subtitle="Manage your account details"
            onPress={() =>
              router.push("/personal-info")
            }
          />

          <View style={styles.divider} />

          <MenuItem
            icon="location-outline"
            title="My Addresses"
            subtitle="Manage your delivery address"
            onPress={() =>
              router.push("/addresses")
            }
          />

        </View>

        <Text style={styles.sectionTitle}>
          Orders
        </Text>

        <View style={styles.menuCard}>

          <MenuItem
            icon="receipt-outline"
            title="My Orders"
            subtitle="Track and manage your purchases"
            onPress={() =>
              router.push("/orders")
            }
          />

        </View>

        <Text style={styles.sectionTitle}>
          Support
        </Text>

        <View style={styles.menuCard}>

          <MenuItem
            icon="help-circle-outline"
            title="Help Center"
            subtitle="Get help with your account and orders"
            onPress={() => {}}
          />

          <View style={styles.divider} />

          <MenuItem
            icon="information-circle-outline"
            title="About TechKeep"
            subtitle="Learn more about TechKeep"
            onPress={() => {}}
          />

        </View>

        <View style={styles.logoutCard}>

          <MenuItem
            icon="log-out-outline"
            title="Log Out"
            onPress={handleLogout}
            danger
          />

        </View>

        <Text style={styles.version}>
          TechKeep Marketplace{"\n"}
          Version 1.0.0
        </Text>

        <View style={styles.bottomSpace} />

      </ScrollView>

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
            name="person"
            size={23}
            color="#000000"
          />

          <Text style={styles.activeNavText}>
            Profile
          </Text>
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

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 115,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerSmall: {
    fontSize: 13,
    color: "#777777",
  },

  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#000000",
    marginTop: 2,
  },

  profileCard: {
    marginTop: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  profileName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
  },

  profileEmail: {
    fontSize: 11,
    color: "#777777",
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000000",
    marginTop: 28,
    marginBottom: 12,
  },

  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 15,
    overflow: "hidden",
  },

  menuItem: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
  },

  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  menuContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },

  menuTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
  },

  menuSubtitle: {
    fontSize: 10,
    color: "#888888",
    marginTop: 4,
    lineHeight: 14,
  },

  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginLeft: 52,
  },

  logoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 15,
    marginTop: 28,
  },

  dangerIcon: {
    backgroundColor: "#FDECEC",
  },

  dangerText: {
    color: "#B32626",
  },

  version: {
    textAlign: "center",
    fontSize: 10,
    lineHeight: 16,
    color: "#AAAAAA",
    marginTop: 24,
  },

  bottomSpace: {
    height: 25,
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

