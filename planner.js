function renderPlannerSummary() {
  const plannerSummary = document.getElementById('plannerSummary');
  const tasks = getPlannerTasks();

  if (!tasks.length) {
    plannerSummary.innerHTML = '<p>No tasks yet. Add a study block to start planning.</p>';
    return;
  }

  const byDay = {};
  tasks.forEach((task) => {
    byDay[task.day] = (byDay[task.day] || 0) + Number(task.duration || 0);
  });

  const items = Object.entries(byDay)
    .map(([day, minutes]) => `<div class="history-row"><span>${day}</span><strong>${minutes} min</strong></div>`)
    .join('');

  plannerSummary.innerHTML = items;
}

function renderPlannerList() {
  const plannerList = document.getElementById('plannerList');
  const tasks = getPlannerTasks();

  if (!tasks.length) {
    plannerList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🗓️</div>
        <h3>No study tasks planned</h3>
        <p>Use the form to build a realistic weekly schedule.</p>
      </div>`;
    return;
  }

  plannerList.innerHTML = tasks
    .slice()
    .sort((a, b) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time))
    .map((task) => `
      <div class="task-card ${task.completed ? 'completed' : ''}">
        <div class="task-top">
          <span class="task-subject">${task.subject}</span>
          <span class="status-badge ${task.completed ? 'done' : ''}">${task.completed ? 'Done' : 'Planned'}</span>
        </div>
        <div class="task-meta">
          <span>${task.day}</span>
          <span>${task.time}</span>
          <span>${task.duration} min</span>
        </div>
        <div class="task-controls">
          <button class="view-btn" type="button" data-toggle-id="${task.id}">${task.completed ? 'Mark active' : 'Mark done'}</button>
          <button class="view-btn" type="button" data-edit-id="${task.id}">Edit</button>
          <button class="delete-btn" type="button" data-delete-task="${task.id}">Delete</button>
        </div>
      </div>
    `)
    .join('');

  document.querySelectorAll('[data-toggle-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const taskId = button.dataset.toggleId;
      const tasks = getPlannerTasks();
      const target = tasks.find((task) => String(task.id) === taskId);
      if (!target) return;
      target.completed = !target.completed;
      savePlannerTask(target);
      renderPlanner();
    });
  });

  document.querySelectorAll('[data-edit-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const taskId = button.dataset.editId;
      const tasks = getPlannerTasks();
      const target = tasks.find((task) => String(task.id) === taskId);
      if (!target) return;

      document.getElementById('plannerSubject').value = target.subject;
      document.getElementById('plannerDay').value = target.day;
      document.getElementById('plannerTime').value = target.time;
      document.getElementById('plannerDuration').value = target.duration;
      document.getElementById('savePlannerTask').dataset.editId = String(target.id);
      document.getElementById('savePlannerTask').textContent = 'Update task';
    });
  });

  document.querySelectorAll('[data-delete-task]').forEach((button) => {
    button.addEventListener('click', () => {
      if (window.confirm('Delete this task from your planner?')) {
        removePlannerTask(button.dataset.deleteTask);
        renderPlanner();
      }
    });
  });
}

function renderPlanner() {
  renderPlannerSummary();
  renderPlannerList();
}

function initializePlanner() {
  const plannerForm = document.getElementById('plannerForm');
  const saveButton = document.getElementById('savePlannerTask');

  plannerForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const subject = document.getElementById('plannerSubject').value.trim();
    const day = document.getElementById('plannerDay').value;
    const time = document.getElementById('plannerTime').value;
    const duration = Number(document.getElementById('plannerDuration').value);

    if (!subject || !day || !time || !duration) {
      window.alert('Please fill in all task fields before saving.');
      return;
    }

    const existingId = saveButton.dataset.editId;
    const task = {
      id: existingId || `${Date.now()}`,
      subject,
      day,
      time,
      duration,
      completed: existingId ? getPlannerTasks().find((item) => String(item.id) === existingId)?.completed || false : false
    };

    savePlannerTask(task);
    plannerForm.reset();
    delete saveButton.dataset.editId;
    saveButton.textContent = 'Add task';
    renderPlanner();
  });

  document.getElementById('resetPlannerBtn').addEventListener('click', () => {
    if (window.confirm('Clear all saved planner tasks?')) {
      resetPlannerTasks();
      renderPlanner();
    }
  });

  renderPlanner();
}
