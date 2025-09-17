// Mock businesses data
let businesses = [
  { id: 1, name: 'Kumar Electronics', category: 'Electronics', owner: 'Rajesh Kumar', phone: '+91 98765 43210', address: 'T. Nagar, Chennai', district: 'Chennai', status: 'active', rating: 4.5, reviewCount: 23, createdAt: '2024-01-15' },
  { id: 2, name: 'Priya Textiles', category: 'Textiles', owner: 'Priya Selvam', phone: '+91 87654 32109', address: 'RS Puram, Coimbatore', district: 'Coimbatore', status: 'active', rating: 4.7, reviewCount: 35, createdAt: '2024-01-12' }
];

class Business {
  static getAll() {
    return businesses;
  }

  static getById(id) {
    return businesses.find(b => b.id === parseInt(id));
  }

  static updateStatus(id, status) {
    const index = businesses.findIndex(b => b.id === parseInt(id));
    if (index === -1) return null;
    businesses[index].status = status;
    return businesses[index];
  }
}

module.exports = Business;