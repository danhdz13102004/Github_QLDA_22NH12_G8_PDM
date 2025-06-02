import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_ENDPOINTS } from '../../../constants/ApiConfig';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState('');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // Additional user information
  const [userMeta, setUserMeta] = useState({
    role: '',
    createdAt: '',
    lastActive: '',
    enrolledCourses: []
  });
  
  // Store original user data to track changes
  const [originalUserData, setOriginalUserData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // Track which fields have been changed
  const [changedFields, setChangedFields] = useState({
    name: false,
    email: false,
    phone: false
  });
  
  // For password change
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // For form validation
  const [errors, setErrors] = useState({});
  
  // Active section management
  const [activeSection, setActiveSection] = useState('personal');
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('userToken');
        console.log('Stored User ID:', storedUserId);
        console.log('Token:', token);
        if (!storedUserId || !token) {
          Alert.alert('Error', 'You need to login first');
          router.replace('/(auths)/login');
          return;
        }
        
        setUserId(storedUserId);
        setIsLoading(true);
        
        // Fetch user profile data
        const response = await fetch(`${API_ENDPOINTS.USER_PROFILE}/${storedUserId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch user data');
        }
        
        console.log('User data loaded:', data);
        
        // Extract user data from the nested structure
        const userData = data.data;
        
        const userInfo = {
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
        };
        
        // Extract additional user information
        const meta = {
          role: userData.role || '',
          createdAt: userData.created_at || '',
          lastActive: userData.statistics?.lastActive || '',
          enrolledCourses: userData.enrolledCourses || []
        };
        
        setUserData(userInfo);
        setOriginalUserData(userInfo);
        setUserMeta(meta);
        setChangedFields({
          name: false,
          email: false,
          phone: false
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Handle field change
  const handleFieldChange = (field, value) => {
    const newUserData = {...userData, [field]: value};
    setUserData(newUserData);
    
    // Check if the field value is different from original
    const hasChanged = value !== originalUserData[field];
    setChangedFields({...changedFields, [field]: hasChanged});
  };
  
  // Update personal info handler
  const handleUpdatePersonalInfo = async () => {
    // Validation
    const personalInfoErrors = {};
    if (!userData.name.trim()) personalInfoErrors.name = 'Name is required';
    if (!userData.email.trim()) personalInfoErrors.email = 'Email is required';
    
    if (Object.keys(personalInfoErrors).length > 0) {
      setErrors(personalInfoErrors);
      return;
    }
    
    // Check if any field has been changed
    const hasChanges = Object.values(changedFields).some(changed => changed);
    
    if (!hasChanges) {
      setEditMode(false);
      return;
    }
    
    // Prepare data object with only changed fields
    const updatedData = {};
    if (changedFields.name) updatedData.name = userData.name;
    if (changedFields.email) updatedData.email = userData.email;
    if (changedFields.phone) updatedData.phone = userData.phone;
    
    try {
      setIsSubmitting(true);
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${API_ENDPOINTS.UPDATE_PROFILE}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      // If response contains updated user data, use it to update our state
      if (data.data) {
        const updatedUserData = data.data;
        const updatedInfo = {
          name: updatedUserData.name || userData.name,
          email: updatedUserData.email || userData.email,
          phone: updatedUserData.phone || userData.phone,
        };
        setUserData(updatedInfo);
        setOriginalUserData(updatedInfo);
      } else {
        // If no updated data in response, just use what we sent
        setOriginalUserData({...userData});
      }
      
      setChangedFields({
        name: false,
        email: false,
        phone: false
      });
      
      Alert.alert('Success', 'Profile updated successfully');
      setErrors({});
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Change password handler
  const handleChangePassword = async () => {
    // Validation
    const passwordErrors = {};
    if (!passwords.currentPassword.trim()) passwordErrors.currentPassword = 'Current password is required';
    if (!passwords.newPassword.trim()) passwordErrors.newPassword = 'New password is required';
    if (passwords.newPassword !== passwords.confirmPassword) {
      passwordErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(passwordErrors).length > 0) {
      setErrors(passwordErrors);
      return;
    }
    
    try {
      setIsSubmitting(true);
      const token = await AsyncStorage.getItem('userToken');
      
      // The :id in the API endpoint needs to be replaced with the actual userId
      const endpoint = API_ENDPOINTS.CHANGE_PASSWORD.replace(':id', userId);
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }
      
      Alert.alert('Success', 'Password changed successfully');
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Logout handler
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('userToken');
      router.replace('/(auths)/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };
  
  // Refresh user data function
  const handleRefresh = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('userToken');
      
      if (!storedUserId || !token) {
        Alert.alert('Error', 'You need to login first');
        router.replace('/(auths)/login');
        return;
      }
      
      setIsSubmitting(true);
      
      // Fetch user profile data
      const response = await fetch(`${API_ENDPOINTS.USER_PROFILE}/${storedUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user data');
      }
      
      console.log('User data refreshed:', data);
      
      // Extract user data from the nested structure
      const userData = data.data;
      
      const userInfo = {
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
      };
      
      // Extract additional user information
      const meta = {
        role: userData.role || '',
        createdAt: userData.created_at || '',
        lastActive: userData.statistics?.lastActive || '',
        enrolledCourses: userData.enrolledCourses || []
      };
      
      setUserData(userInfo);
      setOriginalUserData(userInfo);
      setUserMeta(meta);
      setChangedFields({
        name: false,
        email: false,
        phone: false
      });
      
      Alert.alert('Success', 'Profile data refreshed');
    } catch (error) {
      console.error('Error refreshing user data:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </View>
        
        {/* Section Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeSection === 'personal' && styles.activeTab]}
            onPress={() => setActiveSection('personal')}
          >
            <Ionicons 
              name="person-outline" 
              size={18} 
              color={activeSection === 'personal' ? '#6c5ce7' : '#777'} 
            />
            <Text style={[
              styles.tabText, 
              activeSection === 'personal' && styles.activeTabText
            ]}>
              Personal Info
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeSection === 'password' && styles.activeTab]}
            onPress={() => setActiveSection('password')}
          >
            <Ionicons 
              name="lock-closed-outline" 
              size={18} 
              color={activeSection === 'password' ? '#6c5ce7' : '#777'} 
            />
            <Text style={[
              styles.tabText, 
              activeSection === 'password' && styles.activeTabText
            ]}>
              Password
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Personal Info Section */}
        {activeSection === 'personal' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {editMode ? 'Update Personal Information' : 'Personal Information'}
              </Text>
              
              {!editMode && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditMode(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil-outline" size={18} color="#6c5ce7" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {!editMode ? (
              // Read-only view of user information
              <View style={styles.profileInfoContainer}>
                <View style={styles.profileInfoCard}>
                  <Text style={styles.profileInfoCardTitle}>Basic Information</Text>
                  
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelContainer}>
                      <Ionicons name="person" size={16} color="#6c5ce7" style={styles.infoIcon} />
                      <Text style={styles.infoLabel}>Full Name</Text>
                    </View>
                    <Text style={styles.infoValue}>{userData.name}</Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelContainer}>
                      <Ionicons name="mail" size={16} color="#6c5ce7" style={styles.infoIcon} />
                      <Text style={styles.infoLabel}>Email</Text>
                    </View>
                    <Text style={styles.infoValue}>{userData.email}</Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelContainer}>
                      <Ionicons name="call" size={16} color="#6c5ce7" style={styles.infoIcon} />
                      <Text style={styles.infoLabel}>Phone Number</Text>
                    </View>
                    <Text style={styles.infoValue}>{userData.phone || 'Not provided'}</Text>
                  </View>
                </View>
                
                <View style={styles.profileInfoCard}>
                  <Text style={styles.profileInfoCardTitle}>Account Information</Text>
                  
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelContainer}>
                      <Ionicons name="shield" size={16} color="#6c5ce7" style={styles.infoIcon} />
                      <Text style={styles.infoLabel}>Role</Text>
                    </View>
                    <Text style={styles.infoValue}>{userMeta.role || 'User'}</Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelContainer}>
                      <Ionicons name="calendar" size={16} color="#6c5ce7" style={styles.infoIcon} />
                      <Text style={styles.infoLabel}>Member Since</Text>
                    </View>
                    <Text style={styles.infoValue}>
                      {userMeta.createdAt ? new Date(userMeta.createdAt).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelContainer}>
                      <Ionicons name="time" size={16} color="#6c5ce7" style={styles.infoIcon} />
                      <Text style={styles.infoLabel}>Last Active</Text>
                    </View>
                    <Text style={styles.infoValue}>
                      {userMeta.lastActive ? new Date(userMeta.lastActive).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={handleRefresh}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#6c5ce7" size="small" />
                  ) : (
                    <View style={styles.refreshButtonContent}>
                      <Ionicons name="refresh-outline" size={18} color="#6c5ce7" />
                      <Text style={styles.refreshButtonText}>Refresh Data</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // Edit mode - form fields
              <View style={styles.editFormContainer}>
                <View style={styles.formCard}>
                  <View style={styles.inputContainer}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="person" size={16} color="#6c5ce7" />
                      <Text style={styles.label}>Full Name</Text>
                    </View>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[
                          styles.input, 
                          errors.name && styles.inputError,
                          changedFields.name && styles.inputChanged
                        ]}
                        placeholder="Enter your full name"
                        value={userData.name}
                        onChangeText={(text) => handleFieldChange('name', text)}
                      />
                      {changedFields.name && (
                        <Ionicons name="checkmark-circle" size={18} color="#4cd964" style={styles.changedIcon} />
                      )}
                    </View>
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="mail" size={16} color="#6c5ce7" />
                      <Text style={styles.label}>Email</Text>
                    </View>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[
                          styles.input, 
                          errors.email && styles.inputError,
                          changedFields.email && styles.inputChanged
                        ]}
                        placeholder="Enter your email"
                        value={userData.email}
                        onChangeText={(text) => handleFieldChange('email', text)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                      {changedFields.email && (
                        <Ionicons name="checkmark-circle" size={18} color="#4cd964" style={styles.changedIcon} />
                      )}
                    </View>
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="call" size={16} color="#6c5ce7" />
                      <Text style={styles.label}>Phone Number</Text>
                    </View>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[
                          styles.input,
                          changedFields.phone && styles.inputChanged
                        ]}
                        placeholder="Enter your phone number"
                        value={userData.phone}
                        onChangeText={(text) => handleFieldChange('phone', text)}
                        keyboardType="phone-pad"
                      />
                      {changedFields.phone && (
                        <Ionicons name="checkmark-circle" size={18} color="#4cd964" style={styles.changedIcon} />
                      )}
                    </View>
                  </View>
                </View>
                
                {/* Show summary of changes */}
                {Object.values(changedFields).some(changed => changed) && (
                  <View style={styles.changesSummary}>
                    <View style={styles.changesSummaryHeader}>
                      <Ionicons name="information-circle" size={20} color="#6c5ce7" />
                      <Text style={styles.changesSummaryTitle}>Changes to be saved:</Text>
                    </View>
                    
                    <View style={styles.changesContent}>
                      {changedFields.name && (
                        <View style={styles.changeItemContainer}>
                          <Text style={styles.changeItemLabel}>Name:</Text>
                          <View style={styles.changeValues}>
                            <Text style={styles.changeOldValue}>{originalUserData.name}</Text>
                            <Ionicons name="arrow-forward" size={16} color="#6c5ce7" style={styles.changeArrow} />
                            <Text style={styles.changeNewValue}>{userData.name}</Text>
                          </View>
                        </View>
                      )}
                      
                      {changedFields.email && (
                        <View style={styles.changeItemContainer}>
                          <Text style={styles.changeItemLabel}>Email:</Text>
                          <View style={styles.changeValues}>
                            <Text style={styles.changeOldValue}>{originalUserData.email}</Text>
                            <Ionicons name="arrow-forward" size={16} color="#6c5ce7" style={styles.changeArrow} />
                            <Text style={styles.changeNewValue}>{userData.email}</Text>
                          </View>
                        </View>
                      )}
                      
                      {changedFields.phone && (
                        <View style={styles.changeItemContainer}>
                          <Text style={styles.changeItemLabel}>Phone:</Text>
                          <View style={styles.changeValues}>
                            <Text style={styles.changeOldValue}>{originalUserData.phone || 'Not provided'}</Text>
                            <Ionicons name="arrow-forward" size={16} color="#6c5ce7" style={styles.changeArrow} />
                            <Text style={styles.changeNewValue}>{userData.phone}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      // Reset to original values
                      setUserData({...originalUserData});
                      setChangedFields({
                        name: false,
                        email: false,
                        phone: false
                      });
                      setEditMode(false);
                      setErrors({});
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      !Object.values(changedFields).some(changed => changed) && styles.disabledButton
                    ]}
                    onPress={() => {
                      handleUpdatePersonalInfo();
                      setEditMode(false);
                    }}
                    disabled={isSubmitting || !Object.values(changedFields).some(changed => changed)}
                    activeOpacity={0.7}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>
                        {Object.values(changedFields).some(changed => changed) ? 'Save Changes' : 'No Changes'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
        
        {/* Password Change Section */}
        {activeSection === 'password' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Password Management</Text>
            </View>
            
            <View style={styles.passwordContainer}>
              <View style={styles.passwordNoteContainer}>
                <Ionicons name="shield-checkmark" size={22} color="#ffcc00" style={styles.passwordNoteIcon} />
                <Text style={styles.passwordNote}>
                  To protect your account, make your password strong and don't reuse it for other accounts.
                </Text>
              </View>
              
              <View style={styles.formCard}>
                <View style={styles.inputContainer}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="lock-closed" size={16} color="#6c5ce7" />
                    <Text style={styles.label}>Current Password</Text>
                  </View>
                  <TextInput
                    style={[styles.input, errors.currentPassword && styles.inputError]}
                    placeholder="Enter your current password"
                    value={passwords.currentPassword}
                    onChangeText={(text) => setPasswords({...passwords, currentPassword: text})}
                    secureTextEntry
                  />
                  {errors.currentPassword && (
                    <Text style={styles.errorText}>{errors.currentPassword}</Text>
                  )}
                </View>
                
                <View style={styles.inputContainer}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="key" size={16} color="#6c5ce7" />
                    <Text style={styles.label}>New Password</Text>
                  </View>
                  <TextInput
                    style={[styles.input, errors.newPassword && styles.inputError]}
                    placeholder="Enter your new password"
                    value={passwords.newPassword}
                    onChangeText={(text) => setPasswords({...passwords, newPassword: text})}
                    secureTextEntry
                  />
                  {errors.newPassword && (
                    <Text style={styles.errorText}>{errors.newPassword}</Text>
                  )}
                </View>
                
                <View style={styles.inputContainer}>
                  <View style={styles.labelContainer}>
                    <Ionicons name="checkmark-circle" size={16} color="#6c5ce7" />
                    <Text style={styles.label}>Confirm New Password</Text>
                  </View>
                  <TextInput
                    style={[styles.input, errors.confirmPassword && styles.inputError]}
                    placeholder="Confirm your new password"
                    value={passwords.confirmPassword}
                    onChangeText={(text) => setPasswords({...passwords, confirmPassword: text})}
                    secureTextEntry
                  />
                  {errors.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.passwordTipsCard}>
                <Text style={styles.passwordTipsTitle}>Password Tips:</Text>
                <View style={styles.passwordTipItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#4cd964" style={styles.tipIcon} />
                  <Text style={styles.passwordTipText}>Use at least 8 characters</Text>
                </View>
                <View style={styles.passwordTipItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#4cd964" style={styles.tipIcon} />
                  <Text style={styles.passwordTipText}>Include uppercase and lowercase letters</Text>
                </View>
                <View style={styles.passwordTipItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#4cd964" style={styles.tipIcon} />
                  <Text style={styles.passwordTipText}>Include at least one number or special character</Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.changePasswordButton}
                onPress={handleChangePassword}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.changePasswordContent}>
                    <Ionicons name="lock-closed" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Change Password</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          
          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>Sign Language Learning App - Version 1.0.0</Text>
            <Text style={styles.copyrightText}>© 2023 Team G8 - All rights reserved</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  activeTab: {
    backgroundColor: '#f0edff',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#777',
  },
  activeTabText: {
    color: '#6c5ce7',
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  // Profile Info Container - Read Mode
  profileInfoContainer: {
    flex: 1,
  },
  profileInfoCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  profileInfoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c5ce7',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIcon: {
    marginRight: 8,
  },
  // Edit Form Container - Edit Mode
  editFormContainer: {
    flex: 1,
  },
  formCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  // Enhanced changes summary
  changesSummary: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e9f5',
  },
  changesSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  changesSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#6c5ce7',
  },
  changesContent: {
    paddingLeft: 8,
  },
  changeItemContainer: {
    marginBottom: 10,
  },
  changeItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 4,
  },
  changeValues: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  changeOldValue: {
    fontSize: 14,
    color: '#777',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  changeNewValue: {
    fontSize: 14,
    color: '#4cd964',
    fontWeight: '500',
  },
  changeArrow: {
    marginHorizontal: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flex: 1,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    marginTop: 10,
    flex: 1,
    marginLeft: 10,
    shadowColor: '#6c5ce7',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingVertical:2
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fff8f8',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#e74c3c',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#ffe0e0',
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0edff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d9d1ff',
    shadowColor: '#6c5ce7',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  editButtonText: {
    color: '#6c5ce7',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  infoItem: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 20,
    maxHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
    // paddingVertical: 2,
    height: 20,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputChanged: {
    borderColor: '#4cd964',
    backgroundColor: '#f0fff0',
  },
  changedIcon: {
    position: 'absolute',
    right: 12,
  },
  disabledButton: {
    backgroundColor: '#d8d8d8',
    shadowOpacity: 0.1,
  },
  // Password section styles
  passwordNoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffecb3',
  },
  passwordNoteIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  passwordNote: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  passwordTipsCard: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4cd964',
  },
  passwordTipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  passwordTipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipIcon: {
    marginRight: 8,
  },
  passwordTipText: {
    fontSize: 13,
    color: '#555',
  },
  changePasswordButton: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#6c5ce7',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  changePasswordContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    marginTop: 15,
    marginBottom: 5,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9d1ff',
    backgroundColor: '#f5f2ff',
    alignSelf: 'center',
    shadowColor: '#6c5ce7',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  refreshButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    marginLeft: 8,
    color: '#6c5ce7',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});