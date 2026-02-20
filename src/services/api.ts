import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL
const API_URL = 'http://10.192.171.66:5000/api/v1';
// const API_URL = 'http://192.168.242.66:5000/api/v1';

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      // You can emit an event here to redirect to login
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH API ENDPOINTS
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
      role: 'vendor' | 'customer';
    };
  };
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: 'vendor' | 'customer';
  hearAbout?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    email: string;
  };
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: any;
  };
}

export interface VendorSetupRequest {
  shopName: string;
  shopDescription: string;
  shopCategory: string;
  country: string;
}


// ============================================================
// ADD THESE FUNCTIONS TO YOUR api.ts FILE
// Place them in the VENDOR PROFILE MANAGEMENT section
// ============================================================

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


// ============================================================
// ADD THIS TO YOUR EXISTING @/services/api.ts FILE
// Place it before the "HELPER FUNCTIONS" section
// ============================================================

// ============================================================
// ACCOUNT DELETION API
// ============================================================

export interface DeletionRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason: string;
  additionalDetails?: string;
  createdAt: string;
  processedAt?: string;
  rejectionReason?: string;
}

/**
 * Request account deletion
 */
export const requestAccountDeletion = async (data: {
  reason: string;
  additionalDetails?: string;
}): Promise<{
  success: boolean;
  message: string;
  data: {
    deletionRequest: DeletionRequest;
  };
}> => {
  try {
    console.log('🗑️ Requesting account deletion...');
    
    const response = await api.post('/account-deletion/request', data);
    
    console.log('✅ Account deletion requested');
    
    return response.data;
  } catch (error) {
    console.error('❌ Request account deletion error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get deletion request status
 */
export const getDeletionRequestStatus = async (): Promise<{
  success: boolean;
  data: {
    hasRequest: boolean;
    deletionRequest: DeletionRequest | null;
  };
}> => {
  try {
    console.log('🔍 Checking deletion request status...');
    
    const response = await api.get('/account-deletion/status');
    
    console.log('✅ Deletion status fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get deletion status error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Cancel deletion request
 */
export const cancelDeletionRequest = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log('❌ Cancelling deletion request...');
    
    const response = await api.post('/account-deletion/cancel');
    
    console.log('✅ Deletion request cancelled');
    
    return response.data;
  } catch (error) {
    console.error('❌ Cancel deletion request error:', error);
    handleApiError(error);
    throw error;
  }
};

export interface PaymentSetupRequest {
  accountName: string;
  accountNumber: string;
  bankName: string;
  businessPhone: string;
  websiteLink?: string;
}


// ============================================================
// PRODUCT INTERFACES
// ============================================================

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  discountPercentage?: string;
  rating: number;
  reviews: number;
  images: string[];
  thumbnail: string;
  category: string;
  categoryId: string;
  vendor: {
    id: string;
    name: string;
    image?: string;
  };
  stock: number;
  inStock: boolean;
  tags: string[];
  productType: string;
  isFeatured?: boolean;
  isAffiliate?: boolean;
  affiliateCommission?: number;
  totalSales?: number;
  views?: number;
  weight?: number;
  keyFeatures?: string[];
  specifications?: {
    [key: string]: string;
  };
  requiresLicense?: boolean;
  licenseType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: {
    products: Product[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface SingleProductResponse {
  success: boolean;
  message: string;
  data: Product;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  vendorId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
}

// ============================================================
// CATEGORY INTERFACES
// ============================================================

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parent?: string | null;
  level: number;
  order: number;
  productCount: number;
  isActive: boolean;
  subcategories?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesResponse {
  success: boolean;
  message?: string;
  data: {
    categories: Category[];
  };
}

export interface SingleCategoryResponse {
  success: boolean;
  message?: string;
  data: {
    category: Category;
    subcategories: Category[];
  };
}

// ============================================================
// VENDOR INTERFACES
// ============================================================

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
}

export interface VendorsResponse {
  success: boolean;
  message: string;
  data: {
    vendors: Vendor[];
    total: number;
  };
}


// ============================================================
// VENDOR PROFILE MANAGEMENT - ADD THESE TO api.ts
// ============================================================

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

// ============================================================
// AUTH FUNCTIONS
// ============================================================

/**
 * Login user
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  try {
    console.log('🔐 Attempting login with:', { email: data.email });
    
    const response = await api.post<LoginResponse>('/auth/login', data);
    
    console.log('✅ Login successful:', response.data);
    
    // Store tokens and user data
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken, user } = response.data.data;
      
      if (accessToken) {
        await AsyncStorage.setItem('authToken', accessToken);
        console.log('💾 Access token stored');
      }
      
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
        console.log('💾 Refresh token stored');
      }
      
      if (user) {
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        console.log('💾 User data stored:', user);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Login error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Register new user
 */
export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  try {
    console.log('📝 Attempting registration:', { email: data.email, role: data.role });
    
    const response = await api.post<RegisterResponse>('/auth/register', data);
    
    console.log('✅ Registration successful:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Registration error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Verify OTP code
 */
export const verifyOTP = async (data: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
  try {
    console.log('🔢 Verifying OTP for:', data.email);
    
    const response = await api.post<VerifyOTPResponse>('/auth/verify-email', data);
    
    console.log('✅ OTP verification successful:', response.data);
    
    // Store token if provided
    if (response.data.success && response.data.data.token) {
      await AsyncStorage.setItem('authToken', response.data.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Resend OTP code
 */
export const resendOTP = async (email: string) => {
  try {
    console.log('📧 Resending OTP to:', email);
    
    const response = await api.post('/auth/resend-otp', { email });
    
    console.log('✅ OTP resent successfully:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    handleApiError(error);
    throw error;
  }
};



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
export const getNigerianBanks = () => {
  return [
    { name: 'Access Bank', code: '044' },
    { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
    { name: 'United Bank for Africa (UBA)', code: '033' },
    { name: 'Zenith Bank', code: '057' },
    { name: 'First Bank of Nigeria', code: '011' },
    { name: 'Fidelity Bank', code: '070' },
    { name: 'Union Bank', code: '032' },
    { name: 'Stanbic IBTC Bank', code: '221' },
    { name: 'Sterling Bank', code: '232' },
    { name: 'Polaris Bank', code: '076' },
    { name: 'Wema Bank', code: '035' },
    { name: 'Keystone Bank', code: '082' },
    { name: 'Ecobank', code: '050' },
    { name: 'FCMB', code: '214' },
    { name: 'Heritage Bank', code: '030' },
    { name: 'Providus Bank', code: '101' },
    { name: 'Jaiz Bank', code: '301' },
    { name: 'Kuda Bank', code: '090267' },
    { name: 'Opay', code: '100004' },
    { name: 'PalmPay', code: '100033' },
  ];
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    console.log('🚪 Logging out...');
    
    await api.post('/auth/logout');
    
    // Clear local storage
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
    
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('❌ Logout error:', error);
    // Still clear local storage even if API call fails
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  }
};

/**
 * Get current user data
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('❌ Get current user error:', error);
    handleApiError(error);
    throw error;
  }
};

// ============================================================
// PRODUCT API FUNCTIONS
// ============================================================

/**
 * Get all products with optional filters
 */
export const getProducts = async (filters?: ProductFilters): Promise<ProductsResponse> => {
  try {
    console.log('📦 Fetching products with filters:', filters);
    
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.rating) params.append('rating', filters.rating.toString());
    if (filters?.inStock !== undefined) params.append('inStock', filters.inStock.toString());
    if (filters?.vendorId) params.append('vendorId', filters.vendorId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sort) params.append('sort', filters.sort);
    
    const response = await api.get<ProductsResponse>(
      `/products?${params.toString()}`
    );
    
    console.log('✅ Products fetched:', response.data.data.products.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get products error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get recommended products for home page
 */
export const getRecommendedProducts = async (limit: number = 10): Promise<ProductsResponse> => {
  try {
    console.log('🌟 Fetching recommended products...');
    
    const response = await api.get<ProductsResponse>(
      `/products/recommended?limit=${limit}`
    );
    
    console.log('✅ Recommended products fetched:', response.data.data.products.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get recommended products error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get featured/popular products for home page
 */
export const getFeaturedProducts = async (limit: number = 10): Promise<ProductsResponse> => {
  try {
    console.log('⭐ Fetching featured products...');
    
    const response = await api.get<ProductsResponse>(
      `/products/featured?limit=${limit}`
    );
    
    console.log('✅ Featured products fetched:', response.data.data.products.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get featured products error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (
  categoryId: string,
  page: number = 1,
  limit: number = 20
): Promise<ProductsResponse> => {
  try {
    console.log('📂 Fetching products for category:', categoryId);
    
    const response = await api.get<ProductsResponse>(
      `/products/category/${categoryId}?page=${page}&limit=${limit}`
    );
    
    console.log('✅ Category products fetched:', response.data.data.products.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get category products error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get single product by ID
 */
export const getProductById = async (productId: string): Promise<SingleProductResponse> => {
  try {
    console.log('🔍 Fetching product:', productId);
    
    const response = await api.get<SingleProductResponse>(`/products/${productId}`);
    
    console.log('✅ Product fetched:', response.data.data.name);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get product error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Search products
 */
export const searchProducts = async (
  query: string,
  page: number = 1,
  limit: number = 20
): Promise<ProductsResponse> => {
  try {
    console.log('🔎 Searching products:', query);
    
    const response = await api.get<ProductsResponse>(
      `/products/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
    );
    
    console.log('✅ Search results:', response.data.data.products.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Search products error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get new arrivals
 */
export const getNewArrivals = async (limit: number = 10): Promise<ProductsResponse> => {
  try {
    console.log('🆕 Fetching new arrivals...');
    
    const response = await api.get<ProductsResponse>(
      `/products/new-arrivals?limit=${limit}`
    );
    
    console.log('✅ New arrivals fetched:', response.data.data.products.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get new arrivals error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get products on sale
 */
export const getProductsOnSale = async (limit: number = 10): Promise<ProductsResponse> => {
  try {
    console.log('💰 Fetching products on sale...');
    
    const response = await api.get<ProductsResponse>(
      `/products/on-sale?limit=${limit}`
    );
    
    console.log('✅ Sale products fetched:', response.data.data.products.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get sale products error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get products by vendor
 */
export const getVendorProducts = async (
  vendorId: string,
  page: number = 1,
  limit: number = 20
): Promise<ProductsResponse> => {
  try {
    console.log('👤 Fetching vendor products:', vendorId);
    
    const response = await api.get<ProductsResponse>(
      `/products/vendor/${vendorId}?page=${page}&limit=${limit}`
    );
    
    console.log('✅ Vendor products fetched:', response.data.data.products.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get vendor products error:', error);
    handleApiError(error);
    throw error;
  }
};


// ADD THIS TO YOUR api.ts FILE - in the PRODUCT API FUNCTIONS section

/**
 * Get authenticated vendor's own products (for inventory management)
 */
export const getMyProducts = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    status?: 'active' | 'inactive' | 'draft';
    productType?: 'physical' | 'digital';
    search?: string;
    sort?: 'price_asc' | 'price_desc' | 'name' | 'stock' | 'newest' | 'oldest';
  }
): Promise<ProductsResponse & { stats?: any }> => {
  try {
    console.log('📦 Fetching my products...');
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.productType) params.append('productType', filters.productType);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sort) params.append('sort', filters.sort);
    
    const response = await api.get<ProductsResponse & { stats?: any }>(
      `/products/my-products?${params.toString()}`
    );
    
    console.log('✅ My products fetched:', response.data.data.products.length);
    if (response.data.data.stats) {
      console.log('📊 Stats:', response.data.data.stats);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Get my products error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get trending products
 */
export const getTrendingProducts = async (limit: number = 10): Promise<ProductsResponse> => {
  try {
    console.log('📈 Fetching trending products...');
    
    const response = await api.get<ProductsResponse>(
      `/products/trending?limit=${limit}`
    );
    
    console.log('✅ Trending products fetched:', response.data.data.products.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get trending products error:', error);
    handleApiError(error);
    throw error;
  }
};

// ============================================================
// CATEGORY API FUNCTIONS
// ============================================================

/**
 * Get all categories (flat list)
 */
export const getCategories = async (parent?: string | null): Promise<CategoriesResponse> => {
  try {
    console.log('📂 Fetching categories...');
    
    let url = '/categories';
    if (parent !== undefined) {
      url += `?parent=${parent === null ? 'null' : parent}`;
    }
    
    const response = await api.get<CategoriesResponse>(url);
    
    console.log('✅ Categories fetched:', response.data.data.categories.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get categories error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get category tree (hierarchical with subcategories)
 */
export const getCategoryTree = async (): Promise<CategoriesResponse> => {
  try {
    console.log('🌳 Fetching category tree...');
    
    const response = await api.get<CategoriesResponse>('/categories/tree');
    
    console.log('✅ Category tree fetched:', response.data.data.categories.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get category tree error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get single category by slug
 */
export const getCategoryBySlug = async (slug: string): Promise<SingleCategoryResponse> => {
  try {
    console.log('📂 Fetching category:', slug);
    
    const response = await api.get<SingleCategoryResponse>(`/categories/${slug}`);
    
    console.log('✅ Category fetched:', response.data.data.category.name);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get category error:', error);
    handleApiError(error);
    throw error;
  }
};

// ============================================================
// VENDOR API FUNCTIONS
// ============================================================

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


/**
 * 
 * Cart Functions
 */


export interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    status: string;
    quantity: number;
  };
  quantity: number;
  price: number;
  variant?: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
}

export interface CartResponse {
  success: boolean;
  message?: string;
  data: {
    cart: Cart;
  };
}

/**
 * Get user's cart
 */
export const getCart = async (): Promise<CartResponse> => {
  try {
    console.log('🛒 Fetching cart...');
    
    const response = await api.get<CartResponse>('/cart');
    
    console.log('✅ Cart fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get cart error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Add item to cart
 */
export const addToCart = async (
  productId: string,
  quantity: number,
  variant?: string
): Promise<CartResponse> => {
  try {
    console.log('➕ Adding to cart:', { productId, quantity, variant });
    
    const response = await api.post<CartResponse>('/cart/add', {
      productId,
      quantity,
      variant,
    });
    
    console.log('✅ Item added to cart');
    
    return response.data;
  } catch (error) {
    console.error('❌ Add to cart error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (
  itemId: string,
  quantity: number
): Promise<CartResponse> => {
  try {
    console.log('🔄 Updating cart item:', { itemId, quantity });
    
    const response = await api.put<CartResponse>(`/cart/items/${itemId}`, {
      quantity,
    });
    
    console.log('✅ Cart item updated');
    
    return response.data;
  } catch (error) {
    console.error('❌ Update cart item error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (itemId: string): Promise<CartResponse> => {
  try {
    console.log('🗑️ Removing from cart:', itemId);
    
    const response = await api.delete<CartResponse>(`/cart/items/${itemId}`);
    
    console.log('✅ Item removed from cart');
    
    return response.data;
  } catch (error) {
    console.error('❌ Remove from cart error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Clear cart
 */
export const clearCart = async (): Promise<CartResponse> => {
  try {
    console.log('🗑️ Clearing cart...');
    
    const response = await api.delete<CartResponse>('/cart');
    
    console.log('✅ Cart cleared');
    
    return response.data;
  } catch (error) {
    console.error('❌ Clear cart error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Apply coupon to cart
 */
export const applyCoupon = async (code: string): Promise<CartResponse> => {
  try {
    console.log('🎟️ Applying coupon:', code);
    
    const response = await api.post<CartResponse>('/cart/coupon/apply', {
      code,
    });
    
    console.log('✅ Coupon applied');
    
    return response.data;
  } catch (error) {
    console.error('❌ Apply coupon error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Remove coupon from cart
 */
export const removeCoupon = async (): Promise<CartResponse> => {
  try {
    console.log('🎟️ Removing coupon...');
    
    const response = await api.delete<CartResponse>('/cart/coupon');
    
    console.log('✅ Coupon removed');
    
    return response.data;
  } catch (error) {
    console.error('❌ Remove coupon error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get cart summary
 */
export const getCartSummary = async () => {
  try {
    console.log('📊 Fetching cart summary...');
    
    const response = await api.get('/cart/summary');
    
    console.log('✅ Cart summary fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get cart summary error:', error);
    handleApiError(error);
    throw error;
  }
};



// Add to existing api.ts file

// ============================================================
// ADDRESS INTERFACES
// ============================================================

export interface Address {
  _id: string;
  user: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressesResponse {
  success: boolean;
  message?: string;
  data: {
    addresses: Address[];
  };
}

export interface SingleAddressResponse {
  success: boolean;
  message?: string;
  data: {
    address: Address;
  };
}

export interface CreateAddressRequest {
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  isDefault?: boolean;
}

// ============================================================
// ORDER INTERFACES
// ============================================================

export interface ShippingAddress {
  fullName?: string; // Made optional
  phone?: string; // Made optional
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

export interface OrderItem {
  product: string;
  productName: string;
  productImage?: string;
  variant?: string;
  quantity: number;
  price: number;
  vendor: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled' | 'failed';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'paystack' | 'wallet' | 'cash_on_delivery';
  paymentReference?: string;
  shippingAddress: ShippingAddress;
  couponCode?: string;
  notes?: string;
  deliveryType?: string;
  trackingNumber?: string;
  shipmentId?: string;
  courier?: string;
  cancelReason?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  shippingAddress: ShippingAddress;
  paymentMethod: 'paystack' | 'wallet' | 'cash_on_delivery';
  deliveryType?: 'standard' | 'express' | 'same_day' | 'pickup'; // Added 'pickup'
  notes?: string;
}


export interface OrderResponse {
  success: boolean;
  message?: string;
  data: {
    order: Order;
    payment?: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  };
}

export interface OrdersResponse {
  success: boolean;
  message?: string;
  data: {
    orders: Order[];
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================
// ADDRESS API FUNCTIONS
// ============================================================

/**
 * Get all user addresses
 */
export const getAddresses = async (): Promise<AddressesResponse> => {
  try {
    console.log('📍 Fetching addresses...');
    
    const response = await api.get<AddressesResponse>('/addresses');
    
    console.log('✅ Addresses fetched:', response.data.data.addresses.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get addresses error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get single address by ID
 */
export const getAddressById = async (addressId: string): Promise<SingleAddressResponse> => {
  try {
    console.log('📍 Fetching address:', addressId);
    
    const response = await api.get<SingleAddressResponse>(`/addresses/${addressId}`);
    
    console.log('✅ Address fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get address error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Create new address
 */
export const createAddress = async (data: CreateAddressRequest): Promise<SingleAddressResponse> => {
  try {
    console.log('📍 Creating address:', data.label);
    
    const response = await api.post<SingleAddressResponse>('/addresses', data);
    
    console.log('✅ Address created');
    
    return response.data;
  } catch (error) {
    console.error('❌ Create address error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Update address
 */
export const updateAddress = async (
  addressId: string,
  data: Partial<CreateAddressRequest>
): Promise<SingleAddressResponse> => {
  try {
    console.log('📍 Updating address:', addressId);
    
    const response = await api.put<SingleAddressResponse>(`/addresses/${addressId}`, data);
    
    console.log('✅ Address updated');
    
    return response.data;
  } catch (error) {
    console.error('❌ Update address error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Delete address
 */
export const deleteAddress = async (addressId: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('📍 Deleting address:', addressId);
    
    const response = await api.delete(`/addresses/${addressId}`);
    
    console.log('✅ Address deleted');
    
    return response.data;
  } catch (error) {
    console.error('❌ Delete address error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Set default address
 */
export const setDefaultAddress = async (addressId: string): Promise<SingleAddressResponse> => {
  try {
    console.log('📍 Setting default address:', addressId);
    
    const response = await api.patch<SingleAddressResponse>(`/addresses/${addressId}/default`);
    
    console.log('✅ Default address set');
    
    return response.data;
  } catch (error) {
    console.error('❌ Set default address error:', error);
    handleApiError(error);
    throw error;
  }
};

// ============================================================
// ORDER API FUNCTIONS
// ============================================================


/**
 * API SERVICE FIX: Update getDeliveryRates to accept and send full address
 * 
 * File: services/api.ts
 */


export const getDeliveryRates = async (
  city: string,
  state: string,
  street?: string,      // ✅ ADD THIS
  fullName?: string,    // ✅ ADD THIS  
  phone?: string        // ✅ ADD THIS
): Promise<{ 
  success: boolean; 
  data: { 
    rates: any[];
    vendorCount?: number;
    multiVendor?: boolean;
    source?: string;
  } 
}> => {
  // ✅ BUILD QUERY PARAMS WITH FULL ADDRESS
  const params = new URLSearchParams({
    city,
    state,
  });

  // Add optional parameters if provided
  if (street) params.append('street', street);
  if (fullName) params.append('fullName', fullName);
  if (phone) params.append('phone', phone);

  const response = await api.get(`/orders/delivery-rates?${params.toString()}`);
  return response.data;
};



/**
 * Create new order from cart
 */
export const createOrder = async (data: CreateOrderRequest): Promise<OrderResponse> => {
  try {
    console.log('📦 Creating order...');
    
    const response = await api.post<OrderResponse>('/orders', data);
    
    console.log('✅ Order created:', response.data.data.order.orderNumber);
    
    return response.data;
  } catch (error) {
    console.error('❌ Create order error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get user orders
 */
export const getOrders = async (
  page: number = 1,
  limit: number = 10,
  status?: string
): Promise<OrdersResponse> => {
  try {
    console.log('📦 Fetching orders...');
    
    let url = `/orders/my-orders?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    
    const response = await api.get<OrdersResponse>(url);
    
    console.log('✅ Orders fetched:', response.data.data.orders.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get orders error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get single order by ID
 */
export const getOrderById = async (orderId: string): Promise<{ success: boolean; data: { order: Order } }> => {
  try {
    console.log('📦 Fetching order:', orderId);
    
    const response = await api.get(`/orders/${orderId}`);
    
    console.log('✅ Order fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get order error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Track order shipment
 */
export const trackOrder = async (orderId: string): Promise<{ success: boolean; data: { order: Order; tracking: any } }> => {
  try {
    console.log('📍 Tracking order:', orderId);
    
    const response = await api.get(`/orders/${orderId}/track`);
    
    console.log('✅ Order tracked');
    
    return response.data;
  } catch (error) {
    console.error('❌ Track order error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Cancel order
 */
export const cancelOrder = async (orderId: string, cancelReason: string): Promise<{ success: boolean; message: string; data: { order: Order } }> => {
  try {
    console.log('📦 Cancelling order:', orderId);
    
    const response = await api.post(`/orders/${orderId}/cancel`, { cancelReason });
    
    console.log('✅ Order cancelled');
    
    return response.data;
  } catch (error) {
    console.error('❌ Cancel order error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Verify payment
 */
export const verifyPayment = async (reference: string): Promise<{ success: boolean; message: string; data: { order: Order } }> => {
  try {
    console.log('💳 Verifying payment:', reference);
    
    const response = await api.get(`/orders/payment/verify/${reference}`);
    
    console.log('✅ Payment verified');
    
    return response.data;
  } catch (error) {
    console.error('❌ Verify payment error:', error);
    handleApiError(error);
    throw error;
  }
};




// ============================================================
// ADD THIS TO YOUR api.ts FILE
// Place it after the ORDER API FUNCTIONS section
// ============================================================

// VENDOR ORDER API FUNCTIONS

/**
 * Get vendor's orders (authenticated vendor)
 */
export const getVendorOrders = async (
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<OrdersResponse> => {
  try {
    console.log('📦 Fetching vendor orders...');
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) params.append('status', status);
    
    const response = await api.get<OrdersResponse>(
      `/orders/vendor/orders?${params.toString()}`
    );
    
    console.log('✅ Vendor orders fetched:', response.data.data.orders.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get vendor orders error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Update order status (vendor)
 */
export const updateVendorOrderStatus = async (
  orderId: string,
  status: string
): Promise<{ success: boolean; message: string; data: { order: Order } }> => {
  try {
    console.log('📦 Updating order status:', { orderId, status });
    
    const response = await api.put(`/orders/${orderId}/status`, { status });
    
    console.log('✅ Order status updated');
    
    return response.data;
  } catch (error) {
    console.error('❌ Update order status error:', error);
    handleApiError(error);
    throw error;
  }
};


// ============================================================
// WISHLIST API FUNCTIONS
// Add these to your existing @/services/api.ts file
// ============================================================

export interface WishlistItem {
  _id: string;
  product: Product;
  addedAt: Date;
}

export interface WishlistResponse {
  success: boolean;
  message?: string;
  data: {
    wishlist: {
      _id: string;
      user: string;
      items: Product[];
      createdAt: string;
      updatedAt: string;
    };
  };
}

/**
 * Get user's wishlist
 */
export const getWishlist = async (): Promise<WishlistResponse> => {
  try {
    console.log('❤️ Fetching wishlist...');
    
    const response = await api.get<WishlistResponse>('/wishlist');
    
    console.log('✅ Wishlist fetched:', response.data.data.wishlist.items.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get wishlist error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Add product to wishlist
 */
export const addToWishlist = async (productId: string): Promise<WishlistResponse> => {
  try {
    console.log('➕ Adding to wishlist:', productId);
    
    const response = await api.post<WishlistResponse>('/wishlist/add', {
      productId,
    });
    
    console.log('✅ Added to wishlist');
    
    return response.data;
  } catch (error) {
    console.error('❌ Add to wishlist error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Remove product from wishlist
 */
export const removeFromWishlist = async (productId: string): Promise<WishlistResponse> => {
  try {
    console.log('➖ Removing from wishlist:', productId);
    
    const response = await api.delete<WishlistResponse>(`/wishlist/remove/${productId}`);
    
    console.log('✅ Removed from wishlist');
    
    return response.data;
  } catch (error) {
    console.error('❌ Remove from wishlist error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Check if product is in wishlist
 */
export const isInWishlist = async (productId: string): Promise<{ success: boolean; data: { inWishlist: boolean } }> => {
  try {
    const response = await api.get(`/wishlist/check/${productId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Check wishlist error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Clear entire wishlist
 */
export const clearWishlist = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🗑️ Clearing wishlist...');
    
    const response = await api.delete('/wishlist/clear');
    
    console.log('✅ Wishlist cleared');
    
    return response.data;
  } catch (error) {
    console.error('❌ Clear wishlist error:', error);
    handleApiError(error);
    throw error;
  }
};


// ============================================================
// AFFILIATE API - ADD TO @/services/api.ts
// ============================================================

// Add these interfaces to your api.ts file

export interface AffiliateDashboard {
  summary: {
    affiliateCode: string;
    totalClicks: number;
    totalConversions: number;
    totalEarnings: number;
    conversionRate: string;
    availableBalance: number;
  };
  links: any[];
  topPerformingLinks: any[];
  recentConversions: any[];
}

export interface AffiliateEarnings {
  period: string;
  summary: {
    totalOrders: number;
    totalEarnings: number;
    averageCommission: number;
  };
  earningsByDate: Array<{
    date: string;
    orders: number;
    earnings: number;
  }>;
}

export interface AffiliateLeaderboard {
  period: string;
  metric: string;
  leaderboard: Array<{
    rank: number;
    affiliate: {
      id: string;
      name: string;
      code: string;
    };
    stats: {
      clicks: number;
      conversions: number;
      earnings: number;
    };
    score: number;
  }>;
}

// ============================================================
// AFFILIATE API FUNCTIONS
// ============================================================

/**
 * Activate affiliate account
 */
export const activateAffiliate = async (): Promise<{
  success: boolean;
  message: string;
  data: {
    affiliateCode: string;
    wallet: {
      balance: number;
    };
  };
}> => {
  try {
    console.log('💎 Activating affiliate account...');
    
    const response = await api.post('/affiliate/activate');
    
    console.log('✅ Affiliate activated:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Activate affiliate error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Generate affiliate link for product
 */
export const generateAffiliateLink = async (
  productId: string
): Promise<{
  success: boolean;
  message: string;
  data: {
    affiliateLink: {
      id: string;
      code: string;
      url: string;
      product: {
        id: string;
        name: string;
        price: number;
        commission: number;
      };
      clicks: number;
      conversions: number;
      totalEarned: number;
    };
  };
}> => {
  try {
    console.log('🔗 Generating affiliate link for product:', productId);
    
    const response = await api.post('/affiliate/generate-link', { productId });
    
    console.log('✅ Affiliate link generated');
    
    return response.data;
  } catch (error) {
    console.error('❌ Generate affiliate link error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Generate general affiliate link
 */
export const generateGeneralAffiliateLink = async (): Promise<{
  success: boolean;
  message: string;
  data: {
    affiliateLink: {
      id: string;
      code: string;
      url: string;
      clicks: number;
      conversions: number;
      totalEarned: number;
    };
  };
}> => {
  try {
    console.log('🔗 Generating general affiliate link...');
    
    const response = await api.post('/affiliate/generate-general-link');
    
    console.log('✅ General affiliate link generated');
    
    return response.data;
  } catch (error) {
    console.error('❌ Generate general affiliate link error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get affiliate dashboard
 */
export const getAffiliateDashboard = async (): Promise<{
  success: boolean;
  data: AffiliateDashboard;
}> => {
  try {
    console.log('📊 Fetching affiliate dashboard...');
    
    const response = await api.get('/affiliate/dashboard');
    
    console.log('✅ Affiliate dashboard fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get affiliate dashboard error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get affiliate earnings
 */
export const getAffiliateEarnings = async (
  period: '7days' | '30days' | '90days' | 'all' = '30days'
): Promise<{
  success: boolean;
  data: AffiliateEarnings;
}> => {
  try {
    console.log('💰 Fetching affiliate earnings...');
    
    const response = await api.get(`/affiliate/earnings?period=${period}`);
    
    console.log('✅ Affiliate earnings fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get affiliate earnings error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get affiliate leaderboard
 */
export const getAffiliateLeaderboard = async (
  period: '7days' | '30days' | 'all' = '30days',
  metric: 'earnings' | 'conversions' | 'clicks' = 'earnings'
): Promise<{
  success: boolean;
  data: AffiliateLeaderboard;
}> => {
  try {
    console.log('🏆 Fetching affiliate leaderboard...');
    
    const response = await api.get(`/affiliate/leaderboard?period=${period}&metric=${metric}`);
    
    console.log('✅ Affiliate leaderboard fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get affiliate leaderboard error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Track affiliate click
 */
export const trackAffiliateClick = async (code: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log('👆 Tracking affiliate click:', code);
    
    const response = await api.get(`/affiliate/track/${code}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Track affiliate click error:', error);
    handleApiError(error);
    throw error;
  }
};



// ============================================================
// REWARDS API - ADD TO @/services/api.ts
// ============================================================

// Add these interfaces to your api.ts file

export interface UserPoints {
  points: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  pointsToNextTier: number;
  badges: string[];
  achievements: string[];
}

export interface AvailableReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  available: boolean;
}

export interface PointsHistory {
  date: string;
  type: string;
  description: string;
  points: number;
}

export interface Leaderboard {
  type: string;
  period: string;
  leaderboard: Array<{
    rank: number;
    user: {
      id: string;
      name: string;
      badges: string[];
    };
    score: number;
  }>;
}

// ============================================================
// REWARDS API FUNCTIONS
// ============================================================

/**
 * Get user points and rewards tier
 */
export const getUserPoints = async (): Promise<{
  success: boolean;
  data: UserPoints;
}> => {
  try {
    console.log('🏆 Fetching user points...');
    
    const response = await api.get('/rewards/points');
    
    console.log('✅ User points fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get user points error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get points history
 */
export const getPointsHistory = async (): Promise<{
  success: boolean;
  data: {
    history: PointsHistory[];
  };
}> => {
  try {
    console.log('📜 Fetching points history...');
    
    const response = await api.get('/rewards/points/history');
    
    console.log('✅ Points history fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get points history error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Redeem points for cash
 */
export const redeemPoints = async (
  points: number
): Promise<{
  success: boolean;
  message: string;
  data: {
    pointsRedeemed: number;
    cashValue: number;
    remainingPoints: number;
    newBalance: number;
  };
}> => {
  try {
    console.log('💰 Redeeming points:', points);
    
    const response = await api.post('/rewards/points/redeem', { points });
    
    console.log('✅ Points redeemed successfully');
    
    return response.data;
  } catch (error) {
    console.error('❌ Redeem points error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get available rewards
 */
export const getAvailableRewards = async (): Promise<{
  success: boolean;
  data: {
    userPoints: number;
    rewards: AvailableReward[];
  };
}> => {
  try {
    console.log('🎁 Fetching available rewards...');
    
    const response = await api.get('/rewards/available');
    
    console.log('✅ Available rewards fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get available rewards error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async (
  period: 'all-time' | '7days' | '30days' = 'all-time',
  type: 'points' | 'purchases' = 'points'
): Promise<{
  success: boolean;
  data: Leaderboard;
}> => {
  try {
    console.log('🏅 Fetching leaderboard...');
    
    const response = await api.get(`/rewards/leaderboard?period=${period}&type=${type}`);
    
    console.log('✅ Leaderboard fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get leaderboard error:', error);
    handleApiError(error);
    throw error;
  }
};


// ============================================================
// ADD THIS TO YOUR api.ts FILE
// Place it after the ORDER API FUNCTIONS section
// ============================================================

// ============================================================
// DIGITAL PRODUCTS INTERFACES
// ============================================================

export interface DigitalProduct {
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

export interface DigitalProductsResponse {
  success: boolean;
  message?: string;
  data: {
    digitalProducts: DigitalProduct[];
    total: number;
  };
}

export interface DownloadResponse {
  success: boolean;
  data: {
    downloadUrl: string;
    product: {
      name: string;
      fileSize?: number;
      fileType?: string;
      version?: string;
    };
    expiresAt?: string;
  };
}

// ============================================================
// DIGITAL PRODUCTS API FUNCTIONS
// ============================================================

/**
 * Get user's digital products
 */
export const getDigitalProducts = async (): Promise<DigitalProductsResponse> => {
  try {
    console.log('📥 Fetching digital products...');
    
    const response = await api.get<DigitalProductsResponse>('/orders/my-digital-products');
    
    console.log('✅ Digital products fetched:', response.data.data.digitalProducts.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get digital products error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get download link for a digital product
 */
export const getDigitalProductDownload = async (
  orderId: string,
  itemId: string
): Promise<DownloadResponse> => {
  try {
    console.log('📥 Getting download link:', { orderId, itemId });
    
    const response = await api.get<DownloadResponse>(
      `/orders/${orderId}/download/${itemId}`
    );
    
    console.log('✅ Download link retrieved');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get download link error:', error);
    handleApiError(error);
    throw error;
  }
};


// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Handle API errors and format error messages
 */
const handleApiError = (error: any) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    if (axiosError.response) {
      // Server responded with error
      console.error('Server Error:', {
        status: axiosError.response.status,
        data: axiosError.response.data,
      });
    } else if (axiosError.request) {
      // Request made but no response
      console.error('Network Error: No response received');
    } else {
      // Error setting up request
      console.error('Request Error:', axiosError.message);
    }
  } else {
    console.error('Unknown Error:', error);
  }
};

/**
 * Get stored auth token
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Get stored user data
 */
export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

// Export the axios instance for custom requests
export default api;