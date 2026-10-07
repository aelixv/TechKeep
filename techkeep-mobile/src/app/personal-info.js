import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const API_URL = "http://https://howard-cigarette-standings-february.trycloudflare.com";

export default function PersonalInfo() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

        if (!response.ok) {
          await AsyncStorage.removeItem("token");
          router.replace("/auth");
          return;
        }

        const user = data.user || data;

        setName(user.name || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
      } catch (error) {
        console.error("Load user error:", error);

        Alert.alert(
          "Error",
          "Unable to load your account information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        router.replace("/auth");
        return;
      }

      if (!name.trim()) {
        Alert.alert(
          "Missing Name",
          "Please enter your name."
        );
        return;
      }

      if (!email.trim()) {
        Alert.alert(
          "Missing Email",
          "Please enter your email."
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
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save changes"
        );
      }

      Alert.alert(
        "Saved!",
        "Your personal information has been updated.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error(
        "Save profile error:",
        error
      );

      Alert.alert(
        "Save Failed",
        error.message ||
          "Unable to save your changes."
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
          Personal Information
        </Text>

        <View style={styles.headerSpacer} />

      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        <View style={styles.avatarContainer}>

          <View style={styles.avatar}>

            <Ionicons
              name="person"
              size={32}
              color="#FFFFFF"
            />

          </View>

        </View>

        <View style={styles.fieldContainer}>

          <Text style={styles.label}>
            Full Name
          </Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={
              loading
                ? "Loading..."
                : "Enter your name"
            }
            placeholderTextColor="#AAAAAA"
            editable={!loading}
          />

        </View>

        <View style={styles.fieldContainer}>

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={
              loading
                ? "Loading..."
                : "Enter your email"
            }
            placeholderTextColor="#AAAAAA"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

        </View>

        <View style={styles.fieldContainer}>

          <Text style={styles.label}>
            Phone Number
          </Text>

          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder={
              loading
                ? "Loading..."
                : "Enter your phone number"
            }
            placeholderTextColor="#AAAAAA"
            keyboardType="phone-pad"
            editable={!loading}
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
              : "Save Changes"}
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
    fontSize: 19,
    fontWeight: "800",
    color: "#000000",
  },

  headerSpacer: {
    width: 42,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  avatarContainer: {
    alignItems: "center",
    marginTop: 15,
    marginBottom: 30,
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },

  fieldContainer: {
    marginBottom: 20,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
  },

  input: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 13,
    color: "#111111",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  saveButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
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