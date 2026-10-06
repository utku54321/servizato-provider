// Synchronous key-value storage for the app (a drop-in for the web version's localStorage).
// Everything is loaded from AsyncStorage once at startup (initStorage), then reads are
// instant from memory and writes are saved to the phone in the background.
import AsyncStorage from '@react-native-async-storage/async-storage';

const cache = {};

export async function initStorage() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys.filter((k) => k.startsWith('servizato-')));
    pairs.forEach(([k, v]) => { if (v != null) cache[k] = v; });
  } catch {
    // Storage unavailable: start empty, the app still works for this session.
  }
}

export const storage = {
  getItem: (key) => (key in cache ? cache[key] : null),
  setItem: (key, value) => {
    cache[key] = String(value);
    AsyncStorage.setItem(key, String(value)).catch(() => {});
  },
  removeItem: (key) => {
    delete cache[key];
    AsyncStorage.removeItem(key).catch(() => {});
  },
};
