import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ThunderJS from "ThunderJS/module/thunderJS";
import VoiceButton from './voice_button';

const actionMapper = {
  'Back': 8,
  'OK': 13,
  'Home': 36,
  'Left': 37,
  'Up': 38,
  'Right': 39,
  'Down': 40,
};


const keyCodeMap: Record<string, number> = {
   '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53,
   '6': 54, '7': 55, '8': 56, '9': 57,
   'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69, 'f': 70,
   'g': 71, 'h': 72, 'i': 73, 'j': 74, 'k': 75, 'l': 76,
   'm': 77, 'n': 78, 'o': 79, 'p': 80, 'q': 81, 'r': 82,
   's': 83, 't': 84, 'u': 85, 'v': 86, 'w': 87, 'x': 88,
   'y': 89, 'z': 90,
   'A': 65, 'B': 66, 'C': 67, 'D': 68, 'E': 69, 'F': 70,
   'G': 71, 'H': 72, 'I': 73, 'J': 74, 'K': 75, 'L': 76,
   'M': 77, 'N': 78, 'O': 79, 'P': 80, 'Q': 81, 'R': 82,
   'S': 83, 'T': 84, 'U': 85, 'V': 86, 'W': 87, 'X': 88,
   'Y': 89, 'Z': 90,
 };
 
 
 export default function RCUScreen() {
  const [thunder, setThunder] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const router = useRouter();
   const KeyboardInput = () => {
     const [text, setText] = useState('');
   
     const handleChange = (input: string) => {
       // Compare with previous to get last character typed
       const lastChar = input[input.length - 1];
       const keyCode = keyCodeMap[lastChar];
   
       if (keyCode !== undefined) {
         thunder.call('org.rdk.RDKShell', 'injectKey', { keyCode });
         console.log(`Sent key: ${lastChar}, keyCode: ${keyCode}`);
       }
   
       setText(input);
     };

     return (
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type here"
          value={text}
          onChangeText={handleChange}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="default"
        />
      </View>
    );
  };

  useEffect(() => {
    const initThunder = async () => {
      try {
        const stored = await AsyncStorage.getItem('@selectedDevice');
        const device = stored ? JSON.parse(stored) : null;
        if (device && device.ip) {
          const config = { host: device.ip, port: 9998, default: 1 };
          setThunder(ThunderJS(config));
        }
      } catch (err) {
        console.error('Failed to initialize ThunderJS:', err);
      }
    };
    initThunder();
  }, []);

  useEffect(() => {
    const startListener = ExpoSpeechRecognitionModule.addListener('start', () => {
      console.log('🎤 Voice started');
    });
    const resultListener = ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const transcript = event.results[0].transcript.toLowerCase();
      console.log('🎙️ Recognized:', transcript);
      mapVoiceToKey(transcript);
    });
    const errorListener = ExpoSpeechRecognitionModule.addListener('error', (e) => {
      console.error('Voice error:', e.message);
       ExpoSpeechRecognitionModule.requestPermissionsAsync().then((result) => {
        console.log("Status:", result.status); // "granted" | "denied" | "not-determined"
        console.log("Granted:", result.granted); // true | false
        console.log("Can ask again:", result.canAskAgain); // true | false
        console.log("Expires:", result.expires); // "never" | number
      });
    });

    return () => {
      startListener.remove();
      resultListener.remove();
      errorListener.remove();
    };
  }, [thunder]);

  const mapVoiceToKey = (speech: string) => {
    const map = {
      'up': 'Up',
      'down': 'Down',
      'left': 'Left',
      'right': 'Right',
      'ok': 'OK',
      'back': 'Back',
      'home': 'Home',
    };
    const key = map[speech.trim()];
    if (key && thunder) {
      thunder.call('org.rdk.RDKShell', 'injectKey', { keyCode: actionMapper[key] });
    } else {
      console.log(`❌ Unrecognized voice command: "${speech}"`);
    }
    setIsRecording(!isRecording);
  };

  const toggleRecording = () => {
    if (isRecording) {
      ExpoSpeechRecognitionModule.stop();
    } else {
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: true,
      });
    }
    setIsRecording(!isRecording);
  };

  const handlePress = (action: string) => {
    thunder?.call('org.rdk.RDKShell', 'injectKey', { keyCode: actionMapper[action] });
  };

  return (
    <View style={styles.container}>
      {/* Voice Button in Top-Right */}
      {/* <TouchableOpacity style={styles.voiceButton} onPress={toggleRecording}>
        <Ionicons name={isRecording ? 'mic-off' : 'mic'} size={28} color="#fff" />
      </TouchableOpacity> */}
       <View style={styles.container}>
         <VoiceButton />
      </View>

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

        <KeyboardInput />
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
  voiceButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    backgroundColor: '#007aff',
    padding: 10,
    borderRadius: 30,
    zIndex: 10,
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
  inputContainer: {
   marginTop: 20,
   width: '80%',
 },
 textInput: {
   borderWidth: 1,
   borderColor: '#007aff',
   padding: 12,
   borderRadius: 8,
   fontSize: 18,
   backgroundColor: '#fff',
 },
});
