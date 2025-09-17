const Business = require('../models/Business');

const getBusinesses = (req, res) => {
  res.json(Business.getAll());
};

const getBusinessById = (req, res) => {
  const business = Business.getById(req.params.id);
  if (!business) return res.status(404).json({ message: 'Business not found' });
  res.json(business);
};

const updateBusinessStatus = (req, res) => {
  const business = Business.updateStatus(req.params.id, req.body.status);
  if (!business) return res.status(404).json({ message: 'Business not found' });
  res.json(business);
};

module.exports = { getBusinesses, getBusinessById, updateBusinessStatus };