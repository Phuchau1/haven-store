const { SupplierModel } = require('../models/Supplier');

exports.getAll = async (req, res) => {
    try {
        const suppliers = await SupplierModel.find().sort({ createdAt: -1 });
        res.json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, email, phone, address, tax_code } = req.body;
        const supplier = new SupplierModel({
            id: `sup-${Math.random().toString(36).substr(2, 9)}`,
            name, email, phone, address, tax_code
        });
        await supplier.save();
        res.status(201).json({ success: true, data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.query;
        const supplier = await SupplierModel.findOneAndUpdate({ id }, req.body, { new: true });
        if (!supplier) return res.status(404).json({ success: false, message: 'Không tìm thấy nhà cung cấp' });
        res.json({ success: true, data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.query;
        const supplier = await SupplierModel.findOneAndDelete({ id });
        if (!supplier) return res.status(404).json({ success: false, message: 'Không tìm thấy nhà cung cấp' });
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
