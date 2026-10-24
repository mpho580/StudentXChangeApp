import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config';
import BottomNavBar from '../components/BottomNavBar';
import {
  FALLBACK_CATEGORIES,
  fetchCategories,
  iconForCategory,
} from '../utils/categories';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 16 * 2 - CARD_GAP) / 2;

const formatPrice = (price) => `R ${Number(price).toFixed(2)}`;

export default function HomeScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const fetchListings = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/listings.php`);
      const data = await response.json();
      setListings(data.success ? data.listings || [] : []);
    } catch (err) {
      Alert.alert(
        'Connection error',
        'Could not load listings. Check that XAMPP is running and API_BASE_URL is correct.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCategories = async () => {
    const list = await fetchCategories();
    setCategories(list);
  };

  useFocusEffect(
    useCallback(() => {
      loadUser();
      loadCategories();
      fetchListings();
    }, [])
  );

  const onRefresh = () => {
    loadCategories();
    fetchListings(true);
  };

  const isLoggedIn = !!user;

  // Helper so navigation always reaches the root Stack
  const openListingDetails = (id) => {
    const parent = navigation.getParent?.();
    if (parent) {
      parent.navigate('ListingDetails', { id });
    } else {
      navigation.navigate('ListingDetails', { id });
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0d6efd']}
          />
        }
      >
        {/* ===== HERO ===== */}
        <View style={styles.hero}>
          <Ionicons
            name="flash"
            size={32}
            color="#ffc107"
            style={{ marginBottom: 8 }}
          />

          <Text style={styles.heroTitle}>
            Campus Trading Made Effortless
          </Text>

          <Text style={styles.heroSubtitle}>
            Exchange textbooks, dorm appliances, tech devices, or class notes
            in a verified student-only network. Safe hand-offs on campus,
            zero shipping costs, and maximum affordability.
          </Text>

          <TouchableOpacity
            style={styles.heroButton}
            onPress={() =>
              navigation.navigate(isLoggedIn ? 'CreateListing' : 'Register')
            }
            activeOpacity={0.85}
          >
            <Ionicons
              name={isLoggedIn ? 'add-circle' : 'person-add'}
              size={20}
              color="#000"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.heroButtonText}>
              {isLoggedIn ? 'Post an Item' : 'Get Registered'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ===== CATEGORIES ===== */}
        <Text style={styles.sectionTitle}>
          <Ionicons name="grid" size={18} color="#0d6efd" /> Select Campus Category
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 8,
          }}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCardWide}
              onPress={() =>
                navigation.navigate('Search', { category_id: cat.id })
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name={iconForCategory(cat.name)}
                size={28}
                color="#0d6efd"
              />
              <Text style={styles.categoryName} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ===== RECENT HEADER ===== */}
        <View style={styles.listingsHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { marginBottom: 0, marginTop: 0 },
            ]}
          >
            <Ionicons name="time" size={18} color="#0d6efd" /> Recently Uploaded Items
          </Text>

          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Text style={styles.browseAll}>Browse All</Text>
          </TouchableOpacity>
        </View>

        {/* ===== LISTINGS – 2 COLUMNS ===== */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0d6efd"
            style={{ marginTop: 40 }}
          />
        ) : listings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color="#adb5bd" />
            <Text style={styles.emptyText}>
              No items listed yet. Be the first to start the campus circular
              economy!
            </Text>
          </View>
        ) : (
          <View style={styles.listingsGrid}>
            {listings.slice(0, 8).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.productCard}
                onPress={() => openListingDetails(item.id)}
                activeOpacity={0.85}
              >
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.item_condition}</Text>
                </View>

                <Image
                  source={{
                    uri:
                      item.image_path ||
                      'https://via.placeholder.com/300x180?text=No+Image',
                  }}
                  style={styles.productImage}
                  resizeMode="cover"
                />

                <View style={styles.productBody}>
                  <Text style={styles.categoryLabel}>{item.category_name}</Text>

                  <Text style={styles.productTitle} numberOfLines={1}>
                    {item.title}
                  </Text>

                  <Text style={styles.productDescription} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{formatPrice(item.price)}</Text>
                    <View style={styles.viewButton}>
                      <Text style={styles.viewButtonText}>View</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.productFooter}>
                  <Text style={styles.footerText} numberOfLines={1}>
                    <Ionicons name="person-outline" size={12} /> {item.seller_name}
                  </Text>
                  <Text style={styles.footerText}>
                    <Ionicons name="calendar-outline" size={12} />{' '}
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Extra space so content is not hidden behind the bottom bar */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ===== CUSTOM BOTTOM NAV (with Inbox) ===== */}
      <BottomNavBar
        navigation={navigation}
        active="home"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  hero: {
    backgroundColor: '#0d6efd',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffc107',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  heroButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212529',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },

  categoryCardWide: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 6,
    marginHorizontal: 6,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  categoryName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },

  listingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 12,
  },
  browseAll: {
    color: '#0d6efd',
    fontWeight: '600',
    fontSize: 14,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    paddingHorizontal: 30,
  },

  // ===== 2-COLUMN GRID =====
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: CARD_GAP,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
  productImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#e9ecef',
  },
  productBody: {
    padding: 12,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#0d6efd',
    fontWeight: '600',
    marginBottom: 2,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 18,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    paddingTop: 10,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#198754',
  },
  viewButton: {
    backgroundColor: '#0d6efd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 11,
    color: '#6c757d',
    maxWidth: '48%',
  },
});