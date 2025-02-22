import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {users} from './db'

const app = express();
app.use(express.json());
mongoose.connect('mongodb+srv://Sumit:hdW2hmE1Tp9d3Gov@cluster0.wpjvi.mongodb.net/Second-Brain-App');

const auth = (req,res,next)=>{
    const {token} = req.headers;
    const decoded = jwt.verify(token,'Secret_Key');
    if(decoded){
        req.body.firstName = decoded.firstName;
        req.body.lastName = decoded.lastName;
        next();
    }
    res.json({
        message:"Token have some errors ",
    }).status(400);
    return;
}

app.post('/signup', async (req,res)=>{
    const {firstName,lastName,password} = req.body;
    const user = await users.findOne({firstName,lastName,password});
    if(user){
        res.send("User already exists").status(400);
        return;
    }
    const hashedPassword = await bcrypt.hash(password,10);
    const newUser = users.create({
        firstName,
        lastName,
        password: hashedPassword
    })
    res.send(newUser).status(200);
    return;
})

app.post('/login',async (req,res)=>{

    const {firstName,lastName,password} = req.body;
    const hashedPassword = await bcrypt.hash(password,10);
    const user = users.findOne({firstName,lastName,hashedPassword});
    if(!user){
        res.json({
            message:"please signup first",
        }).status(400);
        return;
    }

    const token =  jwt.sign({firstName,lastName},"Secret_Key");
    res.json({
        message:"You have logged in successfully",
        token,
    })
    return;
})

app.post('/change',auth,async(req,res)=>{
    try{
        const { newfirstName, newlastName, newPassword} = req.body;
        const {firstName,lastName,password} = req.body;
        const hashedPassword = await bcrypt.hash(password,10);
        const newhashedPassword = await bcrypt.hash(newPassword,10);
        const user = await users.updateOne({firstName,lastName,hashedPassword},{
            firstName: newfirstName,
            lastName: newlastName,
            password: newhashedPassword
        });
        res.json({
            message:"credentials have been changed successfully ",
            user,
        }).status(200);
        return;
    }
    catch(e){
        res.json({
            error:e,
        }).status(400);
        return;
    }

})

app.listen(3000,()=>{
    console.log("Server is started at port 3000");
})