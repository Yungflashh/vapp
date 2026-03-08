import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type LegalScreenProps = NativeStackScreenProps<any, 'Legal'>;

type Tab = 'privacy' | 'terms' | 'returns';

const LegalScreen = ({ navigation, route }: LegalScreenProps) => {
  const initialTab: Tab = route.params?.tab || 'privacy';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'privacy', label: 'Privacy Policy' },
    { key: 'terms', label: 'Terms of Use' },
    { key: 'returns', label: 'Returns & Refunds' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1 mr-3">
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Legal</Text>
      </View>

      {/* Tab Bar */}
      <View className="flex-row border-b border-gray-100 px-4">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            className={`py-3 mr-5 ${activeTab === tab.key ? 'border-b-2 border-pink-500' : ''}`}
            onPress={() => { setActiveTab(tab.key); scrollToTop(); }}
          >
            <Text className={`text-sm font-medium ${activeTab === tab.key ? 'text-pink-500' : 'text-gray-400'}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-5 py-4"
        contentContainerStyle={{ maxWidth: isTablet ? 640 : undefined, alignSelf: 'center', width: '100%', paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'privacy' && <PrivacyPolicy />}
        {activeTab === 'terms' && <TermsOfUse />}
        {activeTab === 'returns' && <ReturnsPolicy />}
      </ScrollView>
    </SafeAreaView>
  );
};

const SectionTitle = ({ children }: { children: string }) => (
  <Text className="text-base font-bold text-gray-900 mt-5 mb-2">{children}</Text>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <Text className="text-sm text-gray-600 leading-5 mb-3">{children}</Text>
);

const Bullet = ({ children }: { children: string }) => (
  <View className="flex-row pl-2 mb-1.5">
    <Text className="text-sm text-gray-400 mr-2">{'\u2022'}</Text>
    <Text className="text-sm text-gray-600 leading-5 flex-1">{children}</Text>
  </View>
);

// ───────────────────────────────────────────────
// Privacy Policy
// ───────────────────────────────────────────────
const PrivacyPolicy = () => (
  <View>
    <Text className="text-xl font-bold text-gray-900 mb-1">Privacy Policy</Text>
    <P>This Privacy Policy explains how Vendorspot collects, processes, stores, discloses, and protects your personal data when you access or use our platform and related services.</P>

    <SectionTitle>1. Who We Are</SectionTitle>
    <P>Vendorspot is an online marketplace operating in Nigeria that connects buyers with independent vendors. We provide a technology platform designed to facilitate secure transactions, vendor verification, and logistics coordination.</P>

    <SectionTitle>2. Legal Basis for Processing</SectionTitle>
    <P>We process personal data in accordance with the Nigeria Data Protection Act (NDPA) 2023 based on:</P>
    <Bullet>Your consent</Bullet>
    <Bullet>Performance of a contract</Bullet>
    <Bullet>Compliance with legal obligations</Bullet>
    <Bullet>Legitimate business interests (including fraud prevention and platform security)</Bullet>

    <SectionTitle>3. Personal Data We Collect</SectionTitle>
    <P>A. Information You Provide Directly:</P>
    <Bullet>Full name, phone number, email address</Bullet>
    <Bullet>Residential and store address (for vendors)</Bullet>
    <Bullet>Profile photograph and banking details</Bullet>
    <Bullet>Order and transaction details</Bullet>
    <P>B. Vendor Verification Data:</P>
    <Bullet>National Identification Number (NIN) Slip</Bullet>
    <Bullet>Guarantor's name, address, and phone number</Bullet>
    <Bullet>Business-related verification documents</Bullet>

    <SectionTitle>4. Purpose of Data Collection</SectionTitle>
    <Bullet>To create and manage user accounts</Bullet>
    <Bullet>To process orders and payments</Bullet>
    <Bullet>To verify vendor identity and prevent fraud</Bullet>
    <Bullet>To provide customer support</Bullet>
    <Bullet>To improve platform functionality</Bullet>
    <Bullet>To comply with legal and regulatory requirements</Bullet>

    <SectionTitle>5. Sharing of Personal Data</SectionTitle>
    <P>We do not sell personal data. We may share data with logistics partners, payment processors, service providers under confidentiality obligations, and regulatory authorities where legally required.</P>

    <SectionTitle>6. Data Security</SectionTitle>
    <P>We implement appropriate technical and organizational measures to protect personal data against unauthorized access, accidental loss, alteration, disclosure, and cyberattacks.</P>

    <SectionTitle>7. Your Rights</SectionTitle>
    <Bullet>Request access to your personal data</Bullet>
    <Bullet>Request correction of inaccurate data</Bullet>
    <Bullet>Request deletion of your data</Bullet>
    <Bullet>Object to processing under certain circumstances</Bullet>
    <Bullet>Withdraw consent at any time</Bullet>
    <P>To exercise your rights, email: Support@vendorspotng.com with subject "Data Protection Request".</P>

    <SectionTitle>8. Contact</SectionTitle>
    <P>For questions or concerns regarding this Privacy Policy, contact us at Support@vendorspotng.com.</P>
  </View>
);

// ───────────────────────────────────────────────
// Terms of Use
// ───────────────────────────────────────────────
const TermsOfUse = () => (
  <View>
    <Text className="text-xl font-bold text-gray-900 mb-1">Terms & Conditions of Use</Text>
    <P>These Terms and Conditions govern access to and use of the Vendorspot marketplace platform. By accessing or using the platform, you agree to be legally bound by these Terms.</P>

    <SectionTitle>1. Introduction</SectionTitle>
    <P>Vendorspot operates an online marketplace that enables independent vendors to list, market, and sell products directly to buyers. Vendorspot provides a technology platform and does not own or directly sell the products listed.</P>

    <SectionTitle>2. Eligibility & Account Registration</SectionTitle>
    <P>You must be at least 18 years old. You agree to provide accurate information, maintain confidentiality of your login credentials, and accept responsibility for all activities conducted through your account.</P>
    <P>Vendorspot reserves the right to suspend or terminate any account at its discretion, particularly in cases of suspected fraud, policy violations, or unlawful activity.</P>

    <SectionTitle>3. Marketplace & Contract Formation</SectionTitle>
    <P>Vendorspot acts solely as an intermediary. A binding contract for sale arises directly between the buyer and seller once the buyer confirms a purchase. Vendorspot is not a party to the contract of sale.</P>
    <P>Vendor payment is released only after confirmation of delivery in good condition.</P>

    <SectionTitle>4. Pricing & Commissions</SectionTitle>
    <Bullet>All product prices must be clearly stated</Bullet>
    <Bullet>Prices must include applicable taxes</Bullet>
    <Bullet>Delivery charges must be disclosed prior to checkout</Bullet>
    <Bullet>Vendorspot deducts the applicable commission from each completed sale</Bullet>

    <SectionTitle>5. Payments</SectionTitle>
    <P>All payments must be made through approved payment methods. Vendorspot reserves the right to hold funds for fraud prevention and reverse transactions where violations are detected.</P>

    <SectionTitle>6. User Content & Conduct</SectionTitle>
    <P>Your content must be accurate, lawful, and not infringe third-party rights. You must not circumvent the platform, solicit external payments, use data scraping tools, or attempt to hack or disrupt the platform.</P>

    <SectionTitle>7. Intellectual Property</SectionTitle>
    <P>All intellectual property rights in the Vendorspot website, branding, logos, and content are reserved and protected under applicable laws. Unauthorized use is strictly prohibited.</P>

    <SectionTitle>8. Limitation of Liability</SectionTitle>
    <P>Vendorspot does not guarantee product quality, is not liable for seller misconduct, and does not guarantee commercial outcomes. In case of dispute, buyers must follow the Dispute Resolution Policy.</P>

    <SectionTitle>9. Indemnification</SectionTitle>
    <P>You agree to indemnify and hold Vendorspot harmless against all claims arising from your breach of these Terms, misuse of the platform, or violation of any law.</P>

    <SectionTitle>10. Governing Law</SectionTitle>
    <P>These Terms shall be governed by the laws of the Federal Republic of Nigeria. All disputes shall be subject to the exclusive jurisdiction of Nigerian courts.</P>

    <SectionTitle>11. Contact</SectionTitle>
    <P>For inquiries, contact us at Support@vendorspotng.com.</P>
  </View>
);

// ───────────────────────────────────────────────
// Returns & Refund Policy
// ───────────────────────────────────────────────
const ReturnsPolicy = () => (
  <View>
    <Text className="text-xl font-bold text-gray-900 mb-1">Return & Refund Policy</Text>
    <P>Vendorspot operates as a marketplace connecting customers with independent vendors. Vendors are responsible for the accuracy, quality, and condition of the products listed.</P>

    <SectionTitle>1. Return Window</SectionTitle>
    <P>Customers may request a return within 3 days of delivery, provided that:</P>
    <Bullet>The item is unused (unless defective)</Bullet>
    <Bullet>The item is in its original condition</Bullet>
    <Bullet>All original packaging, tags, and accessories are intact</Bullet>
    <Bullet>Proof of purchase is provided</Bullet>

    <SectionTitle>2. Wrong Item Delivered</SectionTitle>
    <P>Where a customer receives a materially different item, the vendor bears full responsibility including all return logistics and redelivery costs. A full product price refund will be issued.</P>

    <SectionTitle>3. Eligible Grounds for Return</SectionTitle>
    <Bullet>The item delivered is incorrect</Bullet>
    <Bullet>The item is defective, damaged, or not functioning</Bullet>
    <Bullet>The item was delivered in a broken condition</Bullet>
    <Bullet>The item was expired (where applicable)</Bullet>
    <Bullet>The item was used when sold as new</Bullet>

    <SectionTitle>4. Non-Returnable Items</SectionTitle>
    <P>Unless wrong, defective, or inauthentic:</P>
    <Bullet>Underwear, lingerie, socks, nightwear, beachwear</Bullet>
    <Bullet>Skincare, fragrances, hair care products</Bullet>
    <Bullet>Food items and consumables</Bullet>
    <Bullet>Personalized or customized products</Bullet>
    <Bullet>Jewelry, books, software, bedsheets</Bullet>
    <Bullet>Opened boxed electronics (except for verified defects)</Bullet>

    <SectionTitle>5. Return Procedure</SectionTitle>
    <P>Step 1: Click "Incomplete Order or Dispute the Order" on the order page and send details to Support@vendorspotng.com.</P>
    <P>Step 2: No item shall be returned without prior authorization.</P>
    <P>Step 3: Once the vendor confirms receipt, Vendorspot will process the refund or facilitate replacement.</P>

    <SectionTitle>6. Refund Processing</SectionTitle>
    <P>Approved refunds cover the product price. Delivery fees are non-refundable for change-of-mind or size preference returns. Processing timelines vary by payment method.</P>
  </View>
);

export default LegalScreen;
