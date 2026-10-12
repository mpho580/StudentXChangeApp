import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { API_BASE_URL } from '../config';

export default function ListingDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/listing.php?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setItem(data.listing);
        else Alert.alert('Error', data.message);
      })
      .catch(() => Alert.alert('Connection error', 'Could not load listing.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d6efd" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text>Listing not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: item.image_path || 'https://via.placeholder.com/400x250?text=No+Image' }}
        style={styles.image}
      />
      <View style={styles.body}>
        <Text style={styles.badge}>{item.item_condition}</Text>
        <Text style={styles.category}>{item.category_name}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.price}>R {Number(item.price).toFixed(2)}</Text>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.seller}>Seller: {item.seller_name}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => Alert.alert('Coming soon', 'Messaging will be added next.')}
        >
          <Text style={styles.buttonText}>Message Seller</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 250 },
  body: { padding: 20 },
  badge: {
    alignSelf: 'flex-start', backgroundColor: '#ffc107',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    fontWeight: '700', marginBottom: 8, overflow: 'hidden',
  },
  category: { color: '#0d6efd', fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#212529', marginBottom: 8 },
  price: { fontSize: 24, fontWeight: '800', color: '#198754', marginBottom: 12 },
  desc: { fontSize: 15, color: '#495057', lineHeight: 22, marginBottom: 16 },
  seller: { fontSize: 14, color: '#6c757d', marginBottom: 20 },
  button: {
    backgroundColor: '#0d6efd', borderRadius: 8, padding: 14, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});