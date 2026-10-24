import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ITEMS = [
  { key: 'home', label: 'Home', icon: 'home', iconOutline: 'home-outline', route: 'Home' },
  { key: 'search', label: 'Search', icon: 'search', iconOutline: 'search-outline', route: 'Search' },
  { key: 'post', label: 'Post', icon: 'add-circle', iconOutline: 'add-circle-outline', route: 'CreateListing' },
  { key: 'profile', label: 'Profile', icon: 'person', iconOutline: 'person-outline', route: 'Profile' },
];

export default function BottomNavBar({ navigation, active }) {
  const insets = useSafeAreaInsets();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;

    const check = async () => {
      const n = await fetchUnreadCount();
      if (alive) setUnread(n);
    };

    check();
    const timer = setInterval(check, 15000);
    const unsubscribe = navigation.addListener('focus', check);

    return () => {
      alive = false;
      clearInterval(timer);
      unsubscribe();
    };
  }, [navigation]);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {ITEMS.map((item) => {
        const isActive = active === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.item}
            onPress={() => goTo(item.route)}
            activeOpacity={0.7}
          >
            <View>
              <Ionicons
                name={isActive ? item.icon : item.iconOutline}
                size={24}
                color={isActive ? '#0d6efd' : '#6c757d'}
              />
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 8,
    elevation: 8,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '600', color: '#6c757d', marginTop: 2 },
  labelActive: { color: '#0d6efd' },
});