// ============================================================
//  § 1 — STATIC DATA
// ============================================================
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const CATEGORY_COLORS = {
  Meat:"#ff8a80",Seafood:"#80d8ff",Produce:"#b9f6ca",
  Dairy:"#fff9c4",Pantry:"#c5cae9",Bakery:"#ffe0b2",Other:"#f3e5f5"
};
// END § 1


// ============================================================
//  § 2 — RECIPES DATA
// ============================================================
const RECIPES = {};
// END § 2


// ============================================================
//  § 3 — STATE VARIABLES
// ============================================================
const today = new Date();
let currentYear  = today.getFullYear();
let currentMonth = today.getMonth();
let selectedDay  = null;
let plannedMeals = JSON.parse(localStorage.getItem('mealplanner_meals') || '{}');
let groceryList  = [];
let currentSuggestion    = null;
let highlightedDayOfWeek = null;
const weekDates = [];
// END § 3


// ============================================================
//  § 4 — NAVIGATION
// ============================================================

// -- BEGIN: goToPlanner --
function goToPlanner() { renderCalendar(); }
// -- END: goToPlanner --

// -- BEGIN: goToPlannerAndGrocery --
function goToPlannerAndGrocery() { goToPlanner(); setTimeout(openGrocery, 300); }
// -- END: goToPlannerAndGrocery --

// -- BEGIN: goHome --
function goHome() { resetFlow(); }
// -- END: goHome --

// END § 4


// ============================================================
//  § 5 — STEP TRACKER
// ============================================================

// -- BEGIN: updateStepTracker --
function updateStepTracker(activeStep) {
  for (let i = 1; i <= 3; i++) {
    const node = document.getElementById('mp-tracker-' + i);
    if (!node) continue;
    node.classList.remove('active', 'done');
    if (i < activeStep)        node.classList.add('done');
    else if (i === activeStep) node.classList.add('active');
  }
  for (let i = 1; i <= 2; i++) {
    const conn = document.getElementById('mp-connector-' + i);
    if (!conn) continue;
    conn.classList.toggle('done', i < activeStep);
  }
}
// -- END: updateStepTracker --

// END § 5


// ============================================================
//  § 6 — CALENDAR
// ============================================================

// -- BEGIN: renderCalendar --
function renderCalendar() {
  const grid = document.getElementById('calGrid');
  document.getElementById('monthName').textContent = MONTHS[currentMonth];
  document.getElementById('yearLabel').textContent = currentYear;
  grid.innerHTML = '';
  const firstDay    = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(document.createElement('div'));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    const key = cellKey(d);
    if (d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) cell.classList.add('tod');
    if (selectedDay === d) cell.classList.add('sel');
    if (plannedMeals[key]) cell.classList.add('has');
    const dow = new Date(currentYear, currentMonth, d).getDay();
    if (highlightedDayOfWeek !== null && dow === highlightedDayOfWeek) cell.classList.add('mp-col-highlight');
    const num = document.createElement('span');
    num.textContent = d;
    cell.appendChild(num);
    if (plannedMeals[key]) {
      const em = document.createElement('span');
      em.className = 'meal-emoji';
      em.textContent = RECIPES[plannedMeals[key]]?.emoji || '🍽';
      cell.appendChild(em);
    }
    cell.onclick = () => selectDate(d);
    grid.appendChild(cell);
  }
}
// -- END: renderCalendar --

// -- BEGIN: cellKey --
function cellKey(d) { return `${currentYear}-${currentMonth}-${d}`; }
// -- END: cellKey --

// -- BEGIN: prevMonth --
function prevMonth() {
  if (currentMonth === 0) { currentMonth = 11; currentYear--; } else currentMonth--;
  renderCalendar();
}
// -- END: prevMonth --

// -- BEGIN: nextMonth --
function nextMonth() {
  if (currentMonth === 11) { currentMonth = 0; currentYear++; } else currentMonth++;
  renderCalendar();
}
// -- END: nextMonth --

