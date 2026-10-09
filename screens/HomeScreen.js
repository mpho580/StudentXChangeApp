import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Expo already includes this

const { width } = Dimensions.get('window');

// Mock data (replace with real data later)
const categories = [
  { id: 1, name: 'Textbooks', icon: 'book' },
  { id: 2, name: 'Electronics', icon: 'laptop-outline' },
  { id: 3, name: 'Apparel', icon: 'pricetag' },
  { id: 4, name: 'Furniture', icon: 'home' },
  { id: 5, name: 'Stationery', icon: 'pencil' },
  { id: 6, name: 'Services', icon: 'briefcase' },
];

const listings = [
  {
    id: 1,
    title: 'Calculus Textbook 8th Edition',
    description: 'Barely used, no highlights. Perfect for MATH 201.',
    price: 45.0,
    item_condition: 'Like New',
    category_name: 'Textbooks',
    image_path: 'https://via.placeholder.com/300x180?text=Textbook',
    seller_name: 'Alex M.',
    created_at: '2026-09-10',
  },
  {
    id: 2,
    title: 'MacBook Air M1 2020',
    description: '8GB RAM, 256GB SSD. Battery health 92%.',
    price: 520.0,
    item_condition: 'Good',
    category_name: 'Electronics',
    image_path: 'https://via.placeholder.com/300x180?text=Laptop',
    seller_name: 'Jordan T.',
    created_at: '2026-09-09',
  },
];

const isLoggedIn = false; // Replace with your real auth state

const formatPrice = (price) => `$${Number(price).toFixed(2)}`;

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ===== HERO SECTION ===== */}
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
        <Ionicons name="grid" size={20} color="#0d6efd" /> Select Campus Category
      </Text>

      <View style={styles.categoriesGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryCard}
            onPress={() => navigation.navigate('Search', { category_id: cat.id })}
            activeOpacity={0.7}
          >
            <Ionicons name={cat.icon} size={28} color="#0d6efd" />
            <Text style={styles.categoryName} numberOfLines={1}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ===== RECENT LISTINGS HEADER ===== */}
      <View style={styles.listingsHeader}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="time" size={20} color="#0d6efd" /> Recently Uploaded Items
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Text style={styles.browseAll}>Browse All</Text>
        </TouchableOpacity>
      </View>

      {/* ===== LISTINGS ===== */}
      {listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={64} color="#adb5bd" />
          <Text style={styles.emptyText}>
            No items listed yet. Be the first to start the campus circular economy!
          </Text>
        </View>
      ) : (
        <View style={styles.listingsGrid}>
          {listings.slice(0, 8).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.productCard}
              onPress={() => navigation.navigate('ListingDetails', { id: item.id })}
              activeOpacity={0.85}
            >
              {/* Condition Badge */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.item_condition}</Text>
              </View>

              {/* Image */}
              <Image
                source={{ uri: item.image_path }}
                style={styles.productImage}
                resizeMode="cover"
              />

              {/* Content */}
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

              {/* Footer */}
              <View style={styles.productFooter}>
                <Text style={styles.footerText}>
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

  // Section Title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },

  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 24,
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

  // Listings Header
  listingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  browseAll: {
    color: '#0d6efd',
    fontWeight: '600',
    fontSize: 14,
  },

  // Empty State
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

  // Listings Grid
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
    fontSize: 16,
    fontWeight: '800',
    color: '#198754',
  },
  viewButton: {
    backgroundColor: '#0d6efd',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 12,
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
  },
});