const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  discord_id: Number,
  tag: String,
  role: [{ type: mongoose.Schema.Types.ObjectId, ref: 'roles' }],
  created: Date
});

module.exports.schema = userSchema;