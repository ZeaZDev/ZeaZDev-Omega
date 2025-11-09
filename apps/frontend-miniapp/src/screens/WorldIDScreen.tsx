/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Frontend-WorldID
 * @File: WorldIDScreen.tsx
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: World ID verification screen for ZKP identity proof
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function WorldIDScreen({ navigation }: any) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerifyWorldID = async () => {
    setIsVerifying(true);
    
    try {
      // In production, integrate @worldcoin/idkit
      // Mock verification for now
      const mockProof = {
        proof: '0x...',
        nullifier_hash: `nullifier_${Date.now()}`,
        merkle_root: '0x...',
        verification_level: 'orb',
        action: 'zeazdev-verify',
        signal: '0x1234...', // User's wallet address
      };

      const response = await axios.post(`${API_URL}/auth/world-id/verify`, mockProof);

      if (response.data.success) {
        setIsVerified(true);
        Alert.alert('Success', 'World ID verified successfully!');
        // Navigate to main app
        navigation.navigate('Wallet');
      }
    } catch (error) {
      Alert.alert('Error', 'World ID verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ZeaZDev</Text>
      <Text style={styles.subtitle}>FiGaTect Super-App</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌍 World ID Verification</Text>
        <Text style={styles.cardText}>
          Verify your identity with World ID Zero-Knowledge Proof to access:
        </Text>
        
        <View style={styles.features}>
          <Text style={styles.feature}>✓ Daily Check-in Rewards</Text>
          <Text style={styles.feature}>✓ Airdrop Claims</Text>
          <Text style={styles.feature}>✓ Referral Program</Text>
          <Text style={styles.feature}>✓ Real Card Application</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, isVerifying && styles.buttonDisabled]}
        onPress={handleVerifyWorldID}
        disabled={isVerifying}
      >
        <Text style={styles.buttonText}>
          {isVerifying ? 'Verifying...' : 'Verify with World ID'}
        </Text>
      </TouchableOpacity>

      {isVerified && (
        <Text style={styles.successText}>✓ Verified</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00ff88',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 16,
  },
  features: {
    marginTop: 8,
  },
  feature: {
    fontSize: 16,
    color: '#00ff88',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#00ff88',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0a0a',
  },
  successText: {
    fontSize: 18,
    color: '#00ff88',
    textAlign: 'center',
    marginTop: 16,
  },
});
