const assessmentState = {
  stepIndex: 0,
  maxSteps: 4
};

function getQuestionSteps() {
  return Array.from(document.querySelectorAll('.step-panel'));
}

function getCurrentStep() {
  const steps = getQuestionSteps();
  return steps[assessmentState.stepIndex] || null;
}

function setStep(stepIndex) {
  const steps = getQuestionSteps();
  const safeIndex = Math.max(0, Math.min(stepIndex, steps.length - 1));
  assessmentState.stepIndex = safeIndex;

  steps.forEach((panel, index) => {
    panel.classList.toggle('active', index === safeIndex);
  });

  const bullets = Array.from(document.querySelectorAll('.step-bullet'));
  bullets.forEach((bullet, index) => {
    bullet.classList.toggle('active', index <= safeIndex);
  });

  const prevButton = document.getElementById('prevStep');
  const nextButton = document.getElementById('nextStep');
  const submitButton = document.getElementById('submitAssessment');

  prevButton.classList.toggle('hidden', safeIndex === 0);
  nextButton.classList.toggle('hidden', safeIndex === steps.length - 1);
  submitButton.classList.toggle('hidden', safeIndex !== steps.length - 1);
}

function createStepIndicator() {
  const stepIndicator = document.getElementById('stepIndicator');
  stepIndicator.innerHTML = '';

  Array.from({ length: 4 }).forEach((_, index) => {
    const bullet = document.createElement('span');
    bullet.className = 'step-bullet';
    if (index === 0) bullet.classList.add('active');
    stepIndicator.appendChild(bullet);
  });
}

function collectAssessmentAnswers() {
  const answerCollection = {};
  const selectors = ['studyHours', 'sleep', 'stress', 'concentration', 'motivation', 'overwhelmed', 'breaks', 'workLifeBalance', 'exhaustion', 'satisfaction'];

  selectors.forEach((fieldName) => {
    const selected = document.querySelector(`input[name="${fieldName}"]:checked`);
    if (selected) {
      answerCollection[fieldName] = selected.value;
    }

    if (fieldName === 'stress' || fieldName === 'concentration' || fieldName === 'motivation' || fieldName === 'overwhelmed' || fieldName === 'workLifeBalance' || fieldName === 'exhaustion' || fieldName === 'satisfaction') {
      const input = document.querySelector(`input[name="${fieldName}"]`);
      if (input && !selected) {
        answerCollection[fieldName] = Number(input.value);
      }
    }
  });

  return answerCollection;
}

function validateCurrentStep() {
  const currentPanel = getCurrentStep();
  const inputs = Array.from(currentPanel.querySelectorAll('input[name]')).filter((input) => input.type !== 'button');
  const groups = {};

  inputs.forEach((input) => {
    groups[input.name] = groups[input.name] || [];
    groups[input.name].push(input);
  });

  const missingGroup = Object.values(groups).find((group) => {
    const firstInput = group[0];
    if (firstInput.type === 'radio') {
      return !group.some((input) => input.checked);
    }
    return false;
  });

  if (missingGroup) {
    const formError = document.getElementById('formError');
    formError.textContent = 'Please answer every question in this section before continuing.';
    return false;
  }

  document.getElementById('formError').textContent = '';
  return true;
}

function updateSliderLabels() {
  document.querySelectorAll('input[type="range"]').forEach((slider) => {
    slider.addEventListener('input', () => {
      const label = slider.closest('.slider-range');
      if (!label) return;
      const valueText = label.querySelector('.slider-labels');
      if (!valueText) return;
      const positions = Array.from(valueText.children);
      positions.forEach((node, index) => {
        node.style.opacity = index + 1 === Number(slider.value) ? '1' : '0.6';
      });
    });
  });
}

function handleNextStep() {
  if (!validateCurrentStep()) {
    return;
  }

  setStep(assessmentState.stepIndex + 1);
}

function handlePreviousStep() {
  setStep(assessmentState.stepIndex - 1);
}

function saveResultAndNavigate(result) {
  const createdRecord = {
    id: Date.now(),
    date: new Date().toISOString(),
    score: result.score,
    category: result.category,
    result,
    answers: collectAssessmentAnswers()
  };

  addAssessmentRecord(createdRecord);
  window.currentResult = createdRecord;
  renderResults(result);
  renderDashboard();
  renderHistory();
  setActivePage('results');
}

