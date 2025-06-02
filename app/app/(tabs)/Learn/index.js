// filepath: e:\QLDA\FINAL\Github_QLDA_22NH12_G8_PDM\app\app\(tabs)\Learn\index.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('alphabet');
  const router = useRouter();
  
  const categories = [
    { id: 'alphabet', name: 'Alphabet', icon: 'text-outline' },
    { id: 'numbers', name: 'Numbers', icon: 'calculator-outline' },
    { id: 'phrases', name: 'Phrases', icon: 'chatbubble-outline' },
    { id: 'vocabulary', name: 'Vocabulary', icon: 'book-outline' },
  ];
  
  const featuredCourses = [
    {
      id: '1',
      title: 'ASL Basics',
      level: 'Beginner',
      lessons: 12,
      duration: '2 hours',
      image: 'https://via.placeholder.com/120x80',
      progress: 0.25,
    },
    {
      id: '2',
      title: 'Daily Conversation',
      level: 'Intermediate',
      lessons: 8,
      duration: '1.5 hours',
      image: 'https://via.placeholder.com/120x80',
      progress: 0.1,
    },
    {
      id: '3',
      title: 'Advanced Vocabulary',
      level: 'Advanced',
      lessons: 15,
      duration: '3 hours',
      image: 'https://via.placeholder.com/120x80',
      progress: 0,
    },
  ];
  
  const popularSigns = [
    { id: '1', name: 'Hello', image: 'https://via.placeholder.com/100' },
    { id: '2', name: 'Thank you', image: 'https://via.placeholder.com/100' },
    { id: '3', name: 'Please', image: 'https://via.placeholder.com/100' },
    { id: '4', name: 'Sorry', image: 'https://via.placeholder.com/100' },
    { id: '5', name: 'Love', image: 'https://via.placeholder.com/100' },
    { id: '6', name: 'Friend', image: 'https://via.placeholder.com/100' },
  ];
  
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
        size={24} 
        color={selectedCategory === item.id ? '#6c5ce7' : '#888'} 
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
  
  const renderCourse = ({ item }) => (
    <TouchableOpacity style={styles.courseCard}>
      <Image source={{ uri: item.image }} style={styles.courseImage} />
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle}>{item.title}</Text>
        <View style={styles.courseDetails}>
          <Text style={styles.courseLevel}>{item.level}</Text>
          <Text style={styles.courseMeta}>
            {item.lessons} lessons • {item.duration}
          </Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${item.progress * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(item.progress * 100)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderPopularSign = ({ item }) => (
    <TouchableOpacity style={styles.signCard}>
      <View style={styles.signImageContainer}>
        <Image source={{ uri: item.image }} style={styles.signImage} />
      </View>
      <Text style={styles.signName}>{item.name}</Text>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learn ASL</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>
      </View>
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Dictionary Quick Access */}
        <View style={styles.quickAccessContainer}>
          <TouchableOpacity 
            style={styles.dictionaryCard}
            onPress={() => router.push('/Learn/dictionary')}
          >
            <View style={styles.dictionaryIcon}>
              <Ionicons name="book" size={32} color="#fff" />
            </View>
            <View style={styles.dictionaryInfo}>
              <Text style={styles.dictionaryTitle}>ASL Dictionary</Text>
              <Text style={styles.dictionarySubtitle}>Browse all signs & videos</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#0066cc" />
          </TouchableOpacity>
        </View>
        
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
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Courses</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={featuredCourses}
            renderItem={renderCourse}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Signs</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.signsGrid}>
            {popularSigns.map((sign) => (
              <View key={sign.id} style={styles.signWrapper}>
                {renderPopularSign({ item: sign })}
              </View>
            ))}
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.practiceCard}
          onPress={() => router.push('/(tabs)/Practice')}
        >
          <View style={styles.practiceContent}>
            <Ionicons name="fitness-outline" size={36} color="#6c5ce7" />
            <View style={styles.practiceTextContainer}>
              <Text style={styles.practiceTitle}>Practice Mode</Text>
              <Text style={styles.practiceDescription}>
                Test your ASL skills through interactive exercises
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#6c5ce7" />
        </TouchableOpacity>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    paddingVertical: 10,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  selectedCategory: {
    backgroundColor: '#f0edff',
  },
  categoryText: {
    marginLeft: 8,
    fontWeight: '500',
    color: '#888',
  },
  selectedCategoryText: {
    color: '#6c5ce7',
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionLink: {
    color: '#6c5ce7',
    fontWeight: '500',
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 1,
  },
  courseImage: {
    width: 100,
    height: 100,
  },
  courseInfo: {
    flex: 1,
    padding: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  courseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  courseLevel: {
    backgroundColor: '#f0edff',
    color: '#6c5ce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  courseMeta: {
    color: '#888',
    fontSize: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginRight: 10,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#6c5ce7',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    width: 35,
  },
  signsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  signWrapper: {
    width: '33.33%',
    padding: 5,
  },
  signCard: {
    alignItems: 'center',
  },
  signImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    elevation: 1,
  },
  signImage: {
    width: '60%',
    height: '60%',
    borderRadius: 8,
  },
  signName: {
    fontSize: 12,
    textAlign: 'center',
  },
  practiceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    elevation: 1,
  },
  practiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  practiceTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  practiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  practiceDescription: {
    fontSize: 12,
    color: '#666',
  },  bottomPadding: {
    height: 40,
  },
  quickAccessContainer: {
    marginTop: 10,
    marginHorizontal: 20,
  },
  dictionaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 10,
  },
  dictionaryIcon: {
    backgroundColor: '#0066cc',
    borderRadius: 10,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dictionaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dictionaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dictionarySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});