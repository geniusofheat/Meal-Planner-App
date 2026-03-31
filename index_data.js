// ── MAIN MENU TOGGLE ──

const cookbookCategories = {
  cookbook: [
    { label: "🥩 Beef",          href: "beef-menu.html" },
    { label: "🍗 Chicken",       href: "chicken-menu.html" },
    { label: "🍖 Pork",          href: "pork-menu.html" },
    { label: "🦞 Seafood",       href: "seafood-menu.html" },
    { label: "🥗 Salads",        href: "salads-menu.html" },
    { label: "🍲 Soups & Stews", href: "soups-and-stews-menu.html" },
    { label: "🥔 Side Dishes",   href: "side-dishes-menu.html" }
  ]
};

let activeCategory = null;

function toggleCategory(categoryId) {
  const listEl = document.getElementById(categoryId);
  if (!listEl) return;

  // Close any other open category
  if (activeCategory && activeCategory !== categoryId) {
    const activeEl = document.getElementById(activeCategory);
    if (activeEl) activeEl.style.display = "none";
  }

  // Toggle visibility
  if (listEl.style.display === "block") {
    listEl.style.display = "none";
    activeCategory = null;
  } else {
    listEl.innerHTML = "";
    if (cookbookCategories[categoryId]) {
      cookbookCategories[categoryId].forEach(item => {
        const li = document.createElement("li");
        li.className = "nested-li";

        const a = document.createElement("a");
        a.textContent = item.label;
        a.href = item.href;
        a.style.textDecoration = "none";
        a.style.color = "inherit";
        a.style.display = "block";

        li.appendChild(a);
        listEl.appendChild(li);
      });
    }
    listEl.style.display = "block";
    activeCategory = categoryId;
  }
}

// Hide list on load
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("cookbook");
  if (el) el.style.display = "none";
});
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Pasta & Grains Menu :</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="blue-card-style.css">
</head>
<body>
<div id="app">
  <div class="section-wrapper">

    <!-- ── RECIPE MODAL ── -->
    <div id="recipeModal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;
      background:rgba(0,0,0,0.85);z-index:9999;overflow-y:auto;padding:20px;box-sizing:border-box;">
      <div style="max-width:600px;margin:0 auto;background:#1a2a4a;
        border:1px solid rgba(200,169,110,0.3);border-radius:12px;padding:24px;position:relative;">
        <button onclick="closeRecipeModal()" style="position:absolute;top:12px;right:16px;
          background:transparent;border:none;color:gold;font-size:22px;cursor:pointer;">✕</button>
        <div id="recipeModalTitle" style="font-family:'Playfair Display',serif;
          font-size:20px;color:gold;margin-bottom:16px;padding-right:30px;"></div>
        <div id="recipeModalBody"></div>
      </div>
    </div>

    <!-- ── NAV BAR ── -->
    <nav id="nav-Bar">
      <div class="nav-pill-wrap">
        <div class="nav-pill-outer">
          <a class="nav-pill-inner" href="cookbook-main-menu.html">◆ Cookbook</a>
        </div>
      </div>
      <div class="nav-divider"></div>
      <a class="nav-section" href="cookbook-main-menu.html">🏠 Back</a>
      <div class="nav-divider"></div>
      <a class="nav-section" href="favorites-list.html">♡ Fav's</a>
    </nav>

    <!-- ── PAGE HEADER ── -->
    <div class="eyebrow">◆ Pasta & Grains</div>

    <!-- ── PASTA DISHES ── -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">🍝 Pasta Dishes</div>
        <div class="card-desc">Classic Italian pasta dishes from spaghetti and meatballs to carbonara, cacio e pepe, and aglio e olio.</div>
        <div class="gold-rule"></div>
      </div>
      <div class="card-body">
        <button class="btn-blue" style="width:100%;" onclick="toggleCategory('pastaDishes')">View Recipes</button>
        <ul class="nested-list" id="pastaDishes"></ul>
      </div>
    </div>

    <!-- ── BAKED PASTA ── -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">🫕 Baked Pasta</div>
        <div class="card-desc">Lasagna, baked ziti, mac and cheese, stuffed shells, and oven-baked pasta comfort classics.</div>
        <div class="gold-rule"></div>
      </div>
      <div class="card-body">
        <button class="btn-blue" style="width:100%;" onclick="toggleCategory('bakedPasta')">View Recipes</button>
        <ul class="nested-list" id="bakedPasta"></ul>
      </div>
    </div>

    <!-- ── FILLED PASTA ── -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">🥟 Filled Pasta</div>
        <div class="card-desc">Handmade ravioli, tortellini, gnocchi, and other stuffed and filled pasta shapes.</div>
        <div class="gold-rule"></div>
      </div>
      <div class="card-body">
        <button class="btn-blue" style="width:100%;" onclick="toggleCategory('filledPasta')">View Recipes</button>
        <ul class="nested-list" id="filledPasta"></ul>
      </div>
    </div>

    <!-- ── ASIAN NOODLES ── -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">🍜 Asian Noodles</div>
        <div class="card-desc">Pad Thai, lo mein, ramen, udon, soba, glass noodles, and classic Asian noodle dishes.</div>
        <div class="gold-rule"></div>
      </div>
      <div class="card-body">
        <button class="btn-blue" style="width:100%;" onclick="toggleCategory('asianNoodles')">View Recipes</button>
        <ul class="nested-list" id="asianNoodles"></ul>
      </div>
    </div>

    <!-- ── PASTA SAUCES ── -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">🫙 Pasta Sauces</div>
        <div class="card-desc">Classic marinara, Bolognese, alfredo, pesto, vodka sauce, and homemade pasta sauce recipes.</div>
        <div class="gold-rule"></div>
      </div>
      <div class="card-body">
        <button class="btn-blue" style="width:100%;" onclick="toggleCategory('pastaSauces')">View Recipes</button>
        <ul class="nested-list" id="pastaSauces"></ul>
      </div>
    </div>

    <!-- ── GRAINS & RICE ── -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">🌾 Grains & Rice</div>
        <div class="card-desc">Risotto, fried rice, pilaf, couscous, quinoa, polenta, and grain-based dishes from around the world.</div>
        <div class="gold-rule"></div>
      </div>
      <div class="card-body">
        <button class="btn-blue" style="width:100%;" onclick="toggleCategory('grainsRice')">View Recipes</button>
        <ul class="nested-list" id="grainsRice"></ul>
      </div>
    </div>

    <div class="page-ornament">◆ ◆ ◆</div>

  </div><!-- /section-wrapper -->
</div><!-- /app -->

<script src="pasta-menu.js"></script>
</body>
</html>
