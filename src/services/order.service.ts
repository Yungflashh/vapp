import api, { handleApiError } from './api.config';

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
// ORDER API FUNCTIONS
// ============================================================

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
  } catch (error)
 {
    console.error('❌ Verify payment error:', error);
    handleApiError(error);
    throw error;
  }
};

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

/**
 * Get single vendor order by ID
 */
export const getVendorOrderById = async (orderId: string): Promise<{ success: boolean; data: { order: Order } }> => {
  try {
    console.log('📦 Fetching vendor order:', orderId);
    
    const response = await api.get(`/orders/vendor/orders/${orderId}`);
    
    console.log('✅ Vendor order fetched');
    
    return response.data;
  } catch (error) {
    console.error('❌ Get vendor order error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Simulate webhook for vendor order status update (Development only)
 */
export const simulateWebhook = async (orderId: string, statusCode: string) => {
  try {
    console.log('⚙️ Simulating webhook for order:', orderId, 'status:', statusCode);
    const response = await api.post('/webhooks/vendor/simulate', {
      orderId,
      statusCode,
    });
    console.log('✅ Webhook simulation successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Webhook simulation error:', error);
    handleApiError(error);
    throw error;
  }
};
