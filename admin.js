// Check Authentication State on Load
const brandModelsMap = {
  "Maruti Suzuki": ["Alto", "WagonR", "Swift", "Baleno", "Dzire", "Brezza", "Ertiga", "Grand Vitara", "Celerio", "Ignis", "S-Presso", "Eeco", "XL6", "Jimny", "Fronx"],
  "Hyundai": ["i10 Nios", "i20", "Aura", "Verna", "Creta", "Venue", "Exter", "Alcazar", "Tucson", "Ioniq 5"],
  "Tata": ["Tiago", "Altroz", "Tigor", "Nexon", "Harrier", "Safari", "Punch", "Curvv"],
  "Mahindra": ["Thar", "Scorpio Classic", "Scorpio-N", "XUV300", "XUV700", "Bolero", "Marazzo"],
  "Kia": ["Seltos", "Sonet", "Carens", "EV6"],
  "Toyota": ["Glanza", "Rumion", "Urban Cruiser Taisor", "Innova Crysta", "Innova Hycross", "Fortuner", "Hilux", "Camry", "Vellfire"],
  "Honda": ["Amaze", "City", "Elevate"],
  "Ford": ["Figo", "Figo Aspire", "Freestyle", "EcoSport", "Endeavour", "Mustang"],
  "Renault": ["Kwid", "Triber", "Kiger", "Duster"],
  "Nissan": ["Magnite", "Kicks", "Sunny", "Terrano"],
  "Skoda": ["Slavia", "Kushaq", "Octavia", "Superb", "Kodiaq"],
  "Volkswagen": ["Virtus", "Taigun", "Tiguan", "Polo", "Vento"],
  "MG": ["Comet EV", "Astor", "Hector", "ZS EV", "Gloster"],
  "BMW": ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "i4", "iX"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "EQE"],
  "Audi": ["A3", "A4", "A6", "A8", "Q3", "Q5", "Q7", "Q8", "e-tron"],
  "Other": []
};

function initDependentDropdowns(brandId, modelId, brandCustomId, modelCustomId) {
  const brandSelect = document.getElementById(brandId);
  const modelSelect = document.getElementById(modelId);
  const brandCustomGroup = document.getElementById(brandCustomId);
  const modelCustomGroup = document.getElementById(modelCustomId);
  
  if (!brandSelect || !modelSelect) return;
  
  brandSelect.addEventListener("change", () => {
    const selectedBrand = brandSelect.value;
    
    // Toggle custom brand text input
    if (selectedBrand === "Other") {
      if (brandCustomGroup) brandCustomGroup.style.display = "block";
      const customBrandInput = brandCustomGroup ? brandCustomGroup.querySelector('input') : null;
      if (customBrandInput) customBrandInput.required = true;
    } else {
      if (brandCustomGroup) brandCustomGroup.style.display = "none";
      const customBrandInput = brandCustomGroup ? brandCustomGroup.querySelector('input') : null;
      if (customBrandInput) customBrandInput.required = false;
    }
    
    // Populate models
    modelSelect.innerHTML = '<option value="">Select Model</option>';
    const models = brandModelsMap[selectedBrand] || [];
    models.forEach(model => {
      const opt = document.createElement("option");
      opt.value = model;
      opt.textContent = model;
      modelSelect.appendChild(opt);
    });
    
    // Add "Other" model option
    const otherOpt = document.createElement("option");
    otherOpt.value = "Other";
    otherOpt.textContent = "Other (Type Custom)";
    modelSelect.appendChild(otherOpt);
    
    // Reset model custom input
    if (modelCustomGroup) modelCustomGroup.style.display = "none";
    const customModelInput = modelCustomGroup ? modelCustomGroup.querySelector('input') : null;
    if (customModelInput) customModelInput.required = false;
  });
  
  modelSelect.addEventListener("change", () => {
    if (modelSelect.value === "Other") {
      if (modelCustomGroup) modelCustomGroup.style.display = "block";
      const customModelInput = modelCustomGroup ? modelCustomGroup.querySelector('input') : null;
      if (customModelInput) customModelInput.required = true;
    } else {
      if (modelCustomGroup) modelCustomGroup.style.display = "none";
      const customModelInput = modelCustomGroup ? modelCustomGroup.querySelector('input') : null;
      if (customModelInput) customModelInput.required = false;
    }
  });
}

