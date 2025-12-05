// js/modules/utils.js
export const utils = {
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  formatCurrency(amount) {
    return `K${parseFloat(amount).toFixed(2)}`;
  },
  
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  
  validateInput(value, rules = {}) {
    const errors = [];
    
    if (rules.required && !value.trim()) {
      errors.push('This field is required');
    }
    
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`Minimum ${rules.minLength} characters`);
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`Maximum ${rules.maxLength} characters`);
    }
    
    return errors;
  }
};