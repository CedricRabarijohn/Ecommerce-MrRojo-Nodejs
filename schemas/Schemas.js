const { default: mongoose } = require("mongoose")

const CarteBanquaireSchema = {
    brand: {
        type: String
    },
    panLastFour: {
        type: String
    },
    expirationMonth: {
        type: Number
    },
    expirationYear: {
        type: Number
    },
    cvvVerified: {
        type: Boolean
    }
}
const InventaireSchema = {
    nom: {
        type: String,
        required: true
    },
    prix: {
        type: Number,
        required: true
    },
    quantite: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: false,
        default: ''
    },
    categories: {
        type: [String],
        required: true
    },
    image: {
        type: String,
        required: false,
        default: 'null'
    }
}

const PortefeuilleSchema = {
    motDePasse: {
        type: String,
        required: true,
        defauld: "1234"
    },
    montant: {
        type: Number,
        required: true,
        default: 0
    },
    montantNonConfirme: {
        type: Number,
        required: true,
        default: 0
    }
}
const IngredientSchema = {
    _id: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    nom: {
        type: String,
        required: true
    },
    quantite: {
        type: Number,
        required: true,
        default: 1
    },
    unite: {
        type: String,
        required: true
    }
}
const RecetteSchema = {
    _id: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    nom: {
        type: String,
        required: true
    },
    prixUnitaire: {
        type: Number,
        required: true
    },
    quantite: {
        type: Number,
        required: true
    },
    valeurUnitaire: {
        type: Number,
        required: true
    },
    valeurTotal: {
        type: Number,
        required: true
    },
    valeurUtilisee: {
        type: Number,
        required: true
    },
    valeurNonUtilisee: {
        type: Number,
        required: true
    },
    uniteDeValeur: {
        type: String,
        required: true
    }
}
module.exports = {
    CarteBanquaireSchema,
    InventaireSchema,
    PortefeuilleSchema,
    IngredientSchema,
    RecetteSchema
}