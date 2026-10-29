function getLatestAssessment() {
  const history = getAssessmentHistory();
  return history.length ? history[history.length - 1] : null;
}

function formatDisplayDate(isoString) {
  return new Date(isoString).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function renderDashboard() {
  const history = getAssessmentHistory();
  const dashboardEmpty = document.getElementById('dashboardEmpty');
  const dashboardContent = document.getElementById('dashboardContent');

  if (!history.length) {
    dashboardEmpty.classList.remove('hidden');
    dashboardContent.classList.add('hidden');
    return;
  }

  dashboardEmpty.classList.add('hidden');
  dashboardContent.classList.remove('hidden');

  const latest = history[history.length - 1];
  const latestScore = latest.result ? latest.result.score : latest.score;
  const category = latest.result ? latest.result.category : latest.category;

  document.getElementById('latestScoreValue').textContent = `${latestScore}`;
  document.getElementById('latestCategoryValue').textContent = category;
  document.getElementById('assessmentCountValue').textContent = history.length;

  const avgStudyHours = history.reduce((total, entry) => {
    const value = entry.answers.studyHours;
    const mapped = {
      'less-than-2': 1,
      '2-to-4': 3,
      '4-to-6': 5,
      '6-to-8': 7,
      'more-than-8': 9
    };
    return total + (mapped[value] || 0);
  }, 0) / history.length;

  const avgSleep = history.reduce((total, entry) => {
    const value = entry.answers.sleep;
    const mapped = {
      'less-than-4': 2,
      '4-to-5': 4.5,
      '6-to-7': 6.5,
      '8-or-more': 8.5
    };
    return total + (mapped[value] || 0);
  }, 0) / history.length;

  document.getElementById('avgStudyHoursValue').textContent = `${avgStudyHours.toFixed(1)}h`;
  document.getElementById('avgSleepValue').textContent = `${avgSleep.toFixed(1)}h`;

  const recentHistoryList = document.getElementById('recentHistoryList');
  recentHistoryList.innerHTML = [...history].slice(-4).reverse().map((entry) => `
    <div class="history-item">
      <div class="history-header">
        <strong>${formatDisplayDate(entry.date)}</strong>
        <span class="history-score">${entry.score}</span>
      </div>
      <div class="history-row">
        <span>${entry.category} risk</span>
        <span>${entry.answers.studyHours || '—'} study</span>
      </div>
    </div>
  `).join('');

  const recommendationSource = latest.result ? latest.result.recommendations : getRecommendations(latest.answers, latest.score);
  document.getElementById('dashboardRecommendations').innerHTML = recommendationSource.slice(0, 4).map((item) => `
    <div class="recommendation-card">
      <div class="rec-head">
        <span class="rec-icon">✦</span>
        <strong>${item.title}</strong>
      </div>
      <p>${item.text}</p>
    </div>
  `).join('');

  const scoreLabels = history.map((entry) => formatDisplayDate(entry.date));
  const scoreValues = history.map((entry) => entry.score);

  if (!window.__studyBalanceCharts) {
    window.__studyBalanceCharts = {};
  }

  if (window.__studyBalanceCharts.scoreTrendChart && typeof window.__studyBalanceCharts.scoreTrendChart.destroy === 'function') {
    window.__studyBalanceCharts.scoreTrendChart.destroy();
  }

  const trendCanvas = document.getElementById('scoreTrendChart');
  window.__studyBalanceCharts.scoreTrendChart = new Chart(trendCanvas, {
    type: 'line',
    data: {
      labels: scoreLabels,
      datasets: [{
        label: 'Risk score',
        data: scoreValues,
        borderColor: '#7c8cff',
        backgroundColor: 'rgba(124,140,255,0.2)',
        borderWidth: 3,
        tension: 0.35,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
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

  const factorComparisonCanvas = document.getElementById('factorComparisonChart');
  const averageFactorData = {
    stress: averageFromHistory(history, 'stress'),
    concentration: averageFromHistory(history, 'concentration'),
    sleep: averageFromHistory(history, 'sleep'),
    workLifeBalance: averageFromHistory(history, 'workLifeBalance'),
    exhaustion: averageFromHistory(history, 'exhaustion')
  };

  if (window.__studyBalanceCharts.factorComparisonChart && typeof window.__studyBalanceCharts.factorComparisonChart.destroy === 'function') {
    window.__studyBalanceCharts.factorComparisonChart.destroy();
  }

  window.__studyBalanceCharts.factorComparisonChart = new Chart(factorComparisonCanvas, {
    type: 'bar',
    data: {
      labels: ['Stress', 'Focus', 'Sleep', 'Balance', 'Exhaustion'],
      datasets: [{
        label: 'Average score',
        data: [averageFactorData.stress, averageFactorData.concentration, averageFactorData.sleep, averageFactorData.workLifeBalance, averageFactorData.exhaustion].map((value) => value * 18),
        backgroundColor: ['#7c8cff', '#6ee7ff', '#8f63ff', '#60d5ff', '#ff8fab']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
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

function averageFromHistory(history, fieldName) {
  const values = history.map((entry) => {
    const value = entry.answers[fieldName];
    if (typeof value === 'number') return value;
    if (value === 'less-than-4') return 1;
    if (value === '4-to-5') return 2;
    if (value === '6-to-7') return 3;
    if (value === '8-or-more') return 4;
    if (value === 'rarely') return 1;
    if (value === 'sometimes') return 2;
    if (value === 'regularly') return 3;
    return 3;
  });

  return values.length ? values.reduce((total, current) => total + current, 0) / values.length : 0;
}

function renderHistory() {
  const container = document.getElementById('historyList');
  const history = getAssessmentHistory();

  if (!history.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <h3>No saved history</h3>
        <p>Your assessment records will appear here after you complete a check.</p>
      </div>`;
    return;
  }

  container.innerHTML = history
    .slice()
    .reverse()
    .map((entry) => `
      <div class="history-item">
        <div class="history-header">
          <strong>${formatDisplayDate(entry.date)}</strong>
          <span class="history-score">${entry.score}</span>
        </div>
        <p>${entry.category} estimated risk</p>
        <div class="history-row">
          <span>Sleep: ${entry.answers.sleep || '—'}</span>
          <span>Study: ${entry.answers.studyHours || '—'}</span>
        </div>
        <div class="history-actions-row">
          <button class="view-btn" type="button" data-view-id="${entry.id}">View result</button>
          <button class="delete-btn" type="button" data-delete-id="${entry.id}">Delete</button>
        </div>
      </div>
    `)
    .join('');

  document.querySelectorAll('[data-view-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const entry = getAssessmentHistory().find((item) => String(item.id) === button.dataset.viewId);
      if (!entry) return;
      renderResults(entry.result || buildAssessmentResult(entry.answers));
      setActivePage('results');
    });
  });

  document.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => {
      if (window.confirm('Delete this saved assessment?')) {
        removeAssessmentRecord(button.dataset.deleteId);
        renderHistory();
        renderDashboard();
      }
    });
  });
}

function initializeDashboard() {
  document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    if (window.confirm('Clear all saved assessment history? This cannot be undone.')) {
      clearAssessmentHistory();
      renderHistory();
      renderDashboard();
    }
  });

  renderDashboard();
  renderHistory();
}
