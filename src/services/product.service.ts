import api, { handleApiError } from './api.config';

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
    verified?: boolean;
    isPremium?: boolean;
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

export const getSimilarProducts = async (
  productId: string,
  limit = 10
): Promise<any> => {
  try {
    const response = await api.get(`/products/${productId}/similar`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('❌ Get similar products error:', error);
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
 * Get new arrivals (products created in the last 2 weeks, sorted newest first)
 */
export const getNewArrivals = async (limit: number = 10): Promise<ProductsResponse> => {
  try {
    console.log('🆕 Fetching new arrivals...');

    const response = await api.get<ProductsResponse>('/products', {
      params: { sort: 'newest', limit },
    });

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
    
console.log('✅ My products fetched:', response.data.data?.products?.length);
    if (response.data.stats) {
      console.log('📊 Stats:', response.data.stats);
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

/**
 * Update product
 */
export const updateProduct = async (productId: string, data: any) => {
    try {
        console.log('📝 Updating product:', productId);
        const response = await api.put(`/products/${productId}`, data);
        console.log('✅ Product updated successfully');
        return response.data;
    } catch (error) {
        console.error('❌ Update product error:', error);
        handleApiError(error);
        throw error;
    }
};

/**
 * Get flash sale products (products with >= 10% discount)
 * Fetches popular products and filters client-side for those with significant discounts
 */
export const getFlashSaleProducts = async (limit: number = 20): Promise<Product[]> => {
  try {
    // Try dedicated flash sale endpoint first
    const response = await api.get<ProductsResponse>('/products/flash-sales', {
      params: { limit },
    });
    if (response.data.success && response.data.data.products?.length > 0) {
      return response.data.data.products;
    }

    // Fallback: get on-sale products filtered for >=10% off
    const fallback = await api.get<ProductsResponse>('/products/on-sale', {
      params: { limit },
    });
    if (fallback.data.success && fallback.data.data.products) {
      return fallback.data.data.products.filter((p) => {
        if (!p.originalPrice || p.originalPrice <= p.price) return false;
        return ((p.originalPrice - p.price) / p.originalPrice) >= 0.10;
      });
    }

    return [];
  } catch (error) {
    console.error('Get flash sale products error:', error);
    return [];
  }
};

/**
 * Delete product
 */
export const deleteProduct = async (productId: string) => {
  try {
    console.log('🗑️ Deleting product:', productId);
    const response = await api.delete(`/products/${productId}`);
    console.log('✅ Product deleted successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Delete product error:', error);
    handleApiError(error);
    throw error;
  }
};
