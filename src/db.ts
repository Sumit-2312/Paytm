import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const model = mongoose.model;
const objectId = mongoose.Types.ObjectId;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    password : {
        type: String,
        required: true,
        minLength: 6
    },
    email : {
        type: String,
        required: true,
        unique: true,
    },
})


const userModel =  model('users',userSchema);

module.exports = {
    users: userModel,
};
