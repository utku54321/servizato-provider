// App shell shared by the three apps: startup (load saved data), screen stack with the
// Android back button, and the toast message.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { initStorage } from './storage.js';
import { C } from './ui.js';

/** Screen stack: [{ name, ...params }]. The last entry is the visible screen. */
export function useNav(first) {
  const [stack, setStack] = useState([first]);
  const depth = useRef(1);
  depth.current = stack.length;

  // Android back button / gesture: go back one screen, or leave the app from the first one.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (depth.current > 1) { setStack((s) => s.slice(0, -1)); return true; }
      return false;
    });
    return () => sub.remove();
  }, []);

  const nav = useMemo(() => ({
    go: (name, params = {}) => setStack((s) => [...s, { name, ...params }]),
    back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    tab: (name, params = {}) => setStack([{ name, ...params }]),
    replace: (entries) => setStack(entries),
  }), []);
  return [stack, nav];
}

export function useToast() {
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  return [toast, setToast];
}

/** Root component: waits for saved data to load, then shows the app. */
export function Boot({ App }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { initStorage().finally(() => setReady(true)); }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {ready ? <App /> : <ActivityIndicator style={{ flex: 1 }} color={C.blue} />}
      </View>
    </SafeAreaProvider>
  );
}
