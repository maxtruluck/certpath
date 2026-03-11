import { SM2 } from '@/lib/utils/constants';

export interface SM2State {
  easeFactor: number;
  intervalDays: number;
  repetitionNumber: number;
}

export interface SM2Result extends SM2State {
  nextReviewDate: Date;
}

function addFuzz(interval: number): number {
  const fuzz = interval * SM2.FUZZ_FACTOR;
  return Math.round(interval + (Math.random() * 2 - 1) * fuzz);
}

export function calculateSM2(
  isCorrect: boolean,
  currentState: SM2State | null
): SM2Result {
  const state = currentState ?? {
    easeFactor: SM2.INITIAL_EASE_FACTOR,
    intervalDays: 0,
    repetitionNumber: 0,
  };

  let { easeFactor, intervalDays, repetitionNumber } = state;

  if (isCorrect) {
    if (repetitionNumber === 0) {
      intervalDays = SM2.INITIAL_INTERVAL;
    } else if (repetitionNumber === 1) {
      intervalDays = SM2.SECOND_INTERVAL;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    easeFactor = Math.max(SM2.MIN_EASE_FACTOR, easeFactor + SM2.EASE_BONUS);
    repetitionNumber += 1;
  } else {
    intervalDays = SM2.INITIAL_INTERVAL;
    easeFactor = Math.max(SM2.MIN_EASE_FACTOR, easeFactor - SM2.EASE_PENALTY);
    repetitionNumber = 0;
  }

  // Cap interval
  intervalDays = Math.min(intervalDays, SM2.MAX_INTERVAL);

  // Apply fuzz
  const fuzzedInterval = addFuzz(intervalDays);

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + fuzzedInterval);

  return {
    easeFactor,
    intervalDays: fuzzedInterval,
    repetitionNumber,
    nextReviewDate,
  };
}
