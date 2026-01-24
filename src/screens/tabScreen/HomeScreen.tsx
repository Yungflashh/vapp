// screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, FlatList, ActivityIndicator, RefreshControl, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import { BottomTabParamList } from '@/navigation/BottomTabNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { ProductCard } from '@/components/Products/ProductCard';
import { 
  getProducts,
  getRecommendedProducts, 
  getTrendingProducts, 
  getTopVendors,
  getCategories,
  followVendor,
  unfollowVendor,
  Product, 
  Vendor,
  ProductFilters,
} from '@/services/api';

type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

type CategoryFilter = 'all' | 'fashion' | 'electronics' | 'beauty' | 'home' | 'books' | 'sports' | 'digital-products';
type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'popular' | 'product' | 'vendor'>('popular');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [cartCount] = useState(3);
  const [notificationCount] = useState(2);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [topVendors, setTopVendors] = useState<Vendor[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

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

  useEffect(() => {
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
        fetchTopVendors()
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
      console.log('📂 Fetching categories for mapping...');
      const response = await getCategories();
      
      if (response.success && response.data.categories) {
        const map = new Map<string, string>();
        response.data.categories.forEach(cat => {
          map.set(cat.slug, cat._id);
        });
        setCategoriesMap(map);
        console.log('✅ Categories map built:', map.size, 'categories');
        console.log('📋 Category mappings:', Array.from(map.entries()));
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

  const fetchTopVendors = async () => {
    try {
      const response = await getTopVendors(10, 'rating');
      if (response.success && response.data.vendors) {
        setTopVendors(response.data.vendors);
      }
    } catch (err) {
      console.error('Error fetching top vendors:', err);
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
          console.log(`📦 Using category ID: ${categoryId} for slug: ${activeCategory}`);
        } else {
          console.warn(`⚠️ Category ID not found for slug: ${activeCategory}`);
          if (categoriesMap.size === 0) {
            console.log('🔄 Categories map is empty, fetching...');
            await fetchCategoriesMap();
            const retryId = categoriesMap.get(activeCategory);
            if (retryId) {
              filters.category = retryId;
              console.log(`📦 Retry - Using category ID: ${retryId} for slug: ${activeCategory}`);
            }
          }
        }
      }

      console.log('📦 Fetching products with filters:', filters);
      const response = await getProducts(filters);
      
      if (response.success && response.data.products) {
        setAllProducts(response.data.products);
        console.log(`✅ Loaded ${response.data.products.length} products for category: ${activeCategory}`);
      }
    } catch (err: any) {
      console.error('Error fetching all products:', err);
      setError('Failed to load products');
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load products.' });
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
        console.log(`✅ Loaded ${response.data.vendors.length} vendors`);
      }
    } catch (err: any) {
      console.error('Error fetching all vendors:', err);
      setError('Failed to load vendors');
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load vendors.' });
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    if (activeTab === 'popular') {
      await fetchInitialData();
    } else if (activeTab === 'product') {
      await fetchAllProducts();
    } else if (activeTab === 'vendor') {
      await fetchAllVendors();
    }
    setIsRefreshing(false);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Toast.show({ type: 'warning', text1: 'Empty Search', text2: 'Please enter a search term' });
      return;
    }
    Toast.show({ type: 'info', text1: 'Searching...', text2: `Looking for "${searchQuery}"` });
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
    try {
      if (vendor.isFollowing) {
        await unfollowVendor(vendor.id);
        setTopVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, isFollowing: false } : v));
        Toast.show({ type: 'success', text1: 'Unfollowed', text2: `You unfollowed ${vendor.name}` });
      } else {
        await followVendor(vendor.id);
        setTopVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, isFollowing: true } : v));
        Toast.show({ type: 'success', text1: 'Following', text2: `You are now following ${vendor.name}` });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update follow status' });
    }
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    setShowSortMenu(false);
    Toast.show({ 
      type: 'info', 
      text1: 'Sorting', 
      text2: sortOptions.find(o => o.id === sort)?.label 
    });
  };

  const renderTopVendorRow = ({ item }: { item: Vendor }) => (
    <TouchableOpacity 
      className="items-center mr-4 w-20" 
      onPress={() => navigation.navigate('VendorProfile', { vendorId: item.id })} 
      activeOpacity={0.7}
    >
      <View className="relative">
        <View className="w-16 h-16 rounded-full bg-gray-200 border-2 border-pink-500 overflow-hidden">
          {item.image ? (
            <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Icon name="person" size={32} color="#9CA3AF" />
            </View>
          )}
        </View>
        {item.verified && (
          <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full items-center justify-center border-2 border-white">
            <Icon name="checkmark" size={14} color="#FFFFFF" />
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
        <View className="relative h-28">
          {item.coverImage ? (
            <Image source={{ uri: item.coverImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View className="w-full h-full bg-pink-100 items-center justify-center">
              <Icon name="storefront-outline" size={32} color="#EC4899" />
            </View>
          )}
          <TouchableOpacity 
            className={`absolute top-3 right-3 px-4 py-1.5 rounded-full ${item.isFollowing ? 'bg-pink-500' : 'bg-gray-800/80'}`}
            onPress={(e) => {
              e.stopPropagation();
              handleFollowVendor(item);
            }}
          >
            <Text className="text-white text-xs font-semibold">{item.isFollowing ? 'Following' : 'Follow'}</Text>
          </TouchableOpacity>
          <View className="absolute bottom-3 left-3 flex-row items-center">
            <Icon name="location" size={12} color="#FFFFFF" />
            <Text className="text-white text-xs ml-1">{item.location || 'Lagos, Nigeria'}</Text>
          </View>
          <View className="absolute -bottom-6 left-3">
            <View className="w-14 h-14 rounded-full bg-white border-2 border-white overflow-hidden shadow-md">
              {item.image ? (
                <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View className="w-full h-full bg-gray-200 items-center justify-center">
                  <Icon name="person" size={24} color="#9CA3AF" />
                </View>
              )}
            </View>
          </View>
        </View>
        <View className="pt-8 px-3 pb-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-bold text-gray-900 flex-1" numberOfLines={1}>{item.name}</Text>
            {item.verified && (
              <View className="ml-1">
                <Icon name="checkmark-circle" size={16} color="#3B82F6" />
              </View>
            )}
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
              <Icon name="share-social-outline" size={14} color="#EC4899" />
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
                color={sortBy === option.id ? '#EC4899' : '#6B7280'} 
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
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading products...</Text>
        </View>
      )}

      {error && !isLoadingProducts && (
        <View className="items-center justify-center py-20">
          <Icon name="alert-circle-outline" size={48} color="#EF4444" />
          <Text className="text-gray-900 font-semibold mt-4">Failed to load products</Text>
          <Text className="text-gray-500 mt-2 text-center">{error}</Text>
          <TouchableOpacity 
            className="bg-pink-500 px-6 py-3 rounded-lg mt-4" 
            onPress={fetchAllProducts}
          >
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
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading vendors...</Text>
        </View>
      )}

      {error && !isLoadingVendors && (
        <View className="items-center justify-center py-20">
          <Icon name="storefront-outline" size={48} color="#EF4444" />
          <Text className="text-gray-900 font-semibold mt-4">Failed to load vendors</Text>
          <Text className="text-gray-500 mt-2 text-center">{error}</Text>
          <TouchableOpacity 
            className="bg-pink-500 px-6 py-3 rounded-lg mt-4" 
            onPress={fetchAllVendors}
          >
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

  const renderPopularTab = () => (
    <>
      {/* Top Vendors Section */}
      <View className="bg-white px-4 py-4 mb-2">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">Top Vendors</Text>
          <TouchableOpacity 
            className="flex-row items-center"
            onPress={() => setActiveTab('vendor')}
          >
            <Text className="text-pink-500 font-medium mr-1">See All</Text>
            <Icon name="chevron-forward" size={18} color="#EC4899" />
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

      {/* Recommended Products Section */}
      <View className="bg-white px-4 py-4 mb-2">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">Recommended for You</Text>
          <TouchableOpacity onPress={() => setActiveTab('product')}>
            <Text className="text-pink-500 font-medium">View All</Text>
          </TouchableOpacity>
        </View>
        {isLoading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#EC4899" />
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

      {/* Digital Products Banner */}
      <View className="px-4 mb-2">
        <TouchableOpacity 
          className="bg-purple-600 rounded-2xl p-6" 
          activeOpacity={0.9}
          onPress={() => {
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

      {/* Trending Products Section */}
      <View className="bg-white px-4 py-4 mb-2">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">Trending Now</Text>
          <TouchableOpacity onPress={() => setActiveTab('product')}>
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
                    <Icon name="heart-outline" size={18} color="#EC4899" />
                  </TouchableOpacity>
                </View>
                <View className="p-3">
                  <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-xs text-gray-500 mb-2" numberOfLines={1}>{item.category}</Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-pink-500">₦{item.price.toLocaleString()}</Text>
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold">
          <Text className="text-pink-500">V</Text>
          <Text className="text-yellow-400">endorspot</Text>
        </Text>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
            <Icon name="search-outline" size={24} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity className="relative">
            <Icon name="notifications-outline" size={24} color="#111827" />
            {notificationCount > 0 && (
              <View className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full items-center justify-center">
                <Text className="text-[10px] text-white font-bold">{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            className="relative"
            onPress={() => navigation.navigate('Cart')}
          >
            <Icon name="cart-outline" size={24} color="#111827" />
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
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            colors={['#EC4899']} 
            tintColor="#EC4899" 
          />
        }
      >
        {/* Search Bar */}
        <View className="bg-pink-500 px-4 py-8">
          <Text className="text-white text-2xl font-bold mb-4 text-center">
            Looking for Something? It's Here.
          </Text>
          <View className="flex-row items-center bg-white rounded-lg">
            <Icon name="search" size={20} color="#9CA3AF" style={{ marginLeft: 16 }} />
            <TextInput
              className="flex-1 px-3 py-3 text-base text-gray-900"
              placeholder="Search for products, brand, categories or vendors"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity className="bg-yellow-400 px-6 py-3 rounded-r-lg" onPress={handleSearch}>
              <Text className="text-gray-900 font-semibold">Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View className="px-4 py-4 bg-white">
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`px-6 py-2.5 rounded-full flex-row items-center ${
                activeTab === 'popular' ? 'bg-white border border-gray-300' : 'bg-gray-100'
              }`}
              onPress={() => setActiveTab('popular')}
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
              onPress={() => setActiveTab('product')}
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
              onPress={() => setActiveTab('vendor')}
            >
              <Icon name="person" size={18} color={activeTab === 'vendor' ? '#111827' : '#6B7280'} />
              <Text className={`ml-2 font-medium ${activeTab === 'vendor' ? 'text-gray-900' : 'text-gray-600'}`}>
                Vendor
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Content */}
        {activeTab === 'popular' && renderPopularTab()}
        {activeTab === 'product' && renderProductTab()}
        {activeTab === 'vendor' && renderVendorTab()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;