import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
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

const { width } = Dimensions.get('window');

const categories = [
  { id: 1, name: 'Textbooks', icon: 'book' },
  { id: 2, name: 'Electronics', icon: 'laptop-outline' },
  { id: 3, name: 'Apparel', icon: 'pricetag' },
  { id: 4, name: 'Furniture', icon: 'home' },
  { id: 5, name: 'Stationery', icon: 'pencil' },
  { id: 6, name: 'Services', icon: 'briefcase' },
];

const formatPrice = (price) => `R ${Number(price).toFixed(2)}`;

export default function HomeScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
      else setUser(null);
    } catch (e) {
      console.log(e);
    }
  };

  const fetchListings = async (isRefresh = false, query = search) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const url = query.trim()
        ? `${API_BASE_URL}/listings.php?search=${encodeURIComponent(query.trim())}`
        : `${API_BASE_URL}/listings.php`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setListings(data.listings || []);
      } else {
        setListings([]);
      }
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

  useFocusEffect(
    useCallback(() => {
      loadUser();
      fetchListings();
    }, [])
  );

  const handleSearch = () => {
    fetchListings(false, search);
  };

  const clearSearch = () => {
    setSearch('');
    fetchListings(false, '');
  };

  const isLoggedIn = !!user;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchListings(true)}
          colors={['#0d6efd']}
        />
      }
    >
      {/* ===== SEARCH BAR ===== */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color="#6c757d" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search textbooks, laptops, furniture..."
          placeholderTextColor="#adb5bd"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={20} color="#adb5bd" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* ===== HERO ===== */}
      <View style={styles.hero}>
        <Ionicons name="flash" size={32} color="#ffc107" style={{ marginBottom: 8 }} />
        <Text style={styles.heroTitle}>Campus Trading Made Effortless</Text>
        <Text style={styles.heroSubtitle}>
          Exchange textbooks, dorm appliances, tech devices, or class notes in a
          verified student-only network. Safe hand-offs on campus, zero shipping
          costs, and maximum affordability.
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

      <View style={styles.categoriesGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryCard}
            onPress={() =>
              navigation.navigate('Search', { category_id: cat.id })
            }
            activeOpacity={0.7}
          >
            <Ionicons name={cat.icon} size={28} color="#0d6efd" />
            <Text style={styles.categoryName} numberOfLines={1}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ===== RECENT / SEARCH RESULTS HEADER ===== */}
      <View style={styles.listingsHeader}>
        <Text style={[styles.sectionTitle, { marginBottom: 0, marginTop: 0 }]}>
          <Ionicons name="time" size={18} color="#0d6efd" />{' '}
          {search.trim() ? 'Search Results' : 'Recently Uploaded Items'}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Text style={styles.browseAll}>Browse All</Text>
        </TouchableOpacity>
      </View>

      {/* ===== LISTINGS ===== */}
      {loading ? (
        <ActivityIndicator size="large" color="#0d6efd" style={{ marginTop: 40 }} />
      ) : listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={64} color="#adb5bd" />
          <Text style={styles.emptyText}>
            {search.trim()
              ? `No results for "${search.trim()}". Try another search.`
              : 'No items listed yet. Be the first to start the campus circular economy!'}
          </Text>
        </View>
      ) : (
        <View style={styles.listingsGrid}>
          {listings.slice(0, 8).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.productCard}
              onPress={() =>
                navigation.navigate('ListingDetails', { id: item.id })
              }
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
                    <Text style={styles.viewButtonText}>View Details</Text>
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

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // Search bar
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#212529',
    paddingVertical: 10,
  },
  searchBtn: {
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 8,
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Hero
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

  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  categoryCard: {
    width: (width - 48) / 3,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    margin: 6,
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
  },

  listingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
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

  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  productCard: {
    width: (width - 40) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 6,
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