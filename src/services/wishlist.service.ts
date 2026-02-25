import api, { handleApiError } from './api.config';
import { Product } from './product.service';

// ============================================================
// WISHLIST API FUNCTIONS
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
      items: any[];
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
