import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) {
        navigation.replace('Login');
        return;
      }

      const localUser = JSON.parse(stored);
      setUser(localUser);
      setName(localUser.name || '');
      setSurname(localUser.surname || '');
      setPhone(localUser.phone || '');

      // Refresh from server
      const res = await fetch(
        `${API_BASE_URL}/profile.php?user_id=${localUser.id}`
      );
      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        setName(data.user.name || '');
        setSurname(data.user.surname || '');
        setPhone(data.user.phone || '');
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (e) {
      // Keep local data if offline
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const handleSave = async () => {
    if (!name.trim() || !surname.trim()) {
      Alert.alert('Missing info', 'Name and surname are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/profile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          name: name.trim(),
          surname: surname.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        Alert.alert('Success', 'Your profile was updated successfully.');
      } else {
        Alert.alert('Failed', data.message || 'Could not update profile.');
      }
    } catch (e) {
      Alert.alert('Connection error', 'Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('user');
          navigation.replace('Login');
        },
      },
    ]);
  };

  if (loading || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d6efd" />
      </View>
    );
  }

  const initials = (
    (name?.[0] || '') + (surname?.[0] || '')
  ).toUpperCase() || '?';

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName}>
              {`${name} ${surname}`.trim() || 'Student'}
            </Text>
            <Text style={styles.headerSub}>Student Marketplace Profile</Text>
          </View>
        </View>

        {user?.role === 'admin' && (
            <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => navigation.navigate('Admin')}
            >
                <Ionicons name="shield-checkmark" size={20} color="#0d6efd" />
                <Text style={styles.linkBtnText}>Admin Portal</Text>
                <Ionicons name="chevron-forward" size={10} color="#adb5bd" />
            </TouchableOpacity>
            )}

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="First name"
          />

          <Text style={styles.label}>Surname</Text>
          <TextInput
            style={styles.input}
            value={surname}
            onChangeText={setSurname}
            placeholder="Surname"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 071 234 5678"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Student Number</Text>
          <TextInput
            style={[styles.input, styles.readonly]}
            value={user.student_number || ''}
            editable={false}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={[styles.input, styles.readonly]}
            value={user.email || ''}
            editable={false}
          />

          <View style={styles.footerRow}>
            <Text style={styles.memberSince}>
              {memberSince ? `Member since ${memberSince}` : ''}
            </Text>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick links */}
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.navigate('MyListings')}
        >
          <Ionicons name="list" size={20} color="#0d6efd" />
          <Text style={styles.linkBtnText}>My Listings</Text>
          <Ionicons name="chevron-forward" size={20} color="#adb5bd" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.linkBtn, styles.logoutBtn]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#dc3545" />
          <Text style={[styles.linkBtnText, { color: '#dc3545' }]}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#0d6efd',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffc107',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#212529',
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#212529',
    backgroundColor: '#fff',
  },
  readonly: {
    backgroundColor: '#f1f3f5',
    color: '#6c757d',
  },
  footerRow: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberSince: {
    fontSize: 12,
    color: '#6c757d',
    flex: 1,
    marginRight: 12,
  },
  saveBtn: {
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    elevation: 1,
  },
  linkBtnText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  logoutBtn: {
    marginTop: 4,
  },
});