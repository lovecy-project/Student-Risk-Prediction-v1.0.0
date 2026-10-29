const RISK_FACTORS = [
  {
    key: 'studyHours',
    label: 'Study hours',
    weight: 18,
    getRisk: function (value) {
      const map = {
        'less-than-2': 10,
        '2-to-4': 18,
        '4-to-6': 34,
        '6-to-8': 64,
        'more-than-8': 84
      };
      return map[value] ?? 0;
    }
  },
  {
    key: 'sleep',
    label: 'Sleep duration',
    weight: 18,
    getRisk: function (value) {
      const map = {
        'less-than-4': 95,
        '4-to-5': 68,
        '6-to-7': 28,
        '8-or-more': 10
      };
      return map[value] ?? 0;
    }
  },
  {
    key: 'stress',
    label: 'Academic stress',
    weight: 12,
    getRisk: function (value) {
      const map = {
        1: 10,
        2: 20,
        3: 38,
        4: 64,
        5: 88
      };
      return map[Number(value)] ?? 0;
    }
  },
  {
    key: 'concentration',
    label: 'Concentration difficulty',
    weight: 12,
    getRisk: function (value) {
      const map = {
        1: 10,
        2: 22,
        3: 38,
        4: 66,
        5: 86
      };
      return map[Number(value)] ?? 0;
    }
  },
  {
    key: 'motivation',
    label: 'Motivation',
    weight: 8,
    getRisk: function (value) {
      const map = {
        1: 90,
        2: 72,
        3: 48,
        4: 24,
        5: 8
      };
      return map[Number(value)] ?? 0;
    }
  },
  {
    key: 'overwhelmed',
    label: 'Feeling overwhelmed',
    weight: 8,
    getRisk: function (value) {
      const map = {
        1: 12,
        2: 24,
        3: 42,
        4: 70,
        5: 90
      };
      return map[Number(value)] ?? 0;
    }
  },
  {
    key: 'breaks',
    label: 'Break frequency',
    weight: 6,
    getRisk: function (value) {
      const map = {
        rarely: 82,
        sometimes: 42,
        regularly: 18
      };
      return map[value] ?? 0;
    }
  },
  {
    key: 'workLifeBalance',
    label: 'Work-life balance',
    weight: 8,
    getRisk: function (value) {
      const map = {
        1: 12,
        2: 24,
        3: 38,
        4: 66,
        5: 90
      };
      return map[Number(value)] ?? 0;
    }
  },
  {
    key: 'exhaustion',
    label: 'Mental exhaustion',
    weight: 8,
    getRisk: function (value) {
      const map = {
        1: 10,
        2: 20,
        3: 38,
        4: 68,
        5: 92
      };
      return map[Number(value)] ?? 0;
    }
  },
  {
    key: 'satisfaction',
    label: 'Routine satisfaction',
    weight: 12,
    getRisk: function (value) {
      const map = {
        1: 90,
        2: 72,
        3: 46,
        4: 24,
        5: 8
      };
      return map[Number(value)] ?? 0;
    }
  }
];

function calculateRiskScore(answers) {
  let weightedTotal = 0;
  const factorBreakdown = RISK_FACTORS.map((factor) => {
    const risk = factor.getRisk(answers[factor.key]);
    weightedTotal += factor.weight * (risk / 100);
    return {
      key: factor.key,
      label: factor.label,
      risk,
      weight: factor.weight
    };
  });

  const score = Math.max(0, Math.min(100, Math.round(weightedTotal)));
  const category = score <= 33 ? 'Low' : score <= 66 ? 'Moderate' : 'High';

  return {
    score,
    category,
    factorBreakdown,
    summary: {
      low: 'Your current estimate suggests a manageable study load with room to sustain healthy routines.',
      moderate: 'Your estimate suggests some strain in balance, recovery, or workload that may be worth addressing early.',
      high: 'Your estimate suggests significant pressure across study demand, recovery, and routine sustainability. Focus on support and practical adjustments.'
    }
  };
}

function getRiskCategory(score) {
  if (score <= 33) return 'Low';
  if (score <= 66) return 'Moderate';
  return 'High';
}

function getRecommendations(answers, score) {
  const recs = [];
  const addRecommendation = (title, text) => {
    recs.push({ title, text });
  };

  if (answers.sleep === 'less-than-4' || answers.sleep === '4-to-5') {
    addRecommendation('Protect your sleep schedule', 'Aim for a consistent bedtime and wake-up time, and reduce late-night study sessions where possible. A regular sleep routine supports concentration and recovery.');
  }

  if (answers.studyHours === '6-to-8' || answers.studyHours === 'more-than-8') {
    addRecommendation('Reduce study overload', 'Break large study blocks into focused sessions and add realistic stopping points. A more sustainable pace often improves retention and energy.');
  }

  if (answers.stress >= 4 || answers.overwhelmed >= 4 || answers.exhaustion >= 4) {
    addRecommendation('Lower everyday stress', 'Practice brief relaxation breaks, plan your top priorities, and consider asking for support from a peer, lecturer, or counselor when the pressure builds.');
  }

  if (answers.concentration >= 4 || answers.motivation <= 2) {
    addRecommendation('Improve focus and momentum', 'Remove common distractions, set a single clear task, and use shorter study blocks with a simple starting goal to regain momentum.');
  }

  if (answers.workLifeBalance >= 4) {
    addRecommendation('Rebuild boundaries', 'Schedule downtime, rest, movement, and social time intentionally. Protecting personal time can improve resilience and study quality.');
  }

  if (answers.breaks === 'rarely') {
    addRecommendation('Add regular breaks', 'Take a few minutes away from screens and tasks every 50–60 minutes. Short resets can improve focus and reduce mental fatigue.');
  }

  if (answers.satisfaction <= 2 || answers.motivation <= 2) {
    addRecommendation('Refresh your routine', 'Adjust your study plan to match your energy levels. Smaller, more achievable goals can create steadier progress and a better sense of control.');
  }

  if (score >= 67) {
    addRecommendation('Seek additional support', 'If you are feeling persistent exhaustion or distress, speaking with a trusted person, college counselor, or qualified mental health professional can be a helpful step.');
  }

  if (recs.length < 3) {
    addRecommendation('Keep building healthy study habits', 'Review your routine regularly, keep your workload realistic, and make small adjustments before deadlines begin to pile up.');
  }

  return recs.slice(0, 5);
}

function buildAssessmentResult(answers) {
  const scoreData = calculateRiskScore(answers);
  const topFactors = [...scoreData.factorBreakdown].sort((a, b) => b.risk - a.risk).slice(0, 4);
  const recommendations = getRecommendations(answers, scoreData.score);

  const result = {
    score: scoreData.score,
    category: scoreData.category,
    riskText: `${scoreData.category} estimated risk`,
    explanation:
      scoreData.category === 'Low'
        ? 'Your current estimate suggests a manageable balance between study load, sleep, and recovery. You may still benefit from protecting your energy and routine consistency.'
        : scoreData.category === 'Moderate'
          ? 'Your current estimate suggests some stress and recovery challenges. A few manageable changes could help improve your balance and focus.'
          : 'Your current estimate suggests a high level of study pressure and reduced recovery. Focus on support, rest, and realistic expectations to restore steadiness.',
    factorBreakdown: scoreData.factorBreakdown,
    topFactors,
    recommendations,
    title: scoreData.category === 'Low' ? 'A healthy rhythm is within reach' : scoreData.category === 'Moderate' ? 'A few adjustments could help' : 'Supportive changes may help you recover balance'
  };

  return result;
}
