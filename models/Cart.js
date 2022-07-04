const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');
const { InventaireSchema, RecetteSchema } = require('../schemas/Schemas')
const CartSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    nom: {
        type: String,
        required: true,
        default: 'Cart'
    },
    status: {
        type: Boolean,
        required: true,
        default: true
    },
    quantite: {
        type: Number,
        required: true,
        default: 0
    },
    total: {
        type: Number,
        required: true,
        default: 0
    },
    inventaires: {
        type: [InventaireSchema],
        required: true,
        default: []
    },
    recettes: {
        type:[RecetteSchema],
        required:true,
        default:[]
    }
}, { collection: 'cart' })
CartSchema.plugin(mongoosePaginate)
const CartModel = mongoose.model('cart', CartSchema)
module.exports = CartModel;