import express from 'express';
const router = express.Router();
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
const {users,balance} = require('../db');
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


router.post("/payment",auth,async (req,res)=>{
    try{
        const {firstName,lastName,recieverFirstName,recieverLastName,amount} = req.body;
        // we will first find the user who is going to make the payment
        const user = await users.findOne({firstName,lastName});
        // now we will fetch the balance sheet of the user and check if he have sufficient amount of money to pay or not
        const userBalance = await balance.findOne({userId:user._id});
        if(!userBalance){
            res.json({
                message:"you are not linked with bank yet",
            }).status(400);
            return;
        }
        if(userBalance.balance < amount){
            res.json({
                message:"You don't have sufficient amount of money",
                amount : userBalance.balance
            }).status(400);
            return;
        }else{
            userBalance.balance -= amount;
            await userBalance.save();
        }
        
        // now fetch the reciever user and its balance sheet
        console.log(recieverFirstName,recieverLastName);
        
        const recieverUser = await users.findOne({firstName:recieverFirstName,lastName:recieverLastName});
        if(!recieverUser){
            res.json({
                message:"no such user exists",
            }).status(400);
            return;
        }
        const recieverbalance = await balance.findOne({userId: recieverUser._id})
        if(!recieverbalance){
            await balance.create({
                userId : recieverUser._id,
                balance : amount
            })
        }
        else{
            recieverbalance.balance += amount;
            await recieverbalance.save();
        }
        res.json({
            recieverbalance,
            userBalance
        }).status(200);
        return;
    }
    catch(error){
        res.json({
            error: error.message
        }).status(400);
        return;
    }
})

export default router;
