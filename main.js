

/* ==========================================================================
   1. LENIS SMOOTH SCROLL & GSAP TICKER
   ========================================================================== */
let lenis = null;
try {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false
  });



  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Link Lenis to GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
} catch(e) {
  // Lenis or GSAP not available — native scroll is fine
  lenis = null;
}

// Helper function to scroll to sections smoothly
function scrollToSection(selector) {
  if (lenis) {
    lenis.scrollTo(selector, { offset: -80 });
  } else {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Intercept all hash links to use smooth scroll and prevent native jump (which looks like a reload)
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = this.getAttribute('href');
      if (target !== '#') {
        e.preventDefault();
        scrollToSection(target);
      }
    });
  });
});

/* ==========================================================================
   1b. HERO VIDEO BACKGROUND INIT
   ========================================================================== */
(function initHeroVideo() {
  const video = document.querySelector('.hero-video-bg');
  if (!video) return;

  function onReady() {
    try {
      gsap.fromTo(video,
        { opacity: 0, scale: 1 },
        { opacity: 1, duration: 1.8, ease: 'power2.out' }
      );
      gsap.to(video, {
        scale: 1.06,
        duration: 18,
        ease: 'none',
        repeat: -1,
        yoyo: true
      });
    } catch(e) {
      video.style.opacity = '1';
    }
  }

  if (video.readyState >= 2) {
    onReady();
  } else {
    video.addEventListener('canplay', onReady, { once: true });
    setTimeout(() => { video.style.opacity = '1'; }, 2500);
  }
})();


/* ==========================================================================
   2. GSAP SCROLLTRIGGERS & NAVBAR STYLES
   ========================================================================== */
try {
  ScrollTrigger.create({
    start: "top -50",
    end: 99999,
    onToggle: (self) => {
      const navbar = document.getElementById("navbar");
      if (self.isActive) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }
  });
} catch(e) {
  // ScrollTrigger not available, use scroll event fallback
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById("navbar");
    if (window.scrollY > 50) navbar.classList.add("scrolled");
    else navbar.classList.remove("scrolled");
  });
}

// Hero text entrance animations — defined as a function triggered after loader
function animateHeroEntrance() {
  try {
    gsap.fromTo(".hero-title",
      { y: 80, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.2 }
    );
    gsap.fromTo(".hero-subtitle",
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.4 }
    );
    gsap.fromTo(".hero-buttons",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.6 }
    );
  } catch(e) {
    // GSAP not available — elements are visible by default via CSS
  }
}

// Trigger entrance animation immediately
animateHeroEntrance();


/* ==========================================================================
   3. VEHICLE INVENTORY DATA (8 PREMIUM PRE-OWNED VEHICLES)
   ========================================================================== */
const carsData = [
  {
    id: 1,
    brand: "Toyota",
    model: "Fortuner 2.8 4x2",
    category: "SUV",
    year: 2020,
    km: "45,000 km",
    fuel: "Diesel",
    transmission: "Automatic",
    image: "public/images/fortuner.png"
  },
  {
    id: 2,
    brand: "Toyota",
    model: "Glanza V",
    category: "Hatchback",
    year: 2022,
    km: "15,000 km",
    fuel: "Petrol",
    transmission: "Automatic",
    image: "public/images/glanza.png"
  },
  {
    id: 3,
    brand: "Toyota",
    model: "Innova Crysta 2.4 GX",
    category: "MUV",
    year: 2020,
    km: "65,000 km",
    fuel: "Diesel",
    transmission: "Manual",
    image: "public/images/innova.png"
  },
  {
    id: 4,
    brand: "Tata",
    model: "Harrier XZ+",
    category: "SUV",
    year: 2022,
    km: "22,000 km",
    fuel: "Diesel",
    transmission: "Manual",
    image: "public/images/harrier.png"
  },
  {
    id: 5,
    brand: "Hyundai",
    model: "Creta SX",
    category: "SUV",
    year: 2021,
    km: "34,200 km",
    fuel: "Petrol",
    transmission: "Manual",
    image: "public/images/creta.png"
  },
  {
    id: 6,
    brand: "Hyundai",
    model: "Verna SX(O)",
    category: "Sedan",
    year: 2021,
    km: "32,000 km",
    fuel: "Petrol",
    transmission: "Manual",
    image: "public/images/verna.png"
  },
  {
    id: 7,
    brand: "Honda",
    model: "City V MT",
    category: "Sedan",
    year: 2019,
    km: "41,000 km",
    fuel: "Petrol",
    transmission: "Manual",
    image: "public/images/city.png"
  },
  {
    id: 8,
    brand: "Mahindra",
    model: "XUV500 W7",
    category: "SUV",
    year: 2018,
    km: "72,000 km",
    fuel: "Diesel",
    transmission: "Manual",
    image: "public/images/xuv500.png"
  }
];

