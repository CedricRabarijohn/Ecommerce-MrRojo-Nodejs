const router = require('express').Router()
const UtilisateurController = require('../controllers/UtilisateurController')

router.get('/',UtilisateurController.getUtilisateurs)
router.post('/',UtilisateurController.createUtilisateur)
router.post('/login',UtilisateurController.login)
router.get('/:id',UtilisateurController.getUtilisateursById)
router.delete('/:id',UtilisateurController.deleteUtilisateur)

// router.post('/portefeuille/:id',UtilisateurController.ajouterMontantPortefeuille)
router.post('/portefeuille/demande/:id',UtilisateurController.demandeAugmentationPortefeuille)

module.exports = router