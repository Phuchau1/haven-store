const express = require('express');
const router = express.Router();

const { getBrands, createBrand, updateBrand, deleteBrand } = require('../controllers/brandController');
const { getCollections, createCollection, updateCollection, deleteCollection } = require('../controllers/collectionController');

// Brand routes
router.get('/brands', getBrands);
router.post('/brands', createBrand);
router.put('/brands/:id', updateBrand);
router.delete('/brands/:id', deleteBrand);

// Collection routes
router.get('/collections', getCollections);
router.post('/collections', createCollection);
router.put('/collections/:id', updateCollection);
router.delete('/collections/:id', deleteCollection);

module.exports = router;
