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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getMyVendorProfile } from '@/services/api';
import api from '@/services/api';
import Toast from 'react-native-toast-message';

interface KYCDocument {
  type: string;
  documentUrl: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  rejectionReason?: string;
}

const DOCUMENT_TYPES = [
  {
    id: 'CAC',
    name: 'CAC Certificate',
    description: 'Business registration certificate',
    icon: 'document-text-outline',
    required: true,
  },
  {
    id: 'ID_CARD',
    name: 'ID Card',
    description: 'National ID or Voter\'s card',
    icon: 'card-outline',
    required: true,
  },
  {
    id: 'UTILITY_BILL',
    name: 'Utility Bill',
    description: 'Proof of address (PHCN, Water bill)',
    icon: 'receipt-outline',
    required: false,
  },
  {
    id: 'PASSPORT',
    name: 'Passport Photo',
    description: 'Clear passport photograph',
    icon: 'person-outline',
    required: false,
  },
];

const VendorKYCVerificationScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [uploadedDocuments, setUploadedDocuments] = useState<KYCDocument[]>([]);
  const [newDocuments, setNewDocuments] = useState<{ type: string; uri: string; name: string }[]>([]);

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const response = await getMyVendorProfile();
      
      if (response.success) {
        const profile = response.data.vendorProfile;
        
        setVerificationStatus(profile.verificationStatus);
        setUploadedDocuments(profile.kycDocuments || []);
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
      
      const formData = new FormData();
      
      formData.append('document', {
        uri,
        name: fileName,
        type: 'image/jpeg',
      } as any);
      
      formData.append('type', documentType);
      
      const response = await api.post('/upload/kyc-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        setNewDocuments([
          ...newDocuments.filter(doc => doc.type !== documentType),
          {
            type: documentType,
            uri: response.data.data.url,
            name: fileName,
          },
        ]);
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Document uploaded successfully',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.response?.data?.message || 'Failed to upload document',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    try {
      if (newDocuments.length === 0) {
        Toast.show({
          type: 'error',
          text1: 'No Documents',
          text2: 'Please upload at least one document',
        });
        return;
      }

      // Check if required documents are uploaded
      const hasCAC = newDocuments.some(doc => doc.type === 'CAC') || uploadedDocuments.some(doc => doc.type === 'CAC');
      const hasID = newDocuments.some(doc => doc.type === 'ID_CARD') || uploadedDocuments.some(doc => doc.type === 'ID_CARD');

      if (!hasCAC || !hasID) {
        Toast.show({
          type: 'error',
          text1: 'Missing Required Documents',
          text2: 'Please upload CAC Certificate and ID Card',
        });
        return;
      }

      setSubmitting(true);
      
      const documents = newDocuments.map(doc => ({
        type: doc.type,
        documentUrl: doc.uri,
      }));
      
      const response = await api.post('/vendor/kyc/upload', { documents });
      
      if (response.data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Documents submitted for verification',
        });
        
        navigation.goBack();
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
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EC4899" />
        </View>
      </SafeAreaView>
    );
  }

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
        <Text className="text-lg font-bold text-gray-900 flex-1">KYC Verification</Text>
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
            const status = getDocumentStatus(docType.id);
            const isUploading = uploading === docType.id;

            return (
              <View
                key={docType.id}
                className="bg-white rounded-2xl p-4 mb-3"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-start mb-3">
                  <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center">
                    <Icon name={docType.icon} size={20} color="#6B7280" />
                  </View>

                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center">
                      <Text className="text-base font-bold text-gray-900 flex-1">
                        {docType.name}
                      </Text>
                      
                      {docType.required && (
                        <View className="bg-red-100 px-2 py-1 rounded">
                          <Text className="text-xs font-semibold text-red-600">Required</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text className="text-sm text-gray-500 mt-1">
                      {docType.description}
                    </Text>
                  </View>
                </View>

                {status && (
                  <View className="flex-row items-center mb-3">
                    <Icon name={status.icon} size={16} color={status.color} />
                    <Text className="text-sm font-semibold ml-2" style={{ color: status.color }}>
                      {status.status === 'verified' ? 'Verified' : 
                       status.status === 'rejected' ? 'Rejected - Reupload' : 
                       'Pending Review'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => handlePickDocument(docType.id)}
                  disabled={isUploading || (status?.status === 'verified')}
                  className={`py-3 rounded-xl items-center ${
                    status?.status === 'verified' ? 'bg-gray-100' : 'bg-pink-50'
                  }`}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#EC4899" />
                  ) : (
                    <View className="flex-row items-center">
                      <Icon 
                        name={status ? 'refresh' : 'cloud-upload-outline'} 
                        size={18} 
                        color={status?.status === 'verified' ? '#9CA3AF' : '#EC4899'}
                      />
                      <Text className={`font-semibold ml-2 ${
                        status?.status === 'verified' ? 'text-gray-400' : 'text-pink-500'
                      }`}>
                        {status ? (status.status === 'verified' ? 'Verified' : 'Reupload') : 'Upload Document'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Submit Button */}
      {verificationStatus !== 'verified' && newDocuments.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-white px-6 py-4 border-t border-gray-100">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            className="bg-pink-500 py-4 rounded-xl items-center"
            style={{
              shadowColor: '#EC4899',
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

      <Toast />
    </SafeAreaView>
  );
};

export default VendorKYCVerificationScreen;