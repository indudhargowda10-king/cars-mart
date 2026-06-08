// Check Authentication State on Load
document.addEventListener("DOMContentLoaded", () => {
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
}

// Render Inventory Table
async function renderAdminCars() {
  const tbody = document.getElementById("inventory-tbody");
  const countSpan = document.getElementById("inventory-count");
  
  try {
    const res = await fetch('/api/cars');
    const cars = await res.json();
    
    countSpan.innerText = `${cars.length} Cars`;
    tbody.innerHTML = "";

    if (cars.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-muted);">No cars in inventory.</td></tr>`;
      return;
    }

    cars.forEach(car => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><img src="${car.image}" alt="${car.model}" class="inventory-img" onerror="this.src='logo2.png'"></td>
        <td>
          <strong>${car.brand}</strong><br>
          <span style="color: var(--admin-muted); font-size: 0.85rem;">${car.model}</span>
        </td>
        <td>${car.year}</td>
        <td>${car.km}</td>
        <td>${car.ownership || '1st Owner'}</td>
        <td>
          <button class="btn-danger" onclick="deleteCar(${car.id})">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error fetching admin cars", err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-danger);">Failed to load inventory.</td></tr>`;
  }
}

// Helper to compress and convert images to Base64
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
        
        // Convert canvas image to compressed JPEG Base64
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

// Handle Add Car
document.getElementById("add-car-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
  submitBtn.disabled = true;

  try {
    const fileInput = document.getElementById("car-image-upload");
    if (fileInput.files.length === 0) {
      alert("Please select at least one image to upload.");
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      return;
    }

    const base64Images = [];
    for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];
      const nameLower = file.name.toLowerCase();
      let imageBlob = file;

      if (nameLower.endsWith(".heic") || nameLower.endsWith(".heif")) {
        if (typeof heic2any === "undefined") {
          alert("Apple Photo converter is still loading or could not be loaded. Please check your internet connection and try again.");
          submitBtn.innerHTML = originalBtnText;
          submitBtn.disabled = false;
          return;
        }
        try {
          submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Converting Apple Photo ${i+1}...`;
          const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
          imageBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        } catch (convErr) {
          console.error("HEIC conversion error: ", convErr);
          alert(`Failed to convert Apple Photo "${file.name}". It might be corrupted. Please try converting it on your device first.`);
          submitBtn.innerHTML = originalBtnText;
          submitBtn.disabled = false;
          return;
        }
      }

      try {
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Compressing Photo ${i+1}...`;
        const base64Data = await compressAndConvertToBase64(imageBlob, 1000, 0.7);
        base64Images.push(base64Data);
      } catch (compErr) {
        console.error("Compression error: ", compErr);
        alert(`Failed to process and compress image "${file.name}".`);
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        return;
      }
    }

    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving to Database...';

    const primaryImageUrl = base64Images[0];
    const imagesJsonString = JSON.stringify(base64Images);

    // 2. Add the car with the returned Base64 images
    const newCar = {
      brand: document.getElementById("car-brand").value,
      model: document.getElementById("car-model").value,
      category: document.getElementById("car-category").value,
      year: parseInt(document.getElementById("car-year").value),
      km: document.getElementById("car-km").value,
      fuel: document.getElementById("car-fuel").value,
      transmission: document.getElementById("car-transmission").value,
      ownership: document.getElementById("car-ownership").value,
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
