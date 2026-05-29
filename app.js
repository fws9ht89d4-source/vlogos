import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://zwrmiajtmovajlacxfkg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3cm1pYWp0bW92YWpsYWN4ZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMjE0OTMsImV4cCI6MjA5NTU5NzQ5M30.dft78llLhRWgzzi0ENBCvNO0sRYCNicUZiJIufPa2-E";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const gate = document.querySelector("#gate");
const app = document.querySelector("#app");
const pageTitle = document.querySelector("#page-title");
const accessCodeInput = document.querySelector("#access-code");
const openBoardButton = document.querySelector("#open-board-button");
const message = document.querySelector("#message");
const appMessage = document.querySelector("#app-message");
const status = document.querySelector("#status");
const refreshButton = document.querySelector("#refresh-button");
const saveButton = document.querySelector("#save-button");
const newCodeButton = document.querySelector("#new-code-button");
const titleInput = document.querySelector("#title-input");
const locationInput = document.querySelector("#location-input");
const platformInput = document.querySelector("#platform-input");
const addCardButton = document.querySelector("#add-card-button");
const stageFilter = document.querySelector("#stage-filter");
const board = document.querySelector("#board");
const checklistGrid = document.querySelector("#checklist-grid");
const workflowSettings = document.querySelector("#workflow-settings");
const addStageButton = document.querySelector("#add-stage-button");
const checklistSettings = document.querySelector("#checklist-settings");
const addChecklistItemButton = document.querySelector("#add-checklist-item-button");
const layoutCompactButton = document.querySelector("#layout-compact-button");
const layoutWideButton = document.querySelector("#layout-wide-button");
const themeDarkButton = document.querySelector("#theme-dark-button");
const themeLightButton = document.querySelector("#theme-light-button");
const tabNavButtons = document.querySelectorAll(".tab-nav-button");
const pages = {
  board: document.querySelector("#board-page"),
  checklist: document.querySelector("#checklist-page"),
  settings: document.querySelector("#settings-page"),
};

const storageKey = "websights_access_code";
const boardItemKey = "vlog-board";
const defaultWorkflowColumns = [
  { id: "ideas", title: "Ideas" },
  { id: "shoot", title: "Shoot Today" },
  { id: "editing", title: "Editing" },
  { id: "posted", title: "Posted" },
];
const defaultChecklistItems = [
  { id: "battery", title: "Battery charged" },
  { id: "storage", title: "Storage clear" },
  { id: "lens", title: "Lens cleaned" },
  { id: "audio", title: "Audio tested" },
  { id: "hook", title: "Hook recorded" },
  { id: "broll", title: "B-roll captured" },
];
const pageTitles = {
  board: "Creator Board",
  checklist: "Shot Checklist",
  settings: "Settings",
};

let currentAccessCode = window.localStorage.getItem(storageKey);
let cards = [];
let workflowColumns = cloneColumns(defaultWorkflowColumns);
let checklistItems = cloneItems(defaultChecklistItems);
let checklist = {};
let layoutMode = "compact";
let themeMode = "dark";
let selectedStageId = defaultWorkflowColumns[0].id;
let noteSaveTimer = null;

function showMessage(text) {
  message.textContent = text;
}

function showStatus(text) {
  status.textContent = text;
}

function showAppMessage(text) {
  appMessage.textContent = text;
}

function formatSavedTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function cloneColumns(columnsToClone) {
  return columnsToClone.map((column) => ({ ...column }));
}

function cloneItems(itemsToClone) {
  return itemsToClone.map((item) => ({ ...item }));
}

function cleanCode(code) {
  return code.trim().toLowerCase();
}

function isValidAccessCode(code) {
  return Boolean(code) && code.length >= 4 && !code.includes("://") && !code.includes("/");
}

function openApp(accessCode) {
  currentAccessCode = accessCode;
  window.localStorage.setItem(storageKey, accessCode);
  gate.classList.add("hidden");
  app.classList.remove("hidden");
}

function openGate() {
  currentAccessCode = null;
  cards = [];
  checklist = {};
  checklistItems = cloneItems(defaultChecklistItems);
  workflowColumns = cloneColumns(defaultWorkflowColumns);
  themeMode = "dark";
  window.localStorage.removeItem(storageKey);
  board.innerHTML = "";
  app.classList.add("hidden");
  gate.classList.remove("hidden");
  showMessage("Use the same code on your iPhone and Mac.");
}

function nextColumnId(statusId) {
  const index = workflowColumns.findIndex((column) => column.id === statusId);
  return workflowColumns[Math.min(index + 1, workflowColumns.length - 1)].id;
}

