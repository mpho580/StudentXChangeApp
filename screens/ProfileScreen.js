import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config';
import BottomNavBar from '../components/BottomNavBar';

const memberSince = (value) => {
  if (!value) return '';
  const d = new Date(String(value).replace(' ', 'T'));
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

function Avatar({ uri, initials, size, fontSize }) {
  const [failed, setFailed] = useState(false);
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={[styles.avatarText, { fontSize }]}>{initials}</Text>
      )}
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const [userId, setUserId] = useState(0);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) {
        navigation.replace('Login');
        return;
      }
      const u = JSON.parse(stored);
      const uid = Number(u.id || u.user_id);
      if (!uid) {
        Alert.alert('Error', 'Could not identify your account. Please log in again.');
        navigation.replace('Login');
        return;
      }
      setUserId(uid);

      const res = await fetch(`${API_BASE_URL}/profile.php?user_id=${uid}`);
      const data = await res.json();
      if (!data.success) {
        Alert.alert('Error', data.message || 'Could not load your profile.');
        return;
      }

      const p = data.user;
      setProfile(p);
      setName(p.name || '');
      setSurname(p.surname || '');
      setPhone(p.phone || '');
      setNewImage(null);
    } catch (e) {
      Alert.alert('Error', 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to change your picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Image error', 'Could not read image. Try another photo.');
      return;
    }
    if (asset.base64.length * 0.75 > 2 * 1024 * 1024) {
      Alert.alert('Too large', 'Profile picture must be smaller than 2MB.');
      return;
    }

    const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
    setNewImage({
      uri: asset.uri,
      base64: asset.base64,
      type: ext === 'png' ? 'image/png' : 'image/jpeg',
    });
  };

  const handleSave = async () => {
    if (!name.trim() || !surname.trim()) {
      Alert.alert('Missing info', 'Your name and surname are required.');
      return;
    }
    if (phone.trim() !== '' && !/^[0-9]+$/.test(phone.trim())) {
      Alert.alert('Invalid phone', 'Phone number can only contain numbers.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        user_id: userId,
        name: name.trim(),
        surname: surname.trim(),
        phone: phone.trim(),
      };
      if (newImage?.base64) {
        body.image_base64 = newImage.base64;
        body.image_type = newImage.type;
      }

      const res = await fetch(`${API_BASE_URL}/update_profile.php`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        Alert.alert('Server error', text.slice(0, 400) || `HTTP ${res.status}`);
        return;
      }

      if (data.success) {
        setProfile(data.user);
        setNewImage(null);

        // Keep the saved login in sync with the new name
        try {
          const stored = await AsyncStorage.getItem('user');
          if (stored) {
            const u = JSON.parse(stored);
            await AsyncStorage.setItem(
              'user',
              JSON.stringify({ ...u, name: data.user.name, surname: data.user.surname })
            );
          }
        } catch (e) {
          // ignore
        }

        Alert.alert('Saved', data.message || 'Your profile was updated successfully.');
      } else {
        Alert.alert('Failed', data.message || 'We could not update your profile.');
      }
    } catch (e) {
      Alert.alert('Connection error', String(e?.message || e));
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
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  if (loading && !profile) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0d6efd" />
        </View>
        <BottomNavBar navigation={navigation} active="profile" />
      </View>
    );
  }

  const initials = (
    String(profile?.name || '').charAt(0) + String(profile?.surname || '').charAt(0)
  ).toUpperCase();
  const avatarUri = newImage?.uri || profile?.profile_picture || null;
  const isAdmin = profile?.role === 'admin';

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.hero}>
            <Avatar key={avatarUri || 'none'} uri={avatarUri} initials={initials} size={80} fontSize={26} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.heroName} numberOfLines={2}>
                {`${profile?.name || ''} ${profile?.surname || ''}`.trim()}
              </Text>
              <Text style={styles.heroSub}>Student Marketplace Profile</Text>

              {isAdmin && (
                <TouchableOpacity
                  style={styles.adminBtn}
                  onPress={() => navigation.navigate('Admin')}
                >
                  <Ionicons name="shield-checkmark" size={14} color="#212529" />
                  <Text style={styles.adminBtnText}>Go to Admin Portal</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.label}>Profile Picture</Text>
            <View style={styles.pictureRow}>
              <Avatar key={'big' + (avatarUri || 'none')} uri={avatarUri} initials={initials} size={96} fontSize={30} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <TouchableOpacity style={styles.pickBtn} onPress={pickImage}>
                  <Ionicons name="camera" size={16} color="#0d6efd" />
                  <Text style={styles.pickBtnText}>
                    {newImage ? 'Choose a different photo' : 'Change photo'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.hint}>JPG, PNG or WEBP. Maximum size: 2MB.</Text>
              </View>
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text style={styles.label}>Surname</Text>
            <TextInput style={styles.input} value={surname} onChangeText={setSurname} />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 0712345678"
              placeholderTextColor="#adb5bd"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Student Number</Text>
            <TextInput
              style={[styles.input, styles.readonly]}
              value={profile?.student_number || ''}
              editable={false}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, styles.readonly]}
              value={profile?.email || ''}
              editable={false}
            />

            <View style={styles.footerRow}>
              <Text style={styles.since}>
                {memberSince(profile?.created_at)
                  ? `Member since ${memberSince(profile?.created_at)}`
                  : ''}
              </Text>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Shortcuts */}
          <View style={styles.links}>
            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => navigation.navigate('MyListings')}
            >
              <Ionicons name="pricetags-outline" size={18} color="#0d6efd" />
              <Text style={styles.linkText}>My Listings</Text>
              <Ionicons name="chevron-forward" size={18} color="#adb5bd" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#dc3545" />
              <Text style={[styles.linkText, { color: '#dc3545' }]}>Log out</Text>
              <Ionicons name="chevron-forward" size={18} color="#adb5bd" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNavBar navigation={navigation} active="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  hero: {
    backgroundColor: '#0d6efd',
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#ffc107',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { color: '#212529', fontWeight: '800' },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#ffc107',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  adminBtnText: { color: '#212529', fontWeight: '700', fontSize: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 6,
    marginTop: 14,
  },
  pictureRow: { flexDirection: 'row', alignItems: 'center' },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#0d6efd',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pickBtnText: { color: '#0d6efd', fontWeight: '600', fontSize: 13 },
  hint: { color: '#6c757d', fontSize: 12, marginTop: 8 },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#212529',
  },
  readonly: { backgroundColor: '#e9ecef', color: '#6c757d' },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginTop: 20,
    paddingTop: 14,
  },
  since: { color: '#6c757d', fontSize: 12, flex: 1, marginRight: 8 },
  saveBtn: {
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  links: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  linkText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#212529' },
});