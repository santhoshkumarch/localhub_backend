// Mock posts data
let posts = [
  { id: 1, title: 'New Electronics Store Opening', content: 'Grand opening of Kumar Electronics with 20% discount', author: 'Rajesh Kumar', district: 'Chennai', hashtags: ['electronics', 'discount'], likes: 45, comments: 12, status: 'published', createdAt: '2024-01-15' },
  { id: 2, title: 'Traditional Sarees Collection', content: 'Beautiful collection of traditional Tamil sarees', author: 'Priya Selvam', district: 'Coimbatore', hashtags: ['textiles', 'sarees'], likes: 32, comments: 8, status: 'published', createdAt: '2024-01-14' }
];

class Post {
  static getAll() {
    return posts;
  }

  static updateStatus(id, status) {
    const index = posts.findIndex(p => p.id === parseInt(id));
    if (index === -1) return null;
    posts[index].status = status;
    return posts[index];
  }
}

module.exports = Post;