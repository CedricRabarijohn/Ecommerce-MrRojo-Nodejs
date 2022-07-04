const ApiError = require('../err/ApiError')
const CategorieModel = require('../models/Categorie')
const mongoose = require('mongoose')

const getCategories = async(req,res,next) => {
    try{
        const categories = await CategorieModel.find({})
        res.json(categories)
    }catch(err){
        next(ApiError.serverError(err.message))
        return
    }
}

const createCategorie = async(req,res,next) => {
    try{
        const categorie = new CategorieModel(req.body)
        await categorie.save()
        res.json(categorie)
    }catch(err){
        next(ApiError.serverError(err.message))
        return
    }
}

module.exports = {
    getCategories,
    createCategorie
}