function initVariantDropdown(selectId, customGroupId) {
  const select = document.getElementById(selectId);
  const customGroup = document.getElementById(customGroupId);
  if (!select) return;
  select.addEventListener("change", () => {
    if (select.value === "Other") {
      if (customGroup) customGroup.style.display = "block";
      const customInput = customGroup ? customGroup.querySelector('input') : null;
      if (customInput) customInput.required = true;
    } else {
      if (customGroup) customGroup.style.display = "none";
      const customInput = customGroup ? customGroup.querySelector('input') : null;
      if (customInput) customInput.required = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Add Car Form Dropdowns
  initDependentDropdowns("car-brand", "car-model", "car-brand-custom-group", "car-model-custom-group");
  initVariantDropdown("car-variant", "car-variant-custom-group");

  // Initialize Edit Car Form Dropdowns
  initDependentDropdowns("edit-car-brand", "edit-car-model", "edit-car-brand-custom-group", "edit-car-model-custom-group");
  initVariantDropdown("edit-car-variant", "edit-car-variant-custom-group");

  const token = sessionStorage.getItem("cm_admin_token");
  if (token) {
    showDashboard();
  } else {
    document.getElementById("login-screen").style.display = "flex";
  }
});

// Theme Switching and Persistence
document.addEventListener("DOMContentLoaded", () => {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    const icon = themeToggleBtn.querySelector('i');
    
    // Function to update icon based on active theme
    const updateThemeIcon = (theme) => {
      if (theme === 'dark') {
        if (icon) {
          icon.className = 'fa-solid fa-sun';
        }
      } else {
        if (icon) {
          icon.className = 'fa-solid fa-moon';
        }
      }
    };

    // Initialize icon based on current document theme
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    updateThemeIcon(currentTheme);

    // Toggle theme on click
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('cm_theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }
});

// Handle Login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("login-error");

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem("cm_admin_token", data.token);
      errorMsg.style.display = "none";
      showDashboard();
    } else {
      errorMsg.style.display = "block";
      errorMsg.innerText = data.message || "Invalid credentials";
    }
  } catch (err) {
    console.error(err);
    errorMsg.style.display = "block";
    errorMsg.innerText = "Server error";
  }
});

// Handle Logout
document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("cm_admin_token");
  document.getElementById("dashboard-screen").style.display = "none";
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("login-form").reset();
});

function showDashboard() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("dashboard-screen").style.display = "block";
  renderAdminCars();
  renderAdminDeliveries();
}

let adminCarsList = [];

