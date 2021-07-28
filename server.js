const express=require('express')
const path=require('path')
const app=express()

const cors=require('cors')
const bodyParser=require('body-parser')

const PORT = process.env.PORT || 5000;

const paymentRouter=require('./paymentRoute')

const port=5000;
app.use(bodyParser.json())
app.use(cors())
app.use(express.static(path.join(__dirname, '/frontend/build')));
app.get('*',(req,res)=>{
    // res.sendFile('F:\tmbill\paytm\frontend\build\index.html')
    // res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
    res.sendFile(path.join(__dirname + '/frontend/build/index.html'))
})
app.use('/api',paymentRouter)



app.listen(PORT,()=> console.log(`app is running on ${port}`))