/**
 * Type definitions for the affection relationship tracking system.
 */

import { RelationshipStage } from './RelationshipManager';
import { KeywordMatch } from './KeywordAnalyzer';

/**
 * Message-level state: persisted per message, loaded on swipe/jump.
 * Each message branch maintains its own affection history.
 */
export interface MessageStateType {
  affection: number;
  relationshipStage: RelationshipStage;
  stageDirections: string;
  analysisHistory: SentimentAnalysisEntry[];
}

/**
 * Individual sentiment analysis entry for a message.
 * Stored for debugging and UI display.
 */
export interface SentimentAnalysisEntry {
  timestamp: number;
  messageContent: string;
  keywordMatches: KeywordMatch[];
  totalAffectionDelta: number;
  affectionBefore: number;
  affectionAfter: number;
  stageTransition?: {
    from: RelationshipStage;
    to: RelationshipStage;
  };
}

/**
 * Create default message state for new branches.
 */
export const createDefaultMessageState = (): MessageStateType => ({
  affection: 0,
  relationshipStage: RelationshipStage.STRANGERS,
  stageDirections: "You've just met. Be polite but distant. Don't share personal information.",
  analysisHistory: []
});

/**
 * Chat-level state: persists across all branches.
 */
export interface ChatStateType {
  // Empty for now, but available for future use
}

/**
 * Create default chat state.
 */
export const createDefaultChatState = (): ChatStateType => ({});