const Hashtag = require('../models/Hashtag');

const getHashtags = (req, res) => {
  res.json(Hashtag.getAll());
};

const createHashtag = (req, res) => {
  const hashtag = Hashtag.create(req.body);
  res.status(201).json(hashtag);
};

const deleteHashtag = (req, res) => {
  Hashtag.delete(req.params.id);
  res.json({ message: 'Hashtag deleted' });
};

module.exports = { getHashtags, createHashtag, deleteHashtag };