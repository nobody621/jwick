// js/product-details.js
document.addEventListener('DOMContentLoaded', () => {
    // --- SUPABASE CONFIGURATION ---
    const SUPABASE_URL = 'https://bwmyxykqyymkckoilmcs.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bXl4eWtxeXlta2Nrb2lsbWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0OTYwNjMsImV4cCI6MjA2MzA3MjA2M30.0yQm2vRD67Ab7PlrW7vvFd2DS5Df9NdVUsytcLgh0jw';
    let supabaseInstance;

    try {
        if (typeof supabase !== 'undefined') {
            supabaseInstance = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
            console.error("Supabase client library not found. Ensure it's linked in your HTML <head>.");
            displayErrorMessage("Error setting up database connection library."); // Added to ensure a message is shown
            return;
        }
    } catch (e) {
        console.error("Error initializing Supabase client:", e);
        displayErrorMessage("Error connecting to the database.");
        return;
    }

    // --- DOM ELEMENTS ---
    const loadingMessageEl = document.getElementById('product-loading-message');
    const productContentWrapperEl = document.getElementById('product-content-wrapper');
    const productNotFoundMessageEl = document.getElementById('product-not-found-message');

    const mainProductImageEl = document.getElementById('main-product-image');
    const thumbnailGalleryEl = document.querySelector('.thumbnail-gallery');
    const videoLinkContainerEl = document.getElementById('video-link-container');
    const productVideoLinkEl = document.getElementById('product-video-link');

    const productBrandEl = document.getElementById('product-brand');
    const productNameEl = document.getElementById('product-name');
    const productPriceEl = document.getElementById('product-price');
    const productDescriptionEl = document.getElementById('product-description');
    const productIdDisplayEl = document.getElementById('product-id-display');
    const productCreatedAtEl = document.getElementById('product-created-at');
    const productBreadcrumbNameEl = document.getElementById('product-breadcrumb-name');
    const inquireButton = document.getElementById('inquire-button');


    // --- FUNCTION TO GET PRODUCT ID FROM URL ---
    function getProductIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // --- FUNCTION TO DISPLAY ERROR ---
    function displayErrorMessage(message, showNotFound = false) {
        if (loadingMessageEl) loadingMessageEl.style.display = 'none';
        if (productContentWrapperEl) productContentWrapperEl.style.display = 'none';
        if (productNotFoundMessageEl) {
            productNotFoundMessageEl.style.display = 'block';
            const pElement = productNotFoundMessageEl.querySelector('p');
            if (pElement) { // Ensure the p element exists before trying to set its textContent
                if (showNotFound && !message.toLowerCase().includes("product not found")) {
                    // Use default "Product not found" message if showNotFound is true and message isn't already it
                    pElement.textContent = "Sorry, the timepiece you are looking for could not be found or is no longer available.";
                } else {
                    pElement.textContent = message;
                }
            }
        }
        console.error(message);
    }

    // --- FUNCTION TO FETCH AND DISPLAY PRODUCT ---
    async function fetchProductDetails() {
        const productId = getProductIdFromUrl();

        if (!productId) {
            displayErrorMessage("No product ID provided in the URL.", true);
            return;
        }

        if (!supabaseInstance) {
            // displayErrorMessage is likely called during Supabase init failure already.
            // If not, or if supabaseInstance becomes null later:
            console.error("Database connection not available when fetching product details.");
            if(loadingMessageEl && loadingMessageEl.style.display !== 'none'){ // Only update if loading is visible
                displayErrorMessage("Database connection not available.");
            }
            return;
        }

        if (loadingMessageEl) loadingMessageEl.style.display = 'block';
        if (productContentWrapperEl) productContentWrapperEl.style.display = 'none';
        if (productNotFoundMessageEl) productNotFoundMessageEl.style.display = 'none';

        try {
            const { data: product, error } = await supabaseInstance
                .from('Catalogue')
                .select('*') // Select all columns for detail page
                .eq('id', productId)
                .single(); // Expecting a single product

            if (error) {
                console.error('Error fetching product:', error);
                displayErrorMessage(`Error fetching product data: ${error.message}`, true);
                return;
            }

            if (product) {
                if (loadingMessageEl) loadingMessageEl.style.display = 'none';
                // Ensure the display style matches your CSS grid/flex setup for the wrapper
                if (productContentWrapperEl) productContentWrapperEl.style.display = 'grid'; // Changed from 'flex' to 'grid' to match CSS
                renderProductData(product);

                // Re-initialize scroll animations for newly displayed content
                if (window.observeNewAnimatedItem) {
                    document.querySelectorAll('#product-content-wrapper .animated-item').forEach(item => {
                        window.observeNewAnimatedItem(item);
                    });
                }

            } else {
                displayErrorMessage("Product not found. The requested timepiece may no longer be available or the ID is incorrect.", true);
            }

        } catch (err) {
            console.error('An unexpected error occurred:', err);
            displayErrorMessage('An unexpected error occurred while loading product details.');
        }
    }

    // --- FUNCTION TO RENDER PRODUCT DATA ---
    function renderProductData(product) {
        // Basic Info
        if (productBrandEl) productBrandEl.textContent = product.brand || 'N/A';
        if (productNameEl) productNameEl.textContent = product.Name || 'Vintage Timepiece';
        if (productBreadcrumbNameEl) productBreadcrumbNameEl.textContent = product.Name || 'Product';
        document.title = `${product.Name || 'Product'} | JWICK.LP`;

        if (productPriceEl) {
            productPriceEl.textContent = product.Price
                ? `$${Number(product.Price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : 'Price on Application';
        }
        if (productDescriptionEl) productDescriptionEl.textContent = product.Description || 'No description available.';
        if (productIdDisplayEl) productIdDisplayEl.textContent = product.id;
        if (productCreatedAtEl && product.created_at) {
            productCreatedAtEl.textContent = new Date(product.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        } else if (productCreatedAtEl) {
            productCreatedAtEl.textContent = 'N/A';
        }
        
        // Setup Inquire Button for WhatsApp
        if(inquireButton) {
            inquireButton.onclick = () => {
                const whatsappBaseUrl = "https://wa.me/message/F3EHCPWP2KMWB1"; // Your specific WhatsApp link

                let prefilledMessage = `Hello JWICK.LP,\n\nI am interested in learning more about the following timepiece:\n`;
                prefilledMessage += `Product Name: ${product.Name || 'N/A'}\n`;
                if (product.brand) {
                    prefilledMessage += `Brand: ${product.brand}\n`;
                }
                // prefilledMessage += `Reference ID: ${product.id}\n\n`; // Optional: include if you want it in the message
                prefilledMessage += `\n[Please type your specific questions or inquiry here...]`;

                const encodedMessage = encodeURIComponent(prefilledMessage);
                
                // For wa.me/message/CODE links, the text parameter might be handled differently or
                // might use a pre-set greeting from WhatsApp Business. Test this behavior.
                const fullWhatsAppUrl = `${whatsappBaseUrl}&text=${encodedMessage}`; 
                // If the above doesn't pre-fill, sometimes the business link itself has a default message.
                // Alternatively, for a direct number: `https://wa.me/YOURPHONENUMBERWITHOUTPLUS?text=${encodedMessage}`

                window.open(fullWhatsAppUrl, '_blank');
            };
        }

        // Image Gallery
        if (thumbnailGalleryEl && mainProductImageEl) {
            thumbnailGalleryEl.innerHTML = ''; // Clear existing thumbnails
            const images = [];

            const mainImageCol = 'Main image';
            const image2Col = 'image 2';
            const image3Col = 'image 3';

            if (product[mainImageCol]) images.push({ type: 'image', src: product[mainImageCol], alt: 'Main view' });
            if (product[image2Col]) images.push({ type: 'image', src: product[image2Col], alt: 'Side view' });
            if (product[image3Col]) images.push({ type: 'image', src: product[image3Col], alt: 'Detail view' });

            if (images.length > 0) {
                mainProductImageEl.src = images[0].src;
                mainProductImageEl.alt = images[0].alt;

                images.forEach((imgData, index) => {
                    const thumb = document.createElement('img');
                    thumb.src = imgData.src; // type is always 'image' for now
                    thumb.alt = `Thumbnail ${imgData.alt}`;
                    thumb.classList.add('thumbnail-image', 'cursor-hoverable');
                    if (index === 0) thumb.classList.add('active');
                    
                    thumb.dataset.fullimage = imgData.src;
                    // thumb.dataset.type = imgData.type; // Not strictly needed if only images

                    thumb.addEventListener('click', () => {
                        mainProductImageEl.src = imgData.src;
                        mainProductImageEl.alt = imgData.alt;
                        
                        thumbnailGalleryEl.querySelectorAll('.thumbnail-image').forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                    });
                    thumbnailGalleryEl.appendChild(thumb);
                });
            } else {
                mainProductImageEl.src = 'images/placeholder-watch-detail.png'; // Ensure this path is correct
                mainProductImageEl.alt = 'Placeholder Image';
            }
        }
        
        // Video Link
        if (product.Video && videoLinkContainerEl && productVideoLinkEl) {
            productVideoLinkEl.href = product.Video;
            videoLinkContainerEl.style.display = 'block';
        } else if (videoLinkContainerEl) {
            videoLinkContainerEl.style.display = 'none';
        }
    }

    // --- INITIALIZE ---
    fetchProductDetails();
});