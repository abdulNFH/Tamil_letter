// app/training/[letter]/free-draw.tsx
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import ViewShot, { captureRef } from "react-native-view-shot";

import DrawingCanvas, { DrawingCanvasRef } from "../../../components/DrawingCanvas";
import ProgressDots from "../../../components/ProgressDots";
import { COLORS } from "../../../constants/colors";
import { awardStars } from "../../../lib/progress";
import { speak } from "../../../lib/tts";
import { predictFromUri } from "../../../services/predictionService";

const BOX = 320;

export default function FreeDrawTwoPhase() {
  const { letter } = useLocalSearchParams<{ letter: string }>();
  const uc = String(letter || "A"); // Capital
  const lc = uc.toLowerCase();       // Small

  const [phase, setPhase] = useState<"uc" | "lc">("uc");
  const [loading, setLoading] = useState(false);

  const shotRef = useRef<ViewShot>(null);
  const canvasRef = useRef<DrawingCanvasRef>(null);

  // Speak instruction when phase changes
  useEffect(() => {
    speak(phase === "uc" ? `Write  ${uc}` : `Write small ${lc}`);
    canvasRef.current?.clear();
  }, [phase, uc, lc]);

  const clearAll = () => {
    canvasRef.current?.clear();
  };

  const matchesTarget = (pred: string | undefined | null) => {
    const p = (pred || "").trim();
    return phase === "uc" ? p === uc : p === lc;
  };

  const checkWithModel = async () => {
    const strokes = canvasRef.current?.getStrokes() || [];
    if (!strokes.some((s) => s.length > 5)) {
      Alert.alert("Draw first", `Please draw the letter ${phase === "uc" ? uc : lc}.`);
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      // Capture canvas
      const uri = await captureRef(shotRef, { format: "jpg", quality: 0.92 });

      // Call backend
      const res = await predictFromUri(uri);
      const top = res.top1;

      if (!top?.label) {
        speak("Hmm, I could not read that. Try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      // Check if prediction matches target
      if (matchesTarget(top.label)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        speak("Great job!");

        if (phase === "uc") {
          setTimeout(() => setPhase("lc"), 500); // Move to small letter
        } else {
          // Both phases done → award stars
          await awardStars(lc, "drawStars", 3);
          Alert.alert(
            "Well done!",
            "You completed Free Draw for both capital and small.",
            [
              {
                text: "Finish",
                onPress: () =>
                  router.replace({
                    pathname: "/training/[letter]",
                    params: { letter: uc },
                  } as any),
              },
            ],
          );
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        speak(`I saw ${top.label}. Try again.`);
      }
    } catch (e: any) {
      speak("Network error. Please try again.");
      Alert.alert("Network Error", String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 16 }}>
      <Stack.Screen options={{ title: "Free Draw" }} />

      {/* Header */}
      <Text style={{ color: COLORS.text, marginBottom: 6 }}>
        {phase === "uc" ? `Write Capital ${uc}` : `Write Small ${lc}`}
      </Text>
      <ProgressDots total={2} value={phase === "uc" ? 0 : 1} />

      {/* Big Letter */}
      <View style={{ alignItems: "center", marginVertical: 12 }}>
        <Text style={{ fontSize: 180, fontWeight: "900", color: COLORS.navy }}>
          {phase === "uc" ? uc : lc}
        </Text>
      </View>

      {/* Canvas */}
      <View style={{ alignItems: "center" }}>
        <ViewShot
          ref={shotRef}
          style={{
            width: BOX,
            height: BOX,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: COLORS.navy,
            backgroundColor: "#fff",
            overflow: "hidden",
          }}
        >
          <DrawingCanvas ref={canvasRef} size={BOX} strokeWidth={12} />
        </ViewShot>
      </View>

      {/* Controls */}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          marginTop: 16,
          justifyContent: "center",
        }}
      >
        <Pressable
          onPress={clearAll}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 16,
            backgroundColor: COLORS.card,
            borderRadius: 12,
          }}
        >
          <Text>Clear</Text>
        </Pressable>

        <Pressable
          onPress={checkWithModel}
          disabled={loading}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 18,
            backgroundColor: COLORS.yellow,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.navy,
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Text style={{ fontWeight: "900", color: COLORS.navy }}>
            {loading ? "Checking…" : "Check"}
          </Text>
        </Pressable>
      </View>

      {loading && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.05)",
          }}
        >
          <ActivityIndicator size="large" color={COLORS.navy} />
        </View>
      )}
    </View>
  );
}