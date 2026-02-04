// Global State
let currentPage = "";
let categories = {
  personal: [],
  business: []
};
let items = [];

let sheetMode = "";
let activeCategory = null;
let activeItem = null;
let pendingAction = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  // Set dark mode as default
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  updateThemeIcon();
});

// Theme Toggle
function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const theme = document.body.getAttribute('data-theme');
  const icon = document.getElementById('themeIcon');
  icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Page Navigation
function openPage(page) {
  document.getElementById("landing").style.display = "none";
  document.getElementById("personal").style.display = "none";
  document.getElementById("business").style.display = "none";
  document.getElementById("budget").style.display = "none";

  document.getElementById(page).style.display = "block";
  currentPage = page;

  loadData();
}

// Bottom Sheet
function openBottomSheet(mode, catId = null, itemId = null) {
  sheetMode = mode;
  activeCategory = catId;
  activeItem = itemId;

  const sheet = document.getElementById("bottomSheet");
  const content = document.getElementById("sheetContent");

  if (mode === "category") {
    document.getElementById("sheetTitle").textContent = "Add Category";
    content.innerHTML = `
      <input id="catName" placeholder="Category Name" autocomplete="off">
    `;
  }

  if (mode === "item") {
    document.getElementById("sheetTitle").textContent = "Add Item";
    content.innerHTML = `
      <select id="itemCategory">
        ${categories[currentPage]
          .map(c => `<option value="${c.id}">${c.name}</option>`)
          .join("")}
      </select>
      <input id="itemName" placeholder="Item Name" autocomplete="off">
      <input id="itemPrice" type="number" placeholder="Price (optional)" step="0.01" min="0">
    `;
    if (catId) {
      document.getElementById("itemCategory").value = catId;
    }
  }

  sheet.classList.add("show");
}

function closeSheet() {
  document.getElementById("bottomSheet").classList.remove("show");
  
  // Clear form after animation
  setTimeout(() => {
    sheetMode = "";
    activeCategory = null;
    activeItem = null;
  }, 350);
}

// Save Category or Item
function saveSheet() {
  if (sheetMode === "category") {
    const name = document.getElementById("catName").value.trim();
    if (!name) {
      showMessage("Please enter a category name", "error");
      return;
    }
    addCategory(name);
  }

  if (sheetMode === "item") {
    const catId = document.getElementById("itemCategory").value;
    const name = document.getElementById("itemName").value.trim();
    const price = document.getElementById("itemPrice").value || 0;
    
    if (!name) {
      showMessage("Please enter an item name", "error");
      return;
    }

    addItem(catId, name, price);
  }
}

// Accordion Toggle
function toggleCategory(element) {
  const category = element.closest('.category');
  const itemsBox = category.querySelector('.category-items');
  const isExpanded = category.classList.contains('expanded');
  
  if (isExpanded) {
    // Close the accordion
    category.classList.remove('expanded');
    itemsBox.style.maxHeight = '0';
  } else {
    // Open the accordion
    category.classList.add('expanded');
    itemsBox.style.maxHeight = itemsBox.scrollHeight + 'px';
  }
}

// Modal Functions
function openModal(message, action) {
  const modal = document.getElementById('confirmModal');
  const messageEl = document.getElementById('confirmMessage');
  messageEl.textContent = message;
  pendingAction = action;
  modal.classList.add('show');
}

function closeModal() {
  const modal = document.getElementById('confirmModal');
  modal.classList.remove('show');
  pendingAction = null;
}

function confirmAction() {
  if (pendingAction) {
    pendingAction();
  }
  closeModal();
}

// ==================== DATABASE OPERATIONS ====================

function loadData() {
  if (!currentPage || (currentPage !== "personal" && currentPage !== "business")) {
    console.error("Invalid currentPage:", currentPage);
    showMessage("Please select a valid page first", "error");
    return;
  }

  showLoading(true);
  
  const url = `api.php?action=load&page=${encodeURIComponent(currentPage)}`;
  
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data || typeof data !== "object") {
        throw new Error("Invalid data format received from server");
      }
      
      categories[currentPage] = Array.isArray(data.categories) ? data.categories : [];
      items = Array.isArray(data.items) ? data.items : [];
      
      console.log(`Loaded ${categories[currentPage].length} categories and ${items.length} items`);
      
      render();
    })
    .catch(error => {
      console.error("Failed to load data:", error);
      showMessage(`Failed to load data: ${error.message}`, "error");
      
      categories[currentPage] = [];
      items = [];
      render();
    })
    .finally(() => {
      showLoading(false);
    });
}

function addCategory(name) {
  console.log("Adding category:", name);
  
  fetch("api.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      action: "addCategory",
      page: currentPage,
      name: name
    })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      showMessage("Category added successfully!", "success");
      closeSheet();
      loadData();
    } else {
      showMessage(data.message || "Failed to add category", "error");
    }
  })
  .catch(error => {
    console.error("Error adding category:", error);
    showMessage("Failed to add category", "error");
  });
}

function addItem(catId, name, price) {
  fetch("api.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      action: "addItem",
      category: catId,
      name: name,
      price: price
    })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      showMessage("Item added successfully!", "success");
      closeSheet();
      loadData();
    } else {
      showMessage(data.message || "Failed to add item", "error");
    }
  })
  .catch(error => {
    console.error("Error adding item:", error);
    showMessage("Failed to add item", "error");
  });
}

