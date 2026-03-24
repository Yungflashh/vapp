import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from './product.service';

// ============================================================
// LOCAL GUEST STORAGE — cart, wishlist, addresses
// All data is stored in AsyncStorage until the guest registers,
// then synced to the backend.
// ============================================================

const GUEST_CART_KEY = 'guest_cart';
const GUEST_WISHLIST_KEY = 'guest_wishlist';
const GUEST_ADDRESSES_KEY = 'guest_addresses';

export interface GuestCartItem {
  productId: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    stock?: number;
  };
  quantity: number;
  variant?: string;
}

export interface GuestAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
}

// ==================== CART ====================

export const getGuestCart = async (): Promise<GuestCartItem[]> => {
  try {
    const data = await AsyncStorage.getItem(GUEST_CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addToGuestCart = async (
  product: { _id: string; id?: string; name: string; price: number; images: string[]; stock?: number },
  quantity: number,
  variant?: string
): Promise<GuestCartItem[]> => {
  const cart = await getGuestCart();
  const pid = product._id || product.id || '';
  const existing = cart.find(item => item.productId === pid && item.variant === variant);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      productId: pid,
      product: { _id: pid, name: product.name, price: product.price, images: product.images, stock: product.stock },
      quantity,
      variant,
    });
  }

  await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  return cart;
};

export const updateGuestCartItem = async (productId: string, quantity: number, variant?: string): Promise<GuestCartItem[]> => {
  const cart = await getGuestCart();
  const item = cart.find(i => i.productId === productId && i.variant === (variant || undefined));
  if (item) {
    item.quantity = quantity;
  }
  await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  return cart;
};

export const removeFromGuestCart = async (productId: string, variant?: string): Promise<GuestCartItem[]> => {
  let cart = await getGuestCart();
  cart = cart.filter(i => !(i.productId === productId && i.variant === (variant || undefined)));
  await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  return cart;
};

export const clearGuestCart = async (): Promise<void> => {
  await AsyncStorage.removeItem(GUEST_CART_KEY);
};

export const getGuestCartCount = async (): Promise<number> => {
  const cart = await getGuestCart();
  return cart.length;
};

export const getGuestCartTotal = (cart: GuestCartItem[]): number => {
  return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
};

// ==================== WISHLIST ====================

export const getGuestWishlist = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(GUEST_WISHLIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addToGuestWishlist = async (productId: string): Promise<string[]> => {
  const wishlist = await getGuestWishlist();
  if (!wishlist.includes(productId)) {
    wishlist.push(productId);
    await AsyncStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
  }
  return wishlist;
};

export const removeFromGuestWishlist = async (productId: string): Promise<string[]> => {
  let wishlist = await getGuestWishlist();
  wishlist = wishlist.filter(id => id !== productId);
  await AsyncStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
  return wishlist;
};

export const isInGuestWishlist = async (productId: string): Promise<boolean> => {
  const wishlist = await getGuestWishlist();
  return wishlist.includes(productId);
};

export const clearGuestWishlist = async (): Promise<void> => {
  await AsyncStorage.removeItem(GUEST_WISHLIST_KEY);
};

// ==================== ADDRESSES ====================

export const getGuestAddresses = async (): Promise<GuestAddress[]> => {
  try {
    const data = await AsyncStorage.getItem(GUEST_ADDRESSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addGuestAddress = async (address: Omit<GuestAddress, 'id'>): Promise<GuestAddress[]> => {
  const addresses = await getGuestAddresses();
  const newAddr: GuestAddress = { ...address, id: `guest_addr_${Date.now()}` };
  if (newAddr.isDefault) {
    addresses.forEach(a => { a.isDefault = false; });
  }
  addresses.push(newAddr);
  await AsyncStorage.setItem(GUEST_ADDRESSES_KEY, JSON.stringify(addresses));
  return addresses;
};

export const removeGuestAddress = async (id: string): Promise<GuestAddress[]> => {
  let addresses = await getGuestAddresses();
  addresses = addresses.filter(a => a.id !== id);
  await AsyncStorage.setItem(GUEST_ADDRESSES_KEY, JSON.stringify(addresses));
  return addresses;
};

export const clearGuestAddresses = async (): Promise<void> => {
  await AsyncStorage.removeItem(GUEST_ADDRESSES_KEY);
};

// ==================== SYNC TO BACKEND ====================

import api from './api.config';

/**
 * After guest registers and gets a token, sync all local data to backend.
 * Call this right after guestRegister() succeeds.
 */
export const syncGuestDataToBackend = async (): Promise<void> => {
  try {
    // Sync cart
    const cart = await getGuestCart();
    for (const item of cart) {
      try {
        await api.post('/cart/add', {
          productId: item.productId,
          quantity: item.quantity,
          variant: item.variant,
        });
      } catch (err) {
        console.warn('Failed to sync cart item:', item.productId, err);
      }
    }

    // Sync wishlist
    const wishlist = await getGuestWishlist();
    for (const productId of wishlist) {
      try {
        await api.post('/wishlist/add', { productId });
      } catch (err) {
        console.warn('Failed to sync wishlist item:', productId, err);
      }
    }

    // Sync addresses
    const addresses = await getGuestAddresses();
    for (const addr of addresses) {
      try {
        await api.post('/addresses', {
          label: addr.label,
          fullName: addr.fullName,
          phone: addr.phone,
          street: addr.street,
          city: addr.city,
          state: addr.state,
          country: addr.country,
          postalCode: addr.postalCode,
          isDefault: addr.isDefault,
        });
      } catch (err) {
        console.warn('Failed to sync address:', addr.label, err);
      }
    }

    // Clear all local guest data
    await clearGuestCart();
    await clearGuestWishlist();
    await clearGuestAddresses();

    console.log('✅ Guest data synced to backend');
  } catch (error) {
    console.error('❌ Error syncing guest data:', error);
  }
};
