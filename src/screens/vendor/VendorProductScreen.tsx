import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '@/services/api';

interface VendorProduct {
  id: string;
  name: string;
  images: string[];
  price: number;
  stock: number;
  inStock: boolean;
  totalSales: number;
  createdAt: string;
  productType?: string;
  category?: string;
}

type StockFilter = 'all' | 'low' | 'out' | 'active';

const VendorProductsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<StockFilter>('all');
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchProducts(1, false);
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, activeFilter, products]);

  const fetchProducts = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await api.get('/products/my-products', {
        params: {
          page,
          limit: ITEMS_PER_PAGE,
        },
      });
      
      if (response.data.success) {
        const newProducts = response.data.data.products;
        const meta = response.data.meta || response.data.data;
        
        if (append && page > 1) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }
        
        setCurrentPage(page);
        setHasMore(response.data.data.hasMore || false);
        setTotalPages(meta.totalPages || 1);
        
        if (page === 1) {
          if (response.data.data.stats) {
            setStats({
              totalProducts: response.data.data.stats.total || 0,
              lowStock: response.data.data.stats.lowStock || 0,
              outOfStock: response.data.data.stats.outOfStock || 0,
            });
          } else {
            calculateStats(newProducts);
          }
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load products',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    await fetchProducts(1, false);
    setRefreshing(false);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchProducts(currentPage + 1, true);
    }
  };

  const handleEndReached = () => {
    loadMore();
  };

  const calculateStats = (productsList: VendorProduct[]) => {
    const totalProducts = productsList.length;
    const lowStock = productsList.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStock = productsList.filter(p => p.stock === 0).length;

    setStats({
      totalProducts,
      lowStock,
      outOfStock,
    });
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (activeFilter) {
      case 'low':
        filtered = filtered.filter(p => p.stock > 0 && p.stock <= 10);
        break;
      case 'out':
        filtered = filtered.filter(p => p.stock === 0 || !p.inStock);
        break;
      case 'active':
        filtered = filtered.filter(p => p.inStock && p.stock > 0);
        break;
      case 'all':
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return { label: 'Out of Stock', color: '#EF4444', bgColor: '#FEE2E2' };
    } else if (stock <= 10) {
      return { label: 'Low Stock', color: '#F59E0B', bgColor: '#FEF3C7' };
    } else {
      return { label: 'In Stock', color: '#10B981', bgColor: '#D1FAE5' };
    }
  };

  const handleViewProduct = (productId: string) => {
    navigation.navigate('VendorProductDetail' as any, { productId });
  };

  const handleUpdateStock = (productId: string, currentStock: number) => {
    Alert.prompt(
      'Update Stock',
      `Current stock: ${currentStock}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: async (newStock) => {
            if (newStock && !isNaN(Number(newStock))) {
              try {
                await api.put(`/products/${productId}`, {
                  quantity: Number(newStock),
                });

                Toast.show({
                  type: 'success',
                  text1: 'Stock Updated',
                  text2: `Stock updated to ${newStock}`,
                });

                fetchProducts(1, false);
              } catch (error: any) {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: error.response?.data?.message || 'Failed to update stock',
                });
              }
            }
          },
        },
      ],
      'plain-text',
      String(currentStock),
      'number-pad'
    );
  };

  const renderStatCard = (
    icon: string,
    label: string,
    value: number,
    color: string,
    isActive: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 rounded-2xl p-4 mr-3 ${isActive ? 'border-2' : ''}`}
      style={[
        { backgroundColor: '#FFFFFF' },
        isActive && { borderColor: color },
        {
          shadowColor: color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 5,
        },
      ]}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon name={icon} size={20} color={color} />
        </View>
        {isActive && (
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        )}
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </TouchableOpacity>
  );

  const renderProductCard = (product: VendorProduct) => {
    const stockStatus = getStockStatus(product.stock);

    return (
      <TouchableOpacity
        key={product.id}
        onPress={() => handleViewProduct(product.id)}
        className="bg-white rounded-2xl p-4 mb-3 flex-row"
        style={{
          shadowColor: '#EC4899',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* Product Image */}
        <View className="relative">
          <Image
            source={{ uri: product.images[0] || 'https://via.placeholder.com/80' }}
            className="w-20 h-20 rounded-xl"
            resizeMode="cover"
          />
          {product.stock === 0 && (
            <View className="absolute inset-0 bg-black/40 rounded-xl items-center justify-center">
              <Text className="text-white text-xs font-bold">OUT</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-base font-bold text-gray-900 mb-1" numberOfLines={2}>
                {product.name}
              </Text>
              <View className="flex-row items-center">
                <Icon name="pricetag-outline" size={12} color="#9CA3AF" />
                <Text className="text-xs text-gray-500 ml-1">
                  {product.id.slice(-8).toUpperCase()}
                </Text>
              </View>
            </View>

            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: stockStatus.bgColor }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: stockStatus.color }}
              >
                {product.stock}
              </Text>
            </View>
          </View>

          {/* Price and Sales */}
          <View className="flex-row items-center justify-between mt-2">
            <View>
              <Text className="text-xs text-gray-500">Price</Text>
              <Text className="text-lg font-bold text-gray-900">
                ₦{product.price.toLocaleString()}
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-xs text-gray-500">Sales</Text>
              <View className="flex-row items-center">
                <Icon name="trending-up" size={14} color="#10B981" />
                <Text className="text-sm font-semibold text-gray-900 ml-1">
                  {product.totalSales || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Stock Status Badge */}
          <View className="mt-2">
            <View
              className="px-2 py-1 rounded-lg self-start"
              style={{ backgroundColor: stockStatus.bgColor }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: stockStatus.color }}
              >
                {stockStatus.label}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFF0F5' }} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF0F5" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFF0F5' }} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF0F5" />
      
      {/* Header */}
      <View className="px-6 pt-4 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Icon name="arrow-back" size={20} color="#111827" />
            </TouchableOpacity>
            <View>
              <Text className="text-lg font-bold text-gray-900">My Products</Text>
              <Text className="text-sm text-gray-500">{stats.totalProducts} items</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddProduct' as any)}
            className="w-10 h-10 rounded-full bg-pink-500 items-center justify-center"
            style={{
              shadowColor: '#EC4899',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Icon name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3">
          <Icon name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-900"
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EC4899" colors={['#EC4899']} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 500;
          
          if (isCloseToBottom) {
            handleEndReached();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Stats Cards */}
        <View className="flex-row px-6 mb-4">
          {renderStatCard(
            'cube',
            'All Products',
            stats.totalProducts,
            '#EC4899',
            activeFilter === 'all',
            () => setActiveFilter('all')
          )}
          {renderStatCard(
            'alert-circle',
            'Low Stock',
            stats.lowStock,
            '#F59E0B',
            activeFilter === 'low',
            () => setActiveFilter('low')
          )}
          {renderStatCard(
            'close-circle',
            'Out of Stock',
            stats.outOfStock,
            '#EF4444',
            activeFilter === 'out',
            () => setActiveFilter('out')
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, marginBottom: 16 }}
        >
          <TouchableOpacity
            onPress={() => setActiveFilter('all')}
            className={`px-5 py-2.5 rounded-xl mr-3 ${
              activeFilter === 'all' ? 'bg-pink-500' : 'bg-white'
            }`}
            style={activeFilter !== 'all' && {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text
              className={`text-sm font-bold ${
                activeFilter === 'all' ? 'text-white' : 'text-gray-700'
              }`}
            >
              All Products
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveFilter('active')}
            className={`px-5 py-2.5 rounded-xl mr-3 ${
              activeFilter === 'active' ? 'bg-pink-500' : 'bg-white'
            }`}
            style={activeFilter !== 'active' && {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text
              className={`text-sm font-bold ${
                activeFilter === 'active' ? 'text-white' : 'text-gray-700'
              }`}
            >
              In Stock
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveFilter('low')}
            className={`px-5 py-2.5 rounded-xl mr-3 ${
              activeFilter === 'low' ? 'bg-pink-500' : 'bg-white'
            }`}
            style={activeFilter !== 'low' && {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text
              className={`text-sm font-bold ${
                activeFilter === 'low' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Low Stock
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveFilter('out')}
            className={`px-5 py-2.5 rounded-xl ${
              activeFilter === 'out' ? 'bg-pink-500' : 'bg-white'
            }`}
            style={activeFilter !== 'out' && {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text
              className={`text-sm font-bold ${
                activeFilter === 'out' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Out of Stock
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Products List */}
        <View className="px-6 pb-24">
          {filteredProducts.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <View className="w-20 h-20 rounded-full bg-pink-50 items-center justify-center mb-4">
                <Icon name="cube-outline" size={40} color="#EC4899" />
              </View>
              <Text className="text-lg font-bold text-gray-900 mb-2">
                No Products Found
              </Text>
              <Text className="text-gray-500 text-center mb-6">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Add products to start selling'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('AddProduct' as any)}
                  className="bg-pink-500 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-bold">Add Your First Product</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {filteredProducts.map(renderProductCard)}
              
              {loadingMore && (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#EC4899" />
                  <Text className="text-gray-500 text-sm mt-2">Loading more...</Text>
                </View>
              )}
              
              {!hasMore && filteredProducts.length > 0 && (
                <View className="py-6 items-center">
                  <View className="w-12 h-12 rounded-full bg-pink-50 items-center justify-center mb-2">
                    <Icon name="checkmark-circle" size={24} color="#EC4899" />
                  </View>
                  <Text className="text-gray-400 text-sm">
                    All products loaded
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
};

export default VendorProductsScreen;