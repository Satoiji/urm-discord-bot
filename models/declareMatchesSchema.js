const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    declare: { type: mongoose.Schema.Types.ObjectId, ref: 'players' },
    opponent: { type: mongoose.Schema.Types.ObjectId, ref: 'players' },
    created_date: Date
});

module.exports.schema = schema;