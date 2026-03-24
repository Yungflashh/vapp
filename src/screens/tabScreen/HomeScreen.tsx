// screens/HomeScreen.tsx - FIXED WITH UNIFIED SEARCH
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, FlatList, ActivityIndicator, RefreshControl, Share, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import { BottomTabParamList } from '@/navigation/BottomTabNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import VerifyBadge from '@/components/VerifyBadge';
import { ProductCard } from '@/components/Products/ProductCard';
import {
  getProducts,
  getRecommendedProducts,
  getTrendingProducts,
  getNewArrivals,
  getFlashSaleProducts,
  Product,
  ProductFilters,
} from '@/services/product.service';
import {
  getTopVendors,
  followVendor,
  unfollowVendor,
  Vendor,
} from '@/services/vendor.service';
import { getCategories, type Category } from '@/services/category.service';
import { getCart } from '@/services/cart.service';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import SignInModal from '@/components/SignInModal';
import GuestEmailModal from '@/components/GuestEmailModal';
import WelcomeTour from '@/components/WelcomeTour';
import { getGuestCartCount } from '@/services/guest-storage.service';

type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

type CategoryFilter = 'all' | 'fashion' | 'electronics' | 'beauty' | 'home' | 'books' | 'sports' | 'digital-products';
type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { isGuest, exitGuestMode } = useAuth();
  const { unreadCount: notificationCount } = useNotifications();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInMessage, setSignInMessage] = useState('');
  const [showGuestEmailModal, setShowGuestEmailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'popular' | 'product' | 'vendor' | 'search'>('popular');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [cartCount, setCartCount] = useState(0);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [digitalProducts, setDigitalProducts] = useState<Product[]>([]);
  const [topVendors, setTopVendors] = useState<Vendor[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchBarLayout, setSearchBarLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const searchBarRef = React.useRef<View>(null);
  const [searchBarPageY, setSearchBarPageY] = useState(0);

  // Search results state
  const [isSearching, setIsSearching] = useState(false);
  const [searchProducts, setSearchProducts] = useState<Product[]>([]);
  const [searchVendors, setSearchVendors] = useState<Vendor[]>([]);
  const [searchCategories, setSearchCategories] = useState<Category[]>([]);

  const categories = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'electronics', label: 'Electronics', icon: 'phone-portrait' },
    { id: 'fashion', label: 'Fashion', icon: 'shirt' },
    { id: 'beauty', label: 'Beauty', icon: 'sparkles' },
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'books', label: 'Books', icon: 'book' },
    { id: 'sports', label: 'Sports', icon: 'football' },
    { id: 'digital-products', label: 'Digital', icon: 'save' },
  ];

  const sortOptions = [
    { id: 'newest', label: 'Newest First', icon: 'time-outline' },
    { id: 'price_asc', label: 'Price: Low to High', icon: 'arrow-up' },
    { id: 'price_desc', label: 'Price: High to Low', icon: 'arrow-down' },
    { id: 'rating', label: 'Highest Rated', icon: 'star' },
    { id: 'popular', label: 'Most Popular', icon: 'trending-up' },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Refresh cart count when screen comes into focus (e.g., returning from Cart)
  useFocusEffect(
    useCallback(() => {
      fetchCartCount();
    }, [])
  );

  useEffect(() => {
    // Only fetch when NOT in search mode
    if (activeTab === 'search') return;

    if (activeTab === 'product') {
      fetchAllProducts();
    } else if (activeTab === 'vendor') {
      fetchAllVendors();
    }
  }, [activeTab, activeCategory, sortBy]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await fetchCategoriesMap();
      
      await Promise.all([
        fetchProducts(),
        fetchTrendingProducts(),
        fetchNewArrivals(),
        fetchTopVendors(),
        fetchCartCount(),
        fetchFlashSales(),
        fetchDigitalProducts(),
      ]);
    } catch (err: any) {
      setError('Failed to load data');
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load data.' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoriesMap = async () => {
    try {
      const response = await getCategories();
      
      if (response.success && response.data.categories) {
        const map = new Map<string, string>();
        response.data.categories.forEach(cat => {
          map.set(cat.slug, cat._id);
        });
        setCategoriesMap(map);
        setAllCategories(response.data.categories);
      }
    } catch (err) {
      console.error('❌ Error fetching categories map:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setError(null);
      const response = await getRecommendedProducts(10);
      if (response.success && response.data.products) {
        setProducts(response.data.products);
      }
    } catch (err: any) {
      console.error('Error fetching recommended products:', err);
    }
  };

  const fetchTrendingProducts = async () => {
    try {
      const response = await getTrendingProducts(10);
      if (response.success && response.data.products) {
        setTrendingProducts(response.data.products);
      }
    } catch (err) {
      console.error('Error fetching trending products:', err);
    }
  };

  const fetchNewArrivals = async () => {
    try {
      const response = await getNewArrivals(10);
      if (response.success && response.data.products) {
        setNewArrivals(response.data.products);
      }
    } catch (err) {
      console.error('Error fetching new arrivals:', err);
    }
  };

  const fetchCartCount = async () => {
    if (isGuest) {
      const count = await getGuestCartCount();
      setCartCount(count);
      return;
    }
    try {
      const response = await getCart();
      if (response.success && response.data?.cart) {
        setCartCount(response.data.cart.items?.length || 0);
      }
    } catch (err) {
      // Cart might not exist yet - that's fine
      setCartCount(0);
    }
  };

  const fetchTopVendors = async () => {
    try {
      const response = await getTopVendors(10, 'rating');
      if (response.success && response.data.vendors) {
        setTopVendors(response.data.vendors);
        setAllVendors(response.data.vendors);
      }
    } catch (err) {
      console.error('Error fetching top vendors:', err);
    }
  };

  const fetchFlashSales = async () => {
    try {
      const results = await getFlashSaleProducts(20);
      setFlashSaleProducts(results);
    } catch (err) {
      console.error('Error fetching flash sale products:', err);
    }
  };

  const fetchDigitalProducts = async () => {
    try {
      const response = await getProducts({ limit: 10, category: categoriesMap.get('digital-products') || undefined } as any);
      if (response.success && response.data.products) {
        // Filter for digital product type in case category filter didn't work
        const digital = response.data.products.filter((p: Product) => p.productType === 'digital');
        setDigitalProducts(digital.length > 0 ? digital : response.data.products.slice(0, 10));
      }
    } catch (err) {
      console.error('Error fetching digital products:', err);
    }
  };

  const fetchAllProducts = async () => {
    try {
      setIsLoadingProducts(true);
      setError(null);

      const filters: ProductFilters = {
        limit: 50,
        sort: sortBy,
      };

      if (activeCategory !== 'all') {
        const categoryId = categoriesMap.get(activeCategory);
        if (categoryId) {
          filters.category = categoryId;
        } else if (categoriesMap.size === 0) {
          await fetchCategoriesMap();
          const retryId = categoriesMap.get(activeCategory);
          if (retryId) {
            filters.category = retryId;
          }
        }
      }

      const response = await getProducts(filters);
      
      if (response.success && response.data.products) {
        setAllProducts(response.data.products);
      }
    } catch (err: any) {
      console.error('Error fetching all products:', err);
      setError('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchAllVendors = async () => {
    try {
      setIsLoadingVendors(true);
      setError(null);
      const response = await getTopVendors(50, 'rating');
      if (response.success && response.data.vendors) {
        setTopVendors(response.data.vendors);
        setAllVendors(response.data.vendors);
      }
    } catch (err: any) {
      console.error('Error fetching all vendors:', err);
      setError('Failed to load vendors');
    } finally {
      setIsLoadingVendors(false);
    }
  };

  // ==================== UNIFIED SEARCH ====================
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Toast.show({ type: 'info', text1: 'Empty Search', text2: 'Please enter a search term' });
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    setActiveSearchQuery(query);
    setActiveTab('search');
    setIsSearching(true);

    try {
      // Search all three in parallel
      const [productRes, vendorRes] = await Promise.all([
        getProducts({ search: query, limit: 20 }).catch(() => null),
        getTopVendors(50, 'rating').catch(() => null),
      ]);

      // Products from server
      if (productRes?.success && productRes.data.products) {
        setSearchProducts(productRes.data.products);
      } else {
        setSearchProducts([]);
      }

      // Vendors - client-side filter (server doesn't have vendor search)
      if (vendorRes?.success && vendorRes.data.vendors) {
        const filteredVendors = vendorRes.data.vendors.filter(
          (v) =>
            v.name.toLowerCase().includes(query) ||
            v.description?.toLowerCase().includes(query) ||
            v.location?.toLowerCase().includes(query)
        );
        setSearchVendors(filteredVendors);
      } else {
        setSearchVendors([]);
      }

      // Categories - client-side filter
      const filteredCategories = allCategories.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.slug.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
      setSearchCategories(filteredCategories);

    } catch (err) {
      console.error('❌ Search error:', err);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Search failed. Please try again.' });
    } finally {
      setIsSearching(false);
    }
  };

  const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);

    // Clear previous debounce
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (text.trim().length >= 2) {
      const query = text.trim().toLowerCase();

      // Instant: suggest from already-loaded local data
      const localSuggestions: string[] = [];
      allCategories.forEach(c => {
        if (c.name.toLowerCase().includes(query) && !localSuggestions.includes(c.name)) {
          localSuggestions.push(c.name);
        }
      });
      products.forEach(p => {
        if (p.name.toLowerCase().includes(query) && !localSuggestions.includes(p.name)) {
          localSuggestions.push(p.name);
        }
      });
      topVendors.forEach(v => {
        if (v.name.toLowerCase().includes(query) && !localSuggestions.includes(v.name)) {
          localSuggestions.push(v.name);
        }
      });

      // Show local suggestions immediately
      setSearchSuggestions(localSuggestions.slice(0, 8));
      setShowSuggestions(localSuggestions.length > 0);

      // Debounced: fetch from backend for broader results
      searchDebounceRef.current = setTimeout(async () => {
        try {
          const [productRes, vendorRes] = await Promise.all([
            getProducts({ search: query, limit: 8 }).catch(() => null),
            getTopVendors(20, 'rating').catch(() => null),
          ]);

          const apiSuggestions: string[] = [...localSuggestions];

          // Add product names from API
          if (productRes?.success && productRes.data.products) {
            productRes.data.products.forEach((p: Product) => {
              if (!apiSuggestions.includes(p.name)) {
                apiSuggestions.push(p.name);
              }
            });
          }

          // Add vendor names from API
          if (vendorRes?.success && vendorRes.data.vendors) {
            vendorRes.data.vendors
              .filter((v: Vendor) => v.name.toLowerCase().includes(query))
              .forEach((v: Vendor) => {
                if (!apiSuggestions.includes(v.name)) {
                  apiSuggestions.push(v.name);
                }
              });
          }

          setSearchSuggestions(apiSuggestions.slice(0, 8));
          setShowSuggestions(apiSuggestions.length > 0);
        } catch (err) {
          // Keep local suggestions on error
        }
      }, 300);
    } else {
      setShowSuggestions(false);
      setSearchSuggestions([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearchQuery('');
    setSearchProducts([]);
    setSearchVendors([]);
    setSearchCategories([]);
    setActiveTab('popular');
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    if (activeTab === 'search' && activeSearchQuery) {
      await handleSearch();
    } else if (activeTab === 'popular') {
      await fetchInitialData();
    } else if (activeTab === 'product') {
      await fetchAllProducts();
    } else if (activeTab === 'vendor') {
      await fetchAllVendors();
    }
    setIsRefreshing(false);
  };

  const handleShare = async (vendor: Vendor) => {
    try {
      await Share.share({
        message: `Check out ${vendor.name} on VendorSpot! ${vendor.description || ''}`,
        title: vendor.name,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleFollowVendor = async (vendor: Vendor) => {
    if (isGuest) {
      setShowGuestEmailModal(true);
      return;
    }
    try {
      if (vendor.isFollowing) {
        await unfollowVendor(vendor.id);
        setTopVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, isFollowing: false, followers: Math.max(0, (v.followers || 0) - 1) } : v));
        setAllVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, isFollowing: false, followers: Math.max(0, (v.followers || 0) - 1) } : v));
        setSearchVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, isFollowing: false, followers: Math.max(0, (v.followers || 0) - 1) } : v));
        Toast.show({ type: 'success', text1: 'Unfollowed', text2: `You unfollowed ${vendor.name}` });
      } else {
        await followVendor(vendor.id);
        setTopVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, isFollowing: true, followers: (v.followers || 0) + 1 } : v));
        setAllVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, isFollowing: true, followers: (v.followers || 0) + 1 } : v));
        setSearchVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, isFollowing: true, followers: (v.followers || 0) + 1 } : v));
        Toast.show({ type: 'success', text1: 'Following', text2: `You are now following ${vendor.name}` });
      }
    } catch (err: any) {
      console.error('Follow error:', err?.response?.data || err.message);
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed to update follow status' });
    }
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    setShowSortMenu(false);
  };

  const handleCategoryPress = (category: Category) => {
    // Find matching slug in our category filter list
    const matchingFilter = categories.find(
      (c) => c.id === category.slug || c.label.toLowerCase() === category.name.toLowerCase()
    );

    if (matchingFilter) {
      setActiveCategory(matchingFilter.id as CategoryFilter);
    }

    clearSearch();
    setActiveTab('product');

    // If no matching filter, navigate with category ID
    if (!matchingFilter) {
      // Fallback: just go to product tab with all
      setActiveCategory('all');
      setActiveTab('product');
    }
  };

  // ==================== RENDER HELPERS ====================

  const renderTopVendorRow = ({ item }: { item: Vendor }) => (
    <TouchableOpacity 
      className="items-center mr-4 w-20" 
      onPress={() => navigation.navigate('VendorProfile', { vendorId: item.id })} 
      activeOpacity={0.7}
    >
      <View className="relative">
        <View className={`w-16 h-16 rounded-full bg-gray-200 border-2 ${item.isPremium ? 'border-pink-500' : 'border-gray-300'} overflow-hidden`}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Icon name="person" size={32} color="#9CA3AF" />
            </View>
          )}
        </View>
        {item.verified && (
          <View className="absolute -bottom-1 -right-1">
            <VerifyBadge size={20} isPremium={item.isPremium} />
          </View>
        )}
      </View>
      <Text className="text-xs text-gray-900 mt-2 text-center font-medium" numberOfLines={1}>{item.name}</Text>
      {item.rating > 0 && (
        <View className="flex-row items-center mt-1">
          <Icon name="star" size={10} color="#FBBF24" />
          <Text className="text-xs text-gray-600 ml-1">{item.rating.toFixed(1)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderVendorCard = ({ item }: { item: Vendor }) => (
    <TouchableOpacity
      className="w-[48%] mb-4"
      onPress={() => navigation.navigate('VendorProfile', { vendorId: item.id })}
      activeOpacity={0.8}
    >
      <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {/* Cover Image */}
        <View className="relative h-24">
          {item.coverImage ? (
            <Image source={{ uri: item.coverImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View className="w-full h-full bg-gray-100 items-center justify-center">
              <Icon name="storefront-outline" size={28} color="#CC3366" />
            </View>
          )}
          {/* Follow icon top right */}
          <TouchableOpacity
            className="absolute top-2 right-2 w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: item.isFollowing ? 'rgba(204,51,102,0.9)' : 'rgba(0,0,0,0.5)' }}
            onPress={(e) => {
              e.stopPropagation();
              handleFollowVendor(item);
            }}
          >
            <Icon name={item.isFollowing ? 'person-remove-outline' : 'person-add-outline'} size={14} color="#FFFFFF" />
          </TouchableOpacity>
          {/* Profile image bottom left */}
          <View className="absolute -bottom-5 left-3">
            <View className="w-12 h-12 rounded-full bg-white border-2 border-white overflow-hidden shadow-md">
              {item.image ? (
                <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View className="w-full h-full bg-gray-200 items-center justify-center">
                  <Icon name="person" size={20} color="#9CA3AF" />
                </View>
              )}
            </View>
          </View>
        </View>
        {/* Card body */}
        <View className="pt-7 px-3 pb-3">
          <View className="flex-row items-center mb-0.5">
            <Text className="text-sm font-bold text-gray-900 flex-shrink" numberOfLines={1}>{item.name}</Text>
            {item.verified && (
              <View style={{ marginLeft: 4 }}><VerifyBadge size={14} isPremium={item.isPremium} /></View>
            )}
          </View>
          {/* Location - visible, not behind image */}
          <View className="flex-row items-center mb-1">
            <Icon name="location-outline" size={12} color="#9CA3AF" />
            <Text className="text-xs text-gray-500 ml-0.5" numberOfLines={1}>{item.location || 'Lagos, Nigeria'}</Text>
          </View>
          <View className="flex-row items-center mb-2">
            <Icon name="star" size={12} color="#FBBF24" />
            <Text className="text-xs text-gray-600 ml-1">{item.rating.toFixed(1)}</Text>
            <Text className="text-xs text-gray-400 ml-1">({item.reviews} reviews)</Text>
          </View>
          <Text className="text-xs text-gray-500 mb-3" numberOfLines={2}>
            {item.description || 'Quality products and excellent service'}
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg border border-pink-500"
              onPress={(e) => {
                e.stopPropagation();
                handleShare(item);
              }}
            >
              <Icon name="share-social-outline" size={14} color="#CC3366" />
              <Text className="text-pink-500 text-xs font-semibold ml-1">Share</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg bg-pink-500"
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate('VendorProfile', { vendorId: item.id });
              }}
            >
              <Icon name="storefront" size={14} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold ml-1">Visit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryFilters = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      className="mb-4" 
      contentContainerStyle={{ paddingHorizontal: 4 }}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          className={`mr-3 px-5 py-2.5 rounded-full flex-row items-center ${
            activeCategory === category.id ? 'bg-gray-900' : 'bg-white border border-gray-200'
          }`}
          onPress={() => setActiveCategory(category.id as CategoryFilter)}
        >
          <Icon 
            name={category.icon as any} 
            size={16} 
            color={activeCategory === category.id ? '#FFFFFF' : '#6B7280'} 
          />
          <Text className={`ml-2 font-medium text-sm ${
            activeCategory === category.id ? 'text-white' : 'text-gray-600'
          }`}>
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSortButton = () => (
    <View className="relative">
      <TouchableOpacity 
        className="px-5 py-2.5 rounded-full flex-row items-center bg-white border border-gray-200"
        onPress={() => setShowSortMenu(!showSortMenu)}
      >
        <MaterialIcon name="sort" size={16} color="#6B7280" />
        <Text className="ml-2 font-medium text-sm text-gray-600">Sort</Text>
      </TouchableOpacity>
      {showSortMenu && (
        <View className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[200px]">
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              className={`px-4 py-3 flex-row items-center ${
                sortBy === option.id ? 'bg-pink-50' : ''
              }`}
              onPress={() => handleSortChange(option.id as SortOption)}
            >
              <Icon 
                name={option.icon as any} 
                size={18} 
                color={sortBy === option.id ? '#CC3366' : '#6B7280'} 
              />
              <Text className={`ml-3 text-sm ${
                sortBy === option.id ? 'text-pink-500 font-semibold' : 'text-gray-700'
              }`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  // ==================== SEARCH RESULTS TAB ====================
  const renderSearchTab = () => {
    const totalResults = searchProducts.length + searchVendors.length + searchCategories.length;

    if (isSearching) {
      return (
        <View className="items-center justify-center py-20">
          <ActivityIndicator size="large" color="#CC3366" />
          <Text className="text-gray-500 mt-4">Searching for "{activeSearchQuery}"...</Text>
        </View>
      );
    }

    if (totalResults === 0) {
      return (
        <View className="items-center justify-center py-20 px-4">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Icon name="search-outline" size={36} color="#9CA3AF" />
          </View>
          <Text className="text-base font-semibold text-gray-700 mb-1">No results found</Text>
          <Text className="text-sm text-gray-500 text-center px-8 mb-4">
            We couldn't find anything matching "{activeSearchQuery}". Try a different search term.
          </Text>
          <TouchableOpacity onPress={clearSearch} className="bg-pink-500 px-6 py-3 rounded-xl">
            <Text className="text-white font-bold">Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="px-4 py-4">
        {/* Search Header */}
        <View className="flex-row items-center justify-between mb-4 bg-pink-50 px-4 py-3 rounded-xl">
          <View className="flex-1">
            <Text className="text-sm text-gray-700">
              Results for "<Text className="font-bold text-pink-500">{activeSearchQuery}</Text>"
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              {totalResults} {totalResults === 1 ? 'result' : 'results'} found
            </Text>
          </View>
          <TouchableOpacity onPress={clearSearch} className="bg-white px-3 py-1.5 rounded-full border border-gray-200">
            <Text className="text-xs text-gray-600 font-medium">Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Results */}
        {searchCategories.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Icon name="grid-outline" size={18} color="#8B5CF6" />
              <Text className="text-base font-bold text-gray-900 ml-2">Categories</Text>
              <View className="bg-purple-100 px-2 py-0.5 rounded-full ml-2">
                <Text className="text-xs font-bold text-purple-600">{searchCategories.length}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {searchCategories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  onPress={() => handleCategoryPress(cat)}
                  className="mr-3 bg-white rounded-2xl p-4 shadow-sm items-center"
                  style={{ width: 110 }}
                >
                  <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mb-2">
                    {cat.image ? (
                      <Image source={{ uri: cat.image }} className="w-full h-full rounded-xl" resizeMode="cover" />
                    ) : (
                      <Icon name="folder-outline" size={22} color="#8B5CF6" />
                    )}
                  </View>
                  <Text className="text-xs font-semibold text-gray-900 text-center" numberOfLines={2}>
                    {cat.name}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-0.5">
                    {cat.productCount || 0} items
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Vendors Results */}
        {searchVendors.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Icon name="storefront-outline" size={18} color="#CC3366" />
              <Text className="text-base font-bold text-gray-900 ml-2">Vendors</Text>
              <View className="bg-pink-100 px-2 py-0.5 rounded-full ml-2">
                <Text className="text-xs font-bold text-pink-600">{searchVendors.length}</Text>
              </View>
            </View>

            {searchVendors.length <= 3 ? (
              // Show full cards for few results
              searchVendors.map((vendor) => (
                <TouchableOpacity
                  key={vendor.id}
                  className="bg-white rounded-xl p-3 mb-3 flex-row items-center shadow-sm"
                  onPress={() => navigation.navigate('VendorProfile', { vendorId: vendor.id })}
                >
                  <View className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden mr-3 border-2 border-pink-200">
                    {vendor.image ? (
                      <Image source={{ uri: vendor.image }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <View className="w-full h-full items-center justify-center bg-pink-50">
                        <Icon name="person" size={24} color="#CC3366" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>{vendor.name}</Text>
                      {vendor.verified && (
                        <View style={{ marginLeft: 4 }}><VerifyBadge size={14} isPremium={vendor.isPremium} /></View>
                      )}
                    </View>
                    <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                      {vendor.description || vendor.location || 'VendorSpot Seller'}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Icon name="star" size={10} color="#FBBF24" />
                      <Text className="text-xs text-gray-600 ml-1">{vendor.rating.toFixed(1)}</Text>
                      <Text className="text-xs text-gray-400 ml-1">({vendor.reviews} reviews)</Text>
                    </View>
                  </View>
                  <Icon name="chevron-forward" size={20} color="#D1D5DB" />
                </TouchableOpacity>
              ))
            ) : (
              // Show horizontal scroll for many results
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {searchVendors.map((vendor) => (
                  <TouchableOpacity
                    key={vendor.id}
                    className="items-center mr-4 w-20"
                    onPress={() => navigation.navigate('VendorProfile', { vendorId: vendor.id })}
                  >
                    <View className="w-16 h-16 rounded-full bg-gray-200 border-2 border-pink-500 overflow-hidden">
                      {vendor.image ? (
                        <Image source={{ uri: vendor.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Icon name="person" size={28} color="#9CA3AF" />
                        </View>
                      )}
                    </View>
                    <Text className="text-xs text-gray-900 mt-2 text-center font-medium" numberOfLines={1}>
                      {vendor.name}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <Icon name="star" size={10} color="#FBBF24" />
                      <Text className="text-xs text-gray-600 ml-1">{vendor.rating.toFixed(1)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Products Results */}
        {searchProducts.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center mb-3">
              <Icon name="cube-outline" size={18} color="#3B82F6" />
              <Text className="text-base font-bold text-gray-900 ml-2">Products</Text>
              <View className="bg-blue-100 px-2 py-0.5 rounded-full ml-2">
                <Text className="text-xs font-bold text-blue-600">{searchProducts.length}</Text>
              </View>
            </View>
            <View className="flex-row flex-wrap justify-between">
              {searchProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={(product) => navigation.navigate('ProductDetails', { productId: product.id })}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  // ==================== PRODUCT TAB ====================
  const renderProductTab = () => (
    <View className="bg-gray-50 px-4 py-4">
      {renderCategoryFilters()}
      
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-gray-900">
          {activeCategory === 'all' ? 'All Products' : categories.find(c => c.id === activeCategory)?.label}
          {allProducts.length > 0 && (
            <Text className="text-gray-500 font-normal text-sm"> ({allProducts.length})</Text>
          )}
        </Text>
        {renderSortButton()}
      </View>

      {isLoadingProducts && (
        <View className="items-center justify-center py-20">
          <ActivityIndicator size="large" color="#CC3366" />
          <Text className="text-gray-500 mt-4">Loading products...</Text>
        </View>
      )}

      {error && !isLoadingProducts && (
        <View className="items-center justify-center py-20">
          <Icon name="alert-circle-outline" size={48} color="#EF4444" />
          <Text className="text-gray-900 font-semibold mt-4">Failed to load products</Text>
          <Text className="text-gray-500 mt-2 text-center">{error}</Text>
          <TouchableOpacity className="bg-pink-500 px-6 py-3 rounded-lg mt-4" onPress={fetchAllProducts}>
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoadingProducts && !error && allProducts.length === 0 && (
        <View className="items-center justify-center py-20">
          <Icon name="cube-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 mt-4">No products available</Text>
          <Text className="text-gray-400 text-sm mt-2">Try selecting a different category</Text>
        </View>
      )}

      {!isLoadingProducts && !error && allProducts.length > 0 && (
        <View className="flex-row flex-wrap justify-between">
          {allProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={(product) => navigation.navigate('ProductDetails', { productId: product.id })}
            />
          ))}
        </View>
      )}
    </View>
  );

  // ==================== VENDOR TAB ====================
  const renderVendorTab = () => (
    <View className="bg-gray-50 px-4 py-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-gray-900">
          Top Vendors
          {topVendors.length > 0 && (
            <Text className="text-gray-500 font-normal text-sm"> ({topVendors.length})</Text>
          )}
        </Text>
        {renderSortButton()}
      </View>

      {isLoadingVendors && (
        <View className="items-center justify-center py-20">
          <ActivityIndicator size="large" color="#CC3366" />
          <Text className="text-gray-500 mt-4">Loading vendors...</Text>
        </View>
      )}

      {error && !isLoadingVendors && (
        <View className="items-center justify-center py-20">
          <Icon name="storefront-outline" size={48} color="#EF4444" />
          <Text className="text-gray-900 font-semibold mt-4">Failed to load vendors</Text>
          <TouchableOpacity className="bg-pink-500 px-6 py-3 rounded-lg mt-4" onPress={fetchAllVendors}>
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoadingVendors && !error && topVendors.length === 0 && (
        <View className="items-center justify-center py-20">
          <Icon name="storefront-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 mt-4">No vendors available</Text>
        </View>
      )}

      {!isLoadingVendors && !error && topVendors.length > 0 && (
        <View className="flex-row flex-wrap justify-between">
          {topVendors.map((vendor) => (
            <React.Fragment key={vendor.id}>
              {renderVendorCard({ item: vendor })}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );

  // ==================== POPULAR TAB ====================
  const renderPopularTab = () => (
    <>
      {/* Top Vendors */}
      <View className="bg-white px-4 py-4 mb-2">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">Top Vendors</Text>
          <TouchableOpacity className="flex-row items-center" onPress={() => { clearSearch(); setActiveTab('vendor'); }}>
            <Text className="text-pink-500 font-medium mr-1">See All</Text>
            <Icon name="chevron-forward" size={18} color="#CC3366" />
          </TouchableOpacity>
        </View>
        {topVendors.length > 0 ? (
          <FlatList 
            data={topVendors.slice(0, 10)} 
            renderItem={renderTopVendorRow} 
            keyExtractor={(item) => item.id} 
            horizontal 
            showsHorizontalScrollIndicator={false} 
          />
        ) : (
          <View className="items-center justify-center py-8">
            <Icon name="people-outline" size={40} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2 text-sm">No vendors available</Text>
          </View>
        )}
      </View>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <View className="bg-white px-4 py-4 mb-2">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">New Arrivals</Text>
            <TouchableOpacity onPress={() => { clearSearch(); setActiveCategory('all'); setSortBy('newest'); setActiveTab('product'); }}>
              <Text className="text-pink-500 font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={newArrivals.slice(0, 10)}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="mr-4 w-40"
                onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
                activeOpacity={0.8}
              >
                <View className="bg-gray-50 rounded-2xl overflow-hidden">
                  <View className="relative">
                    <View className="bg-gray-200 aspect-square items-center justify-center">
                      {item.images?.[0] ? (
                        <Image source={{ uri: item.images[0] }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <Icon name="image-outline" size={40} color="#9CA3AF" />
                      )}
                    </View>
                    <View className="absolute top-2 left-2 bg-green-500 px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] font-bold text-white">NEW</Text>
                    </View>
                  </View>
                  <View className="p-3">
                    <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-xs text-gray-500 mb-2" numberOfLines={1}>{item.category}</Text>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-bold text-gray-900">{'\u20A6'}{item.price.toLocaleString()}</Text>
                      {item.discountPercentage && (
                        <View className="bg-green-100 px-2 py-1 rounded">
                          <Text className="text-xs font-bold text-green-600">{item.discountPercentage}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Recommended Products */}
      <View className="bg-pink-50 px-4 py-4 mb-2">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">Recommended for You</Text>
          <TouchableOpacity onPress={() => { clearSearch(); setActiveCategory('all'); setSortBy('rating'); setActiveTab('product'); }}>
            <Text className="text-pink-500 font-medium">View All</Text>
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#CC3366" />
          </View>
        ) : error ? (
          <View className="items-center justify-center py-10">
            <Icon name="alert-circle-outline" size={48} color="#EF4444" />
            <TouchableOpacity className="bg-pink-500 px-6 py-3 rounded-lg mt-4" onPress={fetchProducts}>
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : products.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Icon name="cube-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4">No products available</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {products.slice(0, 6).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={(product) => navigation.navigate('ProductDetails', { productId: product.id })}
              />
            ))}
          </View>
        )}
      </View>

      {/* Flash Sales */}
      {flashSaleProducts.length > 0 && (
        <View className="bg-white px-4 py-4 mb-2">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Icon name="flame" size={20} color="#EF4444" />
              <Text className="text-xl font-bold text-gray-900 ml-1.5">Flash Sales</Text>
            </View>
            <View className="bg-red-50 px-2.5 py-1 rounded-full flex-row items-center">
              <Icon name="time-outline" size={12} color="#EF4444" />
              <Text className="text-xs font-semibold text-red-500 ml-1">Limited Time</Text>
            </View>
          </View>
          <FlatList
            data={flashSaleProducts.slice(0, 10)}
            renderItem={({ item }) => {
              const discountPercent = item.originalPrice && item.originalPrice > item.price
                ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                : 0;
              return (
                <TouchableOpacity
                  className="mr-4 w-40"
                  onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
                  activeOpacity={0.8}
                >
                  <View className="bg-gray-50 rounded-2xl overflow-hidden">
                    <View className="relative">
                      <View className="bg-gray-200 aspect-square items-center justify-center">
                        {item.images?.[0] ? (
                          <Image source={{ uri: item.images[0] }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                          <Icon name="image-outline" size={40} color="#9CA3AF" />
                        )}
                      </View>
                      {discountPercent > 0 && (
                        <View className="absolute top-2 left-2 bg-red-500 px-2 py-0.5 rounded-full">
                          <Text className="text-[10px] font-bold text-white">-{discountPercent}%</Text>
                        </View>
                      )}
                    </View>
                    <View className="p-3">
                      <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={1}>{item.name}</Text>
                      <Text className="text-xs text-gray-500 mb-2" numberOfLines={1}>{item.category}</Text>
                      <View className="flex-row items-center">
                        <Text className="text-base font-bold text-gray-900">{'\u20A6'}{item.price.toLocaleString()}</Text>
                      </View>
                      {item.originalPrice && item.originalPrice > item.price ? (
                        <Text className="text-xs text-gray-400 line-through mt-0.5">
                          {'\u20A6'}{item.originalPrice.toLocaleString()}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Digital Products Banner */}
      <View className="px-4 mb-2">
        <TouchableOpacity
          className="bg-purple-600 rounded-2xl p-6"
          activeOpacity={0.9}
          onPress={() => {
            clearSearch();
            setActiveCategory('digital-products');
            setActiveTab('product');
          }}
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-yellow-400 text-sm font-semibold mb-2">Instant Delivery</Text>
              <Text className="text-white text-2xl font-bold mb-2">Digital Products</Text>
              <Text className="text-purple-200 text-sm mb-4">E-books, courses, software keys & more.</Text>
              <View className="bg-yellow-400 self-start px-6 py-3 rounded-full flex-row items-center">
                <Text className="text-gray-900 font-semibold mr-2">Browse Digital</Text>
                <Icon name="arrow-forward" size={16} color="#111827" />
              </View>
            </View>
            <View className="w-24 h-24 bg-white/20 rounded-2xl ml-4 items-center justify-center">
              <Icon name="download-outline" size={40} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Digital Products */}
      {digitalProducts.length > 0 && (
        <View className="bg-white px-4 py-4 mb-2">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Icon name="download-outline" size={20} color="#7C3AED" />
              <Text className="text-xl font-bold text-gray-900 ml-1.5">Digital Products</Text>
            </View>
            <TouchableOpacity onPress={() => { clearSearch(); setActiveCategory('digital-products'); setActiveTab('product'); }}>
              <Text className="text-pink-500 font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={digitalProducts.slice(0, 10)}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="mr-4 w-40"
                onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
                activeOpacity={0.8}
              >
                <View className="bg-gray-50 rounded-2xl overflow-hidden">
                  <View className="relative">
                    <View className="bg-gray-200 aspect-square items-center justify-center">
                      {item.images?.[0] ? (
                        <Image source={{ uri: item.images[0] }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <Icon name="image-outline" size={40} color="#9CA3AF" />
                      )}
                    </View>
                    <View className="absolute top-2 left-2 bg-purple-500 px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] font-bold text-white">DIGITAL</Text>
                    </View>
                  </View>
                  <View className="p-3">
                    <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-xs text-gray-500 mb-2" numberOfLines={1}>{item.category}</Text>
                    <Text className="text-base font-bold text-gray-900">{'\u20A6'}{item.price.toLocaleString()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Trending Products */}
      <View className="bg-white px-4 py-4 mb-2">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">Trending Now</Text>
          <TouchableOpacity onPress={() => { clearSearch(); setActiveCategory('all'); setSortBy('popular'); setActiveTab('product'); }}>
            <Text className="text-pink-500 font-medium">View All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={trendingProducts.slice(0, 5)}
          renderItem={({ item }) => (
            <TouchableOpacity 
              className="mr-4 w-40" 
              onPress={() => navigation.navigate('ProductDetails', { productId: item.id })} 
              activeOpacity={0.8}
            >
              <View className="bg-gray-50 rounded-2xl overflow-hidden">
                <View className="relative">
                  <View className="bg-gray-200 aspect-square items-center justify-center">
                    {item.images?.[0] ? (
                      <Image source={{ uri: item.images[0] }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Icon name="image-outline" size={40} color="#9CA3AF" />
                    )}
                  </View>
                  <TouchableOpacity className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full items-center justify-center">
                    <Icon name="heart-outline" size={18} color="#CC3366" />
                  </TouchableOpacity>
                </View>
                <View className="p-3">
                  <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-xs text-gray-500 mb-2" numberOfLines={1}>{item.category}</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-gray-900">₦{item.price.toLocaleString()}</Text>
                    {item.discountPercentage && (
                      <View className="bg-green-100 px-2 py-1 rounded">
                        <Text className="text-xs font-bold text-green-600">{item.discountPercentage}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-8 w-full">
              <Icon name="trending-up-outline" size={40} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No trending products</Text>
            </View>
          }
        />
      </View>
    </>
  );

  // ==================== MAIN RENDER ====================
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header - Address & Icons */}
      <View className="bg-white px-5 py-4 flex-row items-center justify-between">
        <TouchableOpacity
          className="flex-row items-center flex-1"
          onPress={() => {
            if (isGuest) {
              setSignInMessage('Sign in to manage your delivery addresses.');
              setShowSignInModal(true);
              return;
            }
            navigation.navigate('SavedAddresses');
          }}
          activeOpacity={0.7}
        >
          <Icon name="location" size={18} color="#CC3366" />
          <Text className="text-sm font-medium text-gray-500 ml-1.5" numberOfLines={1}>Lagos, Nigeria</Text>
          <Icon name="chevron-down" size={14} color="#9CA3AF" />
        </TouchableOpacity>
        <View className="flex-row items-center" style={{ gap: 18 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
            <Icon name="grid-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity className="relative" onPress={() => {
            if (isGuest) {
              setSignInMessage('Sign in to view your notifications and stay updated.');
              setShowSignInModal(true);
              return;
            }
            navigation.navigate('Notifications');
          }}>
            <Icon name="notifications-outline" size={22} color="#111827" />
            {notificationCount > 0 && (
              <View className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full items-center justify-center">
                <Text className="text-[10px] text-white font-bold">{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity className="relative" onPress={() => navigation.navigate('Cart')}>
            <Icon name="cart-outline" size={22} color="#111827" />
            {cartCount > 0 && (
              <View className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full items-center justify-center">
                <Text className="text-[10px] text-white font-bold">{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#CC3366']}
            tintColor="#CC3366"
          />
        }
      >
        {/* Search Bar */}
        <View className="bg-pink-500 px-4 py-5 mt-1" style={{ zIndex: 10 }}>
          <Text className="text-white text-2xl font-bold mb-4 text-center">
            Looking for Something? It's Here.
          </Text>
          <View ref={searchBarRef} onLayout={() => {
            searchBarRef.current?.measureInWindow((x, y, width, height) => {
              setSearchBarPageY(y + height);
              setSearchBarLayout({ x, y, width, height });
            });
          }}>
            <View className="flex-row items-center bg-white rounded-lg">
              <Icon name="search" size={20} color="#9CA3AF" style={{ marginLeft: 16 }} />
              <TextInput
                className="flex-1 px-3 py-3 text-base text-gray-900"
                placeholder="Search products, categories or vendors"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={handleSearchQueryChange}
                onSubmitEditing={() => { setShowSuggestions(false); handleSearch(); }}
                onFocus={() => { if (searchSuggestions.length > 0) setShowSuggestions(true); }}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                    if (activeSearchQuery) clearSearch();
                  }}
                  className="px-2"
                >
                  <Icon name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity className="bg-yellow-400 px-6 py-3 rounded-r-lg" onPress={() => { setShowSuggestions(false); handleSearch(); }}>
                <Text className="text-gray-900 font-semibold">Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tab Navigation — horizontally scrollable */}
        <View className="py-3 bg-white">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {activeTab === 'search' ? (
              <>
                <View className="px-6 py-2.5 rounded-full flex-row items-center bg-pink-500">
                  <Icon name="search" size={18} color="#FFFFFF" />
                  <Text className="ml-2 font-medium text-white" numberOfLines={1}>
                    "{activeSearchQuery}"
                  </Text>
                </View>
                <TouchableOpacity
                  className="px-4 py-2.5 rounded-full flex-row items-center bg-gray-100"
                  onPress={clearSearch}
                >
                  <Icon name="close" size={18} color="#6B7280" />
                  <Text className="ml-1 font-medium text-gray-600">Clear</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  className={`px-6 py-2.5 rounded-full flex-row items-center ${
                    activeTab === 'popular' ? 'bg-white border border-gray-300' : 'bg-gray-100'
                  }`}
                  onPress={() => { clearSearch(); setActiveTab('popular'); }}
                >
                  <Icon name="flame" size={18} color={activeTab === 'popular' ? '#111827' : '#6B7280'} />
                  <Text className={`ml-2 font-medium ${activeTab === 'popular' ? 'text-gray-900' : 'text-gray-600'}`}>
                    Popular
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-6 py-2.5 rounded-full flex-row items-center ${
                    activeTab === 'product' ? 'bg-yellow-400' : 'bg-gray-100'
                  }`}
                  onPress={() => { clearSearch(); setActiveTab('product'); }}
                >
                  <MaterialIcon name="package-variant" size={18} color={activeTab === 'product' ? '#111827' : '#6B7280'} />
                  <Text className={`ml-2 font-medium ${activeTab === 'product' ? 'text-gray-900' : 'text-gray-600'}`}>
                    Product
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-6 py-2.5 rounded-full flex-row items-center ${
                    activeTab === 'vendor' ? 'bg-white border border-gray-300' : 'bg-gray-100'
                  }`}
                  onPress={() => { clearSearch(); setActiveTab('vendor'); }}
                >
                  <Icon name="person" size={18} color={activeTab === 'vendor' ? '#111827' : '#6B7280'} />
                  <Text className={`ml-2 font-medium ${activeTab === 'vendor' ? 'text-gray-900' : 'text-gray-600'}`}>
                    Vendor
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>

        {/* Tab Content */}
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'popular' && renderPopularTab()}
        {activeTab === 'product' && renderProductTab()}
        {activeTab === 'vendor' && renderVendorTab()}
      </ScrollView>

      <SignInModal
        visible={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSignIn={() => {
          setShowSignInModal(false);
          exitGuestMode();
        }}
        message={signInMessage}
      />

      <GuestEmailModal
        visible={showGuestEmailModal}
        onClose={() => setShowGuestEmailModal(false)}
        onSuccess={() => {
          setShowGuestEmailModal(false);
          // Refresh data now that user is authenticated
          fetchCartCount();
          fetchInitialData();
        }}
        onGoToSignIn={() => {
          setShowGuestEmailModal(false);
          exitGuestMode();
        }}
      />

      {/* Welcome Tour for customers */}
      {!isGuest && (
        <WelcomeTour
          role="customer"
          userName={undefined}
          onComplete={() => {}}
        />
      )}

      {/* Search Suggestions Overlay - rendered outside ScrollView for Android compatibility */}
      {showSuggestions && searchBarLayout && (
        <Modal transparent visible={showSuggestions} animationType="none" onRequestClose={() => setShowSuggestions(false)}>
          <TouchableOpacity
            activeOpacity={1}
            style={{ flex: 1 }}
            onPress={() => setShowSuggestions(false)}
          >
            <View style={{ position: 'absolute', top: searchBarPageY, left: 16, right: 16, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 }}>
              {searchSuggestions.map((suggestion, idx) => (
                <TouchableOpacity
                  key={idx}
                  className="flex-row items-center px-4 py-3 border-b border-gray-100"
                  onPress={() => {
                    setSearchQuery(suggestion);
                    setShowSuggestions(false);
                    setActiveSearchQuery(suggestion.toLowerCase());
                    setActiveTab('search');
                    const query = suggestion.toLowerCase();
                    setIsSearching(true);
                    Promise.all([
                      getProducts({ search: query, limit: 20 }).catch(() => null),
                      getTopVendors(50, 'rating').catch(() => null),
                    ]).then(([productRes, vendorRes]) => {
                      if (productRes?.success) setSearchProducts(productRes.data.products || []);
                      else setSearchProducts([]);
                      if (vendorRes?.success) {
                        setSearchVendors(vendorRes.data.vendors.filter(
                          (v: Vendor) => v.name.toLowerCase().includes(query) || v.description?.toLowerCase().includes(query)
                        ));
                      } else setSearchVendors([]);
                      setSearchCategories(allCategories.filter(
                        c => c.name.toLowerCase().includes(query) || c.slug.toLowerCase().includes(query)
                      ));
                      setIsSearching(false);
                    });
                  }}
                >
                  <Icon name="search-outline" size={16} color="#9CA3AF" />
                  <Text className="text-sm text-gray-700 ml-3 flex-1" numberOfLines={1}>{suggestion}</Text>
                  <Icon name="arrow-forward-outline" size={14} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;