// Mock hashtags data
let hashtags = [
  { id: 1, name: 'business', color: 'blue', createdAt: '2024-01-15', usageCount: 45 },
  { id: 2, name: 'food', color: 'green', createdAt: '2024-01-14', usageCount: 32 },
  { id: 3, name: 'shopping', color: 'purple', createdAt: '2024-01-13', usageCount: 28 }
];

class Hashtag {
  static getAll() {
    return hashtags;
  }

  static create(data) {
    const newHashtag = {
      id: Date.now(),
      name: data.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      color: data.color,
      createdAt: new Date().toISOString().split('T')[0],
      usageCount: 0
    };
    hashtags.unshift(newHashtag);
    return newHashtag;
  }

  static delete(id) {
    hashtags = hashtags.filter(h => h.id !== parseInt(id));
    return true;
  }
}

module.exports = Hashtag;