// Render Inventory Table
async function renderAdminCars() {
  const tbody = document.getElementById("inventory-tbody");
  const countSpan = document.getElementById("inventory-count");
  
  try {
    const res = await fetch('/api/cars');
    adminCarsList = await res.json();
    
    countSpan.innerText = `${adminCarsList.length} Cars`;
    tbody.innerHTML = "";

    if (adminCarsList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-muted);">No cars in inventory.</td></tr>`;
      return;
    }

    adminCarsList.forEach(car => {
      const tr = document.createElement("tr");
      
      // Formatted Price
      let priceDisplay = "Call";
      if (car.price) {
        const num = parseFloat(car.price);
        if (num >= 100000) {
          priceDisplay = `₹ ${(num / 100000).toFixed(2)} Lakh`;
        } else {
          priceDisplay = `₹ ${num.toLocaleString('en-IN')}`;
        }
      }
      if (car.negotiable) {
        priceDisplay += " (Neg)";
      }

      tr.innerHTML = `
        <td><img src="${car.image}" alt="${car.model}" class="inventory-img" onerror="this.src='logo2.png'"></td>
        <td>
          <strong>${car.brand}</strong><br>
          <span style="color: var(--admin-muted); font-size: 0.85rem;">${car.model} ${car.variant || ''}</span>
        </td>
        <td>
          <span style="font-size: 0.9rem;">${car.year}</span><br>
          <span style="color: var(--admin-muted); font-size: 0.8rem;">${car.fuel}</span>
        </td>
        <td>
          <span style="font-size: 0.9rem;">${car.km.toLocaleString()} km</span><br>
          <strong style="color: var(--admin-primary); font-size: 0.85rem;">${priceDisplay}</strong>
        </td>
        <td>${car.ownership || ''}</td>
        <td style="white-space: nowrap;">
          <button class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-right: 0.3rem;" onclick="editCar(${car.id})">
            <i class="fa-solid fa-edit"></i> Edit
          </button>
          <button class="btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="deleteCar(${car.id})">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    // Apply filters if any search fields are active
    filterInventoryTable();
  } catch (err) {
    console.error("Error fetching admin cars", err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-danger);">Failed to load inventory.</td></tr>`;
  }
}

// Helper to compress and convert files to Base64
async function compressAndConvertFiles(files, progressCallback) {
  const base64List = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const nameLower = file.name.toLowerCase();
    let imageBlob = file;

    if (nameLower.endsWith(".heic") || nameLower.endsWith(".heif")) {
      if (typeof heic2any === "undefined") {
        throw new Error("Apple Photo converter is still loading. Please check your internet connection.");
      }
      if (progressCallback) progressCallback(`Converting Apple Photo ${i+1}/${files.length}...`);
      const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
      imageBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    }

    if (progressCallback) progressCallback(`Compressing Photo ${i+1}/${files.length}...`);
    const base64 = await compressAndConvertToBase64(imageBlob, 1000, 0.7);
    base64List.push(base64);
  }
  return base64List;
}

// Helper to compress and convert single images to Base64
function compressAndConvertToBase64(fileOrBlob, maxWidth = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        let width = img.width;
        let height = img.height;
        
        // Downscale if image exceeds max width
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = function(err) {
        reject(err);
      };
      img.src = e.target.result;
    };
    reader.onerror = function(err) {
      reject(err);
    };
    reader.readAsDataURL(fileOrBlob);
  });
}

