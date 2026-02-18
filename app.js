const STORAGE_KEY = 'checklist-app-state-v1';

const defaultState = {
  hideCompleted: false,
  search: '',
  sort: 'manual',
  activeProfileId: 'personal',
  activePane: 'active',
  ui: {
    theme: 'light',
    compact: false,
    accentColor: '#3d8bef',
    radius: 10,
    showAllDetails: false,
    expandAllNested: false,
    autoArchiveEnabled: true,
    autoArchiveDays: 7,
  },
  profiles: [
    {
      id: 'personal',
      name: 'Personal',
      parentProfileId: null,
      tasks: [
        {
          id: crypto.randomUUID(),
          title: 'Plan weekend errands',
          notes: 'Capture why this is priority now.',
          completed: false,
          completedAt: null,
          dueDate: '',
          recurrence: 'none',
          collapsed: false,
          detailsOpen: false,
          archivedAt: null,
          completedPeriods: [],
          hiddenPeriods: [],
          canceledPeriods: [],
          subtasks: [
            {
              id: crypto.randomUUID(),
              title: 'Buy groceries',
              notes: '',
              completed: false,
              completedAt: null,
              dueDate: '',
              recurrence: 'weekly',
              collapsed: false,
              detailsOpen: false,
              archivedAt: null,
              completedPeriods: [],
              hiddenPeriods: [],
              canceledPeriods: [],
              subtasks: [],
            },
          ],
        },
      ],
      archivedTasks: [],
    },
    { id: 'work', name: 'Work', parentProfileId: null, tasks: [], archivedTasks: [] },
    { id: 'work-project-alpha', name: 'Project Alpha', parentProfileId: 'work', tasks: [], archivedTasks: [] },
  ],
};

let state = normalizeState(loadState());
const el = {
  profilesList: document.querySelector('#profilesList'),
  newProfileForm: document.querySelector('#newProfileForm'),
  newProfileInput: document.querySelector('#newProfileInput'),
  newProfileParentSelect: document.querySelector('#newProfileParentSelect'),
  activeProfileTitle: document.querySelector('#activeProfileTitle'),
  profileSummary: document.querySelector('#profileSummary'),
  hideCompletedToggle: document.querySelector('#hideCompletedToggle'),
  searchInput: document.querySelector('#searchInput'),
  sortSelect: document.querySelector('#sortSelect'),
  newTaskForm: document.querySelector('#newTaskForm'),
  newTaskTitle: document.querySelector('#newTaskTitle'),
  newTaskDueDate: document.querySelector('#newTaskDueDate'),
  newTaskRecurrence: document.querySelector('#newTaskRecurrence'),
  taskList: document.querySelector('#taskList'),
  archivedList: document.querySelector('#archivedList'),
  taskTemplate: document.querySelector('#taskTemplate'),
  archivedTaskTemplate: document.querySelector('#archivedTaskTemplate'),
  toggleNestedBtn: document.querySelector('#toggleNestedBtn'),
  toggleDetailsBtn: document.querySelector('#toggleDetailsBtn'),
  activeTabBtn: document.querySelector('#activeTabBtn'),
  archivedTabBtn: document.querySelector('#archivedTabBtn'),
  activePane: document.querySelector('#activePane'),
  archivedPane: document.querySelector('#archivedPane'),
  openProfilesBtn: document.querySelector('#openProfilesBtn'),
  closeProfilesBtn: document.querySelector('#closeProfilesBtn'),
  profilesModal: document.querySelector('#profilesModal'),
  parentProfilesList: document.querySelector('#parentProfilesList'),
  childProfilesList: document.querySelector('#childProfilesList'),
  projectsHeading: document.querySelector('#projectsHeading'),
  newParentProfileForm: document.querySelector('#newParentProfileForm'),
  newParentProfileInput: document.querySelector('#newParentProfileInput'),
  newChildProfileForm: document.querySelector('#newChildProfileForm'),
  newChildProfileInput: document.querySelector('#newChildProfileInput'),
  openSettingsBtn: document.querySelector('#openSettingsBtn'),
  closeSettingsBtn: document.querySelector('#closeSettingsBtn'),
  settingsModal: document.querySelector('#settingsModal'),
  themeToggle: document.querySelector('#themeToggle'),
  compactToggle: document.querySelector('#compactToggle'),
  accentColorInput: document.querySelector('#accentColorInput'),
  radiusInput: document.querySelector('#radiusInput'),
  autoArchiveToggle: document.querySelector('#autoArchiveToggle'),
  autoArchiveDaysInput: document.querySelector('#autoArchiveDaysInput'),
};

