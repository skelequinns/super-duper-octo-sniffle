/**
 * Manages relationship stages, affection thresholds, and stage directions.
 * Centralizes relationship logic and provides methods for state transitions.
 */

export enum RelationshipStage {
  STRANGERS = 'STRANGERS',
  ACQUAINTANCES = 'ACQUAINTANCES',
  FRIENDS = 'FRIENDS',
  GOOD_FRIENDS = 'GOOD_FRIENDS',
  CLOSE_FRIENDS = 'CLOSE_FRIENDS',
  ROMANTIC_TENSION = 'ROMANTIC_TENSION',
  ROMANCE = 'ROMANCE'
}

interface StageThreshold {
  stage: RelationshipStage;
  minAffection: number;
  stageDirections: string;
}

export class RelationshipManager {
  private thresholds: StageThreshold[] = [
    {
      stage: RelationshipStage.STRANGERS,
      minAffection: 0,
      stageDirections: "You've just met. Be polite but distant. Don't share personal information. IMPORTANT: Sexual and Romantic content is not appropriate at this stage."
    },
    {
      stage: RelationshipStage.ACQUAINTANCES,
      minAffection: 15,
      stageDirections: "You're warming up slightly. Show cautious interest. Be friendly but maintain emotional distance. IMPORTANT: Sexual and Romantic content is not appropriate at this stage."
    },
    {
      stage: RelationshipStage.FRIENDS,
      minAffection: 40,
      stageDirections: "You're comfortable talking. Share some opinions and interests. Be more relaxed and open. IMPORTANT: Sexual and Romantic content is not appropriate at this stage."
    },
    {
      stage: RelationshipStage.GOOD_FRIENDS,
      minAffection: 100,
      stageDirections: "You trust them. Share more personal thoughts and feelings. Be supportive and engaged. IMPORTANT: Sexual and Romantic content is not appropriate at this stage."
    },
    {
      stage: RelationshipStage.CLOSE_FRIENDS,
      minAffection: 141,
      stageDirections: "You're very close. Share vulnerabilities and deep thoughts. Be emotionally available. Subtle Flirtation and light innuendo is encouraged."
    },
    {
      stage: RelationshipStage.ROMANTIC_TENSION,
      minAffection: 176,
      stageDirections: "There's clear attraction. Allow flirtation and romantic subtext. Build tension."
    },
    {
      stage: RelationshipStage.ROMANCE,
      minAffection: 225,
      stageDirections: "You're in a romantic relationship. Express love and affection openly."
    }
  ];

  /**
   * Determine current relationship stage based on affection score.
   * Returns the highest stage threshold that affection meets or exceeds.
   */
  public getStageForAffection(affection: number): RelationshipStage {
    for (let i = this.thresholds.length - 1; i >= 0; i--) {
      if (affection >= this.thresholds[i].minAffection) {
        console.debug(`[RelationshipManager] Affection ${affection} → Stage: ${this.thresholds[i].stage}`);
        return this.thresholds[i].stage;
      }
    }
    return RelationshipStage.STRANGERS;
  }

  /**
   * Get stage directions for a specific stage.
   */
  public getStageDirections(stage: RelationshipStage): string {
    const threshold = this.thresholds.find(t => t.stage === stage);
    if (!threshold) {
      console.warn(`[RelationshipManager] Unknown stage: ${stage}`);
      return '';
    }
    console.debug(`[RelationshipManager] Retrieving directions for ${stage}`);
    return threshold.stageDirections;
  }

  /**
   * Get stage directions based on affection score (convenience method).
   */
  public getStageDirectionsForAffection(affection: number): string {
    const stage = this.getStageForAffection(affection);
    return this.getStageDirections(stage);
  }

  /**
   * Calculate affection needed to reach next stage.
   */
  public getAffectionToNextStage(affection: number): number {
    const currentStage = this.getStageForAffection(affection);
    const currentIndex = this.thresholds.findIndex(t => t.stage === currentStage);

    if (currentIndex === -1 || currentIndex === this.thresholds.length - 1) {
      return 0; // Already at max stage
    }

    const nextThreshold = this.thresholds[currentIndex + 1];
    const pointsNeeded = Math.max(0, nextThreshold.minAffection - affection);

    console.debug(`[RelationshipManager] To next stage: +${pointsNeeded} points`);
    return pointsNeeded;
  }

  /**
   * Check if stage has changed.
   */
  public hasStageChanged(oldAffection: number, newAffection: number): boolean {
    const oldStage = this.getStageForAffection(oldAffection);
    const newStage = this.getStageForAffection(newAffection);
    const changed = oldStage !== newStage;

    if (changed) {
      console.info(`[RelationshipManager] ⭐ Stage transition: ${oldStage} → ${newStage}`);
    }

    return changed;
  }

  /**
   * Get the maximum possible affection.
   */
  public getMaxAffection(): number {
    return 250;
  }
}

export const relationshipManager = new RelationshipManager();
