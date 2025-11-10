/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Frontend-Game
 * @File: GameScreen.tsx
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-10
 * @Version: 2.0.0 (Phase 7: Advanced GameFi)
 * @Description: Advanced GameFi interface supporting slots, poker, roulette, and sports betting
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';

type GameType = 'menu' | 'slots' | 'poker' | 'roulette' | 'sports';

interface GameStats {
  totalGames: number;
  totalWon: number;
  totalLost: number;
  totalWinnings: string;
  winRate: number;
}

export default function GameScreen() {
  const [selectedGame, setSelectedGame] = useState<GameType>('menu');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);

  // Slots state
  const [slotBet, setSlotBet] = useState('10');
  const [slotResult, setSlotResult] = useState<any>(null);

  // Poker state
  const [pokerBet, setPokerBet] = useState('50');
  const [pokerResult, setPokerResult] = useState<any>(null);

  // Roulette state
  const [rouletteBet, setRouletteBet] = useState('10');
  const [rouletteType, setRouletteType] = useState<'number' | 'color' | 'even-odd'>('color');
  const [rouletteValue, setRouletteValue] = useState<any>('red');
  const [rouletteResult, setRouletteResult] = useState<any>(null);

  // Sports state
  const [sportsEvents, setSportsEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [sportsBet, setSportsBet] = useState('100');
  const [sportsPrediction, setSportsPrediction] = useState<'TEAM_A' | 'TEAM_B'>('TEAM_A');

  useEffect(() => {
    loadStats();
    if (selectedGame === 'sports') {
      loadSportsEvents();
    }
  }, [selectedGame]);

  const loadStats = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/game/stats/user_123`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadSportsEvents = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/game/sports/events`);
      const data = await response.json();
      setSportsEvents(data.events || []);
    } catch (error) {
      console.error('Failed to load sports events:', error);
    }
  };

  const playSlots = async () => {
    if (!slotBet || parseFloat(slotBet) <= 0) {
      Alert.alert('Error', 'Please enter a valid bet amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/game/slots/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_123',
          betAmount: ethers.parseEther(slotBet).toString(),
          tokenUsed: 'ZEA',
          txHash: `0x${Date.now()}`,
        }),
      });
      const data = await response.json();
      setSlotResult(data.result);
      if (data.result.outcome === 'won') {
        Alert.alert('🎉 Winner!', `You won ${data.result.multiplier}x your bet!`);
      }
      loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to play slots');
    } finally {
      setLoading(false);
    }
  };

  const playPoker = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/game/poker/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'poker_session_123',
          betAmount: ethers.parseEther(pokerBet).toString(),
        }),
      });
      const data = await response.json();
      setPokerResult(data.result);
      if (data.result.outcome === 'won') {
        Alert.alert('🃏 Nice Hand!', `You got ${data.result.hand}!`);
      }
      loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to play poker');
    } finally {
      setLoading(false);
    }
  };

  const playRoulette = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/game/roulette/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_123',
          betAmount: ethers.parseEther(rouletteBet).toString(),
          betType: rouletteType,
          betValue: rouletteValue,
          token: 'ZEA',
        }),
      });
      const data = await response.json();
      setRouletteResult(data.result);
      if (data.result.outcome === 'won') {
        Alert.alert('🎡 Winner!', `Ball landed on ${data.result.spinResult}!`);
      }
      loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to play roulette');
    } finally {
      setLoading(false);
    }
  };

  const placeSportsBet = async () => {
    if (!selectedEvent) {
      Alert.alert('Error', 'Please select an event');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/game/sports/bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_123',
          eventId: selectedEvent.id,
          prediction: sportsPrediction,
          betAmount: ethers.parseEther(sportsBet).toString(),
          token: 'ZEA',
        }),
      });
      const data = await response.json();
      Alert.alert('Bet Placed!', `Potential payout: ${data.potentialPayout} ZEA`);
      loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  const renderGameMenu = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎮 Game Center</Text>
      <Text style={styles.subtitle}>Choose your game</Text>

      {/* Stats Card */}
      {stats && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalGames}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.winRate.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{parseFloat(ethers.formatEther(stats.totalWinnings)).toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Won</Text>
            </View>
          </View>
        </View>
      )}

      {/* Game Selection */}
      <View style={styles.gamesGrid}>
        <TouchableOpacity style={styles.gameCard} onPress={() => setSelectedGame('slots')}>
          <Text style={styles.gameIcon}>🎰</Text>
          <Text style={styles.gameName}>Slots</Text>
          <Text style={styles.gameDesc}>Spin to win big!</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gameCard} onPress={() => setSelectedGame('poker')}>
          <Text style={styles.gameIcon}>🃏</Text>
          <Text style={styles.gameName}>Poker</Text>
          <Text style={styles.gameDesc}>Test your luck</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gameCard} onPress={() => setSelectedGame('roulette')}>
          <Text style={styles.gameIcon}>🎡</Text>
          <Text style={styles.gameName}>Roulette</Text>
          <Text style={styles.gameDesc}>Classic casino</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gameCard} onPress={() => setSelectedGame('sports')}>
          <Text style={styles.gameIcon}>⚽</Text>
          <Text style={styles.gameName}>Sports</Text>
          <Text style={styles.gameDesc}>Bet on events</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSlotsGame = () => (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => setSelectedGame('menu')} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🎰 Slots</Text>

      <View style={styles.gameInterface}>
        {slotResult && (
          <View style={styles.slotResult}>
            <View style={styles.slotSymbols}>
              {slotResult.symbols.map((symbol: string, i: number) => (
                <Text key={i} style={styles.slotSymbol}>{symbol}</Text>
              ))}
            </View>
            <Text style={[styles.resultText, slotResult.outcome === 'won' && styles.winText]}>
              {slotResult.outcome === 'won' ? `🎉 Won ${slotResult.multiplier}x!` : '😔 Lost'}
            </Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          value={slotBet}
          onChangeText={setSlotBet}
          placeholder="Bet amount (ZEA)"
          placeholderTextColor="#666"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={styles.playButton}
          onPress={playSlots}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#0a0a0a" /> : <Text style={styles.playButtonText}>Spin!</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPokerGame = () => (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => setSelectedGame('menu')} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🃏 Poker</Text>

      <View style={styles.gameInterface}>
        {pokerResult && (
          <View style={styles.pokerResult}>
            <View style={styles.pokerCards}>
              {pokerResult.cards.map((card: string, i: number) => (
                <Text key={i} style={styles.pokerCard}>{card}</Text>
              ))}
            </View>
            <Text style={styles.handName}>{pokerResult.hand}</Text>
            <Text style={[styles.resultText, pokerResult.outcome === 'won' && styles.winText]}>
              {pokerResult.outcome === 'won' ? `Won ${pokerResult.multiplier}x!` : 'Better luck next time'}
            </Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          value={pokerBet}
          onChangeText={setPokerBet}
          placeholder="Bet amount (ZEA)"
          placeholderTextColor="#666"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={styles.playButton}
          onPress={playPoker}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#0a0a0a" /> : <Text style={styles.playButtonText}>Deal Hand</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderRouletteGame = () => (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => setSelectedGame('menu')} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🎡 Roulette</Text>

      <View style={styles.gameInterface}>
        {rouletteResult && (
          <View style={styles.rouletteResult}>
            <Text style={styles.rouletteNumber}>{rouletteResult.spinResult}</Text>
            <Text style={styles.rouletteColor}>
              {rouletteResult.isRed ? '🔴 Red' : (rouletteResult.spinResult === 0 ? '🟢 Green' : '⚫ Black')}
            </Text>
            <Text style={[styles.resultText, rouletteResult.outcome === 'won' && styles.winText]}>
              {rouletteResult.outcome === 'won' ? '🎉 Winner!' : 'Try again'}
            </Text>
          </View>
        )}

        <View style={styles.betTypeSelector}>
          <TouchableOpacity
            style={[styles.betTypeButton, rouletteType === 'color' && styles.betTypeActive]}
            onPress={() => setRouletteType('color')}
          >
            <Text style={styles.betTypeText}>Color</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.betTypeButton, rouletteType === 'even-odd' && styles.betTypeActive]}
            onPress={() => setRouletteType('even-odd')}
          >
            <Text style={styles.betTypeText}>Even/Odd</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.betTypeButton, rouletteType === 'number' && styles.betTypeActive]}
            onPress={() => setRouletteType('number')}
          >
            <Text style={styles.betTypeText}>Number</Text>
          </TouchableOpacity>
        </View>

        {rouletteType === 'color' && (
          <View style={styles.colorSelector}>
            <TouchableOpacity
              style={[styles.colorButton, styles.redButton, rouletteValue === 'red' && styles.colorActive]}
              onPress={() => setRouletteValue('red')}
            >
              <Text style={styles.colorButtonText}>Red</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.colorButton, styles.blackButton, rouletteValue === 'black' && styles.colorActive]}
              onPress={() => setRouletteValue('black')}
            >
              <Text style={styles.colorButtonText}>Black</Text>
            </TouchableOpacity>
          </View>
        )}

        <TextInput
          style={styles.input}
          value={rouletteBet}
          onChangeText={setRouletteBet}
          placeholder="Bet amount (ZEA)"
          placeholderTextColor="#666"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={styles.playButton}
          onPress={playRoulette}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#0a0a0a" /> : <Text style={styles.playButtonText}>Spin</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSportsBetting = () => (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => setSelectedGame('menu')} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>⚽ Sports Betting</Text>

      {sportsEvents.map((event) => (
        <TouchableOpacity
          key={event.id}
          style={[styles.eventCard, selectedEvent?.id === event.id && styles.eventCardActive]}
          onPress={() => setSelectedEvent(event)}
        >
          <View style={styles.eventHeader}>
            <Text style={styles.eventSport}>{event.sport}</Text>
            <Text style={styles.eventTime}>{new Date(event.startTime).toLocaleDateString()}</Text>
          </View>
          <View style={styles.eventTeams}>
            <Text style={styles.teamName}>{event.teamA}</Text>
            <Text style={styles.vs}>vs</Text>
            <Text style={styles.teamName}>{event.teamB}</Text>
          </View>
          <View style={styles.oddsRow}>
            <Text style={styles.odds}>{event.teamA}: {event.oddsTeamA}x</Text>
            <Text style={styles.odds}>{event.teamB}: {event.oddsTeamB}x</Text>
            {event.oddsDraw > 0 && <Text style={styles.odds}>Draw: {event.oddsDraw}x</Text>}
          </View>
        </TouchableOpacity>
      ))}

      {selectedEvent && (
        <View style={styles.betInterface}>
          <View style={styles.predictionSelector}>
            <TouchableOpacity
              style={[styles.predictionButton, sportsPrediction === 'TEAM_A' && styles.predictionActive]}
              onPress={() => setSportsPrediction('TEAM_A')}
            >
              <Text style={styles.predictionText}>{selectedEvent.teamA}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.predictionButton, sportsPrediction === 'TEAM_B' && styles.predictionActive]}
              onPress={() => setSportsPrediction('TEAM_B')}
            >
              <Text style={styles.predictionText}>{selectedEvent.teamB}</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            value={sportsBet}
            onChangeText={setSportsBet}
            placeholder="Bet amount (ZEA)"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.playButton}
            onPress={placeSportsBet}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#0a0a0a" /> : <Text style={styles.playButtonText}>Place Bet</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  // Render appropriate view based on selected game
  if (selectedGame === 'slots') return renderSlotsGame();
  if (selectedGame === 'poker') return renderPokerGame();
  if (selectedGame === 'roulette') return renderRouletteGame();
  if (selectedGame === 'sports') return renderSportsBetting();
  return renderGameMenu();
}

