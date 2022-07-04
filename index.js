const express = require('express');
const cors = require('cors');
const connectDB = require('./db/connection')
connectDB()
const compression = require('compression')
require('dotenv').config();
const app = express();

app.use(compression())
app.use(cors())
app.use(express.json({extended: false}))
const ErrorHandler = require('./err/ErrorHandler');

const AdminRouter = require('./routers/AdminRouter');
const UtilisateurRouter = require('./routers/UtilisateurRouter');
const InventaireRouter = require('./routers/InventaireRouter')
const CategorieRouter = require('./routers/CategorieRouter')
const CartRouter = require('./routers/CartRouter')
const PaiementRouter = require('./routers/PaiementRouter')
const UtilsRouter = require('./routers/UtilsRouter')

app.use('/admin',AdminRouter)
app.use('/utilisateur',UtilisateurRouter)
app.use('/inventaire',InventaireRouter)
app.use('/categorie',CategorieRouter)
app.use('/cart',CartRouter)
app.use('/paiement',PaiementRouter)
app.use('/utils',UtilsRouter)

app.use(ErrorHandler)

const port = process.env.PORT | 3000
app.listen(port,() => {
    console.log(`Listening on port ${port}`)
})