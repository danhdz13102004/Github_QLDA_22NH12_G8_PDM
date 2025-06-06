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
import { primaryColor } from "../../constants/Colors";
import { router } from "expo-router";
import { API_ENDPOINTS } from "../../constants/ApiConfig";
import { useToast } from "../../contexts/ToastContext";

const ForgotPasswordScreen = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSendOtp = async () => {
    if (validateEmail()) {
      try {
        setIsLoading(true);
        setGeneralError("");

        const response = await fetch(API_ENDPOINTS.FORGOT_PASSWORD, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });        const data = await response.json();

        if (response.ok && data.status === 'success') {
          showToast("OTP sent to your email", "success");
          
          // Navigate to the OTP verification screen
          router.push({
            pathname: "/(auths)/otp-verification",
            params: { email }
          });
        } else {
          setGeneralError(data.message || "Failed to send OTP. Please try again.");
          showToast(data.message || "Failed to send OTP", "error");
        }
      } catch (error) {
        console.error("Send OTP error:", error);
        setGeneralError("Network error. Please check your connection and try again.");
        showToast("Network error. Please try again.", "error");
      } finally {
        setIsLoading(false);
      }
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
            <Text style={styles.welcomeText}>Forgot Password</Text>
            <Text style={styles.subtitleText}>
              Enter your email to receive a verification code
            </Text>

            {/* Show general error if any */}
            {generalError ? (
              <View style={styles.generalErrorContainer}>
                <Text style={styles.errorText}>{generalError}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) {
                      setEmailError("");
                    }
                  }}
                  onBlur={validateEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.errorContainer}>
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSendOtp}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => router.replace("/(auths)/login")}
            >
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
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
    marginBottom: 10,
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
    marginBottom: 15,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  backToLoginButton: {
    alignSelf: "center",
    padding: 10,
  },
  backToLoginText: {
    color: primaryColor,
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

export default ForgotPasswordScreen;
