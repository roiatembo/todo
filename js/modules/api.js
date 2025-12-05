// js/modules/api.js
const API_BASE = 'api.php';

export class ApiService {
  static async request(endpoint, data = {}) {
    const url = `${API_BASE}?action=${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  static async loadCategories(page) {
    return this.request('load', { page });
  }
  
  static async addCategory(page, name) {
    return this.request('addCategory', { page, name });
  }
  
  static async addItem(categoryId, name, price) {
    return this.request('addItem', { category: categoryId, name, price });
  }
  
  static async toggleItem(id, done) {
    return this.request('toggleItem', { id, done: done ? 1 : 0 });
  }
  
  static async deleteItem(id) {
    return this.request('deleteItem', { id });
  }
}