bindEvents();
render();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);
  try {
    return { ...structuredClone(defaultState), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultState);
  }
}

function normalizeState(nextState) {
  nextState.ui = { ...structuredClone(defaultState.ui), ...(nextState.ui || {}) };
  nextState.profiles = nextState.profiles || [];
  nextState.activePane = nextState.activePane === 'archived' ? 'archived' : 'active';

  nextState.profiles.forEach((profile) => {
    profile.parentProfileId ??= null;
    profile.tasks = profile.tasks || [];
    profile.archivedTasks = profile.archivedTasks || [];
    profile.tasks.forEach((task) => normalizeTask(task));
    profile.archivedTasks.forEach((task) => normalizeTask(task));
  });

  if (!nextState.profiles.find((profile) => profile.id === nextState.activeProfileId) && nextState.profiles[0]) {
    nextState.activeProfileId = nextState.profiles[0].id;
  }

  return nextState;
}

function normalizeTask(task) {
  task.notes ??= '';
  task.recurrence ||= 'none';
  task.completedPeriods ||= [];
  task.hiddenPeriods ||= [];
  task.canceledPeriods ||= [];
  task.completedAt ??= null;
  task.archivedAt ??= null;
  task.detailsOpen = Boolean(task.detailsOpen);
  task.collapsed = Boolean(task.collapsed);
  task.subtasks ||= [];
  task.subtasks.forEach((subtask) => normalizeTask(subtask));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindEvents() {
  el.newParentProfileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = el.newParentProfileInput.value.trim();
    if (!name) return;

    const id = uniqueProfileId(name);
    state.profiles.push({ id, name, parentProfileId: null, tasks: [], archivedTasks: [] });
    state.activeProfileId = id;

    el.newParentProfileInput.value = '';
    persistAndRender();
  });

  el.newChildProfileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = el.newChildProfileInput.value.trim();
    if (!name) return;

    const parent = selectedParentProfile();
    const id = uniqueProfileId(`${parent.id}-${name}`);
    state.profiles.push({ id, name, parentProfileId: parent.id, tasks: [], archivedTasks: [] });
    state.activeProfileId = id;

    el.newChildProfileInput.value = '';
  el.newProfileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = el.newProfileInput.value.trim();
    if (!name) return;

    const id = slugify(name) || crypto.randomUUID();
    if (state.profiles.some((profile) => profile.id === id)) return;

    const parentProfileId = el.newProfileParentSelect.value || null;
    state.profiles.push({ id, name, parentProfileId, tasks: [], archivedTasks: [] });
    state.activeProfileId = id;

    el.newProfileInput.value = '';
    el.newProfileParentSelect.value = '';
    persistAndRender();
  });

  el.newTaskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = el.newTaskTitle.value.trim();
    if (!title) return;

    activeProfile().tasks.push(newTask(title, el.newTaskDueDate.value, el.newTaskRecurrence.value));
    el.newTaskTitle.value = '';
    el.newTaskDueDate.value = '';
    el.newTaskRecurrence.value = 'none';
    persistAndRender();
  });

  el.hideCompletedToggle.addEventListener('change', () => {
    state.hideCompleted = el.hideCompletedToggle.checked;
    persistAndRender();
  });

  el.searchInput.addEventListener('input', () => {
    state.search = el.searchInput.value.trim().toLowerCase();
    persistAndRender();
  });

  el.sortSelect.addEventListener('change', () => {
    state.sort = el.sortSelect.value;
    persistAndRender();
  });

  el.toggleNestedBtn.addEventListener('click', () => {
    state.ui.expandAllNested = !state.ui.expandAllNested;
    visitTasks(activeProfile().tasks, (task) => {
      task.collapsed = !state.ui.expandAllNested;
    });
    persistAndRender();
  });

  el.toggleDetailsBtn.addEventListener('click', () => {
    state.ui.showAllDetails = !state.ui.showAllDetails;
    visitTasks(activeProfile().tasks, (task) => {
      task.detailsOpen = state.ui.showAllDetails;
    });
    persistAndRender();
  });

  el.activeTabBtn.addEventListener('click', () => {
    state.activePane = 'active';
    persistAndRender();
  });

  el.archivedTabBtn.addEventListener('click', () => {
    state.activePane = 'archived';
    persistAndRender();
  });

  el.openProfilesBtn.addEventListener('click', () => {
    el.settingsModal.classList.add('hidden');
    el.profilesModal.classList.remove('hidden');
  });

  el.closeProfilesBtn.addEventListener('click', () => {
    el.profilesModal.classList.add('hidden');
  });

  el.openSettingsBtn.addEventListener('click', () => {
    el.profilesModal.classList.add('hidden');
    el.settingsModal.classList.remove('hidden');
  });

  el.closeSettingsBtn.addEventListener('click', () => {
    el.settingsModal.classList.add('hidden');
  });

  [el.profilesModal, el.settingsModal].forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.classList.add('hidden');
    });
  });

  el.themeToggle.addEventListener('change', () => {
    state.ui.theme = el.themeToggle.checked ? 'dark' : 'light';
    persistAndRender();
  });

  el.compactToggle.addEventListener('change', () => {
    state.ui.compact = el.compactToggle.checked;
    persistAndRender();
  });

  el.accentColorInput.addEventListener('input', () => {
    state.ui.accentColor = el.accentColorInput.value;
    persistAndRender();
  });

  el.radiusInput.addEventListener('input', () => {
    state.ui.radius = Number(el.radiusInput.value);
    persistAndRender();
  });

  el.autoArchiveToggle.addEventListener('change', () => {
    state.ui.autoArchiveEnabled = el.autoArchiveToggle.checked;
    persistAndRender();
  });

  el.autoArchiveDaysInput.addEventListener('change', () => {
    const days = clampNumber(Number(el.autoArchiveDaysInput.value), 1, 180, 7);
    state.ui.autoArchiveDays = days;
    persistAndRender();
  });
}

