import React, { useState, useCallback, useMemo, useRef } from 'react';
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
import { FALLBACK_CATEGORIES, fetchCategories } from '../utils/categories';

const { width } = Dimensions.get('window');

const CONDITIONS = [
  { value: '', label: 'Any Condition' },
  { value: 'New', label: 'New' },
  { value: 'Like New', label: 'Like New' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Poor', label: 'Poor' },
];

const EMPTY_FILTERS = { categoryId: 0, minPrice: '', maxPrice: '', condition: '' };

const formatPrice = (price) => `R ${Number(price).toFixed(2)}`;

const toNumber = (v) => {
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
};

function ListingCard({ item, onPress }) {
  const [imgFailed, setImgFailed] = useState(false);
  const isSold = (item.status || 'Available') === 'Sold';
  const showImage = !!item.image_path && !imgFailed;

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.85}>
      {!!item.item_condition && (
        <View style={styles.conditionBadge}>
          <Text style={styles.conditionText}>{item.item_condition}</Text>
        </View>
      )}

      <View style={[styles.statusBadge, isSold ? styles.statusSold : styles.statusAvailable]}>
        <Ionicons name={isSold ? 'close-circle' : 'checkmark-circle'} size={11} color="#fff" />
        <Text style={styles.statusText}>{isSold ? 'Sold' : 'Available'}</Text>
      </View>

      {showImage ? (
        <Image
          source={{ uri: item.image_path }}
          style={styles.productImage}
          resizeMode="cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <View style={[styles.productImage, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={32} color="#adb5bd" />
        </View>
      )}

      <View style={styles.productBody}>
        <Text style={styles.categoryLabel} numberOfLines={1}>{item.category_name}</Text>
        <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>

        <View style={styles.cardPriceRow}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen({ navigation, route }) {
  const initialSearch = String(route?.params?.search ?? '');
  const initialCategory = Number(route?.params?.category_id) || 0;

  const [search, setSearch] = useState(initialSearch);
  const [activeQuery, setActiveQuery] = useState(initialSearch.trim());
  const [draft, setDraft] = useState({ ...EMPTY_FILTERS, categoryId: initialCategory });
  const [applied, setApplied] = useState({ ...EMPTY_FILTERS, categoryId: initialCategory });
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Always holds the latest values, so focus/refresh handlers never use stale state
  const latest = useRef({ search, applied });
  latest.current = { search, applied };

  const categoryOptions = useMemo(
    () => [{ id: 0, name: 'All Categories' }, ...categories],
    [categories]
  );

  const loadCategories = async () => {
    const list = await fetchCategories();
    setCategories(list);
  };

  const fetchListings = async (q, categoryId, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      if (q.trim()) params.append('search', q.trim());
      if (categoryId > 0) params.append('category_id', String(categoryId));

      const qs = params.toString();
      const url = qs
        ? `${API_BASE_URL}/listings.php?${qs}`
        : `${API_BASE_URL}/listings.php`;

      const response = await fetch(url);
      const data = await response.json();

      setActiveQuery(q.trim());
      setListings(data.success ? data.listings || [] : []);
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
      const p = route?.params;
      let q = latest.current.search;
      let a = latest.current.applied;

      if (p?.category_id != null) {
        const cat = Number(p.category_id) || 0;
        a = { ...a, categoryId: cat };
        setApplied(a);
        setDraft((d) => ({ ...d, categoryId: cat }));
      }
      if (p?.search != null) {
        q = String(p.search);
        setSearch(q);
      }

      loadCategories();
      fetchListings(q, a.categoryId);
    }, [route?.params?.category_id, route?.params?.search])
  );

  // Price + condition filters are applied here, on top of what the server returns
  const results = useMemo(() => {
    const min = toNumber(applied.minPrice);
    const max = toNumber(applied.maxPrice);
    return listings.filter((item) => {
      const price = Number(item.price);
      if (min !== null && price < min) return false;
      if (max !== null && price > max) return false;
      if (applied.condition && item.item_condition !== applied.condition) return false;
      return true;
    });
  }, [listings, applied]);

  const activeFilterCount =
    (applied.categoryId > 0 ? 1 : 0) +
    (toNumber(applied.minPrice) !== null ? 1 : 0) +
    (toNumber(applied.maxPrice) !== null ? 1 : 0) +
    (applied.condition ? 1 : 0);

  const setDraftField = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const handleSearch = () => fetchListings(search, applied.categoryId);

  const clearSearchText = () => {
    setSearch('');
    fetchListings('', applied.categoryId);
  };

  const applyFilters = () => {
    setApplied(draft);
    setShowFilters(false);
    fetchListings(search, draft.categoryId);
  };

  const clearAll = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setSearch('');
    setShowFilters(false);
    fetchListings('', 0);
  };

  const countLabel = loading
    ? '...'
    : `${results.length} ${results.length === 1 ? 'Item' : 'Items'} Found`;

  const listHeader = (
    <View>
      {/* Filter toggle */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters((s) => !s)}
        activeOpacity={0.8}
      >
        <Ionicons name="funnel" size={16} color="#0d6efd" />
        <Text style={styles.filterToggleText}>Filter Options</Text>
        {activeFilterCount > 0 && (
          <View style={styles.filterCountBadge}>
            <Text style={styles.filterCountText}>{activeFilterCount}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Ionicons
          name={showFilters ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#6c757d"
        />
      </TouchableOpacity>

      {/* Filter panel */}
      {showFilters && (
        <View style={styles.filterCard}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {categoryOptions.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, draft.categoryId === c.id && styles.chipActive]}
                onPress={() => setDraftField('categoryId', c.id)}
              >
                <Text
                  style={[styles.chipText, draft.categoryId === c.id && styles.chipTextActive]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Price Range (R)</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={styles.priceInput}
              placeholder="Min"
              placeholderTextColor="#adb5bd"
              keyboardType="decimal-pad"
              value={draft.minPrice}
              onChangeText={(t) => setDraftField('minPrice', t)}
            />
            <Text style={styles.priceDash}>–</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="Max"
              placeholderTextColor="#adb5bd"
              keyboardType="decimal-pad"
              value={draft.maxPrice}
              onChangeText={(t) => setDraftField('maxPrice', t)}
            />
          </View>

          <Text style={styles.label}>Condition</Text>
          <View style={styles.chips}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c.value || 'any'}
                style={[styles.chip, draft.condition === c.value && styles.chipActive]}
                onPress={() => setDraftField('condition', c.value)}
              >
                <Text
                  style={[styles.chipText, draft.condition === c.value && styles.chipTextActive]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
            <Text style={styles.clearBtnText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle} numberOfLines={2}>
          {activeQuery ? `Search Results for "${activeQuery}"` : 'Campus Marketplace Board'}
        </Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{countLabel}</Text>
        </View>
      </View>
    </View>
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
          <TouchableOpacity onPress={clearSearchText}>
            <Ionicons name="close-circle" size={20} color="#adb5bd" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Filters + results */}
      <FlatList
        data={loading ? [] : results}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              loadCategories();
              fetchListings(search, applied.categoryId, true);
            }}
            colors={['#0d6efd']}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#0d6efd" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={56} color="#adb5bd" />
              <Text style={styles.emptyTitle}>No matching products found.</Text>
              <Text style={styles.emptyText}>
                Try broadening your search term or clearing filter parameters.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <ListingCard
            item={item}
            onPress={() => navigation.navigate('ListingDetails', { id: item.id })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },

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
  backBtn: { padding: 4 },
  topTitle: { fontSize: 18, fontWeight: '700', color: '#212529' },

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
  searchInput: { flex: 1, fontSize: 15, color: '#212529', paddingVertical: 10 },
  searchBtn: {
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 8,
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  listContent: { paddingHorizontal: 10, paddingTop: 12, paddingBottom: 30 },
  row: { justifyContent: 'space-between' },

  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 6,
    elevation: 1,
  },
  filterToggleText: { fontSize: 15, fontWeight: '700', color: '#212529' },
  filterCountBadge: {
    backgroundColor: '#0d6efd',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 6,
    marginTop: 8,
    elevation: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
    marginTop: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  chipActive: { backgroundColor: '#0d6efd', borderColor: '#0d6efd' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#495057' },
  chipTextActive: { color: '#fff' },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#212529',
  },
  priceDash: { color: '#6c757d', fontSize: 16 },

  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 18,
  },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  clearBtn: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6c757d',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 8,
  },
  clearBtnText: { color: '#6c757d', fontWeight: '600', fontSize: 13 },

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginHorizontal: 6,
    marginTop: 16,
    marginBottom: 8,
  },
  resultsTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#212529' },
  countPill: {
    backgroundColor: '#6c757d',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  productCard: {
    width: (width - 44) / 2,
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
  conditionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ffc107',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 1,
  },
  conditionText: { fontSize: 10, fontWeight: '700', color: '#000' },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 1,
  },
  statusAvailable: { backgroundColor: '#198754' },
  statusSold: { backgroundColor: '#dc3545' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  productImage: { width: '100%', height: 120, backgroundColor: '#e9ecef' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },

  productBody: { padding: 12 },
  categoryLabel: { fontSize: 12, color: '#0d6efd', fontWeight: '600', marginBottom: 2 },
  productTitle: { fontSize: 14, fontWeight: '700', color: '#212529', marginBottom: 4 },
  productDescription: { fontSize: 12, color: '#6c757d', lineHeight: 17, marginBottom: 8 },
  cardPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    paddingTop: 8,
  },
  price: { fontSize: 14, fontWeight: '800', color: '#198754' },
  viewButton: {
    backgroundColor: '#0d6efd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  viewButtonText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: '700', color: '#212529' },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});