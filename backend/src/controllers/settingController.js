const { SiteSettingModel } = require('../models/SiteSetting');


const getSettings = async (req, res, next) => {
    try {


        const settings = await SiteSettingModel.find();
        if (!settings || settings.length === 0) {
            return res.json({ success: true, settings: {} });
        }

        const settingsMap = settings.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});
        res.json({ success: true, settings: settingsMap });
    } catch (error) {
        next(error);
    }
};

const updateSettings = async (req, res, next) => {
    try {
        const updates = req.body; // Expect an object of key-value pairs
        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
        }

        const promises = Object.entries(updates).map(([key, value]) => {
            return SiteSettingModel.findOneAndUpdate(
                { key },
                { value },
                { new: true, upsert: true }
            );
        });

        await Promise.all(promises);
        
        const settings = await SiteSettingModel.find();
        const settingsMap = settings.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});

        res.json({ success: true, message: 'Cập nhật cài đặt thành công', settings: settingsMap });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSettings,
    updateSettings
};