// Handle Add Car Showroom Form
document.getElementById("add-car-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;

  try {
    // 1. Convert Brand
    let brand = document.getElementById("car-brand").value;
    if (brand === "Other") {
      brand = document.getElementById("car-brand-custom").value.trim();
    }
    
    // 2. Convert Model
    let model = document.getElementById("car-model").value;
    if (model === "Other") {
      model = document.getElementById("car-model-custom").value.trim();
    }

    // 3. Convert Variant
    let variant = document.getElementById("car-variant").value;
    if (variant === "Other") {
      variant = document.getElementById("car-variant-custom").value.trim();
    }

    // 4. Validate Files
    const fileInput = document.getElementById("car-image-upload");
    if (fileInput.files.length === 0) {
      alert("Please select at least one image to upload.");
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      return;
    }

    // 5. Process main images
    const base64Images = await compressAndConvertFiles(fileInput.files, (msg) => {
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${msg}`;
    });

    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving to Database...';

    const primaryImageUrl = base64Images[0];
    const imagesJsonString = JSON.stringify(base64Images);

    const newCar = {
      brand,
      model,
      variant,
      category: document.getElementById("car-category").value,
      year: parseInt(document.getElementById("car-year").value),
      km: parseInt(document.getElementById("car-km").value),
      color: document.getElementById("car-color").value,
      fuel: document.getElementById("car-fuel").value,
      transmission: document.getElementById("car-transmission").value,
      ownership: document.getElementById("car-ownership").value,
      price: parseFloat(document.getElementById("car-price").value),
      negotiable: document.getElementById("car-negotiable").checked,
      image: primaryImageUrl,
      images: imagesJsonString
    };

    const res = await fetch('/api/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCar)
    });
    
    if (res.ok) {
      renderAdminCars();
      e.target.reset(); // clear form
      
      // Hide custom fields
      document.getElementById("car-brand-custom-group").style.display = "none";
      document.getElementById("car-model-custom-group").style.display = "none";
      document.getElementById("car-variant-custom-group").style.display = "none";
      
      alert("Car added successfully!");
    } else {
      alert("Failed to add car.");
    }
  } catch (err) {
    console.error(err);
    alert(err.message || "Server error adding car.");
  } finally {
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
  }
});

// Edit Car Overlay Form Control
let currentEditingCar = null;

window.editCar = async function(id) {
  const car = adminCarsList.find(c => c.id === id);
  if (!car) return;
  
  currentEditingCar = car;
  
  document.getElementById("edit-car-id").value = car.id;
  
  // Set Brand dropdown
  const brandSelect = document.getElementById("edit-car-brand");
  const brandCustomGroup = document.getElementById("edit-car-brand-custom-group");
  const brandCustomInput = document.getElementById("edit-car-brand-custom");
  
  const knownBrands = ["Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Kia", "Toyota", "Honda", "Ford", "Renault", "Nissan", "Skoda", "Volkswagen", "MG", "BMW", "Mercedes-Benz", "Audi"];
  if (knownBrands.includes(car.brand)) {
    brandSelect.value = car.brand;
    brandCustomGroup.style.display = "none";
    brandCustomInput.value = "";
    brandCustomInput.required = false;
  } else {
    brandSelect.value = "Other";
    brandCustomGroup.style.display = "block";
    brandCustomInput.value = car.brand;
    brandCustomInput.required = true;
  }
  
  // Populate Models based on Brand
  brandSelect.dispatchEvent(new Event("change"));
  
  // Set Model dropdown
  const modelSelect = document.getElementById("edit-car-model");
  const modelCustomGroup = document.getElementById("edit-car-model-custom-group");
  const modelCustomInput = document.getElementById("edit-car-model-custom");
  
  const models = brandModelsMap[brandSelect.value] || [];
  if (models.includes(car.model)) {
    modelSelect.value = car.model;
    modelCustomGroup.style.display = "none";
    modelCustomInput.value = "";
    modelCustomInput.required = false;
  } else {
    modelSelect.value = "Other";
    modelCustomGroup.style.display = "block";
    modelCustomInput.value = car.model;
    modelCustomInput.required = true;
  }
  
  // Set Variant dropdown
  const variantSelect = document.getElementById("edit-car-variant");
  const variantCustomGroup = document.getElementById("edit-car-variant-custom-group");
  const variantCustomInput = document.getElementById("edit-car-variant-custom");
  
  const commonVariants = ["LXI", "VXI", "ZXI", "ZXI+", "XE", "XM", "XT", "XZ", "XZ+", "Era", "Magna", "Asta", "Asta(O)", "Active", "Ambition", "Style", "S", "SX", "SX(O)", "Trend", "Titanium", "Titanium+"];
  if (commonVariants.includes(car.variant)) {
    variantSelect.value = car.variant;
    variantCustomGroup.style.display = "none";
    variantCustomInput.value = "";
    variantCustomInput.required = false;
  } else {
    variantSelect.value = "Other";
    variantCustomGroup.style.display = "block";
    variantCustomInput.value = car.variant || "";
    variantCustomInput.required = true;
  }
  
  // Set generic inputs
  document.getElementById("edit-car-category").value = car.category || "Hatchback";
  document.getElementById("edit-car-year").value = car.year || "";
  document.getElementById("edit-car-km").value = car.km || "";
  document.getElementById("edit-car-color").value = car.color || "White";
  document.getElementById("edit-car-fuel").value = car.fuel || "Petrol";
  document.getElementById("edit-car-transmission").value = car.transmission || "Manual";
  document.getElementById("edit-car-ownership").value = car.ownership || "1st Owner";
  document.getElementById("edit-car-price").value = car.price || "";
  document.getElementById("edit-car-negotiable").checked = car.negotiable || false;
  // Render previews
  renderEditPreviews(car);
  
  // Show Modal
  document.getElementById("edit-car-modal").style.display = "flex";
};

window.closeEditModal = function() {
  document.getElementById("edit-car-modal").style.display = "none";
  document.getElementById("edit-car-form").reset();
  currentEditingCar = null;
};

function renderEditPreviews(car) {
  const carPreview = document.getElementById("edit-car-images-preview");
  
  carPreview.innerHTML = "";
  
  let carImgs = [];
  try {
    carImgs = car.images ? JSON.parse(car.images) : [car.image];
  } catch(e) {
    carImgs = [car.image];
  }
  
  carImgs.filter(Boolean).forEach(img => {
    const wrap = document.createElement("div");
    wrap.className = "preview-thumb-wrap";
    wrap.innerHTML = `<img src="${img}" onerror="this.src='logo2.png'">`;
    carPreview.appendChild(wrap);
  });
}

// Handle Edit Form Submission
document.getElementById("edit-car-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentEditingCar) return;

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving changes...';
  submitBtn.disabled = true;

  try {
    // 1. Convert Brand
    let brand = document.getElementById("edit-car-brand").value;
    if (brand === "Other") {
      brand = document.getElementById("edit-car-brand-custom").value.trim();
    }
    
    // 2. Convert Model
    let model = document.getElementById("edit-car-model").value;
    if (model === "Other") {
      model = document.getElementById("edit-car-model-custom").value.trim();
    }

    // 3. Convert Variant
    let variant = document.getElementById("edit-car-variant").value;
    if (variant === "Other") {
      variant = document.getElementById("edit-car-variant-custom").value.trim();
    }

    // 4. Process new car images if selected
    const fileInput = document.getElementById("edit-car-image-upload");
    let primaryImageUrl = currentEditingCar.image;
    let imagesJsonString = currentEditingCar.images;
    
    if (fileInput.files.length > 0) {
      const base64Images = await compressAndConvertFiles(fileInput.files, (msg) => {
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${msg}`;
      });
      primaryImageUrl = base64Images[0];
      imagesJsonString = JSON.stringify(base64Images);
    }
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating Database...';

    const updatedCar = {
      brand,
      model,
      variant,
      category: document.getElementById("edit-car-category").value,
      year: parseInt(document.getElementById("edit-car-year").value),
      km: parseInt(document.getElementById("edit-car-km").value),
      color: document.getElementById("edit-car-color").value,
      fuel: document.getElementById("edit-car-fuel").value,
      transmission: document.getElementById("edit-car-transmission").value,
      ownership: document.getElementById("edit-car-ownership").value,
      price: parseFloat(document.getElementById("edit-car-price").value),
      negotiable: document.getElementById("edit-car-negotiable").checked,
      image: primaryImageUrl,
      images: imagesJsonString
    };

    const res = await fetch(`/api/cars/${currentEditingCar.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCar)
    });
    
    if (res.ok) {
      renderAdminCars();
      closeEditModal();
      alert("Car updated successfully!");
    } else {
      alert("Failed to update car.");
    }
  } catch (err) {
    console.error(err);
    alert(err.message || "Server error updating car.");
  } finally {
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
  }
});

// Search & Filter Inventory Table Locally
function filterInventoryTable() {
  const brandSearch = document.getElementById("inventory-search-brand").value.toLowerCase();
  const modelSearch = document.getElementById("inventory-search-model").value.toLowerCase();
  
  const rows = document.querySelectorAll("#inventory-tbody tr");
  
  rows.forEach(row => {
    // Skip empty state row
    if (row.cells.length < 5) return;
    
    const brandModelText = row.cells[1].innerText.toLowerCase();
    
    const matchesBrand = brandSearch === "" || brandModelText.includes(brandSearch);
    const matchesModel = modelSearch === "" || brandModelText.includes(modelSearch);
    
    if (matchesBrand && matchesModel) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}
window.filterInventoryTable = filterInventoryTable;

// Handle Delete Car
window.deleteCar = async function(id) {
  if (confirm("Are you sure you want to remove this car from inventory?")) {
    try {
      const res = await fetch(`/api/cars/${id}`, { method: 'DELETE' });
      if (res.ok) {
        renderAdminCars();
      } else {
        alert("Failed to delete car.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error deleting car.");
    }
  }
};

// ==========================================================================
// DELIVERIES MANAGEMENT (NEW STANDALONE OPTION)
// ==========================================================================
let adminDeliveriesList = [];

// Render Deliveries Table
async function renderAdminDeliveries() {
  const tbody = document.getElementById("deliveries-tbody");
  const countSpan = document.getElementById("deliveries-count");
  if (!tbody) return;

  try {
    const res = await fetch('/api/deliveries');
    adminDeliveriesList = await res.json();

    if (countSpan) countSpan.innerText = `${adminDeliveriesList.length} Deliveries`;
    tbody.innerHTML = "";

    if (adminDeliveriesList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--admin-muted);">No deliveries recorded.</td></tr>`;
      return;
    }

    adminDeliveriesList.forEach(del => {
      const tr = document.createElement("tr");

      let images = [];
      try {
        images = del.delivery_images ? JSON.parse(del.delivery_images) : [];
      } catch (e) {
        console.error(e);
      }

      // Render thumbnail strip
      let photoStrip = "";
      if (images.length > 0) {
        photoStrip = `<div class="image-preview-strip" style="display: flex; gap: 0.25rem;">`;
        images.forEach(img => {
          photoStrip += `<img src="${img}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid var(--admin-border);" onerror="this.src='logo2.png'">`;
        });
        photoStrip += `</div>`;
      } else {
        photoStrip = `<span style="font-size: 0.85rem; color: var(--admin-muted); font-style: italic;">No photos</span>`;
      }

      // Format notes snippet
      const notes = del.delivery_notes || "No notes.";

      tr.innerHTML = `
        <td>${photoStrip}</td>
        <td><strong>${del.car_details}</strong></td>
        <td><span style="font-size: 0.9rem;">${del.delivery_date || ''}</span></td>
        <td><span style="font-size: 0.85rem; color: var(--admin-muted);">${notes}</span></td>
        <td style="text-align: center;">
          <button class="btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="deleteDelivery(${del.id})">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error fetching admin deliveries", err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--admin-danger);">Failed to load deliveries.</td></tr>`;
  }
}

// Handle Add Delivery Form
const addDeliveryForm = document.getElementById("add-delivery-form");
if (addDeliveryForm) {
  addDeliveryForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    const progressDiv = document.getElementById("delivery-upload-progress");

    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
    if (progressDiv) {
      progressDiv.style.display = "block";
      progressDiv.innerText = "Processing photos...";
    }

    try {
      const carDetails = document.getElementById("delivery-car-details").value.trim();
      const deliveryDate = document.getElementById("delivery-date").value;
      const deliveryNotes = document.getElementById("delivery-notes").value.trim();
      const fileInput = document.getElementById("delivery-images-upload");

      if (fileInput.files.length === 0) {
        alert("Please select at least one photo of the delivery.");
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        if (progressDiv) progressDiv.style.display = "none";
        return;
      }

      // Convert and compress photos to base64
      const base64Images = await compressAndConvertFiles(fileInput.files, (msg) => {
        if (progressDiv) progressDiv.innerText = msg;
      });

      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

      const payload = {
        car_details: carDetails,
        delivery_date: deliveryDate,
        delivery_notes: deliveryNotes,
        delivery_images: JSON.stringify(base64Images)
      };

      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        renderAdminDeliveries();
        e.target.reset();
        alert("Delivery saved successfully!");
      } else {
        alert("Failed to save delivery.");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Server error saving delivery.");
    } finally {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      if (progressDiv) {
        progressDiv.style.display = "none";
        progressDiv.innerText = "";
      }
    }
  });
}

// Handle Delete Delivery
window.deleteDelivery = async function(id) {
  if (confirm("Are you sure you want to delete this delivery record?")) {
    try {
      const res = await fetch(`/api/deliveries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        renderAdminDeliveries();
      } else {
        alert("Failed to delete delivery.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error deleting delivery.");
    }
  }
};
