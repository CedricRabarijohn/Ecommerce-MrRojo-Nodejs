const ApiError = require('../err/ApiError')
const PaiementModel = require('../models/Paiement')
const CartModel = require('../models/Cart')
const mongoose = require('mongoose')
const Utilisateur = require('../models/Utilisateur')
const Inventaire = require('../models/Inventaire')

const getPaiements = async(req,res,next)=> {
    try{
        const paiements = await PaiementModel.find()
        res.json(paiements)
    }catch(err){
        next(ApiError.serverError(err.message))
        return
    }
}
const createPaiement = async(req,res,next) => {
    try{
        let paiement = new PaiementModel(req.body)
        if(!req.body.cart){
            next(ApiError.unauthorized(`Please provide cart id`))
            return
        }
        let cartObj = await CartModel.findOne({
            _id:req.body.cart,
        })
        if(!cartObj || cartObj == null || cartObj == undefined){
            next(ApiError.serverError(`This card does not exist or is not valable anymore`))
            return
        }
        paiement.cart = cartObj
        paiement.montant = cartObj.total
        try{
            const newPaiement = await paiement.save()
            if(!newPaiement) {
                next(ApiError.serverError(`And error occured,can't pay this`))
                return
            }
            await CartModel.findByIdAndUpdate(req.body.cart,{
                status: false
            })
            await Utilisateur.findByIdAndUpdate(req.body.idUtilisateur,{
                $inc:{
                    'portefeuille.montant': -cartObj.total
                }
            })
            //ahena ny valeur en stock ny ingredient

            //bouclena ny anaty cart deh ampiana anakiray ny nombre de ventee * quantite an'ny inventaire sy
            const inventaires = cartObj.inventaires
            const recettes = cartObj.recettes
            for(let i=0;i<inventaires.length;i++){
                const inv = inventaires[i] 
                console.log(inv)
                await Inventaire.findByIdAndUpdate(inv._id,{
                    $inc:{
                        nombreVenteEnProduit: inv.quantite
                    }
                })
            }
            for(let i=0;i<recettes.length;i++){
                const rec = recettes[i]
                await Inventaire.findByIdAndUpdate(rec._id,{
                    $inc:{
                        nombreVenteEnRecette: rec.quantite
                    }
                })
            }
            // recette anatiny
            res.json(newPaiement)
        }catch(err){
            next(ApiError.serverError(err.message))
            return
        }
    }catch(err){
        next(ApiError.serverError(err.message))
        return
    }
}
const deletePaiement = async(req,res,next) => {
    try{
        const paiement = await PaiementModel.findByIdAndRemove(req.params.id)
        res.json(paiement)
    }catch(err){    
        next(ApiError.serverError(err.message))
    }
}
module.exports = {
    getPaiements,
    createPaiement,
    deletePaiement
}