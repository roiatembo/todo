// js/app.js
import { appState } from './modules/state.js';
import { ApiService } from './modules/api.js';
import { CategoryComponent } from './components/Category.js';
import { utils } from './modules/utils.js';

class TodoApp {
  constructor() {
    this.init();
  }
  
  async init() {
    // Initialize state
    this.state = appState;
    this.state.loadFromLocalStorage();
    
    // Apply theme
    document.body.dataset.theme = this.state.theme;
    
    // Subscribe to state changes
    this.state.subscribe((state) => {
      // console.log('State changed:', state);
      this.render(state);
    });
    
    // Initial render
    this.render(this.state);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Event delegation for page buttons
    document.addEventListener('click', (e) => {
      // Page navigation buttons
      if (e.target.matches('[data-page]')) {
        e.preventDefault();
        const page = e.target.dataset.page;
        console.log('Navigating to page:', page);
        this.navigateToPage(page);
      }
      
      // Theme toggle
      if (e.target.matches('.theme-toggle') || e.target.closest('.theme-toggle')) {
        this.toggleTheme();
      }
      
      // Category toggle
      if (e.target.matches('.toggle-btn') || e.target.closest('.toggle-btn')) {
        const categoryEl = e.target.closest('.category');
        if (categoryEl) {
          this.toggleCategory(categoryEl.dataset.id);
        }
      }
      
      // Add Category button
      if (e.target.matches('.add-category-btn')) {
        this.openCategorySheet();
      }
      
      // Add Item button
      if (e.target.matches('.add-item-btn')) {
        const categoryId = e.target.dataset.category;
        this.openItemSheet(categoryId);
      }
      
      // Checkbox toggle
      if (e.target.matches('input[type="checkbox"]')) {
        const itemEl = e.target.closest('.item');
        if (itemEl) {
          const itemId = itemEl.dataset.id;
          const checked = e.target.checked;
          this.toggleItem(itemId, checked);
        }
      }
    });
    
    // Close bottom sheet when clicking outside
    document.addEventListener('click', (e) => {
      const sheet = document.querySelector('.bottom-sheet');
      if (sheet && sheet.classList.contains('show') && 
          !e.target.closest('.bottom-sheet') && 
          !e.target.matches('.open-sheet-btn')) {
        this.closeSheet();
      }
    });
  }
  
  async navigateToPage(page) {
    console.log('Navigating to:', page);
    this.state.setState({ currentPage: page });
    
    // Load data for the page if not landing
    if (page !== 'landing') {
      await this.loadPageData(page);
    }
  }
  
  async loadPageData(page) {
    try {
      // console.log('Loading data for page:', page);
      const data = await ApiService.loadCategories(page);
      console.log('Loaded data:', data);
      
      this.state.setState({
        categories: { 
          ...this.state.categories, 
          [page]: data.categories || [] 
        },
        items: data.items || []
      });
      
      this.state.saveToLocalStorage();
    } catch (error) {
      console.error('Failed to load page data:', error);
      this.showNotification('Failed to load data', 'error');
    }
  }
  
  render(state) {
    // console.log('Rendering with state:', state);
    
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      console.error('App container not found!');
      return;
    }
    
    switch (state.currentPage) {
      case 'landing':
        appContainer.innerHTML = this.renderLanding();
        break;
      case 'personal':
      case 'business':
      case 'budget':
        appContainer.innerHTML = this.renderPage(state.currentPage);
        break;
      default:
        appContainer.innerHTML = this.renderLanding();
    }
    
