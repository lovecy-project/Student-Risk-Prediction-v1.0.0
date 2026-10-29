const STORAGE_KEYS = {
  theme: 'studybalance-theme',
  history: 'studybalance-history',
  planner: 'studybalance-planner'
};

function safeParse(rawValue, fallback) {
  try {
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch (error) {
    console.warn('Failed to parse localStorage value:', error);
    return fallback;
  }
}

function getStoredData(key, fallback) {
  try {
    const rawValue = localStorage.getItem(key);
    return safeParse(rawValue, fallback);
  } catch (error) {
    console.warn('localStorage access failed:', error);
    return fallback;
  }
}

function setStoredData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('Could not save to localStorage:', error);
    return false;
  }
}

function getThemePreference() {
  return getStoredData(STORAGE_KEYS.theme, 'dark');
}

function saveThemePreference(theme) {
  setStoredData(STORAGE_KEYS.theme, theme);
}

function getAssessmentHistory() {
  return getStoredData(STORAGE_KEYS.history, []);
}

function saveAssessmentHistory(history) {
  setStoredData(STORAGE_KEYS.history, history);
}

function getPlannerTasks() {
  return getStoredData(STORAGE_KEYS.planner, []);
}

function savePlannerTasks(tasks) {
  setStoredData(STORAGE_KEYS.planner, tasks);
}

function addAssessmentRecord(record) {
  const history = getAssessmentHistory();
  const nextHistory = [...history, record];
  saveAssessmentHistory(nextHistory);
  return nextHistory;
}

function removeAssessmentRecord(id) {
  const filtered = getAssessmentHistory().filter((entry) => String(entry.id) !== String(id));
  saveAssessmentHistory(filtered);
  return filtered;
}

function clearAssessmentHistory() {
  saveAssessmentHistory([]);
  return [];
}

function removePlannerTask(taskId) {
  const planner = getPlannerTasks().filter((task) => String(task.id) !== String(taskId));
  savePlannerTasks(planner);
  return planner;
}

function savePlannerTask(task) {
  const planner = getPlannerTasks();
  const existingIndex = planner.findIndex((entry) => String(entry.id) === String(task.id));

  if (existingIndex >= 0) {
    planner[existingIndex] = task;
  } else {
    planner.push(task);
  }

  savePlannerTasks(planner);
  return planner;
}

function resetPlannerTasks() {
  savePlannerTasks([]);
  return [];
}
