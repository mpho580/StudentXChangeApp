import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const keyFor = (userId) => `inbox_seen_at_${userId}`;

async function getUserId() {
  try {
    const stored = await AsyncStorage.getItem('user');
    if (!stored) return 0;
    const u = JSON.parse(stored);
    return Number(u.id || u.user_id) || 0;
  } catch {
    return 0;
  }
}

// How many messages arrived since the inbox was last opened
export async function fetchUnreadCount() {
  try {
    const userId = await getUserId();
    if (!userId) return 0;

    const since = (await AsyncStorage.getItem(keyFor(userId))) || '';
    const res = await fetch(
      `${API_BASE_URL}/unread_count.php?user_id=${userId}&since=${encodeURIComponent(since)}`
    );
    const data = await res.json();
    if (!data.success) return 0;

    // First run: remember "now" so old messages don't all show as new
    if (!since && data.server_time) {
      await AsyncStorage.setItem(keyFor(userId), data.server_time);
    }
    return Number(data.count) || 0;
  } catch {
    return 0;
  }
}

// Call when the inbox is opened
export async function markInboxSeen(userId, serverTime) {
  try {
    if (userId && serverTime) {
      await AsyncStorage.setItem(keyFor(userId), serverTime);
    }
  } catch {
    // ignore
  }
}