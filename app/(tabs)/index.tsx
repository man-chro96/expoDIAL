import { Image } from 'expo-image';
import { useCallback } from 'react';
import { Button, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { NativeModules } from 'react-native';

const { SSDPModule } = NativeModules;

export default function HomeScreen() {
  const handleDiscovery = useCallback(() => {
    SSDPModule.startDiscovery((message: string) => {
      console.log('Callback from SSDP:', message);
    });
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">DIAL DISCOVERY</ThemedText>
      </ThemedView>

      <View style={styles.buttonContainer}>
        <Button title="Start DIAL Discovery" onPress={handleDiscovery} />
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
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
});
