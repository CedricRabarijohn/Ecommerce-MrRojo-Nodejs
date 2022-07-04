const ApiError = require('../err/ApiError')
const CartModel = require('../models/Cart')
const UtilisateurModel = require('../models/Utilisateur')
const InventaireModel = require('../models/Inventaire')
const mongoose = require('mongoose')

const redoCart = (theCart) => {
    try {
        let cart = theCart
        const inventaires = cart.inventaires
        const recettes = cart.recettes
        let total = 0;
        let quantite = 0;
        for (let i = 0; i < inventaires.length; i++) {
            quantite += parseInt(inventaires[i].quantite)
            total += parseInt(inventaires[i].quantite) * parseInt(inventaires[i].prix)
        }
        cart.total = total
        cart.quantite = quantite
        return cart
    } catch (err) {
        return null
    }
}
const getRedoedCart = async (req, res, next) => {
    const { cart } = req.body
    const redoed = redoCart(cart)
    res.json(redoed)
}
const getRedoedCartAndChangeInDatabase = async (req, res, next) => {
    try {
        const { cart } = req.body
        const redoed = redoCart(cart)
        const newCart = await CartModel.findByIdAndUpdate(cart._id, {
            quantite: redoed.quantite,
            total: redoed.total,
            inventaires: redoed.inventaires
        })
        res.json(newCart)
    } catch (err) {
        next(ApiError.serverError(err.message))
    }
}
const getCarts = async (req, res, next) => {
    try {
        const carts = await CartModel.find({})
        res.json(carts)
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const getCartById = async (req, res, next) => {
    try {
        const cart = await CartModel.findOne({
            _id: req.params.id,
            status: true
        })
        res.json(cart)
    } catch (err) {
        next(ApiError.serverError(err.message))
    }
}

const getCartsByUserId = async (req, res, next) => {
    try {
        const cart = await CartModel.find({
            userId: req.params.userId,
            status: true
        })
        res.json(cart)
    } catch (err) {
        next(ApiError.serverError(err.message))
    }
}

const createCart = async (req, res, next) => {
    try {
        const cart = new CartModel(req.body)
        if (!req.body.userId) {
            next(ApiError.serverError(`Please provide an user id`))
            return
        }
        try {
            const user = await UtilisateurModel.findById(req.body.userId)
            if (!user || user === null || user === undefined) {
                next(ApiError.serverError(`An user with this id doesn't exist`))
                return
            }
        } catch (err) {
            next(ApiError.serverError(err.message))
            return
        }
        try {
            await cart.save()
            res.json(cart)
        } catch (err) {
            next(ApiError.serverError(err.message))
            return
        }
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const addInventaireToCart = async (req, res, next) => {
    const idInventaire = req.body.idInventaire
    const quantite = req.body.quantite || 0
    const conn = mongoose.connection
    const session = await conn.startSession()
    try {
        session.startTransaction()
        //Verifier si l'id cart est bien specifié
        const idCart = req.params.id
        let cart = {}
        if (!idCart) {
            await session.abortTransaction()
            await session.endSession()
            next(ApiError.serverError('Specifie the card id'))
            return
        }
        //Verifier si le cart existe
        try {
            cart = await CartModel.findOne({
                _id: idCart,
                status: true
            })
            if (!cart) {
                await session.abortTransaction()
                next(ApiError.serverError(`There's no cart with this id`))
                return
            }
        } catch (err) {
            await session.abortTransaction()
            await session.endSession()
            next(ApiError.serverError(err.message))
            return
        }
        //Prendre la liste d'inventaires venant du cart
        const inventairesExistants = cart.inventaires
        let inventaire = {}
        let quantiteMax = 0
        //Verifier si l'inventaire existe dans la base
        try {
            inventaire = await InventaireModel.findById(mongoose.Types.ObjectId(idInventaire))
            if (inventaire === null || inventaire === undefined) {
                await session.abortTransaction()
                await session.endSession()
                next(ApiError.serverError(`This inventory doesn't exist`))
                return
            }
            //La quantité max disponible en stock
            quantiteMax = inventaire.quantite
        } catch (err) {
            await session.abortTransaction()
            await session.endSession()
            next(ApiError.serverError(err.message))
            return
        }

        inventaire = inventaire || null

        //Verifier si l'inventaire est deja present dans le cart
        const matchInventaire = Array.from(inventairesExistants).filter((inv, index) => {
            return inv._id == idInventaire
        })
        //Mettre les inventaires dans l'objet si ce n'est pas null , sinon mettre un objet vide
        let inventaireOptions = inventaire != null ?
            {
                inventaires: inventaire
            } :
            {

            }
        let addTotal = inventaire != null ? inventaire.prix * parseInt(quantite) : 0
        //Si c'est present dans le cart
        if (matchInventaire != null && matchInventaire.length > 0) {
            // console.log(matchInventaire)
            // => Add quantite to the inventaire
            const newInventaire = Array.from(inventairesExistants).map(inv => {
                if (inv._id == idInventaire) {
                    inv.quantite = parseInt(inv.quantite) + parseInt(quantite)
                    return inv
                }
                else {
                    return inv
                }
            })
            const cart = await CartModel.findByIdAndUpdate(
                idCart,
                {
                    $inc: {
                        quantite: quantite,
                        total: addTotal
                    },
                    $set: {
                        inventaires: newInventaire
                    }
                }, { session })
            if (!cart) {
                await session.abortTransaction()
                await session.endSession()
                next(ApiError.serverError("error"))
                return
            }
            await session.commitTransaction()
            res.json(cart)
            // return
        }
        //Sinon si ce n'est pas present dans le cart
        else {
            let inventaireAInserer = inventaire
            inventaireAInserer.quantite = quantite
            const cart = await CartModel.findByIdAndUpdate(
                req.params.id,
                {
                    $inc: {
                        quantite: quantite,
                        total: addTotal,
                    },
                    $push: {
                        inventaires: inventaireAInserer
                    }
                }, { session })
            if (!cart) {
                await session.abortTransaction()
                await session.endSession()
                next(ApiError.serverError("Can't add to cart"))
                return
            }
            // const test = "test"
            // test="mo"
            await session.commitTransaction()
            res.json(`Added to cart successfully`)
        }
    } catch (err) {
        await session.abortTransaction()
        await session.endSession()
        next(ApiError.serverError(err.message))
        return
    }
    finally {
        await session.endSession()
    }
}
// const addInventaireToCart = async (req, res, next) => {
//     const idInventaire = req.body.idInventaire
//     const quantite = req.body.quantite || 0

//     try {
//         //Verifier si l'id cart est bien specifié
//         const idCart = req.params.id
//         let cart = {}
//         if (!idCart) {
//             ApiError.serverError('Specifie the card id')
//             return
//         }
//         //Verifier si le cart existe
//         try {
//             cart = await CartModel.findOne({
//                 _id: idCart,
//                 status: true
//             })
//             if (!cart) {
//                 next(ApiError.serverError(`There's no cart with this id`))
//                 return
//             }
//         } catch (err) {
//             next(ApiError.serverError(err.message))
//             return
//         }
//         //Prendre la liste d'inventaires venant du cart
//         const inventairesExistants = cart.inventaires
//         let inventaire = {}
//         let quantiteMax = 0
//         //Verifier si l'inventaire existe dans la base
//         try {
//             inventaire = await InventaireModel.findById(mongoose.Types.ObjectId(idInventaire))
//             if (inventaire === null || inventaire === undefined) {
//                 next(ApiError.serverError(`This inventory doesn't exist`))
//                 return
//             }
//             //La quantité max disponible en stock
//             quantiteMax = inventaire.quantite
//         } catch (err) {
//             next(ApiError.serverError(err.message))
//             return
//         }

//         inventaire = inventaire || null

//         //Verifier si l'inventaire est deja present dans le cart
//         const matchInventaire = Array.from(inventairesExistants).filter((inv, index) => {
//             return inv._id == idInventaire
//         })
//         //Mettre les inventaires dans l'objet si ce n'est pas null , sinon mettre un objet vide
//         let inventaireOptions = inventaire != null ?
//             {
//                 inventaires: inventaire
//             } :
//             {

//             }
//         let addTotal = inventaire != null ? inventaire.prix * parseInt(quantite) : 0
//         //Si c'est present dans le cart
//         if (matchInventaire != null && matchInventaire.length > 0) {
//             // console.log(matchInventaire)
//             // => Add quantite to the inventaire
//             const newInventaire = Array.from(inventairesExistants).map(inv => {
//                 if (inv._id == idInventaire) {
//                     inv.quantite = parseInt(inv.quantite) + parseInt(quantite)
//                     return inv
//                 }
//                 else {
//                     return inv
//                 }
//             })
//             const cart = await CartModel.findByIdAndUpdate(
//                 idCart,
//                 {
//                     $inc: {
//                         quantite: quantite,
//                         total: addTotal
//                     },
//                     $set: {
//                         inventaires: newInventaire
//                     }
//                 })
//             res.json(cart)
//             return
//         }
//         //Sinon si ce n'est pas present dans le cart
//         else {
//             let inventaireAInserer = inventaire
//             inventaireAInserer.quantite = quantite
//             const cart = await CartModel.findByIdAndUpdate(
//                 req.params.id,
//                 {
//                     $inc: {
//                         quantite: quantite,
//                         total: addTotal,
//                     },
//                     $push: {
//                         inventaires: inventaireAInserer
//                     }
//                 })
//             res.json(`Added to cart successfully`)
//         }
//     } catch (err) {
//         next(ApiError.serverError(err.message))
//         return
//     }
// }
const getIngredientsFromRecette = async (req, res, next) => {
    try {
        const { idRecette } = req.params
        const inventaire = await InventaireModel.findById(idRecette);
    
        if (!inventaire) {
            next(ApiError.badRequest(`Inventaire not found`))
            return
        }
        //Ingredients dans la recette
        const ingredientsInRecette = inventaire.ingredients
        let tousLesIngredients = []
        for (let i = 0; i < ingredientsInRecette.length; i++) {
            //chaque ingredient
            const ingredient = ingredientsInRecette[i];
            const valeurAAtteindre = ingredient.quantite;
            const ingredientInBase = await InventaireModel.findById(ingredient._id)
            const valeurMax = ingredientInBase.quantite * ingredientInBase.valeurUnitaire;
            const quantiteInBase = ingredientInBase.quantite
            const valeurUnitaire = ingredientInBase.valeurUnitaire
            let valeurActuelle = 0
            let quantiteAUtiliser = 0;
            //Si valeur max < valeurAAtteindre ==== error
            if (valeurMax < valeurAAtteindre) {
                next(ApiError.serverError(`Pas assez dans l'inventaire`))
                return
            }
            //Sinon , continuer
            for (let i = 0; i < quantiteInBase; i++) {
                if (valeurActuelle >= valeurAAtteindre) break
                quantiteAUtiliser += 1;
                valeurActuelle += valeurUnitaire
            }
            const ingredientAUtiliser = {
                _id: ingredientInBase._id,
                nom: ingredientInBase.nom,
                prixUnitaire: ingredientInBase.prix,
                quantite: quantiteAUtiliser,
                valeurUnitaire: valeurUnitaire,
                valeurTotal: valeurActuelle,
                valeurUtilisee: valeurAAtteindre,
                valeurNonUtilisee: valeurActuelle - valeurAAtteindre,
                uniteDeValeur: ingredientInBase.unite
            }
            tousLesIngredients.push(ingredientAUtiliser)
        }
        res.json(tousLesIngredients)
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const addRecetteToCart = async (req, res, next) => {
    const conn = mongoose.connection
    const session = await conn.startSession()
    try {
        session.startTransaction()
        const { id } = req.params
        const { ingredients } = req.body || []
        /*
        Alaina ny cart mifanaraka amleh id
        Alaina ny recettes anatinleh cart
        Bouclena ny ingredients ho ampidirina
            Verifiena oe anatinleh liste de recettes ve leh ingredient
                Raha tsy anatiny
                    insererena fotsiny (CartModel.findByIdAndUpdate)
                Raha anatiny
                    
                    console.log("anatiny")
        */
        const cart = await CartModel.findById(id)
        if (!cart) {
            await session.abortTransaction()
            await session.endSession()
            next(ApiError.serverError(`This cart doesn't exist`))
            return
        }
        const recettes = cart.recettes
        for (let i = 0; i < ingredients.length; i++) {
            let ingredient = ingredients[i]
            let isInRecette = false
            for (let k = 0; k < recettes.length; k++) {
                const recette = recettes[k]
                if (recette._id == ingredient._id) {
                    isInRecette = true
                    break
                }
            }
            /*
            Raha anatiny
                conditions
                    valeur utilisee anleh mbola ho ampidirina (ingredient.valeurUtilisee) ve <= valeurNonUtilisee anleh efa ao
                        updatena leh ao suivant:
                            valeurUtilise anleh efa ao += valeur utilisee anleh mbola ho ampidirina
                            valeurNonUtilise -= valeur utilisee anleh mbola ho ampidirina
                    raha tsy izay
                        updatena leh ao suivant:
                            quantite += quantite anleh ho ampidirina
                            valeurTotal += valeurTotal anleh vao ho ampidirina
                            valeurUtilisee += valeurUtilisee anleh vao ho ampidirina
                            valeurNonUtilisee += valeurNonUtilisee anleh vao ho ampidirina

            Techniques
                alaina ny recetteTemporaire anatinleh cart mampiasa filter => recette._id == ingredient._id atao anaty variable temporaire
                    azo ny valeurUtiliseeExistant, valeurNonUtiliseeExistant,
                            valeurTotalExistant
                    atomboka ny conditions
                        io recetteTemporaire io no manipulena sy ovaina selon condition
                    vita ny conditions
                    settena an'io recetteTemporaire io ny anatin'ny base
                    VITA
                mappena ny recettes
            */
            if (!isInRecette) {
                recettes.push(ingredient)
                const newRecette = await CartModel.findByIdAndUpdate(id, {
                    $push: {
                        recettes: ingredient
                    }
                }, { session })
                if (!newRecette) {
                    await session.abortTransaction()
                    await session.endSession()
                    next(ApiError.serverError("An error occured during this transaction"))
                    return
                }
            }
            else { //Raha anaty liste anleh recette
                let recettesTemporaires = recettes.filter(element => {
                    return element._id == ingredient._id
                })
                let recetteTemporaire = recettesTemporaires[0]
                let valeurUtiliseeExistant = recetteTemporaire.valeurUtilisee
                let valeurNonUtiliseeExistant = recetteTemporaire.valeurNonUtilisee
                let valeurTotalExistant = recetteTemporaire.valeurTotal
                let quantiteExistant = recetteTemporaire.quantite
                let valeurTenaIlaina = ingredient.valeurUtilisee + valeurUtiliseeExistant
                for(let k=0;k<ingredient.quantite;k++){
                    let valeurUnitaireIngredient = ingredient.valeurUnitaire
                    if( valeurTenaIlaina <= valeurTotalExistant){
                        valeurUtiliseeExistant += valeurUnitaireIngredient
                        valeurTotalExistant += valeurUtiliseeExistant
                    }
                    else{
                        quantiteExistant += 1
                        valeurTotalExistant += valeurUnitaireIngredient
                        valeurUtiliseeExistant += valeurUnitaireIngredient
                    }
                }
                recetteTemporaire.quantite = quantiteExistant
                recetteTemporaire.valeurTotal = valeurTotalExistant
                recetteTemporaire.valeurUtilisee = valeurUtiliseeExistant
                recetteTemporaire.valeurNonUtilisee = valeurTotalExistant - valeurUtiliseeExistant
                // let recettesTemporaires = recettes.filter(element => {
                //     return element._id == ingredient._id
                // })
                // let recetteTemporaire = recettesTemporaires[0]
                // const valeurUtiliseeExistant = recetteTemporaire.valeurUtilisee
                // const valeurNonUtiliseeExistant = recetteTemporaire.valeurNonUtilisee
                // const valeurTotalExistant = recetteTemporaire.valeurTotal
                // if (ingredient.valeurUtilisee <= valeurNonUtiliseeExistant) {
                //     recetteTemporaire.valeurUtilisee += ingredient.valeurUtilisee
                //     recetteTemporaire.valeurNonUtilisee -= ingredient.valeurUtilisee
                // } else {
                //     recetteTemporaire.quantite += ingredient.quantite
                //     recetteTemporaire.valeurTotal += ingredient.valeurTotal
                //     recetteTemporaire.valeurUtilisee += ingredient.valeurUtilisee
                //     recetteTemporaire.valeurNonUtilisee += ingredient.valeurNonUtilisee
                // }
            }
        }
        const settingRecette = await CartModel.findByIdAndUpdate(id, {
            recettes: recettes
        }, { session })
        if (!settingRecette) {
            await session.abortTransaction()
            await session.endSession()
            next(ApiError.serverError("An error occured during update of recette, transaction aborted"))
            return
        }
        await session.commitTransaction()
        res.json(settingRecette.recettes)
    } catch (err) {
        await session.abortTransaction()
        await session.endSession()
        next(ApiError.serverError(err))
        return
    } finally {
        await session.endSession()
    }
}
// const addRecetteToCart = async (req, res, next) => {
//     const conn = mongoose.connection
//     const session = await conn.startSession()
//     try {
//         session.startTransaction()
//         const { id } = req.params
//         const { ingredients } = req.body || []
//         /*
//         Alaina ny cart mifanaraka amleh id
//         Alaina ny recettes anatinleh cart
//         Bouclena ny ingredients ho ampidirina
//             Verifiena oe anatinleh liste de recettes ve leh ingredient
//                 Raha tsy anatiny
//                     insererena fotsiny (CartModel.findByIdAndUpdate)
//                 Raha anatiny
                    
//                     console.log("anatiny")
//         */
//         const cart = await CartModel.findById(id)
//         if (!cart) {
//             await session.abortTransaction()
//             await session.endSession()
//             next(ApiError.serverError(`This cart doesn't exist`))
//             return
//         }
//         const recettes = cart.recettes
//         for (let i = 0; i < ingredients.length; i++) {
//             let ingredient = ingredients[i]
//             let isInRecette = false
//             for (let k = 0; k < recettes.length; k++) {
//                 const recette = recettes[k]
//                 if (recette._id == ingredient._id) {
//                     isInRecette = true
//                     break
//                 }
//             }
//             /*
//             Raha anatiny
//                 conditions
//                     valeur utilisee anleh mbola ho ampidirina (ingredient.valeurUtilisee) ve <= valeurNonUtilisee anleh efa ao
//                         updatena leh ao suivant:
//                             valeurUtilise anleh efa ao += valeur utilisee anleh mbola ho ampidirina
//                             valeurNonUtilise -= valeur utilisee anleh mbola ho ampidirina
//                     raha tsy izay
//                         updatena leh ao suivant:
//                             quantite += quantite anleh ho ampidirina
//                             valeurTotal += valeurTotal anleh vao ho ampidirina
//                             valeurUtilisee += valeurUtilisee anleh vao ho ampidirina
//                             valeurNonUtilisee += valeurNonUtilisee anleh vao ho ampidirina

//             Techniques
//                 alaina ny recetteTemporaire anatinleh cart mampiasa filter => recette._id == ingredient._id atao anaty variable temporaire
//                     azo ny valeurUtiliseeExistant, valeurNonUtiliseeExistant,
//                             valeurTotalExistant
//                     atomboka ny conditions
//                         io recetteTemporaire io no manipulena sy ovaina selon condition
//                     vita ny conditions
//                     settena an'io recetteTemporaire io ny anatin'ny base
//                     VITA
//                 mappena ny recettes
//             */
//             if (!isInRecette) {
//                 recettes.push(ingredient)
//                 const newRecette = await CartModel.findByIdAndUpdate(id, {
//                     $push: {
//                         recettes: ingredient
//                     }
//                 }, { session })
//                 if (!newRecette) {
//                     await session.abortTransaction()
//                     await session.endSession()
//                     next(ApiError.serverError("An error occured during this transaction"))
//                     return
//                 }
//             }
//             else {
//                 let recettesTemporaires = recettes.filter(element => {
//                     return element._id == ingredient._id
//                 })
//                 let recetteTemporaire = recettesTemporaires[0]
//                 const valeurUtiliseeExistant = recetteTemporaire.valeurUtilisee
//                 const valeurNonUtiliseeExistant = recetteTemporaire.valeurNonUtilisee
//                 const valeurTotalExistant = recetteTemporaire.valeurTotal
//                 if (ingredient.valeurUtilisee <= valeurNonUtiliseeExistant) {
//                     recetteTemporaire.valeurUtilisee += ingredient.valeurUtilisee
//                     recetteTemporaire.valeurNonUtilisee -= ingredient.valeurUtilisee
//                 } else {
//                     recetteTemporaire.quantite += ingredient.quantite
//                     recetteTemporaire.valeurTotal += ingredient.valeurTotal
//                     recetteTemporaire.valeurUtilisee += ingredient.valeurUtilisee
//                     recetteTemporaire.valeurNonUtilisee += ingredient.valeurNonUtilisee
//                 }
//             }
//         }
//         const settingRecette = await CartModel.findByIdAndUpdate(id, {
//             recettes: recettes
//         }, { session })
//         if (!settingRecette) {
//             await session.abortTransaction()
//             await session.endSession()
//             next(ApiError.serverError("An error occured during update of recette, transaction aborted"))
//             return
//         }
//         await session.commitTransaction()
//         res.json(settingRecette.recettes)
//     } catch (err) {
//         await session.abortTransaction()
//         await session.endSession()
//         next(ApiError.serverError(err))
//         return
//     } finally {
//         await session.endSession()
//     }
// }
// const addRecetteToCart = async (req, res, next) => {
//     try {
//         const { id } = req.params
//         const { ingredients } = req.body || []
//         /*
//         Alaina ny cart mifanaraka amleh id
//         Alaina ny recettes anatinleh cart
//         Bouclena ny ingredients ho ampidirina
//             Verifiena oe anatinleh liste de recettes ve leh ingredient
//                 Raha tsy anatiny
//                     insererena fotsiny (CartModel.findByIdAndUpdate)
//                 Raha anatiny

//                     console.log("anatiny")
//         */
//         const cart = await CartModel.findById(id)
//         const recettes = cart.recettes
//         for (let i = 0; i < ingredients.length; i++) {
//             let ingredient = ingredients[i]
//             let isInRecette = false
//             for (let k = 0; k < recettes.length; k++) {
//                 const recette = recettes[k]
//                 if (recette._id == ingredient._id) {
//                     isInRecette = true
//                     break
//                 }
//             }
//             /*
//             Raha anatiny
//                 conditions
//                     valeur utilisee anleh mbola ho ampidirina (ingredient.valeurUtilisee) ve <= valeurNonUtilisee anleh efa ao
//                         updatena leh ao suivant:
//                             valeurUtilise anleh efa ao += valeur utilisee anleh mbola ho ampidirina
//                             valeurNonUtilise -= valeur utilisee anleh mbola ho ampidirina
//                     raha tsy izay
//                         updatena leh ao suivant:
//                             quantite += quantite anleh ho ampidirina
//                             valeurTotal += valeurTotal anleh vao ho ampidirina
//                             valeurUtilisee += valeurUtilisee anleh vao ho ampidirina
//                             valeurNonUtilisee += valeurNonUtilisee anleh vao ho ampidirina

//             Techniques
//                 alaina ny recetteTemporaire anatinleh cart mampiasa filter => recette._id == ingredient._id atao anaty variable temporaire
//                     azo ny valeurUtiliseeExistant, valeurNonUtiliseeExistant,
//                             valeurTotalExistant
//                     atomboka ny conditions
//                         io recetteTemporaire io no manipulena sy ovaina selon condition
//                     vita ny conditions
//                     settena an'io recetteTemporaire io ny anatin'ny base
//                     VITA
//                 mappena ny recettes
//             */
//             if (!isInRecette) {
//                 recettes.push(ingredient)
//                 const newRecette = await CartModel.findByIdAndUpdate(id, {
//                     $push: {
//                         recettes: ingredient
//                     }
//                 })
//             }
//             else {
//                 let recettesTemporaires = recettes.filter(element => {
//                     return element._id == ingredient._id
//                 })
//                 let recetteTemporaire = recettesTemporaires[0]
//                 const valeurUtiliseeExistant = recetteTemporaire.valeurUtilisee
//                 const valeurNonUtiliseeExistant = recetteTemporaire.valeurNonUtilisee
//                 const valeurTotalExistant = recetteTemporaire.valeurTotal
//                 if (ingredient.valeurUtilisee <= valeurNonUtiliseeExistant) {
//                     recetteTemporaire.valeurUtilisee += ingredient.valeurUtilisee
//                     recetteTemporaire.valeurNonUtilisee -= ingredient.valeurUtilisee
//                 } else {
//                     recetteTemporaire.quantite += ingredient.quantite
//                     recetteTemporaire.valeurTotal += ingredient.valeurTotal
//                     recetteTemporaire.valeurUtilisee += ingredient.valeurUtilisee
//                     recetteTemporaire.valeurNonUtilisee += ingredient.valeurNonUtilisee
//                 }
//             }
//         }
//         const settingRecette = await CartModel.findByIdAndUpdate(id, {
//             recettes: recettes
//         })
//         res.json(settingRecette.recettes)
//     } catch (err) {
//         next(ApiError.serverError(err))
//         return
//     }
// }
const changeCartName = async (req, res, next) => {
    try {
        const idCart = req.params.id
        let namee = req.body.nom
        try {
            const cart = await CartModel.findByIdAndUpdate(mongoose.Types.ObjectId(idCart), {
                nom: namee
            });
            if (!cart) {
                next(ApiError.serverError(`An error occured`));
                return;
            }
            res.json(`Updated the name of the cart ${idCart} successfully to ${namee}`);
        } catch (err) {
            next(ApiError.serverError(err.message))
            return
        }
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const updateCart = async (req, res, next) => {
    try {
        let status = req.body.status
        let addQuantite = req.body.addQuantite || 0
        let addTotal = req.body.addTotal || 0
        let idInventaire = req.body.idInventaire
        let inventaire = {}
        try {
            inventaire = await InventaireModel.findById(mongoose.Types.ObjectId(idInventaire))
        } catch (err) {
            next(ApiError.serverError(err.message))
            // return
        }
        inventaire = inventaire || null
        let inventaireOptions = inventaire != null ? {
            inventaires: inventaire
        } : {}
        addQuantite = inventaire != null ? 1 : 0
        addTotal = inventaire != null ? inventaire.prix : 0
        /*Modification de status
        Augmentation quantite selon le nombre d'inventaire
        Augmentation total selon le prix de l'inventaire à insérer
        Ajout de l'inventaire dans le tableau inventaires*/
        const cart = await CartModel.findByIdAndUpdate(
            req.params.id,
            {
                status: status,
                $inc: {
                    quantite: addQuantite,
                    total: addTotal
                },
                $push: inventaireOptions
            })
        res.json(`updated successfully`)
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}

const deleteCart = async (req, res, next) => {
    try {
        const idCart = req.params.id
        CartModel.findByIdAndDelete(idCart).then(data => {
            res.json({
                message: "deleted successfully",
                data: data
            })
        }).catch(err => {
            next(ApiError.serverError(err.message))
            return
        })
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const closeCart = async (req, res, next) => {
    if (!req.query.idCart) {
        next(ApiError.serverError(`Please define idCart`))
        return
    }
    try {
        await CartModel.findByIdAndUpdate(req.query.idCart, {
            status: false
        })
        res.json(`Validated ${req.query.idCart} successfully`)
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
const clearRecettes = async (req, res, next) => {
    const { id } = req.params
    try {
        await CartModel.findByIdAndUpdate(id, {
            recettes: [],
        })
        res.json("Cleared successfully")
    } catch (err) {
        next(ApiError.serverError(err.message))
    }
}
const calculTotalMontantCart = async (req, res, next) => {
    const { id } = req.params
    try {
        const cart = await CartModel.findById(id)
        const { inventaires, recettes } = cart
        let total = 0
        inventaires.forEach(element => {
            total += element.quantite * element.prix
        });
        recettes.forEach(element => {
            total += element.quantite * element.prixUnitaire
        })
        await CartModel.findByIdAndUpdate(id, {
            total: total
        })
        res.json({
            total: total
        })
    } catch (err) {
        next(ApiError.serverError(err.message))
        return
    }
}
module.exports = {
    getCarts,
    getRedoedCart,
    getRedoedCartAndChangeInDatabase,
    getCartById,
    getCartsByUserId,
    createCart,
    addInventaireToCart,
    getIngredientsFromRecette,
    addRecetteToCart,
    changeCartName,
    updateCart,
    deleteCart,
    closeCart,
    clearRecettes,
    calculTotalMontantCart
}