import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Clipboard,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { getProductById, getSimilarProducts, Product as ApiProduct } from '../../services/product.service';
import { addToCart } from '@/services/cart.service';
import { generateAffiliateLink } from '@/services/affiliate.service';
import { getProductReviews, Review } from '@/services/review.service';
import {
  askQuestion,
  getProductQuestions,
  markQuestionHelpful,
  ProductQuestion,
  QuestionStats,
} from '@/services/question.service';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// Star Rating Display
// ============================================================
const StarRatingDisplay = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <View className="flex-row items-center">
    {[1, 2, 3, 4, 5].map((star) => (
      <Icon
        key={star}
        name={
          star <= Math.floor(rating)
            ? 'star'
            : star - 0.5 <= rating
            ? 'star-half'
            : 'star-outline'
        }
        size={size}
        color="#FBBF24"
      />
    ))}
  </View>
);

// ============================================================
// Review Card
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
      {review.helpful > 0 && (
        <View className="flex-row items-center mt-2">
          <Icon name="thumbs-up-outline" size={14} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs ml-1">{review.helpful} found this helpful</Text>
        </View>
      )}
    </View>
  );
};

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
// Q&A Card
// ============================================================
const QuestionCard = ({
  item,
  onHelpful,
}: {
  item: ProductQuestion;
  onHelpful: (id: string) => void;
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

      {/* Answer */}
      {item.answer ? (
        <View className="flex-row items-start mt-2 ml-2 pl-4 border-l-2 border-green-300">
          <View className="w-6 h-6 bg-green-100 rounded-full items-center justify-center mr-2 mt-0.5">
            <Text className="text-green-600 font-bold text-xs">A</Text>
          </View>
          <View className="flex-1">
            <Text className="text-gray-700 text-sm leading-5">{item.answer}</Text>
            <View className="flex-row items-center mt-1">
              <Icon name="checkmark-circle" size={12} color="#10B981" />
              <Text className="text-green-600 text-xs font-semibold ml-1">
                {item.answeredBy?.firstName || 'Vendor'}
              </Text>
              {item.answeredAt && (
                <>
                  <Text className="text-gray-300 text-xs mx-1">·</Text>
                  <Text className="text-gray-400 text-xs">
                    {new Date(item.answeredAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-row items-center mt-2 ml-8 bg-yellow-50 rounded-lg px-3 py-2">
          <Icon name="time-outline" size={14} color="#F59E0B" />
          <Text className="text-yellow-700 text-xs ml-1">Awaiting vendor response</Text>
        </View>
      )}

      {/* Helpful */}
      <View className="flex-row items-center justify-end mt-3">
        <TouchableOpacity
          onPress={() => onHelpful(item._id)}
          className="flex-row items-center px-3 py-1.5 bg-white rounded-full border border-gray-200"
        >
          <Icon name="thumbs-up-outline" size={14} color="#9CA3AF" />
          <Text className="text-gray-500 text-xs ml-1">
            Helpful{item.helpful > 0 ? ` (${item.helpful})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const ProductDetailsScreen = ({ route, navigation }: Props) => {
  const { productId } = route.params;

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'qa' | 'shipping'>('description');
  const [isFavorite, setIsFavorite] = useState(false);

  // Cart
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Affiliate
  const [affiliateLink, setAffiliateLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsMeta, setReviewsMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [distribution, setDistribution] = useState<Array<{ _id: number; count: number }>>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewSortBy, setReviewSortBy] = useState('createdAt');

  // Q&A
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [questionsMeta, setQuestionsMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [questionStats, setQuestionStats] = useState<QuestionStats>({ total: 0, answered: 0, unanswered: 0 });
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionFilter, setQuestionFilter] = useState<'all' | 'answered' | 'unanswered'>('all');
  const [showAskModal, setShowAskModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  // Similar products
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  // Refresh
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0) fetchReviews();
    if (activeTab === 'qa' && questions.length === 0) fetchQuestions();
  }, [activeTab]);

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================
  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getProductById(productId);
      if (response.success && response.data) {
        setProduct(response.data);
        fetchSimilarProducts();
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      setError('Failed to load product details');
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load product details' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSimilarProducts = async () => {
    try {
      setIsLoadingSimilar(true);
      const response = await getSimilarProducts(productId, 10);
      if (response.success && response.data?.products) setSimilarProducts(response.data.products);
    } catch (err: any) {
      console.error('❌ Similar products error:', err.message);
    } finally {
      setIsLoadingSimilar(false);
    }
  };

  const fetchReviews = async (page = 1) => {
    try {
      setIsLoadingReviews(true);
      const response = await getProductReviews(productId, page, 10, reviewSortBy);
      if (response.success) {
        setReviews(page === 1 ? response.data.reviews || [] : (prev) => [...prev, ...(response.data.reviews || [])]);
        setDistribution(response.data.distribution || []);
        if (response.meta) setReviewsMeta({ total: response.meta.total, page: response.meta.page, totalPages: response.meta.totalPages });
      }
    } catch (err: any) {
      console.error('❌ Reviews error:', err.message);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const fetchQuestions = async (page = 1) => {
    try {
      setIsLoadingQuestions(true);
      const response = await getProductQuestions(productId, page, 10, questionFilter);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProductDetails();
    if (activeTab === 'reviews') await fetchReviews();
    if (activeTab === 'qa') await fetchQuestions();
    setRefreshing(false);
  }, [activeTab]);

  // ============================================================
  // Q&A HANDLERS
  // ============================================================
  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter your question' });
      return;
    }

    try {
      setIsSubmittingQuestion(true);
      const response = await askQuestion(productId, newQuestion.trim());
      if (response.success) {
        Toast.show({ type: 'success', text1: 'Question Submitted!', text2: 'The vendor will be notified' });
        setShowAskModal(false);
        setNewQuestion('');
        // Add new question to top of list
        if (response.data?.question) {
          setQuestions((prev) => [response.data.question, ...prev]);
          setQuestionStats((prev) => ({
            ...prev,
            total: prev.total + 1,
            unanswered: prev.unanswered + 1,
          }));
        }
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to submit question';
      Toast.show({ type: 'error', text1: 'Error', text2: message });
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleQuestionHelpful = async (questionId: string) => {
    try {
      const response = await markQuestionHelpful(questionId);
      if (response.success) {
        setQuestions((prev) =>
          prev.map((q) => (q._id === questionId ? { ...q, helpful: (q.helpful || 0) + 1 } : q))
        );
        Toast.show({ type: 'success', text1: 'Marked as helpful' });
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed';
      Toast.show({ type: 'error', text1: 'Error', text2: message });
    }
  };

  const handleQuestionFilterChange = (filter: 'all' | 'answered' | 'unanswered') => {
    setQuestionFilter(filter);
    setQuestions([]);
    setTimeout(() => fetchQuestions(1), 100);
  };

  // ============================================================
  // CART / AFFILIATE / MISC HANDLERS
  // ============================================================
  const handleAddToCart = async () => {
    if (!product) return;
    if (product.productType === 'physical' && !selectedSize) {
      Toast.show({ type: 'warning', text1: 'Size Required', text2: 'Please select a size' });
      return;
    }
    try {
      setIsAddingToCart(true);
      const variantParts: string[] = [];
      if (selectedSize) variantParts.push(`Size: ${selectedSize}`);
      if (selectedColor) variantParts.push(`Color: ${selectedColor}`);
      const variant = variantParts.length > 0 ? variantParts.join(', ') : undefined;
      const response = await addToCart(product.id, quantity, variant);
      if (response.success) Toast.show({ type: 'success', text1: 'Added to Cart', text2: `${quantity}x ${product.name}` });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || 'Failed to add to cart' });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleGenerateAffiliateLink = async () => {
    if (!product) return;
    if (affiliateLink) { copyAffiliateLink(); return; }
    try {
      setIsGeneratingLink(true);
      const response = await generateAffiliateLink(product.id);
      if (response.success && response.data?.affiliateLink?.url) {
        const url = response.data.affiliateLink.url;
        setAffiliateLink(url);
        Clipboard.setString(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
        Toast.show({ type: 'success', text1: 'Referral Link Generated!', text2: 'Link copied to clipboard' });
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to generate link';
      Toast.show({ type: message.toLowerCase().includes('already') ? 'info' : 'error', text1: message.toLowerCase().includes('already') ? 'Link Already Exists' : 'Error', text2: message });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyAffiliateLink = () => {
    if (!affiliateLink) return;
    Clipboard.setString(affiliateLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
    Toast.show({ type: 'success', text1: 'Copied!', text2: 'Referral link copied to clipboard' });
  };

  const incrementQuantity = () => { if (product && quantity < product.stock) setQuantity(quantity + 1); };
  const decrementQuantity = () => { if (quantity > 1) setQuantity(quantity - 1); };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    Toast.show({ type: 'success', text1: isFavorite ? 'Removed from Wishlist' : 'Added to Wishlist' });
  };

  const handleViewStore = () => {
    if (!product?.vendor) return;
    navigation.navigate('VendorStore' as any, {
      vendorId: product.vendor.id || (product.vendor as any)._id,
      vendorName: product.vendor.name,
    });
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const getDistributionCount = (stars: number) => distribution.find((d) => d._id === stars)?.count || 0;
  const averageRating = product?.rating || 0;
  const totalReviews = product?.reviews || reviewsMeta.total || 0;

  // ============================================================
  // LOADING / ERROR
  // ============================================================
  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#EC4899" />
        <Text className="text-gray-500 mt-4">Loading product...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Icon name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-gray-900 font-bold text-xl mt-4">Product Not Found</Text>
        <Text className="text-gray-500 text-center mt-2">{error}</Text>
        <TouchableOpacity className="bg-pink-500 px-8 py-3 rounded-lg mt-6" onPress={() => navigation.goBack()}>
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <View className="flex-1 bg-white">
      {/* Floating Header */}
      <View className="flex-row items-center justify-between px-4 py-3 absolute top-0 left-0 right-0 z-10" style={{ paddingTop: 50 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-black/30 rounded-full items-center justify-center">
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View className="flex-row gap-2">
          <TouchableOpacity className="w-10 h-10 bg-black/30 rounded-full items-center justify-center">
            <Icon name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFavorite} className="w-10 h-10 bg-black/30 rounded-full items-center justify-center">
            <Icon name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#EC4899' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EC4899']} />}>
        {/* Image Carousel */}
        <View style={{ height: 400 }}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setCurrentImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}>
            {product.images.map((image, index) => (
              <View key={index} style={{ width: SCREEN_WIDTH, height: 400 }}>
                <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>
          {product.images.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
              {product.images.map((_, index) => (
                <View key={index} className={`h-2 rounded-full ${index === currentImageIndex ? 'w-6 bg-pink-500' : 'w-2 bg-white/70'}`} />
              ))}
            </View>
          )}
        </View>

        {/* Vendor Info */}
        <TouchableOpacity onPress={handleViewStore} activeOpacity={0.7} className="bg-white px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center overflow-hidden">
              {product.vendor.image ? <Image source={{ uri: product.vendor.image }} style={{ width: '100%', height: '100%' }} /> : <Icon name="person" size={24} color="#9CA3AF" />}
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-gray-900 font-semibold text-base">{product.vendor.name}</Text>
              <Text className="text-gray-500 text-xs mt-0.5">Tap to view store</Text>
            </View>
            <View className="flex-row items-center">
              <View className="bg-pink-50 px-3 py-1.5 rounded-full flex-row items-center mr-2">
                <Icon name="checkmark-circle" size={16} color="#EC4899" />
                <Text className="text-pink-500 text-xs font-semibold ml-1">Verified</Text>
              </View>
              <Icon name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Product Title & Price */}
        <View className="px-4 py-4">
          <Text className="text-gray-900 text-2xl font-bold mb-3">{product.name}</Text>
          <View className="flex-row items-center mb-4">
            <Text className="text-gray-900 text-3xl font-bold">₦{product.price.toLocaleString()}</Text>
            {product.originalPrice && (
              <View className="ml-3 flex-row items-center">
                <Text className="text-gray-400 text-lg line-through">₦{product.originalPrice.toLocaleString()}</Text>
                <View className="bg-yellow-400 px-2 py-1 rounded ml-2">
                  <Text className="text-gray-900 text-xs font-bold">-{discountPercentage}%</Text>
                </View>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => setActiveTab('reviews')} className="flex-row items-center">
            <StarRatingDisplay rating={product.rating} size={20} />
            <Text className="text-gray-900 font-semibold ml-2">{product.rating.toFixed(1)}</Text>
            <Text className="text-gray-500 ml-1">({totalReviews} reviews)</Text>
            <Icon name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="px-4 mb-4 flex-row gap-3">
          <TouchableOpacity
            onPress={() => {
              setActiveTab('qa');
              setShowAskModal(true);
            }}
            className="flex-1 bg-white border-2 border-pink-500 py-3.5 rounded-xl flex-row items-center justify-center"
          >
            <Icon name="chatbubble-outline" size={20} color="#EC4899" />
            <Text className="text-pink-500 font-semibold ml-2">Ask a Question</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleViewStore} className="flex-1 bg-white border-2 border-gray-900 py-3.5 rounded-xl flex-row items-center justify-center">
            <MaterialIcon name="store" size={20} color="#111827" />
            <Text className="text-gray-900 font-semibold ml-2">View Store</Text>
          </TouchableOpacity>
        </View>

        {/* Referral Link */}
        <View className="px-4 mb-4">
          {!affiliateLink ? (
            <TouchableOpacity onPress={handleGenerateAffiliateLink} disabled={isGeneratingLink} className="bg-white border-2 border-pink-500 py-3.5 rounded-xl flex-row items-center justify-center" style={{ opacity: isGeneratingLink ? 0.6 : 1 }}>
              {isGeneratingLink ? (
                <><ActivityIndicator size="small" color="#EC4899" /><Text className="text-pink-500 font-semibold ml-2">Generating...</Text></>
              ) : (
                <><MaterialIcon name="link-variant" size={20} color="#EC4899" /><Text className="text-pink-500 font-semibold ml-2">Generate Referral Link</Text></>
              )}
            </TouchableOpacity>
          ) : (
            <View className="bg-pink-50 border border-pink-200 rounded-xl p-3">
              <View className="flex-row items-center mb-2">
                <Icon name="checkmark-circle" size={18} color="#EC4899" />
                <Text className="text-pink-600 font-semibold text-sm ml-1">Referral Link Generated</Text>
              </View>
              <View className="bg-white rounded-lg px-3 py-2.5 flex-row items-center">
                <Text className="flex-1 text-gray-600 text-xs mr-2" numberOfLines={1} ellipsizeMode="middle">{affiliateLink}</Text>
                <TouchableOpacity onPress={copyAffiliateLink} className="bg-pink-500 px-3 py-1.5 rounded-lg flex-row items-center">
                  <Icon name={linkCopied ? 'checkmark' : 'copy-outline'} size={14} color="#FFFFFF" />
                  <Text className="text-white text-xs font-semibold ml-1">{linkCopied ? 'Copied!' : 'Copy'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Size Selection */}
        {product.productType === 'physical' && (
          <View className="px-4 mb-4">
            <Text className="text-gray-900 font-bold text-base mb-3">Select Size</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {sizes.map((size) => (
                  <TouchableOpacity key={size} onPress={() => setSelectedSize(size)} className={`px-6 py-3 rounded-xl border-2 ${selectedSize === size ? 'bg-pink-500 border-pink-500' : 'bg-white border-gray-200'}`}>
                    <Text className={`font-semibold ${selectedSize === size ? 'text-white' : 'text-gray-900'}`}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Color Selection */}
        {product.productType === 'physical' && (
          <View className="px-4 mb-4">
            <Text className="text-gray-900 font-bold text-base mb-3">
              Select Color{selectedColor && <Text className="text-gray-500 font-normal"> — {selectedColor}</Text>}
            </Text>
            <View className="flex-row gap-3">
              {colors.map((color) => (
                <TouchableOpacity key={color.name} onPress={() => setSelectedColor(color.name)} className="items-center">
                  <View className={`w-12 h-12 rounded-full border-2 ${selectedColor === color.name ? 'border-pink-500' : 'border-gray-200'}`} style={{ backgroundColor: color.hex, elevation: 2 }} />
                  {selectedColor === color.name && <View className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-1" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quantity */}
        <View className="px-4 mb-4">
          <Text className="text-gray-900 font-bold text-base mb-3">Quantity</Text>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={decrementQuantity} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center" disabled={quantity <= 1}>
              <Icon name="remove" size={20} color={quantity <= 1 ? '#D1D5DB' : '#111827'} />
            </TouchableOpacity>
            <Text className="text-gray-900 text-xl font-bold mx-6">{quantity}</Text>
            <TouchableOpacity onPress={incrementQuantity} className="w-10 h-10 bg-pink-500 rounded-full items-center justify-center" disabled={quantity >= product.stock}>
              <Icon name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="text-gray-500 ml-4">Available: {product.stock} items</Text>
          </View>
        </View>

        {/* Features Icons */}
        <View className="px-4 mb-4">
          <View className="flex-row justify-between">
            {[
              { icon: 'shield-checkmark', bg: 'bg-green-50', color: '#10B981', label: 'Secure Payment' },
              { icon: 'sync', bg: 'bg-blue-50', color: '#3B82F6', label: 'Easy Returns', isMaterial: true },
              { icon: 'truck-fast', bg: 'bg-purple-50', color: '#8B5CF6', label: 'Fast Shipping', isMaterial: true },
            ].map((feat, i) => (
              <View key={i} className="flex-1 items-center py-4">
                <View className={`w-12 h-12 ${feat.bg} rounded-full items-center justify-center mb-2`}>
                  {feat.isMaterial ? <MaterialIcon name={feat.icon} size={24} color={feat.color} /> : <Icon name={feat.icon} size={24} color={feat.color} />}
                </View>
                <Text className="text-gray-900 font-semibold text-xs">{feat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Add to Cart */}
        <View className="px-4 mb-4">
          <TouchableOpacity onPress={handleAddToCart} disabled={isAddingToCart || product.stock === 0} className="bg-pink-500 py-4 rounded-xl flex-row items-center justify-center" style={{ opacity: isAddingToCart || product.stock === 0 ? 0.6 : 1 }}>
            {isAddingToCart ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
              <>
                <Icon name="cart-outline" size={22} color="#FFFFFF" />
                <Text className="text-white font-bold text-base ml-2">{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</Text>
                {product.stock > 0 && <Text className="text-white/80 font-semibold ml-2">— ₦{(product.price * quantity).toLocaleString()}</Text>}
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="border-b border-gray-200 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
            {[
              { key: 'description', label: 'Description' },
              { key: 'reviews', label: `Reviews (${totalReviews})` },
              { key: 'qa', label: `Q&A (${questionStats.total})` },
              { key: 'shipping', label: 'Shipping' },
            ].map((tab) => (
              <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key as any)} className={`mr-6 pb-3 ${activeTab === tab.key ? 'border-b-2 border-pink-500' : ''}`}>
                <Text className={`font-semibold ${activeTab === tab.key ? 'text-pink-500' : 'text-gray-500'}`}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View className="px-4 mb-6">
          {/* ======== DESCRIPTION ======== */}
          {activeTab === 'description' && (
            <View>
              <Text className="text-gray-700 leading-6 mb-6">{product.description}</Text>
              {product.keyFeatures && product.keyFeatures.length > 0 && (
                <>
                  <Text className="text-gray-900 font-bold text-lg mb-3">Key Features</Text>
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
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <View className="bg-gray-50 rounded-xl p-4">
                  <Text className="text-gray-900 font-bold text-lg mb-3">Product Specifications</Text>
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

          {/* ======== REVIEWS ======== */}
          {activeTab === 'reviews' && (
            <View>
              <View className="bg-gray-50 rounded-xl p-4 mb-4">
                <View className="flex-row items-center">
                  <View className="items-center mr-6">
                    <Text className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</Text>
                    <StarRatingDisplay rating={averageRating} size={16} />
                    <Text className="text-gray-500 text-xs mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</Text>
                  </View>
                  <View className="flex-1">
                    {[5, 4, 3, 2, 1].map((s) => <RatingBar key={s} stars={s} count={getDistributionCount(s)} total={totalReviews} />)}
                  </View>
                </View>
              </View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 font-semibold text-base">Customer Reviews</Text>
                <TouchableOpacity onPress={() => { const next = reviewSortBy === 'createdAt' ? 'rating' : 'createdAt'; setReviewSortBy(next); setReviews([]); setTimeout(() => fetchReviews(1), 100); }} className="flex-row items-center">
                  <Icon name="swap-vertical" size={16} color="#EC4899" />
                  <Text className="text-pink-500 text-sm ml-1">{reviewSortBy === 'createdAt' ? 'Most Recent' : 'Highest Rated'}</Text>
                </TouchableOpacity>
              </View>
              {isLoadingReviews && reviews.length === 0 ? (
                <View className="py-8 items-center"><ActivityIndicator size="small" color="#EC4899" /><Text className="text-gray-500 mt-2">Loading reviews...</Text></View>
              ) : reviews.length === 0 ? (
                <View className="py-8 items-center"><Icon name="chatbubble-outline" size={48} color="#D1D5DB" /><Text className="text-gray-500 mt-3 text-center">No reviews yet.{'\n'}Be the first to review this product!</Text></View>
              ) : (
                <>
                  {reviews.map((review) => <ReviewCard key={review._id} review={review} />)}
                  {reviewsMeta.page < reviewsMeta.totalPages && (
                    <TouchableOpacity onPress={() => fetchReviews(reviewsMeta.page + 1)} disabled={isLoadingReviews} className="bg-gray-100 py-3 rounded-xl items-center mt-2">
                      {isLoadingReviews ? <ActivityIndicator size="small" color="#EC4899" /> : <Text className="text-gray-700 font-semibold">Load More Reviews</Text>}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}

          {/* ======== Q&A ======== */}
          {activeTab === 'qa' && (
            <View>
              {/* Ask Button */}
              <TouchableOpacity
                onPress={() => setShowAskModal(true)}
                className="bg-pink-500 py-3.5 rounded-xl flex-row items-center justify-center mb-4"
              >
                <Icon name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text className="text-white font-bold ml-2">Ask a Question</Text>
              </TouchableOpacity>

              {/* Filter Chips */}
              <View className="flex-row gap-2 mb-4">
                {[
                  { key: 'all', label: `All (${questionStats.total})` },
                  { key: 'answered', label: `Answered (${questionStats.answered})` },
                  { key: 'unanswered', label: `Unanswered (${questionStats.unanswered})` },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => handleQuestionFilterChange(f.key as any)}
                    className={`px-3 py-1.5 rounded-full border ${
                      questionFilter === f.key
                        ? 'bg-pink-500 border-pink-500'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        questionFilter === f.key ? 'text-white' : 'text-gray-600'
                      }`}
                    >
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
                    No questions yet.{'\n'}Be the first to ask!
                  </Text>
                </View>
              ) : (
                <>
                  {questions.map((q) => (
                    <QuestionCard key={q._id} item={q} onHelpful={handleQuestionHelpful} />
                  ))}
                  {questionsMeta.page < questionsMeta.totalPages && (
                    <TouchableOpacity
                      onPress={() => fetchQuestions(questionsMeta.page + 1)}
                      disabled={isLoadingQuestions}
                      className="bg-gray-100 py-3 rounded-xl items-center mt-2"
                    >
                      {isLoadingQuestions ? (
                        <ActivityIndicator size="small" color="#EC4899" />
                      ) : (
                        <Text className="text-gray-700 font-semibold">Load More Questions</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          )}

          {/* ======== SHIPPING ======== */}
          {activeTab === 'shipping' && (
            <View className="bg-gray-50 rounded-xl p-4">
              {[
                { icon: 'truck-fast', bg: 'bg-blue-100', color: '#3B82F6', title: 'Standard Delivery', desc: '3-7 business days', isMaterial: true },
                { icon: 'shield-check', bg: 'bg-green-100', color: '#10B981', title: 'Buyer Protection', desc: 'Full refund if item not delivered', isMaterial: true },
                { icon: 'sync', bg: 'bg-purple-100', color: '#8B5CF6', title: 'Easy Returns', desc: '7-day return policy on eligible items', isMaterial: true },
              ].map((item, i) => (
                <View key={i} className={`flex-row items-center ${i < 2 ? 'mb-3' : ''}`}>
                  <View className={`w-10 h-10 ${item.bg} rounded-full items-center justify-center mr-3`}>
                    <MaterialIcon name={item.icon} size={20} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold">{item.title}</Text>
                    <Text className="text-gray-500 text-sm">{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Similar Products */}
        {(similarProducts.length > 0 || isLoadingSimilar) && (
          <View className="px-4 pb-6">
            <Text className="text-gray-900 font-bold text-xl mb-4">Similar Products</Text>
            {isLoadingSimilar ? (
              <View className="py-8 items-center"><ActivityIndicator size="small" color="#EC4899" /></View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {similarProducts.map((item) => (
                  <TouchableOpacity key={item.id} onPress={() => navigation.push('ProductDetails', { productId: item.id })} className="w-40 mr-4 bg-white rounded-xl overflow-hidden border border-gray-200" activeOpacity={0.7}>
                    <View className="relative">
                      {item.thumbnail || item.images?.[0] ? (
                        <Image source={{ uri: item.thumbnail || item.images[0] }} className="w-full h-40" resizeMode="cover" />
                      ) : (
                        <View className="w-full h-40 bg-gray-100 items-center justify-center"><Icon name="image-outline" size={32} color="#D1D5DB" /></View>
                      )}
                      {item.discount > 0 && (
                        <View className="absolute top-2 left-2 bg-yellow-400 px-2 py-0.5 rounded"><Text className="text-gray-900 text-xs font-bold">-{item.discount}%</Text></View>
                      )}
                    </View>
                    <View className="p-3">
                      <Text className="text-gray-900 font-semibold text-sm" numberOfLines={2}>{item.name}</Text>
                      <View className="flex-row items-center mt-1">
                        <Icon name="star" size={12} color="#FBBF24" />
                        <Text className="text-gray-500 text-xs ml-1">{(item.rating || 0).toFixed(1)} ({item.reviews || 0})</Text>
                      </View>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-pink-500 font-bold">₦{item.price?.toLocaleString()}</Text>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <Text className="text-gray-400 text-xs line-through ml-1">₦{item.originalPrice?.toLocaleString()}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </ScrollView>

      {/* ============================================================ */}
      {/* ASK QUESTION MODAL */}
      {/* ============================================================ */}
      <Modal animationType="slide" transparent visible={showAskModal} onRequestClose={() => setShowAskModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <TouchableOpacity activeOpacity={1} onPress={() => setShowAskModal(false)} className="flex-1 bg-black/50 justify-end">
            <TouchableOpacity activeOpacity={1} onPress={() => {}} className="bg-white rounded-t-3xl">
              {/* Handle bar */}
              <View className="items-center pt-3 pb-2">
                <View className="w-10 h-1 bg-gray-300 rounded-full" />
              </View>

              <View className="px-6 pb-8">
                <Text className="text-xl font-bold text-gray-900 mb-1">Ask a Question</Text>
                <Text className="text-sm text-gray-500 mb-4">
                  Ask about this product and the vendor will respond
                </Text>

                {/* Product mini card */}
                <View className="flex-row items-center bg-gray-50 rounded-xl p-3 mb-4">
                  <View className="w-12 h-12 bg-pink-50 rounded-lg overflow-hidden mr-3">
                    {product.images?.[0] ? (
                      <Image source={{ uri: product.images[0] }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <View className="w-full h-full items-center justify-center"><Icon name="image-outline" size={20} color="#EC4899" /></View>
                    )}
                  </View>
                  <Text className="flex-1 text-gray-900 font-semibold text-sm" numberOfLines={2}>
                    {product.name}
                  </Text>
                </View>

                {/* Question input */}
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-sm text-gray-900 min-h-[120px] border border-gray-200"
                  placeholder="Type your question here... e.g. 'What material is this made of?'"
                  placeholderTextColor="#9CA3AF"
                  value={newQuestion}
                  onChangeText={setNewQuestion}
                  multiline
                  textAlignVertical="top"
                  maxLength={1000}
                  autoFocus
                />
                <Text className="text-xs text-gray-400 text-right mt-1">
                  {newQuestion.length}/1000
                </Text>

                {/* Buttons */}
                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    onPress={() => { setShowAskModal(false); setNewQuestion(''); }}
                    className="flex-1 py-3.5 rounded-xl border border-gray-300"
                  >
                    <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAskQuestion}
                    disabled={!newQuestion.trim() || isSubmittingQuestion}
                    className="flex-1 py-3.5 rounded-xl"
                    style={{ backgroundColor: newQuestion.trim() ? '#EC4899' : '#E5E7EB' }}
                  >
                    {isSubmittingQuestion ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="font-semibold text-center" style={{ color: newQuestion.trim() ? '#FFFFFF' : '#9CA3AF' }}>
                        Submit
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default ProductDetailsScreen;