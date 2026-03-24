import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface TourStep {
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface WelcomeTourProps {
  role: 'customer' | 'vendor';
  userName?: string;
  onComplete: () => void;
}

const CUSTOMER_STEPS: TourStep[] = [
  {
    icon: 'bag-handle',
    title: 'Welcome to VendorSpot!',
    description:
      'Your one-stop marketplace for amazing products from trusted vendors. Let us show you around!',
    color: '#CC3366',
  },
  {
    icon: 'search',
    title: 'Discover Products',
    description:
      'Use the search bar to find any product, vendor, or category. Browse New Arrivals, Flash Sales, and Trending items on the home page.',
    color: '#3B82F6',
  },
  {
    icon: 'receipt-outline',
    title: 'Track Your Orders',
    description:
      'Tap the Orders tab to view all your orders, track deliveries in real-time, and confirm when you receive them.',
    color: '#10B981',
  },
  {
    icon: 'heart-outline',
    title: 'Save Favorites',
    description:
      'Love a product? Tap the heart icon to save it to your Wishlist. Access your saved items anytime from the Wishlist tab.',
    color: '#F59E0B',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Chat with Vendors',
    description:
      'Have questions? Message vendors directly from any product page or order details. Need help? Chat with our support team.',
    color: '#8B5CF6',
  },
  {
    icon: 'trophy-outline',
    title: 'Earn Rewards',
    description:
      'Shop and earn points! Every purchase, review, and daily login earns you points. Redeem them for discounts and special offers.',
    color: '#EC4899',
  },
];

const VENDOR_STEPS: TourStep[] = [
  {
    icon: 'storefront',
    title: 'Welcome, Vendor!',
    description:
      "Welcome to your VendorSpot store! Here's a quick guide to help you get started and make the most of your business.",
    color: '#CC3366',
  },
  {
    icon: 'bar-chart-outline',
    title: 'Your Dashboard',
    description:
      'The Dashboard tab shows your revenue, orders, and performance at a glance. Track your growth with sales charts and analytics.',
    color: '#3B82F6',
  },
  {
    icon: 'cube-outline',
    title: 'Manage Products',
    description:
      'Add and manage your products from the Products tab. Set prices, upload images, and enable Flash Sales for extra visibility.',
    color: '#10B981',
  },
  {
    icon: 'clipboard-outline',
    title: 'Process Orders',
    description:
      'View and manage orders in the Orders tab. Update order status, track shipments, and communicate with customers.',
    color: '#F59E0B',
  },
  {
    icon: 'wallet-outline',
    title: 'Earnings & Withdrawals',
    description:
      'When customers complete orders, your earnings appear in your wallet. Withdraw funds anytime from the Dashboard quick actions.',
    color: '#8B5CF6',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Verify Your Store',
    description:
      'Complete your KYC verification to unlock all features. Verified stores get a badge and higher visibility to customers.',
    color: '#EC4899',
  },
];

const WelcomeTour: React.FC<WelcomeTourProps> = ({ role, userName, onComplete }) => {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = role === 'vendor' ? VENDOR_STEPS : CUSTOMER_STEPS;
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  useEffect(() => {
    checkTourStatus();
  }, []);

  const checkTourStatus = async () => {
    try {
      const key = `welcomeTourSeen_${role}`;
      const seen = await AsyncStorage.getItem(key);
      if (!seen) {
        // Small delay so the main screen renders first
        setTimeout(() => setVisible(true), 800);
      }
    } catch (err) {
      // Don't block the app
    }
  };

  const completeTour = async () => {
    try {
      const key = `welcomeTourSeen_${role}`;
      await AsyncStorage.setItem(key, 'true');
    } catch (err) {
      // Silent fail
    }
    setVisible(false);
    onComplete();
  };

  const handleNext = () => {
    if (isLast) {
      completeTour();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.85)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        {/* Card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 28,
            width: '100%',
            maxWidth: 360,
            overflow: 'hidden',
          }}
        >
          {/* Top colored section */}
          <View
            style={{
              backgroundColor: step.color,
              paddingTop: 40,
              paddingBottom: 32,
              alignItems: 'center',
            }}
          >
            {/* Step indicator */}
            <View
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
              }}
            >
              <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' }}>
                  Skip Tour
                </Text>
              </TouchableOpacity>
            </View>

            {/* Icon circle */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Icon name={step.icon} size={40} color="#FFFFFF" />
            </View>

            {/* Greeting on first step */}
            {isFirst && userName && (
              <Text
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  fontWeight: '500',
                  marginBottom: 4,
                }}
              >
                Hi {userName}! 👋
              </Text>
            )}

            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: '800',
                textAlign: 'center',
                paddingHorizontal: 24,
              }}
            >
              {step.title}
            </Text>
          </View>

          {/* Content */}
          <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 }}>
            <Text
              style={{
                color: '#4B5563',
                fontSize: 15,
                lineHeight: 23,
                textAlign: 'center',
              }}
            >
              {step.description}
            </Text>
          </View>

          {/* Progress dots */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: 20,
              gap: 6,
            }}
          >
            {steps.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === currentStep ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === currentStep ? step.color : '#E5E7EB',
                }}
              />
            ))}
          </View>

          {/* Buttons */}
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: 20,
              paddingBottom: 24,
              gap: 12,
            }}
          >
            {!isFirst && (
              <TouchableOpacity
                onPress={handleBack}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: '#E5E7EB',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '700' }}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.8}
              style={{
                flex: isFirst ? 1 : 1,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: step.color,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                {isLast ? "Let's Go!" : 'Next'}
              </Text>
              {!isLast && (
                <Icon name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default WelcomeTour;
