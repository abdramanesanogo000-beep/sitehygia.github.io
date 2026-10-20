const mongoose = require('mongoose');

// Compteurs atomiques (ex. numéros de commande) : une incrémentation MongoDB $inc
// garantit un numéro unique même si plusieurs commandes arrivent en même temps
const compteurSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
}, { versionKey: false });

module.exports = mongoose.model('Compteur', compteurSchema);