    // Reattach event listeners for newly created elements
    this.setupEventListeners();
  }
  
  renderLanding() {
    return `
      <div class="page landing">
        <h1>Todo App</h1>
        <p>Select a category to get started</p>
        <div class="landing-buttons">
          <button class="btn btn-primary" data-page="personal">
            Personal
          </button>
          <button class="btn btn-primary" data-page="business">
            Business
          </button>
          <button class="btn btn-primary" data-page="budget">
            Budget
          </button>
        </div>
      </div>
      <button class="theme-toggle" title="Toggle theme">
        🌗
      </button>
    `;
  }
  
  renderPage(page) {
    console.log("understand state",this.state)
    const categories = this.state.categories[page] || [];
    const total = categories.reduce((sum, cat) => sum + (parseFloat(cat.total) || 0), 0);
    
    const categoryItems = categories.map(cat => {
      const items = (this.state.items || []).filter(i => 
        i.category_id == cat.id || i.categoryId == cat.id || i.category == cat.id
      );
      
      const component = new CategoryComponent(cat, items);
      return component.render();
    }).join('');
    
    return `
      <div class="page ${page}">
        <header class="page-header">
          <h1>${this.capitalize(page)}</h1>
          <div class="total-cost">${utils.formatCurrency(total)}</div>
        </header>
        
        <button class="btn btn-primary add-category-btn">
          Add Category
        </button>
        
        <div class="categories-list" id="${page}List">
          ${categoryItems || '<div class="empty-state">No categories yet</div>'}
        </div>
        
        <div class="page-actions">
          <button class="btn btn-secondary" data-page="landing">
            ← Back
          </button>
        </div>
      </div>
      
      <button class="theme-toggle" title="Toggle theme">
        🌗
      </button>
      
      <!-- Bottom Sheet -->
      <div class="bottom-sheet" id="bottomSheet">
        <div class="bottom-sheet-header">
          <h3 id="sheetTitle">Add Category</h3>
          <button class="close-sheet">×</button>
        </div>
        <div class="bottom-sheet-content" id="sheetContent">
          <!-- Content will be filled dynamically -->
        </div>
        <div class="bottom-sheet-actions">
          <button class="btn btn-primary" id="saveSheet">Save</button>
          <button class="btn btn-secondary" id="cancelSheet">Cancel</button>
        </div>
      </div>
    `;
  }
  
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  // Public methods
  toggleTheme() {
    const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
    this.state.setState({ theme: newTheme });
    localStorage.setItem('theme', newTheme);
    document.body.dataset.theme = newTheme;
  }
  
  toggleCategory(categoryId) {
    console.log('Toggling category:', categoryId);
    const categoryEl = document.querySelector(`.category[data-id="${categoryId}"]`);
    console.log("category element", categoryEl);
    if (categoryEl) {
      const itemsEl = categoryEl.querySelector('.category-items');
      const toggleBtn = categoryEl.querySelector('.toggle-btn');
      
      if (itemsEl.style.maxHeight && itemsEl.style.maxHeight !== '0px') {
        itemsEl.style.maxHeight = '0';
        toggleBtn.textContent = '+';
      } else {
        itemsEl.style.maxHeight = itemsEl.scrollHeight + 'px';
        toggleBtn.textContent = '−';
      }
    }
  }
  
  openCategorySheet() {
    console.log('Opening category sheet');
    const sheet = document.getElementById('bottomSheet');
    const content = document.getElementById('sheetContent');
    const title = document.getElementById('sheetTitle');
    
    title.textContent = 'Add Category';
    content.innerHTML = `
      <div class="form-group">
        <input type="text" id="categoryName" class="form-input" placeholder="Category name" autofocus>
      </div>
    `;
    
    sheet.classList.add('show');
    
    // Focus on input
    setTimeout(() => {
      const input = document.getElementById('categoryName');
      if (input) input.focus();
    }, 100);
  }
  
  openItemSheet(categoryId) {
    console.log('Opening item sheet for category:', categoryId);
    const sheet = document.getElementById('bottomSheet');
    const content = document.getElementById('sheetContent');
    const title = document.getElementById('sheetTitle');
    
    title.textContent = 'Add Item';
    
    const categories = this.state.categories[this.state.currentPage] || [];
    
    content.innerHTML = `
      <div class="form-group">
        <label class="form-label">Category</label>
        <select id="itemCategory" class="form-select">
          ${categories.map(cat => `
            <option value="${cat.id}" ${cat.id == categoryId ? 'selected' : ''}>
              ${cat.name}
            </option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Item Name</label>
        <input type="text" id="itemName" class="form-input" placeholder="What needs to be done?" autofocus>
      </div>
      <div class="form-group">
        <label class="form-label">Price (optional)</label>
        <input type="number" id="itemPrice" class="form-input" placeholder="0.00" step="0.01">
      </div>
    `;
    
    sheet.classList.add('show');
  }
  
  closeSheet() {
    const sheet = document.getElementById('bottomSheet');
    if (sheet) {
      sheet.classList.remove('show');
    }
  }
  
  async saveSheet() {
    const sheet = document.getElementById('bottomSheet');
    const title = document.getElementById('sheetTitle');
    
    if (title.textContent === 'Add Category') {
      const nameInput = document.getElementById('categoryName');
      const name = nameInput ? nameInput.value.trim() : '';
      
      if (!name) {
        this.showNotification('Category name is required', 'error');
        return;
      }
      
      try {
        await ApiService.addCategory(this.state.currentPage, name);
        await this.loadPageData(this.state.currentPage);
        this.closeSheet();
        this.showNotification('Category added successfully', 'success');
      } catch (error) {
        console.error('Failed to add category:', error);
        this.showNotification('Failed to add category', 'error');
      }
    } else if (title.textContent === 'Add Item') {
      const categorySelect = document.getElementById('itemCategory');
      const nameInput = document.getElementById('itemName');
      const priceInput = document.getElementById('itemPrice');
      
      const categoryId = categorySelect ? categorySelect.value : '';
      const name = nameInput ? nameInput.value.trim() : '';
      const price = priceInput ? parseFloat(priceInput.value) || 0 : 0;
      
      if (!name) {
        this.showNotification('Item name is required', 'error');
        return;
      }
      
      try {
        await ApiService.addItem(categoryId, name, price);
        await this.loadPageData(this.state.currentPage);
        this.closeSheet();
        this.showNotification('Item added successfully', 'success');
      } catch (error) {
        console.error('Failed to add item:', error);
        this.showNotification('Failed to add item', 'error');
      }
    }
  }
  
  async toggleItem(itemId, done) {
    try {
      await ApiService.toggleItem(itemId, done);
      await this.loadPageData(this.state.currentPage);
    } catch (error) {
      console.error('Failed to toggle item:', error);
      this.showNotification('Failed to update item', 'error');
    }
  }
  
  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app...');
  window.app = new TodoApp();
  
  // Set up sheet actions
  document.addEventListener('click', (e) => {
    if (e.target.matches('#saveSheet')) {
      window.app.saveSheet();
    }
    if (e.target.matches('#cancelSheet') || e.target.matches('.close-sheet')) {
      window.app.closeSheet();
    }
  });
});