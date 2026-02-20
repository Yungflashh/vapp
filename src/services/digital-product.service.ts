import api, { handleApiError } from './api.config';

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
