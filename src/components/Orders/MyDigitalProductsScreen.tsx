// screens/MyDigitalProductsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { getDigitalProducts, getDigitalProductDownload } from '@/services/api';

type MyDigitalProductsScreenProps = NativeStackScreenProps<RootStackParamList, 'MyDigitalProducts'>;

interface DigitalProduct {
  orderId: string;
  orderNumber: string;
  itemId: string;
  product: {
    _id: string;
    name: string;
    slug: string;
    image: string;
    productType: string;
  };
  purchaseDate: string;
  downloadUrl?: string;
  fileSize?: number;
  fileType?: string;
  version?: string;
}

const MyDigitalProductsScreen = ({ navigation }: MyDigitalProductsScreenProps) => {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔵 MyDigitalProductsScreen MOUNTED');
    fetchDigitalProducts();
  }, []);

  const fetchDigitalProducts = async () => {
    try {
      console.log('🔄 Fetching digital products...');
      setIsLoading(true);
      
      const response = await getDigitalProducts();
      console.log('📥 Digital products response:', response);
      
      if (response.success) {
        const digitalProducts = response.data.digitalProducts || [];
        console.log(`✅ Found ${digitalProducts.length} digital products`);
        
        // ✅ LOG COMPLETE DATA STRUCTURE
        console.log('\n📊 ========== DIGITAL PRODUCTS DATA ==========');
        console.log('Full response:', JSON.stringify(response, null, 2));
        
        digitalProducts.forEach((product: DigitalProduct, index: number) => {
          console.log(`\n📦 Product ${index + 1}:`);
          console.log('  - Order ID:', product.orderId);
          console.log('  - Order Number:', product.orderNumber);
          console.log('  - Item ID:', product.itemId);
          console.log('  - Product Info:', {
            _id: product.product._id,
            name: product.product.name,
            slug: product.product.slug,
            image: product.product.image,
            productType: product.product.productType,
          });
          console.log('  - Purchase Date:', product.purchaseDate);
          console.log('  - Download URL:', product.downloadUrl || 'NOT PROVIDED');
          console.log('  - File Size:', product.fileSize || 'NOT PROVIDED');
          console.log('  - File Type:', product.fileType || 'NOT PROVIDED');
          console.log('  - Version:', product.version || 'NOT PROVIDED');
        });
        
        console.log('\n✅ ========== END DIGITAL PRODUCTS DATA ==========\n');
        
        setProducts(digitalProducts);
      }
    } catch (error: any) {
      console.error('❌ Error fetching digital products:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load digital products',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (product: DigitalProduct) => {
    try {
      console.log('\n📥 ========== DOWNLOAD INITIATED ==========');
      console.log('Product Name:', product.product.name);
      console.log('Order ID:', product.orderId);
      console.log('Item ID:', product.itemId);
      
      setDownloadingId(product.itemId);

      // Get download URL from API
      console.log('🔄 Requesting download URL from API...');
      const response = await getDigitalProductDownload(product.orderId, product.itemId);
      
      console.log('📥 Download API response:', JSON.stringify(response, null, 2));
      console.log('  - Success:', response.success);
      console.log('  - Has data:', !!response.data);
      console.log('  - Has downloadUrl:', !!response.data?.downloadUrl);
      console.log('  - Download URL:', response.data?.downloadUrl || 'NOT PROVIDED');

      if (response.success && response.data.downloadUrl) {
        const downloadUrl = response.data.downloadUrl;
        console.log('✅ Valid download URL received:', downloadUrl);

        // Open download URL
        console.log('🔄 Checking if URL can be opened...');
        const supported = await Linking.canOpenURL(downloadUrl);
        console.log('  - URL supported:', supported);
        
        if (supported) {
          console.log('🚀 Opening download URL...');
          await Linking.openURL(downloadUrl);
          console.log('✅ Download started successfully');
          
          Toast.show({
            type: 'success',
            text1: 'Download Started',
            text2: 'Your download has begun',
          });
        } else {
          console.log('❌ Cannot open URL:', downloadUrl);
          Alert.alert('Error', 'Unable to open download link');
        }
      } else {
        console.log('❌ Invalid response - no download URL');
        console.log('Response data:', response.data);
        Alert.alert('Error', 'Download URL not available');
      }
      
      console.log('========== DOWNLOAD COMPLETE ==========\n');
    } catch (error: any) {
      console.error('\n❌ ========== DOWNLOAD ERROR ==========');
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Full error:', error);
      console.error('========== END DOWNLOAD ERROR ==========\n');
      
      Alert.alert(
        'Download Failed',
        error.response?.data?.message || 'Failed to download product. Please try again.'
      );
    } finally {
      setDownloadingId(null);
      console.log('✅ Download process finished\n');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    
    const kb = bytes / 1024;
    const mb = kb / 1024;
    const gb = mb / 1024;
    
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    if (kb >= 1) return `${kb.toFixed(2)} KB`;
    return `${bytes} bytes`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    console.log('⏳ Rendering: LOADING STATE');
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="text-gray-500 mt-4">Loading your digital products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('🎨 Rendering MyDigitalProducts screen');
  console.log('📦 Products count:', products.length);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              console.log('⬅️ Back button pressed');
              navigation.goBack();
            }}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold ml-2">My Digital Products</Text>
        </View>
      </View>

      {products.length === 0 ? (
        // Empty State
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 bg-purple-100 rounded-full items-center justify-center mb-4">
            <Icon name="cloud-download-outline" size={48} color="#8B5CF6" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">No Digital Products</Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            You haven`t purchased any digital products yet
          </Text>
          <TouchableOpacity
            onPress={() => {
              console.log('🛍️ Browse products pressed');
              navigation.navigate('Home' as any);
            }}
            className="bg-purple-500 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Products List
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="px-4 py-4">
            <Text className="text-sm text-gray-500 mb-4">
              {products.length} {products.length === 1 ? 'product' : 'products'} available
            </Text>

            {products.map((item, index) => {
              const isDownloading = downloadingId === item.itemId;
              
              // ✅ LOG RENDER DATA
              console.log(`\n🎨 Rendering product card ${index + 1}:`);
              console.log('  - Item ID:', item.itemId);
              console.log('  - Product Name:', item.product.name);
              console.log('  - Product Image:', item.product.image || 'NO IMAGE');
              console.log('  - Purchase Date:', item.purchaseDate);
              console.log('  - File Type:', item.fileType || 'NO FILE TYPE');
              console.log('  - File Size:', item.fileSize || 'NO FILE SIZE');
              console.log('  - Version:', item.version || 'NO VERSION');
              console.log('  - Order Number:', item.orderNumber);
              console.log('  - Is Downloading:', isDownloading);

              return (
                <View
                  key={`${item.orderId}-${item.itemId}`}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row">
                    {/* Product Image */}
                    <View className="w-20 h-20 bg-purple-50 rounded-xl overflow-hidden mr-3">
                      {item.product.image ? (
                        <Image
                          source={{ uri: item.product.image }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-full items-center justify-center">
                          <Icon name="cloud-outline" size={32} color="#8B5CF6" />
                        </View>
                      )}
                    </View>

                    {/* Product Info */}
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900" numberOfLines={2}>
                        {item.product.name}
                      </Text>
                      
                      <View className="flex-row items-center mt-2">
                        <Icon name="calendar-outline" size={14} color="#6B7280" />
                        <Text className="text-xs text-gray-500 ml-1">
                          Purchased {formatDate(item.purchaseDate)}
                        </Text>
                      </View>

                      {/* File Info */}
                      <View className="flex-row items-center mt-1">
                        {item.fileType && (
                          <>
                            <View className="bg-purple-100 px-2 py-1 rounded">
                              <Text className="text-xs font-semibold text-purple-700">
                                {item.fileType.toUpperCase()}
                              </Text>
                            </View>
                            {item.fileSize && (
                              <Text className="text-xs text-gray-500 ml-2">
                                {formatFileSize(item.fileSize)}
                              </Text>
                            )}
                          </>
                        )}
                      </View>

                      {item.version && (
                        <Text className="text-xs text-gray-500 mt-1">
                          Version {item.version}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Download Button */}
                  <TouchableOpacity
                    onPress={() => handleDownload(item)}
                    disabled={isDownloading}
                    className={`mt-4 py-3 rounded-xl flex-row items-center justify-center ${
                      isDownloading ? 'bg-gray-300' : 'bg-purple-500'
                    }`}
                  >
                    {isDownloading ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text className="text-white font-semibold ml-2">Downloading...</Text>
                      </>
                    ) : (
                      <>
                        <Icon name="cloud-download" size={20} color="#FFFFFF" />
                        <Text className="text-white font-semibold ml-2">Download</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Order Number */}
                  <View className="mt-3 pt-3 border-t border-gray-100">
                    <Text className="text-xs text-gray-500">
                      Order #{item.orderNumber}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Info Card */}
          <View className="mx-4 mb-6 bg-purple-50 rounded-2xl p-4">
            <View className="flex-row items-start">
              <Icon name="information-circle" size={20} color="#8B5CF6" />
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-purple-900 mb-1">
                  Download Tips
                </Text>
                <Text className="text-xs text-purple-700">
                  • Downloads are available anytime{'\n'}
                  • Make sure you have stable internet{'\n'}
                  • Check your device`s download folder{'\n'}
                  • Contact support if you have issues
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default MyDigitalProductsScreen;