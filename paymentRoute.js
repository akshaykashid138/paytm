const express=require('express')
const router=express.Router()
const PaytmChecksum=require('./PaytmChecksum')
const {v4:uuidv4}=require('uuid')
const formidable=require('formidable')
require('dotenv').config()
const https=require('https')


router.post('/callback',(req,res)=>{
    //paytm gives data in the form of FormData
    const form = new formidable.IncomingForm()

    form.parse(req,(err,fields,file)=>{
        //checking status of transaction
        //here validating checksum
        var paytmChecksum = fields.CHECKSUMHASH;
        delete fields.CHECKSUMHASH

        var isVerifySignature = PaytmChecksum.verifySignature(fields, process.env.PAYTM_MERCHANT_KEY, paytmChecksum);
        if (isVerifySignature) {
            // console.log("Checksum Matched");
            
            /* initialize an object */
            var paytmParams = {};

            paytmParams["MID"]=fields.MID;
            paytmParams["ORDER_ID"]=fields.ORDERID;
           
            /**
            * Generate checksum by parameters we have in body
            * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
            */
           //JSON.stringify(paytmParams.body)
            PaytmChecksum.generateSignature(paytmParams, process.env.PAYTM_MERCHANT_KEY).then(function(checksum){
                /* head parameters */

                // paytmParams.head = {

                //     /* put generated checksum value here */
                //     "signature"	: checksum
                // };

                paytmParams["CHECKSUMHASH"]=checksum

                /* prepare JSON string for request */
                var post_data = JSON.stringify(paytmParams);

                var options = {

                    /* for Staging */
                    hostname: 'securegw-stage.paytm.in',

                    /* for Production */
                    // hostname: 'securegw.paytm.in',

                    port: 443,
                    path: '/order/status',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': post_data.length
                    }
                };

                // Set up the request
                var response = "";
                var post_req = https.request(options, function(post_res) {
                    post_res.on('data', function (chunk) {

                        response += chunk;
                    });

                    post_res.on('end', function(){
                        console.log('Response: ', response);
                        //sending response to frontend
                        res.json(JSON.parse(response))
                    });
                });

                // post the data
                post_req.write(post_data);
                post_req.end();
            });
        } else {
            console.log("Checksum Mismatched");
        }
    })
})


//payment request new final
router.post('/payment',(req,res)=>{
    const {amount,email}=req.body

    const totalAmount=JSON.stringify(amount)
    var params = {};

    /* initialize an array */
    params["MID"] = process.env.PAYTM_MID;
    params["WEBSITE"] = process.env.PAYTM_WEBSITE;
    params["CHANNEL_ID"] = process.env.PAYTM_CHANNEL_ID;
    params["ORDER_ID"] = uuidv4()
    params["INDUSTRY_TYPE_ID"] = process.env.PAYTM_INDUSTRY_TYPE_ID;
    params["CUST_ID"] = process.env.PAYTM_CUST_ID;
    params["TXN_AMOUNT"] = totalAmount;
    params["CALLBACK_URL"] = "http://localhost:5000/api/callback"; //
    params["EMAIL"] = email;
    params["MOBILE_NO"] = "7887709470";
    
  
    /**
    * Generate checksum by parameters we have
    * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
    */
    var paytmChecksum = PaytmChecksum.generateSignature(params, process.env.PAYTM_MERCHANT_KEY);
    paytmChecksum.then(function(checksum){
        // console.log("generateSignature Returns: " + checksum);
        let paytmParams={
            ...params,
            "CHECKSUMHASH":checksum
        }
        res.json(paytmParams)
    }).catch(function(error){
        console.log(error);
    });
})


module.exports=router


