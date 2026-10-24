
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
import { markInboxSeen } from '../utils/unread';

export default function InboxScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInbox = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Get the logged-in user from local storage.
      const stored = await AsyncStorage.getItem('user');

      if (!stored) {
        navigation.replace('Login');
        return;
      }

      const currentUser = JSON.parse(stored);
      const userId = Number(currentUser.id || currentUser.user_id);

      if (!userId) {
        Alert.alert(
          'Session error',
          'Your user information is invalid. Please log in again.'
        );
        navigation.replace('Login');
        return;
      }

      // Request conversations from the PHP backend.
      const response = await fetch(
        `${API_BASE_URL}/inbox.php?user_id=${encodeURIComponent(userId)}`
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        setConversations([]);

        Alert.alert(
          'Inbox error',
          data.message || 'Could not load your conversations.'
        );

        return;
      }

      const inbox = Array.isArray(data.conversations)
        ? data.conversations
        : [];

      setConversations(inbox);

      // Mark the inbox as seen only after a successful fetch.
      // This expects inbox.php to return a server_time field.
      if (data.server_time) {
        await markInboxSeen(userId, data.server_time);
      }
    } catch (error) {
      console.error('Inbox loading error:', error);

      Alert.alert(
        'Connection error',
        'Could not load your inbox. Check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  // Reload the inbox whenever the user opens this screen.
  useFocusEffect(
    useCallback(() => {
      loadInbox();
    }, [loadInbox])
  );

  // Open a conversation.
  const openChat = (item) => {
    if (!item.partner_id) {
      Alert.alert(
        'Unable to open chat',
        'The conversation is missing the other user’s ID.'
      );
      return;
    }

    navigation.navigate('Chat', {
      partner_id: item.partner_id,
      partner_name: item.partner_name || 'Student',
      product_id: item.product_id || null,
      product_title: item.product_title || 'Listing',
    });
  };

  // Format the last-message date safely.
  const formatMessageTime = (value) => {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Display each conversation.
  const renderItem = ({ item }) => {
    const partnerName = item.partner_name || 'Student';
    const initial = partnerName.trim().charAt(0).toUpperCase() || '?';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openChat(item)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Open conversation with ${partnerName}`}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {partnerName}
          </Text>

          <Text style={styles.product} numberOfLines={1}>
            Product: {item.product_title || 'Listing'}
          </Text>

          {item.last_message_text ? (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.last_message_text}
            </Text>
          ) : null}
        </View>

        <View style={styles.meta}>
          <Text style={styles.time}>
            {formatMessageTime(item.last_message)}
          </Text>

          <Ionicons
            name="chevron-forward"
            size={18}
            color="#adb5bd"
          />
        </View>
      </TouchableOpacity>
    );
  };

  // Initial loading screen.
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d6efd" />
        <Text style={styles.loadingText}>Loading your inbox...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <Ionicons name="chatbubbles" size={22} color="#fff" />
          {' '}Inbox
        </Text>

        <Text style={styles.headerSubtitle}>
          Your conversations with other students
        </Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item, index) =>
          `${item.partner_id}-${item.product_id || 0}-${index}`
        }
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          conversations.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadInbox(true)}
            colors={['#0d6efd']}
            tintColor="#0d6efd"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={56}
              color="#adb5bd"
            />

            <Text style={styles.emptyText}>
              You have no conversations yet.
            </Text>

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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6c757d',
  },

  header: {
    backgroundColor: '#0d6efd',
    paddingTop: 48,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },

  headerSubtitle: {
    color: '#e7f1ff',
    fontSize: 13,
    marginTop: 5,
  },

  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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

  avatarText: {
    fontWeight: '800',
    fontSize: 18,
    color: '#212529',
  },

  body: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
  },

  product: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 3,
  },

  lastMessage: {
    fontSize: 12,
    color: '#868e96',
    marginTop: 4,
  },

  meta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
    gap: 6,
  },

  time: {
    fontSize: 10,
    color: '#6c757d',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
    textAlign: 'center',
  },

  emptyHint: {
    marginTop: 6,
    fontSize: 13,
    color: '#adb5bd',
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 20,
  },
});
