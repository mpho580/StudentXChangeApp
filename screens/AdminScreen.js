import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function AdminScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) {
        navigation.replace('Login');
        return;
      }
      const u = JSON.parse(stored);
      setUser(u);

      if (u.role !== 'admin') {
        Alert.alert('Access denied', 'Admins only.');
        navigation.goBack();
        return;
      }

      const [statsRes, usersRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin.php?action=stats`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/admin.php?action=users`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/admin.php?action=products`).then((r) => r.json()),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success) setUsers(usersRes.users || []);
      if (productsRes.success) setProducts(productsRes.products || []);
    } catch (e) {
      Alert.alert('Connection error', 'Could not load admin data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  const runAction = async (payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin_action.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, admin_id: user.id }),
      });
      const data = await res.json();
      Alert.alert(data.success ? 'Success' : 'Failed', data.message || '');
      if (data.success) loadAll(true);
    } catch (e) {
      Alert.alert('Error', 'Action failed.');
    }
  };

  const confirmDeleteUser = (id, name) => {
    Alert.alert('Delete user?', `Delete ${name} and all their data?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => runAction({ action: 'delete_user', user_id: id }),
      },
    ]);
  };

  const confirmDeleteProduct = (id, title) => {
    Alert.alert('Delete product?', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => runAction({ action: 'delete_product', product_id: id }),
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['dashboard', 'users', 'products'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadAll(true)} colors={['#0d6efd']} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* DASHBOARD */}
        {tab === 'dashboard' && stats && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{stats.total_users}</Text>
                <Text style={styles.statLabel}>Users</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{stats.total_products}</Text>
                <Text style={styles.statLabel}>Listings</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{stats.total_messages}</Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{stats.total_reviews}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recent Users</Text>
            {users.slice(0, 5).map((u) => (
              <View key={u.id} style={styles.rowCard}>
                <Text style={styles.rowTitle}>{u.name}</Text>
                <Text style={styles.rowMeta}>{u.email}</Text>
              </View>
            ))}
          </>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <>
            <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
            {users.map((u) => (
              <View key={u.id} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{u.name}</Text>
                  <Text style={styles.rowMeta}>
                    {u.student_number} · {u.email}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      u.role === 'admin' ? styles.badgeAdmin : styles.badgeUser,
                    ]}
                  >
                    <Text style={styles.badgeText}>{u.role}</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.btnOutline}
                    onPress={() =>
                      runAction({ action: 'toggle_admin', user_id: u.id })
                    }
                  >
                    <Text style={styles.btnOutlineText}>
                      {u.role === 'admin' ? 'Make Student' : 'Make Admin'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnDanger}
                    onPress={() => confirmDeleteUser(u.id, u.name)}
                  >
                    <Text style={styles.btnDangerText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* PRODUCTS */}
        {tab === 'products' && (
          <>
            <Text style={styles.sectionTitle}>
              All Products ({products.length})
            </Text>
            {products.map((p) => (
              <View key={p.id} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{p.title}</Text>
                  <Text style={styles.rowMeta}>
                    R {Number(p.price).toFixed(2)} · {p.category_name} ·{' '}
                    {p.seller_name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.btnDanger}
                  onPress={() => confirmDeleteProduct(p.id, p.title)}
                >
                  <Text style={styles.btnDangerText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#0d6efd',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#ffc107',
  },
  tabText: { color: '#6c757d', fontWeight: '600' },
  tabTextActive: { color: '#0d6efd' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  statNum: { fontSize: 28, fontWeight: '800', color: '#0d6efd' },
  statLabel: { color: '#6c757d', marginTop: 4 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12,
    marginTop: 8,
  },
  rowCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#212529' },
  rowMeta: { fontSize: 12, color: '#6c757d', marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeAdmin: { backgroundColor: '#ffc107' },
  badgeUser: { backgroundColor: '#e9ecef' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#212529' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#0d6efd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnOutlineText: { color: '#0d6efd', fontWeight: '600', fontSize: 12 },
  btnDanger: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnDangerText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});