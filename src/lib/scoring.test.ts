import { describe, it, expect } from 'vitest';
import { calculateRecommendation } from './scoring';
import { ExtractedEventData, UserPreferences } from '../types';

const defaultPrefs: UserPreferences = {
  interests: ['AI', 'Startups'],
  max_price: 100,
  preferred_days: ['Weekday'],
  preferred_times: ['Evening'],
};

const baseEvent: ExtractedEventData = {
  title: 'AI Founder Conference 2026',
  description: 'Annual gathering of AI engineers and startup founders.',
  startDate: '2026-10-15T18:00:00Z',
  location: 'San Francisco, CA',
  price: 50,
  eventType: 'Conference',
  topics: ['AI', 'Startups'],
  likelyAudience: ['Founders', 'Engineers'],
  speakersOrPerformers: ['Dr. Vance'],
  sourceUrl: 'https://example.com/event',
  missingInformation: [],
};

describe('Deterministic Scoring Engine (src/lib/scoring.ts)', () => {
  it('gives zero price points when price is unknown', () => {
    const unknownPriceEvent: ExtractedEventData = {
      ...baseEvent,
      price: null,
      missingInformation: ['price'],
    };
    const result = calculateRecommendation(unknownPriceEvent, defaultPrefs, 'Learn something');
    expect(result.scoringBreakdown.priceFitScore).toBe(0);
  });

  it('does not say within budget when price is unknown', () => {
    const unknownPriceEvent: ExtractedEventData = {
      ...baseEvent,
      price: null,
      missingInformation: ['price'],
    };
    const result = calculateRecommendation(unknownPriceEvent, defaultPrefs, 'Learn something');
    const hasBudgetClaim = result.reasons.some((r) => r.toLowerCase().includes('within budget') || r.toLowerCase().includes('good price fit'));
    expect(hasBudgetClaim).toBe(false);
  });

  it('gives zero timing points when date is unknown', () => {
    const unknownDateEvent: ExtractedEventData = {
      ...baseEvent,
      startDate: null,
      missingInformation: ['startDate'],
    };
    const result = calculateRecommendation(unknownDateEvent, defaultPrefs, 'Learn something');
    expect(result.scoringBreakdown.timingFitScore).toBe(0);
  });

  it('prevents Go when the event exceeds the hard budget', () => {
    const expensiveEvent: ExtractedEventData = {
      ...baseEvent,
      price: 250, // Exceeds max_price 100
    };
    const result = calculateRecommendation(expensiveEvent, defaultPrefs, 'Learn something');
    expect(result.score).toBeLessThanOrEqual(49);
    expect(result.decision).not.toBe('Go');
  });

  it('uses the selected event-specific goal', () => {
    const resultLearn = calculateRecommendation(baseEvent, defaultPrefs, 'Learn something');
    const resultFun = calculateRecommendation(baseEvent, defaultPrefs, 'Have fun');
    expect(resultLearn.eventGoal).toBe('Learn something');
    expect(resultFun.eventGoal).toBe('Have fun');
    expect(resultLearn.scoringBreakdown.goalMatchScore).toBeGreaterThan(resultFun.scoringBreakdown.goalMatchScore);
  });

  it('does not claim topic relevance when topics are empty', () => {
    const noTopicsEvent: ExtractedEventData = {
      ...baseEvent,
      topics: [],
    };
    const result = calculateRecommendation(noTopicsEvent, defaultPrefs, 'Learn something');
    expect(result.scoringBreakdown.interestMatchScore).toBe(0);
    const claimInterest = result.reasons.some((r) => r.toLowerCase().includes('matches your interest in'));
    expect(claimInterest).toBe(false);
  });

  it('does not maximize novelty from a generic extra topic', () => {
    const genericExtraTopicEvent: ExtractedEventData = {
      ...baseEvent,
      topics: ['AI', 'Networking'],
    };
    const result = calculateRecommendation(genericExtraTopicEvent, defaultPrefs, 'Learn something');
    expect(result.scoringBreakdown.noveltyScore).toBeLessThan(10);
  });

  it('lowers confidence when critical fields are missing', () => {
    const incompleteEvent: ExtractedEventData = {
      ...baseEvent,
      price: null,
      startDate: null,
      missingInformation: ['price', 'startDate'],
    };
    const result = calculateRecommendation(incompleteEvent, defaultPrefs, 'Learn something');
    expect(result.confidence).toBe('Low');
  });

  it('keeps all score components within their allowed ranges', () => {
    const result = calculateRecommendation(baseEvent, defaultPrefs, 'Learn something');
    expect(result.scoringBreakdown.interestMatchScore).toBeGreaterThanOrEqual(0);
    expect(result.scoringBreakdown.interestMatchScore).toBeLessThanOrEqual(35);

    expect(result.scoringBreakdown.goalMatchScore).toBeGreaterThanOrEqual(0);
    expect(result.scoringBreakdown.goalMatchScore).toBeLessThanOrEqual(25);

    expect(result.scoringBreakdown.priceFitScore).toBeGreaterThanOrEqual(0);
    expect(result.scoringBreakdown.priceFitScore).toBeLessThanOrEqual(20);

    expect(result.scoringBreakdown.timingFitScore).toBeGreaterThanOrEqual(0);
    expect(result.scoringBreakdown.timingFitScore).toBeLessThanOrEqual(10);

    expect(result.scoringBreakdown.noveltyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoringBreakdown.noveltyScore).toBeLessThanOrEqual(10);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('ensures every reason is supported by known event data', () => {
    const result = calculateRecommendation(baseEvent, defaultPrefs, 'Learn something');
    expect(result.reasons.length).toBeGreaterThan(0);
    result.reasons.forEach((reason) => {
      expect(reason.length).toBeGreaterThan(5);
    });
  });
});
