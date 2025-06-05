import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();
  
  const handleNavigation = (route) => {
    router.push(route);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <Image 
              source={{ uri: 'https://static.vecteezy.com/system/resources/previews/039/845/042/non_2x/male-default-avatar-profile-gray-picture-grey-photo-placeholder-gray-profile-anonymous-face-picture-illustration-isolated-on-white-background-free-vector.jpg' }} 
              style={styles.profileImage} 
            />
            <View>
              <Text style={styles.greeting}>Hi, Danh!</Text>
              <Text style={styles.subtitle}>Ready to communicate?</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.recognizeButton} onPress={() => handleNavigation('/(tabs)/Recognize')}>
          <View style={styles.recognizeIcon}>
            <Ionicons name="hand-left-outline" size={30} color="white" />
          </View>
          <View>
            <Text style={styles.recognizeText}>Start ASL Recognition</Text>
            <Text style={styles.recognizeSubtext}>Translate sign language in real-time</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => handleNavigation('/(tabs)/Dictionary')}>
            <Ionicons name="book-outline" size={30} color="#666" />
            <Text style={styles.featureText}>Dictionary</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.featureCard} onPress={() => handleNavigation('/(tabs)/Practice')}>
            <Ionicons name="fitness-outline" size={30} color="#666" />
            <Text style={styles.featureText}>Practice</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.featureCard} onPress={() => handleNavigation('/(tabs)/Recognize')}>
            <Ionicons name="camera-outline" size={30} color="#666" />
            <Text style={styles.featureText}>Recognize</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.featureCard} onPress={() => handleNavigation('/(tabs)/Profile')}>
            <Ionicons name="person-outline" size={30} color="#666" />
            <Text style={styles.featureText}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Translations</Text>
          
          <View style={styles.translationItem}>
            <Text style={styles.translationText}>"Hello, how are you?"</Text>
            <Text style={styles.translationTime}>Today, 2:30 PM</Text>
          </View>
          
          <View style={styles.paginationDots}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#ddd',
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
  },
  recognizeButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recognizeIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  recognizeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recognizeSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: '#fff',
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  featureText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  recentSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  translationItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  translationText: {
    fontSize: 16,
    marginBottom: 5,
  },
  translationTime: {
    color: '#666',
    fontSize: 12,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
  },  activeDot: {
    backgroundColor: '#6c5ce7',
  },
});