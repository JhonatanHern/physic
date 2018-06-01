var fs = require('fs')

var validId = require('../modules/idValidator'),
	upload  = require('../modules/upload'),
	dates   = require('../modules/allowedDates'),
	connection = require('../modules/connection')
conn = connection.connection
escape = connection.escape
/* FORMATO PARA INFORMES Y DOS.
 * RIF-anio-mes
 * inf - > informes
 * dos - > dosimets
 */
function inf(req,res) {
	var id = req.session.id , rif = req.query.rif
	if (!validId(id)) {
		res.status(400)
		res.render('error500',{message:"id corrupto, detectado posible ataque"})
		return
	}
	conn.executeByUser(id,
		function(){
			let sql = "SELECT * FROM clinicas WHERE id_encargado="+id+" AND rif="+escape(rif)
			conn.query(sql,function(err,cls) {
				if( err || cls.length === 0 ){
					res.render('error500')
					console.log('empresa no encontrada')
					return
				}
				let today = new Date()
				let name =  rif + "-" + today.getFullYear() + '-' + ( today.getMonth() + 1 )
				upload( req , name , 'informes' ,function( erro )  {
					if( erro ){
						res.render('error500')
						console.log('error en la subida')
						return
					}
					res.render('successOnUpload')
				})
			})
		},function() {
			let sql = "SELECT * FROM clinicas WHERE rif="+escape(rif)
			conn.query(sql,function(err,cls) {
				if( err || cls.length === 0 ){
					res.render('error500')
					console.log('empresa no encontrada')
					return
				}
				let year = req.query.year,
					month = req.query.month
				let name =  rif + "-" + year + '-' + month
				upload( req , name , 'informes' ,function( erro )  {
					if( erro ){
						res.render('error500')
						console.log('error en la subida')
						return
					}
					res.render('successOnUpload')
				})
			})
		},function() {
			res.end('')
		}
	)
}
function dos(req,res) {
	var id = req.session.id ,
		rif   = req.query.rif
	if (!validId(id)) {
		res.status(400)
		res.render('error500',{message:"id corrupto, detectado posible ataque"})
		return
	}
	conn.executeByUser(id,
		function(){
			conn.query("SELECT * FROM clinicas WHERE id_encargado="+id+" AND rif="+escape(rif),function(err,cls) {
				if( err || cls.length === 0 ){
					res.render('error500')
					return
				}
				allowed = dates()
				console.log(allowed)
				if ( allowed.indexOf(req.query.date) !== -1 ) {
					let name =  rif + "-" + req.query.date
					upload( req , name ,'dosimets',function(err) {
						if(err){
							throw err
							res.render('error500')
							return
						}
						res.render('successOnUpload')
					})
				} else {
					console.log('date not allowed')
					res.render('error500')
					return
				}
			})
		},function () {
			conn.query("SELECT * FROM clinicas WHERE rif="+escape(rif),function(err,cls) {
				if( err || cls.length === 0 ){
					res.render('error500')
					return
				}
				let year  = req.query.year,
					month = req.query.month
				let name  =  rif + '-' + year + '-' + month
				upload( req , name ,'dosimets',function(err) {
					if(err){
						throw err
						res.render('error500')
						return
					}
					res.render('successOnUpload')
				})
			})
		},function () {
			res.end('')
		}
	)
}
function getInf(req,res){
	let id    = req.session.id,
		rif   = req.query.rif,
		year  = req.query.year,
		month = req.query.month
	if (!validId(id)) {
		res.status(400)
		res.render('error500',{message:"id corrupto, detectado posible ataque"})
		return
	}
	let path = process.cwd().split('\\\\').join('/') + '/informes/'+rif+'-'+year+'-'+month+'.docx'
	fs.stat( path , function( err , stat ) {
		if( err == null ) {
			res.setHeader( 'Content-type' , 'application/msword' )
			res.download( path )
		} else if(err.code == 'ENOENT') {
			// file does not exist
			res.render('error404')
		} else {
			console.log('Some other error: ', err.code)
			res.end('<h2>Error desconocido</h2>')
		}
	});
}
function getDos(req,res){
	let id    = req.session.id,
		rif   = req.query.rif ,
		year  = req.query.year,
		month = req.query.month
	if (!validId(id)) {
		res.status(400)
		res.render('error500',{message:"id corrupto, detectado posible ataque"})
		return
	}
	let path = process.cwd().split('\\\\').join('/') + '/dosimets/'+rif+'-'+year+'-'+month+'.xls'
	fs.stat( path , function( err , stat ) {
		if( err == null ) {
			res.setHeader( 'Content-type' , 'application/excel' )
			res.download( path )
		} else if(err.code == 'ENOENT') {
			// file does not exist
			res.render('error404')
		} else {
			console.log('Some other error: ', err.code)
			res.end('<h2>Error desconocido</h2>')
		}
	});
}

module.exports = {
	informe:inf,
	dosimet:dos,
	getInforme:getInf,
	getDosimet:getDos
}