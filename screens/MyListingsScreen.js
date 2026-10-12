import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export default function MyListingsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) {
        navigation.replace('Login');
        return;
      }
      const u = JSON.parse(stored);
      setUser(u);

      const res = await fetch(`${API_BASE_URL}/listings.php?user_id=${u.id}`);
      const data = await res.json();
      if (data.success) setListings(data.listings);
    } catch (e) {
      Alert.alert('Error', 'Could not load your listings.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleDelete = (id) => {
    Alert.alert('Delete listing?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const res = await fetch(`${API_BASE_URL}/delete_listing.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, user_id: user.id }),
          });
          const data = await res.json();
          if (data.success) load();
          else Alert.alert('Failed', data.message);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d6efd" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('CreateListing')}
      >
        <Text style={styles.addBtnText}>+ New Listing</Text>
      </TouchableOpacity>

      <FlatList
        data={listings}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <Text style={styles.empty}>You have no listings yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.price}>R {Number(item.price).toFixed(2)}</Text>
            <Text style={styles.meta}>{item.item_condition} · {item.category_name}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btnOutline}
                onPress={() => navigation.navigate('ListingDetails', { id: item.id })}
              >
                <Text style={styles.btnOutlineText}>View</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnDanger}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.btnDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addBtn: {
    backgroundColor: '#0d6efd', borderRadius: 8, padding: 14,
    alignItems: 'center', marginBottom: 16,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  empty: { textAlign: 'center', color: '#6c757d', marginTop: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#212529' },
  price: { fontSize: 18, fontWeight: '800', color: '#198754', marginTop: 4 },
  meta: { fontSize: 13, color: '#6c757d', marginTop: 4, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  btnOutline: {
    borderWidth: 1, borderColor: '#0d6efd', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 16,
  },
  btnOutlineText: { color: '#0d6efd', fontWeight: '600' },
  btnDanger: {
    backgroundColor: '#dc3545', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 16,
  },
  btnDangerText: { color: '#fff', fontWeight: '600' },
});