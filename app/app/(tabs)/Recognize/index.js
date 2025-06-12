import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import TcpSocket from 'react-native-tcp-socket';

const primaryColor = "#7c1ddb";

const SignLanguageApp = () => {
  const [currentSentence, setCurrentSentence] = useState('');
  const [translatedSentences, setTranslatedSentences] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState(true);
  const socketRef = useRef(null);
  const sentenceBuffer = useRef('');

  useEffect(() => {
    connectToTcpSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.destroy();
      }
    };
  }, [connectToTcpSocket]);
  const connectToTcpSocket = useCallback(() => {
    if (socketRef.current && !socketRef.current.destroyed) {
      console.log('TCP Socket already connected');
      return;
    }

    try {
      const options = {
        port: 8889,
        host: '172.20.10.3',
        localAddress: '0.0.0.0', // Bind to any local IP
        reuseAddress: true,
      };

      socketRef.current = TcpSocket.createConnection(options, () => {
        setIsConnected(true);
        console.log('Connected to TCP Socket');
        setCurrentSentence(''); // Reset current sentence on new connection
      });

      socketRef.current.on('data', (data) => {
        const receivedWord = data.toString('utf8');
        console.log('Received message:', receivedWord);
        handleReceivedWord(receivedWord);
      });

      socketRef.current.on('close', (hadError) => {
        setIsConnected(false);
        console.log('TCP Socket closed', hadError ? 'with error' : 'normally');
        socketRef.current = null; // Important: reset before reconnect
        setTimeout(connectToTcpSocket, 3000); // Reconnect after 3 seconds
      });

      socketRef.current.on('error', (error) => {
        setIsConnected(false);
        console.error('TCP Socket error:', error);
      });    } catch (error) {
      console.error('TCP Connection failed:', error);
    }
  }, [handleReceivedWord]);

const handleReceivedWord = useCallback((word) => {
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
      : cleanWord;    setCurrentSentence(sentenceBuffer.current); // keep UI in sync    console.log('Adding word to current sentence');
    console.log('New current sentence:', sentenceBuffer.current);
  }
}, [speakText, isAutoSpeakEnabled]);




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
  };  const toggleAutoSpeak = () => {
    setIsAutoSpeakEnabled(prev => !prev);
  };

  const renderSentenceItem = ({ item }) => (
    <View style={styles.sentenceItem}>
      <View style={styles.sentenceContent}>
        <Text style={styles.sentenceText}>{item.text || 'Text'}</Text>
        <Text style={styles.timestampText}>{item.timestamp || 'Timestamp'}</Text>
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
