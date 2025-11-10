/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Frontend-Bridge
 * @File: BridgeScreen.tsx
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-10
 * @Version: 2.0.0 (Phase 6: Cross-Chain Expansion)
 * @Description: Enhanced cross-chain bridge UI with liquidity pools
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';

interface Chain {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  icon: string;
}

interface BridgeQuote {
  amount: string;
  bridgeFee: string;
  lpFee: string;
  totalFees: string;
  amountAfterFee: string;
  estimatedTime: number;
  liquidityAvailable: string;
}

export default function BridgeScreen() {
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<'ZEA' | 'DING'>('ZEA');
  const [sourceChain, setSourceChain] = useState(10); // Optimism
  const [targetChain, setTargetChain] = useState(137); // Polygon
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<BridgeQuote | null>(null);
  const [showLiquidity, setShowLiquidity] = useState(false);
  const [liquidityAmount, setLiquidityAmount] = useState('');

  const chains: Chain[] = [
    { chainId: 10, name: 'Optimism', rpcUrl: '', blockExplorer: 'https://optimistic.etherscan.io', icon: '🔴' },
    { chainId: 137, name: 'Polygon', rpcUrl: '', blockExplorer: 'https://polygonscan.com', icon: '🟣' },
    { chainId: 42161, name: 'Arbitrum', rpcUrl: '', blockExplorer: 'https://arbiscan.io', icon: '🔵' },
    { chainId: 8453, name: 'Base', rpcUrl: '', blockExplorer: 'https://basescan.org', icon: '🔷' },
  ];

  const getQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (sourceChain === targetChain) {
      Alert.alert('Error', 'Source and target chains must be different');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/bridge/quote?amount=${amount}&sourceChain=${sourceChain}&targetChain=${targetChain}`
      );
      const data = await response.json();
      setQuote(data);
    } catch (error) {
      console.error('Failed to get quote:', error);
      Alert.alert('Error', 'Failed to fetch bridge quote');
    }
    setLoading(false);
  };

  const initiateBridge = async () => {
    if (!quote) return;
    
    setLoading(true);
    try {
      Alert.alert(
        'Bridge Initiated',
        `Bridging ${amount} ${selectedToken} from ${chains.find(c => c.chainId === sourceChain)?.name} to ${chains.find(c => c.chainId === targetChain)?.name}`
      );
    } catch (error) {
      console.error('Failed to initiate bridge:', error);
      Alert.alert('Error', 'Failed to initiate bridge');
    }
    setLoading(false);
  };

  const addLiquidity = async () => {
    if (!liquidityAmount || parseFloat(liquidityAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      Alert.alert('Success', `Added ${liquidityAmount} ${selectedToken} to liquidity pool`);
      setLiquidityAmount('');
    } catch (error) {
      console.error('Failed to add liquidity:', error);
      Alert.alert('Error', 'Failed to add liquidity');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🌉 Cross-Chain Bridge</Text>
      <Text style={styles.subtitle}>Transfer tokens across multiple L2 networks</Text>

      {/* Tab Selection */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, !showLiquidity && styles.tabActive]}
          onPress={() => setShowLiquidity(false)}
        >
          <Text style={[styles.tabText, !showLiquidity && styles.tabTextActive]}>Bridge</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showLiquidity && styles.tabActive]}
          onPress={() => setShowLiquidity(true)}
        >
          <Text style={[styles.tabText, showLiquidity && styles.tabTextActive]}>Liquidity</Text>
        </TouchableOpacity>
      </View>

      {!showLiquidity ? (
        // Bridge Interface
        <>
          {/* Token Selection */}
          <View style={styles.card}>
            <Text style={styles.label}>Select Token</Text>
            <View style={styles.tokenRow}>
              <TouchableOpacity
                style={[styles.tokenButton, selectedToken === 'ZEA' && styles.tokenButtonActive]}
                onPress={() => setSelectedToken('ZEA')}
              >
                <Text style={[styles.tokenButtonText, selectedToken === 'ZEA' && styles.tokenButtonTextActive]}>
                  ZEA
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tokenButton, selectedToken === 'DING' && styles.tokenButtonActive]}
                onPress={() => setSelectedToken('DING')}
              >
                <Text style={[styles.tokenButtonText, selectedToken === 'DING' && styles.tokenButtonTextActive]}>
                  DING
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.card}>
            <Text style={styles.label}>Amount to Bridge</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
            <Text style={styles.balanceText}>Balance: 10,000 {selectedToken}</Text>
          </View>

          {/* Source Chain */}
          <View style={styles.card}>
            <Text style={styles.label}>From Network</Text>
            <View style={styles.chainGrid}>
              {chains.map((chain) => (
                <TouchableOpacity
                  key={`source-${chain.chainId}`}
                  style={[
                    styles.chainButton,
                    sourceChain === chain.chainId && styles.chainButtonActive,
                    targetChain === chain.chainId && styles.chainButtonDisabled,
                  ]}
                  onPress={() => setSourceChain(chain.chainId)}
                  disabled={targetChain === chain.chainId}
                >
                  <Text style={styles.chainIcon}>{chain.icon}</Text>
                  <Text style={[
                    styles.chainButtonText,
                    sourceChain === chain.chainId && styles.chainButtonTextActive,
                  ]}>
                    {chain.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target Chain */}
          <View style={styles.card}>
            <Text style={styles.label}>To Network</Text>
            <View style={styles.chainGrid}>
              {chains.map((chain) => (
                <TouchableOpacity
                  key={`target-${chain.chainId}`}
                  style={[
                    styles.chainButton,
                    targetChain === chain.chainId && styles.chainButtonActive,
                    sourceChain === chain.chainId && styles.chainButtonDisabled,
                  ]}
                  onPress={() => setTargetChain(chain.chainId)}
                  disabled={sourceChain === chain.chainId}
                >
                  <Text style={styles.chainIcon}>{chain.icon}</Text>
                  <Text style={[
                    styles.chainButtonText,
                    targetChain === chain.chainId && styles.chainButtonTextActive,
                  ]}>
                    {chain.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Get Quote Button */}
          <TouchableOpacity style={styles.button} onPress={getQuote} disabled={loading}>
            {loading && !quote ? (
              <ActivityIndicator color="#0a0a0a" />
            ) : (
              <Text style={styles.buttonText}>Get Quote</Text>
            )}
          </TouchableOpacity>

          {/* Quote Display */}
          {quote && (
            <View style={styles.quoteCard}>
              <Text style={styles.quoteTitle}>Bridge Quote</Text>
              
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Amount:</Text>
                <Text style={styles.quoteValue}>{quote.amount} {selectedToken}</Text>
              </View>
              
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Bridge Fee (0.1%):</Text>
                <Text style={styles.quoteValue}>{quote.bridgeFee} {selectedToken}</Text>
              </View>
              
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>LP Fee (0.05%):</Text>
                <Text style={styles.quoteValue}>{quote.lpFee} {selectedToken}</Text>
              </View>
              
              <View style={styles.quoteDivider} />
              
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabelBold}>You Receive:</Text>
                <Text style={styles.quoteValueBold}>{quote.amountAfterFee} {selectedToken}</Text>
              </View>
              
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Estimated Time:</Text>
                <Text style={styles.quoteValue}>{Math.floor(quote.estimatedTime / 60)} min</Text>
              </View>
              
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Liquidity Available:</Text>
                <Text style={styles.quoteValueGreen}>{parseFloat(quote.liquidityAvailable).toLocaleString()} {selectedToken}</Text>
              </View>

              <TouchableOpacity
                style={[styles.button, { marginTop: 20 }]}
                onPress={initiateBridge}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0a0a0a" />
                ) : (
                  <Text style={styles.buttonText}>Bridge Now</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        // Liquidity Interface
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💧 Liquidity Pools</Text>
            <Text style={styles.cardDescription}>
              Earn fees by providing liquidity to the bridge
            </Text>

            {/* LP Stats */}
            <View style={styles.lpStats}>
              <View style={styles.lpStatItem}>
                <Text style={styles.lpStatLabel}>APR</Text>
                <Text style={styles.lpStatValue}>15.5%</Text>
              </View>
              <View style={styles.lpStatItem}>
                <Text style={styles.lpStatLabel}>Your Share</Text>
                <Text style={styles.lpStatValue}>0%</Text>
              </View>
              <View style={styles.lpStatItem}>
                <Text style={styles.lpStatLabel}>Total Liquidity</Text>
                <Text style={styles.lpStatValue}>5M</Text>
              </View>
            </View>

            {/* Add Liquidity */}
            <Text style={styles.label}>Add Liquidity</Text>
            <View style={styles.tokenRow}>
              <TouchableOpacity
                style={[styles.tokenButton, selectedToken === 'ZEA' && styles.tokenButtonActive]}
                onPress={() => setSelectedToken('ZEA')}
              >
                <Text style={[styles.tokenButtonText, selectedToken === 'ZEA' && styles.tokenButtonTextActive]}>
                  ZEA
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tokenButton, selectedToken === 'DING' && styles.tokenButtonActive]}
                onPress={() => setSelectedToken('DING')}
              >
                <Text style={[styles.tokenButtonText, selectedToken === 'DING' && styles.tokenButtonTextActive]}>
                  DING
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={liquidityAmount}
              onChangeText={setLiquidityAmount}
              placeholder="Amount to add"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={addLiquidity}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0a0a0a" />
              ) : (
                <Text style={styles.buttonText}>Add Liquidity</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 How it works</Text>
            <Text style={styles.infoText}>• Provide ZEA or DING to liquidity pools</Text>
            <Text style={styles.infoText}>• Earn 0.05% fee on all bridge transactions</Text>
            <Text style={styles.infoText}>• Remove liquidity anytime (no lock period)</Text>
            <Text style={styles.infoText}>• APR adjusts based on bridge volume</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#00ff88',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#0a0a0a',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 18,
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 12,
    color: '#888',
  },
  tokenRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tokenButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  tokenButtonActive: {
    backgroundColor: '#00ff88',
  },
  tokenButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  tokenButtonTextActive: {
    color: '#0a0a0a',
  },
  chainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chainButton: {
    width: '47%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  chainButtonActive: {
    backgroundColor: '#00ff88',
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  chainButtonDisabled: {
    opacity: 0.3,
  },
  chainIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  chainButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  chainButtonTextActive: {
    color: '#0a0a0a',
  },
  button: {
    backgroundColor: '#00ff88',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
  quoteCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quoteLabel: {
    fontSize: 14,
    color: '#888',
  },
  quoteLabelBold: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  quoteValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  quoteValueBold: {
    fontSize: 16,
    color: '#00ff88',
    fontWeight: 'bold',
  },
  quoteValueGreen: {
    fontSize: 14,
    color: '#00ff88',
    fontWeight: '600',
  },
  quoteDivider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 12,
  },
  lpStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  lpStatItem: {
    alignItems: 'center',
  },
  lpStatLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  lpStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    lineHeight: 20,
  },
});

