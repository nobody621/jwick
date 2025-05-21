// js/collection-script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- SUPABASE CONFIGURATION ---
    const SUPABASE_URL = 'https://bwmyxykqyymkckoilmcs.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bXl4eWtxeXlta2Nrb2lsbWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0OTYwNjMsImV4cCI6MjA2MzA3MjA2M30.0yQm2vRD67Ab7PlrW7vvFd2DS5Df9NdVUsytcLgh0jw';

    let supabaseInstance;
    // --- DOM ELEMENTS ---
    const productsGridPlaceholder = document.querySelector('.products-grid-placeholder');
    const loadingMessage = document.getElementById('loading-products-message');
    const brandFilterSelect = document.getElementById('brand-filter');
    const sortBySelect = document.getElementById('sort-by');
    const filterApplyBtn = document.querySelector('.filter-apply-btn');


    try {
        supabaseInstance = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.error("Error initializing Supabase client:", e);
        if (loadingMessage) {
            loadingMessage.textContent = 'Error initializing connection to database. Please check console.';
            loadingMessage.style.color = 'red';
        } else if (productsGridPlaceholder) {
            productsGridPlaceholder.innerHTML = '<p style="color: red; text-align: center;">Error initializing connection to database. Please check console.</p>';
        }
        return;
    }

    // --- FUNCTION TO FETCH PRODUCTS WITH FILTERING AND SORTING ---
    async function fetchAndDisplayProducts(selectedBrand = 'all', sortBy = 'newest') {
        if (!productsGridPlaceholder) {
            console.error('Products grid placeholder not found. Ensure your HTML has an element with class "products-grid-placeholder".');
            if (loadingMessage) {
                loadingMessage.textContent = 'Page setup error: Product display area not found.';
                loadingMessage.style.color = 'red';
            }
            return;
        }
        if (!supabaseInstance) {
            if (loadingMessage) loadingMessage.textContent = 'Database connection not available.';
            return;
        }

        // Show loading message
        if (loadingMessage) {
            loadingMessage.textContent = 'Loading our exquisite timepieces...';
            loadingMessage.style.display = 'block';
            loadingMessage.style.color = 'var(--text-dark)';
        }
        productsGridPlaceholder.innerHTML = ''; // Clear previous products while loading

        try {
            let query = supabaseInstance.from('Catalogue').select('*');

            // Apply brand filter
            if (selectedBrand && selectedBrand !== 'all') {
                // Ensure the brand value from the dropdown matches exactly how it's stored in Supabase.
                // Supabase is case-sensitive for string comparisons.
                // If your HTML <option value="..."> are lowercase (e.g., "seiko") but your DB stores "Seiko",
                // you might need to adjust either the option values or handle capitalization here.
                // For this example, I'm assuming the values match.
                query = query.eq('brand', selectedBrand);
            }

            // Apply sorting
            // Assuming your 'Catalogue' table has:
            // - 'created_at' (timestamp) for "Newest"
            // - 'Price' (numeric) for price sorting
            // - 'Name' (text) for name sorting
            switch (sortBy) {
                case 'price-asc':
                    query = query.order('Price', { ascending: true });
                    break;
                case 'price-desc':
                    query = query.order('Price', { ascending: false });
                    break;
                case 'name-asc':
                    query = query.order('Name', { ascending: true });
                    break;
                case 'newest':
                default:
                    query = query.order('created_at', { ascending: false });
                    break;
            }

            const { data: products, error } = await query;

            if (error) {
                console.error('Error fetching products from Catalogue table:', error);
                if (loadingMessage) {
                    loadingMessage.textContent = 'Could not load products at this time. Please try again later.';
                    loadingMessage.style.color = 'red';
                }
                return;
            }

            if (products && products.length > 0) {
                if (loadingMessage) loadingMessage.style.display = 'none';
                renderProducts(products);
            } else {
                if (loadingMessage) {
                    loadingMessage.textContent = 'No timepieces found matching your criteria. Please try different filters or check back soon!';
                    loadingMessage.style.color = 'var(--text-dark)'; // Reset color if it was red
                }
                 // Optionally, you can keep the "loadingMessage" element visible with the "no products" message,
                 // or you could hide it and display a different message directly in productsGridPlaceholder.
                productsGridPlaceholder.innerHTML = `<p style="text-align: center; width: 100%; padding: 20px; color: var(--text-dark-muted);">No timepieces currently available matching your selection.</p>`;
            }

        } catch (err) {
            console.error('An unexpected error occurred while fetching/rendering products:', err);
            if (loadingMessage) {
                loadingMessage.textContent = 'An error occurred while loading products.';
                loadingMessage.style.color = 'red';
            }
        }
    }

    // --- FUNCTION TO RENDER PRODUCTS (Mostly unchanged, ensure it's robust) ---
    function renderProducts(products) {
        if (!productsGridPlaceholder) {
            console.error("Cannot render products: productsGridPlaceholder is not found.");
            return;
        }
        // productsGridPlaceholder.innerHTML = ''; // Already cleared in fetchAndDisplayProducts

        products.forEach(product => {
            const cardLink = document.createElement('a');
            cardLink.href = `product-details.html?id=${product.id}`;
            cardLink.classList.add('watch-display-card-link');
            // Add animated item classes for script.js to pick up, if not already on the link
            // cardLink.classList.add('animated-item', 'type-scale-up'); // Or apply to cardDiv

            const cardDiv = document.createElement('div');
            // Add animated-item to the cardDiv as it's the visually animated element
            cardDiv.classList.add('watch-display-card', 'animated-item', 'type-scale-up');


            let brandName = product.brand || "Vintage Collection";
            // Your existing brand guessing logic (can be kept or simplified if 'brand' column is reliable)
            if (!product.brand && product.Name) {
                const nameParts = product.Name.split(' ');
                const knownBrands = ['Seiko', 'Citizen', 'Rolex', 'Omega', 'Swiss', 'Patek', 'Audemars'];
                if (nameParts.length > 0 && knownBrands.some(b => product.Name.toLowerCase().startsWith(b.toLowerCase()))) {
                    brandName = nameParts.find(part => knownBrands.some(b => part.toLowerCase() === b.toLowerCase())) || nameParts[0];
                }
            }

            const mainImageColumn = 'Main image';
            const imageUrl = product[mainImageColumn] || 'placeholder-watch-card.png';

            const formattedPrice = product.Price ? `$${Number(product.Price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'POA';
            const shortDescription = product.Description ? product.Description.substring(0, 70) + (product.Description.length > 70 ? '...' : '') : 'Exquisite timepiece.';
            const productName = product.Name || 'Vintage Timepiece';

            cardDiv.innerHTML = `
                <div class="watch-card-image-wrapper">
                    <img src="${imageUrl}" alt="${productName}">
                </div>
                <div class="watch-card-details">
                    <p class="watch-card-brand">${brandName}</p>
                    <h3 class="watch-card-name">${productName}</h3>
                    <p class="watch-card-desc">${shortDescription}</p>
                    <p class="watch-card-price">${formattedPrice}</p>
                </div>
            `;
            cardLink.appendChild(cardDiv);
            productsGridPlaceholder.appendChild(cardLink);

            // Ensure new items are observed for scroll animations
            // The animated item is cardDiv, not cardLink for this structure
            if (window.observeNewAnimatedItem) {
                window.observeNewAnimatedItem(cardDiv);
            }
        });
    }

    // --- EVENT LISTENER FOR FILTERS ---
    if (filterApplyBtn && brandFilterSelect && sortBySelect) {
        filterApplyBtn.addEventListener('click', () => {
            const selectedBrand = brandFilterSelect.value;
            const selectedSortBy = sortBySelect.value;
            fetchAndDisplayProducts(selectedBrand, selectedSortBy);
        });
    } else {
        console.warn("Filter controls not found. Filtering will not work.");
    }

    // --- INITIALIZE ---
    // Fetch products with default filters on page load
    const initialBrand = brandFilterSelect ? brandFilterSelect.value : 'all';
    const initialSort = sortBySelect ? sortBySelect.value : 'newest';
    fetchAndDisplayProducts(initialBrand, initialSort);
});