function renderResults(result) {
  const gaugeProgress = document.getElementById('gaugeProgress');
  const gaugeScore = document.getElementById('gaugeScore');
  const resultCategory = document.getElementById('resultCategory');
  const resultTitle = document.getElementById('resultTitle');
  const resultExplanation = document.getElementById('resultExplanation');
  const resultCategoryText = document.getElementById('resultCategoryText');
  const resultRiskLabel = document.getElementById('resultRiskLabel');
  const factorList = document.getElementById('factorList');
  const recommendationList = document.getElementById('recommendationList');
  const chartCanvas = document.getElementById('factorChart');

  const circumference = 2 * Math.PI * 82;
  const offset = circumference - (result.score / 100) * circumference;
  gaugeProgress.style.strokeDasharray = circumference;
  gaugeProgress.style.strokeDashoffset = offset;
  gaugeScore.textContent = result.score;

  resultCategory.textContent = result.category;
  resultCategory.className = 'result-chip';

  if (result.category === 'Moderate') {
    resultCategory.classList.add('moderate');
  } else if (result.category === 'High') {
    resultCategory.classList.add('high');
  }

  resultTitle.textContent = result.title;
  resultExplanation.textContent = result.explanation;
  resultCategoryText.textContent = `${result.category} estimated risk`;
  resultRiskLabel.textContent = `${result.score}/100`;

  factorList.innerHTML = result.topFactors
    .map(
      (factor) => `
        <div class="factor-item">
          <div class="factor-label">
            <span>${factor.label}</span>
            <strong>${factor.risk}</strong>
          </div>
          <div class="bar-track"><span class="bar-fill" style="width:${Math.min(factor.risk, 100)}%"></span></div>
        </div>`
    )
    .join('');

  recommendationList.innerHTML = result.recommendations
    .map(
      (item, index) => `
        <div class="recommendation-card">
          <div class="rec-head">
            <span class="rec-icon">${['💤', '⏱️', '🌿', '🎯', '🤝'][index % 5]}</span>
            <strong>${item.title}</strong>
          </div>
          <p>${item.text}</p>
        </div>`
    )
    .join('');

  if (!window.__studyBalanceCharts) {
    window.__studyBalanceCharts = {};
  }

  if (window.__studyBalanceCharts.factorChartInstance && typeof window.__studyBalanceCharts.factorChartInstance.destroy === 'function') {
    window.__studyBalanceCharts.factorChartInstance.destroy();
  }

  const labels = result.factorBreakdown.slice(0, 7).map((item) => item.label);
  const data = result.factorBreakdown.slice(0, 7).map((item) => item.risk);

  window.__studyBalanceCharts.factorChartInstance = new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Risk score',
        data,
        borderRadius: 12,
        backgroundColor: ['#7c8cff', '#6ee7ff', '#8f63ff', '#60d5ff', '#ff8fab', '#f7c76a', '#58d68d']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: getComputedStyle(document.body).getPropertyValue('--muted') }
        },
        x: {
          ticks: { color: getComputedStyle(document.body).getPropertyValue('--muted') }
        }
      }
    }
  });
}

function initializeAssessment() {
  createStepIndicator();
  setStep(0);
  updateSliderLabels();

  document.getElementById('nextStep').addEventListener('click', handleNextStep);
  document.getElementById('prevStep').addEventListener('click', handlePreviousStep);
  document.getElementById('retakeAssessmentBtn').addEventListener('click', () => {
    document.getElementById('assessmentForm').reset();
    setStep(0);
    setActivePage('assessment');
  });

  document.getElementById('downloadReportBtn').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('assessmentForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const answers = collectAssessmentAnswers();

    const requiredKeys = ['studyHours', 'sleep', 'stress', 'concentration', 'motivation', 'overwhelmed', 'breaks', 'workLifeBalance', 'exhaustion', 'satisfaction'];
    const anyMissing = requiredKeys.some((key) => !answers[key] && answers[key] !== 0);

    if (anyMissing) {
      document.getElementById('formError').textContent = 'Please answer all questions before viewing your estimate.';
      return;
    }

    const result = buildAssessmentResult(answers);
    saveResultAndNavigate(result);
  });
}
