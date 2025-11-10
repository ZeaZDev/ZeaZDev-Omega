/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Frontend-GameFi-Phase3
 * @File: SlotMachineScreen.tsx
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-10
 * @Version: 3.0.0 (Phase 3: GameFi Integration)
 * @Description: Slot machine game interface with Unity WebGL integration, tournaments, and NFT rewards
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { WebView } from 'react-native-webview';

type GameTab = 'slots' | 'tournaments' | 'nfts' | 'leaderboard';

interface GameStats {
  totalGames: number;
  totalWon: number;
  totalLost: number;
  totalWinnings: string;
  winRate: number;
  winStreak: number;
  rank: number;
}

interface SlotResult {
  sessionId: string;
  symbols: string[];
  result: 'won' | 'lost';
  winAmount: string;
  multiplier: number;
  provablyFairHash: string;
}

interface NFTReward {
  tokenId: number;
  name: string;
  description: string;
  imageUrl: string;
  rarity: number;
  achievementType: string;
}

interface Tournament {
  id: number;
  name: string;
  startTime: Date;
  endTime: Date;
  entryFee: string;
  prizePool: string;
  participants: number;
  status: 'UPCOMING' | 'ACTIVE' | 'FINISHED';
}

export default function SlotMachineScreen() {
  const [selectedTab, setSelectedTab] = useState<GameTab>('slots');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);
  
  // Slot machine state
  const [betAmount, setBetAmount] = useState('10');
  const [tokenUsed, setTokenUsed] = useState<'ZEA' | 'DING'>('ZEA');
  const [slotResult, setSlotResult] = useState<SlotResult | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [useUnity, setUseUnity] = useState(false);
  
  // NFT rewards state
  const [nfts, setNfts] = useState<NFTReward[]>([]);
  
  // Tournament state
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const userId = 'user_123'; // Would come from auth context
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    loadStats();
    if (selectedTab === 'nfts') {
      loadNFTs();
    } else if (selectedTab === 'tournaments') {
      loadTournaments();
    } else if (selectedTab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [selectedTab]);

  const loadStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/gamefi/stats/${userId}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadNFTs = async () => {
    try {
      const response = await fetch(`${apiUrl}/gamefi/nfts/${userId}`);
      const data = await response.json();
      setNfts(data);
    } catch (error) {
      console.error('Failed to load NFTs:', error);
    }
  };

  const loadTournaments = async () => {
    try {
      const response = await fetch(`${apiUrl}/gamefi/tournaments/active`);
      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`${apiUrl}/gamefi/leaderboard?limit=50`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const spinSlots = async () => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid bet amount');
      return;
    }

    setIsSpinning(true);
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/gamefi/slots/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          betAmount,
          tokenUsed,
        }),
      });

      const result = await response.json();
      setSlotResult(result);

      // Animate spin
      setTimeout(() => {
        setIsSpinning(false);
        
        if (result.result === 'won') {
          Alert.alert(
            '🎉 Winner!',
            `You won ${result.multiplier}x (${result.winAmount} ${tokenUsed})!`,
          );
        }
      }, 2000);

      loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to spin slots');
      setIsSpinning(false);
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tournamentId: number) => {
    try {
      const response = await fetch(`${apiUrl}/gamefi/tournaments/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          userId,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Joined tournament!');
        loadTournaments();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join tournament');
    }
  };

  const renderSlotsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.title}>🎰 Slot Machine</Text>
      
      {/* Unity WebGL Toggle */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <Text style={styles.cardTitle}>Game Mode</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, !useUnity && styles.toggleActive]}
              onPress={() => setUseUnity(false)}
            >
              <Text style={styles.toggleText}>Native</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, useUnity && styles.toggleActive]}
              onPress={() => setUseUnity(true)}
            >
              <Text style={styles.toggleText}>Unity 3D</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {useUnity ? (
        <View style={styles.unityContainer}>
          <WebView
            source={{ uri: process.env.UNITY_WEBGL_URL || 'http://localhost:8080' }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={(event) => {
              // Handle messages from Unity
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'SPIN_RESULT') {
                setSlotResult(data.result);
              }
            }}
          />
        </View>
      ) : (
        <>
          {/* Slot Display */}
          <View style={styles.slotDisplay}>
            {isSpinning ? (
              <View style={styles.spinningContainer}>
                <ActivityIndicator size="large" color="#00ff88" />
                <Text style={styles.spinningText}>Spinning...</Text>
              </View>
            ) : slotResult ? (
              <View style={styles.resultContainer}>
                <View style={styles.symbolsRow}>
                  {slotResult.symbols.map((symbol, i) => (
                    <Text key={i} style={styles.symbol}>{symbol}</Text>
                  ))}
                </View>
                <Text style={[styles.resultText, slotResult.result === 'won' && styles.winText]}>
                  {slotResult.result === 'won' 
                    ? `🎉 Won ${slotResult.multiplier}x!` 
                    : '😔 Try Again'}
                </Text>
                {slotResult.result === 'won' && (
                  <Text style={styles.winAmount}>+{slotResult.winAmount} {tokenUsed}</Text>
                )}
              </View>
            ) : (
              <View style={styles.emptySlots}>
                <Text style={styles.emptyText}>Pull the lever to play!</Text>
                <Text style={styles.emptySymbols}>🍒 🍋 🍊</Text>
              </View>
            )}
          </View>

          {/* Betting Controls */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Place Your Bet</Text>
            
            {/* Token Selection */}
            <View style={styles.tokenSelector}>
              <TouchableOpacity
                style={[styles.tokenButton, tokenUsed === 'ZEA' && styles.tokenActive]}
                onPress={() => setTokenUsed('ZEA')}
              >
                <Text style={styles.tokenText}>ZEA</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tokenButton, tokenUsed === 'DING' && styles.tokenActive]}
                onPress={() => setTokenUsed('DING')}
              >
                <Text style={styles.tokenText}>DING</Text>
              </TouchableOpacity>
            </View>

            {/* Bet Amount */}
            <TextInput
              style={styles.input}
              value={betAmount}
              onChangeText={setBetAmount}
              placeholder="Bet amount"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />

            {/* Quick Bet Buttons */}
            <View style={styles.quickBets}>
              <TouchableOpacity style={styles.quickBetButton} onPress={() => setBetAmount('10')}>
                <Text style={styles.quickBetText}>10</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBetButton} onPress={() => setBetAmount('50')}>
                <Text style={styles.quickBetText}>50</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBetButton} onPress={() => setBetAmount('100')}>
                <Text style={styles.quickBetText}>100</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBetButton} onPress={() => setBetAmount('500')}>
                <Text style={styles.quickBetText}>500</Text>
              </TouchableOpacity>
            </View>

            {/* Spin Button */}
            <TouchableOpacity
              style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]}
              onPress={spinSlots}
              disabled={isSpinning || loading}
            >
              {loading ? (
                <ActivityIndicator color="#0a0a0a" />
              ) : (
                <Text style={styles.spinButtonText}>
                  {isSpinning ? 'SPINNING...' : '🎰 SPIN'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Provably Fair Info */}
          {slotResult && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>✓ Provably Fair</Text>
              <Text style={styles.fairText}>Hash: {slotResult.provablyFairHash.substring(0, 16)}...</Text>
              <Text style={styles.fairSubtext}>This game is provably fair and can be verified</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );

  const renderTournamentsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.title}>🏆 Tournaments</Text>

      {tournaments.map((tournament) => (
        <View key={tournament.id} style={styles.tournamentCard}>
          <View style={styles.tournamentHeader}>
            <Text style={styles.tournamentName}>{tournament.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: tournament.status === 'ACTIVE' ? '#00ff88' : '#666' }]}>
              <Text style={styles.statusText}>{tournament.status}</Text>
            </View>
          </View>
          
          <View style={styles.tournamentInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Prize Pool:</Text>
              <Text style={styles.infoValue}>{tournament.prizePool} ZEA</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Entry Fee:</Text>
              <Text style={styles.infoValue}>{tournament.entryFee} ZEA</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Participants:</Text>
              <Text style={styles.infoValue}>{tournament.participants}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ends:</Text>
              <Text style={styles.infoValue}>{new Date(tournament.endTime).toLocaleDateString()}</Text>
            </View>
          </View>

          {tournament.status === 'ACTIVE' && (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => joinTournament(tournament.id)}
            >
              <Text style={styles.joinButtonText}>Join Tournament</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderNFTsTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.title}>🎨 NFT Rewards</Text>
      <Text style={styles.subtitle}>Collected: {nfts.length} NFTs</Text>

      <View style={styles.nftGrid}>
        {nfts.map((nft) => (
          <View key={nft.tokenId} style={styles.nftCard}>
            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(nft.rarity) }]}>
              <Text style={styles.rarityText}>★ {nft.rarity}</Text>
            </View>
            <Image
              source={{ uri: nft.imageUrl }}
              style={styles.nftImage}
              defaultSource={require('../assets/nft-placeholder.png')}
            />
            <Text style={styles.nftName}>{nft.name}</Text>
            <Text style={styles.nftDescription}>{nft.description}</Text>
          </View>
        ))}
      </View>

      {nfts.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No NFTs yet</Text>
          <Text style={styles.emptyStateSubtext}>Play slots to earn achievement NFTs!</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderLeaderboardTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.title}>🏅 Leaderboard</Text>
      
      {stats && (
        <View style={styles.userRankCard}>
          <Text style={styles.userRankText}>Your Rank: #{stats.rank}</Text>
          <Text style={styles.userWinnings}>{stats.totalWinnings} ZEA won</Text>
        </View>
      )}

      {leaderboard.map((entry, index) => (
        <View key={entry.userId} style={styles.leaderboardEntry}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{entry.rank}</Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{entry.username}</Text>
            <Text style={styles.playerStats}>
              {entry.totalGames} games • {entry.winRate.toFixed(1)}% win rate
            </Text>
          </View>
          <Text style={styles.playerWinnings}>{entry.totalWinnings} ZEA</Text>
        </View>
      ))}
    </ScrollView>
  );

  const getRarityColor = (rarity: number): string => {
    const colors = ['#808080', '#00ff88', '#00b4ff', '#ff00ff', '#ffd700'];
    return colors[rarity - 1] || colors[0];
  };

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      {stats && (
        <View style={styles.statsHeader}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalGames}</Text>
            <Text style={styles.statLabel}>Games</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.winRate.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.winStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>#{stats.rank}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'slots' && styles.tabActive]}
          onPress={() => setSelectedTab('slots')}
        >
          <Text style={styles.tabText}>🎰 Slots</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'tournaments' && styles.tabActive]}
          onPress={() => setSelectedTab('tournaments')}
        >
          <Text style={styles.tabText}>🏆 Tournaments</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'nfts' && styles.tabActive]}
          onPress={() => setSelectedTab('nfts')}
        >
          <Text style={styles.tabText}>🎨 NFTs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'leaderboard' && styles.tabActive]}
          onPress={() => setSelectedTab('leaderboard')}
        >
          <Text style={styles.tabText}>🏅 Leaderboard</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {selectedTab === 'slots' && renderSlotsTab()}
      {selectedTab === 'tournaments' && renderTournamentsTab()}
      {selectedTab === 'nfts' && renderNFTsTab()}
      {selectedTab === 'leaderboard' && renderLeaderboardTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  statsHeader: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: '#1a1a1a' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#00ff88' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#333' },
  tab: { flex: 1, padding: 16, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#00ff88' },
  tabText: { fontSize: 14, color: '#fff' },
  tabContent: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 24 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16 },
  slotDisplay: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 32, marginBottom: 16, minHeight: 200, justifyContent: 'center', alignItems: 'center' },
  spinningContainer: { alignItems: 'center' },
  spinningText: { fontSize: 18, color: '#00ff88', marginTop: 16 },
  resultContainer: { alignItems: 'center' },
  symbolsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  symbol: { fontSize: 64 },
  resultText: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 8 },
  winText: { color: '#00ff88' },
  winAmount: { fontSize: 24, fontWeight: 'bold', color: '#00ff88' },
  emptySlots: { alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#666', marginBottom: 16 },
  emptySymbols: { fontSize: 48 },
  tokenSelector: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  tokenButton: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 8, padding: 12, alignItems: 'center' },
  tokenActive: { backgroundColor: '#00ff88' },
  tokenText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  input: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 16, color: '#fff', fontSize: 16, marginBottom: 16 },
  quickBets: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBetButton: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 8, padding: 12, alignItems: 'center' },
  quickBetText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  spinButton: { backgroundColor: '#00ff88', borderRadius: 12, padding: 18, alignItems: 'center' },
  spinButtonDisabled: { backgroundColor: '#666' },
  spinButtonText: { fontSize: 18, fontWeight: 'bold', color: '#0a0a0a' },
  fairText: { fontSize: 12, color: '#00ff88', fontFamily: 'monospace', marginBottom: 8 },
  fairSubtext: { fontSize: 12, color: '#888' },
  tournamentCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16 },
  tournamentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tournamentName: { fontSize: 18, fontWeight: '600', color: '#fff' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, color: '#0a0a0a', fontWeight: '600' },
  tournamentInfo: { marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: '#fff', fontWeight: '600' },
  joinButton: { backgroundColor: '#00ff88', borderRadius: 8, padding: 12, alignItems: 'center' },
  joinButtonText: { fontSize: 16, fontWeight: '600', color: '#0a0a0a' },
  nftGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  nftCard: { width: '47%', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12 },
  rarityBadge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, zIndex: 1 },
  rarityText: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  nftImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8, backgroundColor: '#2a2a2a' },
  nftName: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 4 },
  nftDescription: { fontSize: 12, color: '#888' },
  emptyState: { alignItems: 'center', marginTop: 48 },
  emptyStateText: { fontSize: 18, color: '#666', marginBottom: 8 },
  emptyStateSubtext: { fontSize: 14, color: '#888' },
  userRankCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center' },
  userRankText: { fontSize: 20, fontWeight: 'bold', color: '#00ff88', marginBottom: 4 },
  userWinnings: { fontSize: 16, color: '#fff' },
  leaderboardEntry: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 },
  rankBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00ff88', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankText: { fontSize: 16, fontWeight: 'bold', color: '#0a0a0a' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  playerStats: { fontSize: 12, color: '#888' },
  playerWinnings: { fontSize: 16, fontWeight: 'bold', color: '#00ff88' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleContainer: { flexDirection: 'row', gap: 8 },
  toggleButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#2a2a2a', borderRadius: 8 },
  toggleActive: { backgroundColor: '#00ff88' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  unityContainer: { height: 600, marginBottom: 16, borderRadius: 12, overflow: 'hidden' },
  webview: { flex: 1 },
});
