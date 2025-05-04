
const ImageKit  =require("imagekit");
const imagekit = new ImageKit (
    {

    publicKey :`${process.env.imagekit_publicKey}`,

    privateKey : `${process.env.imagekit_privateKey}`
,

    urlEndpoint : `${process.env.imagekit_url}`

}
)
;
module.exports=imagekit