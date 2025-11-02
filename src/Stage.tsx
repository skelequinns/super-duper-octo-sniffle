import { ReactElement } from "react";
import { StageBase, StageResponse, InitialData, Message } from "@chub-ai/stages-ts";
import { LoadResponse } from "@chub-ai/stages-ts/dist/types/load";
import { keywordAnalyzer } from "./KeywordAnalyzer";
import { relationshipManager, RelationshipStage } from "./RelationshipManager";
import { MessageStateType, ChatStateType, SentimentAnalysisEntry, createDefaultMessageState, createDefaultChatState } from "./types";

type ConfigType = any;
type InitStateType = any;

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {
  private currentMessageState: MessageStateType;
  private currentChatState: ChatStateType;

  constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
    super(data);

    const {
      messageState,
      chatState,
      characters,
      users,
    } = data;

    console.debug(`[Stage] Initializing with ${Object.keys(characters).length} character(s) and ${Object.keys(users).length} user(s)`);

    // Initialize message state: use provided state or create default
    this.currentMessageState = messageState ?? createDefaultMessageState();
    this.currentChatState = chatState ?? createDefaultChatState();

    console.debug(`[Stage] Starting affection: ${this.currentMessageState.affection}`);
  }

  async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
    console.debug(`[Stage] Load called`);
    console.debug(`[Stage] Returning messageState for persistence: affection=${this.currentMessageState.affection}, stage=${this.currentMessageState.relationshipStage}`);
    return {
      success: true,
      error: null,
      initState: null,
      chatState: null,
      messageState: this.currentMessageState,
    };
  }

  async setState(state: MessageStateType): Promise<void> {
    /**
     * Called on swipe/jump to a different message in the conversation tree.
     * Loads the affection history for that specific branch.
     */
    console.debug(`[Stage] setState called - switching to message with affection: ${state?.affection ?? 'undefined'}`);

    if (state) {
      this.currentMessageState = state;
      console.debug(`[Stage] Loaded message state: affection=${this.currentMessageState.affection}, stage=${this.currentMessageState.relationshipStage}`);
    }
  }

  async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    /**
     * Called before the user's message is sent to the LLM.
     * Analyzes user sentiment, updates affection, determines stage, and provides directions.
     */
    const { content, isBot } = userMessage;

    console.debug(`[Stage] beforePrompt called. isBot=${isBot}`);

    // Only analyze user messages, not bot responses
    if (isBot) {
      console.debug(`[Stage] Message is from bot, skipping analysis`);
      return {
        stageDirections: null,
        messageState: this.currentMessageState,
        error: null,
      };
    }

    // Run sentiment analysis
    const analysisResult = keywordAnalyzer.analyze(content);
    const affectionBefore = this.currentMessageState.affection;
    const affectionAfter = Math.max(0, Math.min(affectionBefore + analysisResult.totalAffectionDelta, relationshipManager.getMaxAffection()));

    console.info(`[Stage] Affection: ${affectionBefore} → ${affectionAfter} (${analysisResult.totalAffectionDelta > 0 ? '+' : ''}${analysisResult.totalAffectionDelta})`);

    // Check for stage transition
    const oldStage = this.currentMessageState.relationshipStage;
    const newStage = relationshipManager.getStageForAffection(affectionAfter);
    const stageTransition = oldStage !== newStage ? { from: oldStage, to: newStage } : undefined;

    if (stageTransition) {
      console.info(`[Stage] 🎉 Stage transition: ${stageTransition.from} → ${stageTransition.to}`);
    }

    // Get stage directions
    const stageDirections = relationshipManager.getStageDirectionsForAffection(affectionAfter);
    console.debug(`[Stage] ✓ Sending stage directions to LLM: "${stageDirections}"`);

    // Create analysis entry
    const analysisEntry: SentimentAnalysisEntry = {
      timestamp: Date.now(),
      messageContent: content.substring(0, 100),
      keywordMatches: analysisResult.matches,
      totalAffectionDelta: analysisResult.totalAffectionDelta,
      affectionBefore,
      affectionAfter,
      stageTransition,
    };

    // Limit history to prevent memory bloat (keep last 100 entries)
    const MAX_HISTORY = 100;
    const newHistory = [...this.currentMessageState.analysisHistory, analysisEntry].slice(-MAX_HISTORY);

    // Update message state
    this.currentMessageState = {
      affection: affectionAfter,
      relationshipStage: newStage,
      stageDirections,
      analysisHistory: newHistory,
    };

    console.debug(`[Stage] Updated state. History: ${this.currentMessageState.analysisHistory.length}/${MAX_HISTORY}`);

    return {
      stageDirections,
      messageState: this.currentMessageState,
      error: null,
      systemMessage: null,
    };
  }

  async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
    /**
     * Called after the bot responds. Preserves current state.
     */
    console.debug(`[Stage] afterResponse called`);

    return {
      stageDirections: null,
      messageState: this.currentMessageState,
      error: null,
      systemMessage: null,
    };
  }

  render(): ReactElement {
    /**
     * Render the relationship tracker UI showing:
     * 1. Current relationship stage
     * 2. Affection progress (current/max)
     * 3. Points to next stage
     */
    const affection = this.currentMessageState.affection;
    const maxAffection = relationshipManager.getMaxAffection();
    const stage = this.currentMessageState.relationshipStage;
    const pointsToNext = relationshipManager.getAffectionToNextStage(affection);
    const affectionPercent = (affection / maxAffection) * 100;

    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        backgroundColor: '#f5f5f5',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        gap: '16px',
        boxSizing: 'border-box',
      }}>
        {/* Header */}
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#FAFFFF',
        }}>
          Relationship Tracker
        </div>

        {/* Stage Display */}
        <div style={{
          padding: '12px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}>
          <div style={{ fontSize: '12px', color: '#FAFFFF', marginBottom: '4px' }}>
            Stage
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#FAFFFF',
          }}>
            {stage}
          </div>
        </div>

        {/* Affection Progress Bar */}
        <div style={{
          padding: '12px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}>
          <div style={{
            fontSize: '12px',
            color: '#FAFFFF',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>Affection</span>
            <span>{affection} / {maxAffection}</span>
          </div>
          <div style={{
            width: '100%',
            height: '24px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              width: `${affectionPercent}%`,
              height: '100%',
              backgroundColor: '#ec4899',
              transition: 'width 0.3s ease',
            }} />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
              color: affectionPercent > 50 ? '#FAFFFF' : '#FAFFFF',
              textShadow: affectionPercent > 50 ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
            }}>
              {Math.round(affectionPercent)}%
            </div>
          </div>
        </div>

        {/* Points to Next Stage */}
        <div style={{
          padding: '12px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}>
          <div style={{ fontSize: '12px', color: '#FAFFFF', marginBottom: '4px' }}>
            To Next Stage
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: pointsToNext === 0 ? '#10b981' : '#f59e0b',
          }}>
            {pointsToNext === 0 ? '🎉 Max Stage' : `+${pointsToNext} points`}
          </div>
        </div>

        {/* Recent Analysis History */}
        <div style={{
          padding: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          fontSize: '10px',
          color: '#FAFFFF',
          fontFamily: 'monospace',
          maxHeight: '140px',
          overflow: 'auto',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Recent Activity</div>
          {this.currentMessageState.analysisHistory.length === 0 ? (
            <div style={{ color: '#FAFFFF' }}>No analysis yet</div>
          ) : (
            this.currentMessageState.analysisHistory.slice(-3).reverse().map((entry, idx) => (
              <div key={idx} style={{
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: idx < 2 ? '1px solid #e5e7eb' : 'none',
              }}>
                <div>{new Date(entry.timestamp).toLocaleTimeString()}</div>
                <div style={{ color: entry.totalAffectionDelta >= 0 ? '#10b981' : '#ef4444' }}>
                  {entry.totalAffectionDelta >= 0 ? '+' : ''}{entry.totalAffectionDelta}
                  {' '}({entry.affectionBefore}→{entry.affectionAfter})
                </div>
                {entry.keywordMatches.length > 0 && (
                  <div style={{ color: '#FAFFFF', marginTop: '2px' }}>
                    {entry.keywordMatches.map(m => m.category).join(', ')}
                  </div>
                )}
                {entry.stageTransition && (
                  <div style={{ color: '#2563eb', marginTop: '2px', fontWeight: 'bold' }}>
                    ⭐ {entry.stageTransition.from}→{entry.stageTransition.to}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
}
