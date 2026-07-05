// courses-app.js

async function loadSubCategories() {
    const gridContainer = document.getElementById('gac-dynamic-subcategories-grid');
    const pageTitle = document.getElementById('gac-main-category-title');

    // 1. Safety Check: Elements page par hain ya nahi
    if (!gridContainer || !pageTitle) {
        console.error("HTML Elements ('gac-dynamic-subcategories-grid' ya 'gac-main-category-title') nahi mile!");
        return;
    }

    // 2. URL parameter se category_id nikalna (?category_id=1)
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category_id');

    if (!categoryId) {
        gridContainer.innerHTML = `<p style="color: red; font-weight: bold; text-align: center;">Error: No category selected. Please go back to home page.</p>`;
        pageTitle.innerText = "Error";
        return;
    }

    // 3. Global Supabase Client safety check
    if (!window.supabaseClient) {
        gridContainer.innerHTML = `<p style="color: red; text-align: center;">Supabase client initialize nahi hua. supabase-config.js check karein.</p>`;
        return;
    }

    // Step A: Main Category Name fetch karke Title dynamic badalna
    const { data: category, error: catError } = await window.supabaseClient
        .from('categories')
        .select('name')
        .eq('id', categoryId)
        .single();

    if (!catError && category) {
        pageTitle.innerText = `${category.name} Programs`;
    } else {
        pageTitle.innerText = "Courses";
    }

    // Step B: Database se sub_categories ke naye styling columns (image_url, badge_text, theme_class) fetch karna
    const { data: subCategories, error: subError } = await window.supabaseClient
        .from('sub_categories')
        .select('id, name, image_url, badge_text, theme_class') // DB se direct columns uthaye
        .eq('category_id', categoryId);

    if (subError) {
        console.error("Fetch Error:", subError.message);
        gridContainer.innerHTML = `<p style="color: red; text-align: center;">Database se data lane me dikkat aayi hai.</p>`;
        return;
    }

    gridContainer.innerHTML = ''; // Loading text saaf karna

    if (!subCategories || subCategories.length === 0) {
        gridContainer.innerHTML = `<p class="gac-courses-loading">No active tracks found under this category.</p>`;
        return;
    }

    // Step C: Loops chala kar direct Database ke dynamic columns se HTML cards render karna
    subCategories.forEach(subCat => {
        // Fallback checks: Agar database me kisi row me data khali reh jaye toh safe default set rahein
        const cardImg = subCat.image_url || 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?q=80&w=400';
        const cardBadge = subCat.badge_text || 'Premium';
        const cardTheme = subCat.theme_class || 'gac-badge-js';
        const safeName = escapeHtml(subCat.name || '');
        const safeBadge = escapeHtml(cardBadge);
        const safeTheme = escapeAttr(cardTheme);
        const safeImg = escapeAttr(cardImg);
        const safeLink = escapeAttr(`../Lectures/lectures.html?sub_category_id=${subCat.id}`);

        const cardHTML = `
            <div class="gac-course-card" data-sub-id="${escapeAttr(subCat.id)}">
                <div class="gac-card-banner">
                    <img src="${safeImg}" alt="${safeName}">
                </div>
                <div class="gac-card-body">
                    <span class="gac-badge ${safeTheme}">${safeBadge}</span>
                    <h3 class="gac-card-title">${safeName}</h3>
                    <p class="gac-card-desc">Complete conceptual roadmap by Grow All Coaching. Master this track with detailed live tests & notes.</p>
                    <a href="${safeLink}" class="gac-btn">
                        Start Learning
                    </a>
                </div>
            </div>
        `;
        gridContainer.innerHTML += cardHTML;
    });
}

// Page load hote hi query fire karein
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
}

document.addEventListener('DOMContentLoaded', loadSubCategories);