import express from 'express';
const router = express.Router();
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
const {users} = require('../db');
import auth from '../auth'  



router.post('/signup', async (req,res)=>{
    const {firstName,lastName,password,email} = req.body;
    const user = await users.findOne({firstName,lastName,password});
    if(user){
        res.send("User already exists").status(400);
        return;
    }
    const hashedPassword = await bcrypt.hash(password,10);
    const newUser = await users.create({
        firstName,
        lastName,
        password: hashedPassword,
        email
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

// @ts-ignore
router.post('/change', auth, async (req, res) => {
    try {
        const { firstName, lastName, password, newfirstName, newlastName, newPassword } = req.body;

        const user = await users.findOne({ firstName, lastName });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log(password,user.password);
        

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect current password" });
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        const updatedUser = await users.updateOne(
            { _id: user._id }, 
            {
                
                firstName: newfirstName,
                lastName: newlastName,
                password: newHashedPassword
             
            }
        );

        if (updatedUser.modifiedCount === 0) {
            return res.status(400).json({ message: "No changes were made" });
        }

        res.status(200).json({
            message: "Credentials have been changed successfully",
        });

    } catch (e) {
        console.error("Error updating user:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
