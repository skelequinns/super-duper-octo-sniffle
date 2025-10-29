/**
 * Centralized keyword analysis for sentiment detection and affection tracking.
 * Extensible for adding new keyword categories without modifying Stage logic.
 */

export interface KeywordMatch {
  category: string;
  keywords: string[];
  affectionDelta: number;
  description: string;
}

export interface AnalysisResult {
  totalAffectionDelta: number;
  matches: KeywordMatch[];
  rawMessage: string;
}

export class KeywordAnalyzer {
  private keywordCategories: Map<string, { keywords: string[]; delta: number }>;

  constructor() {
    this.keywordCategories = new Map();
    this.initializeDefaultCategories();
  }

  /**
   * Initialize default keyword categories with their affection deltas
   */
  private initializeDefaultCategories(): void {
    this.addCategoryInternal('compliments', [
      'beautiful', 'handsome', 'cute', 'pretty', 'gorgeous', 'amazing',
      'wonderful', 'incredible', 'perfect', 'stunning', 'attractive',
      'genius', 'fantastic', 'smart', 'intelligent', 'unique', 'brilliant',
      'interesting', 'clever', 'capable', 'appreciate', 'appreciative',
      'bright', 'cheerful', 'commendable', 'composed', 'dedicated',
      'determined', 'encourage', 'engaging', 'enthusiastic', 'enthusiasm',
      'excellent', 'friendly', 'generous', 'genuine', 'good choice', 'good call',
      'good idea', 'great idea', 'great choice', 'great call', 'helpful', 'impressive',
      'likable', 'lovely', 'loyal', 'motivated', 'observant', 'optimistic', 'optimism',
      'outstanding', 'perceptive', 'polite', 'prudent', 'proactive', 'respectful', 'respect',
      'sensible', 'sincere', 'superb', 'terrific', 'thoughtful', 'tremendous', 'trustworthy',
      'i trust you', 'i believe in you'
    ], 3);

    this.addCategoryInternal('romantic', [
      'i love you', 'i adore you', 'i cherish you', 'kiss', 'date',
      'commit', 'be together', 'future together', 'marry me', 'marry you',
      'caress', 'our relationship', 'affection', 'date with me', 'date you',
      'be with you', 'you are perfect', 'you\'re perfect', 'you are my everything',
      'you make me happy', 'i want you'
    ], 10);

    this.addCategoryInternal('vulnerability', [
      'scared', 'afraid', 'worried', 'insecure', 'anxious', 'fear',
      'vulnerable', 'hurt', 'pain', 'struggling', 'difficult',
      'vulnerability', 'open up', 'terrified', 'terrifies'
    ], 5);

    this.addCategoryInternal('rude', [
      'you\'re stupid', 'you\'re an idiot', 'you\'re dumb', 'shut up', 'i hate you',
      'you\'re ugly', 'loser', 'you\'re worthless', 'you\'re pathetic', 'you\'re annoying',
      'you suck', 'you\'re the worst', 'leave me alone', 'go away', 'i don\'t like you',
      'never want you', 'never love you', 'go fuck yourself'
    ], -5);

    this.addCategoryInternal('humor', [
      'chuckle', 'giggle', 'grin', 'funny', 'laugh', 'hilarious', 'guffaw'
    ], 3);

    this.addCategoryInternal('asking_about_character', [
      'what about you', 'tell me about yourself', 'your thoughts', 'your opinion',
      'how do you feel', 'what do you think', 'about you', 'about yourself'
    ], 3);

    this.addCategoryInternal('base_message', [], 2);
  }

  /**
   * Internal method to add categories during initialization.
   */
  private addCategoryInternal(categoryName: string, keywords: string[], affectionDelta: number): void {
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    this.keywordCategories.set(categoryName, { keywords: lowerKeywords, delta: affectionDelta });
    console.debug(`[KeywordAnalyzer] Registered category '${categoryName}' with ${keywords.length} keywords, delta: ${affectionDelta}`);
  }

  /**
   * Analyze a message for keyword matches.
   * Returns matched categories, keywords found, and total affection delta.
   */
  public analyze(message: string): AnalysisResult {
    const lowerMessage = message.toLowerCase();
    const matches: KeywordMatch[] = [];
    let totalDelta = 0;

    console.debug(`[KeywordAnalyzer] Analyzing message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);

    // Check each category
    this.keywordCategories.forEach((categoryData, categoryName) => {
      if (categoryName === 'base_message') {
        // Special case: base_message always applies
        matches.push({
          category: categoryName,
          keywords: [],
          affectionDelta: categoryData.delta,
          description: 'Base message bonus'
        });
        totalDelta += categoryData.delta;
        console.debug(`[KeywordAnalyzer] ✓ Applied base message bonus: +${categoryData.delta}`);
        return;
      }

      const matchedKeywords = categoryData.keywords.filter(keyword =>
        lowerMessage.includes(keyword)
      );

      if (matchedKeywords.length > 0) {
        const delta = categoryData.delta;
        matches.push({
          category: categoryName,
          keywords: matchedKeywords,
          affectionDelta: delta,
          description: `Found ${matchedKeywords.length} keyword(s) in category '${categoryName}'`
        });
        totalDelta += delta;
        console.debug(`[KeywordAnalyzer] ✓ ${categoryName}: ${matchedKeywords.join(', ')} → ${delta > 0 ? '+' : ''}${delta}`);
      }
    });

    if (matches.length === 0) {
      console.debug(`[KeywordAnalyzer] No keyword matches found`);
    }

    const result: AnalysisResult = {
      totalAffectionDelta: totalDelta,
      matches,
      rawMessage: message
    };

    console.info(`[KeywordAnalyzer] Total delta: ${totalDelta > 0 ? '+' : ''}${totalDelta}`);
    return result;
  }
}

export const keywordAnalyzer = new KeywordAnalyzer();