function render() {
  applyUiVariables();
  maybeAutoArchiveCompletedParents();

  el.hideCompletedToggle.checked = state.hideCompleted;
  el.searchInput.value = state.search;
  el.sortSelect.value = state.sort;

  el.themeToggle.checked = state.ui.theme === 'dark';
  el.compactToggle.checked = state.ui.compact;
  el.accentColorInput.value = state.ui.accentColor;
  el.radiusInput.value = String(state.ui.radius);
  el.autoArchiveToggle.checked = state.ui.autoArchiveEnabled;
  el.autoArchiveDaysInput.value = String(state.ui.autoArchiveDays);

  el.toggleNestedBtn.textContent = state.ui.expandAllNested ? 'Hide subtasks' : 'Expand subtasks';
  el.toggleDetailsBtn.textContent = state.ui.showAllDetails ? 'Hide details' : 'Show details';

  el.activeTabBtn.classList.toggle('active', state.activePane === 'active');
  el.archivedTabBtn.classList.toggle('active', state.activePane === 'archived');
  el.activeTabBtn.setAttribute('aria-selected', state.activePane === 'active' ? 'true' : 'false');
  el.archivedTabBtn.setAttribute('aria-selected', state.activePane === 'archived' ? 'true' : 'false');
  el.activePane.classList.toggle('is-hidden', state.activePane !== 'active');
  el.archivedPane.classList.toggle('is-hidden', state.activePane !== 'archived');

  renderProfiles();
  renderHeader();
  renderTasks();
  renderArchivedTasks();
}

function applyUiVariables() {
  document.body.classList.toggle('dark', state.ui.theme === 'dark');
  document.body.classList.toggle('compact', state.ui.compact);
  document.documentElement.style.setProperty('--accent', state.ui.accentColor);
  document.documentElement.style.setProperty('--radius', `${state.ui.radius}px`);
}

function maybeAutoArchiveCompletedParents() {
  if (!state.ui.autoArchiveEnabled) return;
  const cutoffMs = Date.now() - state.ui.autoArchiveDays * 86400000;

  state.profiles.forEach((profile) => {
    autoArchiveInTree(profile.tasks, profile.archivedTasks, cutoffMs);
  });
}

function autoArchiveInTree(tasks, archiveBucket, cutoffMs) {
  for (let index = tasks.length - 1; index >= 0; index -= 1) {
    const task = tasks[index];

    autoArchiveInTree(task.subtasks, archiveBucket, cutoffMs);

    const isEligible = task.recurrence === 'none' && task.subtasks.length > 0 && task.completed && task.completedAt;
    if (!isEligible) continue;

    const completedAt = Date.parse(task.completedAt);
    if (Number.isNaN(completedAt) || completedAt > cutoffMs) continue;

    task.archivedAt = new Date().toISOString();
    archiveBucket.unshift(task);
    tasks.splice(index, 1);
  }
}

