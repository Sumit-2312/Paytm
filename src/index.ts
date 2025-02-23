import express from 'express';
import mongoose from 'mongoose';
// @ts-ignore
import userRouter from './routes/userRoutes';
import cors from 'cors';

// routers are used to clean the code like user's route will be in different file and that of admin routes those will be in another file 

const app = express();
app.use(cors());
app.use(express.json());
mongoose.connect('mongodb+srv://Sumit:f1DiiBAfTuvIZ2RU@cluster0.wpjvi.mongodb.net/Paytm');


app.use('/user',userRouter);

app.listen(3000,()=>{
    console.log("Server is started at port 3000");
})



