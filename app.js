// elements
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeBtn');
const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('overlay');
const cardsContainer = document.getElementById('cardsContainer');
const menuList = document.getElementById('menuList');
const mealsContainer = document.getElementById('mealsContainer');
const categoryDetails = document.getElementById('categoryDetails');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const homeBtn = document.getElementById('homeBtn');

let categoriesData = {}; // store category descriptions

// menu open/close
menuBtn && menuBtn.addEventListener('click', () => {
  sideMenu.classList.add('open'); overlay.hidden = false; overlay.classList.add('show');
});
closeBtn && closeBtn.addEventListener('click', () => {
  sideMenu.classList.remove('open'); overlay.classList.remove('show'); setTimeout(()=>overlay.hidden = true,220);
});
overlay && overlay.addEventListener('click', () => { sideMenu.classList.remove('open'); overlay.classList.remove('show'); setTimeout(()=>overlay.hidden=true,220); });

// HOME
homeBtn && homeBtn.addEventListener('click', () => {
  categoryDetails.hidden = true;
  mealsContainer.innerHTML = "";
  window.scrollTo({top:0, behavior:'smooth'});
});

// helper
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// load categories & populate grid + menu (simple)
async function loadCategories() {
  try {
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php');
    const data = await res.json();
    if (!data || !data.categories) return;
    cardsContainer.innerHTML = '';
    // keep menuList existing items, but ensure clicking works
    data.categories.forEach(cat => {
      categoriesData[cat.strCategory] = cat.strCategoryDescription || '';
      cardsContainer.innerHTML += `
        <div class="card" data-cat="${escapeHtml(cat.strCategory)}">
          <img src="${cat.strCategoryThumb}" alt="${escapeHtml(cat.strCategory)}">
          <h3>${escapeHtml(cat.strCategory)}</h3>
        </div>
      `;
    });

    // attach clicks to grid cards
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const c = card.getAttribute('data-cat');
        if (c) openCategory(c);
      });
    });

    // attach clicks to side menu items (menuList)
    document.querySelectorAll('#sideMenu ul li').forEach(li => {
      li.style.cursor = 'pointer';
      li.onclick = () => openCategory(li.textContent.trim());
    });

  } catch (err) {
    console.error('categories load failed', err);
  }
}

// open a category: show description and list of meals (filter)
async function openCategory(catName) {
  categoryDetails.hidden = false;
  categoryDetails.innerHTML = `<h2>${escapeHtml(catName)}</h2><p>${escapeHtml(categoriesData[catName]||'')}</p>`;

  mealsContainer.innerHTML = 'Loading...';
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(catName)}`);
    const d = await res.json();
    if (!d.meals) { mealsContainer.innerHTML = `<div class="no-found">No meals found for ${escapeHtml(catName)}</div>`; return; }

    mealsContainer.innerHTML = '';
    d.meals.slice(0, 50).forEach(m => {
      mealsContainer.innerHTML += `
        <div class="meal-card" data-id="${m.idMeal}">
          <div class="thumb-wrap">
            <img src="${m.strMealThumb}" alt="${escapeHtml(m.strMeal)}">
            <span class="cat-badge">${escapeHtml(catName)}</span>
          </div>
          <div class="meal-info">
            <h3 class="meal-title">${escapeHtml(m.strMeal)}</h3>
          </div>
        </div>
      `;
    });

    // attach click to each meal to fetch details (lookup)
    document.querySelectorAll('.meal-card').forEach(card => {
      card.onclick = async () => {
        const id = card.getAttribute('data-id');
        if (!id) return;
        await showMealById(id);
      };
    });

  } catch (err) {
    console.error('category meals failed', err);
    mealsContainer.innerHTML = '<div class="no-found">Failed to load meals.</div>';
  }

  // close menu for better UX
  sideMenu.classList.remove('open');
  overlay.classList.remove('show');
  setTimeout(()=>overlay.hidden = true,220);
}

// show meal details by id using lookup.php
async function showMealById(id) {
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`);
    const d = await res.json();
    if (!d.meals || !d.meals[0]) return;
    const m = d.meals[0];

    // build ingredients list
    const ingredients = [];
    for (let i=1;i<=20;i++){
      const ing = m[`strIngredient${i}`];
      const measure = m[`strMeasure${i}`];
      if (ing && ing.trim()) ingredients.push({ ing: ing.trim(), measure: (measure||'').trim() });
    }

    // render details in the categoryDetails box
    categoryDetails.hidden = false;
    categoryDetails.innerHTML = `
      <div class="breadcrumb" style="background:#E85A0C;color:#fff;padding:8px 12px;border-radius:4px;margin-bottom:12px;">
        <span style="font-weight:700"></span> &nbsp; ${escapeHtml(m.strMeal)} ${m.strArea?`(${escapeHtml(m.strArea)})`:''}
      </div>

      <div class="detail-grid">
        <div>
          <img class="detail-img" src="${escapeHtml(m.strMealThumb||'')}" alt="${escapeHtml(m.strMeal)}">
        </div>

        <div style="flex:1">
          <h2 style="margin-top:0;color:#E85A0C">${escapeHtml(m.strMeal)}</h2>
          <p><strong>Category:</strong> ${escapeHtml(m.strCategory||'')} ${m.strArea? ' • ' + escapeHtml(m.strArea): ''}</p>
          <p><strong>Source:</strong> ${m.strSource? `<a href="${escapeHtml(m.strSource)}" target="_blank">source</a>` : '—'}</p>
          <div style="margin-top:12px" class="ingredients-box">
            <h4>Ingredients</h4>
            <ul class="ingredients-list">
              ${ingredients.map(it => `<li>${escapeHtml(it.ing)}${it.measure? ' — ' + escapeHtml(it.measure):''}</li>`).join('')}
            </ul>
          </div>

          <div class="measure-box" style="margin-top:14px">
            ${ingredients.map(it => `<div class="measure-item">${escapeHtml(it.measure || '')} <span style="display:block;font-weight:700">${escapeHtml(it.ing)}</span></div>`).join('')}
          </div>
        </div>
      </div>

      <div style="margin-top:18px">
        <h3 style="margin:0 0 8px 0">Instructions</h3>
        <p style="line-height:1.6">${escapeHtml(m.strInstructions || '')}</p>
      </div>
    `;

    window.scrollTo({ top: categoryDetails.offsetTop - 20, behavior: 'smooth' });
  } catch (err) {
    console.error('lookup failed', err);
  }
}

// search (simple: show first match; click it for full details)
searchBtn && searchBtn.addEventListener('click', async () => {
  const q = (searchInput.value||'').trim();
  if (!q) return;
  categoryDetails.hidden = true;
  mealsContainer.innerHTML = 'Searching...';
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`);
    const d = await res.json();
    if (!d.meals) { mealsContainer.innerHTML = `<div class="no-found">No meal found!</div>`; return; }
    const m = d.meals[0];
    mealsContainer.innerHTML = `
      <div class="meal-card" data-id="${m.idMeal}">
        <div class="thumb-wrap"><img src="${m.strMealThumb}"><span class="cat-badge">${escapeHtml(m.strCategory)}</span></div>
        <div class="meal-info"><h3 class="meal-title">${escapeHtml(m.strMeal)}</h3></div>
      </div>
    `;
    document.querySelectorAll('.meal-card').forEach(card => {
      card.onclick = async () => { const id = card.getAttribute('data-id'); if (id) await showMealById(id); };
    });
  } catch (err) {
    console.error('search failed', err);
    mealsContainer.innerHTML = '<div class="no-found">Search failed.</div>';
  }
});

// init
loadCategories();