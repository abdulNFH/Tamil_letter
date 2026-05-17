import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../../constants/colors";

// 🎮 Game list
const GAMES = [
  {
    key: "puzzle",
    title: "Puzzle",
    emoji: "🧩",
    href: "/games/puzzle",
  },
  {
    key: "broken_letter",
    title: "Broken Letter",
    emoji: "🔧",
    href: "/games/brokenletter",
  },
  {
    key: "uyirmei_reco",
    title: "Uyir-Mei Recognition",
    emoji: "🔤",
    href: "/games/uyirmeireco",
  },
];

// 📊 Get stored score
const getGameScore = async (key: string) => {
  const val = await AsyncStorage.getItem(`game_score_${key}`);
  return val ? parseInt(val) : 0;
};

export default function GamesHub() {
  const [unlocked, setUnlocked] = useState<string[]>([]);

  // 🔁 Load unlocks
  useEffect(() => {
    (async () => {
      const newUnlocked: string[] = [];

      for (let i = 0; i < GAMES.length; i++) {
        if (i === 0) {
          newUnlocked.push(GAMES[i].key);
        } else {
          const prevScore = await getGameScore(GAMES[i - 1].key);

          if (prevScore >= 10) {
            newUnlocked.push(GAMES[i].key);
          }
        }
      }

      setUnlocked(newUnlocked);
    })();
  }, []);

  const GameNode = ({
    title,
    emoji,
    href,
    locked,
  }: {
    title: string;
    emoji: string;
    href: string;
    locked: boolean;
  }) => (
    <Pressable
      onPress={() => {
        if (locked) {
          Alert.alert("🔒 Locked Game", "Score 10 points to unlock this level!");
        } else {
          router.push(href as never);
        }
      }}
      style={{
        width: 140,
        height: 140,
        borderRadius: 999,
        backgroundColor: locked ? "#E2E2E2" : "#fff",
        borderWidth: 3,
        borderColor: locked ? "#999" : COLORS.teal,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        opacity: locked ? 0.7 : 1,
      }}
    >
      <Text style={{ fontSize: 40 }}>{emoji}</Text>

      <Text
        style={{
          fontWeight: "900",
          fontSize: 16,
          color: COLORS.navy,
          textAlign: "center",
          marginTop: 6,
        }}
      >
        {locked ? "🔒 " + title : title}
      </Text>
    </Pressable>
  );

  // 🔓 Developer unlock
  const handleUnlockAll = () => {
    const allKeys = GAMES.map((g) => g.key);
    setUnlocked(allKeys);
    Alert.alert("✅ All games unlocked!");
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#E9F5F7" }}
      contentContainerStyle={{ padding: 20, alignItems: "center" }}
    >
      <Text
        style={{
          fontSize: 26,
          fontWeight: "900",
          color: COLORS.navy,
          marginBottom: 16,
        }}
      >
        🗺️ Adventure Map
      </Text>

      {/* Developer Unlock */}
      <Pressable
        onPress={handleUnlockAll}
        style={{
          backgroundColor: COLORS.teal,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          🔓 Unlock All (Developer Mode)
        </Text>
      </Pressable>

      {/* 🎮 Vertical Game Path */}
      {GAMES.map((game, index) => (
        <View key={game.key} style={{ alignItems: "center" }}>
          <GameNode
            title={game.title}
            emoji={game.emoji}
            href={game.href}
            locked={!unlocked.includes(game.key)}
          />

          {/* Down Arrow */}
          {index < GAMES.length - 1 && (
            <Text style={{ fontSize: 30, marginVertical: 10, color: COLORS.navy }}>
              ⬇️
            </Text>
          )}
        </View>
      ))}

      {/* 🎯 Final Reward */}
      <View style={{ alignItems: "center", marginTop: 20 }}>
        <Text style={{ fontSize: 16, color: COLORS.text, marginBottom: 6 }}>
          🎯 Final Reward
        </Text>

        <GameNode
          title="Sticker Album"
          emoji="🐼🎨"
          href=""
          locked={false}
        />
      </View>
    </ScrollView>
  );
}