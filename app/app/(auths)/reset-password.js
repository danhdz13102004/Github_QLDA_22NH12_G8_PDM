import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { router, useLocalSearchParams } from "expo-router";
import { primaryColor } from "../../constants/Colors";
import { API_ENDPOINTS } from "../../constants/ApiConfig";
import { useToast } from "../../contexts/ToastContext";

const ResetPasswordScreen = () => {
  const { showToast } = useToast();
  const { email, otp } = useLocalSearchParams();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const toggleNewPasswordVisibility = () => {
    setNewPasswordVisible(!newPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  const validateNewPassword = () => {
    if (!newPassword) {
      setNewPasswordError("New password is required");
      return false;
    } else if (newPassword.length < 6) {
      setNewPasswordError("Password must be at least 6 characters");
      return false;
    }
    setNewPasswordError("");
    return true;
  };

  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      setConfirmPasswordError("Confirm password is required");
      return false;
    } else if (confirmPassword !== newPassword) {
      setConfirmPasswordError("Passwords don't match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const validateForm = () => {
    const isNewPasswordValid = validateNewPassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    return isNewPasswordValid && isConfirmPasswordValid;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setGeneralError("");

      const response = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword
        }),
      });      const data = await response.json();

      if (response.ok && data.status === 'success') {
        showToast("Password reset successful. Please login with your new password.", "success");
        router.replace("/(auths)/login");
      } else {
        setGeneralError(data.message || "Failed to reset password. Please try again.");
        showToast(data.message || "Failed to reset password", "error");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setGeneralError("Network error. Please check your connection and try again.");
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Text style={styles.logoText}>SIGN LANGUAGE</Text>
              <Image
                source={require("../../assets/sign-language.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Reset Password</Text>
            <Text style={styles.subtitleText}>
              Create a new password for your account
            </Text>

            {/* Show general error if any */}
            {generalError ? (
              <View style={styles.generalErrorContainer}>
                <Text style={styles.errorText}>{generalError}</Text>
              </View>
            ) : null}

            {/* New Password */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (newPasswordError) {
                      setNewPasswordError("");
                    }
                  }}
                  onBlur={validateNewPassword}
                  secureTextEntry={!newPasswordVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={toggleNewPasswordVisibility}
                >
                  <Icon
                    name={newPasswordVisible ? "eye" : "eye-off"}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.errorContainer}>
                {newPasswordError ? (
                  <Text style={styles.errorText}>{newPasswordError}</Text>
                ) : null}
              </View>
            </View>

            {/* Confirm New Password */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmPasswordError) {
                      setConfirmPasswordError("");
                    }
                  }}
                  onBlur={validateConfirmPassword}
                  secureTextEntry={!confirmPasswordVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={toggleConfirmPasswordVisibility}
                >
                  <Icon
                    name={confirmPasswordVisible ? "eye" : "eye-off"}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.errorContainer}>
                {confirmPasswordError ? (
                  <Text style={styles.errorText}>{confirmPasswordError}</Text>
                ) : null}
              </View>
            </View>

            {/* Reset Password Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleResetPassword}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            {/* Security advice */}
            <View style={styles.securityContainer}>
              <Text style={styles.securityTitle}>Password Tips:</Text>
              <Text style={styles.securityText}>• Use at least 6 characters</Text>
              <Text style={styles.securityText}>• Should include uppercase and lowercase letters</Text>
              <Text style={styles.securityText}>• Should add numbers and special characters</Text>
              <Text style={styles.securityText}>• Should avoid using personal information</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: primaryColor,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  header: {
    height: "25%",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 20,
  },
  logoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 100,
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: primaryColor,
  },
  subtitleText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },
  generalErrorContainer: {
    backgroundColor: "#FFEEEE",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
    color: "#666",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    position: "relative",
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 10,
  },
  errorContainer: {
    height: 20,
    justifyContent: "center",
    marginTop: 2,
    marginBottom: 4,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
  },
  actionButton: {
    backgroundColor: primaryColor,
    borderRadius: 10,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  securityContainer: {
    backgroundColor: "#F9F9F9",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  securityTitle: {
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  securityText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 5,
    lineHeight: 18,
  },
});

export default ResetPasswordScreen;
