const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');
const PaiementSchema = mongoose.Schema({
    idUtilisateur: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    cart: {
        type: Object,
        required: true
    },
    montant: {
        type:Number,
        required:true
    },
    estLivre:{
        type:Boolean,
        required:true,
        default:false
    }
},{collection:'paiement'})
PaiementSchema.plugin(mongoosePaginate)
const PaiementModel = mongoose.model('paiement',PaiementSchema)
module.exports = PaiementModel;