// services/tracking.service.ts
import api from './api.config';

export interface RefreshStatusParams {
  orderId: string;
  statusCode?: 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'completed' | 'cancelled';
}

export interface WebhookHistory {
  vendor: string;
  trackingNumber: string;
  packageStatus: Array<{
    status: string;
    datetime: string;
  }>;
  events: any[];
}

/**
 * Refresh order status (for sandbox testing)
 * Customers and vendors can trigger webhook simulation for their own orders
 */
export const refreshOrderStatus = async (params: RefreshStatusParams) => {
  try {
    console.log('🔄 Refreshing order status:', params);
    
    const response = await api.post(`/webhooks/refresh-status/${params.orderId}`, {
      statusCode: params.statusCode,
    });
    
    console.log('✅ Status refreshed:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Refresh status error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get webhook history for an order
 * Shows all status updates received from ShipBubble
 */
export const getWebhookHistory = async (orderId: string) => {
  try {
    console.log('📜 Fetching webhook history for:', orderId);
    
    const response = await api.get(`/webhooks/history/${orderId}`);
    
    console.log('✅ Webhook history retrieved');
    return response.data;
  } catch (error: any) {
    console.error('❌ Webhook history error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Vendor: Simulate webhook for their own order
 */
export const vendorSimulateWebhook = async (orderId: string, statusCode: string) => {
  try {
    console.log('🧪 Vendor simulating webhook:', { orderId, statusCode });
    
    const response = await api.post('/webhooks/vendor/simulate', {
      orderId,
      statusCode,
    });
    
    console.log('✅ Webhook simulated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Vendor webhook simulation error:', error.response?.data || error.message);
    throw error;
  }
};