// Deterministic TypeScript Scoring Engine for "Should I Go?"

import { ExtractedEventData, ScoringResult, ScoreBreakdown, UserPreferences, DecisionType } from '../types';

export function calculateRecommendation(
  event: ExtractedEventData,
  preferences: UserPreferences
): ScoringResult {
  // 1. Interest Match Score (Max 35 points)
  let interestMatchScore = 0;
  const userInterestsLower = preferences.interests.map((i) => i.toLowerCase());
  const eventTopicsLower = event.topics.map((t) => t.toLowerCase());
  const eventTypeLower = event.eventType.toLowerCase();

  let matchedInterestsCount = 0;
  const matchedTopicsList: string[] = [];

  userInterestsLower.forEach((userInterest) => {
    const matchedInTopics = eventTopicsLower.some(
      (topic) => topic.includes(userInterest) || userInterest.includes(topic)
    );
    const matchedInType = eventTypeLower.includes(userInterest);

    if (matchedInTopics || matchedInType) {
      matchedInterestsCount++;
      matchedTopicsList.push(userInterest);
    }
  });

  if (preferences.interests.length > 0) {
    const ratio = matchedInterestsCount / Math.min(preferences.interests.length, 3);
    interestMatchScore = Math.min(35, Math.round(ratio * 35));
  } else {
    interestMatchScore = 20; // Default baseline if no interests selected
  }

  // 2. Goal Match Score (Max 25 points)
  let goalMatchScore = 15; // default baseline
  const descLower = event.description.toLowerCase();
  const goal = preferences.primary_goal;

  if (goal === 'Learn something') {
    const learnKeywords = ['workshop', 'conference', 'talk', 'keynote', 'masterclass', 'panel', 'lecture', 'ai', 'tech', 'design', 'learn'];
    const isLearningEvent = learnKeywords.some(
      (kw) => descLower.includes(kw) || eventTypeLower.includes(kw) || eventTopicsLower.some((t) => t.includes(kw))
    );
    goalMatchScore = isLearningEvent ? 25 : 12;
  } else if (goal === 'Meet people') {
    const networkingKeywords = ['networking', 'meetup', 'mixer', 'community', 'gathering', 'party', 'social'];
    const isSocialEvent = networkingKeywords.some(
      (kw) => descLower.includes(kw) || eventTypeLower.includes(kw) || eventTopicsLower.some((t) => t.includes(kw))
    );
    goalMatchScore = isSocialEvent ? 25 : 14;
  } else if (goal === 'Have fun') {
    const funKeywords = ['concert', 'festival', 'party', 'sports', 'game', 'film', 'music', 'entertainment', 'fun'];
    const isFunEvent = funKeywords.some(
      (kw) => descLower.includes(kw) || eventTypeLower.includes(kw) || eventTopicsLower.some((t) => t.includes(kw))
    );
    goalMatchScore = isFunEvent ? 25 : 15;
  } else if (goal === 'Try something new') {
    const novelTopics = eventTopicsLower.filter((t) => !userInterestsLower.includes(t));
    goalMatchScore = novelTopics.length > 0 ? 25 : 18;
  }

  // 3. Price Fit Score (Max 20 points)
  let priceFitScore = 20;
  if (event.price === null) {
    priceFitScore = 10; // Moderate score for unknown price
  } else if (event.price === 0) {
    priceFitScore = 20; // Free event is max fit
  } else if (event.price <= preferences.max_price) {
    priceFitScore = 20;
  } else {
    // Price exceeds budget
    if (preferences.max_price === 0) {
      priceFitScore = 0;
    } else {
      const overRatio = event.price / preferences.max_price;
      priceFitScore = Math.max(0, Math.round(20 * (2 - overRatio)));
    }
  }

  // 4. Timing Fit Score (Max 10 points)
  let timingFitScore = 10;
  let dayMatched = true;
  let timeMatched = true;

  if (!event.startDate) {
    timingFitScore = 5; // Neutral timing score if date is missing
  } else {
    const eventDate = new Date(event.startDate);
    if (!isNaN(eventDate.getTime())) {
      const dayNum = eventDate.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayNum === 0 || dayNum === 6;
      const eventDayCategory = isWeekend ? 'Weekend' : 'Weekday';

      if (preferences.preferred_days.length > 0) {
        dayMatched = preferences.preferred_days.includes(eventDayCategory as any);
      }

      const hour = eventDate.getHours();
      let eventTimeCategory: 'Morning' | 'Afternoon' | 'Evening' = 'Evening';
      if (hour >= 5 && hour < 12) eventTimeCategory = 'Morning';
      else if (hour >= 12 && hour < 17) eventTimeCategory = 'Afternoon';

      if (preferences.preferred_times.length > 0) {
        timeMatched = preferences.preferred_times.includes(eventTimeCategory as any);
      }

      const dayPts = dayMatched ? 5 : 0;
      const timePts = timeMatched ? 5 : 1;
      timingFitScore = dayPts + timePts;
    }
  }

  // 5. Novelty Score (Max 10 points)
  let noveltyScore = 7;
  const uniqueTopics = eventTopicsLower.filter((t) => !userInterestsLower.includes(t));
  if (preferences.primary_goal === 'Try something new') {
    noveltyScore = 10;
  } else if (uniqueTopics.length > 0) {
    noveltyScore = 9;
  } else {
    noveltyScore = 6;
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

  // Determine Decision Threshold
  let decision: DecisionType = 'Skip';
  if (totalScore >= 75) {
    decision = 'Go';
  } else if (totalScore >= 50) {
    decision = 'Maybe';
  }

  // Generate 3 Positive Reasons based on actual event facts & scoring
  const reasons: string[] = [];
  if (matchedTopicsList.length > 0) {
    reasons.push(`Directly matches your interest in ${matchedTopicsList.slice(0, 2).join(' & ')}.`);
  } else {
    reasons.push(`Explores related topics in ${event.eventType || 'the industry'}.`);
  }

  if (event.price === 0) {
    reasons.push('This event is completely free to attend.');
  } else if (event.price !== null && event.price <= preferences.max_price) {
    reasons.push(`Ticket price ($${event.price}) is well within your budget limit of $${preferences.max_price}.`);
  } else if (event.price === null) {
    reasons.push('Open access or flexible pricing option available.');
  } else {
    reasons.push(`Offers high value aligned with your primary goal to ${preferences.primary_goal.toLowerCase()}.`);
  }

  if (goalMatchScore >= 20) {
    reasons.push(`Highly aligned with your main objective to ${preferences.primary_goal.toLowerCase()}.`);
  } else if (timingFitScore >= 8) {
    reasons.push('Scheduled at your preferred day and time window.');
  } else {
    reasons.push(`Includes featured key speakers/topics such as ${event.topics.slice(0, 2).join(', ') || 'expert sessions'}.`);
  }

  // Generate up to 2 Concerns
  const concerns: string[] = [];
  if (event.price !== null && event.price > preferences.max_price) {
    concerns.push(`Ticket cost ($${event.price}) exceeds your set budget limit of $${preferences.max_price}.`);
  }
  if (!dayMatched && preferences.preferred_days.length > 0) {
    concerns.push(`Date falls outside your preferred ${preferences.preferred_days.join(' / ')} schedule.`);
  }
  if (!timeMatched && preferences.preferred_times.length > 0) {
    concerns.push(`Time slot may conflict with your preferred ${preferences.preferred_times.join(', ')} hours.`);
  }
  if (event.missingInformation && event.missingInformation.length > 0) {
    concerns.push(`Some event details (${event.missingInformation.slice(0, 2).join(', ')}) were not explicitly listed.`);
  }
  if (concerns.length === 0) {
    concerns.push('No significant conflicts found with your preferences.');
  }

  // Determine Confidence Level
  const missingCount = (event.missingInformation || []).length;
  let confidence: 'High' | 'Medium' | 'Low' = 'High';
  if (missingCount >= 3 || (!event.startDate && event.price === null)) {
    confidence = 'Low';
  } else if (missingCount >= 1 || !event.startDate) {
    confidence = 'Medium';
  }

  // Determine Strongest Reason
  let strongestReason = '';
  if (decision === 'Go') {
    strongestReason = reasons[0] || `Strong alignment with your interest and goal to ${preferences.primary_goal.toLowerCase()}.`;
  } else if (decision === 'Maybe') {
    strongestReason = `Good interest alignment (${totalScore}/100), but check potential budget/schedule constraints.`;
  } else {
    strongestReason = concerns[0] || `Overall fit score (${totalScore}/100) is below recommended attendance threshold.`;
  }

  return {
    score: totalScore,
    decision,
    reasons: reasons.slice(0, 3),
    concerns: concerns.slice(0, 2),
    confidence,
    scoringBreakdown,
    strongestReason,
  };
}
