import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { primaryColor } from '../constants/Colors';

const { width } = Dimensions.get('window');

const OTPInputField = ({ length = 6, onOTPChange, value = '' }) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputs = useRef([]);

  useEffect(() => {
    if (value) {
      const otpArray = value.split('').slice(0, length);
      while (otpArray.length < length) {
        otpArray.push('');
      }
      setOtp(otpArray);
    }
  }, [value, length]);

  const handleChangeText = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Call the callback with the complete OTP
    onOTPChange(newOtp.join(''));

    // Auto-focus next input
    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace - move to previous input if current is empty
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index) => {
    // Clear the input when focused to allow easy replacement
    if (otp[index]) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      onOTPChange(newOtp.join(''));
    }
  };

  return (
    <View style={styles.container}>
      {Array(length).fill().map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputs.current[index] = ref)}
          style={[
            styles.input,
            otp[index] ? styles.inputFilled : styles.inputEmpty,
          ]}
          value={otp[index]}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          keyboardType="numeric"
          maxLength={1}
          textAlign="center"
          returnKeyType={index === length - 1 ? 'done' : 'next'}
          blurOnSubmit={index === length - 1}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingHorizontal: 5,
  },
  input: {
    width: (width - 95) / 6, // Better responsive width with more spacing
    height: 60, // Slightly taller
    borderWidth: 2,
    borderRadius: 12, // More rounded corners
    fontSize: 20, // Larger font
    fontWeight: 'bold',
    backgroundColor: '#fff',
    textAlign: 'center',
    // Add shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    // Add elevation for Android
    elevation: 3,
  },
  inputEmpty: {
    borderColor: '#E1E5E9',
    color: '#333',
    backgroundColor: '#FAFBFC',
  },
  inputFilled: {
    borderColor: primaryColor,
    color: primaryColor,
    backgroundColor: '#fff',
    transform: [{ scale: 1.02 }], // Slight scale effect when filled
  },
});

export default OTPInputField;