function renderProfiles() {
  el.parentProfilesList.innerHTML = '';
  el.childProfilesList.innerHTML = '';

  const roots = state.profiles.filter((profile) => !profile.parentProfileId);
  const selectedParent = selectedParentProfile();
  el.projectsHeading.textContent = `Projects for ${selectedParent.name}`;

  roots.forEach((profile) => renderParentProfileRow(profile, profile.id === selectedParent.id));

  const children = state.profiles.filter((profile) => profile.parentProfileId === selectedParent.id);
  if (!children.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No projects yet for this parent profile.';
    el.childProfilesList.appendChild(empty);
    return;
  }

  children.forEach((profile) => renderProjectRow(profile));
}

function renderParentProfileRow(profile, isSelectedParent) {
  const row = profileRowShell();
  const button = profileButton(profile, isSelectedParent, `(${countCurrentTasks(profile.tasks)})`);
  button.addEventListener('click', () => {
    state.activeProfileId = profile.id;
    persistAndRender();
  });

  row.append(button, deleteProfileButton(profile));
  el.parentProfilesList.appendChild(row);
}

function renderProjectRow(profile) {
  const row = profileRowShell();
  const button = profileButton(profile, profile.id === state.activeProfileId, `(${countCurrentTasks(profile.tasks)})`);
  el.profilesList.innerHTML = '';
  const roots = state.profiles.filter((profile) => !profile.parentProfileId);
  roots.forEach((profile) => renderProfileButton(profile, 0));
}

function renderProfileButton(profile, depth) {
  const button = document.createElement('button');
  button.className = `profile-btn ${profile.id === state.activeProfileId ? 'active' : ''}`;
  button.style.paddingLeft = `${10 + depth * 14}px`;

  const prefix = depth > 0 ? '↳ ' : '';
  button.textContent = `${prefix}${profile.name} (${countCurrentTasks(profile.tasks)})`;
  button.addEventListener('click', () => {
    state.activeProfileId = profile.id;
    persistAndRender();
  });

  row.append(button, deleteProfileButton(profile));
  el.childProfilesList.appendChild(row);
}

function profileRowShell() {
  const row = document.createElement('div');
  row.className = 'profile-row';
  return row;
}

function profileButton(profile, isActive, suffix = '') {
  const button = document.createElement('button');
  button.className = `profile-btn ${isActive ? 'active' : ''}`;
  button.textContent = `${profile.name} ${suffix}`.trim();
  return button;
}

function deleteProfileButton(profile) {
  const button = document.createElement('button');
  button.className = 'ghost-button profile-delete-btn';
  button.type = 'button';
  button.textContent = 'Delete';

  button.addEventListener('click', () => {
    removeProfile(profile.id);
  });

  return button;
}

function renderHeader() {
  const profile = activeProfile();
  const completed = countCompleted(profile.tasks);
  const total = countCurrentTasks(profile.tasks);
  const lineage = profileLineage(profile).map((item) => item.name).join(' / ');

  el.activeProfileTitle.textContent = lineage;
  el.profileSummary.textContent = `${completed}/${total} done • ${Math.round((completed / Math.max(total, 1)) * 100)}% complete`;
}

function renderTasks() {
  const tasks = sortedTasks(activeProfile().tasks);
  el.taskList.innerHTML = '';
  tasks.forEach((task) => renderTask(task, el.taskList, activeProfile().tasks, 0));
}

