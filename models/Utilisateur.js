const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');
const { PortefeuilleSchema } = require('../schemas/Schemas');

const UtilisateurSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    nom:{
        type:String,
        required:true
    },
    portefeuille:{
        type: PortefeuilleSchema,
        required: true,
        default:{
            motDePasse: "1234",
            montant: 0,
            montantNonConfirme:0
        }
    },
    prenom:{
        type:String,
        required:true
    },
    motDePasse:{
        type:String,
        required:true
    },
},{collection:'utilisateur'})

UtilisateurSchema.plugin(mongoosePaginate)
const Utilisateur = mongoose.model('utilisateur', UtilisateurSchema);
module.exports = Utilisateur;