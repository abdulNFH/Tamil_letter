import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import * as Haptics from "expo-haptics";

import { COLORS } from "../../constants/colors";
import { speak } from "../../lib/tts";
import ConfettiBurst from "../../components/ConfettiBurst";
import { savePuzzleScore, getPuzzleScore } from "../../lib/progress";

const ROUNDS = 7;

const LETTERS = [
  "அ","ஆ","இ","ஈ","உ","ஊ",
  "எ","ஏ","ஐ","ஒ","ஓ","ஔ",
  "க","ங","ச","ஞ","ட","ண",
  "த","ந","ப","ம","ய","ர",
  "ல","வ","ழ","ள","ற","ன"
];

const BANK = [
  { word: "பூ", missing: 0, emoji: "🌸", name: "பூ" },
  { word: "நாய்", missing: 0, emoji: "🐶", name: "நாய்" },
  { word: "பால்", missing: 0, emoji: "🥛", name: "பால்" },
  { word: "மரம்", missing: 0, emoji: "🌳", name: "மரம்" },
  { word: "கல்", missing: 0, emoji: "🪨", name: "கல்" },
  { word: "பல்", missing: 0, emoji: "🦷", name: "பல்" },
  { word: "மீன்", missing: 0, emoji: "🐟", name: "மீன்" },
  { word: "தீ", missing: 0, emoji: "🔥", name: "தீ" },
  { word: "மாடு", missing: 0, emoji: "🐄", name: "மாடு" },
  { word: "பறவை", missing: 0, emoji: "🐦", name: "பறவை" },
  { word: "சூரியன்", missing: 0, emoji: "☀️", name: "சூரியன்" },
  { word: "நிலா", missing: 0, emoji: "🌙", name: "நிலா" },
  { word: "ஆடு", missing: 0, emoji: "🐐", name: "ஆடு" },
  { word: "பந்து", missing: 1, emoji: "⚽", name: "பந்து" },
  { word: "புத்தகம்", missing: 1, emoji: "📚", name: "புத்தகம்" },
  { word: "கார்", missing: 1, emoji: "🚗", name: "கார்" },
  { word: "மாம்பழம்", missing: 0, emoji: "🥭", name: "மாம்பழம்" },
  { word: "வாழை", missing: 0, emoji: "🍌", name: "வாழை" },
  { word: "குடம்", missing: 0, emoji: "🏺", name: "குடம்" },
  { word: "முட்டை", missing: 0, emoji: "🥚", name: "முட்டை" },
];

const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

const splitTamilWord = (word: string) => {
  const regex = /[க-ஹ][்]?[ா-ிீுூெேைொோௌ]?|[அ-ஔ]|[ஃ]/g;
  return word.match(regex) || [];
};

export default function LetterPuzzle() {

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const [targetWord, setTargetWord] = useState("");
  const [missingIndex, setMissingIndex] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [emoji, setEmoji] = useState("");

  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiAnim] = useState(new Animated.Value(0));
  const [wrongChoiceIndex, setWrongChoiceIndex] = useState<number | null>(null);

  const sayInstruction = (item: any) => {
    speak(`இது என்ன படம்? ${item.name}. காணாமல் போன எழுத்தை தேர்வு செய்யவும்.`);
  };

  const buildRound = () => {

    const item = pick(BANK);
    const syllables = splitTamilWord(item.word);
    const correct = syllables[item.missing];

    const pool = LETTERS.filter((l) => l !== correct);

    const distractors: string[] = [];
    while (distractors.length < 3) {
      const d = pick(pool);
      if (!distractors.includes(d)) distractors.push(d);
    }

    const opts = [correct, ...distractors].sort(() => Math.random() - 0.5);

    setTargetWord(item.word);
    setMissingIndex(item.missing);
    setChoices(opts);
    setEmoji(item.emoji);

    sayInstruction(item);
  };

  useEffect(() => {
    buildRound();
    getPuzzleScore().then((p) => setHighScore(p.highScore));
  }, [round]);

  const next = async () => {

    if (round >= ROUNDS) {

      const updatedProgress = await savePuzzleScore(score);
      setHighScore(updatedProgress.highScore);

      speak(`நல்ல வேலை! உங்கள் மதிப்பெண் ${score}`);

      router.back();
      return;
    }

    setRound((r) => r + 1);
  };

  const selectLetter = (letter: string, index: number) => {

    const syllables = splitTamilWord(targetWord);
    const correct = letter === syllables[missingIndex];

    if (correct) {

      setScore((s) => s + 1);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      speak(targetWord);

      confettiAnim.setValue(0);
      setShowConfetti(true);

      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => setShowConfetti(false));

      setTimeout(() => next(), 800);

    } else {

      setWrongChoiceIndex(index);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      speak(`தவறு. சரியான எழுத்து ${syllables[missingIndex]}`);

      setTimeout(() => {
        setWrongChoiceIndex(null);
        next();
      }, 800);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>

      <Stack.Screen options={{ title: "Tamil Letter Game" }} />

      <View style={styles.header}>
        <Text style={styles.round}>Round {round} / {ROUNDS}</Text>
        <Text style={styles.score}>Score {score} | High {highScore}</Text>
      </View>

      <View style={styles.stage}>

        <View style={styles.card}>

          <Text style={styles.emoji}>{emoji}</Text>

          <View style={styles.wordRow}>

            {splitTamilWord(targetWord).map((ch, i) => {

              if (i === missingIndex) {
                return (
                  <View key={i} style={styles.slot}>
                    <Text style={styles.slotText}>_</Text>
                  </View>
                );
              }

              return (
                <View key={i} style={styles.letterBox}>
                  <Text style={styles.letterText}>{ch}</Text>
                </View>
              );
            })}

          </View>
        </View>

        <View style={styles.choiceGrid}>

          {choices.map((l, i) => (
            <Pressable
              key={i}
              style={[
                styles.choiceBtn,
                wrongChoiceIndex === i ? { backgroundColor: "red" } : null,
              ]}
              onPress={() => selectLetter(l, i)}
            >
              <Text style={styles.choiceText}>{l}</Text>
            </Pressable>
          ))}

        </View>

        {showConfetti && (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                transform: [
                  {
                    translateY: confettiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -180],
                    }),
                  },
                  {
                    scale: confettiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 2],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <ConfettiBurst count={20} duration={900} />
          </Animated.View>
        )}

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },

  round: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.navy,
  },

  score: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.navy,
  },

  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 30,
  },

  card: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 24,
    paddingVertical: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 40,
  },

  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },

  wordRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },

  letterBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FDFF",
  },

  letterText: {
    fontSize: 34,
    fontWeight: "900",
    color: COLORS.navy,
  },

  slot: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7D6",
  },

  slotText: {
    fontSize: 32,
    fontWeight: "900",
  },

  choiceGrid: {
    width: "85%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },

  choiceBtn: {
    width: "47%",
    height: 70,
    borderRadius: 18,
    backgroundColor: COLORS.yellow,
    borderWidth: 3,
    borderColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  choiceText: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.navy,
  },

});