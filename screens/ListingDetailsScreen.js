import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const { width } = Dimensions.get('window');

export default function ListingDetailsScreen({ navigation, route }) {
  const { id } = route.params || {};

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      // Get current user
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setCurrentUserId(Number(u.id || u.user_id));
      }

      if (!id) {
        Alert.alert('Error', 'No listing ID provided.');
        navigation.goBack();
        return;
      }

      const res = await fetch(`${API_BASE_URL}/get_listing.php?id=${id}`);
      const data = await res.json();

      if (data.success && data.listing) {
        setListing(data.listing);
      } else {
        Alert.alert('Error', data.message || 'Listing not found.');
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert('Error', 'Could not load listing details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [id])
  );

  const handleMessageSeller = () => {
    if (!listing) return;

    navigation.navigate('Chat', {
      partner_id: Number(listing.user_id),
      product_id: Number(listing.id),
      partner_name: listing.seller_name || 'Seller',
      product_title: listing.title,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d6efd" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#6c757d' }}>Listing not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#0d6efd', fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwner = currentUserId && Number(listing.user_id) === currentUserId;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Listing Details
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <Image
          source={{
            uri:
              listing.image_path ||
              'https://via.placeholder.com/600x400?text=No+Image',
          }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.content}>
          {/* Title + Price */}
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>R {Number(listing.price).toFixed(2)}</Text>

          {/* Badges */}
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{listing.item_condition || '—'}</Text>
            </View>
            <View style={[styles.badge, styles.badgeCategory]}>
              <Text style={styles.badgeText}>{listing.category_name || '—'}</Text>
            </View>
            {listing.status && (
              <View
                style={[
                  styles.badge,
                  listing.status === 'Sold' ? styles.badgeSold : styles.badgeAvailable,
                ]}
              >
                <Text style={[styles.badgeText, { color: '#fff' }]}>
                  {listing.status}
                </Text>
              </View>
            )}
          </View>

          {/* Seller */}
          <View style={styles.sellerRow}>
            <Ionicons name="person-circle-outline" size={22} color="#0d6efd" />
            <Text style={styles.sellerText}>
              Sold by <Text style={{ fontWeight: '700' }}>{listing.seller_name || 'Student'}</Text>
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>
            {listing.description || 'No description provided.'}
          </Text>

          {/* Message button – only show if NOT the owner */}
          {!isOwner && (
            <TouchableOpacity
              style={styles.messageBtn}
              onPress={handleMessageSeller}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.messageBtnText}>Message Seller</Text>
            </TouchableOpacity>
          )}

          {/* Owner actions */}
          {isOwner && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('EditListing', { id: listing.id })}
              >
                <Ionicons name="create-outline" size={18} color="#212529" />
                <Text style={styles.editBtnText}>Edit Listing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.myListingsBtn}
                onPress={() => navigation.navigate('MyListings')}
              >
                <Text style={styles.myListingsBtnText}>My Listings</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212529',
    flex: 1,
    textAlign: 'center',
  },

  image: {
    width: width,
    height: 280,
    backgroundColor: '#e9ecef',
  },

  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 6,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#198754',
    marginBottom: 14,
  },

  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeCategory: {
    backgroundColor: '#e7f1ff',
  },
  badgeAvailable: {
    backgroundColor: '#198754',
  },
  badgeSold: {
    backgroundColor: '#dc3545',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212529',
  },

  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  sellerText: {
    fontSize: 15,
    color: '#495057',
  },

  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
    marginBottom: 28,
  },

  messageBtn: {
    backgroundColor: '#0d6efd',
    borderRadius: 10,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  ownerActions: {
    gap: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffc107',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212529',
  },
  myListingsBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  myListingsBtnText: {
    color: '#0d6efd',
    fontWeight: '600',
    fontSize: 15,
  },
});