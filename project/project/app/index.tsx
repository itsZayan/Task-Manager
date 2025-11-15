import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    scale.value = withSequence(
      withTiming(1.1, { duration: 600 }),
      withTiming(1, { duration: 400 })
    );
    rotate.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (session) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/auth');
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [session, loading, router]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <LinearGradient colors={['#0A0E27', '#1A1F3A', '#2E3856']} style={styles.container}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <Animated.View style={rotateStyle}>
          <LinearGradient
            colors={['#667EEA', '#764BA2', '#F093FB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logo}>
            <Text style={styles.logoText}>TM</Text>
          </LinearGradient>
        </Animated.View>
        <Text style={styles.title}>TaskMaster AI</Text>
        <Text style={styles.subtitle}>Smart Task Management</Text>
      </Animated.View>
      <ActivityIndicator size="large" color="#667EEA" style={styles.loader} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  logoText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 3,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#A0AEC0',
    letterSpacing: 1,
  },
  loader: {
    position: 'absolute',
    bottom: 100,
  },
});
