// ZeaZDev [Frontend Screen - Game] //
// Project: ZeaZDev FiGaTect Super-App //
// Version: 1.0.0 (Omega Scaffolding) //
// Author: ZeaZDev Meta-Intelligence (Generated) //
// --- DO NOT EDIT HEADER --- //

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
