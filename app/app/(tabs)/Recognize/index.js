import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

const primaryColor = "#7c1ddb";

const SignLanguageApp = () => {
  const [currentSentence, setCurrentSentence] = useState('');
  const [translatedSentences, setTranslatedSentences] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const sentenceBuffer = useRef('');
  const isAutoSpeakEnabled = useRef(true); // Use ref to avoid re-renders
  useEffect(() => {
    connectToWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);



  const connectToWebSocket = () => {
  if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
    console.log('WebSocket already connected or connecting');
    return;
  }

  try {
    const wsUrl = 'ws://192.168.88.143:8889';
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      console.log('Connected to WebSocket');
      setCurrentSentence(''); // Reset current sentence on new connection
    };

    wsRef.current.onmessage = (event) => {
      const receivedWord = event.data;
      console.log('Received message:', receivedWord);
      handleReceivedWord(receivedWord);
    };

    wsRef.current.onclose = (event) => {
      setIsConnected(false);
      if (!event.wasClean) {
        console.warn('WebSocket closed unexpectedly:', event.code, event.reason);
      }
      wsRef.current = null; // Important: reset before reconnect
      setTimeout(connectToWebSocket, 3000); // Reconnect
    };

    wsRef.current.onerror = (error) => {
      setIsConnected(false);
      console.error('WebSocket error:', error);
    };
  } catch (error) {
    console.error('Connection failed:', error);
  }
};

const handleReceivedWord = (word) => {
  const cleanWord = word.trim();
  const isEnd = cleanWord.toLowerCase() === 'end.';

  console.log('Received word:', cleanWord);
  console.log('Current sentence before processing:', sentenceBuffer.current);

  if (isEnd) {
    const finalSentence = sentenceBuffer.current.trim();
    console.log('Current sentence before cleanup:', sentenceBuffer.current);
    console.log('Final sentence:', finalSentence);

    if (finalSentence) {
      const newSentence = {
        id: Date.now().toString(),
        text: finalSentence,
        timestamp: new Date().toLocaleTimeString(),
      };

      setTranslatedSentences(prev => {
        console.log('Previous sentences count:', prev.length);
        const updated = [newSentence, ...prev];
        console.log('Updated sentences count:', updated.length);
        return updated;
      });

      if (isAutoSpeakEnabled) {
        console.log('Auto-speak enabled, speaking:', finalSentence);
        speakText(finalSentence);
      }
    }

    sentenceBuffer.current = '';
    setCurrentSentence('');
    console.log('Current sentence reset to empty.');
  } else {
    // Append the word
    sentenceBuffer.current = sentenceBuffer.current
      ? `${sentenceBuffer.current} ${cleanWord}`
      : cleanWord;

    setCurrentSentence(sentenceBuffer.current); // keep UI in sync
    console.log('Adding word to current sentence');
    console.log('New current sentence:', sentenceBuffer.current);
  }
};




  const speakText = (text) => {
    // Cancel any ongoing speech before starting a new one
    Speech.stop();
    
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.75,
      onStart: () => console.log('Started speaking'),
      onDone: () => console.log('Finished speaking'),
      onError: (error) => console.error('Speech error:', error),
    });
  };

  const toggleAutoSpeak = () => {
    isAutoSpeakEnabled.valiue = !isAutoSpeakEnabled.value;
  };

  const renderSentenceItem = ({ item }) => (
    <View style={styles.sentenceItem}>
      <View style={styles.sentenceContent}>
        <Text style={styles.sentenceText}>{item.text}</Text>
        <Text style={styles.timestampText}>{item.timestamp}</Text>
      </View>
      <TouchableOpacity
        style={styles.hearButton}
        onPress={() => speakText(item.text)}
      >
        <Ionicons name="volume-high" size={24} color={primaryColor} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sign Language Recognition</Text>
        <View style={styles.connectionStatus}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? '#4CAF50' : '#F44336' },
            ]}
          />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      <View style={styles.topHalf}>
        <View style={styles.currentTranslationHeader}>
          <Text style={styles.sectionTitle}>Current Translation</Text>
          <TouchableOpacity
            style={[
              styles.autoSpeakButton,
              isAutoSpeakEnabled && styles.autoSpeakButtonActive,
            ]}
            onPress={toggleAutoSpeak}
          >
            <Ionicons
              name={isAutoSpeakEnabled ? 'volume-high' : 'volume-mute'}
              size={20}
              color={isAutoSpeakEnabled ? '#fff' : primaryColor}
            />
            <Text
              style={[
                styles.autoSpeakText,
                isAutoSpeakEnabled && styles.autoSpeakTextActive,
              ]}
            >
              Auto-speak
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.currentSentenceContainer}>
          <Text style={styles.currentSentenceText}>
            {currentSentence || ''}
          </Text>
        </View>
      </View>

      <View style={styles.bottomHalf}>
        <Text style={styles.sectionTitle}>Previous Translations</Text>
        {translatedSentences.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No translations yet</Text>
          </View>
        ) : (
          <FlatList
            data={translatedSentences}
            renderItem={renderSentenceItem}
            keyExtractor={(item) => item.id}
            style={styles.sentencesList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: primaryColor,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  connectionStatus: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: '#fff', fontSize: 12 },
  topHalf: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
  },
  currentTranslationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: primaryColor },
  autoSpeakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: primaryColor,
  },
  autoSpeakButtonActive: {
    backgroundColor: primaryColor,
  },
  autoSpeakText: {
    marginLeft: 8,
    color: primaryColor,
    fontWeight: 'bold',
  },
  autoSpeakTextActive: {
    color: '#fff',
  },
  currentSentenceContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: primaryColor,
  },
  currentSentenceText: {
    fontSize: 44,
    color: '#000',
    fontWeight: 'bold',
  },
  bottomHalf: {
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 3,
  },
  sentenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f0ff',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: primaryColor,
  },
  sentenceContent: { flex: 1, marginRight: 12 },
  sentenceText: { fontSize: 18, color: '#000', fontWeight: 'bold' },
  timestampText: { fontSize: 12, color: '#999', marginTop: 4 },
  hearButton: { 
    padding: 10,
    backgroundColor: '#f0f0ff',
    borderRadius: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
  },
});

export default SignLanguageApp;