// Active Filters State
let currentFilteredCars = [...carsData];

/* ==========================================================================
   4. RENDER MARKETPLACE GRID CARDS
   ========================================================================== */
function renderCarsGrid(carsList) {
  const container = document.getElementById("cars-grid-container");
  if (!container) return;
  container.innerHTML = "";
  
  if (carsList.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--accent-orange); margin-bottom: 1rem;"></i>
        <h3>No Cars Found</h3>
        <p style="color: var(--text-muted);">Try adjusting your search filters to find available verified cars.</p>
        <button class="btn-card-detail" style="margin-top: 1.5rem;" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }
  
  carsList.forEach(car => {
    const card = document.createElement("div");
    card.className = "car-card";
    card.innerHTML = `
      <div class="car-card-img-wrap" onclick="triggerCarModal(${car.id})">
        <span class="inspected-badge"><i class="fa-solid fa-circle-check"></i> Inspected</span>
        <img src="${car.image}" alt="${car.brand} ${car.model}">
      </div>
      <div class="car-card-content">
        <h3 class="car-card-title">${car.brand} ${car.model}</h3>
        <div class="car-card-specs">
          <span>${car.year}</span>
          <span>${car.km}</span>
          <span>${car.fuel}</span>
          <span>${car.transmission}</span>
        </div>
        <div class="car-card-footer">
          <div class="car-card-price-wrap">
            <span class="car-card-price" style="font-size: 1.05rem; display: flex; align-items: center; gap: 0.35rem;">
              <i class="fa-solid fa-certificate" style="color: var(--accent-orange);"></i> Certified Premium
            </span>
          </div>
        </div>
        <div class="car-card-actions">
          <button class="btn-card-detail" onclick="triggerCarModal(${car.id})">Details</button>
          <button class="btn-card-whatsapp" onclick="sendWhatsAppInquiry(${car.id})"><i class="fa-brands fa-whatsapp"></i> Inquiry</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  
  // Car-card entrance is handled by CSS @keyframes fadeInUp
}

// Initial Grid Render
renderCarsGrid(carsData);

/* ==========================================================================
   5. SEARCH FILTER LOGIC
   ========================================================================== */
function handleSearchSubmit() {
  const brand = document.getElementById("search-brand").value;
  const fuel = document.getElementById("search-fuel").value;
  const transmission = document.getElementById("search-transmission").value;
  const year = document.getElementById("search-year").value;
  
  currentFilteredCars = carsData.filter(car => {
    if (brand && car.brand !== brand) return false;
    if (fuel && car.fuel !== fuel) return false;
    if (transmission && car.transmission !== transmission) return false;
    if (year && car.year < parseInt(year)) return false;
    return true;
  });
  
  // Highlight search filter state
  updateFilterPills(null);
  
  renderCarsGrid(currentFilteredCars);
  scrollToSection("#featured-cars");
}

function filterByCategory(category) {
  currentFilteredCars = carsData.filter(car => car.category === category);
  
  // Highlight active filter pill
  updateFilterPills(category);
  
  renderCarsGrid(currentFilteredCars);
  scrollToSection("#featured-cars");
}

function resetFilters() {
  currentFilteredCars = [...carsData];
  
  // Reset form inputs
  const form = document.getElementById("search-form");
  if (form) form.reset();
  
  // Reset active filter pills
  updateFilterPills("all");
  
  renderCarsGrid(carsData);
}

function updateFilterPills(activeCategory) {
  const pills = {
    all: document.getElementById("btn-filter-all"),
    Hatchback: document.getElementById("btn-filter-hatch"),
    Sedan: document.getElementById("btn-filter-sedan"),
    SUV: document.getElementById("btn-filter-suv")
  };
  
  Object.keys(pills).forEach(key => {
    if (pills[key]) {
      pills[key].style.background = "transparent";
      pills[key].style.color = "var(--primary)";
      pills[key].style.borderColor = "var(--primary)";
    }
  });
  
  if (activeCategory && pills[activeCategory]) {
    pills[activeCategory].style.background = "var(--primary)";
    pills[activeCategory].style.color = "#FFF";
    pills[activeCategory].style.borderColor = "var(--primary)";
  }
}

/* ==========================================================================
   6. WHITE CAR SLIDER LOGIC
   ========================================================================== */
let activeSlideIndex = 0;
const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".slider-dot");
let isSliderTransitioning = false;

function slideTo(index) {
  if (isSliderTransitioning || index === activeSlideIndex || !slides.length) return;
  isSliderTransitioning = true;
  
  const currentSlide = slides[activeSlideIndex];
  const nextSlide = slides[index];
  
  // Update Dot Classes
  if (dots[activeSlideIndex]) dots[activeSlideIndex].classList.remove("active");
  if (dots[index]) dots[index].classList.add("active");
  
  // Transition old out, new in
  const directionClass = index > activeSlideIndex ? "exit-left" : "exit-right";
  
  currentSlide.classList.add(directionClass);
  currentSlide.classList.remove("active");
  
  nextSlide.style.transform = index > activeSlideIndex ? "translateX(100px)" : "translateX(-100px)";
  nextSlide.style.opacity = "0";
  nextSlide.classList.add("active");
  
  // Small timeout to allow reflow, then animate new
  setTimeout(() => {
    nextSlide.style.transform = "translateX(0)";
    nextSlide.style.opacity = "1";
    
    // GSAP Spec text stagger entry
    const title = nextSlide.querySelector(".slide-car-name");
    const badge = nextSlide.querySelector(".slide-car-badge") || nextSlide.querySelector(".slide-car-price");
    const specs = nextSlide.querySelector(".slide-specs-grid");
    const button = nextSlide.querySelector(".btn-slide-detail");
    const img = nextSlide.querySelector(".slide-image-right img");
    
    const animElements = [title, badge, specs, button].filter(Boolean);
    
    try {
      gsap.fromTo(animElements, 
        { opacity: 0, x: -30 }, 
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }
      );
      gsap.fromTo(img, 
        { opacity: 0, scale: 0.9, x: 40 }, 
        { opacity: 1, scale: 1, x: 0, duration: 0.8, ease: "power3.out" }
      );
    } catch(e) {
      // Graceful fallback if GSAP fails
    }
    
    // Clean exit classes after transition completes
    setTimeout(() => {
      currentSlide.classList.remove("exit-left", "exit-right");
      activeSlideIndex = index;
      isSliderTransitioning = false;
    }, 600);
  }, 50);
}

function slideNext() {
  if (!slides.length) return;
  let nextIndex = (activeSlideIndex + 1) % slides.length;
  slideTo(nextIndex);
}

function slidePrev() {
  if (!slides.length) return;
  let prevIndex = (activeSlideIndex - 1 + slides.length) % slides.length;
  slideTo(prevIndex);
}


/* ==========================================================================
   7. VALUATION LEAD FORM LOGIC & MODALS
   ========================================================================== */
function handleSellSubmit() {
  const name = document.getElementById("sell-name").value;
  const phone = document.getElementById("sell-phone").value;
  const brand = document.getElementById("sell-brand").value;
  const model = document.getElementById("sell-model").value;
  const year = document.getElementById("sell-year").value;
  const remarks = document.getElementById("sell-remarks") ? document.getElementById("sell-remarks").value : "";
  
  const message = `Valuation request received for ${name}'s ${year} ${brand} ${model}.
  <br><br>
  <strong>Car Remarks/Condition:</strong> ${remarks || "None provided"}
  <br><br>
  We have sent a text notification to <strong>${phone}</strong>. Our inspector will call you shortly to arrange a free doorstep inspection.`;
  
  document.getElementById("success-message").innerHTML = message;
  document.getElementById("success-modal").classList.add("active");
  
  const form = document.getElementById("sell-form");
  if (form) form.reset();
}

function closeSuccessModal() {
  document.getElementById("success-modal").classList.remove("active");
}

/* ==========================================================================
   8. CAR DETAILS SPEC MODAL
   ========================================================================== */
function triggerCarModal(carId) {
  const car = carsData.find(c => c.id === carId);
  if (!car) return;
  
  document.getElementById("modal-car-name").innerText = `${car.brand} ${car.model}`;
  document.getElementById("modal-car-img").src = car.image;
  document.getElementById("modal-car-year").innerText = car.year;
  document.getElementById("modal-car-km").innerText = car.km;
  document.getElementById("modal-car-fuel").innerText = car.fuel;
  document.getElementById("modal-car-transmission").innerText = car.transmission;
  
  const statusEl = document.getElementById("modal-car-status");
  const warrantyEl = document.getElementById("modal-car-warranty");
  if (statusEl) statusEl.innerText = "Available";
  if (warrantyEl) warrantyEl.innerText = "1-Year Warranty Included";
  
  // Custom WhatsApp message (no price references)
  const waMessage = `Hi Car Mart, I am interested in the verified used ${car.brand} ${car.model} (${car.year}). Please share availability and details.`;
  const waLink = document.getElementById("modal-whatsapp-link");
  if (waLink) waLink.href = `https://wa.me/919008740899?text=${encodeURIComponent(waMessage)}`;
  
  document.getElementById("car-modal").classList.add("active");
}

function closeCarModal() {
  document.getElementById("car-modal").classList.remove("active");
}

function sendWhatsAppInquiry(carId) {
  const car = carsData.find(c => c.id === carId);
  if (!car) return;
  
  const waMessage = `Hi Car Mart, I am interested in inquiring about the verified used ${car.brand} ${car.model} (${car.year}).`;
  window.open(`https://wa.me/919008740899?text=${encodeURIComponent(waMessage)}`, '_blank');
}

// Close modals when clicking overlay background
document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", function(e) {
    if (e.target === this) {
      this.classList.remove("active");
    }
  });
});