function toggleItem(id, checked) {
  if (checked) {
    // Show confirmation modal before marking as done
    openModal("Mark this item as complete?", () => {
      performToggle(id, 1);
    });
  } else {
    performToggle(id, 0);
  }
}

function performToggle(id, done) {
  fetch("api.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      action: "toggleItem",
      id: id,
      done: done
    })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      loadData();
    } else {
      showMessage("Failed to update item", "error");
    }
  })
  .catch(error => {
    console.error("Error toggling item:", error);
    showMessage("Failed to update item", "error");
  });
}

function deleteItem(id, name) {
  openModal(`Are you sure you want to delete "${name}"?`, () => {
    fetch("api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        action: "deleteItem",
        id: id
      })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        showMessage("Item deleted successfully!", "success");
        loadData();
      } else {
        showMessage(data.message || "Failed to delete item", "error");
      }
    })
    .catch(error => {
      console.error("Error deleting item:", error);
      showMessage("Failed to delete item", "error");
    });
  });
}

// ==================== UI RENDERING ====================

function render() {
  const box = document.getElementById(currentPage + "List");
  if (!box) return;
  
  box.innerHTML = "";
  let totalCost = 0;

  if (!categories[currentPage] || !Array.isArray(categories[currentPage])) {
    console.warn(`No categories found for ${currentPage}`);
    return;
  }

  if (!Array.isArray(items)) {
    items = [];
  }

  console.log("Rendering categories:", categories[currentPage]);
  console.log("Rendering items:", items);

  categories[currentPage].forEach(cat => {
    // Calculate category total
    const categoryItems = items.filter(i => 
      i.category_id == cat.id || 
      i.catId == cat.id || 
      i.categoryId == cat.id ||
      i.category == cat.id
    );
    
    const categoryTotal = categoryItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) || 0);
    }, 0);
    
    totalCost += categoryTotal;

    // Create category container
    const catDiv = document.createElement("div");
    catDiv.className = "category";
    
    const headerDiv = document.createElement("div");
    headerDiv.className = "category-header";
    headerDiv.onclick = () => toggleCategory(headerDiv);
    
    headerDiv.innerHTML = `
      <div>
        <b>${cat.name}</b>
        <span style="color: var(--muted); margin-left: 10px;">(K${categoryTotal.toFixed(2)})</span>
      </div>
      <span class="category-arrow">▶</span>
    `;
    
    catDiv.appendChild(headerDiv);

    // Items container
    const itemsBox = document.createElement("div");
    itemsBox.className = "category-items";
    
    if (categoryItems.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.className = "empty-message";
      emptyMsg.textContent = "No items yet. Click 'Add Item' to get started!";
      itemsBox.appendChild(emptyMsg);
    } else {
      categoryItems.forEach(item => {
        const isDone = item.done == 1 || item.completed || item.checked || false;
        const itemPrice = parseFloat(item.price) || 0;

        const itemDiv = document.createElement("div");
        itemDiv.className = "item";

        const contentDiv = document.createElement("div");
        contentDiv.className = "item-content";

        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "item-checkbox";
        checkbox.checked = isDone;
        checkbox.onchange = (e) => {
          e.stopPropagation();
          toggleItem(item.id, e.target.checked);
        };

        // Label
        const label = document.createElement("span");
        label.className = "item-label" + (isDone ? " checked" : "");
        label.textContent = item.name;
        label.onclick = () => checkbox.click();

        // Price
        const price = document.createElement("span");
        price.className = "item-price";
        if (itemPrice > 0) {
          price.textContent = `K${itemPrice.toFixed(2)}`;
        }

        contentDiv.appendChild(checkbox);
        contentDiv.appendChild(label);
        if (itemPrice > 0) {
          contentDiv.appendChild(price);
        }

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "✕";
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          deleteItem(item.id, item.name);
        };

        itemDiv.appendChild(contentDiv);
        itemDiv.appendChild(deleteBtn);
        itemsBox.appendChild(itemDiv);
      });
    }

    // Add Item button
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-small btn-primary";
    addBtn.textContent = "+ Add Item";
    addBtn.onclick = (e) => {
      e.stopPropagation();
      openBottomSheet("item", cat.id);
    };
    itemsBox.appendChild(addBtn);

    catDiv.appendChild(itemsBox);
    box.appendChild(catDiv);
  });

  // Update total cost display
  const personalCost = document.getElementById("total-cost");
  const businessCost = document.getElementById("total-cost-business");
  
  if (personalCost && currentPage === "personal") {
    personalCost.textContent = `K${totalCost.toFixed(2)}`;
  }
  if (businessCost && currentPage === "business") {
    businessCost.textContent = `K${totalCost.toFixed(2)}`;
  }
}

// ==================== HELPER FUNCTIONS ====================

function showMessage(message, type = "info") {
  const existingMsg = document.querySelector(".message");
  if (existingMsg) existingMsg.remove();
  
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${type}`;
  msgDiv.textContent = message;
  
  document.body.appendChild(msgDiv);
  
  setTimeout(() => msgDiv.remove(), 5000);
}

function showLoading(show) {
  let loader = document.getElementById("loadingIndicator");
  
  if (show) {
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "loadingIndicator";
      loader.innerHTML = "Loading...";
      loader.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary);
        color: white;
        padding: 8px 16px;
        border-radius: var(--radius);
        z-index: 1000;
        box-shadow: var(--shadow);
      `;
      document.body.appendChild(loader);
    }
  } else if (loader) {
    loader.remove();
  }
}
