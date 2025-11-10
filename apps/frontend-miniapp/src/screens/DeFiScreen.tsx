/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Frontend-DeFi
 * @File: DeFiScreen.tsx
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-10
 * @Version: 2.0.0
 * @Description: DeFi screen with real Uniswap integration, staking, and trading
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  ActivityIndicator,
  Alert 
} from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function DeFiScreen() {
  // Swap state
  const [swapAmount, setSwapAmount] = useState('');
  const [swapQuote, setSwapQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [tokenIn, setTokenIn] = useState('ZEA');
  const [tokenOut, setTokenOut] = useState('ETH');

  // Staking state
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakes, setStakes] = useState([]);
  const [stakeAnalytics, setStakeAnalytics] = useState(null);
  const [loadingStakes, setLoadingStakes] = useState(false);

  // User state (in real app, get from auth context)
  const [userId] = useState('user-123');
  const [walletAddress] = useState('0x...');

  useEffect(() => {
    loadUserStakes();
    loadStakeAnalytics();
  }, []);

  // Load user stakes
  const loadUserStakes = async () => {
    setLoadingStakes(true);
    try {
      const response = await fetch(`${API_BASE_URL}/defi/stake/user/${userId}`);
      const data = await response.json();
      setStakes(data.stakes || []);
    } catch (error) {
      console.error('Failed to load stakes:', error);
    } finally {
      setLoadingStakes(false);
    }
  };

  // Load stake analytics
  const loadStakeAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/defi/stake/analytics/${userId}`);
      const data = await response.json();
      setStakeAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  // Get swap quote
  const getSwapQuote = async () => {
    if (!swapAmount || parseFloat(swapAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoadingQuote(true);
    try {
      // Convert amount to wei (assuming 18 decimals)
      const amountWei = (parseFloat(swapAmount) * 1e18).toString();
      
      const response = await fetch(
        `${API_BASE_URL}/defi/swap/quote?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amountIn=${amountWei}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get quote');
      }
      
      const data = await response.json();
      setSwapQuote(data);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to get swap quote');
    } finally {
      setLoadingQuote(false);
    }
  };

  // Execute swap
  const executeSwap = async () => {
    if (!swapQuote) {
      Alert.alert('Error', 'Get a quote first');
      return;
    }

    try {
      const minAmountOut = (BigInt(swapQuote.amountOut) * BigInt(95)) / BigInt(100); // 5% slippage
      
      const response = await fetch(`${API_BASE_URL}/defi/swap/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: walletAddress,
          tokenIn: swapQuote.tokenIn,
          tokenOut: swapQuote.tokenOut,
          amountIn: swapQuote.amountIn,
          minAmountOut: minAmountOut.toString(),
        }),
      });

      const data = await response.json();
      Alert.alert('Success', 'Swap prepared! Execute with your wallet.');
      // In production, this would trigger MetaMask/wallet transaction
    } catch (error) {
      Alert.alert('Error', 'Failed to execute swap');
    }
  };

  // Create stake
  const createStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (parseFloat(stakeAmount) < 100) {
      Alert.alert('Error', 'Minimum stake amount is 100 ZEA');
      return;
    }

    try {
      const amountWei = (parseFloat(stakeAmount) * 1e18).toString();
      
      const response = await fetch(`${API_BASE_URL}/defi/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: amountWei,
          txHash: '0x...', // In production, get from actual transaction
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Staking successful!');
        setStakeAmount('');
        loadUserStakes();
        loadStakeAnalytics();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create stake');
    }
  };

  // Claim rewards
  const claimRewards = async (stakeId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/defi/stake/${stakeId}/claim`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        const rewardEther = (parseFloat(data.reward) / 1e18).toFixed(4);
        Alert.alert('Success', `Claimed ${rewardEther} ZEA rewards!`);
        loadUserStakes();
        loadStakeAnalytics();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to claim rewards');
    }
  };

  // Unstake
  const unstakeTokens = async (stakeId: string, amount: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/defi/stake/${stakeId}/unstake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Unstaked successfully!');
        loadUserStakes();
        loadStakeAnalytics();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to unstake');
    }
  };

  // Format wei to ether
  const formatEther = (wei: string) => {
    return (parseFloat(wei) / 1e18).toFixed(4);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔄 DeFi Hub</Text>
      
      {/* Swap Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Swap Tokens</Text>
        <Text style={styles.subtitle}>Powered by Uniswap V3</Text>
        
        <View style={styles.tokenSelector}>
          <Text style={styles.label}>From: {tokenIn}</Text>
          <Text style={styles.label}>To: {tokenOut}</Text>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Amount"
          placeholderTextColor="#666"
          value={swapAmount}
          onChangeText={setSwapAmount}
          keyboardType="numeric"
        />
        
        {swapQuote && (
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>
              You'll receive: {formatEther(swapQuote.amountOut)} {tokenOut}
            </Text>
            <Text style={styles.quoteDetail}>
              Price Impact: {swapQuote.priceImpact}%
            </Text>
            <Text style={styles.quoteDetail}>
              Fee: {swapQuote.fee}%
            </Text>
          </View>
        )}
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]} 
            onPress={getSwapQuote}
            disabled={loadingQuote}
          >
            {loadingQuote ? (
              <ActivityIndicator color="#0a0a0a" />
            ) : (
              <Text style={styles.buttonText}>Get Quote</Text>
            )}
          </TouchableOpacity>
          
          {swapQuote && (
            <TouchableOpacity style={styles.button} onPress={executeSwap}>
              <Text style={styles.buttonText}>Swap</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Staking Analytics */}
      {stakeAnalytics && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Staking Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Staked</Text>
              <Text style={styles.statValue}>
                {formatEther(stakeAnalytics.totalStaked)} ZEA
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Pending Rewards</Text>
              <Text style={styles.statValue}>
                {formatEther(stakeAnalytics.pendingRewards)} ZEA
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Earned</Text>
              <Text style={styles.statValue}>
                {formatEther(stakeAnalytics.totalEarnings)} ZEA
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>ROI</Text>
              <Text style={styles.statValue}>{stakeAnalytics.roi}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Stake Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Stake $ZEA</Text>
        <Text style={styles.apy}>APY: 10% 🔥</Text>
        <Text style={styles.subtitle}>Minimum: 100 ZEA • Lock: 7 days</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Amount to stake"
          placeholderTextColor="#666"
          value={stakeAmount}
          onChangeText={setStakeAmount}
          keyboardType="numeric"
        />
        
        <TouchableOpacity style={styles.button} onPress={createStake}>
          <Text style={styles.buttonText}>Stake Now</Text>
        </TouchableOpacity>
      </View>

      {/* Active Stakes */}
      {stakes.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Stakes</Text>
          {loadingStakes ? (
            <ActivityIndicator color="#00ff88" />
          ) : (
            stakes.map((stake, index) => (
              <View key={stake.id} style={styles.stakeItem}>
                <View style={styles.stakeHeader}>
                  <Text style={styles.stakeAmount}>
                    {formatEther(stake.amount)} ZEA
                  </Text>
                  <Text style={styles.stakeDate}>
                    Staked {new Date(stake.startTime).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.stakeRewards}>
                  Claimed: {formatEther(stake.totalRewardsClaimed)} ZEA
                </Text>
                <View style={styles.stakeActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => claimRewards(stake.id)}
                  >
                    <Text style={styles.actionButtonText}>Claim Rewards</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => unstakeTokens(stake.id, stake.amount)}
                  >
                    <Text style={styles.actionButtonText}>Unstake</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 12 },
  label: { fontSize: 14, color: '#aaa', marginBottom: 4 },
  tokenSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  apy: { fontSize: 18, color: '#00ff88', marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 16, color: '#fff', marginBottom: 12 },
  quoteBox: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 12, marginBottom: 12 },
  quoteText: { fontSize: 16, color: '#00ff88', fontWeight: 'bold', marginBottom: 4 },
  quoteDetail: { fontSize: 14, color: '#aaa', marginBottom: 2 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, backgroundColor: '#00ff88', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonSecondary: { backgroundColor: '#4F46E5' },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#0a0a0a' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: { flex: 1, minWidth: '45%', backgroundColor: '#2a2a2a', borderRadius: 8, padding: 12 },
  statLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  statValue: { fontSize: 18, color: '#00ff88', fontWeight: 'bold' },
  stakeItem: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 12, marginBottom: 12 },
  stakeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  stakeAmount: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  stakeDate: { fontSize: 12, color: '#888' },
  stakeRewards: { fontSize: 14, color: '#00ff88', marginBottom: 8 },
  stakeActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, backgroundColor: '#4F46E5', borderRadius: 8, padding: 10, alignItems: 'center' },
  actionButtonDanger: { backgroundColor: '#ef4444' },
  actionButtonText: { fontSize: 14, color: '#fff', fontWeight: 'bold' },
});
