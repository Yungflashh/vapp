import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { getMyProducts, deleteProduct } from '@/services/product.service';
import { RootStackParamList } from '@/navigation';
import AppModal from '@/components/AppModal';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_FILTERS = ['all', 'active', 'inactive', 'draft'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const VendorProductsScreen = () => {
  const navigation = useNavigation<Nav>();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; productId: string; productName: string }>({ visible: false, productId: '', productName: '' });

  const fetchProducts = useCallback(async (reset = true) => {
    try {
      const currentPage = reset ? 1 : page;
      if (reset) setIsLoading(true);
      else setIsLoadingMore(true);

      const res = await getMyProducts(currentPage, 20, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined,
        sort: 'newest',
      });

      const fetched = res.data?.products || [];
      if (reset) {
        setProducts(fetched);
        setPage(2);
      } else {
        setProducts((prev) => [...prev, ...fetched]);
        setPage((p) => p + 1);
      }
      setHasMore(fetched.length === 20);
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load products' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [statusFilter, search, page]);

  useFocusEffect(
    useCallback(() => {
      fetchProducts(true);
    }, [statusFilter, search])
  );

  const handleDelete = (productId: string, productName: string) => {
    setDeleteModal({ visible: true, productId, productName });
  };

  const confirmDelete = async () => {
    const { productId } = deleteModal;
    setDeleteModal({ visible: false, productId: '', productName: '' });
    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId && p._id !== productId));
      Toast.show({ type: 'success', text1: 'Deleted', text2: 'Product removed successfully' });
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete product' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: 'bg-green-100', text: 'text-green-700' };
      case 'inactive': return { bg: 'bg-gray-100', text: 'text-gray-600' };
      case 'draft': return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  };

  const renderProduct = ({ item }: { item: any }) => {
    const statusColors = getStatusColor(item.status);
    const productId = item.id || item._id;

    return (
      <View className="bg-white mx-4 mb-3 rounded-2xl overflow-hidden shadow-sm">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('VendorProductDetail', { productId })}
          className="flex-row p-3"
        >
          <View className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 mr-3">
            {item.images?.[0] ? (
              <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Icon name="image-outline" size={28} color="#9CA3AF" />
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-900 mb-1" numberOfLines={2}>
              {item.name}
            </Text>
            <Text className="text-base font-bold text-pink-600 mb-1">
              ₦{(item.price || 0).toLocaleString()}
            </Text>
            <View className="flex-row items-center gap-2">
              <View className={`px-2 py-0.5 rounded-full ${statusColors.bg}`}>
                <Text className={`text-xs font-semibold ${statusColors.text}`}>
                  {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                </Text>
              </View>
              {item.stock !== undefined && (
                <Text className="text-xs text-gray-500">
                  Stock: {item.stock}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <View className="flex-row border-t border-gray-100">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center py-2.5"
            onPress={() => navigation.navigate('EditProduct', { productId })}
          >
            <Icon name="create-outline" size={16} color="#CC3366" />
            <Text className="text-pink-600 text-xs font-semibold ml-1">Edit</Text>
          </TouchableOpacity>
          <View className="w-px bg-gray-100" />
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center py-2.5"
            onPress={() => handleDelete(productId, item.name)}
          >
            <Icon name="trash-outline" size={16} color="#EF4444" />
            <Text className="text-red-500 text-xs font-semibold ml-1">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 items-center justify-center -ml-1 mr-2">
            <Icon name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">My Products</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddProduct')}
          style={{ backgroundColor: '#CC3366' }}
          className="flex-row items-center px-4 py-2 rounded-xl"
        >
          <Icon name="add" size={18} color="#FFFFFF" />
          <Text className="text-white text-sm font-bold ml-1">Add New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center bg-white rounded-xl px-3 py-2 border border-gray-200">
          <Icon name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-sm text-gray-800"
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status filters */}
      <View className="px-4 pb-3">
        <View className="flex-row gap-2">
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-full ${statusFilter === f ? 'bg-pink-500' : 'bg-white border border-gray-200'}`}
            >
              <Text className={`text-xs font-semibold ${statusFilter === f ? 'text-white' : 'text-gray-600'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC3366" />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id || item._id}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          onRefresh={() => { setIsRefreshing(true); fetchProducts(true); }}
          refreshing={isRefreshing}
          onEndReached={() => { if (hasMore && !isLoadingMore) fetchProducts(false); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator color="#CC3366" style={{ marginVertical: 16 }} /> : null}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Icon name="cube-outline" size={56} color="#D1D5DB" />
              <Text className="text-gray-500 font-semibold mt-4 mb-2">No products found</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AddProduct')}
                style={{ backgroundColor: '#CC3366' }}
                className="px-6 py-3 rounded-xl mt-2"
              >
                <Text className="text-white font-bold">Add Your First Product</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <AppModal
        visible={deleteModal.visible}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteModal.productName}"? This cannot be undone.`}
        icon="trash"
        iconColor="#EF4444"
        onClose={() => setDeleteModal({ visible: false, productId: '', productName: '' })}
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setDeleteModal({ visible: false, productId: '', productName: '' }) },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]}
      />
    </SafeAreaView>
  );
};

export default VendorProductsScreen;
