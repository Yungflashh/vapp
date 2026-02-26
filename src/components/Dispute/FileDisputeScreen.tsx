// screens/FileDisputeScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { createDispute, DISPUTE_REASONS, DisputeReason } from '@/services/dispute.service';

type FileDisputeScreenProps = NativeStackScreenProps<RootStackParamList, 'FileDispute'>;

const FileDisputeScreen = ({ route, navigation }: FileDisputeScreenProps) => {
  const { orderId, orderNumber, items, vendorId: rawVendorId } = route.params as any;

  // vendorId might arrive as a populated object from navigation params
  const vendorId = typeof rawVendorId === 'object' ? rawVendorId?._id : rawVendorId;

  const [selectedReason, setSelectedReason] = useState<DisputeReason | null>(null);
  const [description, setDescription] = useState('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const toggleItemSelection = (productId: string) => {
    setSelectedItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const pickImage = async () => {
    if (evidenceImages.length >= 5) {
      Toast.show({
        type: 'error',
        text1: 'Limit Reached',
        text2: 'Maximum 5 evidence images allowed',
      });
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Please allow access to your photo library',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEvidenceImages((prev) => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Image pick error:', error);
    }
  };

  const removeImage = (index: number) => {
    setEvidenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Toast.show({
        type: 'error',
        text1: 'Required',
        text2: 'Please select a reason for your dispute',
      });
      return;
    }

    if (description.trim().length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Required',
        text2: 'Please provide a detailed description (at least 10 characters)',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Build disputed items from selection
      const disputedItems = items
        ?.filter((item: any) => {
          const productId = typeof item.product === 'object' ? item.product._id : item.product;
          return selectedItems.length === 0 || selectedItems.includes(productId);
        })
        .map((item: any) => ({
          product: typeof item.product === 'object' ? item.product._id : item.product,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        }));

      const requestData = {
        orderId,
        reason: selectedReason,
        description: description.trim(),
        evidence: evidenceImages.length > 0 ? evidenceImages : undefined,
        vendorId: vendorId || undefined,
        disputedItems: disputedItems?.length > 0 ? disputedItems : undefined,
      };

      console.log('📤 Dispute request payload:', JSON.stringify(requestData, null, 2));

      const response = await createDispute(requestData);

      if (response.success) {
        setShowSuccess(true);
      }
    } catch (error: any) {
      console.error('Create dispute error:', error);
      console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Status:', error.response?.status);

      // Extract validation errors
      const responseData = error.response?.data;
      let errorMessage = 'Failed to submit dispute. Please try again.';

      if (responseData?.error) {
        try {
          // Your backend sends errors as stringified JSON array: "[{\"field\":\"msg\"}]"
          const parsed = JSON.parse(responseData.error);
          if (Array.isArray(parsed)) {
            errorMessage = parsed.map((e: any) => Object.values(e).join(', ')).join('\n');
          } else {
            errorMessage = responseData.error;
          }
        } catch {
          errorMessage = responseData.error;
        }
      } else if (responseData?.errors && Array.isArray(responseData.errors)) {
        errorMessage = responseData.errors.map((e: any) => e.msg || e.message).join('\n');
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      }

      Toast.show({
        type: 'error',
        text1: 'Dispute Error',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedReasonLabel = DISPUTE_REASONS.find(
    (r) => r.value === selectedReason
  )?.label;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-2">File a Dispute</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Order Info Banner */}
        <View className="bg-white px-4 py-4 mt-2">
          <View className="bg-red-50 rounded-xl p-4">
            <View className="flex-row items-center mb-2">
              <Icon name="alert-circle" size={20} color="#EF4444" />
              <Text className="text-sm font-bold text-red-700 ml-2">
                Dispute for Order #{orderNumber}
              </Text>
            </View>
            <Text className="text-xs text-red-600">
              Disputes must be filed within 7 days of delivery. An admin will review your
              case and the vendor will have a chance to respond.
            </Text>
          </View>
        </View>

        {/* Select Items (optional) */}
        {items && items.length > 1 && (
          <View className="bg-white px-4 py-4 mt-3">
            <Text className="text-base font-bold text-gray-900 mb-1">
              Which items have issues?
            </Text>
            <Text className="text-xs text-gray-500 mb-3">
              Select specific items or leave empty to dispute the entire order
            </Text>

            {items.map((item: any, index: number) => {
              const productId =
                typeof item.product === 'object' ? item.product._id : item.product;
              const isSelected = selectedItems.includes(productId);

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleItemSelection(productId)}
                  className={`flex-row items-center p-3 rounded-xl mb-2 border ${
                    isSelected ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${
                      isSelected ? 'border-red-500 bg-red-500' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <Icon name="checkmark" size={14} color="#FFFFFF" />}
                  </View>

                  <View className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden mr-3">
                    {item.productImage ? (
                      <Image
                        source={{ uri: item.productImage }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Icon name="cube-outline" size={18} color="#9CA3AF" />
                      </View>
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                      {item.productName}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Qty: {item.quantity} · ₦{item.price?.toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Reason Selection */}
        <View className="bg-white px-4 py-4 mt-3">
          <Text className="text-base font-bold text-gray-900 mb-1">
            Reason for Dispute <Text className="text-red-500">*</Text>
          </Text>
          <Text className="text-xs text-gray-500 mb-3">Select the issue you experienced</Text>

          <TouchableOpacity
            onPress={() => setShowReasonPicker(true)}
            className={`flex-row items-center justify-between p-4 rounded-xl border ${
              selectedReason ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <Text
              className={`text-sm ${
                selectedReason ? 'text-gray-900 font-semibold' : 'text-gray-400'
              }`}
            >
              {selectedReasonLabel || 'Select a reason...'}
            </Text>
            <Icon name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View className="bg-white px-4 py-4 mt-3">
          <Text className="text-base font-bold text-gray-900 mb-1">
            Description <Text className="text-red-500">*</Text>
          </Text>
          <Text className="text-xs text-gray-500 mb-3">
            Describe the issue in detail (min 10 characters)
          </Text>

          <TextInput
            className="bg-gray-50 rounded-xl p-4 text-sm text-gray-900 border border-gray-200"
            placeholder="Explain what went wrong with your order..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={{ minHeight: 120 }}
          />
          <Text className="text-xs text-gray-400 mt-1 text-right">
            {description.length}/2000
          </Text>
        </View>

        {/* Evidence Upload */}
        <View className="bg-white px-4 py-4 mt-3">
          <Text className="text-base font-bold text-gray-900 mb-1">Evidence (Optional)</Text>
          <Text className="text-xs text-gray-500 mb-3">
            Upload photos to support your claim (max 5 images)
          </Text>

          <View className="flex-row flex-wrap">
            {evidenceImages.map((uri, index) => (
              <View key={index} className="w-20 h-20 mr-2 mb-2 rounded-xl overflow-hidden">
                <Image
                  source={{ uri }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center"
                >
                  <Icon name="close" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}

            {evidenceImages.length < 5 && (
              <TouchableOpacity
                onPress={pickImage}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center"
              >
                <Icon name="camera-outline" size={24} color="#9CA3AF" />
                <Text className="text-xs text-gray-400 mt-1">Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <View className="px-4 py-6">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || !selectedReason || description.trim().length < 10}
            className={`py-4 rounded-xl ${
              isSubmitting || !selectedReason || description.trim().length < 10
                ? 'bg-gray-300'
                : 'bg-red-500'
            }`}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View className="flex-row items-center justify-center">
                <Icon name="shield-checkmark" size={20} color="#FFFFFF" />
                <Text className="text-white font-bold text-base ml-2">Submit Dispute</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-gray-400 text-center mt-3">
            By submitting, you confirm that the information provided is accurate. False
            disputes may result in account restrictions.
          </Text>
        </View>
      </ScrollView>

      {/* Reason Picker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showReasonPicker}
        onRequestClose={() => setShowReasonPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl pt-6 pb-8 px-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Select Reason</Text>
              <TouchableOpacity onPress={() => setShowReasonPicker(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {DISPUTE_REASONS.map((reason) => {
              const isSelected = selectedReason === reason.value;
              return (
                <TouchableOpacity
                  key={reason.value}
                  onPress={() => {
                    setSelectedReason(reason.value);
                    setShowReasonPicker(false);
                  }}
                  className={`flex-row items-center p-4 rounded-xl mb-2 border ${
                    isSelected ? 'border-red-400 bg-red-50' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                      isSelected ? 'border-red-500 bg-red-500' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <Icon name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text
                    className={`text-sm ${
                      isSelected ? 'font-bold text-red-700' : 'text-gray-700'
                    }`}
                  >
                    {reason.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccess}
        onRequestClose={() => {}}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm items-center">
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
              <Icon name="checkmark-circle" size={48} color="#10B981" />
            </View>

            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              Dispute Submitted
            </Text>
            <Text className="text-sm text-gray-500 text-center mb-6">
              Your dispute has been filed. The vendor will be notified and an admin will
              review your case. You'll receive updates on your dispute status.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowSuccess(false);
                navigation.navigate('DisputeCenter' as any);
              }}
              className="bg-green-500 w-full py-4 rounded-xl mb-3"
            >
              <Text className="text-white font-bold text-center">View My Disputes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowSuccess(false);
                navigation.goBack();
              }}
              className="bg-gray-100 w-full py-4 rounded-xl"
            >
              <Text className="text-gray-700 font-bold text-center">Back to Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default FileDisputeScreen;