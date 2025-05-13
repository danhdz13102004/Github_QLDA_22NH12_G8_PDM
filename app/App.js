import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Camera } from 'expo-camera';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const startCamera = () => {
    setCameraActive(true);
  };

  const stopCamera = () => {
    setCameraActive(false);
    setIsRecording(false);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      // Here you would stop sending frames to the server
      setRecognizedText('Sign language recognition stopped');
    } else {
      setIsRecording(true);
      setRecognizedText('Recognizing sign language...');
      // Here you would start sending frames to the server
      // For demo purposes, we'll simulate recognition after a delay
      setTimeout(() => {
        setRecognizedText('Hello, how are you?');
      }, 3000);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Sign Language Recognition</Text>
      </View>

      {cameraActive ? (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={Camera.Constants.Type.front}
          />
          <View style={styles.overlay}>
            <TouchableOpacity
              style={[styles.button, styles.recordButton, isRecording && styles.recordingButton]}
              onPress={toggleRecording}
            >
              <Text style={styles.buttonText}>{isRecording ? 'Stop Recognition' : 'Start Recognition'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={stopCamera}>
              <Text style={styles.buttonText}>Close Camera</Text>
            </TouchableOpacity>
          </View>
        </View>      ) : (
        <View style={styles.startContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>Sign Language Recognition</Text>
          </View>
          <Text style={styles.infoText}>
            This app uses AI to recognize sign language gestures and convert them to text.
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={startCamera}>
            <Text style={styles.startButtonText}>Start Camera</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Recognition Result:</Text>
        <ScrollView style={styles.resultScroll}>
          <Text style={styles.resultText}>{recognizedText}</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#3498db',
    padding: 15,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },  logo: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  logoPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#3498db',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    padding: 20,
    fontSize: 18,
  },
  infoText: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 3,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  button: {
    backgroundColor: '#2980b9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 0.45,
  },
  recordButton: {
    backgroundColor: '#27ae60',
  },
  recordingButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    elevation: 2,
    maxHeight: 200,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultScroll: {
    maxHeight: 150,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});