function renderTask(task, parentElement, siblingArray, depth) {
  if (isTaskSuppressed(task)) return;
  if (state.hideCompleted && isTaskCompleted(task)) return;
  if (state.search && !taskMatches(task, state.search)) return;

  const node = el.taskTemplate.content.firstElementChild.cloneNode(true);
  node.classList.toggle('collapsed', task.collapsed);
  node.classList.toggle('is-subtask', depth > 0);

  const expander = node.querySelector('.task-expander');
  const checkbox = node.querySelector('.task-checkbox');
  const titleInput = node.querySelector('.task-title-input');
  const quickMeta = node.querySelector('.task-quick-meta');
  const detailsPanel = node.querySelector('.task-details-panel');
  const dueInput = node.querySelector('.task-due-input');
  const recurrenceSelect = node.querySelector('.task-recurrence-select');
  const notesInput = node.querySelector('.task-notes-input');
  const addSubtaskBtn = node.querySelector('.add-subtask-btn');
  const hideOnceBtn = node.querySelector('.hide-once-btn');
  const cancelOnceBtn = node.querySelector('.cancel-once-btn');
  const archiveTaskBtn = node.querySelector('.archive-task-btn');
  const deleteTaskBtn = node.querySelector('.delete-task-btn');
  const subtaskChip = node.querySelector('.subtask-chip');
  const subtasksEl = node.querySelector('.subtasks');

  checkbox.checked = isTaskCompleted(task);
  titleInput.value = task.title;
  titleInput.classList.toggle('completed', isTaskCompleted(task));
  dueInput.value = task.dueDate || '';
  recurrenceSelect.value = task.recurrence;
  notesInput.value = task.notes;

  subtaskChip.classList.toggle('is-hidden', depth === 0);
  detailsPanel.classList.toggle('open', task.detailsOpen);
  quickMeta.innerHTML = quickMetaContent(task);

  expander.textContent = task.collapsed ? '▸' : '▾';
  expander.classList.toggle('expander-hidden', !task.subtasks.length);
  expander.addEventListener('click', () => {
    task.collapsed = !task.collapsed;
    persistAndRender();
  });

  checkbox.addEventListener('change', () => {
    setCompletedWithChildren(task, checkbox.checked);
    persistAndRender();
  });

  titleInput.addEventListener('change', () => {
    task.title = titleInput.value.trim() || task.title;
    persistAndRender();
  });

  dueInput.addEventListener('change', () => {
    task.dueDate = dueInput.value;
    persistAndRender();
  });

  recurrenceSelect.addEventListener('change', () => {
    task.recurrence = recurrenceSelect.value;
    resetTaskPeriodData(task);
    persistAndRender();
  });

  notesInput.addEventListener('focus', () => {
    if (!notesInput.value.trim()) {
      notesInput.value = '- ';
      notesInput.setSelectionRange(notesInput.value.length, notesInput.value.length);
    }
  });

  notesInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    const start = notesInput.selectionStart;
    const end = notesInput.selectionEnd;
    const value = notesInput.value;
    notesInput.value = `${value.slice(0, start)}\n- ${value.slice(end)}`;
    const cursor = start + 3;
    notesInput.setSelectionRange(cursor, cursor);
  });

  notesInput.addEventListener('change', () => {
    task.notes = normalizeNotesValue(notesInput.value);
    persistAndRender();
  });

  hideOnceBtn.classList.toggle('is-hidden', task.recurrence === 'none');
  cancelOnceBtn.classList.toggle('is-hidden', task.recurrence === 'none');

  hideOnceBtn.addEventListener('click', () => {
    if (task.recurrence === 'none') return;
    markTaskPeriod(task, 'hidden');
    persistAndRender();
  });

  cancelOnceBtn.addEventListener('click', () => {
    if (task.recurrence === 'none') return;
    markTaskPeriod(task, 'canceled');
    persistAndRender();
  });

  addSubtaskBtn.addEventListener('click', () => {
    const title = prompt('Subtask title');
    if (!title || !title.trim()) return;
    task.subtasks.push(newTask(title.trim()));
    task.collapsed = false;
    persistAndRender();
  });

  archiveTaskBtn.addEventListener('click', () => {
    const index = siblingArray.findIndex((candidate) => candidate.id === task.id);
    archiveTaskByIndex(siblingArray, index, activeProfile().archivedTasks);
    persistAndRender();
  });

  deleteTaskBtn.addEventListener('click', () => {
    const index = siblingArray.findIndex((candidate) => candidate.id === task.id);
    if (index >= 0) siblingArray.splice(index, 1);
    persistAndRender();
  });

  detailsPanel.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest('.details-grid') || target.closest('.details-actions')) {
      task.detailsOpen = true;
      saveState();
    }
  });

  quickMeta.addEventListener('click', () => {
    task.detailsOpen = !task.detailsOpen;
    persistAndRender();
  });

  sortedTasks(task.subtasks).forEach((subtask) => renderTask(subtask, subtasksEl, task.subtasks, depth + 1));
  parentElement.appendChild(node);
}

