// app/training/uyirmei/Game.tsx
import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

import { COLORS } from "../../constants/colors";
import {
  TAMIL_VOWELS,
  TAMIL_BASE_CONSONANTS,
  combineUyirMei,
} from "../../constants/tamilLetters";
import {
  getUyirmeiProgress,
  updateUyirmeiScore,
  getHighScore,
  saveHighScore,
} from "../../lib/progress";

import ConfettiBurst from "../../components/ConfettiBurst";

const MAX_HEARTS = 3;
const TIME_PER_ROUND = 6;
const OPTIONS_COUNT = 6;

type RoundData = {
  mei: string;
  uyir: string;
  fullLetter: string;
  hiddenPart: "mei" | "uyir";
  options: string[];
  correctIndex: number;
};

async function speak(text: string) {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const tamilVoice = voices.find((v) => v.language.startsWith("ta"));

    Speech.stop();

    Speech.speak(text, {
      voice: tamilVoice?.identifier,
      rate: 0.9,
      pitch: 1,
    });
  } catch (err) {
    console.log("Speech error:", err);
  }
}

export default function UyirmeiGame() {
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timer, setTimer] = useState(TIME_PER_ROUND);
  const [highScore, setHighScore] = useState(0);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const hs = await getHighScore();
      setHighScore(hs);
    })();
  }, []);

  const buildRound = async () => {
    const progress = await getUyirmeiProgress();
    const candidates: { full: string; scoreValue: number }[] = [];

    for (let mei of TAMIL_BASE_CONSONANTS) {
      for (let uyir of TAMIL_VOWELS) {
        const full = combineUyirMei(mei, uyir);
        const stat = progress[full] ?? { correct: 0, wrong: 0 };
        candidates.push({ full, scoreValue: stat.correct - stat.wrong });
      }
    }

    candidates.sort((a, b) => a.scoreValue - b.scoreValue);

    const fullLetter = candidates[0].full;
    const mei = fullLetter[0];
    const uyir = fullLetter.slice(1);

    const hiddenPart: "mei" | "uyir" =
      Math.random() < 0.5 ? "mei" : "uyir";

    let options: string[] = [];

    if (hiddenPart === "mei") {
      options.push(mei);

      while (options.length < OPTIONS_COUNT) {
        const m =
          TAMIL_BASE_CONSONANTS[
            Math.floor(
              Math.random() * TAMIL_BASE_CONSONANTS.length
            )
          ];

        if (!options.includes(m)) options.push(m);
      }
    } else {
      options.push(uyir);

      while (options.length < OPTIONS_COUNT) {
        const u =
          TAMIL_VOWELS[
            Math.floor(Math.random() * TAMIL_VOWELS.length)
          ];

        if (!options.includes(u)) options.push(u);
      }
    }

    options.sort(() => Math.random() - 0.5);

    const correctIndex = options.indexOf(
      hiddenPart === "mei" ? mei : uyir
    );

    setRoundData({
      mei,
      uyir,
      fullLetter,
      hiddenPart,
      options,
      correctIndex,
    });

    setPickedIndex(null);
    setWasCorrect(null);
    setTimer(TIME_PER_ROUND);
  };

  useEffect(() => {
    if (!roundData) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleWrong();
          return TIME_PER_ROUND;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roundData]);

  useEffect(() => {
    if (!roundData) return;
    speak(roundData.fullLetter);
  }, [roundData]);

  const handleWrong = async () => {
    setHearts((h) => h - 1);
    setWasCorrect(false);

    if (roundData)
      await updateUyirmeiScore(roundData.fullLetter, false);

    if (hearts - 1 <= 0) {
      setFinalScore(score);

      await saveHighScore(score);

      const hs = await getHighScore();
      setHighScore(hs);

      setShowPopup(true);
      return;
    }

    setTimeout(() => nextRound(), 600);
  };

  const onPick = async (idx: number) => {
    if (!roundData || pickedIndex !== null) return;

    setPickedIndex(idx);

    const ok = idx === roundData.correctIndex;

    setWasCorrect(ok);

    await updateUyirmeiScore(roundData.fullLetter, ok);

    if (ok) {
      setScore((s) => s + 1);
      setShowConfetti(true);

      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    } else {
      setHearts((h) => h - 1);
    }

    if (hearts - (ok ? 0 : 1) <= 0) {
      const final = score + (ok ? 1 : 0);

      setTimeout(async () => {
        setFinalScore(final);

        await saveHighScore(final);

        const hs = await getHighScore();
        setHighScore(hs);

        setShowPopup(true);
      }, 600);
    } else {
      setTimeout(() => nextRound(), 600);
    }
  };

  const nextRound = () => {
    setRound((r) => r + 1);
    buildRound();
  };

  useEffect(() => {
    buildRound();

    return () => {
      Speech.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Uyir-Mei Game" }} />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.hearts}>{"❤️".repeat(hearts)}</Text>

        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>High</Text>
          <Text style={styles.scoreValue}>{highScore}</Text>
        </View>
      </View>

      {/* TIMER */}
      <View style={styles.timer}>
        <Text style={styles.timerText}>⏱ {timer}s</Text>
      </View>

      {roundData && (
        <View style={styles.card}>
          <Text style={styles.letter}>
            {roundData.hiddenPart === "mei"
              ? "?"
              : roundData.mei}
            {roundData.hiddenPart === "uyir"
              ? "?"
              : roundData.uyir}
          </Text>

          <Pressable
            style={styles.listenBtn}
            onPress={() => speak(roundData.fullLetter)}
          >
            <Text style={styles.listenText}>🔊 Hear Again</Text>
          </Pressable>

          <Text style={styles.equation}>
            {roundData.hiddenPart === "mei"
              ? "? + " +
                roundData.uyir +
                " = " +
                roundData.fullLetter
              : roundData.mei +
                " + ? = " +
                roundData.fullLetter}
          </Text>
        </View>
      )}

      <View style={styles.options}>
        {roundData?.options.map((opt, idx) => (
          <Pressable
            key={idx}
            style={[
              styles.option,
              pickedIndex === idx &&
                (wasCorrect
                  ? styles.correct
                  : styles.wrong),
            ]}
            onPress={() => onPick(idx)}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </Pressable>
        ))}
      </View>

      {showConfetti && (
        <ConfettiBurst
          count={25}
          duration={1200}
          onDone={() => setShowConfetti(false)}
        />
      )}

      <Modal visible={showPopup} transparent animationType="fade">
        <View style={styles.modalWrap}>
          <View style={styles.modal}>
            <Text style={styles.gameOver}>🎉 Game Over</Text>

            <Text style={styles.finalScore}>
              Score: {finalScore}
            </Text>

            <Text style={styles.highScore}>
              High Score: {highScore}
            </Text>

            <Pressable
              style={styles.homeBtn}
              onPress={() => router.replace("/training")}
            >
              <Text style={styles.homeText}>
                🏠 Back to Home
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
  },

  hearts: {
    fontSize: 32,
  },

  scoreBox: {
    backgroundColor: COLORS.card,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  scoreLabel: {
    fontSize: 12,
    color: "#666",
  },

  scoreValue: {
    fontSize: 18,
    fontWeight: "bold",
  },

  timer: {
    marginVertical: 12,
    backgroundColor: "#FFF3D6",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },

  timerText: {
    fontSize: 18,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },

  letter: {
    fontSize: 80,
    fontWeight: "900",
    color: COLORS.navy,
  },

  listenBtn: {
    marginTop: 12,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },

  listenText: {
    color: "white",
    fontSize: 16,
  },

  equation: {
    fontSize: 24,
    color: COLORS.teal,
    marginTop: 10,
    fontWeight: "bold",
  },

  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },

  option: {
    width: "30%",
    padding: 18,
    marginBottom: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
  },

  optionText: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.navy,
  },

  correct: {
    backgroundColor: "#DCFCE7",
  },

  wrong: {
    backgroundColor: "#FEE2E2",
  },

  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    backgroundColor: "white",
    padding: 28,
    borderRadius: 24,
    alignItems: "center",
    width: "80%",
  },

  gameOver: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 12,
  },

  finalScore: {
    fontSize: 22,
    marginBottom: 8,
  },

  highScore: {
    fontSize: 20,
    color: COLORS.teal,
  },

  homeBtn: {
    marginTop: 14,
  },

  homeText: {
    fontSize: 20,
    color: COLORS.navy,
  },
});