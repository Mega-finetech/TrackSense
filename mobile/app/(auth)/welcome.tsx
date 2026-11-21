import type { ReactElement } from 'react';
import { Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen(): ReactElement {
  return (
    <ImageBackground
      source={require('../../assets/branding/landing-background.png')}
      resizeMode="cover"
      style={styles.background}
    >
      <StatusBar style="light" />
      <View pointerEvents="none" style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} bounces={false}>
          <View style={styles.brand}>
            <View style={styles.logoContainer}>
              <Image
              source={require('../../assets/branding/logo.png')}
              style={styles.logo}
              fadeDuration={0}
              accessibilityLabel="TrackSense"
              />
            </View>
            <Text style={styles.subtitle}>A better you. Every day.</Text>
          </View>

          <View style={styles.spacer} />

          <View style={styles.footer}>
            <Text style={styles.description}>
              Track your goals, tasks, study, projects and more — all in one place.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.8}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Already have an account? Sign in"
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}
              style={styles.signIn}
            >
              <Text style={styles.signInText}>
                Already have an account? <Text style={styles.signInLink}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', backgroundColor: '#0A1E14' },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(10,30,20,0.45)' },
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: { paddingTop: 80, alignItems: 'center' },
  logoContainer: { backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 180, height: 180, resizeMode: 'contain' },
  subtitle: { marginTop: 8, fontSize: 16, lineHeight: 24, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  spacer: { flex: 1, minHeight: 64 },
  footer: { width: '100%', paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },
  description: {
    paddingHorizontal: 16, // With the outer 24px, copy sits 40px from each edge.
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#52B788',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  signIn: { marginTop: 16, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  signInText: { fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  signInLink: { fontWeight: '700', color: '#FFFFFF' },
});

