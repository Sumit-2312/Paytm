import express from 'express';
const router = express.Router();
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const {users,balance} = require('../db');
import auth from '../auth'  


router.get("/",auth, async(req ,res)=>{
    try{
        const query = req.query.filter || "" ; // we can also access the query sent to the backend like req sent to /?filter="sumit" will have req.query.filer = sumit
        const allUsers = await users.find({
            $or:[  // or is used to return the users by if either of the condition satifies
                {
                    firstName: { $regex: query , $options: 'i' }    // regex will check if the user having firstName with substring or not
                                                                    // options = "i" making it case insensitive
                },
                {
                    lastName : { $regex:query , $options: 'i'}
                }
            ]
        });

        if(allUsers.modifiedCount === 0){
            res.status(200).json({
                message:"No users are present"
            });
            return;
        }
        res.status(200).json({
            message:"Fetched all users",
            allUsers
        });
        return;
    }
    catch(error){
        res.status(400).json({
            error: error.message
        });
        return;
    }
})


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

// @ts-ignore
router.post('/deposit', auth, async (req, res)=> {
    try {
        const { firstName, lastName, amount } = req.body;
        console.log(`Deposit request for: ${firstName} ${lastName}, Amount: ${amount}`);

        const user = await users.findOne({ firstName, lastName });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        console.log(`User ID: ${user._id}`);

        let userBalance = await balance.findOne({ userId: user._id });

        if (!userBalance) {
            console.log("No balance record found, creating new balance entry.");
            userBalance = new balance({
                userId: user._id,
                balance: amount
            });
        } else {
            userBalance.balance += amount; // Directly update balance
        }

        await userBalance.save(); // Save changes to DB

        return res.status(200).send("Added to your account");
    } catch (e) {
        console.error("Error processing deposit:", e.message);
        return res.status(400).json({ error: e.message });
    }
});

router.post('/withdraw', auth, async ( req , res)=>{
    try{
        const {amount , firstName, lastName} = req.body;
        const user = await users.findOne({firstName,lastName});
        const userBalance = await balance.findOne({userId: user._id});
        if(!userBalance){
            res.status(400).json({
                message:" You do not have any account yet"
            });
            return;
        }
        if(userBalance.balance >= amount){
            userBalance.balance -= amount;
            await userBalance.save();
        }
        else{
            res.status(400).json({
                message:"You don't have enough money to withdraw"
            });
            return;
        }
    }
    catch(error){
        res.status(400).json({
            error: error.message
        })
        return;
    }

})

// @ts-ignore
router.post("/payment", auth, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { firstName, lastName, recieverFirstName, recieverLastName, amount } = req.body;

        // Find sender
        const user = await users.findOne({ firstName, lastName }).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: "Sender not found" });
        }

        // Fetch sender's balance
        const userBalance = await balance.findOne({ userId: user._id }).session(session);
        if (!userBalance) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "You are not linked with a bank yet" });
        }

        if (userBalance.balance < amount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Insufficient funds", balance: userBalance.balance });
        }

        // Deduct amount from sender
        userBalance.balance -= amount;
        await userBalance.save({ session });

        // Find receiver
        const receiverUser = await users.findOne({ firstName: recieverFirstName, lastName: recieverLastName }).session(session);
        if (!receiverUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: "Receiver not found" });
        }

        // Fetch receiver's balance
        let receiverBalance = await balance.findOne({ userId: receiverUser._id }).session(session);
        if (!receiverBalance) {
            receiverBalance = new balance({ userId: receiverUser._id, balance: amount });
        } else {
            receiverBalance.balance += amount;
        }

        await receiverBalance.save({ session });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            message: "Payment successful",
            senderBalance: userBalance.balance,
            receiverBalance: receiverBalance.balance
        });

    } catch (error) {
        // Rollback in case of failure
        await session.abortTransaction();
        session.endSession();
        console.error("Error processing payment:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


export default router;
