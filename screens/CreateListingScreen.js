import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../config';

const CATEGORIES = [
  { id: 1, name: 'Textbooks' },
  { id: 2, name: 'Electronics' },
  { id: 3, name: 'Apparel' },
  { id: 4, name: 'Furniture' },
  { id: 5, name: 'Stationery' },
  { id: 6, name: 'Services' },
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Used'];

export default function CreateListingScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [condition, setCondition] = useState('Good');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload item pictures.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Image error', 'Could not read image. Try another photo.');
      return;
    }

    const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
    setImage({
      uri: asset.uri,
      base64: asset.base64,
      type: ext === 'png' ? 'image/png' : 'image/jpeg',
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !price.trim()) {
      Alert.alert('Missing info', 'Title, description and price are required.');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid price', 'Enter a valid price.');
      return;
    }

    setLoading(true);

    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) {
        Alert.alert('Login required', 'Please sign in first.');
        navigation.navigate('Login');
        return;
      }
      const user = JSON.parse(stored);

      // JSON only — NO FormData
      const res = await fetch(`${API_BASE_URL}/create_listing.php`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          price: priceNum,
          category_id: categoryId,
          condition: condition,
          image_base64: image?.base64 || null,
          image_type: image?.type || 'image/jpeg',
        }),
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
        Alert.alert('Listed!', data.message || 'Your item was published.', [
          { text: 'OK', onPress: () => navigation.navigate('Home') },
        ]);
      } else {
        Alert.alert('Failed', data.message || 'Could not create listing.');
      }
    } catch (e) {
      Alert.alert('Connection error', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Post an Item</Text>
        <Text style={styles.pageSub}>Share what you’re selling with campus</Text>

        <Text style={styles.label}>Item Photo</Text>
        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
          {image?.uri ? (
            <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera" size={36} color="#0d6efd" />
              <Text style={styles.placeholderText}>Tap to add a photo</Text>
            </View>
          )}
        </TouchableOpacity>
        {image && (
          <TouchableOpacity onPress={() => setImage(null)}>
            <Text style={styles.removePhoto}>Remove photo</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Calculus textbook"
          placeholderTextColor="#adb5bd"
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Condition, meetup spot, etc."
          placeholderTextColor="#adb5bd"
          multiline
        />

        <Text style={styles.label}>Price (R) *</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="0.00"
          placeholderTextColor="#adb5bd"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, categoryId === c.id && styles.chipActive]}
              onPress={() => setCategoryId(c.id)}
            >
              <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Condition</Text>
        <View style={styles.chips}>
          {CONDITIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, condition === c && styles.chipActive]}
              onPress={() => setCondition(c)}
            >
              <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Post Listing</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#212529' },
  pageSub: { color: '#6c757d', marginBottom: 16, marginTop: 4 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 6,
    marginTop: 12,
  },
  imageBox: {
    height: 180,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  preview: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { marginTop: 8, fontWeight: '600', color: '#0d6efd' },
  removePhoto: { color: '#dc3545', fontWeight: '600', marginTop: 8 },
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
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  chipActive: { backgroundColor: '#0d6efd', borderColor: '#0d6efd' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#495057' },
  chipTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: '#0d6efd',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});