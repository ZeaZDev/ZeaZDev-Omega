/*
 * @Project: ZeaZDev FiGaTect Super-App
 * @Module: Frontend-Game
 * @File: GameScreen.tsx
 * @Author: ZeaZDev Enterprises (OMEGA AI)
 * @Date: 2025-11-09
 * @Version: 1.0.0
 * @Description: Game screen hosting Unity WebGL slot machine integration
 * @License: ZeaZDev Proprietary License
 * @Copyright: (c) 2025-2026 ZeaZDev. All rights reserved.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function GameScreen() {
  const unityUrl = process.env.UNITY_WEBGL_URL || 'http://localhost:8080';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎰 Game Center</Text>
      <WebView
        source={{ uri: unityUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', padding: 20 },
  webview: { flex: 1 },
});
