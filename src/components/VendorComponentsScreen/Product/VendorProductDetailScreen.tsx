// ============================================================
// VENDOR PRODUCT DETAIL SCREEN
// File: screens/vendor/VendorProductDetailScreen.tsx
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Share,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getProductById, updateProduct, deleteProduct } from '@/services/product.service';
import { getProductQuestions, answerQuestion, deleteQuestion, ProductQuestion } from '@/services/question.service';
import { getProductReviews, Review } from '@/services/review.service';

const { width, height } = Dimensions.get('window');

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  originalPrice?: number;
  stock: number;
  inStock: boolean;
  totalSales: number;
  views: number;
  rating: number;
  reviews: number;
  category: string;
  productType: string;
  createdAt: string;
  updatedAt: string;
  keyFeatures?: string[];
  specifications?: { [key: string]: string };
  vendor?: {
    id: string;
    name: string;
    image?: string;
  };
}

// ============================================================
// Star Rating Display
// ============================================================
const StarRatingDisplay = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <View className="flex-row items-center">
    {[1, 2, 3, 4, 5].map((star) => (
      <Icon
        key={star}
        name={star <= Math.floor(rating) ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
        size={size}
        color="#FBBF24"
      />
    ))}
  </View>
);

// ============================================================
// Rating Bar
// ============================================================
const RatingBar = ({ stars, count, total }: { stars: number; count: number; total: number }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <View className="flex-row items-center mb-1">
      <Text className="text-gray-500 text-xs w-4 text-right">{stars}</Text>
      <Icon name="star" size={12} color="#FBBF24" style={{ marginLeft: 2 }} />
      <View className="flex-1 h-2 bg-gray-200 rounded-full mx-2">
        <View className="h-2 bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
      </View>
      <Text className="text-gray-400 text-xs w-6">{count}</Text>
    </View>
  );
};

