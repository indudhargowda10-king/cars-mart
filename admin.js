// Check Authentication State on Load
document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("cm_admin_token");
  if (token) {
    showDashboard();
  } else {
    document.getElementById("login-screen").style.display = "flex";
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

// Handle Add Car
document.getElementById("add-car-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const newCar = {
    brand: document.getElementById("car-brand").value,
    model: document.getElementById("car-model").value,
    category: document.getElementById("car-category").value,
    year: parseInt(document.getElementById("car-year").value),
    km: document.getElementById("car-km").value,
    fuel: document.getElementById("car-fuel").value,
    transmission: document.getElementById("car-transmission").value,
    ownership: document.getElementById("car-ownership").value,
    image: document.getElementById("car-image").value
  };

  try {
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
    alert("Server error adding car.");
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
