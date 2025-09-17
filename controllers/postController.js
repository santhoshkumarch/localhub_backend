const Post = require('../models/Post');

const getPosts = (req, res) => {
  res.json(Post.getAll());
};

const updatePostStatus = (req, res) => {
  const post = Post.updateStatus(req.params.id, req.body.status);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
};

module.exports = { getPosts, updatePostStatus };