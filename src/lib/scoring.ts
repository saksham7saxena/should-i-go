// Deterministic TypeScript Scoring Engine V3 for "Should I Go?"

import { ExtractedEventData, ScoringResult, ScoreBreakdown, UserPreferences, PrimaryGoalType, DecisionType } from '../types';

export function calculateRecommendation(
  event: ExtractedEventData,
  preferences: UserPreferences,
  eventGoal: PrimaryGoalType
): ScoringResult {
  // 1. Interest Match Score (Max 35 points)
  let interestMatchScore = 0;
  const userInterestsLower = (preferences.interests || []).map((i) => i.toLowerCase());
  const eventTopicsLower = (event.topics || []).map((t) => t.toLowerCase());
  const eventTypeLower = (event.eventType || '').toLowerCase();

  const matchedTopicsList: string[] = [];

  if (eventTopicsLower.length > 0 && userInterestsLower.length > 0) {
    userInterestsLower.forEach((userInterest) => {
      const matchedInTopics = eventTopicsLower.some(
        (topic) => topic.includes(userInterest) || userInterest.includes(topic)
      );
      const matchedInType = eventTypeLower.includes(userInterest);

      if (matchedInTopics || matchedInType) {
        matchedTopicsList.push(userInterest);
      }
    });

    const ratio = matchedTopicsList.length / Math.min(userInterestsLower.length, 3);
    interestMatchScore = Math.min(35, Math.round(ratio * 35));
  } else {
    interestMatchScore = 0; // Empty topics = 0 interest match points!
  }

  // 2. Per-Event Goal Match Score (Max 25 points)
  let goalMatchScore = 10;
  const descLower = (event.description || '').toLowerCase();

  if (eventGoal === 'Learn something') {
    const learnKeywords = ['workshop', 'conference', 'talk', 'keynote', 'masterclass', 'panel', 'lecture', 'learn', 'ai', 'tech', 'design'];
    const isLearnMatch = learnKeywords.some(
      (kw) => descLower.includes(kw) || eventTypeLower.includes(kw) || eventTopicsLower.some((t) => t.includes(kw))
    );
    goalMatchScore = isLearnMatch ? 25 : 10;
  } else if (eventGoal === 'Meet people') {
    const meetKeywords = ['networking', 'meetup', 'mixer', 'community', 'gathering', 'party', 'social', 'founders'];
    const isMeetMatch = meetKeywords.some(
      (kw) => descLower.includes(kw) || eventTypeLower.includes(kw) || eventTopicsLower.some((t) => t.includes(kw))
    );
    goalMatchScore = isMeetMatch ? 25 : 10;
  } else if (eventGoal === 'Have fun') {
    const funKeywords = ['concert', 'festival', 'party', 'sports', 'game', 'film', 'music', 'entertainment', 'show'];
    const isFunMatch = funKeywords.some(
      (kw) => descLower.includes(kw) || eventTypeLower.includes(kw) || eventTopicsLower.some((t) => t.includes(kw))
    );
    goalMatchScore = isFunMatch ? 25 : 10;
  } else if (eventGoal === 'Try something new') {
    const uniqueTopics = eventTopicsLower.filter((t) => !userInterestsLower.includes(t));
    goalMatchScore = uniqueTopics.length > 0 ? 25 : 12;
  }

  // 3. Price Fit Score (Max 20 points)
  // Strict rule: Unknown price -> 0 price points!
  let priceFitScore = 0;
  const isUnknownPrice = event.price === null || event.price === undefined;
  const isHardBudgetViolation = event.price !== null && event.price !== undefined && event.price > preferences.max_price;

  if (isUnknownPrice) {
    priceFitScore = 0;
  } else if (event.price === 0) {
    priceFitScore = 20;
  } else if (event.price !== null && event.price !== undefined && event.price <= preferences.max_price) {
    priceFitScore = 20;
  } else {
    priceFitScore = 0; // Hard budget violation
  }

  // 4. Timing Fit Score (Max 10 points)
  let timingFitScore = 0;
  let dayMatched = false;
  let timeMatched = false;
  const isUnknownTiming = !event.startDate;

  if (event.startDate) {
    const eventDate = new Date(event.startDate);
    if (!isNaN(eventDate.getTime())) {
      const dayNum = eventDate.getDay();
      const isWeekend = dayNum === 0 || dayNum === 6;
      const eventDayCategory = isWeekend ? 'Weekend' : 'Weekday';

      const prefDays = preferences.preferred_days || ['Weekday', 'Weekend'];
      dayMatched = prefDays.length === 0 || prefDays.includes(eventDayCategory as any);

      const hour = eventDate.getHours();
      let timeCategory: 'Morning' | 'Afternoon' | 'Evening' = 'Evening';
      if (hour >= 5 && hour < 12) timeCategory = 'Morning';
      else if (hour >= 12 && hour < 17) timeCategory = 'Afternoon';

      const prefTimes = preferences.preferred_times || ['Morning', 'Afternoon', 'Evening'];
      timeMatched = prefTimes.length === 0 || prefTimes.includes(timeCategory as any);

      const dayPts = dayMatched ? 5 : 0;
      const timePts = timeMatched ? 5 : 0;
      timingFitScore = dayPts + timePts;
    }
  }

  // 5. Novelty Score (Max 10 points)
  let noveltyScore = 0;
  const newTopics = eventTopicsLower.filter((t) => !userInterestsLower.includes(t));
  if (eventGoal === 'Try something new' && newTopics.length > 0) {
    noveltyScore = 10;
  } else if (newTopics.length > 0 && matchedTopicsList.length > 0) {
    noveltyScore = 5;
  } else {
    noveltyScore = 0;
  }

  // Calculate Raw Total Score
  const rawScore = Math.min(
    100,
    Math.max(0, interestMatchScore + goalMatchScore + priceFitScore + timingFitScore + noveltyScore)
  );

  // Hard Budget Limit Penalty Rule: Hard budget violation caps score at 49 (cannot receive Go!)
  const totalScore = isHardBudgetViolation ? Math.min(rawScore, 49) : rawScore;

  const scoringBreakdown: ScoreBreakdown = {
    interestMatchScore,
    goalMatchScore,
    priceFitScore,
    timingFitScore,
    noveltyScore,
    totalScore,
  };

  // Thresholds
  let decision: DecisionType = 'Skip';
  if (totalScore >= 75) {
    decision = 'Go';
  } else if (totalScore >= 50) {
    decision = 'Maybe';
  }

  // Extraction Confidence & Decision Confidence Calculation
  const missingCount = (event.missingInformation || []).length;
  let confidence: 'High' | 'Medium' | 'Low' = 'High';
  if (missingCount >= 3 || isUnknownPrice || isUnknownTiming) {
    confidence = 'Low';
  } else if (missingCount >= 1) {
    confidence = 'Medium';
  }

  const criticalFields = [
    Boolean(event.title),
    Boolean(event.startDate),
    event.price !== null && event.price !== undefined,
    Boolean(event.location || event.isOnline),
    (event.topics || []).length > 0,
  ];
  const extractionConfidence = criticalFields.filter(Boolean).length / criticalFields.length;
  const decisionConfidence = Number(((extractionConfidence + (totalScore / 100)) / 2).toFixed(2));

  // Generate Reasons ONLY from Evidence
  const reasons: string[] = [];
  if (matchedTopicsList.length > 0) {
    reasons.push(`Matches your interest in ${matchedTopicsList.slice(0, 2).join(' and ')}.`);
  }

  if (goalMatchScore >= 20) {
    reasons.push(`Directly aligns with your goal to ${eventGoal.toLowerCase()}.`);
  }

  if (event.price === 0) {
    reasons.push('Free event with zero ticket cost.');
  } else if (event.price !== null && event.price !== undefined && event.price <= preferences.max_price) {
    reasons.push(`Ticket price ($${event.price}) is within your max budget of $${preferences.max_price}.`);
  }

  if (event.likelyAudience && event.likelyAudience.length > 0) {
    reasons.push(`Target audience includes ${event.likelyAudience[0]}.`);
  }

  if (reasons.length === 0) {
    reasons.push(`Presents opportunities related to ${eventGoal.toLowerCase()}.`);
  }

  // Generate Concerns from Known Evidence
  const concerns: string[] = [];
  if (isHardBudgetViolation) {
    concerns.push(`Ticket price ($${event.price}) exceeds your max budget of $${preferences.max_price}.`);
  }

  if (isUnknownPrice) {
    concerns.push('Ticket price was not listed on the event page.');
  }

  if (isUnknownTiming) {
    concerns.push('The event date or time could not be confirmed.');
  } else if (!dayMatched || !timeMatched) {
    concerns.push('Takes place outside your preferred day or time window.');
  }

  // Bottom Line Summary
  let bottomLine = '';
  if (decision === 'Go') {
    bottomLine = `Strong match for your ${matchedTopicsList[0] || 'target'} interests and your goal of ${eventGoal.toLowerCase()}.`;
  } else if (decision === 'Maybe') {
    bottomLine = `Moderate potential fit (${totalScore}/100), but review the listed concerns before deciding.`;
  } else {
    bottomLine = `Match score (${totalScore}/100) falls below recommended threshold due to budget or schedule conflicts.`;
  }

  return {
    score: totalScore,
    decision,
    bottomLine,
    reasons: reasons.slice(0, 3),
    concerns: concerns.slice(0, 2),
    confidence,
    extractionConfidence,
    decisionConfidence,
    scoringBreakdown,
    strongestReason: bottomLine,
    eventGoal,
  };
}
