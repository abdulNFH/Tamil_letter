import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";
import { TAMIL_LETTERS } from "../../constants/tamilLetters";
import { getLetterProgress, LetterProgress } from "../../lib/progress";

function Stars({ n }: { n: number }) {
  return (
    <Text style={{ color: COLORS.yellow, fontSize: 14 }}>
      {"★".repeat(n).padEnd(3, "☆")}
    </Text>
  );
}

export default function TamilLetterPicker() {
  const [progress, setProgress] = useState<Record<string, LetterProgress>>({});

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const all: Record<string, LetterProgress> = {};

    for (const L of TAMIL_LETTERS) {
      all[L] = await getLetterProgress(L);
    }

    setProgress(all);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "900",
            color: COLORS.navy,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          🔠 Tamil Letter Training
        </Text>

        <FlatList
          data={TAMIL_LETTERS}
          keyExtractor={(item) => item}
          numColumns={3}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => {
            const p = progress[item];

            return (
              <Link
                href={{
                  pathname: "/training/[letter]",
                  params: { letter: item },
                }}
                asChild
              >
                <Pressable
                  style={{
                    flex: 1,
                    height: 120,
                    borderRadius: 18,
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: COLORS.teal,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 46,
                      fontWeight: "900",
                      color: COLORS.navy,
                    }}
                  >
                    {item}
                  </Text>

                  <View style={{ marginTop: 6 }}>
                    <Stars n={p?.traceStars ?? 0} />
                  </View>
                </Pressable>
              </Link>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}
