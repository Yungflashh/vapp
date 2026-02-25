// screens/WriteReviewScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { createReview } from '@/services/review.service';

// Add to your RootStackParamList:
// WriteReview: {
//   orderId: string;
//   items: Array<{ product: string; productName: string; productImage?: string }>;
// };

type WriteReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'WriteReview'>;

interface ItemReview {
  productId: string;
  productName: string;
  productImage?: string;
  rating: number;
  comment: string;
}

const StarRating = ({
  rating,
  onRate,
  size = 32,
}: {
  rating: number;
  onRate: (star: number) => void;
  size?: number;
}) => {
  return (
    <View className="flex-row items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRate(star)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Icon
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? '#F59E0B' : '#D1D5DB'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const WriteReviewScreen = ({ route, navigation }: WriteReviewScreenProps) => {
  const { orderId, items } = route.params as any;

  const [reviews, setReviews] = useState<ItemReview[]>(
    items.map((item: any) => ({
      productId: item.product,
      productName: item.productName,
      productImage: item.productImage,
      rating: 0,
      comment: '',
    }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  const currentReview = reviews[currentIndex];
  const isLastItem = currentIndex === reviews.length - 1;
  const canSubmitCurrent = currentReview.rating > 0 && currentReview.comment.trim().length > 0;

  const updateCurrentReview = (field: 'rating' | 'comment', value: any) => {
    setReviews((prev) =>
      prev.map((r, i) => (i === currentIndex ? { ...r, [field]: value } : r))
    );
  };

  const getRatingLabel = (rating: number): string => {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Tap to rate';
    }
  };

  const handleSubmitCurrent = async () => {
    if (!canSubmitCurrent) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete Review',
        text2: 'Please add a rating and comment',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createReview({
        productId: currentReview.productId,
        orderId: orderId,
        rating: currentReview.rating,
        comment: currentReview.comment.trim(),
      });

      if (response.success) {
        setSubmittedCount((prev) => prev + 1);

        if (isLastItem) {
          Toast.show({
            type: 'success',
            text1: 'Thank You!',
            text2:
              reviews.length > 1
                ? 'All reviews submitted successfully'
                : 'Your review has been submitted',
          });
          navigation.goBack();
        } else {
          Toast.show({
            type: 'success',
            text1: 'Review Submitted',
            text2: `Review for ${currentReview.productName} saved`,
          });
          setCurrentIndex((prev) => prev + 1);
        }
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to submit review';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (isLastItem) {
      if (submittedCount > 0) {
        Toast.show({
          type: 'success',
          text1: 'Reviews Saved',
          text2: `${submittedCount} review${submittedCount > 1 ? 's' : ''} submitted`,
        });
      }
      navigation.goBack();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold ml-2">Write Review</Text>
        </View>
        {reviews.length > 1 && (
          <Text className="text-sm text-gray-500">
            {currentIndex + 1} of {reviews.length}
          </Text>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        {/* Progress bar for multi-item orders */}
        {reviews.length > 1 && (
          <View className="px-4 pt-4">
            <View className="flex-row gap-1">
              {reviews.map((_, i) => (
                <View
                  key={i}
                  className="flex-1 h-1 rounded-full"
                  style={{
                    backgroundColor:
                      i < currentIndex
                        ? '#10B981'
                        : i === currentIndex
                        ? '#EC4899'
                        : '#E5E7EB',
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Product Info */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4">
          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-pink-50 rounded-xl overflow-hidden mr-3">
              {currentReview.productImage ? (
                <Image
                  source={{ uri: currentReview.productImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Icon name="image-outline" size={24} color="#EC4899" />
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900" numberOfLines={2}>
                {currentReview.productName}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">How was this product?</Text>
            </View>
          </View>
        </View>

        {/* Rating Section */}
        <View className="bg-white mx-4 mt-3 rounded-2xl p-6 items-center">
          <Text className="text-base font-bold text-gray-900 mb-4">Rate this product</Text>
          <StarRating
            rating={currentReview.rating}
            onRate={(star) => updateCurrentReview('rating', star)}
            size={40}
          />
          <Text
            className="mt-3 text-sm font-semibold"
            style={{
              color: currentReview.rating > 0 ? '#F59E0B' : '#9CA3AF',
            }}
          >
            {getRatingLabel(currentReview.rating)}
          </Text>
        </View>

        {/* Comment Section */}
        <View className="bg-white mx-4 mt-3 rounded-2xl p-4">
          <Text className="text-base font-bold text-gray-900 mb-3">Your Review</Text>
          <TextInput
            className="bg-gray-50 rounded-xl p-4 text-sm text-gray-900 min-h-[120px]"
            placeholder="Share your experience with this product... What did you like or dislike?"
            placeholderTextColor="#9CA3AF"
            value={currentReview.comment}
            onChangeText={(text) => updateCurrentReview('comment', text)}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text className="text-xs text-gray-400 text-right mt-1">
            {currentReview.comment.length}/1000
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="px-4 py-6">
          <TouchableOpacity
            onPress={handleSubmitCurrent}
            disabled={!canSubmitCurrent || isSubmitting}
            className="py-4 rounded-xl mb-3"
            style={{
              backgroundColor: canSubmitCurrent ? '#EC4899' : '#E5E7EB',
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View className="flex-row items-center justify-center">
                <Icon
                  name="send"
                  size={18}
                  color={canSubmitCurrent ? '#FFFFFF' : '#9CA3AF'}
                />
                <Text
                  className="font-bold ml-2"
                  style={{ color: canSubmitCurrent ? '#FFFFFF' : '#9CA3AF' }}
                >
                  {isLastItem ? 'Submit Review' : 'Submit & Next'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkip}
            className="py-4 rounded-xl bg-gray-100"
          >
            <Text className="text-gray-600 font-semibold text-center">
              {isLastItem ? 'Skip & Done' : 'Skip This Product'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WriteReviewScreen;