const express=require('express')
const router=express.Router()

router.get('/',(req,res)=>{
console.log(req.user)
})
router.route('/:id')
.get((req,res)=>{
const userId=req.params.id;
console.log(req.user)
res.send(`user id is ${userId} once again`)
})
const users=[{name:'leo tito'},{name:'samweli tito'}];
router.param("id",(req,res,next,id)=>{
req.user=users[id]
next()
})
module.exports=router