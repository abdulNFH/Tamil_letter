// app/components/Report.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
} from "react-native";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import {
  getLetterProgress,
  getUyirmeiProgress,
  getHighScore,
  getPuzzleScore,
  LetterProgress,
  UyirmeiProgress,
  PuzzleScore,
} from "../lib/progress";

type ReportData = {
  letterProgress: { [letter: string]: LetterProgress };
  uyirmeiProgress: UyirmeiProgress;
  highScore: number;
  puzzleScore: PuzzleScore;
};

const letters = [
  "அ","ஆ","இ","ஈ","உ","ஊ",
  "எ","ஏ","ஐ","ஒ","ஓ","ஔ",
  "க","ங","ச","ஞ","ட","ண",
  "த","ந","ப","ம",
  "ய","ர","ல","வ",
  "ழ","ள","ற","ன"
];

export default function Report() {

  const [report, setReport] = useState<ReportData | null>(null);
  const [showLetters, setShowLetters] = useState(false);
  const [showUyirmei, setShowUyirmei] = useState(false);
  const [studentThoughts, setStudentThoughts] = useState("");

  useEffect(() => {
    async function fetchReport() {

      const letterData: { [letter: string]: LetterProgress } = {};

      for (const l of letters) {
        letterData[l] = await getLetterProgress(l);
      }

      const uyirmeiData = await getUyirmeiProgress();
      const highScoreData = await getHighScore();
      const puzzleScoreData = await getPuzzleScore();

      setReport({
        letterProgress: letterData,
        uyirmeiProgress: uyirmeiData,
        highScore: highScoreData,
        puzzleScore: puzzleScoreData,
      });
    }

    fetchReport();
  }, []);

  if (!report) return <Text style={styles.loading}>Loading report...</Text>;

  const renderStars = (count: number) =>
    "⭐".repeat(count) + "☆".repeat(3 - count);

  const uyirmeiArray = Object.entries(report.uyirmeiProgress).map(
    ([letter, score]) => {
      const total = score.correct + score.wrong;
      const accuracy = total ? score.correct / total : 0;
      return { letter, correct: score.correct, wrong: score.wrong, accuracy };
    }
  );

  uyirmeiArray.sort((a, b) => a.accuracy - b.accuracy);

  const uyirmeiToImprove = uyirmeiArray.slice(0, 3);
  const displayedUyirmei = showUyirmei ? uyirmeiArray : uyirmeiToImprove;

  // ===== SUMMARY CALCULATIONS =====

  const masteredLetters = letters.filter((l) => {
    const s = report.letterProgress[l];
    return s.traceStars === 3 && s.drawStars === 3 && s.recognitionStars === 3;
  });

  const lettersToImprove = letters.filter((l) => {
    const s = report.letterProgress[l];
    return s.traceStars < 3 || s.drawStars < 3 || s.recognitionStars < 3;
  });

  const sortedUyirmei = [...uyirmeiArray].sort((a, b) => b.accuracy - a.accuracy);

  const strongUyirmei = sortedUyirmei.slice(0, 3);
  const weakUyirmei = sortedUyirmei.slice(-3);

  // ===== PDF GENERATION =====

  const generatePDF = async () => {

    const html = `
    <html>
    <body style="font-family: Arial; padding:20px">

    <h1>Student Learning Report</h1>

    <h2>Performance Summary</h2>
    <p>
    The student has mastered <b>${masteredLetters.length}</b> letters out of 
    <b>${letters.length}</b>.
    </p>

    <h2>Mastered Letters</h2>
    <p>${masteredLetters.join(", ") || "None yet"}</p>

    <h2>Letters To Practice</h2>
    <p>${lettersToImprove.slice(0,10).join(", ")}</p>

    <h2>Strong Uyir-Mei</h2>
    <ul>
    ${strongUyirmei.map(l =>
      `<li>${l.letter} - ${(l.accuracy*100).toFixed(0)}%</li>`
    ).join("")}
    </ul>

    <h2>Needs Practice (Uyir-Mei)</h2>
    <ul>
    ${weakUyirmei.map(l =>
      `<li>${l.letter} - ${(l.accuracy*100).toFixed(0)}%</li>`
    ).join("")}
    </ul>

    <h2>Game Scores</h2>
    <p>Uyir-Mei High Score: ${report.highScore}</p>
    <p>Puzzle High Score: ${report.puzzleScore.highScore}</p>
    <p>Last Score: ${report.puzzleScore.lastScore}</p>
    <p>Games Played: ${report.puzzleScore.gamesPlayed}</p>

    <h2>Teacher / Student Thoughts</h2>
    <p>${studentThoughts || "No notes added."}</p>

    </body>
    </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    await Sharing.shareAsync(uri);
  };

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>📊 Learning Progress</Text>

      {/* SUMMARY */}

      <View style={styles.card}>

        <Text style={styles.cardTitle}>🧠 Student Performance Summary</Text>

        <Text style={styles.summaryText}>
          Mastered Letters: {masteredLetters.length} / {letters.length}
        </Text>

        <Text style={styles.summaryText}>
          ⭐ Mastered: {masteredLetters.slice(0,6).join(", ") || "None yet"}
        </Text>

        <Text style={styles.summaryText}>
          📚 Needs Practice: {lettersToImprove.slice(0,6).join(", ")}
        </Text>

        <Text style={styles.summaryText}>
          💪 Strong Uyir-Mei: {strongUyirmei.map(l => l.letter).join(", ")}
        </Text>

        <Text style={styles.summaryText}>
          ⚠️ Weak Uyir-Mei: {weakUyirmei.map(l => l.letter).join(", ")}
        </Text>

      </View>

      {/* LETTER PERFORMANCE */}

      <View style={styles.card}>

        <Pressable onPress={() => setShowLetters(!showLetters)}>
          <Text style={styles.cardTitle}>
            📖 Letter Performance {showLetters ? "▲" : "▼"}
          </Text>
        </Pressable>

        {showLetters && (
          <View style={styles.letterGrid}>
            {letters.map((letter) => {

              const stars = report.letterProgress[letter];

              return (
                <View key={letter} style={styles.letterBox}>

                  <Text style={styles.letter}>{letter}</Text>

                  <Text style={styles.starText}>
                    Trace {renderStars(stars.traceStars)}
                  </Text>

                  <Text style={styles.starText}>
                    Draw {renderStars(stars.drawStars)}
                  </Text>

                  <Text style={styles.starText}>
                    Recognize {renderStars(stars.recognitionStars)}
                  </Text>

                </View>
              );
            })}
          </View>
        )}

      </View>

      {/* UYIRMEI */}

      <View style={styles.card}>

        <Pressable onPress={() => setShowUyirmei(!showUyirmei)}>
          <Text style={styles.cardTitle}>
            ⚠️ Letters to Improve {showUyirmei ? "▲" : "▼"}
          </Text>
        </Pressable>

        {displayedUyirmei.map((item) => (
          <View key={item.letter} style={styles.row}>

            <Text style={styles.letter}>{item.letter}</Text>

            <Text style={styles.score}>
              ✔ {item.correct}   ❌ {item.wrong}
            </Text>

            <Text style={styles.accuracy}>
              {(item.accuracy * 100).toFixed(0)}%
            </Text>

          </View>
        ))}

      </View>

      {/* GAME SCORES */}

      <View style={styles.card}>

        <Text style={styles.cardTitle}>🎮 Game Scores</Text>

        <View style={styles.row}>
          <Text style={styles.label}>🏆 Uyir-Mei High Score</Text>
          <Text style={styles.value}>{report.highScore}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>🧩 Puzzle High Score</Text>
          <Text style={styles.value}>{report.puzzleScore.highScore}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Last Score</Text>
          <Text style={styles.value}>{report.puzzleScore.lastScore}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Games Played</Text>
          <Text style={styles.value}>{report.puzzleScore.gamesPlayed}</Text>
        </View>

      </View>

      {/* STUDENT THOUGHTS */}

      <View style={styles.card}>

        <Text style={styles.cardTitle}>💭 Student Thoughts</Text>

        <TextInput
          placeholder="Write teacher feedback or student thoughts..."
          value={studentThoughts}
          onChangeText={setStudentThoughts}
          multiline
          style={styles.textInput}
        />

      </View>

      {/* EXPORT PDF */}

      <Pressable style={styles.pdfButton} onPress={generatePDF}>
        <Text style={styles.pdfButtonText}>📄 Export Report as PDF</Text>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    padding: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },

  loading: {
    padding: 20,
    fontSize: 18,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  summaryText: {
    fontSize: 15,
    marginBottom: 4,
  },

  letterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  letterBox: {
    width: "50%",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#F9FBFD",
    borderRadius: 10,
  },

  letter: {
    fontSize: 26,
    fontWeight: "bold",
  },

  starText: {
    fontSize: 13,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    alignItems: "center",
  },

  score: {
    fontSize: 14,
  },

  accuracy: {
    fontWeight: "600",
  },

  label: {
    fontSize: 15,
  },

  value: {
    fontSize: 16,
    fontWeight: "bold",
  },

  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },

  pdfButton: {
    backgroundColor: "#FACC15",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 40,
  },

  pdfButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

});