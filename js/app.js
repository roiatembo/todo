// js/app.js
import { appState } from './modules/state.js';
import { ApiService } from './modules/api.js';
import { CategoryComponent } from './components/Category.js';
import { EventManager } from './modules/events.js';
import { utils } from './modules/utils.js';

class TodoApp {
  constructor() {
    this.eventManager = new EventManager();
    this.init();
  }
  
  async init() {
    // Load saved state
    appState.loadFromLocalStorage();
    
    // Apply theme
    document.body.dataset.theme = appState.theme;
    
    // Initialize event delegation
    this.eventManager.initializeEventDelegation();
    
    // Subscribe to state changes
    appState.subscribe(this.render.bind(this));
    
    // Load initial data if needed
    if (appState.currentPage !== 'landing') {
      await this.loadPageData(appState.currentPage);
    }
    
    // Render initial UI
    this.render(appState);
  }
  
  async loadPageData(page) {
    try {
      const data = await ApiService.loadCategories(page);
      appState.setState({
        categories: { ...appState.categories, [page]: data.categories },
        items: data.items
      });
    } catch (error) {
      console.error('Failed to load page data:', error);
    }
  }
  
  render(state) {
    const appContainer = document.getElementById('app');
    
    switch (state.currentPage) {
      case 'landing':
        appContainer.innerHTML = this.renderLanding();
        break;
      case 'personal':
      case 'business':
      case 'budget':
        appContainer.innerHTML = this.renderPage(state.currentPage);
        break;
    }
  }
  
  renderLanding() {
    return `
      <div class="page landing">
        <h1>Select Type</h1>
        <button class="btn btn-primary" onclick="app.renderPage('personal')" data-page="personal">Personal</button>
        <button class="btn btn-primary" data-page="business">Business</button>
        <button class="btn btn-primary" data-page="budget">Budget</button>
      </div>
    `;
  }
  
  renderPage(page) {
    const categories = appState.categories[page];
    const total = categories.reduce((sum, cat) => sum + (cat.total || 0), 0);
    
    return `
      <div class="page ${page}">
        <header class="page-header">
          <h1>${this.capitalize(page)}</h1>
          <div class="total-cost">${utils.formatCurrency(total)}</div>
          <button class="theme-toggle" onclick="app.toggleTheme()">🌗</button>
        </header>
        
        <button class="btn btn-primary" onclick="app.openCategorySheet()">
          Add Category
        </button>
        
        <div class="categories-list" id="${page}List">
          ${categories.map(cat => {
            const component = new CategoryComponent(cat, 
              appState.items.filter(i => i.category_id === cat.id)
            );
            return component.render();
          }).join('')}
        </div>
      </div>
    `;
  }
  
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  // Public methods
  toggleTheme() {
    const newTheme = appState.theme === 'light' ? 'dark' : 'light';
    appState.setState({ theme: newTheme });
    localStorage.setItem('theme', newTheme);
  }
  
  openCategorySheet() {
    // Implement bottom sheet logic
  }
}

// Initialize app
window.app = new TodoApp();