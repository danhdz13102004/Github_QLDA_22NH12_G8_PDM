import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ApiService from '../../../services/ApiService';

export default function Dictionary() {
  const [signs, setSigns] = useState([]);
  const [filteredSigns, setFilteredSigns] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const categories = [
    { id: 'all', name: 'All', icon: 'grid-outline' },
    { id: 'basic', name: 'Basic', icon: 'home-outline' },
    { id: 'emotions', name: 'Emotions', icon: 'heart-outline' },
    { id: 'family', name: 'Family', icon: 'people-outline' },
    { id: 'actions', name: 'Actions', icon: 'flash-outline' },
    { id: 'time', name: 'Time', icon: 'time-outline' },
    { id: 'places', name: 'Places', icon: 'location-outline' },
  ];

  // Category mapping for signs
  const getCategoryForSign = (gestureName) => {
    const basicWords = ['hello', 'thank', 'yes', 'no', 'please', 'sorry', 'help'];
    const emotionWords = ['love', 'happy', 'sad', 'good', 'bad', 'beautiful'];
    const familyWords = ['friend', 'family', 'mother', 'father', 'brother', 'sister', 'child'];
    const actionWords = ['eat', 'drink', 'sleep', 'work', 'go', 'come', 'stop', 'start', 'finish', 'listen', 'speak', 'read', 'write', 'play', 'travel', 'buy', 'sell', 'walk', 'sit', 'stand', 'jump'];
    const timeWords = ['today', 'tomorrow', 'yesterday', 'morning', 'night', 'week', 'month', 'year', 'always', 'never', 'sometimes', 'often', 'now', 'later', 'again'];
    const placeWords = ['school', 'home', 'hospital', 'room', 'door', 'window', 'house', 'store'];

    if (basicWords.includes(gestureName)) return 'basic';
    if (emotionWords.includes(gestureName)) return 'emotions';
    if (familyWords.includes(gestureName)) return 'family';
    if (actionWords.includes(gestureName)) return 'actions';
    if (timeWords.includes(gestureName)) return 'time';
    if (placeWords.includes(gestureName)) return 'places';
    return 'all';
  };

  useEffect(() => {
    fetchSigns();
  }, []);

  useEffect(() => {
    filterSigns();
  }, [signs, selectedCategory, searchQuery]);

  const fetchSigns = async () => {
    try {
      setLoading(true);
      const data = await ApiService.fetchSigns();
      setSigns(data);
      // console.log("Data fetched successfully:", data);
    } catch (error) {
      console.error('Error fetching signs:', error);
      Alert.alert('Error', 'Failed to load signs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSigns();
    setRefreshing(false);
  };
  const filterSigns = useCallback(() => {
    let filtered = signs;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(sign => 
        getCategoryForSign(sign.gestureName) === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(sign =>
        sign.gestureName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sign.description && sign.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredSigns(filtered);
  }, [signs, selectedCategory, searchQuery]);

  const handleSignPress = (sign) => {
    router.push({
      pathname: '/Learn/signDetail',
      params: { signId: sign.id, signName: sign.gestureName }
    });
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.selectedCategory
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Ionicons 
        name={item.icon} 
        size={20} 
        color={selectedCategory === item.id ? '#fff' : '#666'} 
      />
      <Text 
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderSign = ({ item }) => (
    <TouchableOpacity
      style={styles.signCard}
      onPress={() => handleSignPress(item)}
    >
      <View style={styles.signImageContainer}>
        <View style={styles.signPlaceholder}>
          <Ionicons name="hand-left-outline" size={40} color="#0066cc" />
        </View>
      </View>
      <View style={styles.signInfo}>
        <Text style={styles.signName}>{item.gestureName}</Text>
        <Text style={styles.signDescription} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>
        <View style={styles.signMeta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {getCategoryForSign(item.gestureName)}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading dictionary...</Text>
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
        <Text style={styles.headerTitle}>ASL Dictionary</Text>
        <View style={styles.headerRight}>
          <Text style={styles.signCount}>{filteredSigns.length} signs</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search signs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Signs List */}
      <FlatList
        data={filteredSigns}
        renderItem={renderSign}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.signsList}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No signs found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or category filter
            </Text>
          </View>
        }
      />
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
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  signCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 10,
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedCategory: {
    backgroundColor: '#0066cc',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  signsList: {
    padding: 20,
  },
  signCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  signImageContainer: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  signPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f8ff',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e6f3ff',
  },
  signInfo: {
    flex: 1,
  },
  signName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  signDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  signMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#e6f3ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
