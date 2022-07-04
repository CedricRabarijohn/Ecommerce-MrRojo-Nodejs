const ApiError = require('../err/ApiError')
const utilisateurModel = require('../models/Utilisateur')
const mongoose = require('mongoose')
const Utilisateur = require('../models/Utilisateur')

const getUtilisateurs = async (req, res, next) => {
    try {
        const utilisateurs = await utilisateurModel.find({})
        res.json(utilisateurs)
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}

const getUtilisateursById = async (req, res, next) => {
    try {
        const utilisateurs = await utilisateurModel.findById(mongoose.Types.ObjectId(req.params.id))
        res.json(utilisateurs)
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
    // res.json(req.params.id)
}

const createUtilisateur = async (req, res, next) => {
    const utilisateur = new utilisateurModel(req.body)
    try {
        await utilisateur.save()
        res.json(utilisateur)
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}

const ajouterMontantPortefeuille = async (req, res, next) => {
    const montant = parseInt(req.body?.montant) || 0
    const { id } = req.params
    try {
        const addMontant = await utilisateurModel.findByIdAndUpdate(id, {
            $inc: {
                'portefeuille.montant': montant
            }
        })
        res.json(addMontant)
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const login = async (req,res,next) => {
    const {email, motDePasse} = req.body
    const user = await Utilisateur.findOne({
        email: email,
        motDePasse: motDePasse
    })
    if(!user){
        next(ApiError.serverError(`Invalid match`))
    }else{
        res.json(user)
    }
}

const demandeAugmentationPortefeuille = async (req, res, next) => {
    const montant = parseInt(req.body?.montant) || 0
    const { id } = req.params
    try {
        const addMontant = await utilisateurModel.findByIdAndUpdate(id, {
            $inc: {
                'portefeuille.montantNonConfirme': montant
            }
        })
        res.json(addMontant)
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}

const deleteUtilisateur = async (req, res, next) => {
    const { id } = req.params
    try {
        await utilisateurModel.findByIdAndDelete(id)
        res.json('deleted')
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
module.exports = {
    getUtilisateurs,
    createUtilisateur,
    getUtilisateursById,
    // ajouterMontantPortefeuille,
    demandeAugmentationPortefeuille,
    deleteUtilisateur,
    login
}