const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');
const { IngredientSchema } = require('../schemas/Schemas');

const InventaireSchema = new mongoose.Schema({
    nom:{
        type:String,
        required:true
    },
    prix:{
        type: Number,
        required:true
    },
    quantite:{
        type: Number,
        required:true,
        default:1
    },
    unite:{
        type: String,
        required: true,
        default:"g"
    },
    valeurUnitaire:{
        type: Number,
        required: true,
        default: 1
    },
    ingredients:{
        type:[IngredientSchema],
        required: false
    },
    description:{
        type:String,
        required:false,
        default:''
    },
    categories:{
        type:[String],
        required:true
    },
    image:{
        type:String,
        required:false,
        default:'null'
    },
    nombreVenteEnProduit:{
        type:Number,
        required:false,
        default:0
    },
    nombreVenteEnRecette:{
        type:Number,
        required: false,
        default: 0
    }
}, {collection: 'inventaire'})

InventaireSchema.plugin(mongoosePaginate)

const Inventaire = mongoose.model('inventaire',InventaireSchema);
module.exports = Inventaire;