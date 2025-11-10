import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

export default function BridgeScreen() {
  const [amount, setAmount] = useState('');
  const [targetChain, setTargetChain] = useState('polygon');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);

  const chains = [
    { id: 'polygon', name: 'Polygon', chainId: 137 },
    { id: 'arbitrum', name: 'Arbitrum', chainId: 42161 },
    { id: 'base', name: 'Base', chainId: 8453 },
    { id: 'optimism', name: 'Optimism', chainId: 10 },
  ];

  const getQuote = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      const selectedChain = chains.find(c => c.id === targetChain);
      const fee = Number(amount) * 0.001;
      const received = Number(amount) - fee;
      setQuote({
        amount,
        fee: fee.toFixed(4),
        received: received.toFixed(4),
        chain: selectedChain?.name,
      });
    } catch (error) {
      console.error('Failed to get quote:', error);
    }
    setLoading(false);
  };

  const initiateBridge = async () => {
    if (!quote) return;
    setLoading(true);
    try {
      console.log('Initiating bridge transfer...');
    } catch (error) {
      console.error('Failed to bridge:', error);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🌉 Cross-Chain Bridge</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Amount to Bridge</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.0"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Target Chain</Text>
        {chains.map((chain) => (
          <TouchableOpacity
            key={chain.id}
            style={[
              styles.chainButton,
              targetChain === chain.id && styles.chainButtonActive,
            ]}
            onPress={() => setTargetChain(chain.id)}
          >
            <Text
              style={[
                styles.chainButtonText,
                targetChain === chain.id && styles.chainButtonTextActive,
              ]}
            >
              {chain.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={getQuote} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Get Quote</Text>
        )}
      </TouchableOpacity>

      {quote && (
        <View style={styles.quoteCard}>
          <Text style={styles.quoteTitle}>Bridge Quote</Text>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>Amount:</Text>
            <Text style={styles.quoteValue}>{quote.amount} ZEA</Text>
          </View>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>Bridge Fee (0.1%):</Text>
            <Text style={styles.quoteValue}>{quote.fee} ZEA</Text>
          </View>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>You Receive:</Text>
            <Text style={styles.quoteValue}>{quote.received} ZEA</Text>
          </View>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteLabel}>On Chain:</Text>
            <Text style={styles.quoteValue}>{quote.chain}</Text>
          </View>
          <TouchableOpacity
            style={[styles.button, { marginTop: 20 }]}
            onPress={initiateBridge}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Bridge Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 16,
  },
  chainButton: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  chainButtonActive: {
    backgroundColor: '#4F46E5',
  },
  chainButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
  },
  chainButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quoteCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
  },
  quoteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quoteLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  quoteValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
});
