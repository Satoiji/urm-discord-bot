const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    player1: { type: mongoose.Schema.Types.ObjectId, ref: 'players' },
    player2: { type: mongoose.Schema.Types.ObjectId, ref: 'players' },
    created_date: Date,
    game_date: Date,
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'players' }
});

module.exports.schema = schema;