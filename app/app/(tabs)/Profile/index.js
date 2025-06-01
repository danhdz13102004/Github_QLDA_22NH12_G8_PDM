// filepath: e:\QLDA\FINAL\Github_QLDA_22NH12_G8_PDM\app\app\(tabs)\Profile\index.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  // Sample user data
  const user = {
    name: 'Danh Nguyen',
    username: 'danh_nguyen',
    email: 'danh@example.com',
    profileImage: 'https://via.placeholder.com/150',
    learningStreak: 7,
    signsMastered: 42,
    coursesCompleted: 3,
    memberSince: 'March 2025',
  };
  
  // Learning statistics
  const stats = [
    { id: 'streak', title: 'Current Streak', value: `${user.learningStreak} days`, icon: 'flame-outline' },
    { id: 'signs', title: 'Signs Mastered', value: user.signsMastered.toString(), icon: 'hand-left-outline' },
    { id: 'courses', title: 'Courses Completed', value: user.coursesCompleted.toString(), icon: 'trophy-outline' },
  ];
  
  // Menu items
  const menuItems = [
    { id: 'settings', title: 'Account Settings', icon: 'settings-outline', badge: false },
    { id: 'progress', title: 'Learning Progress', icon: 'analytics-outline', badge: false },
    { id: 'favorites', title: 'Saved Signs', icon: 'bookmark-outline', badge: true, badgeCount: '5' },
    { id: 'history', title: 'Recognition History', icon: 'time-outline', badge: false },
    { id: 'notifications', title: 'Notifications', icon: 'notifications-outline', badge: true, badgeCount: '3' },
    { id: 'feedback', title: 'Send Feedback', icon: 'mail-outline', badge: false },
    { id: 'help', title: 'Help & Support', icon: 'help-circle-outline', badge: false },
  ];
  
  const handleLogout = () => {
    // Implement logout logic here
    console.log('User logged out');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.profileCard}>
          <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userHandle}>@{user.username}</Text>
          <Text style={styles.memberSince}>Member since {user.memberSince}</Text>
          
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          {stats.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name={stat.icon} size={24} color="#6c5ce7" />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={22} color="#555" />
                <Text style={styles.menuItemTitle}>{item.title}</Text>
              </View>
              
              <View style={styles.menuItemRight}>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badgeCount}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#aaa" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#6c5ce7',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userHandle: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
  memberSince: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0edff',
  },
  editButtonText: {
    color: '#6c5ce7',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  statCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 1,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0edff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 15,
    paddingVertical: 5,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemTitle: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#6c5ce7',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 1,
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#e74c3c',
  },
  versionInfo: {
    alignItems: 'center',
    marginVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});