// END § 6


// ============================================================
//  § 7 — FLOW: STEP 1 → STEP 2 → STEP 3
// ============================================================

// -- BEGIN: resetFlow --
function resetFlow() {
  selectedDay = null;
  highlightedDayOfWeek = null;
  currentSuggestion = null;
  for (let j = 0; j < 7; j++) {
    const cell = document.getElementById('mp-strip-cell-' + j);
    if (cell) cell.classList.remove('mp-strip-selected');
    const pmRow = document.getElementById('pm-row-' + j);
    if (pmRow) pmRow.classList.remove('pm-row-highlight');
  }
  // Divider 1
  document.getElementById('divider-1').innerHTML =
    '<span class="d1-step-label">Step 1 — Pick a Day</span>' +
    'Pick a day of the week from the options below.';
  // Divider 2
  document.getElementById('mp-week-strip').style.display   = 'grid';
  document.getElementById('d2-pick-date').style.display    = 'none';
  document.getElementById('d2-pick-recipe').style.display  = 'none';
  document.getElementById('favoritesPanel').style.display  = 'none';
  document.getElementById('buildPanel').style.display      = 'none';
  updateStepTracker(1);
  renderCalendar();
}
// -- END: resetFlow --

// -- BEGIN: selectStripDay --
// STEP 1 — user taps a day in the 7 day strip
function selectStripDay(i, dayName) {
  highlightedDayOfWeek = i;

  // Highlight selected strip cell, clear others
  for (let j = 0; j < 7; j++) {
    document.getElementById('mp-strip-cell-' + j).classList.toggle('mp-strip-selected', j === i);
  }

  // Highlight matching planned meals row, clear others
  for (let j = 0; j < 7; j++) {
    const pmRow = document.getElementById('pm-row-' + j);
    if (pmRow) pmRow.classList.toggle('pm-row-highlight', j === i);
  }

  // Check if that day has a meal planned
  const weekDate = weekDates[i];
  const hasMeal  = weekDate
    ? !!plannedMeals[weekDate.year + '-' + weekDate.month + '-' + weekDate.date]
    : false;

  if (!hasMeal) {
    // Show no-meal popup
    showNoMealPopup(dayName, i);
    return;
  }

  // Has a meal — proceed to step 2 flow
  continueStepFlow(dayName);
}
// -- END: selectStripDay --

