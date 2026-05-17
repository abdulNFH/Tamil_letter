import React from "react";
import { Text, View } from "react-native";

export default function LetterGuide({
  letter,
  size = 200,
  color = "#0C2D57",
}: {
  letter: string;
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: size * 0.85,
          fontWeight: "900",
          color: color,
        }}
      >
        {letter}
      </Text>
    </View>
  );
}
