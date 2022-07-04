const router = require('express').Router()
const UtilsController = require('../controllers/UtilsController');

router.get('/',UtilsController.generateObjectId)

module.exports = router