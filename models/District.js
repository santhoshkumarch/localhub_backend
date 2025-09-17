// Mock districts data
const districts = [
  { id: 1, name: 'Chennai', userCount: 1250, businessCount: 340, postsCount: 890, isActive: true },
  { id: 2, name: 'Coimbatore', userCount: 980, businessCount: 280, postsCount: 650, isActive: true },
  { id: 3, name: 'Madurai', userCount: 750, businessCount: 210, postsCount: 480, isActive: true },
  { id: 4, name: 'Salem', userCount: 620, businessCount: 180, postsCount: 390, isActive: true }
];

class District {
  static getAll() {
    return districts;
  }
}

module.exports = District;