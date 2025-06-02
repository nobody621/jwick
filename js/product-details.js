// js/product-details.js
document.addEventListener('DOMContentLoaded', () => {
    // --- SUPABASE CONFIGURATION ---
    const SUPABASE_URL = 'https://bwmyxykqyymkckoilmcs.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bXl4eWtxeXlta2Nrb2lsbWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0OTYwNjMsImV4cCI6MjA2MzA3MjA2M30.0yQm2vRD67Ab7PlrW7vvFd2DS5Df9NdVUsytcLgh0jw';
    let supabaseInstance;
    let currentProductData = null;

    // --- WHATSAPP CONFIGURATION ---
    // The number should be digits only, including country code, without '+' or spaces.
    const WHATSAPP_NUMBER_CONFIG = "94701876387"; 

    try {
        if (typeof supabase !== 'undefined') {
            supabaseInstance = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
            console.error("Supabase client library not found.");
            displayErrorMessage("Error setting up database connection library.");
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
    const deliveryInfoSectionEl = document.getElementById('delivery-info-section');
    const deliveryFormEl = document.getElementById('delivery-form');
    const deliveryFormErrorEl = document.getElementById('delivery-form-error');

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
    
    const buyNowButton = document.getElementById('buy-now-button');
    const proceedToPaymentButton = document.getElementById('proceed-to-payment-button');
    const cancelDeliveryButton = document.getElementById('cancel-delivery-button');
    const floatingWhatsappButton = document.getElementById('floating-whatsapp-button');


    function getProductIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    function displayErrorMessage(message, showNotFound = false) {
        if (loadingMessageEl) loadingMessageEl.style.display = 'none';
        if (productContentWrapperEl) productContentWrapperEl.style.display = 'none';
        if (deliveryInfoSectionEl) deliveryInfoSectionEl.style.display = 'none';
        if (productNotFoundMessageEl) {
            productNotFoundMessageEl.style.display = 'block';
            const pElement = productNotFoundMessageEl.querySelector('p');
            if (pElement) {
                pElement.textContent = showNotFound ? "Sorry, the timepiece you are looking for could not be found or is no longer available." : message;
            }
        }
        console.error(message);
    }

    async function fetchProductDetails() {
        const productId = getProductIdFromUrl();
        if (!productId) {
            displayErrorMessage("No product ID provided.", true);
            return;
        }

        if (!supabaseInstance) {
            displayErrorMessage("Database connection not available.");
            return;
        }

        if (loadingMessageEl) loadingMessageEl.style.display = 'block';
        [productContentWrapperEl, productNotFoundMessageEl, deliveryInfoSectionEl].forEach(el => el && (el.style.display = 'none'));

        try {
            const { data: product, error } = await supabaseInstance
                .from('Catalogue')
                .select('*')
                .eq('id', productId)
                .single();

            if (error) throw error;

            if (product) {
                currentProductData = product; 
                if (loadingMessageEl) loadingMessageEl.style.display = 'none';
                if (productContentWrapperEl) productContentWrapperEl.style.display = 'grid'; 
                renderProductData(product);

                if (window.observeNewAnimatedItem) {
                    document.querySelectorAll('#product-content-wrapper .animated-item, #delivery-info-section.animated-item').forEach(item => {
                        if (item.id !== 'delivery-info-section') { 
                            window.observeNewAnimatedItem(item);
                        }
                    });
                }
            } else {
                displayErrorMessage("Product not found.", true);
            }
        } catch (err) {
            console.error('Error fetching/rendering product:', err);
            displayErrorMessage(`Error: ${err.message}`, err.message.toLowerCase().includes('not found'));
        }
    }

    function renderProductData(product) {
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

        if (thumbnailGalleryEl && mainProductImageEl) {
            thumbnailGalleryEl.innerHTML = '';
            const images = [];
            ['Main image', 'image 2', 'image 3'].forEach((col, index) => {
                if (product[col]) images.push({ src: product[col], alt: `View ${index + 1}` });
            });

            if (images.length > 0) {
                mainProductImageEl.src = images[0].src;
                mainProductImageEl.alt = images[0].alt;
                images.forEach((imgData, index) => {
                    const thumb = document.createElement('img');
                    thumb.src = imgData.src;
                    thumb.alt = `Thumbnail ${imgData.alt}`;
                    thumb.classList.add('thumbnail-image', 'cursor-hoverable');
                    if (index === 0) thumb.classList.add('active');
                    thumb.addEventListener('click', () => {
                        mainProductImageEl.src = imgData.src;
                        mainProductImageEl.alt = imgData.alt;
                        thumbnailGalleryEl.querySelectorAll('.thumbnail-image.active').forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                    });
                    thumbnailGalleryEl.appendChild(thumb);
                });
            } else {
                mainProductImageEl.src = 'images/placeholder-watch-detail.png';
                mainProductImageEl.alt = 'Placeholder Image';
            }
        }
        
        if (product.Video && videoLinkContainerEl && productVideoLinkEl) {
            productVideoLinkEl.href = product.Video;
            videoLinkContainerEl.style.display = 'block';
        } else if (videoLinkContainerEl) {
            videoLinkContainerEl.style.display = 'none';
        }

        if (floatingWhatsappButton) {
            floatingWhatsappButton.style.display = 'flex'; 
        }
    }

    function handleBuyNowClick() {
        if (!currentProductData) {
            alert("Product data is not loaded yet. Please wait.");
            return;
        }
        if (!currentProductData.Price) {
            alert("This product's price is available on application. Please contact us to purchase.");
            return;
        }

        if (productContentWrapperEl) productContentWrapperEl.style.display = 'none';
        if (deliveryInfoSectionEl) {
            deliveryInfoSectionEl.style.display = 'block';
            if (window.observeNewAnimatedItem && !deliveryInfoSectionEl.classList.contains('is-visible')) {
                deliveryInfoSectionEl.classList.add('is-visible');
            }
            deliveryInfoSectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function handleCancelDelivery() {
        if (deliveryInfoSectionEl) deliveryInfoSectionEl.style.display = 'none';
        if (productContentWrapperEl) {
             productContentWrapperEl.style.display = 'grid'; 
             productContentWrapperEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (deliveryFormErrorEl) deliveryFormErrorEl.style.display = 'none';
    }

    function handleProceedToPayment(event) {
        event.preventDefault(); 
        if (!currentProductData || !currentProductData.Price) {
            alert("Cannot proceed: Product information or price is missing.");
            return;
        }

        const requiredFields = deliveryFormEl.querySelectorAll('[required]');
        let allValid = true;
        if (deliveryFormErrorEl) deliveryFormErrorEl.style.display = 'none';

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                allValid = false;
                field.style.borderColor = 'red'; 
            } else {
                field.style.borderColor = '#D0D0D0'; 
                if (field.name === "country" && !/^[A-Za-z]{3}$/.test(field.value.trim())) {
                    allValid = false;
                    field.style.borderColor = 'red';
                     if (deliveryFormErrorEl) {
                        deliveryFormErrorEl.textContent = "Country code must be 3 letters.";
                        deliveryFormErrorEl.style.display = 'block';
                    }
                }
            }
        });

        if (!allValid && deliveryFormErrorEl && deliveryFormErrorEl.style.display === 'none') {
            deliveryFormErrorEl.textContent = "Please fill in all required fields (*).";
            deliveryFormErrorEl.style.display = 'block';
            return;
        }
        if (!allValid) return;

        const deliveryData = new FormData(deliveryFormEl);
        const paymentData = {
            productId: currentProductData.id,
            productName: currentProductData.Name,
            price: currentProductData.Price,
            currency: "USD", 
            customer: {
                firstName: deliveryData.get('firstname'),
                lastName: deliveryData.get('lastname'),
                email: deliveryData.get('email'),
                address1: deliveryData.get('address1'),
                address2: deliveryData.get('address2'),
                city: deliveryData.get('city'),
                postalCode: deliveryData.get('postalcode'),
                country: deliveryData.get('country').toUpperCase(),
                phone: deliveryData.get('phone')
            },
            transactionId: `JWLP-${currentProductData.id}-${Date.now()}`,
            returnUrl: `${window.location.origin}/payment-success.html`,
            cancelUrl: `${window.location.origin}/payment-cancelled.html`,
        };

        console.log("Proceeding to payment with data:", paymentData);
        alert("Payment Gateway Integration Placeholder:\nData prepared. Implement your payment gateway logic here.");
    }

    function handleFloatingWhatsappClick(event) {
        event.preventDefault(); 
        console.log("Floating WhatsApp button clicked.");

        if (!currentProductData) {
            alert("Product details are still loading. Please wait a moment and try again.");
            console.log("currentProductData is not available for WhatsApp.");
            return;
        }
        if (!WHATSAPP_NUMBER_CONFIG || WHATSAPP_NUMBER_CONFIG.length < 7) {
            alert("WhatsApp number is not configured correctly. Please contact support.");
            console.error("Developer: WhatsApp number (WHATSAPP_NUMBER_CONFIG) is not set or too short.");
            return;
        }

        const productName = currentProductData.Name || "this timepiece";
        const productPageURL = window.location.href; 

        // Construct the message parts
        let messageParts = [
            "Hello JWICK.LP,",
            "", // Empty string for a blank line
            "I'm interested in the following timepiece:",
            `Product Name: ${productName}`,
            `Product Page: ${productPageURL}`,
            "", // Empty string for a blank line
            "Could you please provide more information?",
            "", // Empty string for a blank line
            "Thank you."
        ];
        
        // Join parts with newline character
        let message = messageParts.join("\n");
        
        // Encode the full message for the URL
        const encodedMessage = encodeURIComponent(message);
        
        // Construct the wa.me URL
        const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER_CONFIG}?text=${encodedMessage}`;
        
        console.log("Raw Message:\n", message); // Log the raw message with \n
        console.log("Encoded Message:", encodedMessage); // Log the URL-encoded message (should have %0A)
        console.log("Constructed WhatsApp URL:", whatsappURL); // Log the final URL
        
        window.open(whatsappURL, '_blank');
    }

    // Event Listeners
    if (buyNowButton) buyNowButton.addEventListener('click', handleBuyNowClick);
    if (cancelDeliveryButton) cancelDeliveryButton.addEventListener('click', handleCancelDelivery);
    if (deliveryFormEl && proceedToPaymentButton) { 
        deliveryFormEl.addEventListener('submit', handleProceedToPayment);
    }
    if (floatingWhatsappButton) {
        floatingWhatsappButton.addEventListener('click', handleFloatingWhatsappClick);
        floatingWhatsappButton.style.display = 'none'; 
    }
    
    // --- INITIALIZE ---
    fetchProductDetails();
});