// ============================================================
// Review Card (read-only for vendor)
// ============================================================
const ReviewCard = ({ review }: { review: Review }) => {
  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View className="bg-gray-50 rounded-xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <View className="w-9 h-9 bg-pink-100 rounded-full items-center justify-center mr-2">
            {review.user?.avatar ? (
              <Image source={{ uri: review.user.avatar }} className="w-full h-full rounded-full" />
            ) : (
              <Text className="text-pink-500 font-bold text-sm">
                {(review.user?.firstName?.[0] || 'U').toUpperCase()}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-semibold text-sm" numberOfLines={1}>
              {review.user?.firstName || 'User'} {review.user?.lastName?.[0] || ''}.
            </Text>
            <Text className="text-gray-400 text-xs">{formattedDate}</Text>
          </View>
        </View>
        <StarRatingDisplay rating={review.rating} size={14} />
      </View>
      <Text className="text-gray-700 text-sm leading-5">{review.comment}</Text>
      {review.images && review.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
          {review.images.map((img, i) => (
            <Image key={i} source={{ uri: img }} className="w-16 h-16 rounded-lg mr-2" resizeMode="cover" />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

// ============================================================
// Vendor Question Card (with answer capability)
// ============================================================
const VendorQuestionCard = ({
  item,
  onAnswer,
  onDelete,
}: {
  item: ProductQuestion;
  onAnswer: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View className="bg-gray-50 rounded-xl p-4 mb-3">
      {/* Question */}
      <View className="flex-row items-start mb-2">
        <View className="w-6 h-6 bg-pink-100 rounded-full items-center justify-center mr-2 mt-0.5">
          <Text className="text-pink-500 font-bold text-xs">Q</Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 text-sm font-semibold leading-5">{item.question}</Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-gray-400 text-xs">
              {item.user?.firstName || 'User'} {item.user?.lastName?.[0] || ''}.
            </Text>
            <Text className="text-gray-300 text-xs mx-1">·</Text>
            <Text className="text-gray-400 text-xs">{formattedDate}</Text>
          </View>
        </View>
      </View>

      {/* Answer or answer button */}
      {item.answer ? (
        <View className="flex-row items-start mt-2 ml-2 pl-4 border-l-2 border-green-300">
          <View className="w-6 h-6 bg-green-100 rounded-full items-center justify-center mr-2 mt-0.5">
            <Text className="text-green-600 font-bold text-xs">A</Text>
          </View>
          <View className="flex-1">
            <Text className="text-gray-700 text-sm leading-5">{item.answer}</Text>
            <View className="flex-row items-center mt-1">
              <Icon name="checkmark-circle" size={12} color="#10B981" />
              <Text className="text-green-600 text-xs font-semibold ml-1">You answered</Text>
              {item.answeredAt && (
                <>
                  <Text className="text-gray-300 text-xs mx-1">·</Text>
                  <Text className="text-gray-400 text-xs">
                    {new Date(item.answeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => onAnswer(item._id)}
          className="mt-2 ml-8 bg-pink-500 rounded-lg px-4 py-2.5 flex-row items-center justify-center"
        >
          <Icon name="chatbubble-outline" size={16} color="#FFFFFF" />
          <Text className="text-white text-sm font-semibold ml-1.5">Reply to Question</Text>
        </TouchableOpacity>
      )}

      {/* Delete */}
      <View className="flex-row justify-end mt-2">
        <TouchableOpacity onPress={() => onDelete(item._id)} className="flex-row items-center px-2 py-1">
          <Icon name="trash-outline" size={14} color="#EF4444" />
          <Text className="text-red-500 text-xs ml-1">Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const VendorProductDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute();
  const { productId } = route.params as { productId: string };

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'qa'>('details');

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsMeta, setReviewsMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [distribution, setDistribution] = useState<Array<{ _id: number; count: number }>>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Q&A
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [questionsMeta, setQuestionsMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [questionStats, setQuestionStats] = useState({ total: 0, answered: 0, unanswered: 0 });
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionFilter, setQuestionFilter] = useState<'all' | 'answered' | 'unanswered'>('unanswered');

  // Answer modal
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answeringQuestionText, setAnsweringQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  useEffect(() => {
    fetchProductDetail();
    fetchQuestionStats();
  }, [productId]);

  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0) fetchReviews();
    if (activeTab === 'qa' && questions.length === 0) fetchQuestions(1, questionFilter);
  }, [activeTab]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      const response = await getProductById(productId);
      if (response.success) {
        setProduct(response.data);
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Failed to load product' });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Fetch just the stats (lightweight call for tab badge counts)
  const fetchQuestionStats = async () => {
    try {
      const response = await getProductQuestions(productId, 1, 1, 'all');
      if (response.success && response.data.stats) {
        setQuestionStats(response.data.stats);
      }
    } catch (err: any) {
      console.error('❌ Question stats error:', err.message);
    }
  };

  const fetchReviews = async (page = 1) => {
    try {
      setIsLoadingReviews(true);
      const response = await getProductReviews(productId, page, 10, 'createdAt');
      if (response.success) {
        if (page === 1) {
          setReviews(response.data.reviews || []);
        } else {
          setReviews((prev) => [...prev, ...(response.data.reviews || [])]);
        }
        setDistribution(response.data.distribution || []);
        if (response.meta) {
          setReviewsMeta({ total: response.meta.total, page: response.meta.page, totalPages: response.meta.totalPages });
        }
      }
    } catch (err: any) {
      console.error('❌ Reviews error:', err.message);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const fetchQuestions = async (page = 1, filter?: string) => {
    const activeFilter = filter || questionFilter;
    try {
      setIsLoadingQuestions(true);
      const response = await getProductQuestions(productId, page, 10, activeFilter as any);
      if (response.success) {
        if (page === 1) {
          setQuestions(response.data.questions || []);
        } else {
          setQuestions((prev) => [...prev, ...(response.data.questions || [])]);
        }
        if (response.data.stats) setQuestionStats(response.data.stats);
        if (response.meta) setQuestionsMeta({ total: response.meta.total, page: response.meta.page, totalPages: response.meta.totalPages });
      }
    } catch (err: any) {
      console.error('❌ Questions error:', err.message);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // ============================================================
  // Q&A HANDLERS
  // ============================================================
  const handleOpenAnswer = (questionId: string) => {
    const q = questions.find((item) => item._id === questionId);
    if (q) {
      setAnsweringQuestionId(questionId);
      setAnsweringQuestionText(q.question);
      setAnswerText('');
      setShowAnswerModal(true);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answeringQuestionId || !answerText.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter your answer' });
      return;
    }
    try {
      setIsSubmittingAnswer(true);
      const response = await answerQuestion(answeringQuestionId, answerText.trim());
      if (response.success) {
        Toast.show({ type: 'success', text1: 'Answer Submitted!', text2: 'Your reply has been posted' });
        setShowAnswerModal(false);
        setAnswerText('');
        // Re-fetch questions and stats from server to get accurate data
        await fetchQuestions(1, questionFilter);
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || 'Failed to submit answer' });
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    Alert.alert('Remove Question', 'Are you sure you want to remove this question?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await deleteQuestion(questionId);
            if (response.success) {
              Toast.show({ type: 'success', text1: 'Removed', text2: 'Question has been removed' });
              // Re-fetch from server for accurate stats
              await fetchQuestions(1, questionFilter);
            }
          } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || 'Failed to remove' });
          }
        },
      },
    ]);
  };

  const handleQuestionFilterChange = (filter: 'all' | 'answered' | 'unanswered') => {
    if (filter === questionFilter) return; // no-op if same filter
    setQuestionFilter(filter);
    fetchQuestions(1, filter);
  };

  // ============================================================
  // PRODUCT MANAGEMENT HANDLERS
  // ============================================================
  const handleEditProduct = () => {
    Toast.show({ type: 'info', text1: 'Edit Product', text2: 'Product editing feature coming soon' });
  };

  const handleUpdateStock = () => {
    if (!product) return;
    Alert.prompt(
      'Update Stock',
      `Current stock: ${product.stock}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async (newStock) => {
            if (newStock && !isNaN(Number(newStock))) {
              try {
                await updateProduct(productId, { quantity: Number(newStock) });
                Toast.show({ type: 'success', text1: 'Stock Updated', text2: `Stock updated to ${newStock}` });
                fetchProductDetail();
              } catch (error: any) {
                Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Failed to update stock' });
              }
            }
          },
        },
      ],
      'plain-text',
      String(product.stock),
      'number-pad'
    );
  };

  const handleDeleteProduct = () => {
    if (!product) return;
    Alert.alert('Delete Product', `Are you sure you want to delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(productId);
            Toast.show({ type: 'success', text1: 'Product Deleted', text2: 'Product has been removed' });
            navigation.goBack();
          } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Failed to delete product' });
          }
        },
      },
    ]);
  };

  const handleShareProduct = async () => {
    if (!product) return;
    try {
      await Share.share({ message: `Check out ${product.name} - ₦${product.price.toLocaleString()}`, title: product.name });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStockStatus = () => {
    if (!product) return { label: '', color: '', bgColor: '' };
    if (product.stock === 0) return { label: 'Out of Stock', color: '#EF4444', bgColor: '#FEE2E2' };
    if (product.stock <= 10) return { label: 'Low Stock', color: '#F59E0B', bgColor: '#FEF3C7' };
    return { label: 'In Stock', color: '#10B981', bgColor: '#D1FAE5' };
  };

  const getDistributionCount = (stars: number) => distribution.find((d) => d._id === stars)?.count || 0;

  // ============================================================
  // LOADING
  // ============================================================
  if (loading || !product) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-500 mt-4">Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stockStatus = getStockStatus();
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const totalReviews = product.reviews || reviewsMeta.total || 0;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={{ height: height * 0.45 }} className="relative bg-gray-100">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => setSelectedImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            scrollEventThrottle={16}
          >
            {product.images.map((image, index) => (
              <View key={index} style={{ width }} className="items-center justify-center">
                <Image source={{ uri: image }} style={{ width: width * 0.8, height: height * 0.4 }} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>

          {/* Floating Header */}
          <View className="absolute top-4 left-0 right-0 px-4 flex-row justify-between items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-12 h-12 rounded-full bg-white items-center justify-center"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 }}
            >
              <Icon name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShareProduct}
              className="w-12 h-12 rounded-full bg-white items-center justify-center"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 }}
            >
              <Icon name="share-social-outline" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Image Indicators */}
          {product.images.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
              {product.images.map((_, index) => (
                <View key={index} className={`w-2 h-2 rounded-full mx-1 ${index === selectedImageIndex ? 'bg-pink-500' : 'bg-gray-300'}`} />
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="px-6 py-4">
          {/* Product Name */}
          <Text className="text-2xl font-bold text-gray-900 mb-3">{product.name}</Text>

          {/* Price */}
          <View className="flex-row items-center mb-3">
            <Text className="text-3xl font-bold text-gray-900">₦{product.price.toLocaleString()}</Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <Text className="text-lg text-gray-400 line-through ml-3">₦{product.originalPrice.toLocaleString()}</Text>
                <View className="bg-yellow-400 px-2 py-0.5 rounded ml-2">
                  <Text className="text-gray-900 text-xs font-bold">-{discount}%</Text>
                </View>
              </>
            )}
          </View>

          {/* Rating */}
          <TouchableOpacity onPress={() => setActiveTab('reviews')} className="flex-row items-center mb-4">
            <StarRatingDisplay rating={product.rating} size={16} />
            <Text className="text-base font-bold text-gray-900 ml-2">{product.rating.toFixed(1)}</Text>
            <Text className="text-sm text-gray-500 ml-1">({totalReviews} reviews)</Text>
            <Icon name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>

          {/* Stock Status */}
          <View className="mb-4">
            <View className="px-4 py-3 rounded-xl flex-row items-center justify-between" style={{ backgroundColor: stockStatus.bgColor }}>
              <View className="flex-row items-center">
                <Icon name="cube-outline" size={20} color={stockStatus.color} />
                <Text className="text-sm font-bold ml-2" style={{ color: stockStatus.color }}>{stockStatus.label}</Text>
              </View>
              <Text className="text-xl font-bold" style={{ color: stockStatus.color }}>{product.stock} units</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="flex-row mb-4">
            <View className="flex-1 bg-gray-50 rounded-xl p-4 mr-2">
              <View className="flex-row items-center mb-2">
                <Icon name="trending-up" size={18} color="#10B981" />
                <Text className="text-xs text-gray-500 ml-2">Total Sales</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">{product.totalSales}</Text>
            </View>
            <View className="flex-1 bg-gray-50 rounded-xl p-4 mx-1">
              <View className="flex-row items-center mb-2">
                <Icon name="eye-outline" size={18} color="#8B5CF6" />
                <Text className="text-xs text-gray-500 ml-2">Views</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">{product.views}</Text>
            </View>
            <View className="flex-1 bg-gray-50 rounded-xl p-4 ml-2">
              <View className="flex-row items-center mb-2">
                <Icon name="help-circle-outline" size={18} color="#F59E0B" />
                <Text className="text-xs text-gray-500 ml-2">Questions</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">{questionStats.total}</Text>
              {questionStats.unanswered > 0 && (
                <Text className="text-xs text-red-500 font-semibold">{questionStats.unanswered} pending</Text>
              )}
            </View>
          </View>

          {/* Tabs */}
          <View className="border-b border-gray-200 mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { key: 'details', label: 'Details' },
                { key: 'reviews', label: `Reviews (${totalReviews})` },
                { key: 'qa', label: `Q&A (${questionStats.total})` },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as any)}
                  className={`mr-6 pb-3 ${activeTab === tab.key ? 'border-b-2 border-pink-500' : ''}`}
                >
                  <View className="flex-row items-center">
                    <Text className={`font-semibold ${activeTab === tab.key ? 'text-pink-500' : 'text-gray-500'}`}>
                      {tab.label}
                    </Text>
                    {tab.key === 'qa' && questionStats.unanswered > 0 && (
                      <View className="bg-red-500 w-5 h-5 rounded-full items-center justify-center ml-1.5">
                        <Text className="text-white text-xs font-bold">{questionStats.unanswered}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ======== DETAILS TAB ======== */}
          {activeTab === 'details' && (
            <View>
              {/* Description */}
              <View className="mb-6">
                <Text className="text-lg font-bold text-gray-900 mb-3">Description</Text>
                <Text className="text-base text-gray-600 leading-6" numberOfLines={showFullDescription ? undefined : 4}>
                  {product.description}
                </Text>
                {product.description.length > 150 && (
                  <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)} className="mt-2">
                    <Text className="text-pink-500 font-semibold">{showFullDescription ? 'Show Less' : 'Read More'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Key Features */}
              {product.keyFeatures && product.keyFeatures.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-bold text-gray-900 mb-3">Key Features</Text>
                  {product.keyFeatures.map((feature, index) => (
                    <View key={index} className="flex-row items-start mb-2">
                      <Icon name="checkmark-circle" size={18} color="#10B981" />
                      <Text className="flex-1 text-base text-gray-600 ml-2">{feature}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <View className="bg-gray-50 rounded-xl p-4">
                  <Text className="text-lg font-bold text-gray-900 mb-3">Specifications</Text>
                  {Object.entries(product.specifications).map(([label, value], index) => (
                    <View key={index} className="flex-row justify-between py-3 border-b border-gray-200">
                      <Text className="text-gray-500">{label}</Text>
                      <Text className="text-gray-900 font-semibold flex-1 text-right ml-4">{value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ======== REVIEWS TAB ======== */}
          {activeTab === 'reviews' && (
            <View>
              {/* Rating Summary */}
              <View className="bg-gray-50 rounded-xl p-4 mb-4">
                <View className="flex-row items-center">
                  <View className="items-center mr-6">
                    <Text className="text-4xl font-bold text-gray-900">{product.rating.toFixed(1)}</Text>
                    <StarRatingDisplay rating={product.rating} size={16} />
                    <Text className="text-gray-500 text-xs mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</Text>
                  </View>
                  <View className="flex-1">
                    {[5, 4, 3, 2, 1].map((s) => (
                      <RatingBar key={s} stars={s} count={getDistributionCount(s)} total={totalReviews} />
                    ))}
                  </View>
                </View>
              </View>

              {/* Reviews List */}
              {isLoadingReviews && reviews.length === 0 ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="small" color="#EC4899" />
                  <Text className="text-gray-500 mt-2">Loading reviews...</Text>
                </View>
              ) : reviews.length === 0 ? (
                <View className="py-8 items-center">
                  <Icon name="chatbubble-outline" size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 mt-3 text-center">No reviews yet for this product.</Text>
                </View>
              ) : (
                <>
                  {reviews.map((review) => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                  {reviewsMeta.page < reviewsMeta.totalPages && (
                    <TouchableOpacity onPress={() => fetchReviews(reviewsMeta.page + 1)} disabled={isLoadingReviews} className="bg-gray-100 py-3 rounded-xl items-center mt-2">
                      {isLoadingReviews ? <ActivityIndicator size="small" color="#EC4899" /> : <Text className="text-gray-700 font-semibold">Load More Reviews</Text>}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}

          {/* ======== Q&A TAB ======== */}
          {activeTab === 'qa' && (
            <View>
              {/* Unanswered alert */}
              {questionStats.unanswered > 0 && (
                <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 flex-row items-center">
                  <Icon name="alert-circle" size={20} color="#F59E0B" />
                  <Text className="text-yellow-800 text-sm font-semibold ml-2 flex-1">
                    You have {questionStats.unanswered} unanswered question{questionStats.unanswered > 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              {/* Filter Chips */}
              <View className="flex-row gap-2 mb-4">
                {[
                  { key: 'all', label: `All (${questionStats.total})` },
                  { key: 'unanswered', label: `Unanswered (${questionStats.unanswered})` },
                  { key: 'answered', label: `Answered (${questionStats.answered})` },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => handleQuestionFilterChange(f.key as any)}
                    className={`px-3 py-1.5 rounded-full border ${questionFilter === f.key ? 'bg-pink-500 border-pink-500' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`text-xs font-semibold ${questionFilter === f.key ? 'text-white' : 'text-gray-600'}`}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Questions List */}
              {isLoadingQuestions && questions.length === 0 ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="small" color="#EC4899" />
                  <Text className="text-gray-500 mt-2">Loading questions...</Text>
                </View>
              ) : questions.length === 0 ? (
                <View className="py-8 items-center">
                  <Icon name="help-circle-outline" size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 mt-3 text-center">
                    {questionFilter === 'unanswered'
                      ? 'All questions have been answered!'
                      : 'No questions yet for this product.'}
                  </Text>
                </View>
              ) : (
                <>
                  {questions.map((q) => (
                    <VendorQuestionCard key={q._id} item={q} onAnswer={handleOpenAnswer} onDelete={handleDeleteQuestion} />
                  ))}
                  {questionsMeta.page < questionsMeta.totalPages && (
                    <TouchableOpacity onPress={() => fetchQuestions(questionsMeta.page + 1)} disabled={isLoadingQuestions} className="bg-gray-100 py-3 rounded-xl items-center mt-2">
                      {isLoadingQuestions ? <ActivityIndicator size="small" color="#EC4899" /> : <Text className="text-gray-700 font-semibold">Load More Questions</Text>}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View
        className="px-6 py-4 bg-white border-t border-gray-100"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 }}
      >
        <View className="flex-row">
          <TouchableOpacity
            onPress={handleUpdateStock}
            className="flex-1 bg-white border-2 border-pink-500 py-4 rounded-xl mr-2 flex-row items-center justify-center"
          >
            <Icon name="cube-outline" size={20} color="#EC4899" />
            <Text className="text-base font-bold text-pink-500 ml-2">Update Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Product Actions', '', [
                { text: 'Edit Product', onPress: handleEditProduct },
                { text: 'Delete Product', onPress: handleDeleteProduct, style: 'destructive' },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
            className="flex-1 bg-pink-500 py-4 rounded-xl ml-2 flex-row items-center justify-center"
            style={{ shadowColor: '#EC4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
          >
            <Icon name="settings-outline" size={20} color="#FFFFFF" />
            <Text className="text-base font-bold text-white ml-2">Manage</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ============================================================ */}
      {/* ANSWER QUESTION MODAL */}
      {/* ============================================================ */}
      <Modal animationType="slide" transparent visible={showAnswerModal} onRequestClose={() => setShowAnswerModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <TouchableOpacity activeOpacity={1} onPress={() => setShowAnswerModal(false)} className="flex-1 bg-black/50 justify-end">
            <TouchableOpacity activeOpacity={1} onPress={() => {}} className="bg-white rounded-t-3xl">
              {/* Handle */}
              <View className="items-center pt-3 pb-2">
                <View className="w-10 h-1 bg-gray-300 rounded-full" />
              </View>

              <View className="px-6 pb-8">
                <Text className="text-xl font-bold text-gray-900 mb-1">Reply to Question</Text>
                <Text className="text-sm text-gray-500 mb-4">Your answer will be visible to all customers</Text>

                {/* The question being answered */}
                <View className="bg-gray-50 rounded-xl p-3 mb-4">
                  <View className="flex-row items-start">
                    <View className="w-6 h-6 bg-pink-100 rounded-full items-center justify-center mr-2 mt-0.5">
                      <Text className="text-pink-500 font-bold text-xs">Q</Text>
                    </View>
                    <Text className="flex-1 text-gray-900 text-sm font-semibold leading-5">{answeringQuestionText}</Text>
                  </View>
                </View>

                {/* Answer input */}
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-sm text-gray-900 min-h-[120px] border border-gray-200"
                  placeholder="Type your answer here..."
                  placeholderTextColor="#9CA3AF"
                  value={answerText}
                  onChangeText={setAnswerText}
                  multiline
                  textAlignVertical="top"
                  maxLength={2000}
                  autoFocus
                />
                <Text className="text-xs text-gray-400 text-right mt-1">{answerText.length}/2000</Text>

                {/* Buttons */}
                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    onPress={() => { setShowAnswerModal(false); setAnswerText(''); }}
                    className="flex-1 py-3.5 rounded-xl border border-gray-300"
                  >
                    <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmitAnswer}
                    disabled={!answerText.trim() || isSubmittingAnswer}
                    className="flex-1 py-3.5 rounded-xl"
                    style={{ backgroundColor: answerText.trim() ? '#EC4899' : '#E5E7EB' }}
                  >
                    {isSubmittingAnswer ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="font-semibold text-center" style={{ color: answerText.trim() ? '#FFFFFF' : '#9CA3AF' }}>
                        Submit Answer
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default VendorProductDetailScreen;