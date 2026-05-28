export type GameStatus = "playing" | "won" | "lost";
export type GameMode = "daily" | "free";
export type GuessResult = "moved_to_top" | "moved_to_bottom" | "correct";

export type Guess = {
  word: string;
  index: number;
  result: GuessResult;
  topDistancePercentAfterGuess: number;
  bottomDistancePercentAfterGuess: number;
  intervalPositionAfterGuess: number;
};

export type GameState = {
  gameId: string;
  mode: GameMode;
  dateKey?: string;
  dailyNumber?: number;
  answer: string;
  answerIndex: number;
  guesses: Guess[];
  topBoundIndex: number;
  bottomBoundIndex: number;
  currentInput: string;
  status: GameStatus;
  maxGuesses: number;
  elapsedMs: number;
};

export type PossibleLetter = {
  letter: string;
  isPossible: boolean;
};