// -- BEGIN: continueStepFlow --
function continueStepFlow(dayName) {
  // Divider 1
  document.getElementById('divider-1').innerHTML =
    '<span class="d1-step-label">Step 2 — Pick a Date</span>' +
    '<span class="d1-confirm">You chose ' + dayName + '</span>';
  // Divider 2
  document.getElementById('mp-week-strip').style.display  = 'none';
  document.getElementById('d2-pick-date').style.display   = 'block';
  document.getElementById('d2-pick-recipe').style.display = 'none';
  selectedDay = null;
  updateStepTracker(2);
  renderCalendar();
  document.getElementById('mp-calendar').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
// -- END: continueStepFlow --

// -- BEGIN: showNoMealPopup --
function showNoMealPopup(dayName, stripIndex) {
  // Remove existing popup if any
  const existing = document.getElementById('mp-no-meal-popup');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'mp-no-meal-popup';
  overlay.innerHTML =
    '<div class="popup-box">' +
      '<div class="popup-title">Planned Meals</div>' +
      '<div class="popup-msg">Nothing is planned for ' + dayName + '.<br>Would you like to plan a meal?</div>' +
      '<div class="popup-btns">' +
        '<button class="popup-yes" onclick="closeNoMealPopup(); continueStepFlow(\'' + dayName + '\');">Yes — Plan a Meal</button>' +
        '<button class="popup-no"  onclick="closeNoMealPopup();">No</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}
// -- END: showNoMealPopup --

// -- BEGIN: closeNoMealPopup --
function closeNoMealPopup() {
  const popup = document.getElementById('mp-no-meal-popup');
  if (popup) popup.remove();
}
// -- END: closeNoMealPopup --

// -- BEGIN: selectDate --
// STEP 2 — user taps a date from the calendar
function selectDate(d) {
  if (highlightedDayOfWeek === null) return;
  selectedDay = d;
  highlightedDayOfWeek = null;
  currentSuggestion = null;
  const dow      = new Date(currentYear, currentMonth, d).getDay();
  const fullDate = DAYS[dow] + ', ' + MONTHS[currentMonth] + ' ' + d;
  // Divider 1
  document.getElementById('divider-1').innerHTML =
    '<span class="d1-step-label">Step 3 — Pick a Recipe</span>' +
    '<span class="d1-confirm">You chose ' + fullDate + '</span>';
  // Divider 2
  document.getElementById('d2-pick-date').style.display   = 'none';
  document.getElementById('d2-pick-recipe').style.display = 'block';
  updateStepTracker(3);
  renderCalendar();
  // Scroll to top so step tracker is fully visible
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
// -- END: selectDate --

// END § 7


// ============================================================
//  § 8 — PLANNED MEALS
// ============================================================

// -- BEGIN: planMeal --
function planMeal(name) {
  if (!selectedDay) return;
  plannedMeals[cellKey(selectedDay)] = name;
  localStorage.setItem('mealplanner_meals', JSON.stringify(plannedMeals));
  selectedDay = null;
  currentSuggestion = null;
  resetFlow();
  renderPlannedMeals();
  renderWeeklySummary();
  updateHomeStats();
  closeRecipeModal();
  showToast('✓ Meal planned!');
}
// -- END: planMeal --

// -- BEGIN: renderPlannedMeals --
function renderPlannedMeals() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    const key      = day.getFullYear() + '-' + day.getMonth() + '-' + day.getDate();
    const mealName = plannedMeals[key] || '';
    const dateEl   = document.getElementById('pm-date-' + i);
    const recipeEl = document.getElementById('pm-recipe-' + i);
    if (!dateEl || !recipeEl) continue;
    // Set the date
    dateEl.textContent = MONTHS[day.getMonth()] + ' ' + day.getDate();
    // Set the recipe or clear it
    if (mealName) {
      recipeEl.textContent = mealName;
      recipeEl.onclick = (function(name) {
        return function() { openRecipe(name); };
      })(mealName);
      recipeEl.style.cursor = 'pointer';
    } else {
      recipeEl.textContent = '';
      recipeEl.onclick = null;
      recipeEl.style.cursor = 'default';
    }
  }
}
// -- END: renderPlannedMeals --

// -- BEGIN: deleteMeal --
function deleteMeal(key) {
  delete plannedMeals[key];
  localStorage.setItem('mealplanner_meals', JSON.stringify(plannedMeals));
  renderCalendar(); renderPlannedMeals(); renderWeeklySummary(); updateHomeStats();
}
// -- END: deleteMeal --

// -- BEGIN: addAllPlannedToGrocery --
function addAllPlannedToGrocery() {
  Object.values(plannedMeals).forEach(m => addAllIngredients(m));
}
// -- END: addAllPlannedToGrocery --

// -- BEGIN: renderWeeklySummary --
function renderWeeklySummary() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  weekDates.length = 0;
  let mealCount = 0;
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weekDates.push({ year: day.getFullYear(), month: day.getMonth(), date: day.getDate() });
    const key      = day.getFullYear() + '-' + day.getMonth() + '-' + day.getDate();
    const mealName = plannedMeals[key];
    if (mealName) mealCount++;
    // Hidden week-box (for syncWeekStrip)
    document.getElementById('day-date-' + i).textContent = day.getDate();
    const mealEl = document.getElementById('day-meal-' + i);
    if (mealName) {
      mealEl.textContent = (RECIPES[mealName]?.emoji || '🍽') + ' ' + mealName;
      mealEl.className = 'week-meal';
    } else {
      mealEl.textContent = '';
      mealEl.className = 'week-empty';
    }
    // Strip date
    const stripDateEl = document.getElementById('mp-strip-date-' + i);
    if (stripDateEl) stripDateEl.textContent = day.getDate();
  }
  document.getElementById('weeklyMealCount').textContent = mealCount === 0
    ? 'No meals planned for this week.'
    : mealCount + ' meal' + (mealCount > 1 ? 's' : '') + ' planned this week.';
  syncWeekStrip();
}
// -- END: renderWeeklySummary --

