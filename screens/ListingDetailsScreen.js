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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import BottomNavBar from '../components/BottomNavBar';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Same idea as the website: "24 Oct 2026 12:26", or a dash when there is no time
const formatTime = (value) => {
  if (!value || String(value).startsWith('0000')) return '—';
  const d = new Date(String(value).replace(' ', 'T'));
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function InboxScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
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
      const userId = Number(u.id || u.user_id);

      if (!userId) {
        Alert.alert('Error', 'Could not identify your account. Please log in again.');
        navigation.replace('Login');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/inbox.php?user_id=${userId}`);
      const data = await res.json();

      if (data.success) {
        setConversations(data.conversations || []);
      } else {
        Alert.alert('Error', data.message || 'Could not load your inbox.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not load your inbox.');
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

  const openChat = (chat) => {
    navigation.navigate('Chat', {
      partner_id: Number(chat.partner_id),
      product_id: Number(chat.product_id),
      partner_name: chat.partner_name,
      product_title: chat.product_title,
    });
  };

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0d6efd" />
        </View>
        <BottomNavBar navigation={navigation} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="chatbubbles" size={26} color="#0d6efd" />
          <Text style={styles.pageTitle}>Inbox</Text>
        </View>

        <FlatList
          data={conversations}
          keyExtractor={(item) => `${item.partner_id}-${item.product_id}`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={['#0d6efd']}
            />
          }
          contentContainerStyle={{ paddingBottom: 16 }}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#adb5bd" />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyText}>
                You have no conversations yet. Message a seller from any listing to get started.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('Search')}
              >
                <Text style={styles.emptyBtnText}>Browse listings</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => openChat(item)}
              activeOpacity={0.85}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {String(item.partner_name || '?').charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.cardMain}>
                <Text style={styles.partnerName} numberOfLines={1}>
                  {item.partner_name}
                </Text>
                <Text style={styles.productLine} numberOfLines={1}>
                  Product: {item.product_title}
                </Text>
                <Text style={styles.time}>{formatTime(item.last_message_time)}</Text>
              </View>

              <View style={styles.openBtn}>
                <Text style={styles.openBtnText}>Open Chat</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <BottomNavBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#212529' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0d6efd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },

  cardMain: { flex: 1, marginRight: 8 },
  partnerName: { fontSize: 16, fontWeight: '700', color: '#212529' },
  productLine: { fontSize: 13, color: '#6c757d', marginTop: 2 },
  time: { fontSize: 11, color: '#adb5bd', marginTop: 4 },

  openBtn: {
    backgroundColor: '#0d6efd',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  openBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
    elevation: 2,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#212529', marginTop: 12 },
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
});