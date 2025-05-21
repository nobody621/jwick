// js/script.js

// --- GLOBALLY ACCESSIBLE INTERSECTION OBSERVER SETUP ---
let scrollObserverInstance;
const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };

const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            let delay = 0;
            const baseDelayStyle = entry.target.style.transitionDelay;
            const baseDelay = baseDelayStyle ? parseFloat(baseDelayStyle.replace('s', '')) * 1000 : 0;
            const staggerParent = entry.target.closest('[data-stagger-children]');
            let itemToAnimate = entry.target;

            if (entry.target.classList.contains('watch-display-card-link')) {
                itemToAnimate = entry.target.querySelector('.animated-item');
            }

            if (staggerParent && itemToAnimate) {
                const parentStaggerAmount = parseInt(staggerParent.dataset.staggerChildren) || 120;
                const potentialAnimatedSiblings = Array.from(staggerParent.children).map(child => {
                    if (child.classList.contains('animated-item')) return child;
                    // Check if the direct child is a link (like in homepage collection)
                    if (child.tagName === 'A' && child.querySelector('.animated-item')) return child.querySelector('.animated-item');
                    return child.querySelector('.animated-item');
                }).filter(el => el);

                const visibleAnimatedSiblings = potentialAnimatedSiblings.filter(el => el.classList.contains('is-visible'));
                const itemIndexInStaggerGroup = potentialAnimatedSiblings.indexOf(itemToAnimate);

                if (itemIndexInStaggerGroup !== -1) {
                    delay = baseDelay + ((itemIndexInStaggerGroup - visibleAnimatedSiblings.length) * parentStaggerAmount);
                    delay = Math.max(baseDelay, delay);
                } else {
                    delay = baseDelay;
                }
            } else {
                delay = baseDelay;
            }

            setTimeout(() => {
                if (itemToAnimate) itemToAnimate.classList.add('is-visible');
                else entry.target.classList.add('is-visible');
            }, delay);

            observer.unobserve(entry.target); // Unobserve the initially observed target
        }
    });
};

window.observeNewAnimatedItem = (item) => {
    if (scrollObserverInstance && item instanceof HTMLElement) {
        if (![...item.classList].some(cls => cls.startsWith('type-'))) {
            item.classList.add('type-slide-up');
        }
        scrollObserverInstance.observe(item);
    } else if (!scrollObserverInstance) {
        console.warn("scrollObserverInstance not initialized yet. Cannot observe new item:", item);
    }
};

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://bwmyxykqyymkckoilmcs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bXl4eWtxeXlta2Nrb2lsbWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0OTYwNjMsImV4cCI6MjA2MzA3MjA2M30.0yQm2vRD67Ab7PlrW7vvFd2DS5Df9NdVUsytcLgh0jw';
let supabaseInstance;
let homepageProductsCache = []; // Cache for homepage products

