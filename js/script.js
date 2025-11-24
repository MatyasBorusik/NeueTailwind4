// Consolidated site JavaScript for navigation, filters, gallery and swipers
(function(){
  'use strict';

  // Helpers
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  // Mobile menu (shared across pages)
  function initMobileMenu(){
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('overlay');
    const menuIcon = document.getElementById('menuIcon');
    if (!menuBtn || !mobileMenu || !overlay) return;

    function toggleMenu(){
      const isOpen = !mobileMenu.classList.contains('-translate-x-full');
      if (isOpen) {
        mobileMenu.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
        if (menuIcon) menuIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
      } else {
        mobileMenu.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        if (menuIcon) menuIcon.setAttribute('d', 'M6 18L18 6M6 6l12 12');
      }
    }

    // Avoid duplicate handlers
    menuBtn.removeEventListener('click', toggleMenu);
    overlay.removeEventListener('click', toggleMenu);
    menuBtn.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);
  }

  // Swiper initialisation (only if Swiper is loaded and relevant containers exist)
  function initSwipers(){
    // Only proceed if there are swiper containers on the page.
    // Support detection by id, data-init attribute or class so HTML can contain only markers.
    const hasKategorie = !!(document.querySelector('#kategorieSwiper') || document.querySelector('[data-init="kategorieSwiper"]') || document.querySelector('.kategorieSwiper'));
    const hasProdukty = !!(document.querySelector('#produktySwiper') || document.querySelector('[data-init="produktySwiper"]') || document.querySelector('.produktySwiper'));
    if (!hasKategorie && !hasProdukty) return;

    // helper to initialize Swipers after Swiper is available
    function setupSwipers(){
      if (hasKategorie && document.querySelector('.kategorieSwiper')){
        try{
          new Swiper('.kategorieSwiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,
            autoplay: { delay: 4000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.kategorie-next', prevEl: '.kategorie-prev' },
            breakpoints: { 640: { slidesPerView: 2, spaceBetween: 20 }, 1024: { slidesPerView: 3, spaceBetween: 30 } }
          });
        }catch(e){ console.warn('kategorieSwiper init failed', e); }
      }

      if (hasProdukty && document.querySelector('.produktySwiper')){
        try{
          new Swiper('.produktySwiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,
            autoplay: { delay: 4000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.produkty-next', prevEl: '.produkty-prev' },
            breakpoints: { 640: { slidesPerView: 2, spaceBetween: 20 }, 1024: { slidesPerView: 3, spaceBetween: 30 } }
          });
        }catch(e){ console.warn('produktySwiper init failed', e); }
      }
    }

    // small helper to load external JS
    function loadScript(url){
      return new Promise(function(resolve, reject){
        const s = document.createElement('script');
        s.src = url; s.async = true;
        s.onload = () => resolve(); s.onerror = () => reject(new Error('Failed to load '+url));
        document.head.appendChild(s);
      });
    }

    if (typeof Swiper === 'undefined'){
      // load Swiper only when needed
      const cdn = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
      loadScript(cdn).then(()=>{ try{ setupSwipers(); }catch(e){ console.warn('setupSwipers error', e); } }).catch(err=>{ console.warn('Could not load Swiper script:', err); });
    } else {
      setupSwipers();
    }
  }

  // Filters module (from stroje.html)
  function initFilters(){
    const filterPanel = document.getElementById('filter-panel');
    if (!filterPanel) return;
    const filterToggle = document.getElementById('filterToggleBtn');
    const filterArrow = document.getElementById('filter-arrow');
    const filterCount = document.getElementById('filter-count');
    let isOpen = false;

    function openPanel(){
      filterPanel.classList.remove('hidden'); filterPanel.classList.add('open');
      if (filterArrow) filterArrow.style.transform = 'rotate(180deg)'; isOpen = true;
    }
    function closePanel(){
      filterPanel.classList.add('hidden'); filterPanel.classList.remove('open');
      if (filterArrow) filterArrow.style.transform = 'rotate(0deg)'; isOpen = false;
    }

    window.toggleFilters = function(){
      try{
        const panel = document.getElementById('filter-panel');
        const arrow = document.getElementById('filter-arrow');
        if (!panel) return console.warn('filter-panel not found');
        const willOpen = panel.classList.contains('hidden');
        if (willOpen) { panel.classList.remove('hidden'); panel.classList.add('open'); }
        else { panel.classList.add('hidden'); panel.classList.remove('open'); }
        if (arrow) arrow.style.transform = willOpen ? 'rotate(180deg)' : 'rotate(0deg)';
        isOpen = willOpen;
      }catch(err){ console.error('toggleFilters error', err); }
    };

    window.updateFilters = function(){
      const boxes = filterPanel.querySelectorAll('input[type="checkbox"]');
      let c = 0; boxes.forEach(b=>{ if (b.checked) c++; });
      if (filterCount){ if (c>0) { filterCount.textContent = c; filterCount.classList.remove('hidden'); } else { filterCount.classList.add('hidden'); } }
    };

    window.clearAllFilters = function(){
      const boxes = filterPanel.querySelectorAll('input[type="checkbox"]');
      boxes.forEach(b=>b.checked=false); window.updateFilters(); document.querySelectorAll('.machine-card').forEach(card=>card.classList.remove('hidden-filter'));
    };

    window.applyFilters = function(){
      const checked = filterPanel.querySelectorAll('input[type="checkbox"]:checked');
      const active = { kategorie:[], vyrobce:[], typ:[], model:[], system:[], rok:[] };
      checked.forEach(cb=>{ const t = cb.getAttribute('data-filter'); if (t && active[t]) active[t].push(cb.value); });

      const cards = document.querySelectorAll('.machine-card');
      const hasActive = Object.values(active).some(a=>a.length>0);
      if (!hasActive) { cards.forEach(c=>c.classList.remove('hidden-filter')); closePanel(); return; }

      cards.forEach(card=>{
        let show = true;
        for (const key of Object.keys(active)){
          if (active[key].length===0) continue;
          const cv = card.getAttribute('data-'+key);
          if (key==='rok'){
            if (!cv) { show=false; break; }
            const year = parseInt(cv,10);
            const match = active[key].some(r => {
              const ry = parseInt(r,10);
              if (ry===2020) return year>=2020 && year<=2025;
              if (ry===2015) return year>=2015 && year<=2019;
              if (ry===2010) return year>=2010 && year<=2014;
              return false;
            });
            if (!match) { show=false; break; }
          } else {
            if (!cv || !active[key].includes(cv)) { show=false; break; }
          }
        }
        if (show) card.classList.remove('hidden-filter'); else card.classList.add('hidden-filter');
      });

      closePanel();
    };

    // Wire up events
    if (filterToggle) filterToggle.addEventListener('click', function(e){ e.stopPropagation(); window.toggleFilters(); });
    filterPanel.addEventListener('click', function(e){ e.stopPropagation(); });
    document.addEventListener('click', function(e){ if (isOpen && !filterPanel.contains(e.target) && !filterToggle.contains(e.target)) closePanel(); });

    // Buttons previously using inline onclick in HTML
    const clearBtn = document.getElementById('clearFiltersBtn');
    const applyBtn = document.getElementById('applyFiltersBtn');
    if (clearBtn) clearBtn.addEventListener('click', function(e){ e.preventDefault(); window.clearAllFilters(); });
    if (applyBtn) applyBtn.addEventListener('click', function(e){ e.preventDefault(); window.applyFilters(); });

    // Attach change listeners to all filter checkboxes so HTML contains no inline handlers
    try{
      const checkboxList = filterPanel.querySelectorAll('input[type="checkbox"]');
      checkboxList.forEach(cb => {
        try{ cb.removeAttribute('onchange'); }catch(e){}
        try{ cb.removeEventListener('change', window.updateFilters); }catch(e){}
        cb.addEventListener('change', window.updateFilters);
      });
      // initial update of counter
      window.updateFilters();
    }catch(e){ /* ignore */ }

    // Initialize from URL param (run immediately — initFilters is called on DOMContentLoaded)
    try{
      const params = new URLSearchParams(window.location.search);
      const k = params.get('kategorie');
      if (k){
        const boxes = filterPanel.querySelectorAll('input[type="checkbox"]');
        boxes.forEach(b => { if (b.getAttribute('data-filter')==='kategorie' && b.value===k) b.checked = true; });
        window.updateFilters();
        window.applyFilters();
      }
    }catch(e){ /* ignore */ }
  }

  // Karta gallery (image viewer on karta.html)
  function initGallery(){
    const mainImage = document.getElementById('mainImage');
    if (!mainImage) return;

    const images = [
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200',
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200',
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200',
      'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=1200',
      'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1200'
    ];

    let currentIndex = 0;
    function init(){
      const thumbnailContainer = document.getElementById('thumbnailContainer');
      const totalEl = document.getElementById('totalImages');
      if (totalEl) totalEl.textContent = images.length;
      if (!thumbnailContainer) return;
      images.forEach((img, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'flex-shrink-0 w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 transition-all duration-200';
        if (index === 0) { thumb.classList.add('border-white', 'opacity-100'); }
        else { thumb.classList.add('border-transparent', 'opacity-70', 'hover:opacity-100'); }
        const imgEl = document.createElement('img'); imgEl.src = img; imgEl.alt = `Miniatura ${index+1}`; imgEl.className = 'w-full h-full object-cover';
        thumb.appendChild(imgEl);
        thumb.onclick = () => goToImage(index);
        thumbnailContainer.appendChild(thumb);
      });
    }
    function goToImage(index){ currentIndex = index; updateGallery(); }
    function updateGallery(){
      const main = document.getElementById('mainImage'); if (main) main.src = images[currentIndex];
      const currentIndexEl = document.getElementById('currentIndex'); if (currentIndexEl) currentIndexEl.textContent = currentIndex+1;
      const thumbs = document.getElementById('thumbnailContainer').children;
      Array.from(thumbs).forEach((thumb, index) => {
        thumb.className = 'flex-shrink-0 w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 transition-all duration-200';
        if (index === currentIndex) thumb.classList.add('border-white','opacity-100'); else thumb.classList.add('border-transparent','opacity-70','hover:opacity-100');
      });
    }

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.onclick = () => { currentIndex = (currentIndex - 1 + images.length) % images.length; updateGallery(); };
    if (nextBtn) nextBtn.onclick = () => { currentIndex = (currentIndex + 1) % images.length; updateGallery(); };

    init();
  }

  // DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    // Only initialize mobile menu if the page includes the menu marker element.
    // This lets HTML contain only a marker (no inline JS) where the menu logic is needed.
    if (document.getElementById('menuInit')) initMobileMenu();
    initSwipers();
    initFilters();
    initGallery();
  });

})();
