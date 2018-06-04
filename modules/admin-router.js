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

router.get('/physicist',(req,res)=>{
	let idPhysicist = Number(req.query.id)
	if (isNaN(idPhysicist)) {
		res.end('{"error":true}')
		return
	}
	let clinicQuery = `SELECT nombre,rif FROM clinicas WHERE id_encargado = ${idPhysicist}`

	con.query(`SELECT * FROM usuarios WHERE id = ${idPhysicist}`,(err1,physicist)=>{
		con.query(clinicQuery,(err2,clinics)=>{
			if (err2) {
				console.log(err2)
				return
			}
			res.render('n-admin-physicist',{
				clinics : clinics,
				physicist : physicist[0]
			})
		})
	})
})

router.get('/pending',(req,res)=>{
	let idPhysicist = Number(req.query.id)
	res.setHeader('Content-Type', 'application/json')
	if (isNaN(idPhysicist)) {
		res.end('{"error":true}')
		return
	}
	let pendingQuery = `
	SELECT
		CONCAT("EQ-",equipos.nombre) AS nombre,
		equipos.ProxQc AS fechaEvento,
		clinicas.nombre
	FROM equipos,clinicas
	WHERE
		equipos.rif_clinica = clinicas.rif AND
		clinicas.id_encargado = ${idPhysicist} AND
		DATE_ADD(equipos.ProxQC,INTERVAL -3 MONTH) < CURRENT_TIMESTAMP

	UNION

	SELECT
		CONCAT("SA-",salas.identificador_en_clinica) AS nombre,
		salas.ProximoLev AS fechaEvento,
		clinicas.nombre
	FROM salas,clinicas
	WHERE
		salas.rif_clinica = clinicas.rif AND
		clinicas.id_encargado = ${idPhysicist} AND
		DATE_ADD(salas.ProximoLev,INTERVAL -3 MONTH) < CURRENT_TIMESTAMP
	`
	con.query(pendingQuery,(err,data)=>{
		if (err) {
			console.log(err)
			res.end('{"error":"Error en la consulta"}')
			return
		}
		res.end(JSON.stringify(data))
	})
})

router.get('/clinic',(req,res)=>{
	let rif = mysql.escape(req.query.rif)
	/*
	*/
})

module.exports = router