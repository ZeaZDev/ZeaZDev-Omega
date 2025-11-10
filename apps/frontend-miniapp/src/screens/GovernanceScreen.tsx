// ZeaZDev [Frontend - Governance Screen] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Complete) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  endBlock: number;
}

export default function GovernanceScreen() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votingPower, setVotingPower] = useState('0');
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    targets: '',
    values: '',
    calldatas: '',
  });

  useEffect(() => {
    loadProposals();
    loadVotingPower();
  }, []);

  const loadProposals = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/governance/proposals?limit=20`);
      const data = await response.json();
      setProposals(data);
    } catch (error) {
      console.error('Failed to load proposals:', error);
      // Fallback to empty array on error
      setProposals([]);
    }
  };

  const loadVotingPower = async () => {
    try {
      // In production, get user's wallet address from auth context
      const userAddress = '0x1234567890123456789012345678901234567890'; // Placeholder
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/governance/voting-power/${userAddress}`);
      const data = await response.json();
      setVotingPower(data.votingPower);
    } catch (error) {
      console.error('Failed to load voting power:', error);
      setVotingPower('0');
    }
  };

  const createProposal = async () => {
    try {
      if (!newProposal.title || !newProposal.description) {
        Alert.alert('Error', 'Title and description are required');
        return;
      }

      const userAddress = '0x1234567890123456789012345678901234567890'; // Placeholder
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/governance/proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposer: userAddress,
          title: newProposal.title,
          description: newProposal.description,
          targets: newProposal.targets ? newProposal.targets.split(',') : [],
          values: newProposal.values ? newProposal.values.split(',') : [],
          calldatas: newProposal.calldatas ? newProposal.calldatas.split(',') : [],
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Proposal created successfully!');
        setShowCreateProposal(false);
        setNewProposal({
          title: '',
          description: '',
          targets: '',
          values: '',
          calldatas: '',
        });
        loadProposals();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create proposal');
    }
  };

  const vote = async (proposalId: string, support: 0 | 1 | 2) => {
    try {
      const userAddress = '0x1234567890123456789012345678901234567890'; // Placeholder
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/governance/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          voter: userAddress,
          support,
          votingPower,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const supportText = support === 0 ? 'Against' : support === 1 ? 'For' : 'Abstain';
        Alert.alert('Success', `Voted ${supportText} on proposal`);
        loadProposals();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cast vote');
    }
  };

  const formatVotes = (votes: string) => {
    const value = BigInt(votes) / BigInt(10 ** 18);
    return value.toLocaleString() + ' ZEA';
  };

  const renderProposal = ({ item }: { item: Proposal }) => (
    <View style={styles.proposalCard}>
      <View style={styles.proposalHeader}>
        <Text style={styles.proposalTitle}>{item.title}</Text>
        <View style={[
          styles.statusBadge,
          item.status === 'active' ? styles.statusActive : styles.statusInactive
        ]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.proposalDescription}>{item.description}</Text>
      
      <View style={styles.votesContainer}>
        <View style={styles.voteRow}>
          <Text style={styles.voteLabel}>For:</Text>
          <Text style={[styles.voteValue, styles.voteFor]}>
            {formatVotes(item.forVotes)}
          </Text>
        </View>
        <View style={styles.voteRow}>
          <Text style={styles.voteLabel}>Against:</Text>
          <Text style={[styles.voteValue, styles.voteAgainst]}>
            {formatVotes(item.againstVotes)}
          </Text>
        </View>
        <View style={styles.voteRow}>
          <Text style={styles.voteLabel}>Abstain:</Text>
          <Text style={[styles.voteValue, styles.voteAbstain]}>
            {formatVotes(item.abstainVotes)}
          </Text>
        </View>
      </View>

      {item.status === 'active' && (
        <View style={styles.voteButtons}>
          <TouchableOpacity
            style={[styles.voteButton, styles.voteForButton]}
            onPress={() => vote(item.id, 1)}
          >
            <Text style={styles.voteButtonText}>Vote For</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.voteButton, styles.voteAgainstButton]}
            onPress={() => vote(item.id, 0)}
          >
            <Text style={styles.voteButtonText}>Vote Against</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.voteButton, styles.voteAbstainButton]}
            onPress={() => vote(item.id, 2)}
          >
            <Text style={styles.voteButtonText}>Abstain</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (showCreateProposal) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowCreateProposal(false)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Proposal</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter proposal title"
            value={newProposal.title}
            onChangeText={(text) => setNewProposal({ ...newProposal, title: text })}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter detailed description"
            value={newProposal.description}
            onChangeText={(text) => setNewProposal({ ...newProposal, description: text })}
            multiline
            numberOfLines={5}
          />

          <Text style={styles.label}>Target Addresses (comma-separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="0x..., 0x..."
            value={newProposal.targets}
            onChangeText={(text) => setNewProposal({ ...newProposal, targets: text })}
          />

          <Text style={styles.label}>Values (comma-separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="0, 0"
            value={newProposal.values}
            onChangeText={(text) => setNewProposal({ ...newProposal, values: text })}
          />

          <Text style={styles.label}>Calldatas (comma-separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="0x..., 0x..."
            value={newProposal.calldatas}
            onChangeText={(text) => setNewProposal({ ...newProposal, calldatas: text })}
          />

          <TouchableOpacity style={styles.createButton} onPress={createProposal}>
            <Text style={styles.createButtonText}>Create Proposal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>DAO Governance</Text>
        <View style={styles.votingPowerContainer}>
          <Text style={styles.votingPowerLabel}>Your Voting Power:</Text>
          <Text style={styles.votingPowerValue}>{formatVotes(votingPower)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.createProposalButton}
        onPress={() => setShowCreateProposal(true)}
      >
        <Text style={styles.createProposalButtonText}>+ Create New Proposal</Text>
      </TouchableOpacity>

      <FlatList
        data={proposals}
        renderItem={renderProposal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No proposals yet</Text>
            <Text style={styles.emptySubtext}>Be the first to create one!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 10,
  },
  votingPowerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  votingPowerLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  votingPowerValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  createProposalButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createProposalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  proposalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#999',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  proposalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  votesContainer: {
    marginBottom: 15,
  },
  voteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  voteLabel: {
    fontSize: 14,
    color: '#666',
  },
  voteValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  voteFor: {
    color: '#4CAF50',
  },
  voteAgainst: {
    color: '#F44336',
  },
  voteAbstain: {
    color: '#FF9800',
  },
  voteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  voteButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  voteForButton: {
    backgroundColor: '#4CAF50',
  },
  voteAgainstButton: {
    backgroundColor: '#F44336',
  },
  voteAbstainButton: {
    backgroundColor: '#FF9800',
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 25,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