function previousColumnId(statusId) {
  const index = workflowColumns.findIndex((column) => column.id === statusId);
  return workflowColumns[Math.max(index - 1, 0)].id;
}

function normalizeSelectedStage() {
  if (!workflowColumns.some((column) => column.id === selectedStageId)) {
    selectedStageId = workflowColumns[0].id;
  }
}

function renderStageFilter() {
  stageFilter.innerHTML = "";

  for (const column of workflowColumns) {
    const count = cards.filter((card) => card.status === column.id).length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "stage-chip";
    button.classList.toggle("active", column.id === selectedStageId);
    button.textContent = `${column.title} ${count}`;
    button.addEventListener("click", () => {
      selectedStageId = column.id;
      renderStageFilter();
      renderBoard();
    });
    stageFilter.appendChild(button);
  }
}

function renderBoard() {
  board.innerHTML = "";
  normalizeSelectedStage();

  const columnsToShow =
    layoutMode === "compact"
      ? workflowColumns.filter((column) => column.id === selectedStageId)
      : workflowColumns;

  for (const column of columnsToShow) {
    const columnCards = cards.filter((card) => card.status === column.id);
    const section = document.createElement("section");
    section.className = "column";

    const header = document.createElement("div");
    header.className = "column-header";

    const heading = document.createElement("h2");
    heading.textContent = column.title;

    const count = document.createElement("span");
    count.className = "count";
    count.textContent = columnCards.length;

    header.append(heading, count);
    section.appendChild(header);

    if (columnCards.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent =
        column.id === workflowColumns[0].id ? "Add your next vlog idea." : "Nothing here yet.";
      section.appendChild(empty);
    }

    for (const card of columnCards) {
      section.appendChild(renderCard(card));
    }

    board.appendChild(section);
  }

  renderStageFilter();
}

function renderCard(card) {
  const article = document.createElement("article");
  article.className = "card";
  if (layoutMode === "compact") {
    article.classList.add("compact-card");
  }

  const title = document.createElement("h3");
  title.textContent = card.title;

  const meta = document.createElement("div");
  meta.className = "card-meta";

  const platformPill = document.createElement("span");
  platformPill.className = "pill";
  platformPill.textContent = card.platform;

  const locationPill = document.createElement("span");
  locationPill.className = "pill";
  locationPill.textContent = card.location || "No location";

  meta.append(platformPill, locationPill);

  const notes = document.createElement("textarea");
  notes.placeholder = "Hook, shots, edit notes...";
  notes.value = card.notes || "";
  notes.addEventListener("input", () => {
    card.notes = notes.value;
    card.updatedAt = new Date().toISOString();
    scheduleNoteSave();
  });

  const time = document.createElement("p");
  time.className = "card-time";
  time.textContent = card.updatedAt
    ? `Updated ${new Date(card.updatedAt).toLocaleDateString([], {
        month: "short",
        day: "numeric",
      })}`
    : "New idea";

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const backButton = document.createElement("button");
  backButton.className = "secondary";
  backButton.textContent = "Back";
  backButton.disabled = card.status === workflowColumns[0].id;
  backButton.addEventListener("click", () => moveCard(card.id, previousColumnId(card.status)));

  const nextButton = document.createElement("button");
  const lastColumnId = workflowColumns[workflowColumns.length - 1].id;
  nextButton.textContent = card.status === lastColumnId ? "Done" : "Next";
  nextButton.disabled = card.status === lastColumnId;
  nextButton.addEventListener("click", () => moveCard(card.id, nextColumnId(card.status)));

  const deleteButton = document.createElement("button");
  deleteButton.className = "secondary danger";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteCard(card.id));

  actions.append(backButton, nextButton, deleteButton);
  article.append(title, meta, notes, time, actions);
  return article;
}

function renderChecklist() {
  checklistGrid.innerHTML = "";

  for (const item of checklistItems) {
    const label = document.createElement("label");
    label.className = "check-card";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(checklist[item.id]);
    input.addEventListener("change", () => {
      checklist[item.id] = input.checked;
      saveBoard({ quiet: true });
    });

    const text = document.createElement("span");
    text.textContent = item.title;

    label.append(input, text);
    checklistGrid.appendChild(label);
  }
}

