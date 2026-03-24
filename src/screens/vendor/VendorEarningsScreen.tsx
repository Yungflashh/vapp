import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import {
  getWallet,
  getWalletSummary,
  getTransactions,
  requestWithdrawal,
  Transaction,
} from '@/services/wallet.service';

// ============================================================
// TYPES
// ============================================================

type FilterType = 'all' | 'credit' | 'debit' | 'withdrawal';

interface WalletData {
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

// ============================================================
// UTILITIES
// ============================================================

const formatCurrency = (amount: number): string => {
  return `\u20A6${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getTransactionIcon = (type: string): { name: string; color: string; bg: string } => {
  switch (type) {
    case 'credit':
    case 'commission':
      return { name: 'arrow-down-circle', color: '#10B981', bg: '#D1FAE5' };
    case 'debit':
      return { name: 'arrow-up-circle', color: '#EF4444', bg: '#FEE2E2' };
    case 'withdrawal':
    case 'payout':
      return { name: 'wallet', color: '#F59E0B', bg: '#FEF3C7' };
    case 'refund':
      return { name: 'refresh-circle', color: '#6366F1', bg: '#E0E7FF' };
    default:
      return { name: 'swap-horizontal', color: '#6B7280', bg: '#F3F4F6' };
  }
};

const getStatusBadge = (status: string): { label: string; color: string; bg: string } => {
  switch (status) {
    case 'completed':
      return { label: 'Completed', color: '#10B981', bg: '#D1FAE5' };
    case 'pending':
      return { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7' };
    case 'processing':
      return { label: 'Processing', color: '#3B82F6', bg: '#DBEAFE' };
    case 'failed':
      return { label: 'Failed', color: '#EF4444', bg: '#FEE2E2' };
    default:
      return { label: status, color: '#6B7280', bg: '#F3F4F6' };
  }
};

const isCredit = (type: string): boolean => {
  return ['credit', 'commission', 'refund'].includes(type);
};

// ============================================================
// COMPONENTS
// ============================================================

interface BalanceCardProps {
  label: string;
  amount: number;
  icon: string;
  color: string;
  bgColor: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ label, amount, icon, color, bgColor }) => (
  <View
    className="w-[48%] bg-white rounded-2xl p-4 mb-3"
    style={{
      shadowColor: color,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    }}
  >
    <View
      className="w-10 h-10 rounded-xl items-center justify-center mb-3"
      style={{ backgroundColor: bgColor }}
    >
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text className="text-xs text-gray-500 mb-1">{label}</Text>
    <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
      {formatCurrency(amount)}
    </Text>
  </View>
);

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`px-4 py-2 rounded-full mr-2 ${active ? 'bg-pink-500' : 'bg-white'}`}
    style={
      !active
        ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }
        : undefined
    }
    activeOpacity={0.7}
  >
    <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-600'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const iconConfig = getTransactionIcon(transaction.type);
  const statusBadge = getStatusBadge(transaction.status);
  const credit = isCredit(transaction.type);

  return (
    <View
      className="bg-white rounded-2xl p-4 mb-3 mx-5"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center">
        <View
          className="w-11 h-11 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: iconConfig.bg }}
        >
          <Icon name={iconConfig.name} size={22} color={iconConfig.color} />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
            {transaction.description || transaction.purpose || transaction.type}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-xs text-gray-400">{formatDate(transaction.timestamp || transaction.createdAt || '')}</Text>
            <View
              className="px-2 py-0.5 rounded-full ml-2"
              style={{ backgroundColor: statusBadge.bg }}
            >
              <Text className="text-[10px] font-bold" style={{ color: statusBadge.color }}>
                {statusBadge.label}
              </Text>
            </View>
          </View>
        </View>

        <Text
          className="text-base font-bold ml-2"
          style={{ color: credit ? '#10B981' : '#EF4444' }}
        >
          {credit ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
      </View>
    </View>
  );
};

// ============================================================
// MAIN SCREEN
// ============================================================

const VendorEarningsScreen: React.FC = () => {
  const navigation = useNavigation();

  // State
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<FilterType>('all');

  // Withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // --------------------------------------------------------
  // DATA FETCHING
  // --------------------------------------------------------

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);

      const [walletRes, txRes] = await Promise.all([
        getWallet(),
        getTransactions(1, 20),
      ]);

      console.log('💰 Wallet API response:', JSON.stringify(walletRes, null, 2));

      if (walletRes.success) {
        // Backend returns data.wallet as the full wallet object
        const w = walletRes.data?.wallet || walletRes.data;
        console.log('💰 Wallet data to use:', JSON.stringify(w, null, 2));
        setWallet({
          balance: w.balance ?? 0,
          pendingBalance: w.pendingBalance ?? 0,
          totalEarned: w.totalEarned ?? 0,
          totalWithdrawn: w.totalWithdrawn ?? 0,
        });
      }

      if (txRes.success) {
        setTransactions(txRes.data?.transactions || []);
        setTotalPages(txRes.meta?.totalPages ?? 1);
        setPage(1);
      }
    } catch (error: any) {
      console.error('Error fetching earnings data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load earnings data',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await getTransactions(nextPage, 20);
      if (res.success) {
        setTransactions((prev) => [...prev, ...(res.data?.transactions || [])]);
        setPage(nextPage);
        setTotalPages(res.meta?.totalPages ?? totalPages);
      }
    } catch (error) {
      console.error('Error loading more transactions:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // --------------------------------------------------------
  // WITHDRAWAL
  // --------------------------------------------------------

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount < 1000) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Minimum withdrawal is \u20A61,000',
      });
      return;
    }
    if (wallet && amount > wallet.balance) {
      Toast.show({
        type: 'error',
        text1: 'Insufficient Balance',
        text2: 'You cannot withdraw more than your available balance',
      });
      return;
    }

    try {
      setWithdrawing(true);
      const res = await requestWithdrawal(amount);
      if (res.success) {
        Toast.show({
          type: 'success',
          text1: 'Withdrawal Requested',
          text2: res.message || 'Your withdrawal is being processed',
        });
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        fetchData(true);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Withdrawal request failed';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
    } finally {
      setWithdrawing(false);
    }
  };

  // --------------------------------------------------------
  // FILTERING
  // --------------------------------------------------------

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'credit') return tx.type === 'credit';
    if (filter === 'debit') return tx.type === 'debit' && tx.purpose !== 'withdrawal';
    if (filter === 'withdrawal') return tx.purpose === 'withdrawal';
    return true;
  });

  // --------------------------------------------------------
  // RENDER HELPERS
  // --------------------------------------------------------

  const renderHeader = () => (
    <View>
      {/* Balance Cards */}
      <View className="px-5 pt-4">
        <View className="flex-row flex-wrap justify-between">
          <BalanceCard
            label="Available Balance"
            amount={wallet?.balance ?? 0}
            icon="wallet-outline"
            color="#10B981"
            bgColor="#D1FAE5"
          />
          <BalanceCard
            label="Pending Balance"
            amount={wallet?.pendingBalance ?? 0}
            icon="time-outline"
            color="#F59E0B"
            bgColor="#FEF3C7"
          />
          <BalanceCard
            label="Total Earned"
            amount={wallet?.totalEarned ?? 0}
            icon="trending-up-outline"
            color="#CC3366"
            bgColor="#FCE4EC"
          />
          <BalanceCard
            label="Total Withdrawn"
            amount={wallet?.totalWithdrawn ?? 0}
            icon="arrow-down-circle-outline"
            color="#6B7280"
            bgColor="#F3F4F6"
          />
        </View>
      </View>

      {/* Withdraw Button */}
      <View className="px-5 mt-2 mb-4">
        <TouchableOpacity
          className="py-4 rounded-2xl items-center"
          style={{ backgroundColor: '#CC3366' }}
          onPress={() => setShowWithdrawModal(true)}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center">
            <Icon name="cash-outline" size={20} color="#fff" />
            <Text className="text-white font-bold text-base ml-2">Withdraw Funds</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Transaction History Header */}
      <View className="px-5 mb-3">
        <Text className="text-lg font-bold text-gray-900 mb-3">Transaction History</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: 'all', label: 'All' },
            { key: 'credit', label: 'Credits' },
            { key: 'debit', label: 'Debits' },
            { key: 'withdrawal', label: 'Withdrawals' },
          ]}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              active={filter === item.key}
              onPress={() => setFilter(item.key as FilterType)}
            />
          )}
        />
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-16 px-6">
      <Icon name="receipt-outline" size={56} color="#D1D5DB" />
      <Text className="text-base font-semibold text-gray-400 mt-4">No transactions yet</Text>
      <Text className="text-sm text-gray-400 mt-1 text-center">
        Your transaction history will appear here once you start earning
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return <View className="h-24" />;
    return (
      <View className="py-6 items-center">
        <ActivityIndicator size="small" color="#CC3366" />
      </View>
    );
  };

  // --------------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFF8FA' }} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF8FA" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#CC3366" />
          <Text className="text-gray-500 mt-4">Loading earnings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------------
  // MAIN RENDER
  // --------------------------------------------------------

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFF8FA' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8FA" />

      {/* Header Bar */}
      <View className="flex-row items-center px-5 py-3">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-xl bg-white items-center justify-center"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2,
          }}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-4 flex-1">
          Earnings & Withdrawals
        </Text>
      </View>

      {/* Transactions FlatList */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor="#CC3366"
            colors={['#CC3366']}
          />
        }
      />

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <TouchableOpacity
            className="flex-1 bg-black/50 justify-end"
            activeOpacity={1}
            onPress={() => setShowWithdrawModal(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
                {/* Handle */}
                <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-6" />

                <Text className="text-xl font-bold text-gray-900 mb-2">Withdraw Funds</Text>
                <Text className="text-sm text-gray-500 mb-6">
                  Available balance: {formatCurrency(wallet?.balance ?? 0)}
                </Text>

                {/* Amount Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Amount</Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                    <Text className="text-lg font-bold text-gray-400 mr-2">{'\u20A6'}</Text>
                    <TextInput
                      className="flex-1 text-lg font-semibold text-gray-900 py-4"
                      placeholder="0"
                      placeholderTextColor="#D1D5DB"
                      keyboardType="numeric"
                      value={withdrawAmount}
                      onChangeText={setWithdrawAmount}
                    />
                  </View>
                  <Text className="text-xs text-gray-400 mt-2">
                    Minimum withdrawal: {'\u20A6'}1,000
                  </Text>
                </View>

                {/* Quick Amount Buttons */}
                <View className="flex-row flex-wrap mb-6">
                  {[1000, 5000, 10000, 50000].map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      className="px-4 py-2 rounded-full bg-pink-50 mr-2 mb-2"
                      onPress={() => setWithdrawAmount(amount.toString())}
                      activeOpacity={0.7}
                    >
                      <Text className="text-sm font-semibold text-pink-500">
                        {formatCurrency(amount)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                  className="py-4 rounded-2xl items-center"
                  style={{
                    backgroundColor:
                      withdrawing || !withdrawAmount ? '#F9A8D4' : '#CC3366',
                  }}
                  onPress={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount}
                  activeOpacity={0.8}
                >
                  {withdrawing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-base">Confirm Withdrawal</Text>
                  )}
                </TouchableOpacity>

                {/* Cancel */}
                <TouchableOpacity
                  className="py-3 items-center mt-2"
                  onPress={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-500 font-semibold">Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default VendorEarningsScreen;
