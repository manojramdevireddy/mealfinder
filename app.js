// OPEN & CLOSE MENU
menuBtn.onclick = () => sideMenu.classList.add("open");
closeBtn.onclick = () => sideMenu.classList.remove("open");


// LOAD CATEGORY CARDS (to show under “CATEGORIES”)
fetch("https://www.themealdb.com/api/json/v1/1/categories.php")
  .then(r => r.json())
  .then(d => {
    d.categories.forEach(c => {
      cardsContainer.innerHTML += `
        <div class="card">
          <img src="${c.strCategoryThumb}">
          <h3>${c.strCategory}</h3>
        </div>
      `;
    });
  });
homeBtn.onclick = () => {
  location.reload();
};

// WHEN MENU ITEM CLICKED - SHOW RELATED MEALS
document.querySelectorAll("#sideMenu ul li").forEach(li => {
  li.onclick = () => {
    let cat = li.textContent.trim();

    fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${cat}`)
      .then(r => r.json())
      .then(d => {
        mealsContainer.innerHTML = "";    // clear old meals

        d.meals.slice(0,6).forEach(m => {
          mealsContainer.innerHTML += `
            <div class="meal-card">
              <div class="thumb-wrap">
                <img src="${m.strMealThumb}">
                <span class="cat-badge">${cat}</span>
              </div>
              <div class="meal-info">
                <h3 class="meal-title">${m.strMeal}</h3>
              </div>
            </div>
          `;
        });
      });

    sideMenu.classList.remove("open");  // close menu
  };
});


// SEARCH → SHOW ONLY ONE MEAL
searchBtn.onclick = () => {
  let q = searchInput.value.trim();

  fetch("https://www.themealdb.com/api/json/v1/1/search.php?s=" + q)
    .then(r => r.json())
    .then(d => {
      mealsContainer.innerHTML = "";

      if (!d.meals) {
        mealsContainer.innerHTML = "No meal found!";
        return;
      }

      let m = d.meals[0];

      mealsContainer.innerHTML = `
        <div class="meal-card">
          <div class="thumb-wrap">
            <img src="${m.strMealThumb}">
            <span class="cat-badge">${m.strCategory}</span>
          </div>
          <div class="meal-info">
            <h3 class="meal-title">${m.strMeal}</h3>
          </div>
        </div>
      `;
    });
};