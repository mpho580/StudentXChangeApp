import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import BottomNavBar from '../components/BottomNavBar';

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
      const userId = Number(u.id || u.user_id);

      if (!userId) {
        Alert.alert('Error', 'Could not identify your account. Please log in again.');
        navigation.replace('Login');
        return;
      }

      setUser({ ...u, id: userId });

      const res = await fetch(`${API_BASE_URL}/listings.php?user_id=${userId}`);
      const data = await res.json();

      if (data.success) {
        setListings(data.listings || []);
      } else {
        Alert.alert('Error', data.message || 'Could not load your listings.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not load your listings.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const handleDelete = (id) => {
    Alert.alert('Delete listing?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/delete_listing.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, user_id: user.id }),
            });
            const data = await res.json();
            if (data.success) {
              load();
            } else {
              Alert.alert('Failed', data.message || 'Could not delete listing.');
            }
          } catch (e) {
            Alert.alert('Error', 'Could not delete listing.');
          }
        },
      },
    ]);
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'Sold' ? 'Available' : 'Sold';

    try {
      const res = await fetch(`${API_BASE_URL}/update_status.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          user_id: user.id,
          status: newStatus,
        }),
      });
      const data = await res.json();

      if (data.success) {
        load(); // refresh list
      } else {
        Alert.alert('Failed', data.message || 'Could not update status.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not update status.');
    }
  };

  if (loading && listings.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0d6efd" />
        </View>
        <BottomNavBar navigation={navigation} active="profile" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>My Listings</Text>
            <Text style={styles.pageSub}>Items you have published for sale.</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateListing')}
          >
            <Text style={styles.addBtnText}>+ Sell an item</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          contentContainerStyle={{ paddingBottom: 16 }}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No listings yet</Text>
              <Text style={styles.emptyText}>
                Listings appear here when they are published from your account.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('CreateListing')}
              >
                <Text style={styles.emptyBtnText}>Create your first listing</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Image */}
              {item.image_path ? (
                <Image
                  source={{ uri: item.image_path }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Text style={{ color: '#adb5bd' }}>No image</Text>
                </View>
              )}

              <View style={styles.cardBody}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>

                <Text style={styles.price}>
                  R {Number(item.price).toFixed(2)}
                </Text>

                <Text style={styles.meta}>{item.category_name}</Text>

                {/* Status badge */}
                <View
                  style={[
                    styles.badge,
                    item.status === 'Sold' ? styles.badgeSold : styles.badgeAvailable,
                  ]}
                >
                  <Text style={styles.badgeText}>{item.status || 'Available'}</Text>
                </View>

                {/* Action buttons */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() =>
                      navigation.navigate('ListingDetails', { id: item.id })
                    }
                  >
                    <Text style={styles.btnPrimaryText}>View</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnWarning}
                    onPress={() =>
                      navigation.navigate('EditListing', { id: item.id })
                    }
                  >
                    <Text style={styles.btnWarningText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnDanger}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Text style={styles.btnDangerText}>Delete</Text>
                  </TouchableOpacity>
                </View>

                {/* Mark Sold / Available */}
                <TouchableOpacity
                  style={[
                    styles.statusBtn,
                    item.status === 'Sold'
                      ? styles.statusBtnAvailable
                      : styles.statusBtnSold,
                  ]}
                  onPress={() => handleToggleStatus(item)}
                >
                  <Text
                    style={[
                      styles.statusBtnText,
                      item.status === 'Sold' && { color: '#198754' },
                    ]}
                  >
                    {item.status === 'Sold' ? 'Mark Available' : 'Mark as Sold'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      {/* Bottom navigation bar */}
      <BottomNavBar navigation={navigation} active="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#212529' },
  pageSub: { color: '#6c757d', fontSize: 13, marginTop: 2 },

  addBtn: {
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
    elevation: 2,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#212529' },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
    marginVertical: 12,
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#e9ecef',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { padding: 14 },

  title: { fontSize: 16, fontWeight: '700', color: '#212529' },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#198754',
    marginTop: 4,
  },
  meta: { fontSize: 13, color: '#6c757d', marginTop: 2, marginBottom: 8 },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeAvailable: { backgroundColor: '#198754' },
  badgeSold: { backgroundColor: '#dc3545' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  btnPrimary: {
    backgroundColor: '#0d6efd',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  btnWarning: {
    backgroundColor: '#ffc107',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnWarningText: { color: '#212529', fontWeight: '600', fontSize: 13 },
  btnDanger: {
    backgroundColor: '#dc3545',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnDangerText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  statusBtn: {
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statusBtnSold: { backgroundColor: '#198754' },
  statusBtnAvailable: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#198754',
  },
  statusBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});