const mongoose = require('mongoose');
const { Schema } = mongoose;

const SizeSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true }
}, { timestamps: true });

const SizeModel = mongoose.models.Size || mongoose.model('Size', SizeSchema);

module.exports = { SizeModel };
