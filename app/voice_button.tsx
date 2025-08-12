import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import React, { useEffect, useRef, useState } from 'react';
import {
   Animated,
   Easing,
   StyleSheet,
   Text,
   TouchableOpacity,
   View
} from 'react-native';
import ThunderJS from "ThunderJS/module/thunderJS";

const config = {
  host: '192.168.1.6',
  port: 9998,
  default: 1,
};
const thunder = ThunderJS(config);

export default function VoiceButton() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const startListener = ExpoSpeechRecognitionModule.addListener('start', () => {
      setError(null);
      console.log('Speech recognition started');
    });

    const resultListener = ExpoSpeechRecognitionModule.addListener('result', (event) => {
      console.log('Speech result:', event.results);
      const text = event.results[0].transcript;
      setTranscript(text);
      sendTranscript(text);

      // stop listening after result
      stopRecording();
    });

    const errorListener = ExpoSpeechRecognitionModule.addListener('error', (event) => {
      console.error('Speech error:', event.message);
      setError(event.message);
      stopRecording();
    });

    return () => {
      startListener.remove();
      resultListener.remove();
      errorListener.remove();
    };
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startRecording = () => {
    setIsRecording(true);
    startPulse();

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: false,
      maxAlternatives: 1,
      continuous: false,
      requiresOnDeviceRecognition: false,
    });

    timeoutRef.current = setTimeout(() => {
      // If no result after 5 seconds, abort
      if (isRecording) stopRecording();
    }, 5000);
  };

  const stopRecording = () => {
    ExpoSpeechRecognitionModule.stop();
    setIsRecording(false);
    stopPulse();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const sendTranscript = (text: string) => {
    console.log("Transcript received:", text);
    // Example: always send OK key for test
    thunder.call('org.rdk.RDKShell', 'injectKey', { keyCode: 13 });
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.micButton, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity onPress={isRecording ? stopRecording : startRecording}>
          <Text style={styles.micText}>{isRecording ? '🛑' : '🎤'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  micButton: {
    backgroundColor: '#007AFF',
    borderRadius: 40,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  micText: {
    fontSize: 24,
    color: '#fff',
  },
});
