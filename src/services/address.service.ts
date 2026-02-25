import api, { handleApiError } from './api.config';

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
    validated?: boolean;
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