function renderArchivedTasks() {
  const profile = activeProfile();
  el.archivedList.innerHTML = '';

  if (!profile.archivedTasks.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No archived tasks yet.';
    el.archivedList.appendChild(empty);
    return;
  }

  profile.archivedTasks.forEach((task) => {
    const node = el.archivedTaskTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector('.archived-title').textContent = task.title;
    node.querySelector('.archived-meta').textContent = archivedMeta(task);

    node.querySelector('.restore-task-btn').addEventListener('click', () => {
      const index = profile.archivedTasks.findIndex((candidate) => candidate.id === task.id);
      if (index < 0) return;
      const restored = profile.archivedTasks.splice(index, 1)[0];
      restored.archivedAt = null;
      profile.tasks.unshift(restored);
      persistAndRender();
    });

    node.querySelector('.delete-archived-btn').addEventListener('click', () => {
      const index = profile.archivedTasks.findIndex((candidate) => candidate.id === task.id);
      if (index >= 0) profile.archivedTasks.splice(index, 1);
      persistAndRender();
    });

    el.archivedList.appendChild(node);
  });
}

function archivedMeta(task) {
  const bits = [];
  if (task.archivedAt) bits.push(`Archived ${new Date(task.archivedAt).toLocaleDateString()}`);
  if (task.completedAt) bits.push(`Completed ${new Date(task.completedAt).toLocaleDateString()}`);
  return bits.join(' • ');
}

function archiveTaskByIndex(list, index, archiveBucket) {
  if (index < 0) return;
  const task = list.splice(index, 1)[0];
  task.archivedAt = new Date().toISOString();
  archiveBucket.unshift(task);
}

function quickMetaContent(task) {
  const bits = [];
  const due = dueText(task.dueDate);
  if (due) bits.push(`<span class="${due.className}">📅 ${due.label}</span>`);
  if (task.recurrence !== 'none') bits.push(`<span>↻ ${task.recurrence}</span>`);
  if (task.notes) bits.push('<span>📝 notes</span>');
  bits.push(`<button type="button" class="link-button">${task.detailsOpen ? 'Hide details' : 'Show details'}</button>`);
  return bits.join(' • ');
}

function dueText(rawDate) {
  if (!rawDate) return null;
  const due = new Date(`${rawDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.floor((due - today) / 86400000);

  if (days < 0) return { className: 'overdue', label: `${Math.abs(days)}d overdue` };
  if (days === 0) return { className: 'overdue', label: 'Due today' };
  if (days <= 3) return { className: 'due-soon', label: `Due in ${days}d` };
  return { className: '', label: due.toLocaleDateString() };
}

function setCompletedWithChildren(task, completed) {
  if (task.recurrence === 'none') {
    task.completed = completed;
    task.completedAt = completed ? new Date().toISOString() : null;
  } else {
    markTaskPeriod(task, completed ? 'completed' : 'active');
  }
  task.subtasks.forEach((subtask) => setCompletedWithChildren(subtask, completed));
}

function resetTaskPeriodData(task) {
  task.completed = false;
  task.completedAt = null;
  task.completedPeriods = [];
  task.hiddenPeriods = [];
  task.canceledPeriods = [];
}

function markTaskPeriod(task, mode) {
  const periodKey = currentPeriodKey(task.recurrence);
  task.completedPeriods = task.completedPeriods.filter((key) => key !== periodKey);
  task.hiddenPeriods = task.hiddenPeriods.filter((key) => key !== periodKey);
  task.canceledPeriods = task.canceledPeriods.filter((key) => key !== periodKey);

  if (mode === 'completed') task.completedPeriods.push(periodKey);
  if (mode === 'hidden') task.hiddenPeriods.push(periodKey);
  if (mode === 'canceled') task.canceledPeriods.push(periodKey);
}

function isTaskCompleted(task) {
  if (task.recurrence === 'none') return Boolean(task.completed);
  return task.completedPeriods.includes(currentPeriodKey(task.recurrence));
}

function isTaskSuppressed(task) {
  if (task.recurrence === 'none') return false;
  const periodKey = currentPeriodKey(task.recurrence);
  return task.hiddenPeriods.includes(periodKey) || task.canceledPeriods.includes(periodKey);
}

function currentPeriodKey(recurrence) {
  const now = new Date();
  if (recurrence === 'daily') return now.toISOString().slice(0, 10);
  if (recurrence === 'weekly') {
    const temp = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const day = temp.getUTCDay() || 7;
    temp.setUTCDate(temp.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((temp - yearStart) / 86400000) + 1) / 7);
    return `${temp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }
  if (recurrence === 'monthly') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return 'single';
}

function sortedTasks(tasks) {
  const copy = [...tasks];
  if (state.sort === 'alphabetical') copy.sort((a, b) => a.title.localeCompare(b.title));
  if (state.sort === 'dueSoon') copy.sort((a, b) => dueSortKey(a) - dueSortKey(b));
  if (state.sort === 'dueLate') copy.sort((a, b) => dueSortKey(b) - dueSortKey(a));
  return copy;
}

function dueSortKey(task) {
  if (!task.dueDate) return Number.MAX_SAFE_INTEGER;
  return Number(new Date(`${task.dueDate}T00:00:00`));
}

function taskMatches(task, search) {
  const combined = `${task.title} ${task.notes || ''}`.toLowerCase();
  if (combined.includes(search)) return true;
  return task.subtasks.some((subtask) => taskMatches(subtask, search));
}

function normalizeNotesValue(value) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') return '';
  return value.trimEnd();
}

