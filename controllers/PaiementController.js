const ApiError = require('../err/ApiError')
const PaiementModel = require('../models/Paiement')
const CartModel = require('../models/Cart')
const mongoose = require('mongoose')
const Utilisateur = require('../models/Utilisateur')
const Inventaire = require('../models/Inventaire')
const Admin = require('../models/Admin')

const getPaiements = async (req, res, next) => {
    try {
        const paiements = await PaiementModel.find()
        res.json(paiements)
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const testTransaction = async (req, res, next) => {
    const conn = mongoose.connection
    const session = await conn.startSession()
    try {
        session.startTransaction()
        const newAdmin = await Admin.findByIdAndUpdate("62bee93362c6caeb80dfcf61", {
            email: "admin"
        }, { session })
        const admin = "letie"

        // admin = "tsy letie"
        await session.commitTransaction()
        res.json("mandeha")
        // const paiement = new PaiementModel
    }
    catch (err) {
        await session.abortTransaction()
        next(ApiError.serverError(err.message))
        return
    }
}
const createPaiement = async (req, res, next) => {
    const conn = mongoose.connection
    const session = await conn.startSession()
    try {
        session.startTransaction()
        let paiement = new PaiementModel(req.body)
        if (!req.body.cart) {
            await session.abortTransaction()
            await session.endSession()
            next(ApiError.unauthorized(`Please provide cart id`))
            return
        }
        let cartObj = await CartModel.findOne({
            _id: req.body.cart,
        })
        if (!cartObj || cartObj == null || cartObj == undefined) {
            await session.abortTransaction()
            await session.endSession()
            next(ApiError.serverError(`This card does not exist or is not valable anymore`))
            return
        }
        paiement.cart = cartObj
        paiement.montant = cartObj.total
        try {
            const newPaiement = await PaiementModel.create([paiement],{session})
            if (!newPaiement) {
                await session.abortTransaction()
                await session.endSession()
                next(ApiError.serverError(`And error occured,can't pay this`))
                return
            }
            const changeStatus = await CartModel.findByIdAndUpdate(req.body.cart, {
                status: false
            },{session})
            if(!changeStatus){
                await session.abortTransaction()
                await session.endSession()
                next(ApiError.serverError("Can't change status"))
                return
            }
            const changeMontant = await Utilisateur.findByIdAndUpdate(req.body.idUtilisateur, {
                $inc: {
                    'portefeuille.montant': -cartObj.total
                }
            },{session})
            if(!changeMontant){
                await session.abortTransaction()
                await session.endSession()
                next(ApiError.serverError("Can't change montant in user"))
                return
            }
            //ahena ny valeur en stock ny ingredient
            //
            const inventaires = cartObj.inventaires
            const recettes = cartObj.recettes
            for (let i = 0; i < inventaires.length; i++) {
                const inv = inventaires[i]
                console.log(inv)
                const update = await Inventaire.findByIdAndUpdate(inv._id, {
                    $inc: {
                        nombreVenteEnProduit: inv.quantite,
                        quantite: -inv.quantite
                    }
                },{session})
                if(!update){
                    await session.abortTransaction()
                    await session.endSession()
                    next(ApiError.serverError("Can't update inventaire"))
                    return
                }
            }
            for (let i = 0; i < recettes.length; i++) {
                const rec = recettes[i]
                const update = await Inventaire.findByIdAndUpdate(rec._id, {
                    $inc: {
                        nombreVenteEnRecette: rec.quantite,
                        quantite: -rec.quantite
                    }
                },{session})
                if(!update){
                    await session.abortTransaction()
                    await session.endSession()
                    next(ApiError.serverError("Can't update inventaire"))
                    return
                }
            }
            res.json(newPaiement)
        } catch (err) {
            console.log(err)
            await session.abortTransaction()
            next(ApiError.serverError("error "+err.message))
            return
        }
        await session.commitTransaction()
    } catch (err) {
        await session.abortTransaction()
        next(ApiError.serverError(err.message))
        return
    }finally{
        await session.endSession()
    }
}
// const createPaiement = async (req, res, next) => {
//     try {
//         let paiement = new PaiementModel(req.body)
//         if (!req.body.cart) {
//             next(ApiError.unauthorized(`Please provide cart id`))
//             return
//         }
//         let cartObj = await CartModel.findOne({
//             _id: req.body.cart,
//         })
//         if (!cartObj || cartObj == null || cartObj == undefined) {
//             next(ApiError.serverError(`This card does not exist or is not valable anymore`))
//             return
//         }
//         paiement.cart = cartObj
//         paiement.montant = cartObj.total
//         try {
//             const newPaiement = await paiement.save()
//             if (!newPaiement) {
//                 next(ApiError.serverError(`And error occured,can't pay this`))
//                 return
//             }
//             await CartModel.findByIdAndUpdate(req.body.cart, {
//                 status: false
//             })
//             await Utilisateur.findByIdAndUpdate(req.body.idUtilisateur, {
//                 $inc: {
//                     'portefeuille.montant': -cartObj.total
//                 }
//             })
//             //ahena ny valeur en stock ny ingredient
//             //
//             const inventaires = cartObj.inventaires
//             const recettes = cartObj.recettes
//             for (let i = 0; i < inventaires.length; i++) {
//                 const inv = inventaires[i]
//                 console.log(inv)
//                 await Inventaire.findByIdAndUpdate(inv._id, {
//                     $inc: {
//                         nombreVenteEnProduit: inv.quantite,
//                         quantite: -inv.quantite
//                     }
//                 })
//             }
//             for (let i = 0; i < recettes.length; i++) {
//                 const rec = recettes[i]
//                 await Inventaire.findByIdAndUpdate(rec._id, {
//                     $inc: {
//                         nombreVenteEnRecette: rec.quantite,
//                         quantite: -rec.quantite
//                     }
//                 })
//             }
//             res.json(newPaiement)
//         } catch (err) {
//             next(ApiError.serverError(err.message))
//             return
//         }
//     } catch (err) {
//         next(ApiError.serverError(err.message))
//         return
//     }
// }
const deletePaiement = async (req, res, next) => {
    try {
        const paiement = await PaiementModel.findByIdAndRemove(req.params.id)
        res.json(paiement)
    } catch (err) {
        next(ApiError.serverError(err.message))
    }
}
module.exports = {
    getPaiements,
    createPaiement,
    deletePaiement,
    testTransaction
}