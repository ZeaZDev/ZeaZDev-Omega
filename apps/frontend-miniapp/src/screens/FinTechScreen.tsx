/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Frontend-FinTech
 * @File: FinTechScreen.tsx
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 2.0.0
 * @Description: FinTech screen for card issuance, Thai bank operations, and PromptPay top-up
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';

export default function FinTechScreen() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('');

  // Poll for payment status when QR is generated
  useEffect(() => {
    if (transactionId) {
      const interval = setInterval(async () => {
        await checkPaymentStatus();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [transactionId]);

  const generatePromptPayQR = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // In production, call your backend API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/fintech/promptpay/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user_123', // Replace with actual user ID
          amount: amount,
          currency: 'THB',
        }),
      });

      const data = await response.json();
      
      if (data.qrCode) {
        setQrCode(data.qrCode);
        setTransactionId(data.reference);
        setPaymentStatus('pending');
        Alert.alert(
          'QR Code Generated',
          'Scan the QR code with your Thai banking app to complete payment'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PromptPay QR code');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!transactionId) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/fintech/promptpay/verify/${transactionId}`
      );
      const data = await response.json();

      if (data.status === 'completed') {
        setPaymentStatus('completed');
        Alert.alert(
          'Payment Received!',
          `Your ${amount} THB deposit has been completed. Crypto will be credited to your wallet.`
        );
        // Reset form
        setQrCode(null);
        setTransactionId(null);
        setAmount('');
      } else if (data.status === 'failed' || data.status === 'expired') {
        setPaymentStatus(data.status);
        Alert.alert('Payment Failed', 'Please generate a new QR code');
        setQrCode(null);
        setTransactionId(null);
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>💳 FinTech Services</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Virtual Card</Text>
        <Text style={styles.cardInfo}>**** **** **** 1234</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Apply for Real Card</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>💰 PromptPay Top-Up</Text>
        <Text style={styles.description}>
          Top up your wallet instantly using PromptPay - Thailand's national payment system
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Amount (THB)"
          placeholderTextColor="#666"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          editable={!qrCode}
        />

        {!qrCode ? (
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={generatePromptPayQR}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0a0a0a" />
            ) : (
              <Text style={styles.buttonText}>Generate PromptPay QR</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrText}>📱</Text>
              <Text style={styles.qrLabel}>QR Code</Text>
              <Text style={styles.qrSubLabel}>Scan with your banking app</Text>
              <Text style={styles.qrCode}>{qrCode.substring(0, 20)}...</Text>
            </View>
            
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[
                styles.statusText,
                paymentStatus === 'completed' && styles.statusCompleted,
                paymentStatus === 'pending' && styles.statusPending,
              ]}>
                {paymentStatus === 'pending' && '⏳ Waiting for payment...'}
                {paymentStatus === 'completed' && '✅ Payment received!'}
                {paymentStatus === 'failed' && '❌ Payment failed'}
                {paymentStatus === 'expired' && '⌛ QR expired'}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => {
                setQrCode(null);
                setTransactionId(null);
                setPaymentStatus('');
              }}
            >
              <Text style={styles.secondaryButtonText}>Cancel / Generate New QR</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ How it works:</Text>
          <Text style={styles.infoText}>1. Enter amount in THB</Text>
          <Text style={styles.infoText}>2. Generate PromptPay QR code</Text>
          <Text style={styles.infoText}>3. Scan with any Thai banking app</Text>
          <Text style={styles.infoText}>4. Confirm payment in your app</Text>
          <Text style={styles.infoText}>5. Crypto credited automatically</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Thai Bank Transfer</Text>
        <Text style={styles.description}>Traditional bank transfer (manual processing)</Text>
        <TextInput
          style={styles.input}
          placeholder="Amount (THB)"
          placeholderTextColor="#666"
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Deposit from Bank</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  cardInfo: { fontSize: 24, color: '#00ff88', marginBottom: 16, letterSpacing: 2 },
  description: { fontSize: 14, color: '#888', marginBottom: 16, lineHeight: 20 },
  input: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 16, color: '#fff', marginBottom: 12 },
  button: { backgroundColor: '#00ff88', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#0a0a0a' },
  buttonDisabled: { opacity: 0.5 },
  secondaryButton: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  secondaryButtonText: { fontSize: 16, fontWeight: 'bold', color: '#00ff88' },
  qrContainer: { marginTop: 16 },
  qrPlaceholder: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 32, 
    alignItems: 'center',
    marginBottom: 16,
  },
  qrText: { fontSize: 64, marginBottom: 8 },
  qrLabel: { fontSize: 18, fontWeight: 'bold', color: '#0a0a0a', marginBottom: 4 },
  qrSubLabel: { fontSize: 12, color: '#666', marginBottom: 16 },
  qrCode: { fontSize: 10, color: '#999', fontFamily: 'monospace' },
  statusContainer: { 
    backgroundColor: '#2a2a2a', 
    borderRadius: 8, 
    padding: 16, 
    marginBottom: 12,
    alignItems: 'center',
  },
  statusLabel: { fontSize: 14, color: '#888', marginBottom: 8 },
  statusText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  statusPending: { color: '#ff9500' },
  statusCompleted: { color: '#00ff88' },
  infoBox: { 
    backgroundColor: '#2a2a2a', 
    borderRadius: 8, 
    padding: 16, 
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  infoText: { fontSize: 12, color: '#888', marginBottom: 4 },
});
