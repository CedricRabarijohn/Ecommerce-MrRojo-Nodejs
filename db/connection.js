require(`dotenv`).config()
const mongoose = require(`mongoose`)

const URI = process.env.DB_STRING
console.log(URI)

const connectDB = async()=> {
    try{
        await mongoose.connect(URI,{
            useUnifiedTopology: true,
            useNewUrlParser: true
        })
        console.log('db connected successfully')
    }catch(err){
        console.log(err)
    }
}
module.exports = connectDB