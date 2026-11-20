export interface AttemptSample {
  isCorrect: boolean;
  responseTimeMs: number;
  createdAt: Date | string;
}

export interface PredictionMetrics {
  masteryScore: number;          // 0 - 100
  predictedSuccessRate: number;  // 0 - 100 probability of succeeding on next exercise
  fluencyFactor: number;         // 0 - 1 speed/confidence factor
  learningVelocity: number;      // Δ mastery per attempt
  recommendedAction: string;
}

/**
 * Moteur de prédiction en temps réel basé sur les mathématiques appliquées :
 * - Bayesian Knowledge Tracing (BKT) : P(L_t | obs)
 * - Moyenne mobile exponentielle (EWMA) pondérée par la récence
 * - Décroissance exponentielle de latence (fluidité cognitive)
 */
export function computeRealTimePrediction(
  attempts: AttemptSample[],
  totalExercisesInChapter: number,
  uniqueCorrectCount: number
): PredictionMetrics {
  // Paramètres calibrés BKT (Corbett & Anderson)
  const pInit = 0.25;
  const pLearn = 0.28; // Probabilité de transition d'état non-acquis -> acquis
  const pSlip = 0.08;  // Probabilité d'erreur malgré maîtrise
  const pGuess = 0.22; // Probabilité de réussite par hasard (QCM)

  if (attempts.length === 0) {
    return {
      masteryScore: 0,
      predictedSuccessRate: Math.round((pInit * (1 - pSlip) + (1 - pInit) * pGuess) * 100),
      fluencyFactor: 0.5,
      learningVelocity: 0,
      recommendedAction: 'Commencer le premier exercice pour calibrer le modèle prédictif.',
    };
  }

  // Tri chronologique ascendant
  const ordered = [...attempts].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  let pKnow = pInit;
  let ewmaAccuracy = 0.5;
  const alpha = 0.38;
  let prevPKnow = pInit;
  let fluencyAccum = 0;

  for (const sample of ordered) {
    prevPKnow = pKnow;

    // 1. Mise à jour bayésienne selon l'observation (correct / incorrect)
    let posterior: number;
    if (sample.isCorrect) {
      const pObsGivenKnow = 1 - pSlip;
      const pObs = pKnow * pObsGivenKnow + (1 - pKnow) * pGuess;
      posterior = (pKnow * pObsGivenKnow) / Math.max(pObs, 1e-6);
    } else {
      const pObsGivenKnow = pSlip;
      const pObs = pKnow * pObsGivenKnow + (1 - pKnow) * (1 - pGuess);
      posterior = (pKnow * pObsGivenKnow) / Math.max(pObs, 1e-6);
    }

    // 2. Transition d'apprentissage : P(L_t) = posterior + (1 - posterior) * pLearn
    pKnow = posterior + (1 - posterior) * pLearn;
    pKnow = Math.min(0.995, Math.max(0.02, pKnow));

    // 3. EWMA de précision
    ewmaAccuracy = alpha * (sample.isCorrect ? 1 : 0) + (1 - alpha) * ewmaAccuracy;

    // 4. Facteur de fluidité temporelle : décroissance exponentielle au-delà de 8s
    const clampedMs = Math.max(1500, Math.min(sample.responseTimeMs || 8000, 120000));
    const speedScore = Math.exp(-Math.max(0, clampedMs - 8000) / 45000);
    fluencyAccum += sample.isCorrect ? speedScore : speedScore * 0.35;
  }

  const fluencyFactor = Number((fluencyAccum / ordered.length).toFixed(3));

  // Probabilité prédictive de succès au prochain exercice : P(C_{t+1})
  const bktNextSuccess = pKnow * (1 - pSlip) + (1 - pKnow) * pGuess;
  // Combinaison convexe BKT (70%) + EWMA (20%) + Fluidité (10%)
  const blendedPrediction = 0.7 * bktNextSuccess + 0.2 * ewmaAccuracy + 0.1 * fluencyFactor;
  const predictedSuccessRate = Math.round(Math.min(99, Math.max(5, blendedPrediction * 100)));

  // Score de maîtrise prenant en compte la couverture réelle des exercices du chapitre
  const coverageRatio =
    totalExercisesInChapter > 0
      ? Math.min(1, uniqueCorrectCount / totalExercisesInChapter)
      : 0;
  const masteryScore = Math.round(
    Math.min(100, (0.55 * coverageRatio + 0.45 * pKnow) * 100)
  );

  const learningVelocity = Number(((pKnow - prevPKnow) * 100).toFixed(1));

  let recommendedAction = 'Poursuivre la progression vers le chapitre suivant.';
  if (predictedSuccessRate < 55) {
    recommendedAction = 'Manipuler le modèle 3D et relire le rappel théorique avant de réessayer.';
  } else if (coverageRatio < 1) {
    recommendedAction = 'Terminer les exercices pratiques restants pour valider 100 % du chapitre.';
  } else if (masteryScore >= 85) {
    recommendedAction = 'Maîtrise optimale détectée : prêt pour le niveau ou chapitre suivant.';
  }

  return {
    masteryScore,
    predictedSuccessRate,
    fluencyFactor,
    learningVelocity,
    recommendedAction,
  };
}

export function evaluateExerciseAnswer(
  exerciseType: string,
  submittedAnswer: string,
  correctAnswer: string,
  numericTolerance = 0.05
): boolean {
  const cleanSub = submittedAnswer.trim().replace(',', '.').toLowerCase();
  const cleanCorrect = correctAnswer.trim().replace(',', '.').toLowerCase();

  if (exerciseType === 'practice') {
    const numSub = Number(cleanSub);
    const numCorrect = Number(cleanCorrect);
    if (!Number.isNaN(numSub) && !Number.isNaN(numCorrect)) {
      return Math.abs(numSub - numCorrect) <= (numericTolerance ?? 0.05);
    }
  }
  return cleanSub === cleanCorrect;
}