// -- BEGIN: syncWeekStrip --
function syncWeekStrip() {
  for (let i = 0; i < 7; i++) {
    const mealEl = document.getElementById('day-meal-' + i);
    const dotEl  = document.getElementById('mp-dot-' + i);
    const nameEl = document.getElementById('mp-meal-name-' + i);
    if (!mealEl || !dotEl || !nameEl) continue;
    const text    = mealEl.textContent.trim();
    const isEmpty = (text === '');
    dotEl.classList.toggle('mp-has-meal', !isEmpty);
    nameEl.classList.toggle('mp-has-meal', !isEmpty);
    nameEl.textContent = isEmpty ? '' : text;
  }
}
// -- END: syncWeekStrip --

// END § 8


// ============================================================
//  § 9 — COOKBOOK CATEGORIES
// ============================================================
const COOKBOOK_CATEGORIES = [
  { name: "Beverages",       emoji: "🥤", file: "beverages_menu.html"       },
  { name: "Beans & Legumes", emoji: "🫘", file: "beans_menu.html"           },
  { name: "Breads & Grains", emoji: "🍞", file: "breads_menu.html"          },
  { name: "Candy",           emoji: "🍬", file: "candy_menu.html"           },
  { name: "Desserts",        emoji: "🍰", file: "desserts_menu.html"        },
  { name: "Meats",           emoji: "🥩", file: "meats_menu.html"           },
  { name: "Pastas",          emoji: "🍝", file: "pastas_menu.html"          },
  { name: "Salads",          emoji: "🥗", file: "salads_menu.html"          },
  { name: "Soups & Stews",   emoji: "🍲", file: "soups_and_stews_menu.html" },
  { name: "Side Dishes",     emoji: "🥘", file: "sides_menu.html"           },
];
// END § 9


// ============================================================
//  § 10 — RECIPE MODAL
// ============================================================

