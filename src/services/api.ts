import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL
const API_URL = 'http://192.168.133.66:5000/api/v1';

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
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
    
    const response = await api.post<VerifyOTPResponse>('/auth/verify-otp', data);
    
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

/**
 * Setup vendor business information
 */
export const setupVendor = async (data: VendorSetupRequest) => {
  try {
    console.log('🏪 Setting up vendor:', data.shopName);
    
    const response = await api.post('/vendor/setup', data);
    
    console.log('✅ Vendor setup successful:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Vendor setup error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Setup payment information
 */
export const setupPayment = async (data: PaymentSetupRequest) => {
  try {
    console.log('💳 Setting up payment:', data.accountName);
    
    const response = await api.post('/vendor/payment-setup', data);
    
    console.log('✅ Payment setup successful:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Payment setup error:', error);
    handleApiError(error);
    throw error;
  }
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