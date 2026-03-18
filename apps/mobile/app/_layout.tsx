import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setReady(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => setSession(s),
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready) return;

    const inAuth = segments[0] === 'auth';

    if (!session && !inAuth) {
      router.replace('/auth/login');
    } else if (session && inAuth) {
      router.replace('/');
    }
  }, [session, segments, ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </GestureHandlerRootView>
  );
}
