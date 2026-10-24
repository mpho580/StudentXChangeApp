import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function InboxScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInbox = async (isRefresh = false) => {
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

      const res = await fetch(`${API_BASE_URL}/inbox.php?user_id=${u.id}`);
      const data = await res.json();

      if (data.success) {
        setConversations(data.conversations || []);
      } else {
        setConversations([]);
      }
    } catch (e) {
      Alert.alert('Connection error', 'Could not load inbox.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInbox();
    }, [])
  );

  const openChat = (item) => {
    navigation.navigate('Chat', {
      partner_id: item.partner_id,
      partner_name: item.partner_name,
      product_id: item.product_id,
      product_title: item.product_title,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openChat(item)} activeOpacity={0.85}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.partner_name || '?')[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{item.partner_name}</Text>
        <Text style={styles.product} numberOfLines={1}>
          Product: {item.product_title || 'Listing'}
        </Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.time}>
          {item.last_message
            ? new Date(item.last_message).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#adb5bd" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d6efd" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <Ionicons name="chatbubbles" size={22} color="#fff" /> Inbox
        </Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item, i) => `${item.partner_id}-${item.product_id}-${i}`}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadInbox(true)}
            colors={['#0d6efd']}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubble-ellipses-outline" size={56} color="#adb5bd" />
            <Text style={styles.emptyText}>You have no conversations yet.</Text>
            <Text style={styles.emptyHint}>
              Message a seller from a listing to start chatting.
            </Text>
          </View>
        }
      />
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
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffc107',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontWeight: '800', fontSize: 18, color: '#212529' },
  body: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#212529' },
  product: { fontSize: 13, color: '#6c757d', marginTop: 2 },
  meta: { alignItems: 'flex-end', gap: 6 },
  time: { fontSize: 11, color: '#6c757d' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12, fontSize: 16, color: '#6c757d', fontWeight: '600' },
  emptyHint: { marginTop: 6, fontSize: 13, color: '#adb5bd', textAlign: 'center', paddingHorizontal: 24 },
});