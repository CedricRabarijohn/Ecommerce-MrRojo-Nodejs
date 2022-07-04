const mongoose = require('mongoose')

const generateObjectId = (req,res,next) => {
    const id = new mongoose.Types.ObjectId()
    res.json(id)
}

module.exports = {
    generateObjectId
}