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

// Exact categories from the website form
const CATEGORIES = [
  { id: 1, name: 'Textbooks' },
  { id: 2, name: 'Electronics & Gadgets' },
  { id: 4, name: 'Apparel & Clothing' },
  { id: 3, name: 'Dorm Furniture' },
  { id: 5, name: 'Stationery' },
  { id: 8, name: 'Other Services' },
];

// Exact conditions from the website form
const CONDITIONS = [
  { value: 'New', label: 'Brand New' },
  { value: 'Like New', label: 'Like New (barely used)' },
  { value: 'Good', label: 'Good (minor scuffs)' },
  { value: 'Fair', label: 'Fair (used heavily but working)' },
];

export default function CreateListingScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [condition, setCondition] = useState('');
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
      quality: 0.7,
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
    // Validation – same rules as the PHP form
    if (!title.trim()) {
      Alert.alert('Missing info', 'Please enter a listing title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing info', 'Please enter a detailed description.');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid price', 'Please enter a valid selling price.');
      return;
    }

    if (!categoryId) {
      Alert.alert('Missing info', 'Please select a category.');
      return;
    }

    if (!condition) {
      Alert.alert('Missing info', 'Please select the item condition.');
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
      const userId = Number(user.id || user.user_id);

      if (!userId) {
        Alert.alert('Error', 'Could not identify your account. Please log in again.');
        navigation.replace('Login');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/create_listing.php`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
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
        Alert.alert(
          'Published!',
          data.message || 'Product listing published successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Go to My Listings (same idea as the website redirect)
                navigation.navigate('MyListings');
              },
            },
          ]
        );
      } else {
        Alert.alert('Failed', data.message || 'Failed to upload the product listing.');
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
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header – matches website */}
        <View style={styles.header}>
          <Ionicons name="pricetag" size={28} color="#f0ad4e" />
          <Text style={styles.pageTitle}>Publish An Item to Sell</Text>
        </View>
        <Text style={styles.pageSub}>
          Set up a clean listing card for fellow students on campus.
        </Text>

        {/* Photo */}
        <Text style={styles.label}>Product Picture</Text>
        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
          {image?.uri ? (
            <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera" size={36} color="#0d6efd" />
              <Text style={styles.placeholderText}>Tap to add a photo</Text>
              <Text style={styles.optionalText}>(optional – default image will be used)</Text>
            </View>
          )}
        </TouchableOpacity>
        {image && (
          <TouchableOpacity onPress={() => setImage(null)} style={{ marginTop: 8 }}>
            <Text style={styles.removePhoto}>Remove photo</Text>
          </TouchableOpacity>
        )}

        {/* Title */}
        <Text style={styles.label}>Listing Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Calculus 101 Pearson Textbook (12th Ed)"
          placeholderTextColor="#adb5bd"
        />

        {/* Price + Category side by side */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Selling Price (ZAR) *</Text>
            <View style={styles.priceRow}>
              <Text style={styles.currency}>R</Text>
              <TextInput
                style={[styles.input, { flex: 1, marginLeft: 0 }]}
                value={price}
                onChangeText={setPrice}
                placeholder="250.00"
                placeholderTextColor="#adb5bd"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, categoryId === c.id && styles.chipActive]}
                  onPress={() => setCategoryId(c.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      categoryId === c.id && styles.chipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Condition */}
        <Text style={styles.label}>Item Condition *</Text>
        <View style={styles.chips}>
          {CONDITIONS.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.chip, condition === c.value && styles.chipActive]}
              onPress={() => setCondition(c.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  condition === c.value && styles.chipTextActive,
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.label}>Detailed Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Mention item state, meeting spot suggestions (e.g. Student Center Benches), or inclusions..."
          placeholderTextColor="#adb5bd"
          multiline
          numberOfLines={4}
        />

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.submitText}>Publish Listing</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#212529' },
  pageSub: { color: '#6c757d', marginBottom: 20, fontSize: 14 },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 6,
    marginTop: 14,
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
  optionalText: { fontSize: 12, color: '#adb5bd', marginTop: 4 },
  removePhoto: { color: '#dc3545', fontWeight: '600' },

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
  textArea: { minHeight: 110, textAlignVertical: 'top' },

  row: { flexDirection: 'row' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingLeft: 12,
  },
  currency: { fontSize: 16, fontWeight: '600', color: '#495057', marginRight: 4 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  chipActive: { backgroundColor: '#0d6efd', borderColor: '#0d6efd' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#495057' },
  chipTextActive: { color: '#fff' },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 28,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#6c757d',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  cancelText: { color: '#6c757d', fontWeight: '600', fontSize: 15 },

  submitBtn: {
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});