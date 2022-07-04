const ApiError = require('../err/ApiError')
const InventaireModel = require('../models/Inventaire')
const mongoose = require('mongoose')

const getInventaires = async (req, res, next) => {
    try {
        const options = {
            page: req.query.page || 1,
            limit: req.query.limit || 12
        }
        InventaireModel.paginate({}, options, (err, result) => {
            res.json(result)
        })
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const getInventaireById = async (req, res, next) => {
    try {
        const inventaire = await InventaireModel.findById(mongoose.Types.ObjectId(req.params.id))
        res.json(inventaire)
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const getInventaireByCategorie = async (req, res, next) => {
    try {
        const options = {
            page: req.query.page || 1,
            limit: req.query.limit || 12
        }
        const categories = req.body.categories || ""
        await InventaireModel.paginate({
            categories: {
                $in: categories
            }
        }, options, (err, results) => {
            if (err) {
                next(ApiError.serverError(err.message))
                return
            }
            res.json(results)
        })

    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const getInventaireByNom = async (req, res, next) => {
    try {
        const options = {
            page: req.query.page || 1,
            limit: req.query.limit || 12
        }

        const nom = req.body.nom || ""
        await InventaireModel.paginate({
            nom: {
                $regex: nom, $options: "$i",
            }
        }, options, (err, result) => {
            if (err) {
                next(ApiError.serverError(err.message))
                return
            }
            res.json(result)
        })
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
//search, prixMin, prixMax
const getMultiCritereInventaire = async (req, res, next) => {
    try {
        const options = {
            page: req.query.page || 1,
            limit: req.query.limit || 12
        }
        let categorie = req.query.categorie || ""
        let search = req.query.search || ""
        const searchWords = String(search).toLowerCase().split(" ")
        let prixMin = req.query.prixMin || 0
        let prixMax = req.query.prixMax > 0 & req.query.prixMax > prixMin ? req.query.prixMax : Infinity
        await InventaireModel.paginate({
            $or: [
                {
                    nom: {
                        $regex: search, $options: "$i"
                    }
                }, {
                    description: {
                        $regex: search, $options: "$i"
                    }
                },
                {
                    categories: {
                        $in: searchWords
                    }
                }
            ],
            categories: {
                $regex: categorie, $options: "$i"
            },
            prix: {
                $gte: prixMin,
                $lte: prixMax
            }
        }, options, (err, results) => {
            if (err) {
                next(ApiError.serverError(err.message))
                return
            }
            res.json(results)
        })

    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const createInventaire = async (req, res, next) => {
    try {
        const inventaire = new InventaireModel(req.body)
        try {
            await inventaire.save()
            res.json(inventaire)
        } catch (err) {
            next(ApiError.serverError(err.message))
            return
        }
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const updateInventaire = async (req, res, next) => {
    try {
        await InventaireModel.findByIdAndUpdate(req.params.id, {
            nom: req.body.nom,
            prix: req.body.prix,
            quantite: req.body.quantite,
            description: req.body.description,
            $set: {
                categories: req.body.categories
            },
            image: req.body.image,
            ingredients: req.body.ingredients
        })
        res.json(`Updated ${req.params.id} successfully`)
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const deleteInventaire = async (req, res, next) => {
    const idInventaire = req.params.id
    try {
        await InventaireModel.findByIdAndDelete(idInventaire)
        res.json(`deleted ${idInventaire}`)
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const getRecettes = async (req,res,next) => {
    try{
        const recettes = await InventaireModel.find({
            categories:{
                $in: ["recette"]
            }
        })
        res.json(recettes)
    }catch(err){
        next(ApiError.serverError(err))
        return
    }
}
module.exports = {
    getInventaires,
    getInventaireById,
    getInventaireByCategorie,
    getInventaireByNom,
    getMultiCritereInventaire,
    createInventaire,
    updateInventaire,
    deleteInventaire,
    getRecettes
}