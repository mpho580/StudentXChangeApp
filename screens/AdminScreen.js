import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtDate = (value) => {
  if (!value) return '—';
  const d = new Date(String(value).replace(' ', 'T'));
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'speedometer' },
  { key: 'users', label: 'Users', icon: 'people' },
  { key: 'products', label: 'Products', icon: 'cube' },
];

export default function AdminScreen({ navigation }) {
  const [tab, setTab] = useState('dashboard');
  const [adminId, setAdminId] = useState(0);
  const [stats, setStats] = useState({
    total_users: 0,
    total_products: 0,
    total_messages: 0,
    total_reviews: 0,
  });
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) {
        navigation.replace('Login');
        return;
      }
      const u = JSON.parse(stored);
      const uid = Number(u.id || u.user_id);
      if (!uid) {
        navigation.replace('Login');
        return;
      }
      setAdminId(uid);

      const res = await fetch(`${API_BASE_URL}/admin_data.php?user_id=${uid}`);
      const data = await res.json();

      if (!data.success) {
        Alert.alert('Not allowed', data.message || 'Admin access required.');
        navigation.goBack();
        return;
      }

      setStats(data.stats);
      setUsers(data.users || []);
      setProducts(data.products || []);
    } catch (e) {
      Alert.alert('Error', 'Could not load the admin dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const runAction = async (action, targetId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin_action.php`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: adminId, action, target_id: targetId }),
      });
      const data = await res.json();

      if (data.success) {
        load(true);
      } else {
        Alert.alert('Failed', data.message || 'Action failed.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not complete the action.');
    }
  };

  const confirmDeleteUser = (u) =>
    Alert.alert('Delete user?', `Delete ${u.name} and all their data?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => runAction('delete_user', u.id) },
    ]);

  const confirmDeleteProduct = (p) =>
    Alert.alert('Delete product?', `Delete "${p.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => runAction('delete_product', p.id) },
    ]);

  const toggleAdmin = (u) =>
    runAction('toggle_admin', u.id);

  const openReport = (type) => {
    Linking.openURL(`${API_BASE_URL}/admin_report.php?type=${type}&user_id=${adminId}`).catch(() =>
      Alert.alert('Error', 'Could not open the report.')
    );
  };

  const statCards = [
    { label: 'Total Users', value: stats.total_users },
    { label: 'Active Listings', value: stats.total_products },
    { label: 'Messages Sent', value: stats.total_messages },
    { label: 'Reviews', value: stats.total_reviews },
  ];

  const renderDashboard = () => (
    <View>
      <View style={styles.reportRow}>
        <TouchableOpacity style={[styles.reportBtn, styles.reportBtnDanger]} onPress={() => openReport('full')}>
          <Ionicons name="document-text" size={16} color="#fff" />
          <Text style={styles.reportBtnDangerText}>Full Report (PDF)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportBtn} onPress={() => openReport('summary')}>
          <Ionicons name="bar-chart" size={16} color="#0d6efd" />
          <Text style={styles.reportBtnText}>Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportBtn} onPress={() => openReport('users')}>
          <Ionicons name="people" size={16} color="#0d6efd" />
          <Text style={styles.reportBtnText}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportBtn} onPress={() => openReport('products')}>
          <Ionicons name="cube" size={16} color="#0d6efd" />
          <Text style={styles.reportBtnText}>Products</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        {statCards.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent Users</Text>
      {users.slice(0, 5).map((u) => (
        <View key={u.id} style={styles.card}>
          <Text style={styles.cardTitle}>{u.name}</Text>
          <Text style={styles.cardMeta}>{u.student_number} · {u.email}</Text>
          <Text style={styles.cardMeta}>Joined {fmtDate(u.created_at)}</Text>
        </View>
      ))}
    </View>
  );

  const renderUsers = () => (
    <View>
      <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
      <TouchableOpacity style={[styles.exportBtn]} onPress={() => openReport('users')}>
        <Ionicons name="document-text" size={14} color="#fff" />
        <Text style={styles.exportBtnText}>Export Users to PDF</Text>
      </TouchableOpacity>

      {users.map((u) => {
        const isAdminRole = u.role === 'admin';
        return (
          <View key={u.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={1}>
                {u.name}
              </Text>
              <View style={isAdminRole ? styles.badgeAdmin : styles.badgeUser}>
                <Text style={isAdminRole ? styles.badgeAdminText : styles.badgeUserText}>
                  {isAdminRole ? 'Admin' : 'Student'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>ID {u.id} · {u.student_number}</Text>
            <Text style={styles.cardMeta}>{u.email}</Text>
            <Text style={styles.cardMeta}>Joined {fmtDate(u.created_at)}</Text>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.btnOutline} onPress={() => toggleAdmin(u)}>
                <Text style={styles.btnOutlineText}>
                  {isAdminRole ? 'Make Student' : 'Make Admin'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnDanger} onPress={() => confirmDeleteUser(u)}>
                <Text style={styles.btnDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderProducts = () => (
    <View>
      <Text style={styles.sectionTitle}>All Products ({products.length})</Text>
      <TouchableOpacity style={styles.exportBtn} onPress={() => openReport('products')}>
        <Ionicons name="document-text" size={14} color="#fff" />
        <Text style={styles.exportBtnText}>Export Products to PDF</Text>
      </TouchableOpacity>

      {products.map((p) => (
        <View key={p.id} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={1}>
              {p.title}
            </Text>
            <Text style={styles.price}>R {Number(p.price).toFixed(2)}</Text>
          </View>
          <Text style={styles.cardMeta}>ID {p.id} · {p.category_name}</Text>
          <Text style={styles.cardMeta}>Seller: {p.seller_name}</Text>
          <View style={styles.conditionRow}>
            {!!p.item_condition && (
              <View style={styles.badgeCondition}>
                <Text style={styles.badgeConditionText}>{p.item_condition}</Text>
              </View>
            )}
            <Text style={styles.cardMeta}>Listed {fmtDate(p.created_at)}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnDanger} onPress={() => confirmDeleteProduct(p)}>
              <Text style={styles.btnDangerText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  if (loading && users.length === 0 && products.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d6efd" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSub}>Manage users, products and marketplace activity</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons name={t.icon} size={15} color={active ? '#fff' : '#495057'} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#0d6efd']} />
        }
      >
        {tab === 'dashboard' && renderDashboard()}
        {tab === 'users' && renderUsers()}
        {tab === 'products' && renderProducts()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: '#0d6efd',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { padding: 4, marginRight: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },

  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
  },
  tabActive: { backgroundColor: '#0d6efd' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#495057' },
  tabTextActive: { color: '#fff' },

  reportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#0d6efd',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  reportBtnText: { color: '#0d6efd', fontWeight: '600', fontSize: 13 },
  reportBtnDanger: { backgroundColor: '#dc3545', borderColor: '#dc3545' },
  reportBtnDangerText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  statCard: {
    width: '47.5%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  statValue: { fontSize: 28, fontWeight: '800', color: '#0d6efd' },
  statLabel: { fontSize: 13, color: '#6c757d', marginTop: 2 },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#212529',
    marginTop: 16,
    marginBottom: 10,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#dc3545',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  exportBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#212529' },
  cardMeta: { fontSize: 12.5, color: '#6c757d', marginTop: 2 },
  price: { fontSize: 15, fontWeight: '800', color: '#198754' },

  badgeAdmin: {
    backgroundColor: '#ffc107',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeAdminText: { fontSize: 11, fontWeight: '700', color: '#212529' },
  badgeUser: {
    backgroundColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeUserText: { fontSize: 11, fontWeight: '600', color: '#495057' },

  conditionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  badgeCondition: {
    backgroundColor: '#ffc107',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeConditionText: { fontSize: 11, fontWeight: '700', color: '#000' },

  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#0d6efd',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnOutlineText: { color: '#0d6efd', fontWeight: '600', fontSize: 13 },
  btnDanger: {
    backgroundColor: '#dc3545',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  btnDangerText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});