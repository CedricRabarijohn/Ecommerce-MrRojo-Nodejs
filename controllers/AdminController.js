const ApiError = require('../err/ApiError')
const adminModel = require('../models/Admin')
const utilisateurModel = require('../models/Utilisateur')
const getAdmins = async (req, res, next) => {
	const admins = await adminModel.find()
	try {
		res.status(200).send(admins)
	} catch (err) {
		next(ApiError.serverError(err.message))
		return
	}
}
const validerDemandePortefeuille = async (req, res, next) => {
	const { idUtilisateur } = req.params
	try {
		const user = await utilisateurModel.findById(idUtilisateur)
		const montantAValider = user.portefeuille.montantNonConfirme
		const addMontant = await utilisateurModel.findByIdAndUpdate(idUtilisateur, {
			$inc: {
				'portefeuille.montant': montantAValider,
				'portefeuille.montantNonConfirme': -montantAValider
			}
		})
		res.json("Added the montant")
	} catch (err) {
		next(ApiError.serverError(err.message))
		return
	}
}
const createAdmin = async (req, res, next) => {
	const admin = new adminModel(req.body)
	try {
		await admin.save()
		res.send(admin)
	} catch (err) {
		next(ApiError.serverError(err.message))
		return
	}
}

module.exports = {
	getAdmins,
	createAdmin,
	validerDemandePortefeuille
}