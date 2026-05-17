import * as Speech from 'expo-speech';

export async function speak(text: string) {
  const voices = await Speech.getAvailableVoicesAsync();

  // Find a Tamil voice
  const tamilVoice = voices.find((v) => v.language.startsWith('ta'));

  // Stop previous speech
  Speech.stop();

  Speech.speak(text, {
    voice: tamilVoice?.identifier, // pick Tamil voice if available
    rate: 0.9,
    pitch: 1,
  });
}