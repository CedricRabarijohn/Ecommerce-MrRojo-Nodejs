const router = require('express').Router()
const PaiementController = require('../controllers/PaiementController')

router.get('/',PaiementController.getPaiements)
router.post('/',PaiementController.createPaiement)
router.post('/testTransaction',PaiementController.testTransaction)
router.delete('/:id',PaiementController.deletePaiement)

module.exports = router