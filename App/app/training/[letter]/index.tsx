import { Link, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { COLORS } from "../../../constants/colors";

function Chip({ label }: { label: string }) {
  return (
    <View
      style={{
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: "#E6FAF9",
        borderWidth: 1,
        borderColor: "#4FB6B2",
      }}
    >
      <Text style={{ color: "#0C2D57", fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

export default function LetterHub() {
  const { letter } = useLocalSearchParams<{ letter: string }>();

  const tamilLetter = String(letter || "அ");

  const Btn = ({
    title,
    href,
    primary = false,
  }: {
    title: string;
    href: any;
    primary?: boolean;
  }) => (
    <Link href={href} asChild>
      <Pressable
        style={{
          paddingVertical: 16,
          paddingHorizontal: 18,
          borderRadius: 16,
          backgroundColor: primary ? COLORS.yellow : COLORS.card,
          borderWidth: 1,
          borderColor: primary ? COLORS.teal : COLORS.border,
          marginBottom: 12,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontWeight: "900",
            color: COLORS.navy,
            fontSize: primary ? 18 : 16,
          }}
        >
          {title}
        </Text>
      </Pressable>
    </Link>
  );

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: COLORS.bg }}>
      <Stack.Screen options={{ title: `Letter ${tamilLetter}` }} />

      {/* Big Tamil Letter */}
      <View
        style={{
          padding: 16,
          borderRadius: 18,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: COLORS.teal,
          marginBottom: 14,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 80,
            fontWeight: "900",
            color: COLORS.navy,
          }}
        >
          {tamilLetter}
        </Text>

        {/* Learning steps */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginTop: 10,
            flexWrap: "wrap",
          }}
        >
          <Chip label="1) Trace" />
          <Chip label="2) Recognize" />
          <Chip label="3) Free Draw" />
        </View>

        <Text
          style={{ textAlign: "center", color: COLORS.text, marginTop: 10 }}
        >
          Practice this Tamil letter step by step.
        </Text>
      </View>

      {/* Main training button */}
      <Btn
        title="▶️ Start Training"
        primary
        href={{
          pathname: "/training/[letter]/trace-hints",
          params: { letter: tamilLetter },
        }}
      />

      {/* Optional practice buttons */}
      <View
        style={{
          padding: 12,
          borderRadius: 16,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: COLORS.border,
          marginTop: 6,
        }}
      >
        <Text
          style={{ fontWeight: "800", color: COLORS.navy, marginBottom: 8 }}
        >
          Practice Options
        </Text>

        <Btn
          title="👶 Introduction"
          href={{
            pathname: "/training/[letter]/intro",
            params: { letter: tamilLetter },
          }}
        />

        <Btn
          title="🎯 Recognition"
          href={{
            pathname: "/training/[letter]/recognition",
            params: { letter: tamilLetter },
          }}
        />

        <Btn
          title="✍️ Free Draw"
          href={{
            pathname: "/training/[letter]/free-draw",
            params: { letter: tamilLetter },
          }}
        />
      </View>

      <Text style={{ textAlign: "center", color: "#94a3b8", marginTop: 10 }}>
        Tip: Practice to earn ⭐ stars!
      </Text>
    </View>
  );
}