function newTask(title, dueDate = '', recurrence = 'none') {
  return {
    id: crypto.randomUUID(),
    title,
    notes: '',
    completed: false,
    completedAt: null,
    dueDate,
    recurrence,
    collapsed: !state.ui.expandAllNested,
    detailsOpen: state.ui.showAllDetails,
    archivedAt: null,
    completedPeriods: [],
    hiddenPeriods: [],
    canceledPeriods: [],
    subtasks: [],
  };
}

function activeProfile() {
  return state.profiles.find((profile) => profile.id === state.activeProfileId) || state.profiles[0];
}

function selectedParentProfile() {
  const profile = activeProfile();
  if (!profile.parentProfileId) return profile;
  return state.profiles.find((candidate) => candidate.id === profile.parentProfileId) || state.profiles[0];
}

function uniqueProfileId(name) {
  const base = slugify(name) || crypto.randomUUID();
  if (!state.profiles.some((profile) => profile.id === base)) return base;

  let n = 2;
  while (state.profiles.some((profile) => profile.id === `${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

function removeProfile(profileId) {
  const profile = state.profiles.find((candidate) => candidate.id === profileId);
  if (!profile) return;

  const isParent = !profile.parentProfileId;
  const totalParents = state.profiles.filter((candidate) => !candidate.parentProfileId).length;
  if (isParent && totalParents <= 1) {
    alert('You need at least one parent profile.');
    return;
  }

  const profilesToDelete = collectProfileIds(profileId);
  const includesActive = profilesToDelete.includes(state.activeProfileId);

  const confirmed = window.confirm(
    isParent
      ? `Delete parent profile "${profile.name}" and all nested projects?`
      : `Delete project "${profile.name}"?`,
  );
  if (!confirmed) return;

  state.profiles = state.profiles.filter((candidate) => !profilesToDelete.includes(candidate.id));

  if (includesActive) {
    const fallbackParent = state.profiles.find((candidate) => !candidate.parentProfileId);
    state.activeProfileId = fallbackParent ? fallbackParent.id : defaultState.activeProfileId;
  }

  persistAndRender();
}

function collectProfileIds(rootId) {
  const ids = [rootId];
  for (let index = 0; index < ids.length; index += 1) {
    const current = ids[index];
    state.profiles
      .filter((candidate) => candidate.parentProfileId === current)
      .forEach((candidate) => ids.push(candidate.id));
  }
  return ids;
}

function profileLineage(profile) {
  const lineage = [];
  let cursor = profile;
  while (cursor) {
    lineage.unshift(cursor);
    cursor = state.profiles.find((candidate) => candidate.id === cursor.parentProfileId);
  }
  return lineage;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function countCurrentTasks(tasks) {
  let total = 0;
  visitTasks(tasks, (task) => {
    if (!isTaskSuppressed(task)) total += 1;
  });
  return total;
}

function countCompleted(tasks) {
  let total = 0;
  visitTasks(tasks, (task) => {
    if (!isTaskSuppressed(task) && isTaskCompleted(task)) total += 1;
  });
  return total;
}

function visitTasks(tasks, callback) {
  tasks.forEach((task) => {
    callback(task);
    visitTasks(task.subtasks, callback);
  });
}

function clampNumber(value, min, max, fallback) {
  if (Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function persistAndRender() {
  saveState();
  render();
}
