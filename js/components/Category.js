// js/components/Category.js
export class CategoryComponent {
  constructor(category, items) {
    this.category = category;
    this.items = items;
    this.isExpanded = false;
  }
  
  render() {
    return `
      <div class="category" data-id="${this.category.id}">
        <div class="category-header">
          <h3>${this.category.name}</h3>
          <span class="category-total">K${this.category.total || 0}</span>
          <button class="toggle-btn">${this.isExpanded ? '−' : '+'}</button>
        </div>
        <div class="category-items" style="max-height: ${this.isExpanded ? '500px' : '0'}">
          ${this.renderItems()}
          <button class="add-item-btn" data-category="${this.category.id}">
            Add Item
          </button>
        </div>
      </div>
    `;
  }
  
  renderItems() {
    if (this.items.length === 0) {
      return '<div class="empty-state">No items yet</div>';
    }
    
    return this.items.map(item => `
      <div class="item" data-id="${item.id}">
        <input type="checkbox" ${item.done ? 'checked' : ''}>
        <span class="item-name">${item.name}</span>
        ${item.price ? `<span class="item-price">K${item.price}</span>` : ''}
        <button class="delete-item">×</button>
      </div>
    `).join('');
  }
}