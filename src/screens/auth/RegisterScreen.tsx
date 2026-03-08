import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, useWindowDimensions, Keyboard, TextInput as RNTextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { register } from '@/services/auth.service';

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [isVendor, setIsVendor] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hearAbout, setHearAbout] = useState('');
  const [showHearAboutPicker, setShowHearAboutPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);

  const isTablet = width >= 768;
  const formMaxWidth = isTablet ? 420 : undefined;

  // Refs for focusing next input
  const emailRef = useRef<RNTextInput>(null);
  const phoneRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);
  const hearAboutRef = useRef<RNTextInput>(null);

  // Listen for keyboard events to get actual keyboard height
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  // Password strength calculation
  const getPasswordStrength = (pass: string): { strength: string; color: string } => {
    if (!pass) return { strength: 'Weak', color: 'text-red-500' };
    
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^a-zA-Z\d]/.test(pass)) score++;

    if (score < 2) return { strength: 'Weak', color: 'text-red-500' };
    if (score < 4) return { strength: 'Medium', color: 'text-yellow-500' };
    return { strength: 'Strong', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  // Form validation
  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter your full name' });
      return false;
    }

    const nameParts = fullName.trim().split(' ');
    if (nameParts.length < 2) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter both first and last name' });
      return false;
    }

    if (!email.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter your email' });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a valid email address' });
      return false;
    }

    if (!phone.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter your phone number' });
      return false;
    }

    if (!password) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a password' });
      return false;
    }

    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Password must be at least 6 characters' });
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      const registrationData = {
        fullName: `${firstName} ${lastName}`,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role: isVendor ? 'vendor' as const : 'customer' as const,
        hearAbout: hearAbout || undefined,
      };

      console.log('📝 Registering user:', {
        ...registrationData,
        password: '***hidden***',
      });

      const response = await register(registrationData);

      console.log('✅ Registration successful:', response);

      Toast.show({ type: 'success', text1: 'Success', text2: 'Please check your email for the verification code.' });

      setTimeout(() => {
        navigation.navigate('OTPVerification', {
          email: email.trim().toLowerCase(),
          isVendor: isVendor,
        });
      }, 1000);
    } catch (error: any) {
      console.error('❌ Registration error:', error);

      let errorMessage = 'Registration failed. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Toast.show({ type: 'error', text1: 'Registration Failed', text2: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Handle focus on inputs - scroll to make them visible
  const handleInputFocus = (inputRef: React.RefObject<RNTextInput>) => {
    setTimeout(() => {
      inputRef.current?.measureInWindow((_x, y, _width, height) => {
        scrollViewRef.current?.scrollTo({
          y: y - 150,
          animated: true,
        });
      });
    }, 300);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingVertical: 16,
          paddingBottom: keyboardHeight > 0 ? keyboardHeight : 16,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Responsive centered container */}
        <View style={{ width: '100%', maxWidth: formMaxWidth }}>
          {/* Back Button */}
          <TouchableOpacity 
            className="w-10 h-10 justify-center mb-4"
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Icon name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          {/* Profile Image Placeholder */}
          <View className="items-end mb-4">
            <View className="w-16 h-16 rounded-full bg-gray-100 justify-center items-center">
              <Icon name="person" size={32} color="#9CA3AF" />
            </View>
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-pink-500 mb-2">
            Create Your Storefront
          </Text>
          <Text className="text-sm text-gray-500 mb-6">
            Join a trusted marketplace for buyers, sellers, affiliates, and creators.
          </Text>

          {/* Toggle: Vendor / Customer */}
          <View className="flex-row mb-6 border-b border-gray-200">
            <TouchableOpacity 
              className={`flex-1 pb-3 ${isVendor ? 'border-b-2 border-pink-500' : ''}`}
              onPress={() => setIsVendor(true)}
              disabled={loading}
            >
              <Text className={`text-center font-medium ${isVendor ? 'text-pink-500' : 'text-gray-400'}`}>
                I'm a vendor
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`flex-1 pb-3 ${!isVendor ? 'border-b-2 border-pink-500' : ''}`}
              onPress={() => setIsVendor(false)}
              disabled={loading}
            >
              <Text className={`text-center font-medium ${!isVendor ? 'text-pink-500' : 'text-gray-400'}`}>
                Buy only
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full Name Input */}
          <View className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-4">
            <Icon name="person-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Full Name (First and Last)"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          {/* Email Input */}
          <View className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-4">
            <Icon name="mail-outline" size={20} color="#9CA3AF" />
            <TextInput
              ref={emailRef}
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              onFocus={() => handleInputFocus(emailRef)}
              blurOnSubmit={false}
            />
          </View>

          {/* Phone Number Input */}
          <View className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-4">
            <Icon name="call-outline" size={20} color="#9CA3AF" />
            <TextInput
              ref={phoneRef}
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Phone Number"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              onFocus={() => handleInputFocus(phoneRef)}
              blurOnSubmit={false}
            />
          </View>

          {/* Password Input */}
          <View className="flex-row items-center border border-gray-200 rounded-lg px-4 py-3 mb-4">
            <Icon name="lock-closed-outline" size={20} color="#9CA3AF" />
            <TextInput
              ref={passwordRef}
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
              returnKeyType="next"
              onSubmitEditing={() => hearAboutRef.current?.focus()}
              onFocus={() => handleInputFocus(passwordRef)}
              blurOnSubmit={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
              <Icon 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#9CA3AF" 
              />
            </TouchableOpacity>
          </View>

          {/* Password Strength */}
          <Text className={`text-xs ${passwordStrength.color} mb-6`}>
            Password strength: {passwordStrength.strength}
          </Text>

          {/* How did you hear about us */}
          <Text className="text-sm text-gray-400 mb-2">
            How did you hear about Vendorspot? (Optional)
          </Text>
          <TouchableOpacity
            className="border border-gray-200 rounded-lg px-4 py-3 mb-6 flex-row justify-between items-center"
            onPress={() => { if (!loading) setShowHearAboutPicker(true); }}
            disabled={loading}
          >
            <Text className={`text-base ${hearAbout ? 'text-gray-900' : 'text-gray-400'}`}>
              {hearAbout || 'Select option'}
            </Text>
            <Icon name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Create Account Button */}
          <TouchableOpacity 
            className={`py-4 rounded-lg mb-6 ${loading ? 'bg-pink-300' : 'bg-pink-500'}`}
            onPress={handleRegister}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold text-center">
                Create account
              </Text>
            )}
          </TouchableOpacity>

          {/* Terms and Conditions */}
          <Text className="text-xs text-gray-400 text-center leading-5 mb-6">
            By continuing, I agree to the{' '}
            <Text className="text-pink-500" onPress={() => navigation.navigate('Legal', { tab: 'terms' })}>Vendorspot General Terms of Use</Text> &{' '}
            <Text className="text-pink-500" onPress={() => navigation.navigate('Legal', { tab: 'privacy' })}>General Privacy Policy</Text>.
          </Text>
        </View>
      </ScrollView>

      {/* How did you hear picker modal */}
      <Modal visible={showHearAboutPicker} transparent animationType="slide" onRequestClose={() => setShowHearAboutPicker(false)}>
        <TouchableOpacity className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setShowHearAboutPicker(false)}>
          <View className="mt-auto bg-white rounded-t-2xl">
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-900">How did you hear about us?</Text>
              <TouchableOpacity onPress={() => setShowHearAboutPicker(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View className="px-6 py-2">
              {['Google', 'X (Twitter)', 'Instagram', 'Facebook', 'TikTok', 'Friend', 'Vendor', 'Others'].map((option) => (
                <TouchableOpacity
                  key={option}
                  className="py-3.5 border-b border-gray-50"
                  onPress={() => {
                    setHearAbout(option);
                    setShowHearAboutPicker(false);
                  }}
                >
                  <Text className={`text-base ${hearAbout === option ? 'font-semibold' : 'text-gray-700'}`} style={hearAbout === option ? { color: '#CC3366' } : undefined}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

export default RegisterScreen;