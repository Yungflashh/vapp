import api, { handleApiError } from './api.config';

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