function renderSettings() {
  workflowSettings.innerHTML = "";
  checklistSettings.innerHTML = "";
  layoutCompactButton.classList.toggle("active", layoutMode === "compact");
  layoutWideButton.classList.toggle("active", layoutMode === "wide");
  themeDarkButton.classList.toggle("active", themeMode === "dark");
  themeLightButton.classList.toggle("active", themeMode === "light");

  workflowColumns.forEach((column, index) => {
    const row = document.createElement("div");
    row.className = "stage-row";

    const input = document.createElement("input");
    input.value = column.title;
    input.ariaLabel = "Stage title";
    input.addEventListener("input", () => {
      column.title = input.value.trim() || "Untitled";
      renderBoard();
      saveBoard({ quiet: true });
    });

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.className = "secondary";
    upButton.textContent = "Up";
    upButton.disabled = index === 0;
    upButton.addEventListener("click", () => moveStage(index, index - 1));

    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.className = "secondary";
    downButton.textContent = "Down";
    downButton.disabled = index === workflowColumns.length - 1;
    downButton.addEventListener("click", () => moveStage(index, index + 1));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "secondary danger";
    deleteButton.textContent = "Delete";
    deleteButton.disabled = workflowColumns.length <= 2;
    deleteButton.addEventListener("click", () => deleteStage(column.id));

    row.append(input, upButton, downButton, deleteButton);
    workflowSettings.appendChild(row);
  });

  checklistItems.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "stage-row";

    const input = document.createElement("input");
    input.value = item.title;
    input.ariaLabel = "Checklist item title";
    input.addEventListener("input", () => {
      item.title = input.value.trim() || "Untitled";
      renderChecklist();
      saveBoard({ quiet: true });
    });

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.className = "secondary";
    upButton.textContent = "Up";
    upButton.disabled = index === 0;
    upButton.addEventListener("click", () => moveChecklistItem(index, index - 1));

    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.className = "secondary";
    downButton.textContent = "Down";
    downButton.disabled = index === checklistItems.length - 1;
    downButton.addEventListener("click", () => moveChecklistItem(index, index + 1));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "secondary danger";
    deleteButton.textContent = "Delete";
    deleteButton.disabled = checklistItems.length <= 1;
    deleteButton.addEventListener("click", () => deleteChecklistItem(item.id));

    row.append(input, upButton, downButton, deleteButton);
    checklistSettings.appendChild(row);
  });
}

function moveStage(fromIndex, toIndex) {
  const [stage] = workflowColumns.splice(fromIndex, 1);
  workflowColumns.splice(toIndex, 0, stage);
  renderSettings();
  renderBoard();
  saveBoard();
}

function deleteStage(stageId) {
  const fallbackId = workflowColumns.find((column) => column.id !== stageId)?.id;
  workflowColumns = workflowColumns.filter((column) => column.id !== stageId);
  selectedStageId = fallbackId;

  cards = cards.map((card) =>
    card.status === stageId ? { ...card, status: fallbackId } : card
  );

  renderSettings();
  renderBoard();
  saveBoard();
}

function addStage() {
  const id = `stage-${crypto.randomUUID().slice(0, 8)}`;
  workflowColumns.push({ id, title: "New Stage" });
  selectedStageId = id;
  renderSettings();
  renderBoard();
  saveBoard();
}

function moveChecklistItem(fromIndex, toIndex) {
  const [item] = checklistItems.splice(fromIndex, 1);
  checklistItems.splice(toIndex, 0, item);
  renderSettings();
  renderChecklist();
  saveBoard();
}

function deleteChecklistItem(itemId) {
  checklistItems = checklistItems.filter((item) => item.id !== itemId);
  delete checklist[itemId];
  renderSettings();
  renderChecklist();
  saveBoard();
}

function addChecklistItem() {
  const id = `check-${crypto.randomUUID().slice(0, 8)}`;
  checklistItems.push({ id, title: "New checklist item" });
  renderSettings();
  renderChecklist();
  saveBoard();
}

function setLayoutMode(mode, shouldSave = true) {
  layoutMode = mode;
  app.classList.toggle("layout-compact", mode === "compact");
  app.classList.toggle("layout-wide", mode === "wide");
  renderSettings();
  renderBoard();

  if (shouldSave) {
    saveBoard({ quiet: true });
  }
}

function setThemeMode(mode, shouldSave = true) {
  themeMode = mode;
  document.body.classList.toggle("theme-light", mode === "light");
  renderSettings();

  if (shouldSave) {
    saveBoard({ quiet: true });
  }
}

function setPage(pageName) {
  for (const [name, page] of Object.entries(pages)) {
    page.classList.toggle("active-page", name === pageName);
  }

  for (const button of tabNavButtons) {
    button.classList.toggle("active", button.dataset.page === pageName);
  }

  pageTitle.textContent = pageTitles[pageName];
  if (pageName === "checklist") {
    renderChecklist();
  }
  if (pageName === "settings") {
    renderSettings();
  }
  showAppMessage(
    pageName === "board"
      ? "Add a vlog idea, then move it through your workflow."
      : pageName === "checklist"
        ? "Use this before filming so the simple stuff does not trip you up."
        : "Customize your workflow stages and save the setup."
  );
}

