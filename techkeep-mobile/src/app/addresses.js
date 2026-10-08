import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const API_URL = "https://backend-2-h20j.onrender.com";

export default function Addresses() {
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadAddress = async () => {
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

        if (!response.ok) {
          await AsyncStorage.removeItem("token");
          router.replace("/auth");
          return;
        }

        const user = data.user || data;

        setAddress(user.address || "");
      } catch (error) {
        console.error(
          "Load address error:",
          error
        );

        Alert.alert(
          "Error",
          "Unable to load your address."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAddress();
  }, []);

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/auth");
        return;
      }

      if (!address.trim()) {
        Alert.alert(
          "Missing Address",
          "Please enter your delivery address."
        );
        return;
      }

      setSaving(true);

      const response = await fetch(
        `${API_URL}/api/auth/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            address: address.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save address"
        );
      }

      Alert.alert(
        "Saved!",
        "Your delivery address has been updated.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error(
        "Save address error:",
        error
      );

      Alert.alert(
        "Save Failed",
        error.message ||
          "Unable to save your address."
      );
    } finally {
      setSaving(false);
    }
  };

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

        <Text style={styles.headerTitle}>
          My Addresses
        </Text>

        <View style={styles.headerSpacer} />

      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        <View style={styles.addressCard}>

          <View style={styles.addressTop}>

            <View style={styles.addressIcon}>

              <Ionicons
                name="location"
                size={21}
                color="#FFFFFF"
              />

            </View>

            <View style={styles.addressInfo}>

              <Text style={styles.addressTitle}>
                Delivery Address
              </Text>

              <Text style={styles.addressLabel}>
                Your delivery address
              </Text>

            </View>

          </View>

          <TextInput
            style={styles.addressInput}
            value={address}
            onChangeText={setAddress}
            multiline
            editable={!loading}
            placeholder={
              loading
                ? "Loading address..."
                : "Enter your delivery address"
            }
            placeholderTextColor="#AAAAAA"
          />

        </View>

        <Pressable
          style={[
            styles.saveButton,
            saving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={loading || saving}
        >

          <Text style={styles.saveButtonText}>
            {saving
              ? "Saving..."
              : "Save Address"}
          </Text>

        </Pressable>

      </ScrollView>

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

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000000",
  },

  headerSpacer: {
    width: 42,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 40,
  },

  addressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E7E7E7",
  },

  addressTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  addressIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },

  addressInfo: {
    marginLeft: 12,
  },

  addressTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111111",
  },

  addressLabel: {
    fontSize: 10,
    color: "#888888",
    marginTop: 3,
  },

  addressInput: {
    minHeight: 80,
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 13,
    color: "#111111",
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  saveButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },

  saveButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});