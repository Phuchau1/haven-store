const mongoose = require('mongoose');
const { Schema } = mongoose;

const ColorSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    code: { type: String, required: true }
}, { timestamps: true });

const ColorModel = mongoose.models.Color || mongoose.model('Color', ColorSchema);

module.exports = { ColorModel };