document.addEventListener('DOMContentLoaded', function() {
    // --- SUPABASE CLIENT INITIALIZATION ---
    try {
        if (typeof supabase !== 'undefined') {
            supabaseInstance = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
            console.error("Supabase client library not found. Ensure it's linked in your HTML <head>.");
        }
    } catch (e) {
        console.error("Error initializing Supabase client:", e);
    }

    // --- DOM ELEMENT SELECTORS ---
    const preloader = document.querySelector('.preloader');
    const header = document.querySelector('.header');
    const body = document.body;
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorCircle = document.querySelector('.cursor-circle');
    const heroTitleElement = document.querySelector('#hero .hero-title');
    const heroWatches = document.querySelectorAll('.hero-watch');
    const canvas = document.getElementById('hero-background-canvas');
    const navToggle = document.querySelector('.nav-toggle');
    const mainNavigationOverlay = document.querySelector('.main-navigation-overlay');
    const mainNavLinks = document.querySelectorAll('.main-nav-link');
    const testimonialSlides = document.querySelectorAll('.testimonial-slide');
    const prevTestimonialBtn = document.querySelector('.prev-testimonial');
    const nextTestimonialBtn = document.querySelector('.next-testimonial');
    const faqItems = document.querySelectorAll('.faq-item');
    const currentYearSpan = document.getElementById('currentYear');
    const aboutImage = document.querySelector('.about-image-main');
    const aboutSection = document.querySelector('#about');

    // HOMEPAGE COLLECTION SELECTORS
    const watchesGallery = document.querySelector('#collection .watches-gallery'); // Target specific gallery
    const collectionFilterBtns = document.querySelectorAll('#collection .filter-btn'); // Target specific filters

    // --- PRELOADER ---
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (preloader) preloader.classList.add('loaded');
            animateHeroTitle();
            setTimeout(() => {
                const heroSubtitle = document.querySelector('#hero .hero-subtitle');
                if (heroSubtitle) heroSubtitle.classList.add('visible');
            }, 200);
            setTimeout(() => {
                const heroCta = document.querySelector('#hero .hero-cta');
                if (heroCta) {
                    const computedStyle = window.getComputedStyle(heroCta);
                    if (computedStyle.animationName && computedStyle.animationName !== 'none') {
                        heroCta.style.animationPlayState = 'running';
                    } else {
                        heroCta.classList.add('cta-visible');
                    }
                }
            }, 400);
            animateHeroWatches();
        }, 500);
    });

    // --- CUSTOM CURSOR ---
    let mouseX = 0, mouseY = 0;
    let circleX = 0, circleY = 0;
    let dotX = 0, dotY = 0;
    if (cursorDot && cursorCircle) {
        window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
        function animateCursor() {
            dotX += (mouseX - dotX) * 0.75;
            dotY += (mouseY - dotY) * 0.75;
            if (cursorDot) cursorDot.style.transform = `translate(-50%, -50%) translate(${dotX}px, ${dotY}px)`;
            circleX += (mouseX - circleX) * 0.18;
            circleY += (mouseY - circleY) * 0.18;
            if (cursorCircle) cursorCircle.style.transform = `translate(-50%, -50%) translate(${circleX}px, ${circleY}px)`;
            requestAnimationFrame(animateCursor);
        }
        if (!window.matchMedia("(pointer: coarse)").matches) {
            animateCursor();
        } else {
            if (cursorDot) cursorDot.style.display = 'none';
            if (cursorCircle) cursorCircle.style.display = 'none';
        }
    }

    // --- HERO TITLE ANIMATION ---
    const heroTitleText = "The Art of Time";
    if (heroTitleElement) {
        heroTitleElement.innerHTML = '';
        heroTitleText.split(' ').forEach((wordText, wordIndex, wordsArray) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            wordSpan.style.display = 'inline-block';
            wordText.split('').forEach(charText => {
                const charSpan = document.createElement('span');
                charSpan.className = 'char';
                charSpan.textContent = charText;
                charSpan.style.display = 'inline-block';
                wordSpan.appendChild(charSpan);
            });
            heroTitleElement.appendChild(wordSpan);
            if (wordIndex < wordsArray.length - 1) {
                heroTitleElement.appendChild(document.createTextNode('\u00A0'));
            }
        });

        mainNavLinks.forEach(link => {
            const textNodes = Array.from(link.childNodes).filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '');
            if (textNodes.length > 0 && link.querySelectorAll('span').length === 0) {
                const text = link.textContent.trim();
                link.innerHTML = '';
                text.split('').forEach(char => {
                    const span = document.createElement('span');
                    span.textContent = char === ' ' ? '\u00A0' : char;
                    link.appendChild(span);
                });
            }
        });
    }

    function animateHeroTitle() {
        const chars = document.querySelectorAll('#hero .char');
        if (chars.length === 0) return;
        let delay = 300;
        chars.forEach((char, index) => {
            setTimeout(() => {
                char.style.transform = 'translateY(0%) skewY(0deg)';
                char.style.opacity = '1';
            }, delay + index * 35);
        });
    }

    function animateHeroWatches() {
        heroWatches.forEach((watch, index) => {
            setTimeout(() => {
                watch.style.setProperty('--final-rotate', watch.dataset.finalRotate || '0deg');
                watch.style.setProperty('--final-translate-x', watch.dataset.finalTranslateX || '0px');
                watch.style.setProperty('--final-translate-y', watch.dataset.finalTranslateY || '0px');
                watch.classList.add('is-visible');
            }, 1200 + index * 180);
        });
    }

    // --- CANVAS ANIMATION ---
    if (canvas) {
        const ctx = canvas.getContext('2d'); let cw, ch, particles;
        function initCanvas() {
            cw = canvas.width = window.innerWidth; ch = canvas.height = window.innerHeight; particles = [];
            const particleCount = Math.max(15, Math.floor(cw * ch / 40000));
            for (let i = 0; i < particleCount; i++) { particles.push({ x: Math.random() * cw, y: Math.random() * ch, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, r: Math.random() * 2.5 + 0.8, color: `rgba(200, 168, 118, ${Math.random() * 0.10 + 0.04})` }); }
        }
        function drawCanvas() {
            if (!ctx) return;
            ctx.clearRect(0, 0, cw, ch);
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x + p.r < 0) p.x = cw + p.r; if (p.x - p.r > cw) p.x = -p.r;
                if (p.y + p.r < 0) p.y = ch + p.r; if (p.y - p.r > ch) p.y = -p.r;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill();
            });
            requestAnimationFrame(drawCanvas);
        }
        initCanvas(); drawCanvas(); window.addEventListener('resize', initCanvas);
    }

    // --- SCROLL & NAVIGATION LOGIC ---
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        if (header) header.classList.toggle('scrolled', currentScroll > 50);
        if (aboutImage && aboutSection) {
            const sectionRect = aboutSection.getBoundingClientRect();
            if (sectionRect.top < window.innerHeight && sectionRect.bottom > 0) {
                const scrollPercentInSection = (window.innerHeight - sectionRect.top) / (window.innerHeight + sectionRect.height);
                const clampedPercent = Math.max(0, Math.min(1, scrollPercentInSection));
                const parallaxOffset = (clampedPercent - 0.5) * -60;
                const wrapper = aboutImage.closest('.animated-item');
                if (wrapper && wrapper.classList.contains('is-visible')) {
                    aboutImage.style.transform = `translateY(${parallaxOffset}px) rotate(0deg) scale(1)`;
                }
            }
        }
    }, { passive: true });

    if (navToggle && mainNavigationOverlay) {
        navToggle.addEventListener('click', () => {
            const isNavOpening = !body.classList.contains('nav-open');
            body.classList.toggle('nav-open');
            body.classList.toggle('nav-open-no-scroll');
            navToggle.setAttribute('aria-expanded', isNavOpening.toString());
        });
    }
    mainNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (body.classList.contains('nav-open')) {
                body.classList.remove('nav-open');
                body.classList.remove('nav-open-no-scroll');
                if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // --- INTERSECTION OBSERVER INITIALIZATION ---
    scrollObserverInstance = new IntersectionObserver(observerCallback, observerOptions);
    const initialAnimatedItems = document.querySelectorAll('.animated-item');
    initialAnimatedItems.forEach(item => {
        // Do not observe items within .watches-gallery on initial pass
        // as they will be dynamically loaded and observed then.
        if (!item.closest('.watches-gallery')) {
            if (![...item.classList].some(cls => cls.startsWith('type-'))) {
                item.classList.add('type-slide-up');
            }
            scrollObserverInstance.observe(item);
        }
    });

    // --- FOOTER YEAR ---
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

    // --- TESTIMONIALS ---
    let currentTestimonialIndex = 0;
    function showTestimonial(index) {
        if (!testimonialSlides || testimonialSlides.length === 0) return;
        const currentActive = document.querySelector('.testimonial-slide.active');
        if (currentActive) {
            currentActive.style.opacity = '0';
            currentActive.style.transform = 'scale(0.98)';
        }
        testimonialSlides.forEach((slide, i) => {
            if (i === index) {
                setTimeout(() => {
                    slide.classList.add('active');
                    slide.style.opacity = '1';
                    slide.style.transform = 'scale(1)';
                }, 50);
            } else {
                slide.classList.remove('active');
                setTimeout(() => {
                    if (!slide.classList.contains('active')) {
                        slide.style.opacity = '';
                        slide.style.transform = '';
                    }
                }, 500);
            }
        });
        currentTestimonialIndex = index;
    }
    if (testimonialSlides.length > 0) {
        showTestimonial(0);
        if (nextTestimonialBtn) nextTestimonialBtn.addEventListener('click', () => showTestimonial((currentTestimonialIndex + 1) % testimonialSlides.length));
        if (prevTestimonialBtn) prevTestimonialBtn.addEventListener('click', () => showTestimonial((currentTestimonialIndex - 1 + testimonialSlides.length) % testimonialSlides.length));
    }

    // --- FAQ ---
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => item.classList.toggle('active'));
        }
    });

    // --- HOMEPAGE COLLECTION LOGIC ---
    async function fetchHomepageProducts() {
        if (!supabaseInstance) {
            console.error("Supabase not initialized. Cannot fetch homepage products.");
            if (watchesGallery) watchesGallery.innerHTML = '<p style="text-align:center; color: var(--text-dark-muted); padding: 20px;">Could not connect to the database to load timepieces.</p>';
            return;
        }
        if (!watchesGallery) {
            // Silently return if not on a page with this section (e.g. not index.html)
            return;
        }

        watchesGallery.innerHTML = '<p style="text-align:center; color: var(--text-dark-muted); padding: 20px;">Loading featured timepieces...</p>';

        try {
            const { data, error } = await supabaseInstance
                .from('Catalogue')
                .select('id, Name, Description, Price, brand, "Main image", "Homepage"') // CORRECTED: "Homepage"
                .eq('"Homepage"', true) // CORRECTED: Filter by the "Homepage" column
                .order('created_at', { ascending: false })
                .limit(6); // Fetch up to 6 items for the homepage

            if (error) {
                console.error("Error fetching homepage products:", error);
                watchesGallery.innerHTML = `<p style="text-align:center; color:red; padding: 20px;">Error loading products: ${error.message}</p>`;
                return;
            }

            homepageProductsCache = data || [];
            if (homepageProductsCache.length === 0) {
                watchesGallery.innerHTML = '<p style="text-align:center; color: var(--text-dark-muted); padding: 20px;">No featured timepieces available at the moment. Explore our full collection!</p>';
            } else {
                renderHomepageProducts(homepageProductsCache, 'all');
            }

        } catch (err) {
            console.error("Unexpected error fetching homepage products:", err);
            watchesGallery.innerHTML = '<p style="text-align:center; color:red; padding: 20px;">An unexpected error occurred while loading products.</p>';
        }
    }

    function renderHomepageProducts(productsToRender, filter = 'all') {
        if (!watchesGallery) return;
        watchesGallery.innerHTML = ''; // Clear previous items or loading message

        let filteredProducts = productsToRender;
        if (filter !== 'all') {
            // Ensure brand comparison is case-insensitive if needed, or ensure data matches
            filteredProducts = productsToRender.filter(product => product.brand && product.brand.toLowerCase() === filter.toLowerCase());
        }
        
        if (filteredProducts.length === 0) {
            const message = filter === 'all' ? 
                "No featured timepieces available at the moment." :
                `No featured ${filter.charAt(0).toUpperCase() + filter.slice(1)} timepieces available.`;
            watchesGallery.innerHTML = `<p style="text-align:center; color: var(--text-dark-muted); padding: 20px;">${message} Explore our full collection!</p>`;
            return;
        }

        filteredProducts.forEach(product => {
            const cardLink = document.createElement('a');
            cardLink.href = `product-details.html?id=${product.id}`;

            const cardDiv = document.createElement('div');
            cardDiv.classList.add('watch-display-card', 'animated-item', 'type-scale-up');

            const mainImage = product['Main image'] || 'images/placeholder-watch-card.png'; // Adjust placeholder path if needed
            const brandName = product.brand || "Vintage";
            const productName = product.Name || "Vintage Timepiece";
            const description = product.Description ? product.Description.substring(0, 100) + (product.Description.length > 100 ? '...' : '') : "Exquisite craftsmanship.";
            const price = product.Price ? `$${Number(product.Price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "POA";

            cardDiv.innerHTML = `
                <div class="watch-card-image-wrapper"><img src="${mainImage}" alt="${productName}"></div>
                <div class="watch-card-details">
                    <p class="watch-card-brand">${brandName}</p>
                    <h3 class="watch-card-name">${productName}</h3>
                    <p class="watch-card-desc">${description}</p>
                    <p class="watch-card-price">${price}</p>
                </div>
            `;
            
            cardLink.appendChild(cardDiv);
            watchesGallery.appendChild(cardLink);

            // Observe the actual animated element (cardDiv)
            if (window.observeNewAnimatedItem) {
                 window.observeNewAnimatedItem(cardDiv);
            }
        });
    }

    if (collectionFilterBtns.length > 0 && watchesGallery) {
        collectionFilterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                collectionFilterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const filterValue = this.dataset.filter;
                renderHomepageProducts(homepageProductsCache, filterValue);
            });
        });
    }

    // Initial fetch for homepage products if Supabase is ready and on a page with the gallery
    if (watchesGallery) { // Only try to fetch if the gallery element exists on the current page
        if (supabaseInstance) {
            fetchHomepageProducts();
        } else if (typeof supabase === 'undefined') {
            watchesGallery.innerHTML = '<p style="text-align:center; color:red; padding: 20px;">Error: Database connection library not loaded.</p>';
        } else {
            watchesGallery.innerHTML = '<p style="text-align:center; color:red; padding: 20px;">Error: Failed to initialize database connection.</p>';
        }
    }

}); // End DOMContentLoaded