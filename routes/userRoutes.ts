import express from 'express';
const router = express.Router();
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
const {users} = require('../src/db');
import auth from '../src/auth'  


router.post('/signup', async (req,res)=>{
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

router.post('/login',async (req,res)=>{

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

router.post('/change',auth,async(req,res)=>{
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

export default router;
