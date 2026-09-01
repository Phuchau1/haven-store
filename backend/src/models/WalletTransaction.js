const mongoose = require('mongoose');
const { Schema } = mongoose;

const WalletTransactionSchema = new Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String },
    type: { 
        type: String, 
        required: true, 
        enum: ['refund', 'deposit', 'payment', 'withdrawal'],
        default: 'refund'
    },
    amount: { type: Number, required: true }, // Dương (+) là cộng tiền, Âm (-) là trừ tiền
    balanceBefore: { type: Number, required: true, default: 0 },
    balanceAfter: { type: Number, required: true, default: 0 },
    orderId: { type: String, default: '' },
    withdrawalRequestId: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed },
    description: { type: String, required: true },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ orderId: 1 });
WalletTransactionSchema.index({ withdrawalRequestId: 1 });

const WalletTransactionModel = mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', WalletTransactionSchema);

module.exports = { WalletTransactionModel };
