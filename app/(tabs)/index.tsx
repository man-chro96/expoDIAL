import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { XMLParser } from 'fast-xml-parser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, NativeEventEmitter, NativeModules, StyleSheet, View } from 'react-native';

const { SSDPModule } = NativeModules;
const ssdpEventEmitter = new NativeEventEmitter(SSDPModule);

const DISCOVERY_TIMEOUT = 10000;

async function getXmlFromUrl(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch XML from ${url}:`, error);
    // throw error;
  }
}

function parseDeviceXml(xmlText: string) {
  const parser = new XMLParser({ ignoreAttributes: false });
  const device = parser.parse(xmlText)?.root?.device;
  return {
    friendlyName: device?.friendlyName,
    manufacturer: device?.manufacturer,
    modelName: device?.modelName,
    udn: device?.UDN
  };
}

type Device = {
  friendlyName: string;
  manufacturer: string;
  modelName: string;
  udn: string;
  ip: string;
};

const saveSelectedDevice = async (device: Device) => {
  try {
    await AsyncStorage.setItem('@selectedDevice', JSON.stringify(device));
    console.log('✅ Device saved');
  } catch (e) {
    console.error('❌ Failed to save device', e);
  }
};

const loadSelectedDevice = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('@selectedDevice');
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('❌ Failed to load device', e);
    return null;
  }
};

export default function HomeScreen() {

  const [devices, setDevices] = useState<Device[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryProgress, setDiscoveryProgress] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const intervalRef = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    const loadSelectedDevice = async () => {
      try {
        const json = await AsyncStorage.getItem('@selectedDevice');
        if (json) {
          setSelectedDevice(JSON.parse(json));
        }
      } catch (err) {
        console.error('Error loading selected device:', err);
      }
    };
  
    loadSelectedDevice();
  }, []);

  const handleDiscovery = useCallback(() => {
    if (isDiscovering) {
      SSDPModule.stopDiscovery();
      setIsDiscovering(false);
      setDiscoveryProgress(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else {
      setSelectedDevice(null);
      setDevices([]);
      setIsDiscovering(true);
      setDiscoveryProgress(0);

      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min((elapsed / DISCOVERY_TIMEOUT) * 100, 100);
        setDiscoveryProgress(percent);
        if (elapsed >= DISCOVERY_TIMEOUT) {
          clearInterval(intervalRef.current!);
        }
      }, 100);

      SSDPModule.startDiscovery(
        { discoveryTimeout: DISCOVERY_TIMEOUT },
        (msg: string) => console.log('Discovery callback:', msg)
      );
    }
  }, [isDiscovering]);

  useEffect(() => {
    const responseListener = ssdpEventEmitter.addListener('SSDPResponse', async (location: string) => {
      console.log('📡 Found DIAL device at:', location);
      try {
        const xml = await getXmlFromUrl(location);
        const ipMatch = location.match(/^http:\/\/([^\:]+):/);
        const ip = ipMatch ? ipMatch[1] : ''; // Ensure we get the IP address
        const { friendlyName, manufacturer, modelName, udn } = parseDeviceXml(xml);
        if (friendlyName) {
          const device = {
            friendlyName,
            manufacturer,
            modelName,
            udn,
            ip 
          };
          console.log("DEVICE", JSON.stringify(device));
          setDevices((prevDevices) => [...prevDevices, device]);
        }
        
      } catch (err) {
        console.error('Error fetching or parsing XML:', err);
      }
    });

    const errorListener = ssdpEventEmitter.addListener('SSDPError', (error: string) => {
      console.error('❌ SSDP Error:', error);
    });

    const stopListener = ssdpEventEmitter.addListener('SSDPStopped', () => {
      console.log('🔚 SSDP discovery finished');
      setIsDiscovering(false);
      setDiscoveryProgress(100);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    });

    return () => {
      responseListener.remove();
      errorListener.remove();
      stopListener.remove();
    };
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image source={require('@/assets/images/partial-react-logo.png')} style={styles.reactLogo} />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">DIAL DISCOVERY</ThemedText>
      </ThemedView>
      <ThemedText>Devices Found:</ThemedText>
      {devices.map((device, idx) => (
        <View key={idx} style={styles.deviceItem}>
          <Button
            title={selectedDevice?.udn === device.udn ? `🔘 ${device.friendlyName}` : `⚪️ ${device.friendlyName}`}
            onPress={() => setSelectedDevice(device)}
            color={selectedDevice?.udn === device.udn ? '#007AFF' : undefined}
          />
        </View>
      ))}

      {
        selectedDevice && (
          <Button
            title="Connect"
            onPress={() => {
              console.log("Connected to device " + JSON.stringify(selectedDevice) );
              saveSelectedDevice(selectedDevice);
            }} />
        )
      }

      <View style={styles.buttonContainer}>
        <Button
          title={isDiscovering ? 'Stop DIAL Discovery' : 'Start DIAL Discovery'}
          onPress={handleDiscovery}
        />

      {isDiscovering && (
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color="#007aff" />
          <ThemedText>{Math.floor(discoveryProgress)}%</ThemedText>
        </View>
      )}

      {selectedDevice ? (
        <ThemedText>Selected Device: {selectedDevice.udn} {selectedDevice.ip} </ThemedText>
      ) : (
        <ThemedText>No device selected</ThemedText>
      )}

    

      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  spinnerContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  deviceItem: {
    marginVertical: 4,
  }
});
