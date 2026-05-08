import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '@/navigation/navigationRef';

function handleUrl(url: string) {
  try {
    // Support both https://vendorspotng.com/... and vendorspot://...
    let path = '';

    if (url.startsWith('vendorspot://')) {
      path = url.replace('vendorspot://', '/');
    } else {
      const parsed = new URL(url);
      path = parsed.pathname + parsed.search;
    }

    // /products/:id
    const productMatch = path.match(/^\/products\/([^/?]+)/);
    if (productMatch) {
      navigate('ProductDetails', { productId: productMatch[1] });
      return;
    }

    // /vendor/:id or /shops/:id
    const vendorMatch = path.match(/^\/(?:vendor|shops)\/([^/?]+)/);
    if (vendorMatch) {
      navigate('VendorProfile', { vendorId: vendorMatch[1] });
      return;
    }

    // /affiliate/:code  — store code so checkout can use it, navigate to home
    const affiliateMatch = path.match(/^\/affiliate\/([^/?]+)/);
    if (affiliateMatch) {
      const code = affiliateMatch[1];
      AsyncStorage.setItem('pendingAffiliateCode', code).catch(() => {});
      navigate('Affiliate' as any, { referralCode: code });
      return;
    }

    // /products?ref=CODE  — store affiliate code and open products
    const urlObj = new URL(url.startsWith('vendorspot://') ? `https://vendorspotng.com${path}` : url);
    const ref = urlObj.searchParams.get('ref');
    if (ref) {
      AsyncStorage.setItem('pendingAffiliateCode', ref).catch(() => {});
      navigate('ProductDetails' as any, { affiliateCode: ref });
    }
  } catch (e) {
    if (__DEV__) console.warn('[deepLinkHandler] Failed to parse URL:', url, e);
  }
}

export function setupDeepLinking() {
  // Handle link when app is already open
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleUrl(url);
  });

  // Handle link that opened the app from a cold start
  Linking.getInitialURL().then((url) => {
    if (url) handleUrl(url);
  });

  return () => subscription.remove();
}
