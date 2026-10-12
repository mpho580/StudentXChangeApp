import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export default function CreateListingScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [condition, setCondition] = useState('Good');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('user').then((u) => {
      if (u) setUser(JSON.parse(u));
      else navigation.replace('Login');
    });
  }, []);

  const handlePublish = async () => {
    if (!title || !description || !price) {
      Alert.alert('Missing info', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/create_listing.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          title,
          description,
          price: parseFloat(price),
          category_id: parseInt(categoryId, 10),
          condition,
        }),
      });
      const data = await res.json();

      if (data.success) {
        Alert.alert('Success', 'Listing published!', [
          { text: 'OK', onPress: () => navigation.navigate('Home') },
        ]);
      } else {
        Alert.alert('Failed', data.message || 'Could not publish.');
      }
    } catch (e) {
      Alert.alert('Connection error', 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Publish an Item</Text>

      <TextInput style={styles.input} placeholder="Title *" value={title} onChangeText={setTitle} />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Description *"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Price (ZAR) *"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={categoryId} onValueChange={setCategoryId}>
          <Picker.Item label="Textbooks" value="1" />
          <Picker.Item label="Electronics & Gadgets" value="2" />
          <Picker.Item label="Apparel & Clothing" value="3" />
          <Picker.Item label="Dorm Furniture" value="4" />
          <Picker.Item label="Stationery" value="5" />
          <Picker.Item label="Other Services" value="6" />
        </Picker>
      </View>

      <Text style={styles.label}>Condition</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={condition} onValueChange={setCondition}>
          <Picker.Item label="Brand New" value="New" />
          <Picker.Item label="Like New" value="Like New" />
          <Picker.Item label="Good" value="Good" />
          <Picker.Item label="Fair" value="Fair" />
        </Picker>
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePublish} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Publish Listing</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f8f9fa', flexGrow: 1 },
  heading: { fontSize: 22, fontWeight: '800', color: '#0d6efd', marginBottom: 16 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ced4da',
    borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 15,
  },
  label: { fontWeight: '600', marginBottom: 4, color: '#333' },
  pickerWrap: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ced4da',
    borderRadius: 8, marginBottom: 12, overflow: 'hidden',
  },
  button: {
    backgroundColor: '#0d6efd', borderRadius: 8, padding: 15,
    alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});