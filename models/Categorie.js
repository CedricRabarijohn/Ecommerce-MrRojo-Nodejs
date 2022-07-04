const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');
const CategorieShema = new mongoose.Schema({
    nom:{
        type:String,
        required:true
    }
},{collection:'categorie'})
CategorieShema.plugin(mongoosePaginate)
const Categorie = mongoose.model('categorie', CategorieShema);
module.exports = Categorie;
