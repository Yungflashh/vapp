import api, { handleApiError } from './api.config';

export interface VendorSetupRequest {
  shopName: string;
  shopDescription: string;
  shopCategory: string;
  country: string;
}

export interface VendorProfileRequest {
  businessName: string;
  businessDescription: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  businessPhone: string;
  businessEmail: string;
  businessWebsite?: string;
}


export interface PayoutDetailsRequest {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  businessPhone?: string;
  websiteLink?: string;
}

export interface Vendor {
  id: string;
  name: string;
  description?: string;
  image: string;
  coverImage?: string;
  location?: string;
  rating: number;
  reviews: number;
  totalSales?: number;
  productCount?: number;
  verified: boolean;
  followers?: number;
  isFollowing?: boolean;
  phone?: string;
  responseRate?: number;
}

export interface VendorsResponse {
  success: boolean;
  message: string;
  data: {
    vendors: Vendor[];
    total: number;
  };
}

/**
 * Upload KYC document
 * This endpoint should be created on your backend
 */
export const uploadKYCDocument = async (
  documentUri: string,
  documentType: string
): Promise<{
  success: boolean;
  data: {
    url: string;
  };
}> => {
  try {
    console.log(`📄 Uploading KYC document (${documentType})...`);
    
    // Create FormData
    const formData = new FormData();
    
    // Get file extension from URI
    const uriParts = documentUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('document', {
      uri: documentUri,
      name: `kyc-${documentType}-${Date.now()}.${fileType}`,
      type: fileType === 'pdf' ? 'application/pdf' : `image/${fileType}`,
    } as any);
    
    formData.append('type', documentType);
    
    // Upload document
    const response = await api.post('/upload/kyc-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ KYC document uploaded:', response.data.data.url);
    
    return response.data;
  } catch (error) {
    console.error('❌ Upload KYC document error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Submit KYC documents for verification
 * POST /api/v1/vendor/kyc/upload
 */
export const submitKYCDocuments = async (
  documents: Array<{ type: string; documentUrl: string }>
) => {
  try {
    console.log('📝 Submitting KYC documents for verification...');
    
    const response = await api.post('/vendor/kyc/upload', { documents });
    
    console.log('✅ KYC documents submitted');
    
    return response.data;
  } catch (error) {
    console.error('❌ Submit KYC documents error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Update vendor profile (authenticated vendor)
 */
export const updateVendorProfile = async (data: {
  businessName?: string;
  businessDescription?: string;
  businessLogo?: string;
  businessBanner?: string;
  businessAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  businessPhone?: string;
  businessEmail?: string;
  businessWebsite?: string;
  category?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}) => {
  try {
    console.log('📝 Updating vendor profile...');
    
    const response = await api.put('/vendor/profile', data);
    
    console.log('✅ Vendor profile updated');
    
    return response.data;
  } catch (error) {
    console.error('❌ Update vendor profile error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Upload vendor image (logo or banner)
 */
export const uploadVendorImage = async (
  imageUri: string,
  type: 'logo' | 'banner'
): Promise<{
  success: boolean;
  data: {
    url: string;
  };
}> => {
  try {
    console.log(`📸 Uploading vendor ${type}...`);
    
    // Create FormData
    const formData = new FormData();
    
    // Get file extension from URI
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('image', {
      uri: imageUri,
      name: `vendor-${type}-${Date.now()}.${fileType}`,
      type: `image/${fileType}`,
    } as any);
    
    formData.append('type', type);
    
    // Upload image
    const response = await api.post('/upload/vendor-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ Image uploaded:', response.data.data.url);
    
    return response.data;
  } catch (error) {
    console.error('❌ Upload vendor image error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get own vendor profile (authenticated)
 */
export const getMyVendorProfile = async () => {
  try {
    console.log('👤 Fetching my vendor profile...');
    
    const response = await api.get('/vendor/profile');
    
    console.log('✅ My vendor profile fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get my vendor profile error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get followed vendors
 */
export const getFollowedVendors = async (
  page: number = 1,
  limit: number = 20
) => {
  try {
    console.log('👥 Fetching followed vendors...');
    
    const response = await api.get(`/vendor/following?page=${page}&limit=${limit}`);
    
    console.log('✅ Followed vendors fetched:', response.data.data.vendors.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get followed vendors error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Create vendor profile (replaces setupVendor)
 * POST /api/v1/vendor/profile
 */
export const createVendorProfile = async (data: VendorProfileRequest) => {
  try {
    console.log('🏪 Creating vendor profile:', data.businessName);
    
    const response = await api.post('/vendor/profile', data);
    
    console.log('✅ Vendor profile created:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Create vendor profile error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get vendor dashboard analytics
 * Returns all dashboard data including rewards tier from User.points
 */
export const getVendorDashboard = async () => {
  try {
    console.log('📊 Fetching vendor dashboard...');
    
    const response = await api.get('/vendor/dashboard');
    
    console.log('✅ Dashboard fetched successfully');
    console.log('📈 Today\'s sales:', response.data.data.overview.todaySales);
    
    if (response.data.data.rewardsTier) {
      console.log('🏆 Tier:', response.data.data.rewardsTier.tier);
      console.log('💎 Points:', response.data.data.rewardsTier.points);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Get vendor dashboard error:', error);
    handleApiError(error);
    throw error;
  }
};

export const getVendorAnalytics = async (
  period: '7days' | '30days' | '90days' | '1year' = '30days'
) => {
  try {
    console.log(`📈 Fetching vendor analytics (${period})...`);
    
    const response = await api.get(`/vendor/analytics?period=${period}`);
    
    console.log('✅ Analytics fetched successfully');
    console.log('📊 Total orders:', response.data.data.summary.totalOrders);
    console.log('💰 Total revenue:', response.data.data.summary.totalRevenue);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get vendor analytics error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Update payout details (replaces setupPayment)
 * PUT /api/v1/vendor/payout-details
 */
export const updatePayoutDetails = async (data: PayoutDetailsRequest) => {
  try {
    console.log('💳 Updating payout details:', data.accountName);
    
    const response = await api.put('/vendor/payout-details', data);
    
    console.log('✅ Payout details updated:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Update payout details error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get Nigerian bank codes (helper function)
 */
/**
 * Get Nigerian banks list from Paystack API
 * Falls back to a comprehensive static list if API fails
 */
export const getNigerianBanks = async (): Promise<{ name: string; code: string }[]> => {
  try {
    const response = await api.get('/vendor/banks');
    if (response.data?.success && response.data?.data?.banks) {
      return response.data.data.banks;
    }
  } catch (error) {
    console.log('Using static banks list (API unavailable)');
  }

  // Comprehensive fallback list from Paystack
  return getStaticNigerianBanks();
};

/**
 * Static Nigerian banks list (comprehensive Paystack-compatible list)
 */
export const getStaticNigerianBanks = () => {
  return [
    { name: 'Access Bank', code: '044' },
    { name: 'Access Bank (Diamond)', code: '063' },
    { name: 'Carbon', code: '565' },
    { name: 'Citibank Nigeria', code: '023' },
    { name: 'Ecobank Nigeria', code: '050' },
    { name: 'Fidelity Bank', code: '070' },
    { name: 'First Bank of Nigeria', code: '011' },
    { name: 'First City Monument Bank (FCMB)', code: '214' },
    { name: 'Globus Bank', code: '00103' },
    { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
    { name: 'Heritage Bank', code: '030' },
    { name: 'Jaiz Bank', code: '301' },
    { name: 'Keystone Bank', code: '082' },
    { name: 'Kuda Bank', code: '090267' },
    { name: 'Lotus Bank', code: '303' },
    { name: 'Moniepoint MFB', code: '50515' },
    { name: 'Opay', code: '100004' },
    { name: 'Paga', code: '100002' },
    { name: 'PalmPay', code: '100033' },
    { name: 'Parallex Bank', code: '104' },
    { name: 'Paycom (9PSB)', code: '120001' },
    { name: 'Polaris Bank', code: '076' },
    { name: 'Providus Bank', code: '101' },
    { name: 'Rubies MFB', code: '125' },
    { name: 'Stanbic IBTC Bank', code: '221' },
    { name: 'Standard Chartered Bank', code: '068' },
    { name: 'Sterling Bank', code: '232' },
    { name: 'SunTrust Bank', code: '100' },
    { name: 'TAJ Bank', code: '302' },
    { name: 'Titan Trust Bank', code: '102' },
    { name: 'Union Bank of Nigeria', code: '032' },
    { name: 'United Bank for Africa (UBA)', code: '033' },
    { name: 'Unity Bank', code: '215' },
    { name: 'VFD Microfinance Bank', code: '566' },
    { name: 'Wema Bank', code: '035' },
    { name: 'Zenith Bank', code: '057' },
  ];
};

/**
 * Get top vendors for home screen
 */
export const getTopVendors = async (
  limit: number = 10,
  sortBy: 'rating' | 'sales' | 'products' = 'rating'
): Promise<VendorsResponse> => {
  try {
    console.log('👥 Fetching top vendors...');
    
    const response = await api.get<VendorsResponse>(
      `/vendor/top?limit=${limit}&sortBy=${sortBy}`
    );
    
    console.log('✅ Top vendors fetched:', response.data.data.vendors.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get top vendors error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get public vendor profile with products
 */
export const getVendorProfile = async (vendorId: string) => {
  try {
    console.log('🏪 Fetching vendor profile:', vendorId);
    
    const response = await api.get(`/vendor/public/${vendorId}`);
    
    console.log('✅ Vendor profile fetched:', response.data.data.vendor.businessName);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get vendor profile error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Follow a vendor
 */
export const followVendor = async (vendorId: string) => {
  try {
    console.log('➕ Following vendor:', vendorId);
    
    const response = await api.post(`/vendor/${vendorId}/follow`);
    
    console.log('✅ Vendor followed successfully');
    
    return response.data;
  } catch (error) {
    console.error('❌ Follow vendor error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Unfollow a vendor
 */
export const unfollowVendor = async (vendorId: string) => {
  try {
    console.log('➖ Unfollowing vendor:', vendorId);
    
    const response = await api.delete(`/vendor/${vendorId}/follow`);
    
    console.log('✅ Vendor unfollowed successfully');
    
    return response.data;
  } catch (error) {
    console.error('❌ Unfollow vendor error:', error);
    handleApiError(error);
    throw error;
  }
};
