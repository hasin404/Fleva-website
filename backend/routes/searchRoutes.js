const router = require('express').Router();
const { searchProducts, searchSuggest } = require('../controllers/searchController');

router.get('/', searchProducts);
router.get('/suggest', searchSuggest);

module.exports = router;