function scheduleNoteSave() {
  window.clearTimeout(noteSaveTimer);
  noteSaveTimer = window.setTimeout(() => saveBoard({ quiet: true }), 600);
}

function addCard() {
  const title = titleInput.value.trim();

  if (!title) {
    showAppMessage("Give the vlog idea a title first.");
    return;
  }

  cards.unshift({
    id: crypto.randomUUID(),
    title,
    location: locationInput.value.trim(),
    platform: platformInput.value,
    notes: "",
    status: workflowColumns[0].id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  titleInput.value = "";
  locationInput.value = "";
  selectedStageId = workflowColumns[0].id;
  renderBoard();
  saveBoard();
}

function moveCard(cardId, statusId) {
  const card = cards.find((candidate) => candidate.id === cardId);
  if (!card) return;

  card.status = statusId;
  card.updatedAt = new Date().toISOString();
  selectedStageId = statusId;
  renderBoard();
  saveBoard({ quiet: true });
}

function deleteCard(cardId) {
  cards = cards.filter((candidate) => candidate.id !== cardId);
  renderBoard();
  saveBoard();
}

async function loadBoard() {
  const { data, error } = await supabase
    .from("progress_by_code")
    .select("value")
    .eq("access_code", currentAccessCode)
    .eq("item_key", boardItemKey)
    .maybeSingle();

  if (error) {
    showStatus("Load failed");
    showAppMessage(`Board could not load: ${error.message}`);
    return;
  }

  workflowColumns = Array.isArray(data?.value?.columns)
    ? data.value.columns
    : cloneColumns(defaultWorkflowColumns);
  checklist = data?.value?.checklist || {};
  checklistItems = Array.isArray(data?.value?.checklistItems)
    ? data.value.checklistItems
    : cloneItems(defaultChecklistItems);
  layoutMode = data?.value?.layoutMode === "wide" ? "wide" : "compact";
  themeMode = data?.value?.themeMode === "light" ? "light" : "dark";
  cards = Array.isArray(data?.value?.cards) ? data.value.cards : [];
  selectedStageId = workflowColumns[0].id;
  cards = cards.map((card) =>
    workflowColumns.some((column) => column.id === card.status)
      ? card
      : { ...card, status: workflowColumns[0].id }
  );
  renderBoard();
  renderSettings();
  renderChecklist();
  setLayoutMode(layoutMode, false);
  setThemeMode(themeMode, false);
  showStatus(cards.length ? "Board loaded" : "Empty board");
  showAppMessage(`Opened board for code: ${currentAccessCode}`);
}

async function saveBoard({ quiet = false } = {}) {
  if (!currentAccessCode) return;

  const { error } = await supabase
    .from("progress_by_code")
    .upsert(
      {
        access_code: currentAccessCode,
        item_key: boardItemKey,
        value: {
          cards,
          columns: workflowColumns,
          checklist,
          checklistItems,
          layoutMode,
          themeMode,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "access_code,item_key" }
    );

  if (error) {
    showStatus("Save failed");
    showAppMessage(`Save failed: ${error.message}`);
    return;
  }

  showStatus(quiet ? `Saved ${formatSavedTime()}` : "Board saved");
  showAppMessage("Saved to Supabase. Open the same code on another device.");
}

async function handleOpenBoard() {
  const accessCode = cleanCode(accessCodeInput.value);

  if (!isValidAccessCode(accessCode)) {
    showMessage("Use an access code with at least 4 characters.");
    return;
  }

  openApp(accessCode);
  await loadBoard();
}

openBoardButton.addEventListener("click", handleOpenBoard);
accessCodeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleOpenBoard();
  }
});

addCardButton.addEventListener("click", addCard);
titleInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addCard();
  }
});
for (const button of tabNavButtons) {
  button.addEventListener("click", () => setPage(button.dataset.page));
}
addStageButton.addEventListener("click", addStage);
addChecklistItemButton.addEventListener("click", addChecklistItem);
layoutCompactButton.addEventListener("click", () => setLayoutMode("compact"));
layoutWideButton.addEventListener("click", () => setLayoutMode("wide"));
themeDarkButton.addEventListener("click", () => setThemeMode("dark"));
themeLightButton.addEventListener("click", () => setThemeMode("light"));
refreshButton.addEventListener("click", loadBoard);
saveButton.addEventListener("click", () => saveBoard());
newCodeButton.addEventListener("click", openGate);

if (isValidAccessCode(currentAccessCode)) {
  openApp(currentAccessCode);
  await loadBoard();
} else {
  openGate();
}
