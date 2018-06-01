var express = require('express')

var mysql = require('./connection'),
	subirInformes = require('./subirInformes')

var router = express.Router()
var con = mysql.connection;

router.use((req, res, next)=>{
	next()
})

router.get('/',(req,res)=>{
	con.query("SELECT email,id FROM usuarios WHERE userClass = 'P'",(err,data)=>{
		if(err)
			console.log(err)
		res.render( 'n-admin-start' , { error : err , data : data } )
	})
})

module.exports = router