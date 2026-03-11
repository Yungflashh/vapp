import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { ProductCard } from '@/components/Products/ProductCard';
import { getProductsByCategory, Product } from '@/services/product.service';
import type { RootStackParamList } from '@/navigation';

type CategoryProductsRouteProp = RouteProp<RootStackParamList, 'CategoryProducts'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 16;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GAP) / 2;

const CategoryProductsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CategoryProductsRouteProp>();
  const { categoryId, categoryName } = route.params;
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (pageNum === 1 && !refresh) setIsLoading(true);

      const response = await getProductsByCategory(categoryId, pageNum, 20);

      if (response.success && response.data?.products) {
        const newProducts = response.data.products;
        if (refresh || pageNum === 1) {
          setProducts(newProducts);
        } else {
          setProducts(prev => [...prev, ...newProducts]);
        }
        setHasMore(newProducts.length >= 20);
        setPage(pageNum);
      } else {
        if (pageNum === 1) setProducts([]);
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Error fetching category products:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load products. Please try again.',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchProducts(1, true);
  }, [fetchProducts]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading && !isRefreshing) {
      setIsLoadingMore(true);
      fetchProducts(page + 1);
    }
  }, [isLoadingMore, hasMore, isLoading, isRefreshing, page, fetchProducts]);

  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate('ProductDetails', { productId: product.id });
  }, [navigation]);

  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <View style={{ width: CARD_WIDTH, marginBottom: 12 }}>
      <ProductCard
        product={item}
        onPress={handleProductPress}
        style="grid"
      />
    </View>
  ), [handleProductPress]);

  const keyExtractor = useCallback((item: Product) => item.id, []);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#CC3366" />
      </View>
    );
  };

  const renderEmpty = () => {
    // FIX: Don't render empty state while loading — let ListHeaderComponent handle that
    if (isLoading) return null;
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
        <Icon name="bag-outline" size={48} color="#9CA3AF" />
        <Text style={{
          color: '#111827',
          fontWeight: '600',
          marginTop: 16,
          fontSize: 16,
        }}>
          No products found
        </Text>
        <Text style={{
          color: '#6B7280',
          marginTop: 8,
          textAlign: 'center',
          fontSize: 14,
        }}>
          There are no products in this category yet.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />

      {/* Header */}
      <View style={{
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
          },
          android: {
            elevation: 2,
          },
        }),
      }}>
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#F3F4F6',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Icon
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            size={20}
            color="#111827"
          />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: '#111827',
            }}
            numberOfLines={1}
          >
            {categoryName}
          </Text>
          {!isLoading && (
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 1 }}>
              {products.length} product{products.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => navigation.navigate('Cart')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Icon name="cart-outline" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* FIX: Show full-screen loader separately — keeps FlatList mounted and avoids layout thrash */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#CC3366" />
          <Text style={{ color: '#6B7280', marginTop: 16, fontSize: 14 }}>
            Loading products...
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{
            paddingTop: 16,
            paddingHorizontal: HORIZONTAL_PADDING,
            paddingBottom: 20 + insets.bottom,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={['#CC3366']}
              tintColor="#CC3366"
              progressViewOffset={Platform.OS === 'android' ? 0 : undefined}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          // FIX: Removed maintainVisibleContentPosition — caused scroll jumps when list was empty/small
        />
      )}
    </SafeAreaView>
  );
};

export default CategoryProductsScreen;