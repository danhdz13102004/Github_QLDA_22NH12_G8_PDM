import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video'; // Sử dụng expo-video
import ApiService from '../../../services/ApiService';

const { height } = Dimensions.get('window');

export default function SignDetail() {
  const [signData, setSignData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const router = useRouter();
  const { signId } = useLocalSearchParams();

  const videoRef = useRef(null);
  const player = useVideoPlayer(
    signData?.videos?.[currentVideoIndex]?.id
      ? { uri: ApiService.getVideoStreamUrl(signData.videos[currentVideoIndex].id) }
      : null,
    (player) => {
      player.loop = true; // Thiết lập loop tương tự isLooping
    }
  );

  const fetchSignDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ApiService.fetchSignById(signId);
      setSignData(data);
    } catch (error) {
      console.error('Error fetching sign details:', error);
      Alert.alert('Error', 'Failed to load sign details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [signId]);

  useEffect(() => {
    if (signId) {
      fetchSignDetail();
    }
  }, [signId, fetchSignDetail]);

  useEffect(() => {
    // Cập nhật nguồn video khi currentVideoIndex hoặc signData thay đổi
    if (signData?.videos?.[currentVideoIndex]?.id) {
      player.replace({ uri: ApiService.getVideoStreamUrl(signData.videos[currentVideoIndex].id) });
    }
  }, [currentVideoIndex, signData]);

  useEffect(() => {
    // Lắng nghe trạng thái phát video
    const subscription = player.addListener('playingChange', (isPlaying) => {
      setIsPlaying(isPlaying);
      setVideoLoading(!isPlaying && player.buffering);
    });

    return () => subscription.remove();
  }, [player]);

  const togglePlayback = async () => {
    if (isPlaying) {
      await player.pause();
    } else {
      await player.play();
    }
  };

  const changePlaybackSpeed = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackSpeed(newSpeed);
    player.playbackRate = newSpeed;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Learn the ASL sign for "${signData.gestureName}": ${signData.description}`,
        title: `ASL Sign: ${signData.gestureName}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Ở đây bạn có thể thêm logic để lưu vào AsyncStorage hoặc gửi đến API
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading sign details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!signData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Sign not found</Text>
          <Text style={styles.errorSubtitle}>
            The requested sign could not be loaded.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {signData.gestureName}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={toggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#ff6b6b" : "#666"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Section */}
        <View style={styles.videoSection}>
          {signData.videos && signData.videos.length > 0 ? (
            <View style={styles.videoContainer}>
              <VideoView
                ref={videoRef}
                style={styles.video}
                player={player}
                nativeControls={false}
                contentFit="contain"
              />
              
              {videoLoading && (
                <View style={styles.videoLoadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}

              {/* Video Controls */}
              <View style={styles.videoControls}>
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={togglePlayback}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={32} 
                    color="#fff" 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.speedButton}
                  onPress={changePlaybackSpeed}
                >
                  <Text style={styles.speedText}>{playbackSpeed}x</Text>
                </TouchableOpacity>
              </View>

              {/* Video Navigation */}
              {signData.videos.length > 1 && (
                <View style={styles.videoNavigation}>
                  <TouchableOpacity
                    style={[styles.navButton, currentVideoIndex === 0 && styles.navButtonDisabled]}
                    onPress={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))}
                    disabled={currentVideoIndex === 0}
                  >
                    <Ionicons name="chevron-back" size={20} color={currentVideoIndex === 0 ? "#ccc" : "#0066cc"} />
                  </TouchableOpacity>
                  
                  <Text style={styles.videoCounter}>
                    {currentVideoIndex + 1} of {signData.videos.length}
                  </Text>
                  
                  <TouchableOpacity
                    style={[styles.navButton, currentVideoIndex === signData.videos.length - 1 && styles.navButtonDisabled]}
                    onPress={() => setCurrentVideoIndex(Math.min(signData.videos.length - 1, currentVideoIndex + 1))}
                    disabled={currentVideoIndex === signData.videos.length - 1}
                  >
                    <Ionicons name="chevron-forward" size={20} color={currentVideoIndex === signData.videos.length - 1 ? "#ccc" : "#0066cc"} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noVideoContainer}>
              <Ionicons name="videocam-off-outline" size={64} color="#ccc" />
              <Text style={styles.noVideoText}>No video available</Text>
              <Text style={styles.noVideoSubtext}>
                Video demonstration for this sign is coming soon.
              </Text>
            </View>
          )}
        </View>

        {/* Sign Information */}
        <View style={styles.infoSection}>
          <View style={styles.signHeader}>
            <Text style={styles.signName}>{signData.gestureName}</Text>
            <View style={styles.signBadge}>
              <Text style={styles.signBadgeText}>ASL</Text>
            </View>
          </View>
          
          <Text style={styles.signDescription}>
            {signData.description || 'No description available for this sign.'}
          </Text>
        </View>

        {/* Learning Tips */}
        <View style={styles.tipsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb-outline" size={24} color="#0066cc" />
            <Text style={styles.sectionTitle}>Learning Tips</Text>
          </View>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>1</Text>
              </View>
              <Text style={styles.tipText}>
                Watch the video multiple times to understand the hand movement
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>2</Text>
              </View>
              <Text style={styles.tipText}>
                Practice the sign slowly before increasing speed
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>3</Text>
              </View>
              <Text style={styles.tipText}>
                Pay attention to hand shape, movement, and facial expressions
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>4</Text>
              </View>
              <Text style={styles.tipText}>
                Use the slow motion feature to see details clearly
              </Text>
            </View>
          </View>
        </View>

        {/* Practice Section */}
        <View style={styles.practiceSection}>
          <TouchableOpacity 
            style={styles.practiceButton}
            onPress={() => router.push('/(tabs)/Recognize')}
          >
            <Ionicons name="camera-outline" size={24} color="#fff" />
            <Text style={styles.practiceButtonText}>Practice with Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quizButton}
            onPress={() => router.push('/(tabs)/Practice')}
          >
            <Ionicons name="help-circle-outline" size={24} color="#0066cc" />
            <Text style={styles.quizButtonText}>Take Quiz</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 10,
    textTransform: 'capitalize',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  videoSection: {
    backgroundColor: '#000',
    aspectRatio: 16/9,
    maxHeight: height * 0.4,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  videoControls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
  },
  speedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  videoNavigation: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  videoCounter: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6

,
    borderRadius: 12,
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  noVideoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  noVideoSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 1,
  },
  signHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  signName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
    flex: 1,
  },
  signBadge: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  signBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  signDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  tipsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  tipsList: {
    marginLeft: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  practiceSection: {
    padding: 20,
    marginTop: 10,
  },
  practiceButton: {
    backgroundColor: '#0066cc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  practiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quizButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0066cc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
  },
  quizButtonText: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 20,
  },
});