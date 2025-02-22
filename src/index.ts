import express from 'express';
import mongoose from 'mongoose';
// @ts-ignore
import userRouter from '../routes/userRoutes';

// routers are used to clean the code like user's route will be in different file and that of admin routes those will be in another file

const app = express();
app.use(express.json());
mongoose.connect('mongodb+srv://Sumit:hdW2hmE1Tp9d3Gov@cluster0.wpjvi.mongodb.net/Second-Brain-App');


app.use('/user',userRouter);

app.listen(3000,()=>{
    console.log("Server is started at port 3000");
})