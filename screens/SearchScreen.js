import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config';

const { width } = Dimensions.get('window');

const categories = [
  { id: 0, name: 'All' },
  { id: 1, name: 'Textbooks' },
  { id: 2, name: 'Electronics' },
  { id: 3, name: 'Apparel' },
  { id: 4, name: 'Furniture' },
  { id: 5, name: 'Stationery' },
  { id: 6, name: 'Services' },
];

const formatPrice = (price) => `R ${Number(price).toFixed(2)}`;

export default function SearchScreen({ navigation, route }) {
  const initialCategory = route?.params?.category_id ?? 0;
  const initialSearch = route?.params?.search ?? '';

  const [search, setSearch] = useState(String(initialSearch));
  const [categoryId, setCategoryId] = useState(Number(initialCategory) || 0);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchListings = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (categoryId > 0) params.append('category_id', String(categoryId));

      const query = params.toString();
      const url = query
        ? `${API_BASE_URL}/listings.php?${query}`
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
        'Could not load listings. Check that XAMPP is running.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Sync if navigated with new params
      if (route?.params?.category_id != null) {
        setCategoryId(Number(route.params.category_id) || 0);
      }
      if (route?.params?.search != null) {
        setSearch(String(route.params.search));
      }
      fetchListings();
    }, [route?.params?.category_id, route?.params?.search])
  );

  const handleSearch = () => {
    fetchListings();
  };

  const clearSearch = () => {
    setSearch('');
    setTimeout(() => fetchListings(false), 0);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ListingDetails', { id: item.id })}
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
  );

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Browse Listings</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color="#6c757d" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search textbooks, laptops..."
          placeholderTextColor="#adb5bd"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={20} color="#adb5bd" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => String(item.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        renderItem={({ item }) => {
          const active = categoryId === item.id;
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                setCategoryId(item.id);
                // fetch after state updates on next tick
                setTimeout(() => fetchListings(false), 0);
              }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Results */}
      {loading ? (
        <ActivityIndicator size="large" color="#0d6efd" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchListings(true)}
              colors={['#0d6efd']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={56} color="#adb5bd" />
              <Text style={styles.emptyText}>
                {search.trim() || categoryId > 0
                  ? 'No listings match your search.'
                  : 'No listings available yet.'}
              </Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backBtn: {
    padding: 4,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 4,
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
  chipsRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginHorizontal: 4,
  },
  chipActive: {
    backgroundColor: '#0d6efd',
    borderColor: '#0d6efd',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
  },
  chipTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 30,
  },
  row: {
    justifyContent: 'space-between',
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
    height: 120,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 17,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    paddingTop: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: '#198754',
  },
  viewButton: {
    backgroundColor: '#0d6efd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});