// Import ethers for formatting
const ethers = {
  parseEther: (val: string) => BigInt(parseFloat(val) * 1e18),
  formatEther: (val: string) => (parseFloat(val) / 1e18).toString(),
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 24 },
  backButton: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#00ff88', fontWeight: '600' },
  statsCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, marginBottom: 24 },
  statsTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#00ff88', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#888' },
  gamesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  gameCard: { width: '47%', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, alignItems: 'center' },
  gameIcon: { fontSize: 48, marginBottom: 12 },
  gameName: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 4 },
  gameDesc: { fontSize: 12, color: '#888', textAlign: 'center' },
  gameInterface: { marginTop: 24 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 16, color: '#fff', fontSize: 16, marginBottom: 16 },
  playButton: { backgroundColor: '#00ff88', borderRadius: 12, padding: 18, alignItems: 'center' },
  playButtonText: { fontSize: 18, fontWeight: 'bold', color: '#0a0a0a' },
  slotResult: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 24, marginBottom: 24, alignItems: 'center' },
  slotSymbols: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  slotSymbol: { fontSize: 64 },
  resultText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  winText: { color: '#00ff88' },
  pokerResult: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 24, marginBottom: 24, alignItems: 'center' },
  pokerCards: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pokerCard: { fontSize: 32, backgroundColor: '#2a2a2a', padding: 8, borderRadius: 8 },
  handName: { fontSize: 20, fontWeight: '600', color: '#00ff88', marginBottom: 8 },
  rouletteResult: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 24, marginBottom: 24, alignItems: 'center' },
  rouletteNumber: { fontSize: 72, fontWeight: 'bold', color: '#00ff88', marginBottom: 8 },
  rouletteColor: { fontSize: 24, marginBottom: 12 },
  betTypeSelector: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  betTypeButton: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, alignItems: 'center' },
  betTypeActive: { backgroundColor: '#00ff88' },
  betTypeText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  colorSelector: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  colorButton: { flex: 1, borderRadius: 8, padding: 16, alignItems: 'center' },
  redButton: { backgroundColor: '#dc2626' },
  blackButton: { backgroundColor: '#1a1a1a' },
  colorActive: { borderWidth: 3, borderColor: '#00ff88' },
  colorButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  eventCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 },
  eventCardActive: { borderWidth: 2, borderColor: '#00ff88' },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  eventSport: { fontSize: 12, color: '#00ff88', fontWeight: '600' },
  eventTime: { fontSize: 12, color: '#888' },
  eventTeams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  teamName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  vs: { fontSize: 14, color: '#888', marginHorizontal: 12 },
  oddsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  odds: { fontSize: 12, color: '#888' },
  betInterface: { marginTop: 24 },
  predictionSelector: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  predictionButton: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 8, padding: 16, alignItems: 'center' },
  predictionActive: { backgroundColor: '#00ff88' },
  predictionText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
