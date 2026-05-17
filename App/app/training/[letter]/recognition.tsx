import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Modal } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../constants/colors';
import { TAMIL_LETTERS } from '../../../constants/tamilLetters';
import { awardStars } from '../../../lib/progress';
import HintButton from '../../../components/HintButton';
import { speak } from '../../../lib/tts';
import ConfettiBurst from '../../../components/ConfettiBurst';

const ROUNDS = 6;
const OPTIONS_COUNT = 8;

const PRAISES = [
  'சிறந்த வேலை!', 'அற்புதம்!', 'நன்று செய்தீர்கள்!', 'மிகச் சிறந்தது!',
  'அருமை!', 'நீங்கள் அதை செய்தீர்கள்!', 'பிரில்லியன்ட்!', 'சிறந்த முயற்சி!', 'யே!', 'பெர்பெக்ட்!'
];

const ENCOURAGE = [
  'மிகவும் அருகில்! மறுபடியும் முயற்சி செய்யுங்கள்.',
  'குறுக்கு முயற்சி, மறுபடியும் முயற்சி செய்யுங்கள்.',
  'மறுபடியும் முயற்சி செய்யலாம்.',
  'நீங்கள் செய்யலாம்!',
  'தொடருங்கள்!'
];

// Optional: small confusions for similar-looking letters
const TAMIL_CONFUSIONS: Record<string, string[]> = {
  "அ": ["ஆ","இ"], "ஆ": ["அ","ஈ"], "இ": ["ஈ","அ"], "ஈ": ["இ","ஏ"],
  "க": ["ச","க"], "ச": ["ஜ","ச"], "ட": ["த","ட"], "த": ["ட","ந"],
  "ப": ["ம","ப"], "ம": ["ப","ந"], "ய": ["ர","ய"], "ர": ["ல","ர"],
  "ல": ["ள","ல"], "ழ": ["ள","ழ"], "ள": ["ழ","ள"], "ற": ["ன","ற"], "ன": ["ற","ன"]
};

function choose<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomTamilLetter() {
  return TAMIL_LETTERS[Math.floor(Math.random() * TAMIL_LETTERS.length)];
}

function buildOptions(target: string) {
  const pool = new Set<string>();
  const conf = TAMIL_CONFUSIONS[target] ?? [];
  conf.forEach(c => { if (c !== target) pool.add(c); });

  while (pool.size < OPTIONS_COUNT - 1) {
    const sym = randomTamilLetter();
    if (sym !== target) pool.add(sym);
  }

  const distractors = Array.from(pool).slice(0, OPTIONS_COUNT - 1);
  const all = [...distractors, target].sort(() => Math.random() - 0.5);
  const correctIndex = all.indexOf(target);
  return { target, options: all, correctIndex };
}

