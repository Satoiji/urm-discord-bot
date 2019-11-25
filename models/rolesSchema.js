const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: String,
  priviledge: Number
});

module.exports.schema = schema;