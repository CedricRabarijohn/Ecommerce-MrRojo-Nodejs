const router = require('express').Router()
const AdminController = require('../controllers/AdminController')

router.get('/',AdminController.getAdmins)
router.post('/',AdminController.createAdmin)
router.post('/validerDemandePortefeuille/:idUtilisateur',AdminController.validerDemandePortefeuille)
module.exports = router