export default function TamilRecognition() {
  const { letter } = useLocalSearchParams<{ letter: string }>();
  const targetLetter = String(letter || TAMIL_LETTERS[0]);

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [{ target, options, correctIndex }, setQ] = useState(buildOptions(targetLetter));

  // For hint animation per option
  const hintScales = useRef(options.map(() => new Animated.Value(1))).current;
  const [hinted, setHinted] = useState(false);

  const pickedScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    speak(`Tap letter ${target}`);
  }, [target]);

  const [locked, setLocked] = useState(false);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [finalStars, setFinalStars] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  const doHint = () => {
    if (hinted) return; // prevent multiple hits per round
    setHinted(true);
    Animated.sequence([
      Animated.timing(hintScales[correctIndex], { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.timing(hintScales[correctIndex], { toValue: 1.0, duration: 150, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const nextRound = async (ok: boolean) => {
    if (round >= ROUNDS) {
      const total = score + (ok ? 1 : 0);
      const stars = total >= 5 ? 3 : total >= 4 ? 2 : total >= 3 ? 1 : 0;

      await awardStars(targetLetter, 'recognitionStars', stars);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      speak('சிறந்த வேலை! Recognition complete!');
      setFinalStars(stars);
      setFinalScore(total);
      setShowPopup(true);
      return;
    }

    setRound(r => r + 1);
    setQ(buildOptions(targetLetter));
    setPickedIndex(null);
    setWasCorrect(null);
    setLocked(false);
    setHinted(false); // reset hint for new round
  };

  const onPick = async (idx: number) => {
    if (locked) return;
    setLocked(true);
    setPickedIndex(idx);

    const ok = idx === correctIndex;
    setWasCorrect(ok);

    if (ok) {
      setScore(s => s + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      speak(choose(PRAISES));

      pickedScale.setValue(1);
      Animated.sequence([
        Animated.timing(pickedScale, { toValue: 1.12, duration: 120, useNativeDriver: true }),
        Animated.spring(pickedScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();

      setShowConfetti(true);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      speak(choose(ENCOURAGE));
    }

    setTimeout(() => {
      nextRound(ok);
    }, 620);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 16 }}>
      <Stack.Screen options={{ title: 'Tamil Recognition' }} />

      <View style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <Pressable
          onPress={() => router.replace('/training')}
          style={{
            width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff',
            borderWidth: 2, borderColor: COLORS.navy,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
          }}
        >
          <Ionicons name="home-outline" size={26} color={COLORS.navy} />
        </Pressable>
      </View>

      <Text style={{ color: COLORS.text, marginBottom: 8 }}>Round {round} of {ROUNDS}</Text>
      <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.navy, marginBottom: 12 }}>
        Tap the letter: <Text style={{ color: COLORS.teal }}>{target}</Text>
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {options.map((opt, idx) => {
          const isPicked = idx === pickedIndex;
          const bg =
            isPicked && wasCorrect === true ? '#DCFCE7' :
            isPicked && wasCorrect === false ? '#FEE2E2' :
            COLORS.card;
          const border =
            isPicked && wasCorrect === true ? '#22c55e' :
            isPicked && wasCorrect === false ? '#ef4444' :
            COLORS.border;
          const scaleForThis =
            isPicked && wasCorrect === true ? pickedScale :
            hintScales[idx];

          return (
            <Animated.View
              key={idx}
              style={{
                width: '47%',
                marginBottom: 16,
                transform: [{ scale: scaleForThis as any }],
              }}
            >
              <Pressable
                disabled={locked}
                onPress={() => onPick(idx)}
                style={{
                  paddingVertical: 28,
                  borderRadius: 16,
                  backgroundColor: bg,
                  borderWidth: 1,
                  borderColor: border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 44, fontWeight: '900', color: COLORS.navy }}>{opt}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <HintButton onPress={doHint} />

      <Text style={{ textAlign: 'center', marginTop: 12, color: COLORS.text }}>
        Tip: Try without hints to earn more ⭐
      </Text>

      {showConfetti && (
        <ConfettiBurst count={22} duration={1100} onDone={() => setShowConfetti(false)} />
      )}

      <Modal visible={showPopup} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 20, alignItems: 'center', width: '80%' }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.navy, marginBottom: 6 }}>🎉 சிறந்த வேலை!</Text>
            <Text style={{ fontSize: 16, color: COLORS.text, marginBottom: 12, textAlign: 'center' }}>
              You completed all {ROUNDS} rounds successfully!
            </Text>
            <Text style={{ fontSize: 18, marginBottom: 6 }}>
              ⭐ Stars: {'★'.repeat(finalStars).padEnd(3, '☆')}
            </Text>
            <Text style={{ fontSize: 16, marginBottom: 20 }}>
              Score: {finalScore}/{ROUNDS}
            </Text>

            <Pressable
              onPress={() => {
                setShowPopup(false);
                router.push({ pathname: '/training/[letter]/free-draw', params: { letter: targetLetter } } as any);
              }}
              style={{ backgroundColor: COLORS.teal, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Go to Free Draw ➡️</Text>
            </Pressable>

            <Pressable onPress={() => { setShowPopup(false); router.replace('/training'); }} style={{ marginTop: 10 }}>
              <Text style={{ color: COLORS.navy, fontWeight: '600' }}>🏠 Back to Home</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}