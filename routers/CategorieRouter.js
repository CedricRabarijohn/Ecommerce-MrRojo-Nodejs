const router = require('express').Router()

const CategorieController = require('../controllers/CategorieController')

router.get('/',CategorieController.getCategories)
router.post('/',CategorieController.createCategorie)

module.exports = router