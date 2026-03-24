import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { getCategories, getCategoryTree, Category } from '@/services/category.service';

type ViewMode = 'grid' | 'list';

// Category color schemes based on category name
const categoryColors: { [key: string]: { bg: string; iconBg: string } } = {
  'electronics': { bg: '#FDE8EC', iconBg: '#CC3366' },
  'fashion': { bg: '#FEF9E7', iconBg: '#F59E0B' },
  'beauty': { bg: '#E8F5E9', iconBg: '#22C55E' },
  'home & living': { bg: '#E0F2F1', iconBg: '#14B8A6' },
  'home-living': { bg: '#E0F2F1', iconBg: '#14B8A6' },
  'books': { bg: '#F3E5F5', iconBg: '#A855F7' },
  'sports': { bg: '#E3F2FD', iconBg: '#3B82F6' },
  'digital products': { bg: '#FFF3E0', iconBg: '#F97316' },
  'digital-products': { bg: '#FFF3E0', iconBg: '#F97316' },
  'food': { bg: '#FFF8E1', iconBg: '#FF9800' },
  'health': { bg: '#E8F5E9', iconBg: '#4CAF50' },
  'toys': { bg: '#FCE4EC', iconBg: '#E91E63' },
  'automotive': { bg: '#ECEFF1', iconBg: '#607D8B' },
};

// Map emoji icons from seed data to Ionicons names
const emojiToIonicon: { [key: string]: string } = {
  '📱': 'phone-portrait-outline',
  '👔': 'shirt-outline',
  '💄': 'sparkles-outline',
  '🏠': 'home-outline',
  '⚽': 'football-outline',
  '📚': 'book-outline',
  '🍔': 'fast-food-outline',
  '💊': 'medical-outline',
  '🎮': 'game-controller-outline',
  '🚗': 'car-outline',
  '💻': 'laptop-outline',
  '👟': 'footsteps-outline',
  '💍': 'diamond-outline',
  '🎵': 'musical-notes-outline',
  '🎬': 'film-outline',
  '✈️': 'airplane-outline',
  '🐕': 'paw-outline',
  '👶': 'happy-outline',
  '🔧': 'build-outline',
  '🎁': 'gift-outline',
  '💾': 'save-outline',
  '📷': 'camera-outline',
  '🎧': 'headset-outline',
  '⌚': 'watch-outline',
  '🖥️': 'desktop-outline',
  '🛋️': 'bed-outline',
  '🧴': 'flask-outline',
  '👗': 'shirt-outline',
  '👠': 'footsteps-outline',
  '💼': 'briefcase-outline',
};

// Fallback category icons by name
const categoryIconsByName: { [key: string]: string } = {
  'electronics': 'phone-portrait-outline',
  'fashion': 'shirt-outline',
  'beauty': 'sparkles-outline',
  'home & living': 'home-outline',
  'home-living': 'home-outline',
  'books': 'book-outline',
  'sports': 'football-outline',
  'digital products': 'save-outline',
  'digital-products': 'save-outline',
  'food': 'fast-food-outline',
  'health': 'medical-outline',
  'toys': 'game-controller-outline',
  'automotive': 'car-outline',
};

const CategoriesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);
const fetchCategories = async () => {
  try {
    setError(null);
    // console.log('📂 Fetching categories from:', API_URL);
    
    try {
      console.log('🌳 Trying category tree endpoint...');
      const response = await getCategoryTree();
      console.log('📥 Tree response received:', response);
      console.log('📊 Response success:', response.success);
      console.log('📊 Response data:', response.data);
      
      if (response.success && response.data?.categories) {
        console.log('✅ Categories array:', response.data.categories);
        console.log('✅ Categories length:', response.data.categories.length);
        
        if (response.data.categories.length === 0) {
          console.log('⚠️ Categories array is empty!');
        }
        
        setCategories(response.data.categories);
        console.log('✅ Categories set in state');
        return;
      } else {
        console.log('❌ Invalid response structure:', JSON.stringify(response, null, 2));
      }
    } catch (treeError: any) {
      console.error('❌ Tree endpoint error:', treeError);
      console.error('❌ Error response:', treeError.response?.data);
      console.error('❌ Error status:', treeError.response?.status);
    }
    
    // Fallback to flat categories
    console.log('📋 Trying flat categories endpoint...');
    const flatResponse = await getCategories();
    console.log('📥 Flat response:', flatResponse);
    
    if (flatResponse.success && flatResponse.data?.categories) {
      setCategories(flatResponse.data.categories);
      console.log('✅ Flat categories loaded:', flatResponse.data.categories.length);
    } else {
      console.log('❌ Flat response invalid:', flatResponse);
      setError('No categories found');
    }
  } catch (err: any) {
    console.error('❌ Error fetching categories:', err);
    console.error('❌ Error message:', err.message);
    console.error('❌ Error stack:', err.stack);
    setError('Failed to load categories');
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: err.message || 'Failed to load categories. Please try again.',
    });
  } finally {
    setIsLoading(false);
    setIsRefreshing(false);
  }
};

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchCategories();
  };

  const getCategoryColor = (categoryName: string, slug?: string) => {
    const nameKey = categoryName.toLowerCase();
    const slugKey = slug?.toLowerCase() || '';
    return categoryColors[nameKey] || categoryColors[slugKey] || { bg: '#F3F4F6', iconBg: '#6B7280' };
  };

  const getCategoryIcon = (categoryName: string, icon?: string, slug?: string): string => {
    // First check if icon is an emoji and map it
    if (icon && emojiToIonicon[icon]) {
      return emojiToIonicon[icon];
    }
    
    // Check if icon is already a valid Ionicon name (no emoji characters)
    if (icon && !/[\u{1F300}-\u{1F9FF}]/u.test(icon)) {
      return icon;
    }
    
    // Fallback to category name or slug mapping
    const nameKey = categoryName.toLowerCase();
    const slugKey = slug?.toLowerCase() || '';
    return categoryIconsByName[nameKey] || categoryIconsByName[slugKey] || 'grid-outline';
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('CategoryProducts', {
      categoryId: category._id,
      categoryName: category.name,
    });
  };

  const renderGridItem = (category: Category) => {
    const colors = getCategoryColor(category.name, category.slug);
    const iconName = getCategoryIcon(category.name, category.icon, category.slug);

    return (
      <TouchableOpacity
        key={category._id}
        className="w-[48%] mb-4"
        onPress={() => handleCategoryPress(category)}
        activeOpacity={0.8}
      >
        <View className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          {/* Colored Background with Icon */}
          <View 
            className="aspect-square items-center justify-center"
            style={{ backgroundColor: colors.bg }}
          >
            {category.image ? (
              <Image 
                source={{ uri: category.image }} 
                style={{ width: 64, height: 64 }}
                resizeMode="contain"
              />
            ) : (
              <View 
                className="w-16 h-16 rounded-2xl items-center justify-center"
                style={{ backgroundColor: colors.iconBg }}
              >
                <Icon name={iconName} size={32} color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* Category Info */}
          <View className="p-3">
            <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
              {category.name}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              {(category.productCount || 0).toLocaleString()} products
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListItem = (category: Category) => {
    const colors = getCategoryColor(category.name, category.slug);
    const iconName = getCategoryIcon(category.name, category.icon, category.slug);

    return (
      <TouchableOpacity
        key={category._id}
        className="mb-3"
        onPress={() => handleCategoryPress(category)}
        activeOpacity={0.8}
      >
        <View className="bg-white rounded-2xl overflow-hidden border border-gray-100 flex-row items-center p-4">
          {/* Icon Container */}
          <View 
            className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
            style={{ backgroundColor: colors.bg }}
          >
            {category.image ? (
              <Image 
                source={{ uri: category.image }} 
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            ) : (
              <View 
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.iconBg }}
              >
                <Icon name={iconName} size={24} color="#FFFFFF" />
              </View>
            )}
          </View>

          {/* Category Info */}
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              {category.name}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              {(category.productCount || 0).toLocaleString()} products
            </Text>
          </View>

          {/* Arrow */}
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        {/* Back Button */}
        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-lg font-bold text-gray-900">Categories</Text>

        {/* Right Icons */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            onPress={() => setShowSearch(!showSearch)}
          >
            <Icon name={showSearch ? 'close' : 'search-outline'} size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Icon name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'} size={22} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View className="bg-white px-4 py-2 border-b border-gray-100">
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2">
            <Icon name="search" size={18} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-sm text-gray-900"
              placeholder="Search categories..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#CC3366']}
            tintColor="#CC3366"
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      >
        {/* Section Header with View Toggle */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-900">Browse by Category</Text>
          
          {/* View Mode Toggle */}
          <View className="flex-row bg-gray-100 rounded-full p-1">
            <TouchableOpacity
              className={`px-4 py-2 rounded-full flex-row items-center ${
                viewMode === 'grid' ? 'bg-gray-900' : ''
              }`}
              onPress={() => setViewMode('grid')}
            >
              <Icon 
                name="grid" 
                size={16} 
                color={viewMode === 'grid' ? '#FFFFFF' : '#6B7280'} 
              />
              <Text className={`ml-1.5 text-sm font-medium ${
                viewMode === 'grid' ? 'text-white' : 'text-gray-600'
              }`}>
                Grid
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`px-4 py-2 rounded-full flex-row items-center ${
                viewMode === 'list' ? 'bg-gray-900' : ''
              }`}
              onPress={() => setViewMode('list')}
            >
              <Icon 
                name="list" 
                size={16} 
                color={viewMode === 'list' ? '#FFFFFF' : '#6B7280'} 
              />
              <Text className={`ml-1.5 text-sm font-medium ${
                viewMode === 'list' ? 'text-white' : 'text-gray-600'
              }`}>
                List
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#CC3366" />
            <Text className="text-gray-500 mt-4">Loading categories...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View className="items-center justify-center py-20">
            <Icon name="alert-circle-outline" size={48} color="#EF4444" />
            <Text className="text-gray-900 font-semibold mt-4">Failed to load categories</Text>
            <Text className="text-gray-500 mt-2 text-center">{error}</Text>
            <TouchableOpacity 
              className="bg-pink-500 px-6 py-3 rounded-lg mt-4"
              onPress={fetchCategories}
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !error && categories.length === 0 && (
          <View className="items-center justify-center py-20">
            <Icon name="folder-open-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4">No categories available</Text>
          </View>
        )}

        {/* Categories Grid View */}
        {!isLoading && !error && categories.length > 0 && viewMode === 'grid' && (
          <View className="flex-row flex-wrap justify-between">
            {categories
              .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((category) => renderGridItem(category))}
          </View>
        )}

        {/* Categories List View */}
        {!isLoading && !error && categories.length > 0 && viewMode === 'list' && (
          <View>
            {categories
              .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((category) => renderListItem(category))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategoriesScreen;