var express = require('express')

var mysql = require('./connection'),
	subirInformes = require('./subirInformes')

var router = express.Router()
var con = mysql.connection;

router.use((req, res, next)=>{
	next()
})

router.get('/',(req,res)=>{
	res.end('phy')
})

module.exports = router