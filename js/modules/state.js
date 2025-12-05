// js/modules/state.js
class AppState {
  constructor() {
    this.categories = {
      personal: [],
      business: [],
      budget: []
    };
    this.items = [];
    this.currentPage = 'landing';
    this.theme = localStorage.getItem('theme') || 'light';
    this.subscribers = [];
  }
  
  subscribe(callback) {
    this.subscribers.push(callback);
  }
  
  setState(newState) {
    Object.assign(this, newState);
    this.notify();
  }
  
  notify() {
    this.subscribers.forEach(callback => callback(this));
  }
  
  // Persistent storage methods
  saveToLocalStorage() {
    localStorage.setItem('todoState', JSON.stringify({
      categories: this.categories,
      items: this.items,
      theme: this.theme
    }));
  }
  
  loadFromLocalStorage() {
    const saved = JSON.parse(localStorage.getItem('todoState'));
    if (saved) {
      this.categories = saved.categories || this.categories;
      this.items = saved.items || this.items;
      this.theme = saved.theme || this.theme;
    }
  }
}

export const appState = new AppState();