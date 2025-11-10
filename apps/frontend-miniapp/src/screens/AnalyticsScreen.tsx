import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState({
    totalGames: 127,
    totalBets: '12,450',
    totalWins: '8,920',
    totalStaked: '5,000',
    rewardsClaimed: '2,150',
    bridgeTransactions: 8,
  });

  const [predictions, setPredictions] = useState([
    { type: 'Game Win Probability', prediction: '67%', confidence: 0.82 },
    { type: 'Optimal Stake Time', prediction: 'Next 3 days', confidence: 0.75 },
    { type: 'Token Price Trend', prediction: 'Upward', confidence: 0.68 },
  ]);

  const metrics = [
    { label: 'Total Games', value: analytics.totalGames, icon: '🎮', color: '#4F46E5' },
    { label: 'Total Bets', value: analytics.totalBets + ' ZEA', icon: '💰', color: '#06B6D4' },
    { label: 'Total Wins', value: analytics.totalWins + ' ZEA', icon: '🎉', color: '#10B981' },
    { label: 'Staked', value: analytics.totalStaked + ' ZEA', icon: '🔒', color: '#F59E0B' },
    { label: 'Rewards', value: analytics.rewardsClaimed + ' ZEA', icon: '🎁', color: '#8B5CF6' },
    { label: 'Bridges', value: analytics.bridgeTransactions, icon: '🌉', color: '#EC4899' },
  ];

  const recommendations = [
    'Consider staking more ZEA to earn 10% APY rewards',
    'You\'re an active gamer! Check out poker and roulette',
    'Bridge to Polygon for lower gas fees',
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Analytics Dashboard</Text>

      <View style={styles.metricsGrid}>
        {metrics.map((metric, index) => (
          <View key={index} style={[styles.metricCard, { borderLeftColor: metric.color }]}>
            <Text style={styles.metricIcon}>{metric.icon}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🤖 AI Predictions</Text>
        {predictions.map((pred, index) => (
          <View key={index} style={styles.predictionCard}>
            <View style={styles.predictionHeader}>
              <Text style={styles.predictionType}>{pred.type}</Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {Math.round(pred.confidence * 100)}% confident
                </Text>
              </View>
            </View>
            <Text style={styles.predictionValue}>{pred.prediction}</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${pred.confidence * 100}%` },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>💡 Recommendations</Text>
        {recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationRow}>
            <Text style={styles.recommendationDot}>•</Text>
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🔒 Security Status</Text>
        <View style={styles.securityRow}>
          <Text style={styles.securityIcon}>✅</Text>
          <View style={styles.securityInfo}>
            <Text style={styles.securityLabel}>No Fraud Alerts</Text>
            <Text style={styles.securityDesc}>Your account is secure</Text>
          </View>
        </View>
        <View style={styles.securityRow}>
          <Text style={styles.securityIcon}>✅</Text>
          <View style={styles.securityInfo}>
            <Text style={styles.securityLabel}>World ID Verified</Text>
            <Text style={styles.securityDesc}>ZKP authentication active</Text>
          </View>
        </View>
      </View>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    width: (width - 52) / 2,
    borderLeftWidth: 4,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  predictionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionType: {
    fontSize: 14,
    color: '#94A3B8',
  },
  confidenceBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  predictionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
  },
  recommendationRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 8,
  },
  recommendationDot: {
    fontSize: 20,
    color: '#4F46E5',
    marginRight: 12,
    lineHeight: 20,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#0F172A',
    borderRadius: 8,
  },
  securityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  securityInfo: {
    flex: 1,
  },
  securityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  securityDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
