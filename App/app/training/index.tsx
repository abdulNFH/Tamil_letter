import { Href, Link } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";

/* ---------- Button Component ---------- */
type BigBtnProps = {
  href: Href;
  label: string;
  emoji: string;
};

const BigBtn: React.FC<BigBtnProps> = ({ href, label, emoji }) => (
  <Link href={href} asChild>
    <Pressable
      style={{
        backgroundColor: "#fff",
        borderColor: COLORS.teal,
        borderWidth: 1.4,
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: 22 }}>{emoji}</Text>

      <Text
        style={{
          fontWeight: "900",
          color: COLORS.navy,
          fontSize: 18,
        }}
      >
        {label}
      </Text>
    </Pressable>
  </Link>
);

/* ---------- Main Screen ---------- */
export default function TrainingHome() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          flex: 1,
          padding: 20,
          justifyContent: "center",
        }}
      >
        {/* Header */}
        <View
          style={{
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <Text
            style={{
              fontSize: 30,
              fontWeight: "900",
              color: COLORS.navy,
            }}
          >
            📚 Tamil Letter Training
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: COLORS.text,
              marginTop: 6,
              textAlign: "center",
            }}
          >
            Practice writing Tamil letters
          </Text>
        </View>

        {/* Training Button */}
        <BigBtn
          href="/training/letters"
          label="Start Tamil Letter Training"
          emoji="🔠"
        />
      </View>
    </SafeAreaView>
  );
}
