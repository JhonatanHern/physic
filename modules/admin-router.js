/*
 * this code is divided in several blocks
 * 1 - import libraries and app's adjustements
 * 2 - pages that work in admin/* (render method is used on them)
 * 3 - get requests of JSON data (custom queries)
 * 4 - Create
 * 5 - Read (No special queries, plain ones straight from a table)
 * 6 - Update
 * 7 - Delete
 * 8 - File Upload and Download
 * 9 - module.exports
*/

//part 1 :
let express = require('express'),
	crypto = require('crypto')

let mysql = require('./connection'),
	fileManager = require('./fileManager')

let router = express.Router()
let con = mysql.connection;

router.use((req, res, next)=>{
	next()
})

let missingFieldsMessage = `
<html>
<body>
	Debe llenar todos los campos del formulario
	<script>setTimeout(()=>history.back(),1000)</script>
</body>
</html>
`

/*
 * part 2 of the code (admin/*): 
*/
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
router.get('/clinic',(req,res)=>{
	let rif = mysql.escape(req.query.rif)
	let sql = `
		SELECT nombre,id_encargado,observacion,ultcsl,vencsl,ultrim,venrim,ultpsr,venpsr,ultpfe,venpfe,f_ccsl,n_pcsl,f_crim,n_prim,f_cpsr,n_ppsr,f_cpfe,n_ppfe,prox_visita
		FROM clinicas
		WHERE rif=${rif}
		`
	con.query(sql,(err,clinic)=>{
		if (err) {
			console.log(err)
			res.render('error500')
			return
		}
		res.render('n-admin-clinic',{
			clinic : clinic[0]
		})
	})
})
router.get('/newUserForm',(req,res)=>{
	res.render('n-admin-new-user')
})
router.get('/newClinicForm',(req,res)=>{
	res.render('n-admin-new-clinic',{
		idUser:req.query.physicist
	})
})
router.get('/equipement',(req,res)=>{
	let rif = req.query.rif
	const sql = `
	SELECT * FROM equipos
	WHERE rif_clinica=${mysql.escape(rif)}
	`
	con.query(sql,(err,equipements)=>{
		if (err) {
			console.log(err)
			res.render('error500')
			return
		}
		res.render('n-admin-equipement' , {
			equipements : equipements,
			rif : req.query.rif
		})
	})
})
/*
 * part 3 of the code (get requests of JSON data):
*/
router.get('/pending', (req,res) => {
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
		clinicas.nombre AS clinica
	FROM equipos,clinicas
	WHERE
		equipos.rif_clinica = clinicas.rif AND
		clinicas.id_encargado = ${idPhysicist} AND
		DATE_ADD(equipos.ProxQC,INTERVAL -3 MONTH) < CURRENT_TIMESTAMP

	UNION

	SELECT
		CONCAT("SA-",salas.identificador_en_clinica) AS nombre,
		salas.ProximoLev AS fechaEvento,
		clinicas.nombre AS clinica
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
router.get('/reportsFromYear', (req,res) => {
	let { rif , year } = req.query
	if ( !rif || !year || rif.length > 14 || !/^[\d|A-Z|-\s]*$/.test(rif) || !/\d\d\d\d/.test(year) ) {
		res.status(400)
		res.end('bad request detected')
		return
	}
	fileManager.getReportsFromYear(rif,year,(files)=>{
		console.log(files)
		res.end(JSON.stringify(files))
	})
})
/*
 * part 4 of the code (Create):
*/
router.post('/newUser',(req,res)=>{
	let { mail , password , userClass } = req.body
	if ( !mail || !password || !userClass ) {
		res.end(missingFieldsMessage)
		return
	}
	mail = mysql.escape(mail)
	password = crypto.createHash('sha256').update(password).digest('hex')
	userClass = mysql.escape(userClass)
	const sql = `
		INSERT INTO usuarios(email,password,userClass)
		VALUES (${mail},'${password}',${userClass})
		`
	con.query(sql,(err)=>{
		if (err) {
			console.log(err)
			return
		}
		res.render('n-success-message',{
			message:'Creación de usuario exitosa'
		})
	})
})
router.post('/newClinic',(req,res)=>{
	let { nombre , rif } = req.body
	const physicistId = Number(req.query.idUser)
	if ( !nombre || !rif || isNaN(physicistId) ) {
		res.end(missingFieldsMessage)
		return
	}
	nombre = mysql.escape(nombre)
	rif = mysql.escape(rif)
	const sql = `
		INSERT INTO clinicas(rif,nombre,id_encargado)
		VALUES (${rif},${nombre},${physicistId})
	`
	con.query(sql,(err)=>{
		if (err) {
			console.log(err)
			return
		}
		res.render('n-success-message',{
			message:'Creación de clínica exitosa'
		})
	})
})
/*
 * part 5 of the code (Read):
*/
/*
 * part 6 of the code (Update):
*/
/*
 * part 7 of the code (Delete):
*/
/*
 * part 8 of the code (File Upload and download):
*/

/*
 * part 9 of the code (module.exports):
*/
module.exports = router // this line MUST be the last one