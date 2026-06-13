const { MenuModel } = require('../models/Menu');

const getMenus = async (req, res, next) => {
    try {
        const { active } = req.query;
        let query = {};
        
        if (active === 'true') {
            query.isActive = true;
        }

        const menus = await MenuModel.find(query).sort({ order: 1 });
        res.json({ success: true, menus });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMenus
};