/* ==========================================================================
   9. PREMIUM SHOWROOM GALLERY DYNAMIC INTERACTIONS
   ========================================================================== */
function filterGallery(category, buttonEl) {
  // Update active state of button tabs
  const filterBtns = document.querySelectorAll(".gallery-filter-btn");
  filterBtns.forEach(btn => btn.classList.remove("active"));
  if (buttonEl) {
    buttonEl.classList.add("active");
  }

  const items = document.querySelectorAll(".gallery-item");
  let visibleCount = 0;

  // Scale and fade out items, filter, then scale and fade in matching items
  gsap.to(items, {
    opacity: 0,
    scale: 0.94,
    y: 20,
    duration: 0.35,
    stagger: 0.02,
    ease: "power2.inOut",
    onComplete: () => {
      items.forEach(item => {
        const itemCat = item.getAttribute("data-category");
        if (category === "All" || itemCat === category) {
          item.style.display = ""; // Show
          visibleCount++;
        } else {
          item.style.display = "none"; // Hide
        }
      });

      // Update counter text
      const totalCount = items.length;
      const countTextEl = document.getElementById("gallery-count-text");
      if (countTextEl) {
        countTextEl.innerText = `Showing ${visibleCount} of ${totalCount} premium vehicles`;
      }

      // Filter to retrieve only matching visible items
      const visibleItems = Array.from(items).filter(item => item.style.display !== "none");

      gsap.to(visibleItems, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.03,
        ease: "power3.out",
        clearProps: "scale,y,opacity" // Keep CSS parameters clean for subsequent mouse tilts
      });
    }
  });
}

