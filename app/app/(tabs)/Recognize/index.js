import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const socketRef = useRef(null);
  const sentenceBuffer = useRef('');
  
  // 🔧 Thêm ref để track auto-speak setting
  const isAutoSpeakEnabledRef = useRef(true);

  // Update ref whenever state changes
  useEffect(() => {
    isAutoSpeakEnabledRef.current = isAutoSpeakEnabled;
    console.log('Auto-speak ref updated to:', isAutoSpeakEnabled);
  }, [isAutoSpeakEnabled]);

  // Improved speech function with better error handling
  const speakText = useCallback((text) => {
    if (!text || text.trim() === '') {
      console.log('No text to speak');
      return;
    }

    // 🔧 Sử dụng ref thay vì state để check real-time value
    if (!isAutoSpeakEnabledRef.current) {
      console.log('Auto-speak is disabled (checked via ref), not speaking');
      return;
    }

    try {
      // Cancel any ongoing speech before starting a new one
      Speech.stop();
      setIsSpeaking(false);

      console.log('Speaking text:', text);
      setIsSpeaking(true);

      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.75,
        onStart: () => {
          console.log('Started speaking');
          setIsSpeaking(true);
        },
        onDone: () => {
          console.log('Finished speaking');
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setIsSpeaking(false);
        },
        onStopped: () => {
          console.log('Speech stopped');
          setIsSpeaking(false);
        },
      });
    } catch (error) {
      console.error('Error in speakText:', error);
      setIsSpeaking(false);
    }
  }, []); // 🔧 Bỏ dependency vì sử dụng ref

  // Improved toggle function with immediate speech stop
  const toggleAutoSpeak = useCallback(() => {
    setIsAutoSpeakEnabled(prev => {
      const newValue = !prev;
      console.log('Toggling auto-speak from', prev, 'to', newValue);
      
      // 🔧 Update ref immediately
      isAutoSpeakEnabledRef.current = newValue;
      
      // Nếu đang tắt auto-speak, dừng ngay lập tức
      if (!newValue) {
        try {
          Speech.stop();
          setIsSpeaking(false);
          console.log('Auto-speak disabled, stopped current speech');
        } catch (error) {
          console.error('Error stopping speech:', error);
        }
      }
      
      return newValue;
    });
  }, []);

  const handleReceivedWord = useCallback((word) => {
    const cleanWord = word.trim();
    const isEnd = cleanWord.toLowerCase() === 'end.';

    console.log('Received word:', cleanWord);
    console.log('Current sentence before processing:', sentenceBuffer.current);

    if (isEnd) {
      const finalSentence = sentenceBuffer.current.trim();
      console.log('Final sentence:', finalSentence);

      if (finalSentence) {
        const newSentence = {
          id: Date.now().toString(),
          text: finalSentence,
          timestamp: new Date().toLocaleTimeString(),
        };

        setTranslatedSentences(prev => {
          const updated = [newSentence, ...prev];
          return updated;
        });

        // 🔧 Check auto-speak setting trước khi gọi speakText
        console.log('Checking auto-speak before speaking. Current value:', isAutoSpeakEnabledRef.current);
        
        if (isAutoSpeakEnabledRef.current) {
          console.log('Auto-speak enabled, speaking:', finalSentence);
          speakText(finalSentence);
        } else {
          console.log('Auto-speak disabled, NOT speaking');
        }
      }

      sentenceBuffer.current = '';
      setCurrentSentence('');
    } else {
      // Append the word
      sentenceBuffer.current = sentenceBuffer.current
        ? `${sentenceBuffer.current} ${cleanWord}`
        : cleanWord;
      setCurrentSentence(sentenceBuffer.current);
    }
  }, [speakText]); // 🔧 Thêm speakText dependency

  const connectToTcpSocket = useCallback(() => {
    // Kiểm tra xem đã có kết nối hay chưa
    if (socketRef.current && !socketRef.current.destroyed) {
      console.log('TCP Socket already connected - reusing connection');
      return;
    }

    console.log('Creating new TCP connection...');

    try {
      const options = {
        port: 8889,
        host: '172.20.10.3',
        localAddress: '0.0.0.0',
        reuseAddress: true,
      };

      socketRef.current = TcpSocket.createConnection(options, () => {
        setIsConnected(true);
        console.log('✅ Connected to TCP Socket');
        setCurrentSentence('');
      });

      socketRef.current.on('data', (data) => {
        const receivedWord = data.toString('utf8');
        console.log('📤 Received message:', receivedWord);
        handleReceivedWord(receivedWord);
      });

      socketRef.current.on('close', (hadError) => {
        setIsConnected(false);
        console.log('🔌 TCP Socket closed', hadError ? 'with error' : 'normally');
        socketRef.current = null;
        
        // Auto-reconnect sau 3 giây
        setTimeout(() => {
          if (!socketRef.current) {
            console.log('🔄 Attempting to reconnect...');
            connectToTcpSocket();
          }
        }, 3000);
      });

      socketRef.current.on('error', (error) => {
        setIsConnected(false);
        console.error('❌ TCP Socket error:', error);
        socketRef.current = null;
      });
    } catch (error) {
      console.error('❌ TCP Connection failed:', error);
      setIsConnected(false);
    }
  }, [handleReceivedWord]); // 🔧 Thêm handleReceivedWord dependency

  useEffect(() => {
    // Chỉ kết nối một lần khi component mount
    connectToTcpSocket();

    return () => {
      console.log('🧹 Cleaning up TCP connection...');
      
      // Cleanup speech
      try {
        Speech.stop();
        setIsSpeaking(false);
      } catch (error) {
        console.error('Error stopping speech on cleanup:', error);
      }
      
      // Cleanup socket
      if (socketRef.current && !socketRef.current.destroyed) {
        try {
          socketRef.current.destroy();
          socketRef.current = null;
        } catch (error) {
          console.error('Error destroying socket:', error);
        }
      }
    };
  }, [connectToTcpSocket]); // 🔧 Thêm connectToTcpSocket dependency

  // Manual speak function for sentence items
  const handleManualSpeak = useCallback((text) => {
    try {
      Speech.stop();
      setIsSpeaking(false);

      console.log('Manual speaking:', text);
      setIsSpeaking(true);

      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.75,
        onStart: () => {
          console.log('Manual speech started');
          setIsSpeaking(true);
        },
        onDone: () => {
          console.log('Manual speech finished');
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('Manual speech error:', error);
          setIsSpeaking(false);
        },
        onStopped: () => {
          console.log('Manual speech stopped');
          setIsSpeaking(false);
        },
      });
    } catch (error) {
      console.error('Error in manual speak:', error);
      setIsSpeaking(false);
    }
  }, []);

  const renderSentenceItem = ({ item }) => (
    <View style={styles.sentenceItem}>
      <View style={styles.sentenceContent}>
        <Text style={styles.sentenceText}>{item.text || 'Text'}</Text>
        <Text style={styles.timestampText}>{item.timestamp || 'Timestamp'}</Text>
      </View>
      <TouchableOpacity
        style={styles.hearButton}
        onPress={() => handleManualSpeak(item.text)}
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
              {/* 🔧 Logic hiển thị text dựa vào trạng thái */}
              {!isAutoSpeakEnabled 
                ? 'Auto-speak' 
                : isSpeaking 
                  ? 'Speaking...' 
                  : 'Auto-speak'
              }
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
    minWidth: 110, // 🔧 Thêm minWidth để tránh vỡ giao diện
  },
  autoSpeakButtonActive: {
    backgroundColor: primaryColor,
  },
  autoSpeakText: {
    marginLeft: 8,
    color: primaryColor,
    fontWeight: 'bold',
    fontSize: 12, // 🔧 Giảm font size một chút để vừa khung
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
