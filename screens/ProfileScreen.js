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
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../config';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [localImage, setLocalImage] = useState(null);
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
      setLocalImage(null);

      const res = await fetch(`${API_BASE_URL}/profile.php?user_id=${localUser.id}`);
      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        setName(data.user.name || '');
        setSurname(data.user.surname || '');
        setPhone(data.user.phone || '');
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (e) {
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

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow photo library access to set a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
    const mime =
      ext === 'png' ? 'image/png' :
      ext === 'webp' ? 'image/webp' :
      'image/jpeg';

    setLocalImage({
      uri,
      name: `avatar.${ext === 'jpeg' ? 'jpg' : ext}`,
      type: mime,
    });
  };

  const handleSave = async () => {
    if (!name.trim() || !surname.trim()) {
      Alert.alert('Missing info', 'Your name and surname are required.');
      return;
    }

    setSaving(true);
    try {
      let data;

      if (localImage) {
        const form = new FormData();
        form.append('user_id', String(user.id));
        form.append('name', name.trim());
        form.append('surname', surname.trim());
        form.append('phone', phone.trim());
        form.append('profile_picture', {
          uri: localImage.uri,
          name: localImage.name,
          type: localImage.type,
        });

        const res = await fetch(`${API_BASE_URL}/profile.php`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: form,
        });
        data = await res.json();
      } else {
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
        data = await res.json();
      }

      if (data.success) {
        setUser(data.user);
        setLocalImage(null);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        Alert.alert('Success', 'Your profile was updated successfully.');
      } else {
        Alert.alert('Failed', data.message || 'We could not update your profile.');
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

  const initials = ((name?.[0] || '') + (surname?.[0] || '')).toUpperCase() || '?';
  const avatarUri = localImage?.uri || user.profile_picture || null;

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
        {/* ===== HEADER (matches profile.php blue banner) ===== */}
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
            <View style={styles.headerAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.headerAvatarImage} />
              ) : (
                <Text style={styles.headerAvatarText}>{initials}</Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.headerName}>
              {`${name} ${surname}`.trim() || 'Student'}
            </Text>
            <Text style={styles.headerSub}>Student Marketplace Profile</Text>

            {user?.role === 'admin' && (
              <TouchableOpacity
                style={styles.adminBtn}
                onPress={() => navigation.navigate('Admin')}
              >
                <Ionicons name="shield-checkmark" size={16} color="#212529" />
                <Text style={styles.adminBtnText}>Go to Admin Portal</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ===== FORM CARD ===== */}
        <View style={styles.card}>
          {/* Profile picture picker (like website form) */}
          <Text style={styles.label}>Profile Picture</Text>
          <View style={styles.pictureRow}>
            <View style={styles.formAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.formAvatarImage} />
              ) : (
                <Text style={styles.formAvatarText}>{initials}</Text>
              )}
            </View>
            <View style={styles.pictureMeta}>
              <TouchableOpacity style={styles.chooseBtn} onPress={pickImage}>
                <Ionicons name="image-outline" size={18} color="#0d6efd" />
                <Text style={styles.chooseBtnText}>Choose file</Text>
              </TouchableOpacity>
              <Text style={styles.formText}>JPG, PNG or WEBP. Maximum size: 2MB.</Text>
            </View>
          </View>

          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Name"
          />

          {/* Surname */}
          <Text style={styles.label}>Surname</Text>
          <TextInput
            style={styles.input}
            value={surname}
            onChangeText={setSurname}
            placeholder="Surname"
          />

          {/* Phone */}
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 071 234 5678"
            keyboardType="phone-pad"
          />

          {/* Student Number (readonly) */}
          <Text style={styles.label}>Student Number</Text>
          <TextInput
            style={[styles.input, styles.readonly]}
            value={user.student_number || ''}
            editable={false}
          />

          {/* Email (readonly) */}
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={[styles.input, styles.readonly]}
            value={user.email || ''}
            editable={false}
          />

          {/* Footer: member since + save */}
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
                <View style={styles.saveInner}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Mobile-only extras (not on website page) */}
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.navigate('MyListings')}
        >
          <Ionicons name="list" size={20} color="#0d6efd" />
          <Text style={styles.linkBtnText}>My Listings</Text>
          <Ionicons name="chevron-forward" size={20} color="#adb5bd" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.linkBtn, styles.logoutBtn]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#dc3545" />
          <Text style={[styles.linkBtnText, { color: '#dc3545' }]}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },

  // Header – same as website bg-primary block
  header: {
    backgroundColor: '#0d6efd',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffc107',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  headerAvatarImage: { width: 80, height: 80 },
  headerAvatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#212529',
  },
  headerText: { flex: 1 },
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
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ffc107',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    gap: 6,
  },
  adminBtnText: {
    color: '#212529',
    fontWeight: '700',
    fontSize: 13,
  },

  // Card
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
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 6,
    marginTop: 12,
  },
  pictureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  formAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ffc107',
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  formAvatarImage: { width: 96, height: 96 },
  formAvatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#212529',
  },
  pictureMeta: { flex: 1 },
  chooseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#0d6efd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  chooseBtnText: {
    color: '#0d6efd',
    fontWeight: '600',
    fontSize: 14,
  },
  formText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  saveInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Mobile extras
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
  logoutBtn: { marginTop: 4 },
});