// -- BEGIN: openRecipe --
function openRecipe(name) {
  const r = RECIPES[name];
  if (!r) return;
  const safeName = name.replace(/'/g, "\\'");
  let ingHTML = r.ingredients.map(ing => {
    const color   = CATEGORY_COLORS[ing.category] || '#c5cae9';
    const added   = groceryList.some(g => g.name.toLowerCase() === ing.name.toLowerCase());
    const safeIng = JSON.stringify(ing).replace(/'/g, "\\'");
    return `<div class="ing-row" style="background:${color}0e">
      <div class="ing-left">
        <div class="ing-dot" style="background:${color}"></div>
        <span class="ing-name">${ing.name}</span>
      </div>
      <div class="ing-right">
        <span class="ing-qty">${ing.qty}</span>
        <button class="aib ${added ? 'done' : ''}" id="aib-${ing.name.replace(/\s/g,'_')}" onclick="${added ? '' : `addOneIngredient(${safeIng},'${safeName}',this)`}">${added ? '✓ Added' : '+ List'}</button>
      </div>
    </div>`;
  }).join('');
  let stepsHTML = r.steps.map((s, i) => `
    <div class="step-row">
      <div class="step-circle">${i+1}</div>
      <div class="step-text">${s}</div>
    </div>`).join('');
  let planCTA = selectedDay ? `
    <div class="plan-cta">
      <span class="plan-cta-text">Plan this for <strong style="color:#7ec8ff">${MONTHS[currentMonth]} ${selectedDay}</strong>?</span>
      <button class="pb" onclick="planMeal('${safeName}')">✓ Add to Calendar</button>
    </div>` : '';
  document.getElementById('recipeModalInner').innerHTML = `
    <div class="modal-body">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px">
        <div>
          <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:4px;color:#4a9fff;text-transform:uppercase;margin-bottom:6px">Recipe Detail</div>
          <h2 class="modal-rec-title">${r.emoji} ${name}</h2>
          <div class="modal-meta"><span>⏱ ${r.time}</span><span>👤 Serves ${r.servings}</span></div>
        </div>
        <button class="bb" onclick="closeRecipeModal()">✕ Close</button>
      </div>
      <p class="modal-desc">${r.description}</p>
      <button class="gb" style="width:100%;padding:12px;margin-bottom:22px" onclick="addAllIngredients('${safeName}')">🛒 Add All Ingredients to Grocery List</button>
      <div class="section-title">Ingredients</div>
      ${ingHTML}
      <div class="section-title" style="margin-top:22px">Instructions</div>
      ${stepsHTML}
      ${planCTA}
    </div>`;
  document.getElementById('recipeModal').classList.add('open');
}
// -- END: openRecipe --

// -- BEGIN: closeRecipeModal --
function closeRecipeModal() {
  document.getElementById('recipeModal').classList.remove('open');
}
// -- END: closeRecipeModal --

// END § 10


// ============================================================
//  § 11 — GROCERY LIST
// ============================================================

// -- BEGIN: addAllIngredients --
function addAllIngredients(mealName) {
  const r = RECIPES[mealName];
  if (!r) return;
  let added = 0;
  r.ingredients.forEach(ing => {
    if (!groceryList.some(g => g.name.toLowerCase() === ing.name.toLowerCase())) {
      groceryList.push({ ...ing, checked: false, fromMeal: mealName });
      added++;
    }
  });
  showToast(added > 0 ? `✓ ${added} items added from ${mealName}` : 'All items already in list');
  renderGrocery(); updateHomeStats();
}
// -- END: addAllIngredients --

// -- BEGIN: addOneIngredient --
function addOneIngredient(ing, mealName, btn) {
  if (groceryList.some(g => g.name.toLowerCase() === ing.name.toLowerCase())) return;
  groceryList.push({ ...ing, checked: false, fromMeal: mealName });
  if (btn) { btn.textContent = '✓ Added'; btn.classList.add('done'); }
  showToast(`✓ ${ing.name} added`);
  renderGrocery(); updateHomeStats();
}
// -- END: addOneIngredient --

// -- BEGIN: renderGrocery --
function renderGrocery() {
  const container = document.getElementById('groceryItems');
  const unchecked = groceryList.filter(i => !i.checked).length;
  document.getElementById('groceryCount').textContent = `${unchecked} item${unchecked !== 1 ? 's' : ''} remaining`;
  const badge = document.getElementById('groceryBadge');
  if (unchecked > 0) { badge.style.display = 'flex'; badge.textContent = unchecked; } else { badge.style.display = 'none'; }
  if (groceryList.length === 0) {
    container.innerHTML = '<div class="grocery-empty"><div class="big">🧺</div><div style="font-size:17px">Your list is empty.</div><div style="font-family:\'Josefin Sans\',sans-serif;font-size:9px;letter-spacing:2px;margin-top:6px;text-transform:uppercase">Open a recipe to add ingredients.</div></div>';
    return;
  }
  const grouped = {};
  groceryList.forEach((item, idx) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push({ ...item, idx });
  });
  container.innerHTML = '';
  Object.entries(grouped).forEach(([cat, items]) => {
    const catDiv = document.createElement('div');
    catDiv.style.marginBottom = '18px';
    catDiv.innerHTML = `<div class="cat-label"><span class="cat-dot" style="background:${CATEGORY_COLORS[cat]||'#c5cae9'}"></span>${cat}</div>`;
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = `grocery-item ${item.checked ? 'checked' : ''}`;
      row.innerHTML = `
        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${item.idx})">
        <span class="grocery-item-name">${item.name}</span>
        <span class="grocery-item-qty">${item.qty}</span>
        <button class="grocery-remove" onclick="removeItem(${item.idx})">✕</button>`;
      catDiv.appendChild(row);
    });
    container.appendChild(catDiv);
  });
}
// -- END: renderGrocery --

// -- BEGIN: toggleItem --
function toggleItem(idx) { groceryList[idx].checked = !groceryList[idx].checked; renderGrocery(); }
// -- END: toggleItem --

// -- BEGIN: removeItem --
function removeItem(idx) { groceryList.splice(idx, 1); renderGrocery(); }
// -- END: removeItem --

// -- BEGIN: removeChecked --
function removeChecked() { groceryList = groceryList.filter(i => !i.checked); renderGrocery(); }
// -- END: removeChecked --

// -- BEGIN: clearGrocery --
function clearGrocery() { groceryList = []; renderGrocery(); }
// -- END: clearGrocery --

// -- BEGIN: openGrocery --
function openGrocery()  { document.getElementById('groceryPanel').classList.add('open'); }
// -- END: openGrocery --

// -- BEGIN: closeGrocery --
function closeGrocery() { document.getElementById('groceryPanel').classList.remove('open'); }
// -- END: closeGrocery --

// END § 11


// ============================================================
//  § 12 — TOAST NOTIFICATION
// ============================================================

// -- BEGIN: showToast --
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
// -- END: showToast --

// END § 12


// ============================================================
//  § 13 — STATS
// ============================================================

// -- BEGIN: updateHomeStats --
function updateHomeStats() {}
// -- END: updateHomeStats --

// END § 13


// ============================================================
//  § 14 — CUSTOM RECIPES & FAVORITES
// ============================================================
let customRecipes = [];

// -- BEGIN: showFavorites --
function showFavorites() {
  document.getElementById('d2-pick-recipe').style.display = 'none';
  document.getElementById('favoritesPanel').style.display = 'block';
  document.getElementById('buildPanel').style.display     = 'none';
  const grid = document.getElementById('favoritesGrid');
  if (customRecipes.length === 0) {
    grid.innerHTML = '<div style="text-align:center;padding:30px 0;font-size:16px;color:rgba(160,196,255,0.35)">No saved recipes yet.<br><span style="font-family:\'Josefin Sans\',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase">Build a recipe to add it here.</span></div>';
    return;
  }
  grid.innerHTML = '';
  customRecipes.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'rc';
    div.style.borderColor = 'rgba(255,200,80,0.2)';
    div.innerHTML = `
      <div style="font-size:18px;color:#d0e4ff;margin-bottom:5px">⭐ ${r.name}</div>
      <div style="font-size:13px;color:rgba(160,196,255,0.35);margin-bottom:10px;line-height:1.4">${r.description.slice(0,65)}…</div>
      <div style="display:flex;gap:7px">
        <button class="goldbtn" style="padding:7px 12px;font-size:9px;flex:1" onclick="selectCustomRecipe(${i})">Select</button>
        <button class="nb"      style="padding:7px 12px;font-size:9px"        onclick="viewCustomRecipe(${i})">Details</button>
      </div>`;
    grid.appendChild(div);
  });
}
// -- END: showFavorites --

// -- BEGIN: hideFavorites --
function hideFavorites() {
  document.getElementById('favoritesPanel').style.display = 'none';
  document.getElementById('d2-pick-recipe').style.display = 'block';
}
// -- END: hideFavorites --

// -- BEGIN: selectCustomRecipe --
function selectCustomRecipe(i) {
  const r = customRecipes[i];
  RECIPES[r.name] = r;
  planMeal(r.name);
}
// -- END: selectCustomRecipe --

// -- BEGIN: viewCustomRecipe --
function viewCustomRecipe(i) {
  const r = customRecipes[i];
  RECIPES[r.name] = r;
  openRecipe(r.name);
}
// -- END: viewCustomRecipe --

// -- BEGIN: showBuildForm --
function showBuildForm() {
  document.getElementById('d2-pick-recipe').style.display = 'none';
  document.getElementById('favoritesPanel').style.display = 'none';
  document.getElementById('buildPanel').style.display     = 'block';
  document.getElementById('buildName').value = '';
  document.getElementById('buildDesc').value = '';
  document.getElementById('buildIngRows').innerHTML = '';
  document.getElementById('buildStepRows').innerHTML = '';
  addIngRow(); addIngRow(); addStepRow(); addStepRow();
}
// -- END: showBuildForm --

// -- BEGIN: hideBuildForm --
function hideBuildForm() {
  document.getElementById('buildPanel').style.display     = 'none';
  document.getElementById('d2-pick-recipe').style.display = 'block';
}
// -- END: hideBuildForm --

let ingRowCount  = 0;
let stepRowCount = 0;

// -- BEGIN: addIngRow --
function addIngRow() {
  ingRowCount++;
  const id  = ingRowCount;
  const num = document.getElementById('buildIngRows').children.length + 1;
  const row = document.createElement('div');
  row.className = 'ing-build-row';
  row.id = `ing-row-${id}`;
  row.innerHTML = `
    <div class="ing-num">${num}</div>
    <input class="ing-name-in" type="text" placeholder="Ingredient name" />
    <input class="ing-qty-in"  type="text" placeholder="Qty" />
    <button class="row-del" onclick="document.getElementById('ing-row-${id}').remove();renumberIngs()">✕</button>`;
  document.getElementById('buildIngRows').appendChild(row);
}
// -- END: addIngRow --

// -- BEGIN: addStepRow --
function addStepRow() {
  stepRowCount++;
  const id  = stepRowCount;
  const num = document.getElementById('buildStepRows').children.length + 1;
  const row = document.createElement('div');
  row.className = 'step-build-row';
  row.id = `step-row-${id}`;
  row.innerHTML = `
    <div class="step-num">${num}</div>
    <textarea placeholder="Describe this step…"></textarea>
    <button class="row-del" onclick="document.getElementById('step-row-${id}').remove();renumberSteps()">✕</button>`;
  document.getElementById('buildStepRows').appendChild(row);
}
// -- END: addStepRow --

// -- BEGIN: renumberSteps --
function renumberSteps() {
  document.getElementById('buildStepRows').querySelectorAll('.step-build-row').forEach((row, i) => {
    const el = row.querySelector('.step-num'); if (el) el.textContent = i + 1;
  });
}
// -- END: renumberSteps --

// -- BEGIN: renumberIngs --
function renumberIngs() {
  document.getElementById('buildIngRows').querySelectorAll('.ing-build-row').forEach((row, i) => {
    const el = row.querySelector('.ing-num'); if (el) el.textContent = i + 1;
  });
}
// -- END: renumberIngs --

// -- BEGIN: saveCustomRecipe --
function saveCustomRecipe() {
  const name = document.getElementById('buildName').value.trim();
  const desc = document.getElementById('buildDesc').value.trim();
  if (!name) { showToast('Please enter a recipe name'); return; }
  const ingredients = [];
  document.getElementById('buildIngRows').querySelectorAll('.ing-build-row').forEach(row => {
    const inputs = row.querySelectorAll('input');
    const n = inputs[0]?.value.trim();
    const q = inputs[1]?.value.trim();
    if (n) ingredients.push({ name: n, qty: q || '', category: 'Pantry' });
  });
  const steps = [];
  document.getElementById('buildStepRows').querySelectorAll('.step-build-row').forEach(row => {
    const t = row.querySelector('textarea')?.value.trim();
    if (t) steps.push(t);
  });
  const recipe = { name, description: desc || 'A custom recipe.', emoji: '📝', time: '—', servings: '—', ingredients, steps };
  customRecipes.push(recipe);
  RECIPES[name] = recipe;
  hideBuildForm();
  renderMyRecipes();
  showToast(`✓ "${name}" saved!`);
}
// -- END: saveCustomRecipe --

// -- BEGIN: renderMyRecipes --
function renderMyRecipes() {
  const section = document.getElementById('myRecipesSection');
  const list    = document.getElementById('myRecipesList');
  if (customRecipes.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = '';
  customRecipes.forEach((r, i) => {
    const item = document.createElement('div');
    item.className = 'my-recipe-item';
    item.innerHTML = `
      <div>
        <span class="my-recipe-num">${i + 1}.</span>
        <span class="my-recipe-name" onclick="toggleMyRecipe(${i})">${r.name}</span>
      </div>
      <div class="my-recipe-details" id="my-recipe-detail-${i}">
        <div style="font-size:14px;color:rgba(200,220,255,0.5);margin-bottom:10px;line-height:1.5">${r.description}</div>
        <div style="font-family:'Josefin Sans',sans-serif;font-size:9px;letter-spacing:3px;color:rgba(255,200,80,0.5);text-transform:uppercase;margin-bottom:8px">Ingredients</div>
        ${r.ingredients.map(ing => `<div style="font-size:15px;color:#d0e4ff;padding:4px 0;border-bottom:1px solid rgba(100,160,255,0.08)">• ${ing.name} <span style="color:rgba(160,196,255,0.35);font-size:13px">${ing.qty}</span></div>`).join('')}
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="goldbtn" style="padding:7px 14px;font-size:9px" onclick="selectCustomRecipe(${i})">Plan This Meal</button>
          <button class="gb"      style="padding:7px 14px;font-size:9px" onclick="addAllIngredients('${r.name.replace(/'/g,"\\'")}')">+ Grocery</button>
        </div>
      </div>`;
    list.appendChild(item);
  });
}
// -- END: renderMyRecipes --

// -- BEGIN: toggleMyRecipe --
function toggleMyRecipe(i) {
  document.getElementById(`my-recipe-detail-${i}`).classList.toggle('open');
}
// -- END: toggleMyRecipe --

// END § 14


// ============================================================
//  § 15 — INIT
// ============================================================
document.getElementById('recipeModal').addEventListener('click', function(e) {
  if (e.target === this) closeRecipeModal();
});

// Check for a recipe pending from the cookbook Plan button
(function checkPendingRecipe() {
  try {
    const raw = localStorage.getItem('mealplanner_pending');
    if (!raw) return;
    const pending = JSON.parse(raw);
    localStorage.removeItem('mealplanner_pending');
    if (!pending.recipe_name || !pending.day || pending.month === undefined || !pending.year) return;
    // Register recipe in RECIPES so it can be opened
    RECIPES[pending.recipe_name] = {
      name:        pending.recipe_name,
      emoji:       '🍽',
      time:        '—',
      servings:    '—',
      description: '',
      ingredients: (pending.ingredients || []).map(function(i) {
        return { name: i, qty: '', category: 'Pantry' };
      }),
      steps: pending.prep ? [pending.prep] : []
    };
    // Build the correct key using the pending date
    const key = pending.year + '-' + pending.month + '-' + pending.day;
    plannedMeals[key] = pending.recipe_name;
    // Save to localStorage so it persists
    localStorage.setItem('mealplanner_meals', JSON.stringify(plannedMeals));
  } catch(e) {}
})();

renderCalendar();
renderGrocery();
renderWeeklySummary();
renderPlannedMeals();
// END § 15
