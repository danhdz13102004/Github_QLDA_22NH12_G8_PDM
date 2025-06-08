import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { primaryColor } from '../constants/Colors';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success', 'error', 'info'
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const showToast = (message, type = 'success', duration = 3000) => {
    setToastMessage(message);
    setToastType(type);
    setIsVisible(true);

    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    setTimeout(() => {
      hideToast();
    }, duration);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });
  };

  const getToastStyle = () => {
    switch (toastType) {
      case 'success':
        return { backgroundColor: '#4CAF50' };
      case 'error':
        return { backgroundColor: '#f44336' };
      case 'info':
        return { backgroundColor: primaryColor };
      default:
        return { backgroundColor: '#4CAF50' };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {isVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            getToastStyle(),
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    zIndex: 9999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
