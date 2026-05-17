import AsyncStorage from "@react-native-async-storage/async-storage";

export type LetterProgress = {
  traceStars: number;
  drawStars: number;
  recognitionStars: number;
};

const defaultProgress: LetterProgress = {
  traceStars: 0,
  drawStars: 0,
  recognitionStars: 0,
};

// ------------------------
// Uyir-Mei Progress
// ------------------------
export type UyirmeiProgress = {
  [fullLetter: string]: {
    correct: number;
    wrong: number;
  };
};

const defaultUyirmeiProgress: UyirmeiProgress = {};

// ------------------------
// HIGH SCORE
// ------------------------

const HIGH_SCORE_KEY = "uyirmei_high_score";

export async function getHighScore(): Promise<number> {
  const data = await AsyncStorage.getItem(HIGH_SCORE_KEY);
  if (!data) return 0;
  return Number(data);
}

export async function saveHighScore(score: number) {
  const currentHigh = await getHighScore();

  if (score > currentHigh) {
    await AsyncStorage.setItem(HIGH_SCORE_KEY, score.toString());
  }
}

// ------------------------
// Letter Progress
// ------------------------

export async function getLetterProgress(
  letter: string
): Promise<LetterProgress> {
  const key = `progress_${letter}`;
  const data = await AsyncStorage.getItem(key);
  if (!data) return defaultProgress;
  return JSON.parse(data);
}

export async function saveLetterProgress(
  letter: string,
  progress: LetterProgress
) {
  const key = `progress_${letter}`;
  await AsyncStorage.setItem(key, JSON.stringify(progress));
}

// ------------------------
// Uyir-Mei helpers
// ------------------------

export async function getUyirmeiProgress(): Promise<UyirmeiProgress> {
  const data = await AsyncStorage.getItem("uyirmei_progress");
  if (!data) return defaultUyirmeiProgress;
  return JSON.parse(data);
}

export async function saveUyirmeiProgress(progress: UyirmeiProgress) {
  await AsyncStorage.setItem("uyirmei_progress", JSON.stringify(progress));
}

export async function updateUyirmeiScore(
  fullLetter: string,
  correct: boolean
) {
  const progress = await getUyirmeiProgress();

  if (!progress[fullLetter]) {
    progress[fullLetter] = { correct: 0, wrong: 0 };
  }

  if (correct) progress[fullLetter].correct += 1;
  else progress[fullLetter].wrong += 1;

  await saveUyirmeiProgress(progress);
}

// ------------------------
// Existing star helpers
// ------------------------

export async function addStar(
  letter: string,
  type: "traceStars" | "drawStars" | "recognitionStars"
) {
  const current = await getLetterProgress(letter);
  if (current[type] < 3) current[type] += 1;
  await saveLetterProgress(letter, current);
}

export async function awardStars(
  letter: string,
  type: "traceStars" | "drawStars" | "recognitionStars",
  stars: number
) {
  const current = await getLetterProgress(letter);
  current[type] = Math.min(stars, 3);
  await saveLetterProgress(letter, current);
}

// ------------------------
// Tamil Puzzle Score
// ------------------------

export type PuzzleScore = {
  highScore: number;
  lastScore: number;
  gamesPlayed: number;
};

const PUZZLE_SCORE_KEY = "tamil_puzzle_score";

const defaultPuzzleScore: PuzzleScore = {
  highScore: 0,
  lastScore: 0,
  gamesPlayed: 0,
};

export async function getPuzzleScore(): Promise<PuzzleScore> {
  const data = await AsyncStorage.getItem(PUZZLE_SCORE_KEY);
  if (!data) return defaultPuzzleScore;
  return JSON.parse(data);
}

// ⭐ UPDATED: return updated score so TS knows highScore exists
export async function savePuzzleScore(score: number): Promise<PuzzleScore> {
  const progress = await getPuzzleScore();

  const newProgress: PuzzleScore = {
    highScore: Math.max(progress.highScore, score),
    lastScore: score,
    gamesPlayed: progress.gamesPlayed + 1,
  };

  await AsyncStorage.setItem(
    PUZZLE_SCORE_KEY,
    JSON.stringify(newProgress)
  );

  return newProgress; // ✅ important for TypeScript
}