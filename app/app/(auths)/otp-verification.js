import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Keyboard,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Icon from "react-native-vector-icons/Feather";
import { primaryColor } from "../../constants/Colors";
import { API_ENDPOINTS } from "../../constants/ApiConfig";
import { useToast } from "../../contexts/ToastContext";
import OTPInputField from "../../components/OTPInputField";

const OTPVerificationScreen = () => {
  const { showToast } = useToast();
  const { email } = useLocalSearchParams();
  const displayEmail = typeof email === 'string' && email.trim() ? email : 'your email';
  console.log('Email received in OTPVerificationScreen:', email);
  
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);  
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60); // 1 minute
  const [otpError, setOtpError] = useState("");
  const [generalError, setGeneralError] = useState("");  useEffect(() => {
    // Countdown for OTP expiration (5 minutes)
    let intervalId;
    if (timeRemaining > 0) {
      intervalId = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timeRemaining]);

  useEffect(() => {
    // Countdown for resend button (1 minute)
    let resendIntervalId;
    if (resendCountdown > 0 && !canResendOtp) {
      resendIntervalId = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            setCanResendOtp(true);
            clearInterval(resendIntervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (resendIntervalId) clearInterval(resendIntervalId);
    };
  }, [resendCountdown, canResendOtp]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const validateOtp = () => {
    if (!otp) {
      setOtpError("OTP is required");
      return false;
    } else if (otp.length !== 6) {
      setOtpError("Please enter all 6 digits");
      return false;
    }
    setOtpError("");
    return true;
  };

  const handleVerifyOtp = async () => {
    if (!validateOtp()) return;
    
    Keyboard.dismiss();
    
    try {
      setIsLoading(true);
      setGeneralError("");

      const response = await fetch(API_ENDPOINTS.VERIFY_OTP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp
        }),
      });      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // If verification successful, navigate to reset password screen
        showToast("OTP verified successfully", "success");
        router.replace({
          pathname: "/(auths)/reset-password",
          params: { email, otp }
        });
      } else {
        setGeneralError(data.message || "Invalid or expired OTP");
        showToast(data.message || "Verification failed", "error");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setGeneralError("Network error. Please check your connection and try again.");
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResendOtp) {
      showToast(`Please wait ${formatTime(resendCountdown)} before requesting a new OTP`, "info");
      return;
    }

    try {
      setIsLoading(true);
      setGeneralError("");

      const response = await fetch(API_ENDPOINTS.FORGOT_PASSWORD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });      const data = await response.json();      if (response.ok && data.status === 'success') {
        setTimeRemaining(300); // Reset 5 minutes timer
        setCanResendOtp(false);
        setResendCountdown(60); // Reset 1 minute cooldown
        showToast("New OTP sent to your email", "success");
      } else {
        setGeneralError(data.message || "Failed to send OTP");
        showToast(data.message || "Failed to send OTP", "error");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
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
            <Text style={styles.welcomeText}>OTP Verification</Text>
            <Text style={styles.subtitleText}>
              Enter the 6-digit code sent to {displayEmail}
            </Text>

            {timeRemaining > 0 && (
              <View style={styles.otpTimerContainer}>
                <Text style={styles.otpTimerText}>
                  Code expires in: <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                </Text>
              </View>
            )}

            {timeRemaining === 0 && (
              <View style={styles.otpExpiredContainer}>
                <Text style={styles.otpExpiredText}>
                  Your OTP has expired. Please request a new one.
                </Text>
              </View>
            )}

            {/* Show general error if any */}
            {generalError ? (
              <View style={styles.generalErrorContainer}>
                <Text style={styles.errorText}>{generalError}</Text>
              </View>
            ) : null}

            {/* OTP Input */}
            <View style={styles.otpSection}>
              <Text style={styles.inputLabel}>Enter Verification Code</Text>
              <OTPInputField 
                length={6}
                value={otp}
                onOTPChange={(otpValue) => {
                  setOtp(otpValue);
                  if (otpError) {
                    setOtpError("");
                  }
                }}
              />
              {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleVerifyOtp}
              activeOpacity={0.8}
              disabled={isLoading || timeRemaining === 0}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>Verify & Continue</Text>
              )}
            </TouchableOpacity>

            {/* Resend OTP option */}
            <TouchableOpacity
              style={[
                styles.resendButton,
                !canResendOtp && styles.resendButtonDisabled
              ]}
              onPress={handleResendOtp}
              activeOpacity={0.8}
              disabled={!canResendOtp || isLoading}
            >
              <Text style={[
                styles.resendButtonText,
                !canResendOtp && styles.resendButtonTextDisabled
              ]}>
                {canResendOtp ? "Resend Code" : `Resend in ${formatTime(resendCountdown)}`}
              </Text>
            </TouchableOpacity>            
            
            {/* Help text */}
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                Didn&apos;t receive the code? Check your spam folder or try a different email address.
              </Text>
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
  otpSection: {
    marginVertical: 15,
  },
  otpTimerContainer: {
    backgroundColor: "#E8F5FF",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: "center",
  },
  otpTimerText: {
    color: "#0066CC",
    fontSize: 14,
  },
  otpExpiredContainer: {
    backgroundColor: "#FFF0E6",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: "center",
  },
  otpExpiredText: {
    color: "#FF6B01",
    fontSize: 14,
  },
  timerText: {
    fontWeight: "bold",
  },
  generalErrorContainer: {
    backgroundColor: "#FFEEEE",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 5,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
    color: "#666",
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
  resendButton: {
    alignSelf: "center",
    padding: 10,
    marginBottom: 20,
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonText: {
    color: primaryColor,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  resendButtonTextDisabled: {
    textDecorationLine: "none",
  },
  helpContainer: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginTop: 10,
  },
  helpText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    lineHeight: 18,
  },
});

export default OTPVerificationScreen;
