// screens/PaymentWebView.tsx
// ✅ UPDATED: Payment-first flow — calls confirmPayment to create order after payment
// Install: npx expo install react-native-webview

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '@/navigation';
import { confirmPayment } from '@/services/order.service';

// Add this to your RootStackParamList:
// PaymentWebView: {
//   paymentUrl: string;
//   reference: string;
//   provider: 'paystack' | 'flutterwave';
//   checkoutSnapshot: any;
// };

type PaymentWebViewRouteProp = RouteProp<RootStackParamList, 'PaymentWebView'>;

const PaymentWebViewScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PaymentWebViewRouteProp>();

  const { paymentUrl, reference, provider, checkoutSnapshot } = route.params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const webViewRef = useRef<WebView>(null);

  /**
   * Detect when payment is complete by watching URL changes
   * Paystack redirects to: callback_url?reference=xxx&trxref=xxx
   * Flutterwave redirects to: redirect_url?status=successful&tx_ref=xxx&transaction_id=xxx
   */
  const handleNavigationChange = async (navState: any) => {
    const { url } = navState;
    
    console.log('🔗 WebView URL:', url);

    // Skip if already verifying
    if (isVerifying) return;

    // ✅ Detect Paystack callback
    if (provider === 'paystack' && url.includes('payment-callback')) {
      console.log('✅ Paystack callback detected');
      await handlePaymentComplete();
      return;
    }

    // ✅ Detect Flutterwave callback
    if (provider === 'flutterwave') {
      if (url.includes('payment-callback') || url.includes('status=successful') || url.includes('status=completed')) {
        console.log('✅ Flutterwave callback detected');
        
        // Extract transaction_id from URL for verification
        const urlParams = new URL(url);
        const transactionId = urlParams.searchParams.get('transaction_id');
        
        await handlePaymentComplete(transactionId || undefined);
        return;
      }
      
      // Flutterwave cancelled/failed
      if (url.includes('status=cancelled') || url.includes('status=failed')) {
        console.log('❌ Flutterwave payment cancelled/failed');
        handlePaymentFailed();
        return;
      }
    }

    // ✅ Generic cancel detection
    if (url.includes('cancel') || url.includes('close')) {
      console.log('❌ Payment cancelled');
      handlePaymentCancelled();
      return;
    }
  };

  /**
   * ✅ NEW FLOW: After payment succeeds, call confirmPayment to CREATE the order
   * This is the key change — no order exists until payment is verified
   */
  const handlePaymentComplete = async (transactionId?: string) => {
    try {
      setIsVerifying(true);

      console.log('🔍 Confirming payment & creating order...', { reference, provider, transactionId });

      // Call confirmPayment — this verifies payment AND creates the order
      const response = await confirmPayment(reference, {
        provider,
        transaction_id: transactionId,
        checkoutSnapshot,
      });

      if (response.success) {
        const orderNumber = response.data?.order?.orderNumber || reference;

        Toast.show({
          type: 'success',
          text1: 'Payment Successful!',
          text2: `Order #${orderNumber} confirmed`,
          visibilityTime: 3000,
        });

        // Navigate to orders
        navigation.reset({
          index: 1,
          routes: [
            { name: 'Main' },
            { name: 'Orders' },
          ],
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Order Creation Failed',
          text2: 'Payment succeeded but order could not be created. Please contact support.',
        });
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('❌ Payment confirmation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Confirmation Error',
        text2: error.response?.data?.message || 'Could not confirm payment. Please contact support.',
      });
      navigation.goBack();
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePaymentFailed = () => {
    Toast.show({
      type: 'error',
      text1: 'Payment Failed',
      text2: 'Your payment could not be processed. No order was created.',
    });
    navigation.goBack();
  };

  const handlePaymentCancelled = () => {
    Toast.show({
      type: 'info',
      text1: 'Payment Cancelled',
      text2: 'No order was created. Your cart is unchanged.',
    });
    navigation.goBack();
  };

  const handleClose = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure? No order will be created and your cart will remain unchanged.',
      [
        { text: 'Continue Payment', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            Toast.show({
              type: 'info',
              text1: 'Payment Cancelled',
              text2: 'No order was created. Your cart is unchanged.',
            });
            navigation.goBack();
          },
        },
      ]
    );
  };

  // Loading/verifying overlay
  if (isVerifying) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EC4899" />
          <Text className="text-gray-700 font-semibold text-lg mt-4">
            Confirming Payment...
          </Text>
          <Text className="text-gray-500 mt-2 text-center px-8">
            Verifying your payment and creating your order
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
        <TouchableOpacity
          onPress={handleClose}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <Icon name="close" size={22} color="#111827" />
        </TouchableOpacity>
        
        <View className="flex-row items-center">
          <Icon 
            name="lock-closed" 
            size={14} 
            color="#10B981" 
          />
          <Text className="text-gray-900 font-semibold ml-1.5">
            Secure Payment
          </Text>
        </View>

        <View className="flex-row items-center">
          <View className="bg-gray-100 px-3 py-1.5 rounded-full">
            <Text className="text-xs font-semibold text-gray-600 capitalize">
              {provider}
            </Text>
          </View>
        </View>
      </View>

      {/* WebView */}
      <View className="flex-1">
        {isLoading && (
          <View className="absolute inset-0 z-10 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#EC4899" />
            <Text className="text-gray-500 mt-4">Loading payment page...</Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleNavigationChange}
          onLoadEnd={() => setIsLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            Toast.show({
              type: 'error',
              text1: 'Loading Error',
              text2: 'Could not load payment page. Please try again.',
            });
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          javaScriptCanOpenWindowsAutomatically={true}
          onSslError={(event: any) => {
            console.warn('SSL error in WebView');
            event.handler.proceed();
          }}
          style={{ flex: 1 }}
        />
      </View>

      {/* Bottom safety bar */}
      <View className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <View className="flex-row items-center justify-center">
          <Icon name="shield-checkmark" size={16} color="#10B981" />
          <Text className="text-gray-500 text-xs ml-2">
            Your payment is secured by {provider === 'flutterwave' ? 'Flutterwave' : 'Paystack'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PaymentWebViewScreen;