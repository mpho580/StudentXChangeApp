import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';

export default function ChatScreen({ navigation, route }) {
  const {
    partner_id,
    partner_name = 'Student',
    product_id = 0,
    product_title = '',
  } = route.params || {};

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  const loadThread = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');

      if (!stored) {
        navigation.replace('Login');
        return;
      }

      const u = JSON.parse(stored);
      setUser(u);

      const url =
        `${API_BASE_URL}/thread.php?user_id=${u.id}` +
        `&partner_id=${partner_id}&product_id=${product_id || 0}`;

      const res = await fetch(url);
      const responseText = await res.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        Alert.alert(
          'Server error',
          responseText.slice(0, 300) || `HTTP ${res.status}`
        );
        return;
      }

      if (data.success) {
        setMessages(data.messages || []);
      } else {
        Alert.alert('Error', data.message || 'Could not load messages.');
      }
    } catch (e) {
      Alert.alert('Connection error', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadThread();

      const interval = setInterval(loadThread, 8000);

      return () => clearInterval(interval);
    }, [partner_id, product_id])
  );

  const sendMessage = async () => {
    const body = text.trim();

    if (!body || !user || sending) return;

    setSending(true);
    setText('');

    try {
      const res = await fetch(`${API_BASE_URL}/thread.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: partner_id,
          product_id: product_id || 0,
          body,
        }),
      });

      const responseText = await res.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        Alert.alert('Server error', responseText.slice(0, 300));
        setText(body);
        return;
      }

      if (data.success) {
        await loadThread();
      } else {
        Alert.alert('Failed', data.message || 'Could not send.');
        setText(body);
      }
    } catch (e) {
      Alert.alert('Connection error', String(e?.message || e));
      setText(body);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const mine =
      user && Number(item.sender_id) === Number(user.id);

    return (
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text style={[styles.bubbleText, mine && styles.myBubbleText]}>
          {item.body || item.message}
        </Text>

        <Text
          style={[
            styles.bubbleTime,
            mine && styles.myBubbleTime,
          ]}
        >
          {item.created_at
            ? new Date(item.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{partner_name}</Text>

          {!!product_title && (
            <Text style={styles.headerProduct} numberOfLines={1}>
              {product_title}
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#0d6efd" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          style={styles.messagesList}
          data={messages}
          keyExtractor={(item, i) => String(item.id || i)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <Text style={styles.emptyThread}>
              No messages yet. Say hello!
            </Text>
          }
        />
      )}

      <View style={styles.composer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#adb5bd"
          multiline
          maxLength={3000}
          scrollEnabled
          textAlignVertical="top"
          blurOnSubmit={false}
          returnKeyType="default"
          accessibilityLabel="Type a message"
        />

        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!text.trim() || sending) && styles.sendBtnDisabled,
          ]}
          onPress={sendMessage}
          disabled={!text.trim() || sending}
          accessibilityLabel="Send message"
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    backgroundColor: '#0d6efd',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerName: { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerProduct: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: '#0d6efd',
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  bubbleText: { fontSize: 15, color: '#212529' },
  bubbleTime: {
    fontSize: 10,
    color: '#6c757d',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  emptyThread: { textAlign: 'center', color: '#6c757d', marginTop: 40 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#212529',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0d6efd',
    alignItems: 'center',
    justifyContent: 'center',
  },
});