// js/modules/events.js
export class EventManager {
  constructor() {
    this.handlers = new Map();
  }
  
  delegate(selector, eventType, handler) {
    document.addEventListener(eventType, (e) => {
      if (e.target.matches(selector) || e.target.closest(selector)) {
        handler(e);
      }
    });
  }
  
  // Example usage in app initialization:
  initializeEventDelegation() {
    this.delegate('.category-header', 'click', (e) => {
      const categoryEl = e.target.closest('.category');
      const categoryId = categoryEl.dataset.id;
      this.toggleCategory(categoryId);
    });
    
    this.delegate('.add-item-btn', 'click', (e) => {
      const categoryId = e.target.dataset.category;
      this.openItemSheet(categoryId);
    });
    
    this.delegate('.item input[type="checkbox"]', 'change', (e) => {
      const itemId = e.target.closest('.item').dataset.id;
      this.toggleItem(itemId, e.target.checked);
    });
  }
}