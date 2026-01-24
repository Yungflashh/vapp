import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { getProductById, Product as ApiProduct } from '@/services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProductDetailsScreen = ({ route, navigation }: Props) => {
  const { productId } = route.params;

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'qa' | 'shipping'>('description');
  const [isFavorite, setIsFavorite] = useState(false);

  // Available sizes and colors
  const sizes = ['40', '41', '42', '43', '44'];
  const colors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Blue', hex: '#0066FF' },
    { name: 'Red', hex: '#FF0000' },
  ];

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Fetching product details for ID:', productId);
      
      const response = await getProductById(productId);
      
      console.log('📦 API Response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        console.log('✅ Product data received:', {
          id: response.data.id,
          name: response.data.name,
          price: response.data.price,
          originalPrice: response.data.originalPrice,
          stock: response.data.stock,
          rating: response.data.rating,
          reviews: response.data.reviews,
          productType: response.data.productType,
          imagesCount: response.data.images?.length,
          vendorInfo: response.data.vendor,
          keyFeaturesCount: response.data.keyFeatures?.length || 0,
          specificationsCount: response.data.specifications ? Object.keys(response.data.specifications).length : 0,
        });
        
        console.log('📋 Key Features:', response.data.keyFeatures);
        console.log('📊 Specifications:', response.data.specifications);
        
        setProduct(response.data);
        
        console.log('✅ Product state updated successfully');
      } else {
        console.warn('⚠️ Response success is false or no data:', response);
        setError('Invalid response from server');
      }
    } catch (err: any) {
      console.error('❌ Error fetching product:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError('Failed to load product details');
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load product details',
      });
    } finally {
      setIsLoading(false);
      console.log('🏁 Fetch complete');
    }
  };

  const handleAddToCart = () => {
    console.log('🛒 Add to Cart clicked:', {
      productId: product?.id,
      productName: product?.name,
      productType: product?.productType,
      selectedSize,
      selectedColor,
      quantity,
    });

    // Only require size for physical products
    if (product?.productType === 'physical' && !selectedSize) {
      console.warn('⚠️ Size not selected for physical product');
      Toast.show({
        type: 'warning',
        text1: 'Size Required',
        text2: 'Please select a size',
      });
      return;
    }

    console.log('✅ Adding to cart with:', { selectedSize, selectedColor, quantity });

    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${quantity}x ${product?.name}`,
    });
  };

  const handleBuyNow = () => {
    console.log('💳 Buy Now clicked:', {
      productId: product?.id,
      productName: product?.name,
      productType: product?.productType,
      selectedSize,
      selectedColor,
      quantity,
      totalPrice: product ? product.price * quantity : 0,
    });

    // Only require size for physical products
    if (product?.productType === 'physical' && !selectedSize) {
      console.warn('⚠️ Size not selected for physical product');
      Toast.show({
        type: 'warning',
        text1: 'Size Required',
        text2: 'Please select a size',
      });
      return;
    }

    console.log('✅ Proceeding to checkout');

    Toast.show({
      type: 'success',
      text1: 'Proceeding to Checkout',
      text2: 'Redirecting...',
    });
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      console.log('➕ Incrementing quantity:', quantity, '→', quantity + 1);
      setQuantity(quantity + 1);
    } else {
      console.warn('⚠️ Cannot increment - at stock limit:', product?.stock);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      console.log('➖ Decrementing quantity:', quantity, '→', quantity - 1);
      setQuantity(quantity - 1);
    } else {
      console.warn('⚠️ Cannot decrement - at minimum quantity: 1');
    }
  };

  const toggleFavorite = () => {
    console.log('❤️ Toggling favorite:', !isFavorite);
    setIsFavorite(!isFavorite);
    Toast.show({
      type: 'success',
      text1: isFavorite ? 'Removed from Wishlist' : 'Added to Wishlist',
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading product...</Text>
        </View>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Icon name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-gray-900 font-bold text-xl mt-4">Product Not Found</Text>
          <Text className="text-gray-500 text-center mt-2">{error}</Text>
          <TouchableOpacity
            className="bg-pink-500 px-8 py-3 rounded-lg mt-6"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  console.log('🎨 Rendering product details:', {
    productId: product.id,
    name: product.name,
    price: product.price,
    discountPercentage,
    hasOriginalPrice: !!product.originalPrice,
    imagesCount: product.images?.length,
    currentImageIndex,
    selectedSize,
    selectedColor,
    quantity,
    stock: product.stock,
  });

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 absolute top-0 left-0 right-0 z-10" style={{ paddingTop: 50 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 bg-black/30 rounded-full items-center justify-center"
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
{/* 
        <Text className="text-white text-lg font-semibold flex-1 text-center mx-4" numberOfLines={1}>
          Vendorspot
        </Text> */}

        <View className="flex-row gap-2">
          <TouchableOpacity className="w-10 h-10 bg-black/30 rounded-full items-center justify-center">
            <Icon name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={toggleFavorite}
            className="w-10 h-10 bg-black/30 rounded-full items-center justify-center"
          >
            <Icon
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#EC4899' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={{ height: 400 }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              console.log('📸 Image carousel scrolled to index:', index);
              setCurrentImageIndex(index);
            }}
          >
            {product.images.map((image, index) => {
              console.log(`🖼️ Rendering image ${index + 1}/${product.images.length}:`, image);
              return (
                <View key={index} style={{ width: SCREEN_WIDTH, height: 400 }}>
                  <Image
                    source={{ uri: image }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                    onLoadStart={() => console.log(`⏳ Image ${index + 1} loading...`)}
                    onLoad={() => console.log(`✅ Image ${index + 1} loaded successfully`)}
                    onError={(error) => console.error(`❌ Image ${index + 1} failed:`, error.nativeEvent.error)}
                  />
                </View>
              );
            })}
          </ScrollView>

          {/* Image Indicators */}
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
            {product.images.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full ${
                  index === currentImageIndex ? 'w-6 bg-pink-500' : 'w-2 bg-white/70'
                }`}
              />
            ))}
          </View>
        </View>

        {/* Vendor Info */}
        <View className="bg-white px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center overflow-hidden">
              {product.vendor.image ? (
                <Image
                  source={{ uri: product.vendor.image }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <Icon name="person" size={24} color="#9CA3AF" />
              )}
            </View>
            
            <View className="flex-1 ml-3">
              <Text className="text-gray-900 font-semibold text-base">
                {product.vendor.name}
              </Text>
            </View>

            <View className="bg-pink-50 px-3 py-1.5 rounded-full flex-row items-center">
              <Icon name="checkmark-circle" size={16} color="#EC4899" />
              <Text className="text-pink-500 text-xs font-semibold ml-1">
                Verified Vendor
              </Text>
            </View>
          </View>
        </View>

        {/* Product Title & Price */}
        <View className="px-4 py-4">
          <Text className="text-gray-900 text-2xl font-bold mb-3">
            {product.name}
          </Text>

          <View className="flex-row items-center mb-4">
            <Text className="text-gray-900 text-3xl font-bold">
              ₦{product.price.toLocaleString()}
            </Text>
            {product.originalPrice && (
              <View className="ml-3 flex-row items-center">
                <Text className="text-gray-400 text-lg line-through">
                  ₦{product.originalPrice.toLocaleString()}
                </Text>
                <View className="bg-yellow-400 px-2 py-1 rounded ml-2">
                  <Text className="text-gray-900 text-xs font-bold">
                    -{discountPercentage}%
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Rating */}
          <View className="flex-row items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                name={star <= Math.floor(product.rating) ? 'star' : 'star-outline'}
                size={20}
                color="#FBBF24"
              />
            ))}
            <Text className="text-gray-900 font-semibold ml-2">
              {product.rating.toFixed(1)}
            </Text>
            <Text className="text-gray-500 ml-1">({product.reviews} reviews)</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-4 mb-4 flex-row gap-3">
          <TouchableOpacity className="flex-1 bg-white border-2 border-pink-500 py-3.5 rounded-xl flex-row items-center justify-center">
            <Icon name="chatbubble-outline" size={20} color="#EC4899" />
            <Text className="text-pink-500 font-semibold ml-2">Ask a Question</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-1 bg-white border-2 border-gray-900 py-3.5 rounded-xl flex-row items-center justify-center">
            <MaterialIcon name="store" size={20} color="#111827" />
            <Text className="text-gray-900 font-semibold ml-2">View Store</Text>
          </TouchableOpacity>
        </View>

        {/* Generate Referral Link */}
        <View className="px-4 mb-4">
          <TouchableOpacity className="bg-white border-2 border-pink-500 py-3.5 rounded-xl flex-row items-center justify-center">
            <MaterialIcon name="link-variant" size={20} color="#EC4899" />
            <Text className="text-pink-500 font-semibold ml-2">Generate Referral Link</Text>
          </TouchableOpacity>
        </View>

        {/* Select Size */}
        {product.productType === 'physical' && (
          <View className="px-4 mb-4">
            <Text className="text-gray-900 font-bold text-base mb-3">Select Size</Text>
            <View className="flex-row gap-3">
              {sizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => {
                    console.log('👟 Size selected:', size);
                    setSelectedSize(size);
                  }}
                  className={`px-6 py-3 rounded-xl border-2 ${
                    selectedSize === size
                      ? 'bg-pink-500 border-pink-500'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      selectedSize === size ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Color Selection */}
        {product.productType === 'physical' && (
          <View className="px-4 mb-4">
            <Text className="text-gray-900 font-bold text-base mb-3">Select Color</Text>
            <View className="flex-row gap-3">
              {colors.map((color) => (
                <TouchableOpacity
                  key={color.name}
                  onPress={() => {
                    console.log('🎨 Color selected:', color.name, color.hex);
                    setSelectedColor(color.name);
                  }}
                  className={`w-12 h-12 rounded-full border-2 ${
                    selectedColor === color.name ? 'border-pink-500' : 'border-gray-200'
                  }`}
                  style={{
                    backgroundColor: color.hex,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Quantity */}
        <View className="px-4 mb-4">
          <Text className="text-gray-900 font-bold text-base mb-3">Quantity</Text>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={decrementQuantity}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              disabled={quantity <= 1}
            >
              <Icon name="remove" size={20} color={quantity <= 1 ? '#D1D5DB' : '#111827'} />
            </TouchableOpacity>

            <Text className="text-gray-900 text-xl font-bold mx-6">{quantity}</Text>

            <TouchableOpacity
              onPress={incrementQuantity}
              className="w-10 h-10 bg-pink-500 rounded-full items-center justify-center"
              disabled={quantity >= product.stock}
            >
              <Icon name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Text className="text-gray-500 ml-4">Available: {product.stock} items</Text>
          </View>
        </View>

        {/* Features */}
        <View className="px-4 mb-4">
          <View className="flex-row justify-between">
            <View className="flex-1 items-center py-4">
              <View className="w-12 h-12 bg-green-50 rounded-full items-center justify-center mb-2">
                <Icon name="shield-checkmark" size={24} color="#10B981" />
              </View>
              <Text className="text-gray-900 font-semibold text-xs">Secure Payment</Text>
            </View>

            <View className="flex-1 items-center py-4">
              <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mb-2">
                <MaterialIcon name="sync" size={24} color="#3B82F6" />
              </View>
              <Text className="text-gray-900 font-semibold text-xs">Easy Returns</Text>
            </View>

            <View className="flex-1 items-center py-4">
              <View className="w-12 h-12 bg-purple-50 rounded-full items-center justify-center mb-2">
                <MaterialIcon name="truck-fast" size={24} color="#8B5CF6" />
              </View>
              <Text className="text-gray-900 font-semibold text-xs">Fast Shipping</Text>
            </View>
          </View>
        </View>

        {/* Add to Cart & Buy Now Buttons */}
        <View className="px-4 mb-4 flex-row gap-3">
          <TouchableOpacity
            onPress={handleAddToCart}
            className="flex-1 bg-white border-2 border-pink-500 py-4 rounded-xl flex-row items-center justify-center"
          >
            <Icon name="cart-outline" size={20} color="#EC4899" />
            <Text className="text-pink-500 font-bold ml-2">Add to Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBuyNow}
            className="flex-1 bg-pink-500 py-4 rounded-xl flex-row items-center justify-center"
          >
            <MaterialIcon name="shopping" size={20} color="#FFFFFF" />
            <Text className="text-white font-bold ml-2">Buy Now</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="border-b border-gray-200 mb-4">
          <View className="flex-row px-4">
            {[
              { key: 'description', label: 'Description' },
              { key: 'reviews', label: 'Reviews' },
              { key: 'qa', label: 'Q&A' },
              { key: 'shipping', label: 'Shipping' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                className={`mr-6 pb-3 ${
                  activeTab === tab.key ? 'border-b-2 border-pink-500' : ''
                }`}
              >
                <Text
                  className={`font-semibold ${
                    activeTab === tab.key ? 'text-pink-500' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        <View className="px-4 mb-6">
          {activeTab === 'description' && (
            <View>
              <Text className="text-gray-700 leading-6 mb-6">{product.description}</Text>

              {/* Key Features */}
              {product.keyFeatures && product.keyFeatures.length > 0 && (
                <>
                  <Text className="text-gray-900 font-bold text-lg mb-3">Key Features:</Text>
                  <View className="mb-6">
                    {product.keyFeatures.map((feature, index) => (
                      <View key={index} className="flex-row items-start mb-2">
                        <Icon name="checkmark-circle" size={20} color="#10B981" />
                        <Text className="text-gray-700 ml-2 flex-1">{feature}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <View className="bg-gray-50 rounded-xl p-4">
                  <Text className="text-gray-900 font-bold text-lg mb-3">
                    Product Specifications
                  </Text>
                  
                  {Object.entries(product.specifications).map(([label, value], index) => (
                    <View
                      key={index}
                      className="flex-row justify-between py-3 border-b border-gray-200"
                    >
                      <Text className="text-gray-500">{label}</Text>
                      <Text className="text-gray-900 font-semibold flex-1 text-right ml-4">{value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View>
              <Text className="text-gray-500 text-center py-8">
                Reviews section coming soon
              </Text>
            </View>
          )}

          {activeTab === 'qa' && (
            <View>
              <Text className="text-gray-500 text-center py-8">Q&A section coming soon</Text>
            </View>
          )}

          {activeTab === 'shipping' && (
            <View>
              <Text className="text-gray-500 text-center py-8">
                Shipping information coming soon
              </Text>
            </View>
          )}
        </View>

        {/* Similar Products */}
        <View className="px-4 pb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-900 font-bold text-xl">Similar Products</Text>
            <TouchableOpacity>
              <Text className="text-pink-500 font-semibold">View All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3].map((item) => (
              <View key={item} className="w-40 mr-4 bg-white rounded-xl overflow-hidden border border-gray-200">
                <View className="relative">
                  <View className="w-full h-40 bg-gray-100" />
                  <TouchableOpacity className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full items-center justify-center">
                    <Icon name="heart-outline" size={18} color="#EC4899" />
                  </TouchableOpacity>
                </View>
                <View className="p-3">
                  <Text className="text-gray-900 font-semibold text-sm" numberOfLines={2}>
                    Product Name
                  </Text>
                  <Text className="text-pink-500 font-bold mt-1">₦45,000</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProductDetailsScreen;