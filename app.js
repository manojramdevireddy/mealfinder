/* app.js
 - Single-file front-end that uses TheMealDB API
 - Provides:
   * Search by name
   * List categories
   * Get meals by category
   * Show meal details in modal
   * Hamburger side menu listing all categories
*/

const API_BASE = 'https://www.themealdb.com/api/json/v1/1';

const ui = {
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  mealsGrid: document.getElementById('mealsGrid'),
  categoriesGrid: document.getElementById('categoriesGrid'),
  mealModal: document.getElementById('mealModal'),
  mealDetail: document.getElementById('mealDetail'),
  closeModalBtn: document.getElementById('closeModal'),
  toast: document.getElementById('toast'),
  menuToggle: document.getElementById('menuToggle'),
  sideMenu: document.getElementById('sideMenu'),
  closeSideMenu: document.getElementById('closeSideMenu'),
  sideCategories: document.getElementById('sideCategories'),
};

let categoriesCache = []; // store categories for side menu

// helper: show toast
function showToast(msg, time = 2500) {
  ui.toast.textContent = msg;
  ui.toast.classList.remove('hidden');
  setTimeout(() => ui.toast.classList.add('hidden'), time);
}

// basic fetch wrapper with error handling
async function apiFetch(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('API error', err);
    showToast('Network/API error — check console');
    return null;
  }
}

/* RENDERING HELPERS */

// render categories as cards (main grid)
function renderCategories(categories = []) {
  ui.categoriesGrid.innerHTML = '';
  categories.forEach(c => {
    const el = document.createElement('div');
    el.className = 'card card-wrap';
    el.innerHTML = `
      <div class="card-wrap">
        <img src="${c.strCategoryThumb}" alt="${c.strCategory}" />
        <div class="badge">${c.strCategory}</div>
      </div>
      <div class="card-body">
        <div class="title">${c.strCategory}</div>
        <div class="subtitle">${(c.strCategoryDescription || '').slice(0, 90)}...</div>
      </div>
    `;
    el.addEventListener('click', () => {
      fetchMealsByCategory(c.strCategory);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    ui.categoriesGrid.appendChild(el);
  });
}

// render categories in the side-menu list
function renderSideCategories(categories = []) {
  ui.sideCategories.innerHTML = '';
  categories.forEach(c => {
    const li = document.createElement('li');
    li.textContent = c.strCategory;
    li.addEventListener('click', () => {
      fetchMealsByCategory(c.strCategory);
      closeSideMenu();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    ui.sideCategories.appendChild(li);
  });
}

// render meals grid (cards)
function renderMeals(meals = []) {
  ui.mealsGrid.innerHTML = '';
  if (!meals || meals.length === 0) {
    ui.mealsGrid.innerHTML = `<p style="color:#777">No meals found.</p>`;
    return;
  }
  meals.forEach(m => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-wrap">
        <img src="${m.strMealThumb}" alt="${m.strMeal}" />
        <div class="badge">${m.strCategory || ''}</div>
      </div>
      <div class="card-body">
        <div>
          <div class="title">${m.strMeal}</div>
          <div class="subtitle">${m.strArea ? m.strArea : ''}</div>
        </div>
        <div style="margin-top:8px;">
          <button class="btn-detail" data-id="${m.idMeal}">View</button>
        </div>
      </div>
    `;
    card.querySelector('.btn-detail')
      .addEventListener('click', () => showMealDetails(m.idMeal));
    ui.mealsGrid.appendChild(card);
  });
}

/* API CALLS */

// get categories
async function loadCategories() {
  const data = await apiFetch('/categories.php');
  if (!data) return;
  categoriesCache = data.categories || [];
  renderCategories(categoriesCache);
  renderSideCategories(categoriesCache);
}

// search meals by name
async function searchMeals(q) {
  if (!q || q.trim() === '') {
    showToast('Please enter a search term');
    return;
  }
  ui.mealsGrid.innerHTML = `<p>Loading search results…</p>`;
  const data = await apiFetch(`/search.php?s=${encodeURIComponent(q)}`);
  if (!data) return;
  renderMeals(data.meals || []);
}

// get meals filtered by category (returns minimal fields)
async function fetchMealsByCategory(category) {
  ui.mealsGrid.innerHTML = `<p>Loading ${category} meals…</p>`;
  const data = await apiFetch(`/filter.php?c=${encodeURIComponent(category)}`);
  if (!data) return;
  renderMeals(data.meals || []);
}

// get meal details by id
async function getMealById(id) {
  const data = await apiFetch(`/lookup.php?i=${encodeURIComponent(id)}`);
  if (!data) return null;
  return (data.meals && data.meals[0]) || null;
}

/* UI: Details modal */
function openModal() {
  ui.mealModal.setAttribute('aria-hidden', 'false');
}
function closeModal() {
  ui.mealModal.setAttribute('aria-hidden', 'true');
  ui.mealDetail.innerHTML = '';
}

// build ingredients list from returned meal object
function getIngredientsList(meal) {
  const list = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      list.push({ ingredient: ingredient.trim(), measure: (measure || '').trim() });
    }
  }
  return list;
}

async function showMealDetails(id) {
  ui.mealDetail.innerHTML = `<p>Loading...</p>`;
  openModal();
  const meal = await getMealById(id);
  if (!meal) {
    ui.mealDetail.innerHTML = `<p>Could not load meal details.</p>`;
    return;
  }

  const ingredients = getIngredientsList(meal);
  ui.mealDetail.innerHTML = `
    <div class="meal-grid">
      <div>
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" />
      </div>
      <div>
        <h3 style="margin-top:0">${meal.strMeal}</h3>
        <div class="meal-meta"><strong>Category:</strong> ${meal.strCategory || '-'} &nbsp; • &nbsp; <strong>Area:</strong> ${meal.strArea || '-'}</div>
        <p style="margin-top:12px">${(meal.strInstructions || '').slice(0, 450)}${(meal.strInstructions && meal.strInstructions.length > 450) ? '...' : ''}</p>

        <div style="margin-top:12px">
          <h4>Ingredients</h4>
          <div class="ingredients">
            ${ingredients.map(i => `<div style="margin-bottom:6px">${i.measure ? `<strong>${i.measure}</strong> — ` : ''}${i.ingredient}</div>`).join('')}
          </div>
        </div>

        ${meal.strYoutube ? `<p style="margin-top:12px"><a href="${meal.strYoutube}" target="_blank" rel="noopener">Watch recipe on YouTube</a></p>` : ''}
      </div>
    </div>
  `;
}

/* SIDE MENU CONTROLS */

function openSideMenu() {
  ui.sideMenu.setAttribute('aria-hidden', 'false');
}
function closeSideMenu() {
  ui.sideMenu.setAttribute('aria-hidden', 'true');
}

/* INIT + EVENTS */

function setupEvents() {
  ui.searchBtn.addEventListener('click', () => searchMeals(ui.searchInput.value));
  ui.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchMeals(ui.searchInput.value);
  });

  ui.closeModalBtn.addEventListener('click', closeModal);
  ui.mealModal.addEventListener('click', (e) => {
    if (e.target === ui.mealModal) closeModal();
  });

  // hamburger: open/close side menu
  ui.menuToggle.addEventListener('click', openSideMenu);
  ui.closeSideMenu.addEventListener('click', closeSideMenu);

  // close side menu with Esc key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeSideMenu();
    }
  });
}

// initial load
async function init() {
  setupEvents();
  await loadCategories();
  // default load: show meals for 'Pasta' category if available, else search 'pasta'
  try {
    const pasta = categoriesCache.find(c => c.strCategory && c.strCategory.toLowerCase() === 'pasta');
    if (pasta) {
      fetchMealsByCategory('Pasta');
      return;
    }
  } catch (e) {}
  searchMeals('pasta');
}

init();
