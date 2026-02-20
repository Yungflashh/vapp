// ============================================================
// DELETE ACCOUNT SCREEN - REFINED VERSION
// File: screens/settings/DeleteAccountScreen.tsx
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import {
  requestAccountDeletion,
  getDeletionRequestStatus,
  cancelDeletionRequest,
} from '@/services/account.service';

interface DeletionReason {
  id: string;
  label: string;
  value: string;
  icon: string;
}

const deletionReasons: DeletionReason[] = [
  {
    id: '1',
    label: 'Privacy concerns',
    value: 'privacy_concerns',
    icon: 'shield-outline',
  },
  {
    id: '2',
    label: "Not using anymore",
    value: 'not_using_anymore',
    icon: 'time-outline',
  },
  {
    id: '3',
    label: 'Found alternative',
    value: 'found_alternative',
    icon: 'swap-horizontal-outline',
  },
  {
    id: '4',
    label: 'Too many notifications',
    value: 'too_many_emails',
    icon: 'notifications-off-outline',
  },
  {
    id: '5',
    label: 'Bad experience',
    value: 'bad_experience',
    icon: 'sad-outline',
  },
  {
    id: '6',
    label: 'Technical issues',
    value: 'technical_issues',
    icon: 'bug-outline',
  },
  {
    id: '7',
    label: 'Security concerns',
    value: 'account_security',
    icon: 'lock-closed-outline',
  },
  {
    id: '8',
    label: 'Other',
    value: 'other',
    icon: 'ellipsis-horizontal-outline',
  },
];

const DeleteAccountScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [existingRequest, setExistingRequest] = useState<any>(null);

  useEffect(() => {
    checkDeletionStatus();
  }, []);

  const checkDeletionStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await getDeletionRequestStatus();
      
      if (response.data.hasRequest) {
        setExistingRequest(response.data.deletionRequest);
      }
    } catch (error) {
      console.error('Error checking deletion status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCancelRequest = async () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel your deletion request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await cancelDeletionRequest();
              
              Toast.show({
                type: 'success',
                text1: 'Request Cancelled',
                text2: 'Your deletion request has been cancelled',
              });
              
              setExistingRequest(null);
              navigation.goBack();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to cancel request',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmitDeletion = async () => {
    if (!selectedReason) {
      Toast.show({
        type: 'error',
        text1: 'Select Reason',
        text2: 'Please select a reason for deletion',
      });
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action requires admin approval and cannot be undone once processed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              await requestAccountDeletion({
                reason: selectedReason,
                additionalDetails: additionalDetails.trim() || undefined,
              });
              
              Toast.show({
                type: 'success',
                text1: 'Request Submitted',
                text2: 'Your account deletion request has been submitted',
              });
              
              navigation.goBack();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to submit request',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (checkingStatus) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EC4899" />
        </View>
      </SafeAreaView>
    );
  }

  // Show existing request status
  if (existingRequest) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Header */}
        <View className="bg-white px-6 py-4 flex-row items-center border-b border-gray-100">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
          >
            <Icon name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Deletion Request</Text>
        </View>

        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="p-6">
            {/* Status Card */}
            <View 
              className="bg-white rounded-3xl p-6 mb-6"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              {/* Status Icon */}
              <View className="items-center mb-6">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: `${getStatusColor(existingRequest.status)}20` }}
                >
                  <Icon
                    name={
                      existingRequest.status === 'pending'
                        ? 'time-outline'
                        : existingRequest.status === 'approved'
                        ? 'checkmark-circle-outline'
                        : existingRequest.status === 'rejected'
                        ? 'close-circle-outline'
                        : 'ban-outline'
                    }
                    size={40}
                    color={getStatusColor(existingRequest.status)}
                  />
                </View>

                <View
                  className="px-4 py-1.5 rounded-full mb-3"
                  style={{ backgroundColor: `${getStatusColor(existingRequest.status)}20` }}
                >
                  <Text
                    className="font-semibold text-sm"
                    style={{ color: getStatusColor(existingRequest.status) }}
                  >
                    {getStatusLabel(existingRequest.status)}
                  </Text>
                </View>

                <Text className="text-gray-600 text-center text-sm px-4">
                  {existingRequest.status === 'pending' &&
                    'Your account deletion request is being reviewed by our team'}
                  {existingRequest.status === 'approved' &&
                    'Your account deletion has been approved and will be processed soon'}
                  {existingRequest.status === 'rejected' &&
                    'Your account deletion request has been rejected'}
                  {existingRequest.status === 'cancelled' &&
                    'Your account deletion request was cancelled'}
                </Text>
              </View>

              {/* Divider */}
              <View className="h-px bg-gray-100 my-4" />

              {/* Request Details */}
              <View className="space-y-4">
                <View>
                  <Text className="text-xs font-semibold text-gray-500 mb-1.5">
                    REASON
                  </Text>
                  <Text className="text-sm text-gray-900 capitalize">
                    {existingRequest.reason.replace(/_/g, ' ')}
                  </Text>
                </View>

                {existingRequest.additionalDetails && (
                  <View>
                    <Text className="text-xs font-semibold text-gray-500 mb-1.5">
                      ADDITIONAL DETAILS
                    </Text>
                    <Text className="text-sm text-gray-900 leading-5">
                      {existingRequest.additionalDetails}
                    </Text>
                  </View>
                )}

                <View>
                  <Text className="text-xs font-semibold text-gray-500 mb-1.5">
                    REQUESTED ON
                  </Text>
                  <Text className="text-sm text-gray-900">
                    {new Date(existingRequest.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>

                {existingRequest.rejectionReason && (
                  <View className="p-4 bg-red-50 rounded-2xl mt-2">
                    <Text className="text-xs font-semibold text-red-600 mb-1.5">
                      REJECTION REASON
                    </Text>
                    <Text className="text-sm text-red-900 leading-5">
                      {existingRequest.rejectionReason}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Cancel Button (only for pending requests) */}
            {existingRequest.status === 'pending' && (
              <TouchableOpacity
                onPress={handleCancelRequest}
                disabled={loading}
                className="bg-gray-200 rounded-2xl py-4 items-center"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#6B7280" />
                ) : (
                  <Text className="text-gray-900 font-semibold text-base">
                    Cancel Deletion Request
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <Toast />
      </SafeAreaView>
    );
  }

  // Show deletion request form
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View className="bg-white px-6 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
        >
          <Icon name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Delete Account</Text>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="px-6 pt-6">
          {/* Warning Card */}
          <View 
            className="bg-red-50 rounded-2xl p-5 mb-6"
            style={{
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3 mt-0.5">
                <Icon name="warning-outline" size={20} color="#DC2626" />
              </View>
              <View className="flex-1">
                <Text className="text-red-900 font-bold text-base mb-1.5">
                  Before you go...
                </Text>
                <Text className="text-red-800 text-sm leading-5">
                  Account deletion is permanent. All your data, orders, and history will be removed. This requires admin approval.
                </Text>
              </View>
            </View>
          </View>

          {/* Reason Selection */}
          <View className="mb-6">
            <Text className="text-gray-900 font-bold text-base mb-3">
              Why are you leaving? <Text className="text-red-500">*</Text>
            </Text>
            
            <View className="space-y-2">
              {deletionReasons.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  onPress={() => setSelectedReason(reason.value)}
                  className={`bg-white rounded-2xl p-4 flex-row items-center ${
                    selectedReason === reason.value ? 'border-2 border-red-500' : 'border border-gray-100'
                  }`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: selectedReason === reason.value ? 0.08 : 0.03,
                    shadowRadius: 3,
                    elevation: selectedReason === reason.value ? 2 : 1,
                  }}
                >
                  <View
                    className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                      selectedReason === reason.value ? 'bg-red-100' : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      name={reason.icon}
                      size={20}
                      color={selectedReason === reason.value ? '#DC2626' : '#6B7280'}
                    />
                  </View>

                  <Text
                    className={`flex-1 text-sm ${
                      selectedReason === reason.value
                        ? 'text-red-900 font-semibold'
                        : 'text-gray-900 font-medium'
                    }`}
                  >
                    {reason.label}
                  </Text>

                  {selectedReason === reason.value && (
                    <Icon name="checkmark-circle" size={22} color="#DC2626" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional Details */}
          <View className="mb-6">
            <Text className="text-gray-900 font-bold text-base mb-1.5">
              Additional details (optional)
            </Text>
            <Text className="text-gray-600 text-sm mb-3">
              Help us improve by sharing more
            </Text>

            <TextInput
              value={additionalDetails}
              onChangeText={setAdditionalDetails}
              placeholder="Tell us more..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              maxLength={1000}
              className="bg-white rounded-2xl p-4 text-gray-900 text-sm border border-gray-100"
              style={{
                minHeight: 110,
                textAlignVertical: 'top',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 3,
                elevation: 1,
              }}
            />
            <Text className="text-gray-500 text-xs mt-1.5 text-right">
              {additionalDetails.length}/1000
            </Text>
          </View>

          {/* What Will Happen */}
          <View 
            className="bg-white rounded-2xl p-5 mb-6"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <Text className="text-gray-900 font-bold text-base mb-4">
              What happens next?
            </Text>

            <View className="space-y-3">
              {[
                {
                  icon: 'time-outline',
                  text: 'Your request will be reviewed by our team',
                },
                {
                  icon: 'mail-outline',
                  text: "You'll receive a notification about the decision",
                },
                {
                  icon: 'trash-outline',
                  text: 'If approved, your account will be deleted',
                },
                {
                  icon: 'shield-checkmark-outline',
                  text: 'All your personal data will be removed',
                },
              ].map((item, index) => (
                <View key={index} className="flex-row items-start">
                  <View className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center mr-3 mt-0.5">
                    <Icon name={item.icon} size={14} color="#6B7280" />
                  </View>
                  <Text className="flex-1 text-gray-700 text-sm leading-5 pt-1">
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmitDeletion}
            disabled={loading || !selectedReason}
            className={`rounded-2xl py-4 items-center ${
              loading || !selectedReason ? 'bg-gray-300' : 'bg-red-500'
            }`}
            style={{
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: loading || !selectedReason ? 0 : 0.25,
              shadowRadius: 4,
              elevation: loading || !selectedReason ? 0 : 3,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold text-base">
                Request Account Deletion
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
};

export default DeleteAccountScreen;