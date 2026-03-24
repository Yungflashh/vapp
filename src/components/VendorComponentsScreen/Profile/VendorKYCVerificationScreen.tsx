// ============================================================
// VENDOR KYC VERIFICATION SCREEN
// File: screens/vendor/VendorKYCVerificationScreen.tsx
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyVendorProfile, uploadKYCDocument, submitKYCDocuments } from '@/services/vendor.service';
import Toast from 'react-native-toast-message';

interface KYCDocument {
  type: string;
  documentUrl: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  rejectionReason?: string;
}

// Verification weight: NIN = 50%, CAC + Utility Bill + Social Media = 50% (16.67% each)
const DOCUMENT_TYPES = [
  {
    id: 'NIN',
    name: 'NIN (National Identification)',
    description: 'National Identification Number slip or card',
    icon: 'finger-print-outline',
    required: true,
    weight: 50,
  },
  {
    id: 'CAC',
    name: 'CAC Certificate',
    description: 'Business registration certificate (optional)',
    icon: 'document-text-outline',
    required: false,
    weight: 16.67,
  },
  {
    id: 'UTILITY_BILL',
    name: 'Utility Bill',
    description: 'Proof of address (PHCN, Water bill)',
    icon: 'receipt-outline',
    required: false,
    weight: 16.67,
  },
  {
    id: 'PASSPORT',
    name: 'Passport Photo',
    description: 'Clear passport photograph',
    icon: 'person-outline',
    required: false,
    weight: 0,
  },
];

const VendorKYCVerificationScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const isSetupFlow = route.params?.isSetupFlow ?? false;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [uploadedDocuments, setUploadedDocuments] = useState<KYCDocument[]>([]);
  const [newDocuments, setNewDocuments] = useState<{ type: string; uri: string; name: string }[]>([]);
  const [hasSocialMedia, setHasSocialMedia] = useState(false);

  useEffect(() => {
    // Load cached state first, then fetch fresh data
    const loadCachedThenFetch = async () => {
      try {
        const cached = await AsyncStorage.getItem('kyc_status_cache');
        if (cached) {
          const data = JSON.parse(cached);
          setVerificationStatus(data.verificationStatus || 'pending');
          setUploadedDocuments(data.uploadedDocuments || []);
          setHasSocialMedia(data.hasSocialMedia || false);
        }
      } catch {}
      fetchKYCStatus();
    };
    loadCachedThenFetch();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const response = await getMyVendorProfile();
      console.log('📋 KYC fetch response:', JSON.stringify(response?.data || response, null, 2));

      if (response.success) {
        const profile = response.data?.vendorProfile || response.data;

        console.log('📋 Verification status:', profile?.verificationStatus);
        console.log('📋 KYC documents:', JSON.stringify(profile?.kycDocuments));

        const status = profile?.verificationStatus || 'pending';
        const docs = profile?.kycDocuments || [];
        const sm = profile?.socialMedia;
        const socialMedia = !!(sm?.facebook || sm?.instagram || sm?.twitter || sm?.tiktok);

        setVerificationStatus(status);
        setUploadedDocuments(docs);
        setHasSocialMedia(socialMedia);

        // Cache for instant load next time
        AsyncStorage.setItem('kyc_status_cache', JSON.stringify({
          verificationStatus: status,
          uploadedDocuments: docs,
          hasSocialMedia: socialMedia,
        }));
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickDocument = async (documentType: string) => {
    try {
      Alert.alert(
        'Select Document Source',
        'Choose how you want to upload your document',
        [
          {
            text: 'Camera',
            onPress: () => pickFromCamera(documentType),
          },
          {
            text: 'Gallery',
            onPress: () => pickFromGallery(documentType),
          },
          {
            text: 'Files',
            onPress: () => pickFromFiles(documentType),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Document pick error:', error);
    }
  };

  const pickFromCamera = async (documentType: string) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadDocument(documentType, result.assets[0].uri, 'camera-photo.jpg');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to take photo',
      });
    }
  };

  const pickFromGallery = async (documentType: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant gallery permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadDocument(documentType, result.assets[0].uri, 'gallery-photo.jpg');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick from gallery',
      });
    }
  };

  const pickFromFiles = async (documentType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadDocument(documentType, result.assets[0].uri, result.assets[0].name);
      }
    } catch (error) {
      console.error('File pick error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick file',
      });
    }
  };

  const uploadDocument = async (documentType: string, uri: string, fileName: string) => {
    try {
      setUploading(documentType);

      console.log(`📤 Uploading ${documentType}...`);
      const response = await uploadKYCDocument(uri, documentType);
      console.log(`📤 Upload response:`, JSON.stringify(response));

      const uploadedUrl = response?.data?.url || (response as any)?.url || uri;

      // Mark as uploaded locally
      setNewDocuments(prev => [
        ...prev.filter(doc => doc.type !== documentType),
        { type: documentType, uri: uploadedUrl, name: fileName },
      ]);

      // Also add to uploadedDocuments since the backend already saved it
      setUploadedDocuments(prev => [
        ...prev.filter(doc => doc.type !== documentType),
        { type: documentType, documentUrl: uploadedUrl, verificationStatus: 'pending' },
      ]);

      Toast.show({
        type: 'success',
        text1: 'Saved',
        text2: `${DOCUMENT_TYPES.find(d => d.id === documentType)?.name || documentType} uploaded and saved`,
      });
    } catch (error: any) {
      console.error(`❌ Upload ${documentType} failed:`, error?.response?.data || error.message);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.response?.data?.message || error.message || 'Failed to upload document',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    try {
      // Documents are already saved individually on upload
      // This just triggers a verification review request
      const allDocs = [
        ...uploadedDocuments.map(doc => ({ type: doc.type, documentUrl: doc.documentUrl })),
        ...newDocuments
          .filter(doc => !uploadedDocuments.some(u => u.type === doc.type))
          .map(doc => ({ type: doc.type, documentUrl: doc.uri })),
      ];

      if (allDocs.length === 0) {
        Toast.show({ type: 'error', text1: 'No Documents', text2: 'Please upload at least one document' });
        return;
      }

      setSubmitting(true);
      const response = await submitKYCDocuments(allDocs);

      if (response.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Documents submitted for verification' });
        if (isSetupFlow) {
          // During vendor setup flow, navigate to add first product
          navigation.reset({
            index: 0,
            routes: [{ name: 'AddProduct', params: { isSetupFlow: true } }],
          });
        } else {
          navigation.goBack();
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error.response?.data?.message || 'Failed to submit documents',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getDocumentStatus = (documentType: string) => {
    const uploaded = uploadedDocuments.find(doc => doc.type === documentType);
    const newDoc = newDocuments.find(doc => doc.type === documentType);
    
    if (uploaded?.verificationStatus === 'verified') {
      return { status: 'verified', color: '#10B981', icon: 'checkmark-circle' };
    } else if (uploaded?.verificationStatus === 'rejected') {
      return { status: 'rejected', color: '#EF4444', icon: 'close-circle' };
    } else if (uploaded || newDoc) {
      return { status: 'pending', color: '#F59E0B', icon: 'time' };
    }
    return null;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#CC3366" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View className="bg-white px-6 py-4 flex-row items-center border-b border-gray-100">
        {!isSetupFlow && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
          >
            <Icon name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
        )}
        <Text className="text-lg font-bold text-gray-900 flex-1">
          {isSetupFlow ? 'Verify Your Identity' : 'KYC Verification'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        {verificationStatus === 'verified' && (
          <View className="mx-6 mt-6 bg-green-50 rounded-2xl p-4 flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mr-3">
              <Icon name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-green-900">Verified</Text>
              <Text className="text-sm text-green-700 mt-1">
                Your account has been verified
              </Text>
            </View>
          </View>
        )}

        {verificationStatus === 'pending' && uploadedDocuments.length > 0 && (
          <View className="mx-6 mt-6 bg-orange-50 rounded-2xl p-4 flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-orange-100 items-center justify-center mr-3">
              <Icon name="time" size={24} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-orange-900">Under Review</Text>
              <Text className="text-sm text-orange-700 mt-1">
                Your documents are being reviewed
              </Text>
            </View>
          </View>
        )}

        {verificationStatus === 'rejected' && (
          <View className="mx-6 mt-6 bg-red-50 rounded-2xl p-4 flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mr-3">
              <Icon name="close-circle" size={24} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-red-900">Verification Failed</Text>
              <Text className="text-sm text-red-700 mt-1">
                Please upload valid documents
              </Text>
            </View>
          </View>
        )}

        {/* Verification Progress */}
        <View className="mx-6 mt-6 bg-white rounded-2xl p-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <Text className="text-base font-bold text-gray-900 mb-3">Verification Progress</Text>

          {/* Progress Bar */}
          {(() => {
            const isDocDone = (docId: string) =>
              uploadedDocuments.some(d => d.type === docId) ||
              newDocuments.some(d => d.type === docId);

            let progress = 0;
            if (isDocDone('NIN')) progress += 50;
            if (isDocDone('CAC')) progress += 16.67;
            if (isDocDone('UTILITY_BILL')) progress += 16.67;
            if (hasSocialMedia) progress += 16.66;
            progress = Math.round(progress);

            return (
              <>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm text-gray-500">Account Verification</Text>
                  <Text className="text-sm font-bold text-pink-500">{progress}%</Text>
                </View>
                <View className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#22C55E' : '#CC3366' }}
                  />
                </View>

                {/* Individual items */}
                {[
                  { label: 'NIN Verification', done: isDocDone('NIN'), weight: '50%' },
                  { label: 'CAC Certificate', done: isDocDone('CAC'), weight: '16.67%' },
                  { label: 'Utility Bill', done: isDocDone('UTILITY_BILL'), weight: '16.67%' },
                  { label: 'Social Media Links', done: hasSocialMedia, weight: '16.66%' },
                ].map((item, idx) => (
                  <View key={idx} className="flex-row items-center mb-2">
                    <View className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${item.done ? 'bg-green-500' : 'bg-gray-200'}`}>
                      {item.done ? (
                        <Icon name="checkmark" size={14} color="#FFFFFF" />
                      ) : (
                        <Icon name="ellipse-outline" size={14} color="#9CA3AF" />
                      )}
                    </View>
                    <Text className={`flex-1 text-sm ${item.done ? 'text-green-700 font-semibold' : 'text-gray-600'}`}>
                      {item.label}
                    </Text>
                    <Text className="text-xs text-gray-400">{item.weight}</Text>
                  </View>
                ))}
              </>
            );
          })()}
        </View>

        {/* Instructions */}
        <View className="mx-6 mt-6 bg-blue-50 rounded-2xl p-4">
          <View className="flex-row items-start">
            <Icon name="information-circle" size={20} color="#3B82F6" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-blue-900 mb-2">
                Upload Clear Documents
              </Text>
              <Text className="text-xs text-blue-700 leading-5">
                • Ensure all text is readable{'\n'}
                • Documents should not be expired{'\n'}
                • Upload original documents only{'\n'}
                • File size should not exceed 5MB
              </Text>
            </View>
          </View>
        </View>

        {/* Document Upload Cards */}
        <View className="px-6 mt-6 pb-24">
          <Text className="text-base font-bold text-gray-900 mb-4">Upload Documents</Text>

          {DOCUMENT_TYPES.map((docType) => {
            const serverDoc = getDocumentStatus(docType.id);
            const newDoc = newDocuments.find(doc => doc.type === docType.id);
            const isUploading = uploading === docType.id;
            const isUploaded = !!serverDoc || !!newDoc;
            const isVerified = serverDoc?.status === 'verified';
            const isRejected = serverDoc?.status === 'rejected';

            return (
              <View
                key={docType.id}
                className={`rounded-2xl p-4 mb-3 ${isUploaded ? 'bg-white border-2' : 'bg-white'}`}
                style={{
                  borderColor: isVerified ? '#22C55E' : isUploaded ? '#10B981' : 'transparent',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-start mb-3">
                  <View className={`w-12 h-12 rounded-xl items-center justify-center ${isUploaded ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Icon name={isUploaded ? 'checkmark-circle' : docType.icon} size={20} color={isUploaded ? '#10B981' : '#6B7280'} />
                  </View>

                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center">
                      <Text className="text-base font-bold text-gray-900 flex-1">
                        {docType.name}
                      </Text>

                      {isVerified ? (
                        <View className="bg-green-100 px-2 py-1 rounded">
                          <Text className="text-xs font-semibold text-green-600">Verified</Text>
                        </View>
                      ) : isUploaded ? (
                        <View className="bg-green-100 px-2 py-1 rounded">
                          <Text className="text-xs font-semibold text-green-600">Uploaded</Text>
                        </View>
                      ) : isRejected ? (
                        <View className="bg-red-100 px-2 py-1 rounded">
                          <Text className="text-xs font-semibold text-red-600">Rejected</Text>
                        </View>
                      ) : docType.required ? (
                        <View className="bg-red-100 px-2 py-1 rounded">
                          <Text className="text-xs font-semibold text-red-600">Required</Text>
                        </View>
                      ) : (
                        <View className="bg-gray-100 px-2 py-1 rounded">
                          <Text className="text-xs font-semibold text-gray-500">Optional</Text>
                        </View>
                      )}
                    </View>

                    <Text className="text-sm text-gray-500 mt-1">
                      {docType.description}
                    </Text>
                  </View>
                </View>

                {/* Server status (pending review / rejected) */}
                {serverDoc && !isVerified && (
                  <View className="flex-row items-center mb-3">
                    <Icon name={serverDoc.icon} size={16} color={serverDoc.color} />
                    <Text className="text-sm font-semibold ml-2" style={{ color: serverDoc.color }}>
                      {serverDoc.status === 'rejected' ? 'Rejected - Please reupload' : 'Pending Review'}
                    </Text>
                  </View>
                )}

                {/* Show green preview if document was just uploaded this session */}
                {newDoc && (
                  <View className="mb-3 bg-green-50 rounded-xl p-3 flex-row items-center">
                    <View className="w-10 h-10 rounded-lg bg-green-100 items-center justify-center mr-3">
                      <Icon name="checkmark-circle" size={20} color="#10B981" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-green-800">Successfully Uploaded</Text>
                      <Text className="text-xs text-green-600 mt-0.5" numberOfLines={1}>
                        {newDoc.name}
                      </Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => handlePickDocument(docType.id)}
                  disabled={isUploading || isVerified}
                  className={`py-3 rounded-xl items-center ${
                    isVerified ? 'bg-gray-100' : isUploaded ? 'bg-green-50' : 'bg-pink-50'
                  }`}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#CC3366" />
                  ) : (
                    <View className="flex-row items-center">
                      <Icon
                        name={isVerified ? 'checkmark-circle' : isUploaded ? 'refresh' : 'cloud-upload-outline'}
                        size={18}
                        color={isVerified ? '#9CA3AF' : isUploaded ? '#10B981' : '#CC3366'}
                      />
                      <Text className={`font-semibold ml-2 ${
                        isVerified ? 'text-gray-400' : isUploaded ? 'text-green-600' : 'text-pink-500'
                      }`}>
                        {isVerified ? 'Verified' : isUploaded ? 'Replace Document' : 'Upload Document'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Social Media Note */}
          <View className={`rounded-2xl p-4 mb-3 ${hasSocialMedia ? 'bg-white border-2' : 'bg-white'}`}
            style={{
              borderColor: hasSocialMedia ? '#10B981' : 'transparent',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View className="flex-row items-start">
              <View className={`w-12 h-12 rounded-xl items-center justify-center ${hasSocialMedia ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Icon name={hasSocialMedia ? 'checkmark-circle' : 'logo-instagram'} size={20} color={hasSocialMedia ? '#10B981' : '#6B7280'} />
              </View>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text className="text-base font-bold text-gray-900 flex-1">Social Media Links</Text>
                  {hasSocialMedia ? (
                    <View className="bg-green-100 px-2 py-1 rounded">
                      <Text className="text-xs font-semibold text-green-600">Added</Text>
                    </View>
                  ) : (
                    <View className="bg-orange-100 px-2 py-1 rounded">
                      <Text className="text-xs font-semibold text-orange-600">16.66%</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-gray-500 mt-1">
                  {hasSocialMedia ? 'Social media links are configured' : 'Add your social media links in Storefront Setup'}
                </Text>
              </View>
            </View>
            {!hasSocialMedia && (
              <TouchableOpacity
                onPress={() => navigation.navigate('VendorStorefrontSetup' as never)}
                className="mt-3 py-3 rounded-xl items-center bg-pink-50"
              >
                <View className="flex-row items-center">
                  <Icon name="arrow-forward" size={18} color="#CC3366" />
                  <Text className="font-semibold ml-2 text-pink-500">Go to Storefront Setup</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Submit Button — docs are saved individually, this requests verification review */}
      {verificationStatus !== 'verified' && (uploadedDocuments.length > 0 || newDocuments.length > 0) && (
        <View className="absolute bottom-0 left-0 right-0 bg-white px-6 py-4 border-t border-gray-100">
          <Text className="text-xs text-gray-500 text-center mb-2">
            Documents are saved automatically. Submit when you're ready for review.
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className="bg-pink-500 py-4 rounded-xl items-center"
            style={{
              shadowColor: '#CC3366',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold text-base">Submit for Verification</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Skip option during setup flow */}
      {isSetupFlow && (
        <View className="bg-white px-6 pb-6 border-t border-gray-100" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 5 }}>
          <View className="flex-row items-center bg-pink-50 rounded-lg px-4 py-3 mt-4 mb-3">
            <Icon name="information-circle" size={18} color="#CC3366" />
            <Text className="text-xs text-gray-600 ml-2 flex-1">
              You can always verify your identity later from your profile settings.
            </Text>
          </View>
          <TouchableOpacity
            className="py-3.5 rounded-xl items-center"
            style={{ backgroundColor: '#CC3366' }}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'AddProduct', params: { isSetupFlow: true } }],
              });
            }}
          >
            <Text className="text-white font-semibold text-base">Skip for Now</Text>
          </TouchableOpacity>
        </View>
      )}

      <Toast />
    </SafeAreaView>
  );
};

export default VendorKYCVerificationScreen;