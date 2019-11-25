const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    player1: { type: mongoose.Schema.Types.ObjectId, ref: 'players' },
    player2: { type: mongoose.Schema.Types.ObjectId, ref: 'players' },
    created_date: Date
});

module.exports.schema = schema;