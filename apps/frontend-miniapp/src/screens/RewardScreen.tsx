// ZeaZDev [Frontend Screen - Rewards] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function RewardScreen() {
  const handleClaimDaily = () => {
    // Implement World ID ZKP verification + claim
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎁 Rewards</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Check-in</Text>
        <Text style={styles.reward}>100 ZEA + 10,000 DING</Text>
        <TouchableOpacity style={styles.button} onPress={handleClaimDaily}>
          <Text style={styles.buttonText}>Claim Daily Reward</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Airdrop</Text>
        <Text style={styles.reward}>1,000 ZEA + 20,000 DING</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Claim Airdrop</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Referral Program</Text>
        <Text style={styles.reward}>500 ZEA per referral</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Refer Friend</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  reward: { fontSize: 18, color: '#00ff88', marginBottom: 16 },
  button: { backgroundColor: '#00ff88', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#0a0a0a' },
});