// Self-invoking showroom mouse tracker and 3D parallax tilt controller
(function initShowroomInteractions() {
  const galleryItems = document.querySelectorAll(".gallery-item");
  if (!galleryItems.length) return;

  galleryItems.forEach(item => {
    // Mouse hover mouse tracker coordinates
    item.addEventListener("mousemove", (e) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      item.style.setProperty("--mouse-x", `${x}px`);
      item.style.setProperty("--mouse-y", `${y}px`);

      // 3D Parallax Tilt Calculation
      const width = rect.width;
      const height = rect.height;
      const centerX = rect.left + width / 2;
      const centerY = rect.top + height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      const maxRotateX = 6;
      const maxRotateY = 6;

      const rotateX = -1 * (mouseY / (height / 2)) * maxRotateX;
      const rotateY = (mouseX / (width / 2)) * maxRotateY;

      item.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.025, 1.025, 1.025)`;
    });

    // Reset rotations smoothly when mouse leaves the card bounds
    item.addEventListener("mouseleave", () => {
      item.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      item.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)";
    });

    // Clear smooth reset transitions when mouse re-enters so tilt responds instantly
    item.addEventListener("mouseenter", () => {
      item.style.transition = "none";
    });
  });
})();

/* ==========================================================================
   10. LOADING SCREEN LOGIC
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const loaderBg = document.getElementById("cm-loader-bg");
  if (loaderBg) {
    const movingCar = loaderBg.querySelector(".cm-moving-car");
    const fullLogo = loaderBg.querySelector(".cm-full-logo");

    // 1. Start car animation
    setTimeout(() => {
      if (movingCar) movingCar.classList.add("cm-drive-animation");
    }, 200);

    // 2. Wait for car to finish driving (3s), then reveal logo
    setTimeout(() => {
      if (fullLogo) fullLogo.classList.add("cm-reveal-logo");
    }, 3200);

    // 3. Wait for logo reveal (approx 1s), then fade out loader
    setTimeout(() => {
      loaderBg.classList.add("cm-loader-hide");
    }, 4500);
    
    // 4. Remove from DOM
    setTimeout(() => {
      loaderBg.remove();
    }, 5000);
  }
});
