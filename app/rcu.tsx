import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ThunderJS from 'ThunderJS/module/thunderJS';

const actionMapper = {
  'Back': 8,
  'OK': 13,
  'Home': 36,
  'Left': 37,
  'Up': 38,
  'Right': 39,
  'Down': 40,
};

export default function RCUScreen() {
  const router = useRouter();
  const [thunder, setThunder] = useState<any>(null);

  useEffect(() => {
    const initThunder = async () => {
      try {
        const json = await AsyncStorage.getItem('@selectedDevice');
        if (!json) return;
        const device = JSON.parse(json);
        const config = {
          host: device.ip,
          port: 9998,
          default: 1,
        };
        console.log('Connecting to Thunder at', config.host);
        const thunderInstance = ThunderJS(config);
        setThunder(thunderInstance);
      } catch (err) {
        console.error('Failed to initialize ThunderJS:', err);
      }
    };

    initThunder();
  }, []);

  const handlePress = (action: string) => {
    console.log(`Pressed: ${action}`);
    if (thunder) {
      thunder.call('org.rdk.RDKShell', 'injectKey', { keyCode: actionMapper[action] });
    } else {
      console.warn('Thunder not initialized yet.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Remote Control</Text>

      <View style={styles.dPad}>
        <TouchableOpacity onPress={() => handlePress('Up')} style={styles.dButton}>
          <Text style={styles.dText}>↑</Text>
        </TouchableOpacity>

        <View style={styles.middleRow}>
          <TouchableOpacity onPress={() => handlePress('Left')} style={styles.dButton}>
            <Text style={styles.dText}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handlePress('OK')} style={[styles.dButton, styles.okButton]}>
            <Text style={styles.okText}>OK</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handlePress('Right')} style={styles.dButton}>
            <Text style={styles.dText}>→</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => handlePress('Down')} style={styles.dButton}>
          <Text style={styles.dText}>↓</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <Button title="Back" onPress={() => handlePress('Back')} />
        <Button title="Home" onPress={() => handlePress('Home')} />
        <Button title="Exit" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dPad: {
    alignItems: 'center',
    gap: 16,
  },
  middleRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dButton: {
    backgroundColor: '#007aff',
    borderRadius: 8,
    padding: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dText: {
    fontSize: 24,
    color: '#fff',
  },
  okButton: {
    backgroundColor: '#28a745',
  },
  okText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
});
