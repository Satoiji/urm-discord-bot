const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: String,
  code: String
});

module.exports.schema = schema;