// Deterministic TypeScript Scoring Engine V2 for "Should I Go?"

import { ExtractedEventData, ScoringResult, ScoreBreakdown, UserPreferences, PrimaryGoalType, DecisionType } from '../types';

export function calculateRecommendation(
  event: ExtractedEventData,
  preferences: UserPreferences,
  eventGoal: PrimaryGoalType = 'Learn something'
): ScoringResult {
  // 1. Interest Match Score (Max 35 points)
  let interestMatchScore = 0;
  const userInterestsLower = (preferences.interests || []).map((i) => i.toLowerCase());
  const eventTopicsLower = (event.topics || []).map((t) => t.toLowerCase());
  const eventTypeLower = (event.eventType || '').toLowerCase();

  let matchedCount = 0;
  const matchedTopicsList: string[] = [];

  userInterestsLower.forEach((userInterest) => {
    const matchedInTopics = eventTopicsLower.some(
      (topic) => topic.includes(userInterest) || userInterest.includes(topic)
    );
    const matchedInType = eventTypeLower.includes(userInterest);

    if (matchedInTopics || matchedInType) {
      matchedCount++;
      matchedTopicsList.push(userInterest);
    }
  });

  if (userInterestsLower.length > 0) {
    const ratio = matchedCount / Math.min(userInterestsLower.length, 3);
    interestMatchScore = Math.min(35, Math.round(ratio * 35));
  } else {
    interestMatchScore = 15;
  }

  // 2. Per-Event Goal Match Score (Max 25 points)
  let goalMatchScore = 12;
  const descLower = (event.description || '').toLowerCase();

  if (eventGoal === 'Learn something') {
    const learnKeywords = ['workshop', 'conference', 'talk', 'keynote', 'masterclass', 'panel', 'lecture', 'ai', 'tech', 'design', 'learn'];
    const isLearnMatch = learnKeywords.some(
      (kw) => descLower.includes(kw) || eventTypeLower.includes(kw) || eventTopicsLower.some((t) => t.includes(kw))
    );
    goalMatchScore = isLearnMatch ? 25 : 10;
  } else if (eventGoal === 'Meet people') {
    const meetKeywords = ['networking', 'meetup', 'mixer', 'community', 'gathering', 'party', 'social'];
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
    goalMatchScore = uniqueTopics.length > 0 ? 25 : 14;
  }

  // 3. Price Fit Score (Max 20 points)
  // Strict rule: Unknown price must NOT be treated as free or scored positively!
  let priceFitScore = 0;
  let priceUncertain = false;

  if (event.price === null || event.price === undefined) {
    priceFitScore = 5; // Reduced baseline for unlisted price
    priceUncertain = true;
  } else if (event.price === 0) {
    priceFitScore = 20; // Free event is perfect fit
  } else if (event.price <= preferences.max_price) {
    priceFitScore = 20;
  } else {
    // Hard budget limit penalty
    priceFitScore = 0; // Exceeding max price gives 0 points
  }

  // 4. Timing Fit Score (Max 10 points)
  // Strict rule: Only score timing when date and time are known!
  let timingFitScore = 0;
  let dayMatched = false;
  let timeMatched = false;
  let timingKnown = false;

  if (event.startDate) {
    const eventDate = new Date(event.startDate);
    if (!isNaN(eventDate.getTime())) {
      timingKnown = true;
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
  let noveltyScore = 5;
  const newTopicsCount = eventTopicsLower.filter((t) => !userInterestsLower.includes(t)).length;
  if (eventGoal === 'Try something new' && newTopicsCount > 0) {
    noveltyScore = 10;
  } else if (newTopicsCount > 0 && matchedCount > 0) {
    noveltyScore = 7;
  } else {
    noveltyScore = 5;
  }

  // Total Score Calculation (0 - 100)
  const totalScore = Math.min(
    100,
    Math.max(0, interestMatchScore + goalMatchScore + priceFitScore + timingFitScore + noveltyScore)
  );

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

  // Determine Extraction Confidence
  const missingCount = (event.missingInformation || []).length;
  let confidence: 'High' | 'Medium' | 'Low' = 'High';
  if (missingCount >= 3 || priceUncertain || !timingKnown) {
    confidence = 'Low';
  } else if (missingCount >= 1) {
    confidence = 'Medium';
  }

  // Generate 3 Supporting Factors ("Why this recommendation")
  const reasons: string[] = [];
  if (matchedTopicsList.length > 0) {
    reasons.push(`Strong interest match in ${matchedTopicsList.slice(0, 2).join(' & ')}.`);
  } else {
    reasons.push(`Relevant event format (${event.eventType || 'Event'}).`);
  }

  if (goalMatchScore >= 20) {
    reasons.push(`Directly aligns with your goal to ${eventGoal.toLowerCase()}.`);
  } else {
    reasons.push(`Target audience aligns with ${event.likelyAudience?.[0] || 'tech professionals'}.`);
  }

  if (event.price === 0) {
    reasons.push('Free event (no ticket cost).');
  } else if (event.price !== null && event.price <= preferences.max_price) {
    reasons.push(`Good price fit ($${event.price} vs max $${preferences.max_price}).`);
  } else {
    reasons.push(`Offers unique topic exploration.`);
  }

  // Generate 1 Concern ("Watch out") when relevant
  const concerns: string[] = [];
  if (event.price !== null && event.price > preferences.max_price) {
    concerns.push(`Ticket price ($${event.price}) exceeds your set budget limit of $${preferences.max_price}.`);
  } else if (priceUncertain) {
    concerns.push(`Ticket price is unlisted on the event page.`);
  } else if (timingKnown && (!dayMatched || !timeMatched)) {
    concerns.push(`Takes place outside your preferred time window.`);
  } else if (!timingKnown) {
    concerns.push(`Exact event date or time is unlisted.`);
  }

  // 1-Sentence Bottom Line
  let bottomLine = '';
  if (decision === 'Go') {
    bottomLine = `This strongly matches your ${matchedTopicsList[0] || 'target'} interests and ${eventGoal.toLowerCase()} goal, and the price is within your budget.`;
  } else if (decision === 'Maybe') {
    bottomLine = `Good potential match (${totalScore}/100), but review the ${concerns[0] ? 'listed concern' : 'schedule details'} before deciding.`;
  } else {
    bottomLine = `Overall match score (${totalScore}/100) falls below recommended threshold due to budget or schedule conflicts.`;
  }

  return {
    score: totalScore,
    decision,
    bottomLine,
    reasons: reasons.slice(0, 3),
    concerns: concerns.slice(0, 1),
    confidence,
    scoringBreakdown,
    strongestReason: bottomLine,
    eventGoal,
  };
}
