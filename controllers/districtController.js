const District = require('../models/District');

const getDistricts = (req, res) => {
  res.json(District.getAll());
};

module.exports = { getDistricts };