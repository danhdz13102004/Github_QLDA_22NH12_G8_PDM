import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const hasPermission = true; // luôn giả sử có quyền
  const cameraActive = true;  // luôn hiển thị giao diện camera
  const isRecognizing = false; // không thực hiện nhận diện
  const recognizedText = '';  // không có kết quả
  const cameraType = 'front'; // không thay đổi

  return (
    <SafeAreaView style={styles.container}>
      {cameraActive ? (
        <View style={styles.cameraContainer}>
          <View style={styles.camera}>
            <Image 
              source={require('../../../assets/sign-language.png')} 
              style={{width: '100%', height: '100%', resizeMode: 'cover'}}
            />

            <View style={styles.recognitionOverlay}>
              {isRecognizing && (
                <View style={styles.recognitionStatus}>
                  <Text style={styles.recognitionStatusText}>Recognizing signs...</Text>
                </View>
              )}

              <View style={styles.controlsContainer}>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="camera-reverse-outline" size={28} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.recognizeButton}>
                  <Text style={styles.recognizeButtonText}>Recognize</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="close-circle-outline" size={28} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {recognizedText ? (
              <View style={styles.resultContainer}>
                <Text style={styles.resultText}>{recognizedText}</Text>
              </View>
            ) : null}
          </View>
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

          <TouchableOpacity style={styles.startButton}>
            <Text style={styles.startButtonText}>Start Camera</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  recognitionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  recognitionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
  },
  recognitionStatusText: {
    color: 'white',
    marginLeft: 10,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recognizeButton: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
  },
  recognizeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 30,
  },
  introContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
