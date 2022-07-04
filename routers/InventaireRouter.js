const router = require('express').Router()
const InventaireController = require('../controllers/InventaireController')

router.get('/',InventaireController.getInventaires)
router.get('/sortByCategorie',InventaireController.getInventaireByCategorie)
// router.get('/sortByNom',InventaireController.getInventaireByNom)
router.get('/rechercheMulticritere',InventaireController.getMultiCritereInventaire)
router.get('/recettes',InventaireController.getRecettes)
router.get('/:id',InventaireController.getInventaireById)
router.post('/',InventaireController.createInventaire)
router.put('/:id',InventaireController.updateInventaire)
router.delete('/:id',InventaireController.deleteInventaire)


module.exports = router