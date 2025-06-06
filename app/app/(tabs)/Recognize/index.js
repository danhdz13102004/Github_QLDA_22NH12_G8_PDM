import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const WS_URL = 'ws://192.168.1.19:8765'; // Adjust to your WebSocket server

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraType, setCameraType] = useState('front');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedWord, setRecognizedWord] = useState('');
  const cameraRef = useRef(null);
  const wsRef = useRef(null);
  const frameCapturingRef = useRef(false);
  const isCapturing = useRef(false)
  useEffect(() => {
    if (!permission) requestPermission();

    return () => {
      stopCamera();
    };
  }, [permission]);

  const startCamera = () => {
    setCameraActive(true);
  };

  const stopCamera = () => {
    setCameraActive(false);
    setIsRecognizing(false);
    stopFrameStreaming();

    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const toggleCamera = () => {
    setCameraType((prevType) =>
      prevType === 'back'
        ? 'front'
        : 'back'
    );
  };

  const startRecognition = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }
    try {
      setIsRecognizing(true);
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        startFrameStreaming();
      };

      wsRef.current.onmessage = (event) => {
        setRecognizedWord(event.data);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        Alert.alert('Connection Error', 'Failed to connect to the recognition server');
        setIsRecognizing(false);
        stopFrameStreaming();
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket closed');
        setIsRecognizing(false);
        stopFrameStreaming();
      };
    } catch (error) {
      console.error('Error starting recognition:', error);
      Alert.alert('Error', 'Failed to start recognition');
      setIsRecognizing(false);
      stopFrameStreaming();
    }
  };

  const captureFrame = async () => {
    if (!cameraRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (isCapturing.current) return;
    isCapturing.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.1});
      if (photo?.base64) {
        wsRef.current.send(photo.base64);
        console.log('📤 Frame sent');
      }
    } catch (error) {
      console.error('❌ Frame capture/send error:', error);
    } finally{
      isCapturing.current = false
    }
  };

  const startFrameStreaming = () => {
    frameCapturingRef.current = true;
    wsRef.current.intervalId = setInterval(() => {
      if (frameCapturingRef.current) {
        captureFrame();
      }
    }, 1); // 1 FPS for testing, adjust as needed
  };

  const stopFrameStreaming = () => {
    frameCapturingRef.current = false;
    if (wsRef.current?.intervalId) {
      clearInterval(wsRef.current.intervalId);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No access to camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {cameraActive ? (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
            pictureSize='512x288'
            animateShutter={false}
          >
            <View style={styles.recognitionOverlay}>
              {recognizedWord && (
                <View style={styles.resultContainer}>
                  <Text style={styles.resultText}>{recognizedWord}</Text>
                </View>
              )}

              {isRecognizing && (
                <View style={styles.recognitionStatus}>
                </View>
              )}

              <View style={styles.controlsContainer}>
                <TouchableOpacity style={styles.iconButton} onPress={toggleCamera}>
                  <Ionicons name="camera-reverse-outline" size={28} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.recognizeButton, isRecognizing && styles.recognizeButtonActive]}
                  onPress={isRecognizing ? stopCamera : startRecognition}
                >
                  <Text style={styles.recognizeButtonText}>
                    {isRecognizing ? 'Stop' : 'Recognize'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton} onPress={stopCamera}>
                  <Ionicons name="close-circle-outline" size={28} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      ) : (
        <View style={styles.startContainer}>
          <View style={styles.introContent}>
            <Ionicons name="hand-left" size={80} color="#6c5ce7" />
            <Text style={styles.title}>Sign Language Recognition</Text>
            <Text style={styles.description}>
              Point your camera at sign language gestures and get real-time translation to text
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startCamera}>
            <Text style={styles.startButtonText}>Start Camera</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, color: '#e74c3c', marginBottom: 20, textAlign: 'center' },
  permissionButton: { backgroundColor: '#6c5ce7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  permissionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  recognitionOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  recognitionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderRadius: 20,
    padding:30,
    marginBottom: 20,
  },
  recognitionStatusText: { color: 'white', fontSize: 16 },
  controlsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  recognizeButton: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
  },
  recognizeButtonActive: { backgroundColor: '#e74c3c' },
  recognizeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  resultContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
  },
  resultText: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  startContainer: { flex: 1, justifyContent: 'space-between', padding: 30 },
  introContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 10, textAlign: 'center' },
  description: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  startButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});