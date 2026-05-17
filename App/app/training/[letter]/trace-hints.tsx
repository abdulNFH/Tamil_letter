import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";

import DrawingCanvas, {
  DrawingCanvasRef,
} from "../../../components/DrawingCanvas";
import LetterGuide from "../../../components/LetterGuide";
import ProgressDots from "../../../components/ProgressDots";
import { COLORS } from "../../../constants/colors";
import { awardStars } from "../../../lib/progress";
import { speak } from "../../../lib/tts";

const REPS = 3;

export default function WriteWithHintsTamil() {
  const { letter } = useLocalSearchParams<{ letter: string }>();
  const tamilLetter = String(letter || "அ");

  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showGhost, setShowGhost] = useState(true);

  const [feedback, setFeedback] = useState<null | {
    type: "success" | "error";
    message: string;
    button?: { label: string; onPress: () => void };
  }>(null);

  const canvasRef = useRef<DrawingCanvasRef>(null);

  const ghostOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(ghostOpacity, {
      toValue: 0.16,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    speak(`Write the letter ${tamilLetter}`);
    canvasRef.current?.clear();
  }, [tamilLetter]);

  const onClear = () => {
    if (busy) return;
    canvasRef.current?.clear();
  };

  const checkTrace = async () => {
    const strokes = canvasRef.current?.getStrokes() || [];

    if (!strokes.some((s) => s.length > 5)) {
      speak("Try writing the letter properly");
      setFeedback({
        type: "error",
        message: "✍️ Please write the letter properly!",
      });
      return;
    }

    if (busy) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    speak("Good job!");

    const repsDone = count + 1;
    setCount(repsDone);

    canvasRef.current?.clear();

    if (repsDone < REPS) {
      setFeedback({
        type: "success",
        message: "✨ Nice! Write it again!",
      });
      return;
    }

    // Finished tracing
    await awardStars(tamilLetter, "traceStars", 3);

    speak("Excellent work!");

    setFeedback({
      type: "success",
      message: "🎉 Great! You finished tracing. Let's move to recognition!",
      button: {
        label: "Next ➡️",
        onPress: () => {
          setFeedback(null);
          router.push({
            pathname: "/training/[letter]/recognition",
            params: { letter: tamilLetter },
          } as any);
        },
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 16 }}>
      <Stack.Screen options={{ title: "Write the Letter" }} />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ color: COLORS.text, marginBottom: 4 }}>
            Write the Letter
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <Text
              style={{ fontSize: 28, fontWeight: "900", color: COLORS.navy }}
            >
              {tamilLetter}
            </Text>

            <ProgressDots total={REPS} value={count} />
          </View>
        </View>

        {/* Home Button */}
        <Pressable
          onPress={() => router.replace("/training")}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#fff",
            borderWidth: 2,
            borderColor: COLORS.navy,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 22 }}>🏠</Text>
        </Pressable>
      </View>

      {/* Letter Guide */}
      <View style={{ alignItems: "center", marginTop: 20 }}>
        <LetterGuide size={220} letter={tamilLetter} color="#0C2D57" />
      </View>

      {/* Drawing Canvas */}
      <View style={{ alignItems: "center", marginTop: 16 }}>
        <View
          style={{
            width: 320,
            height: 320,
            position: "relative",
            backgroundColor: "#fff",
            borderRadius: 16,
            borderWidth: 2,
            borderColor: "#0C2D57",
            overflow: "hidden",
          }}
        >
          {showGhost && (
            <Animated.Text
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 320,
                height: 320,
                textAlign: "center",
                fontSize: 250,
                color: "#000",
                opacity: ghostOpacity,
              }}
            >
              {tamilLetter}
            </Animated.Text>
          )}

          <DrawingCanvas ref={canvasRef} size={320} strokeWidth={12} />
        </View>
      </View>

      {/* Buttons */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          marginTop: 20,
          justifyContent: "center",
        }}
      >
        <Pressable
          onPress={onClear}
          style={{
            padding: 12,
            backgroundColor: COLORS.card,
            borderRadius: 12,
          }}
        >
          <Text>Clear</Text>
        </Pressable>

        <Pressable
          onPress={checkTrace}
          style={{
            padding: 12,
            backgroundColor: COLORS.yellow,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.navy,
          }}
        >
          <Text style={{ fontWeight: "900", color: COLORS.navy }}>
            I'm Done
          </Text>
        </Pressable>
      </View>

      {/* Feedback Popup */}
      {feedback && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 30,
          }}
        >
          <View
            style={{
              backgroundColor:
                feedback.type === "success" ? "#E6F4EA" : "#FEE2E2",
              borderRadius: 20,
              padding: 30,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "900",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              {feedback.message}
            </Text>

            {feedback.button ? (
              <Pressable
                onPress={feedback.button.onPress}
                style={{
                  marginTop: 16,
                  backgroundColor: COLORS.yellow,
                  paddingVertical: 10,
                  paddingHorizontal: 30,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontWeight: "900" }}>
                  {feedback.button.label}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setFeedback(null)}
                style={{
                  marginTop: 16,
                  padding: 10,
                }}
              >
                <Text>OK</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
