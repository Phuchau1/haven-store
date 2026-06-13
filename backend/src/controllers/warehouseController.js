const { WarehouseModel } = require('../models/Warehouse');

exports.getAll = async (req, res) => {
    try {
        const warehouses = await WarehouseModel.find().sort({ createdAt: -1 });
        res.json({ success: true, data: warehouses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, code, address, manager_id } = req.body;
        const exists = await WarehouseModel.findOne({ code });
        if (exists) return res.status(400).json({ success: false, message: 'Mã kho đã tồn tại' });

        const warehouse = new WarehouseModel({
            id: `wh-${Math.random().toString(36).substr(2, 9)}`,
            name, code, address, manager_id
        });
        await warehouse.save();
        res.status(201).json({ success: true, data: warehouse });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.query;
        const warehouse = await WarehouseModel.findOneAndUpdate({ id }, req.body, { new: true });
        if (!warehouse) return res.status(404).json({ success: false, message: 'Không tìm thấy kho' });
        res.json({ success: true, data: warehouse });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.query;
        const warehouse = await WarehouseModel.findOneAndDelete({ id });
        if (!warehouse) return res.status(404).json({ success: false, message: 'Không tìm thấy kho' });
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
