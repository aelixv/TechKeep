import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AuthScreen() {
  // SIGN IN / SIGN UP / FORGOT PASSWORD
  const [isSignIn, setIsSignIn] = useState(true);
  const [isForgotPassword, setIsForgotPassword] =
    useState(false);

  // PASSWORD VISIBILITY
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [showNewConfirmPassword, setShowNewConfirmPassword] =
    useState(false);

  // FORM VALUES
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  // FORGOT PASSWORD VALUES
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] =
    useState("");

  // =====================================================
  // SIGN IN / SIGN UP
  // =====================================================

  const handleSubmit = async () => {
    if (isSignIn) {
      if (!email || !password) {
        Alert.alert(
          "Incomplete Information",
          "Please enter your email and password."
        );
        return;
      }

      try {
        const response = await fetch(
          "http://https://howard-cigarette-standings-february.trycloudflare.com/api/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              password,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          Alert.alert(
            "Login Failed",
            data.message ||
              "Invalid email or password."
          );
          return;
        }

        await AsyncStorage.setItem(
          "token",
          data.token
        );

        Alert.alert(
          "Login Successful",
          `Welcome, ${data.user.name}!`,
          [
            {
              text: "Continue",
              onPress: () =>
                router.replace("/home"),
            },
          ]
        );
      } catch (error) {
        console.error("Login error:", error);

        Alert.alert(
          "Connection Error",
          "Unable to connect to the TechKeep server."
        );
      }
    } else {
      if (
        !fullName ||
        !email ||
        !password ||
        !confirmPassword
      ) {
        Alert.alert(
          "Incomplete Information",
          "Please fill in all fields."
        );
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert(
          "Password Mismatch",
          "Passwords do not match."
        );
        return;
      }

      try {
        const response = await fetch(
          "http://https://howard-cigarette-standings-february.trycloudflare.com/api/auth/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: fullName,
              email: email.trim().toLowerCase(),
              password,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          Alert.alert(
            "Sign Up Failed",
            data.message ||
              "Unable to create account."
          );
          return;
        }

        Alert.alert(
          "Account Created!",
          "Your TechKeep account has been created successfully.",
          [
            {
              text: "Sign In",
              onPress: () => {
                setIsSignIn(true);
                setPassword("");
                setConfirmPassword("");
              },
            },
          ]
        );
      } catch (error) {
        console.error(
          "Registration error:",
          error
        );

        Alert.alert(
          "Connection Error",
          "Unable to connect to the TechKeep server."
        );
      }
    }
  };

  // =====================================================
  // FORGOT PASSWORD
  // =====================================================

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
    setIsSignIn(false);

    setPassword("");
    setConfirmPassword("");
    setNewPassword("");
    setNewConfirmPassword("");
  };

  // =====================================================
  // RESET PASSWORD
  // =====================================================

  const handleResetPassword = async () => {
    if (
      !email ||
      !newPassword ||
      !newConfirmPassword
    ) {
      Alert.alert(
        "Incomplete Information",
        "Please fill in all fields."
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        "Password Too Short",
        "Password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== newConfirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "Passwords do not match."
      );
      return;
    }

    try {
      const response = await fetch(
        "http://https://howard-cigarette-standings-february.trycloudflare.com/api/auth/reset-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Password Reset Failed",
          data.message ||
            "Unable to reset password."
        );
        return;
      }

      Alert.alert(
        "Password Reset Successful",
        "Your password has been changed. You can now sign in with your new password.",
        [
          {
            text: "Sign In",
            onPress: () => {
              setIsForgotPassword(false);
              setIsSignIn(true);

              setPassword("");
              setNewPassword("");
              setNewConfirmPassword("");
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      Alert.alert(
        "Connection Error",
        "Unable to connect to the TechKeep server."
      );
    }
  };

  // =====================================================
  // BACK TO SIGN IN
  // =====================================================

  const handleBackToSignIn = () => {
    setIsForgotPassword(false);
    setIsSignIn(true);

    setNewPassword("");
    setNewConfirmPassword("");
    setPassword("");
  };

  // =====================================================
  // FORGOT PASSWORD SCREEN
  // =====================================================

  if (isForgotPassword) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
        >
          <View style={styles.topSection}>
            <Pressable
              style={styles.backButton}
              onPress={handleBackToSignIn}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#FFFFFF"
              />
            </Pressable>

            <Text style={styles.title}>
              RESET PASSWORD
            </Text>

            <Text style={styles.subtitle}>
              Create a new TechKeep password
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.resetInfo}>
              Enter the email connected to your TechKeep
              account, then create a new password.
            </Text>

            {/* EMAIL */}

            <Text style={styles.label}>
              Email
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#777777"
              />

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* NEW PASSWORD */}

            <Text style={styles.label}>
              New Password
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#777777"
              />

              <TextInput
                style={styles.input}
                placeholder="Create a new password"
                placeholderTextColor="#999999"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />

              <Pressable
                onPress={() =>
                  setShowNewPassword(
                    !showNewPassword
                  )
                }
                hitSlop={10}
              >
                <Ionicons
                  name={
                    showNewPassword
                      ? "eye-outline"
                      : "eye-off-outline"
                  }
                  size={20}
                  color="#777777"
                />
              </Pressable>
            </View>

            {/* CONFIRM NEW PASSWORD */}

            <Text style={styles.label}>
              Confirm New Password
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#777777"
              />

              <TextInput
                style={styles.input}
                placeholder="Confirm your new password"
                placeholderTextColor="#999999"
                value={newConfirmPassword}
                onChangeText={setNewConfirmPassword}
                secureTextEntry={
                  !showNewConfirmPassword
                }
                autoCapitalize="none"
              />

              <Pressable
                onPress={() =>
                  setShowNewConfirmPassword(
                    !showNewConfirmPassword
                  )
                }
                hitSlop={10}
              >
                <Ionicons
                  name={
                    showNewConfirmPassword
                      ? "eye-outline"
                      : "eye-off-outline"
                  }
                  size={20}
                  color="#777777"
                />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.signInButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleResetPassword}
            >
              <Text style={styles.signInText}>
                RESET PASSWORD
              </Text>
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>
                Remember your password?
              </Text>

              <Pressable
                onPress={handleBackToSignIn}
              >
                <Text style={styles.loginLink}>
                  {" "}Sign In
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // =====================================================
  // NORMAL AUTH SCREEN
  // =====================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={true}
      >
        <View
          style={[
            styles.topSection,
            !isSignIn &&
              styles.topSectionSignUp,
          ]}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#FFFFFF"
            />
          </Pressable>

          <Text style={styles.title}>
            {isSignIn
              ? "HELLO, SIGN IN"
              : "CREATE ACCOUNT"}
          </Text>

          <Text style={styles.subtitle}>
            {isSignIn
              ? "Welcome back to TechKeep"
              : "Join the TechKeep marketplace"}
          </Text>
        </View>

        <View style={styles.formSection}>
          {!isSignIn && (
            <>
              <Text style={styles.label}>
                Full Name
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#777777"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999999"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </>
          )}

          <Text style={styles.label}>
            Email
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#777777"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.label}>
            Password
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#777777"
            />

            <TextInput
              style={styles.input}
              placeholder={
                isSignIn
                  ? "Enter your password"
                  : "Create a password"
              }
              placeholderTextColor="#999999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />

            <Pressable
              onPress={() =>
                setShowPassword(!showPassword)
              }
              hitSlop={10}
            >
              <Ionicons
                name={
                  showPassword
                    ? "eye-outline"
                    : "eye-off-outline"
                }
                size={20}
                color="#777777"
              />
            </Pressable>
          </View>

          {!isSignIn && (
            <>
              <Text style={styles.label}>
                Confirm Password
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#777777"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#999999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  autoCapitalize="none"
                />

                <Pressable
                  onPress={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  hitSlop={10}
                >
                  <Ionicons
                    name={
                      showConfirmPassword
                        ? "eye-outline"
                        : "eye-off-outline"
                    }
                    size={20}
                    color="#777777"
                  />
                </Pressable>
              </View>
            </>
          )}

          {isSignIn && (
            <Pressable
              style={styles.forgotButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotText}>
                Forgot password?
              </Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              isSignIn
                ? styles.signInButton
                : styles.createButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSubmit}
          >
            <Text
              style={
                isSignIn
                  ? styles.signInText
                  : styles.createButtonText
              }
            >
              {isSignIn
                ? "SIGN IN"
                : "CREATE ACCOUNT"}
            </Text>

            {!isSignIn && (
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#FFFFFF"
              />
            )}
          </Pressable>

          <View
            style={
              isSignIn
                ? styles.signupRow
                : styles.loginRow
            }
          >
            <Text
              style={
                isSignIn
                  ? styles.signupText
                  : styles.loginText
              }
            >
              {isSignIn
                ? "Don't have an account?"
                : "Already have an account?"}
            </Text>

            <Pressable
              onPress={() => {
                setIsSignIn(!isSignIn);

                setPassword("");
                setConfirmPassword("");
              }}
            >
              <Text
                style={
                  isSignIn
                    ? styles.signupLink
                    : styles.loginLink
                }
              >
                {isSignIn
                  ? " Sign Up"
                  : " Sign In"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },

  topSection: {
    backgroundColor: "#000000",
    height: 300,

    borderBottomLeftRadius: 55,
    borderBottomRightRadius: 55,

    alignItems: "center",
    justifyContent: "center",

    paddingTop: 20,
  },

  topSectionSignUp: {
    height: 285,
  },

  backButton: {
    position: "absolute",
    top: 55,
    left: 25,

    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: 1,
  },

  subtitle: {
    color: "#CCCCCC",
    fontSize: 14,
    marginTop: 8,
  },

  formSection: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 25,
  },

  resetInfo: {
    color: "#777777",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 5,
  },

  label: {
    color: "#222222",
    fontSize: 14,
    fontWeight: "600",

    marginBottom: 8,
    marginTop: 10,
  },

  inputContainer: {
    height: 52,

    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",

    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,

    marginLeft: 12,

    fontSize: 15,
    color: "#000000",
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 15,
  },

  forgotText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "600",
  },

  signInButton: {
    backgroundColor: "#000000",

    height: 55,

    borderRadius: 28,

    justifyContent: "center",
    alignItems: "center",

    marginTop: 65,
  },

  signInText: {
    color: "#FFFFFF",

    fontWeight: "700",

    letterSpacing: 1,

    fontSize: 16,
  },

  createButton: {
    backgroundColor: "#000000",

    height: 55,

    borderRadius: 28,

    justifyContent: "center",
    alignItems: "center",

    flexDirection: "row",

    gap: 8,

    marginTop: 45,
  },

  createButtonText: {
    color: "#FFFFFF",

    fontWeight: "700",

    letterSpacing: 1,

    fontSize: 16,
  },

  buttonPressed: {
    opacity: 0.8,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },

  signupText: {
    color: "#777777",
    fontSize: 13,
  },

  signupLink: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },

  loginText: {
    color: "#777777",
    fontSize: 13,
  },

  loginLink: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },
});

