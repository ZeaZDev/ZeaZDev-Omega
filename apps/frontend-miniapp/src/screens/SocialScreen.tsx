import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';

export default function SocialScreen() {
  const [profile, setProfile] = useState({
    displayName: 'Anonymous',
    bio: 'DeFi enthusiast',
    level: 1,
    experience: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [feed, setFeed] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');

  const createPost = () => {
    if (!newPost.trim()) return;
    setFeed([
      {
        id: Date.now().toString(),
        content: newPost,
        likes: 0,
        comments: 0,
        timestamp: new Date(),
      },
      ...feed,
    ]);
    setNewPost('');
  };

  const achievements = [
    { icon: '🎮', title: 'First Game', description: 'Played your first slot game', xp: 100 },
    { icon: '💰', title: 'Staker', description: 'Staked 1000 ZEA', xp: 250 },
    { icon: '🌉', title: 'Bridge Master', description: 'Bridged tokens cross-chain', xp: 200 },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>👥 Social</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile.displayName}</Text>
          <Text style={styles.profileBio}>{profile.bio}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>Lv.{profile.level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🏆 Achievements</Text>
        {achievements.map((achievement, index) => (
          <View key={index} style={styles.achievementRow}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDesc}>{achievement.description}</Text>
            </View>
            <Text style={styles.achievementXP}>+{achievement.xp} XP</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📝 Create Post</Text>
        <TextInput
          style={styles.postInput}
          value={newPost}
          onChangeText={setNewPost}
          placeholder="Share your thoughts..."
          placeholderTextColor="#64748B"
          multiline
        />
        <TouchableOpacity style={styles.postButton} onPress={createPost}>
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📰 Community Feed</Text>
        {feed.length === 0 ? (
          <Text style={styles.emptyText}>No posts yet. Be the first to post!</Text>
        ) : (
          feed.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <Text style={styles.postContent}>{post.content}</Text>
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionText}>❤️ {post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionText}>💬 {post.comments}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  profileCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 40,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
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
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#0F172A',
    borderRadius: 8,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },
  achievementXP: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  postInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    minHeight: 80,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    padding: 20,
  },
  postCard: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  postContent: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
