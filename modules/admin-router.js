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
let formidable = require('formidable'),
	express = require('express'),
	crypto = require('crypto'),
	fs = require('fs')

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
const asyncQuery = (sql) => {
	return new Promise((successCallback,errorCallback)=>{
		con.query(sql,(errorInQuery,data)=>{
			if (errorInQuery) {
				errorCallback(errorInQuery)
			}else{
				successCallback(data)
			}
		})
	})
}
const cleanFileName = str => str.split('/').join('').split('.').join('')

/*
 * part 2 of the code (admin/*): 
*/
	router.get('/' , ( req , res ) => {
		con.query("SELECT email,id FROM usuarios WHERE userClass = 'P'",(err,data)=>{
			if(err)
				console.log(err)
			res.render( 'n-admin-start' , { error : err , data : data } )
		})
	})
	router.get('/physicist' , ( req , res ) => {
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
	router.get('/clinic' , ( req , res ) => {
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
	router.get('/newClinicForm' , ( req , res ) => {
		res.render('n-admin-new-clinic',{
			idUser:req.query.physicist
		})
	})
	router.get('/newEquipementForm' , ( req , res ) => {
		res.render( 'n-admin-new-equipement' , {
			rif : req.query.rif
		})
	})
	router.get('/newActivityForm' , ( req , res ) => {
		res.render( 'n-admin-new-activity' , {
			rif : req.query.rif
		})
	})
	router.get('/newRoomForm' , ( req , res ) => {
		res.render( 'n-admin-new-room' , {
			rif : req.query.rif
		})
	})
	router.get('/newChasisForm' , ( req , res ) => {
		res.render( 'n-admin-new-chasis' , {
			rif : req.query.rif
		})
	})
	router.get('/newDispForm' , ( req , res ) => {
		res.render( 'n-admin-new-disp' , {
			rif : req.query.rif
		})
	})
	router.get('/newImagenForm' , ( req , res ) => {
		res.render( 'n-admin-new-imagen' , {
			rif : req.query.rif
		})
	})
	router.get('/equipement' , ( req , res ) => {
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
	router.get('/rooms' , ( req , res ) => {
		let rif = req.query.rif
		const sql = `
		SELECT * FROM salas
		WHERE rif_clinica=${mysql.escape(rif)}
		`
		con.query(sql,(err,rooms)=>{
			if (err) {
				console.log(err)
				res.render('error500')
				return
			}
			res.render('n-admin-rooms' , {
				rooms : rooms,
				rif : req.query.rif
			})
		})
	})
	router.get('/modifyOrDeleteEquipement' , ( req , res ) => {
		res.render( 'n-admin-alter-equipement' , req.query )
	})
	router.get('/modifyOrDeleteRoom' , ( req , res ) => {
		res.render( 'n-admin-alter-room' , req.query )
	})
	router.get('/modifyOrDeleteActivity' , ( req , res ) => {
		res.render( 'n-admin-alter-activity' , req.query )
	})
	router.get('/modifyOrDeleteChasis' , ( req , res ) => {
		res.render( 'n-admin-alter-chasis' , req.query )
	})
	router.get('/modifyOrDeleteDisp' , ( req , res ) => {
		res.render( 'n-admin-alter-disp' , req.query )
	})
	router.get('/modifyOrDeleteImagen' , ( req , res ) => {
		res.render( 'n-admin-alter-imagen' , req.query )
	})
	router.get('/activities' , ( req , res ) => {
		const sql = `
			SELECT fecha,concepto FROM actividad WHERE rif_clinica=${mysql.escape(req.query.rif)}
		`
		con.query(sql,(err,activities)=>{
			if (err) {
				console.log(err)
				res.end('error500')
				return
			}
			res.render( 'n-admin-activities' , {
				activities:activities,
				rif:req.query.rif
			})
		})
	})
	router.get('/chasis' , ( req , res ) => {
		let rif = req.query.rif
		const sql = `
			SELECT * FROM qcchasis
			WHERE rif_clinica=${mysql.escape(rif)}
		`
		con.query(sql,(err,chasis)=>{
			if (err) {
				console.log(err)
				res.render('error500')
				return
			}
			res.render('n-admin-chasis' , {
				chasis : chasis,
				rif : req.query.rif
			})
		})
	})
	router.get('/disp' , async ( req , res ) => {
		let rif = mysql.escape(req.query.rif)
		let sql = 'SELECT * FROM qcdisp WHERE rif_clinica=' + rif
		try{
			let data = await asyncQuery(sql)
			res.render('n-admin-disp' , {
				data : data,
				rif : req.query.rif
			})
		}catch(err){
			console.log(err)
			res.render('error500')
			return
		}
	})
	router.get('/imagen' , async ( req , res ) => {
		let rif = mysql.escape(req.query.rif)
		let sql = 'SELECT * FROM qcimagen WHERE rif_clinica=' + rif
		try{
			let data = await asyncQuery(sql)
			res.render('n-admin-imagen' , {
				data : data,
				rif : req.query.rif
			})
		}catch(err){
			console.log(err)
			res.render('error500')
			return
		}
	})
	router.get('/changePhysicist' , async ( req , res ) => {
		try{
			let data = await asyncQuery("SELECT email,id FROM usuarios WHERE userClass = 'P'")
			res.render('n-admin-change-physicist',{
				data : data,
				rif : req.query.rif
			})
		}catch(e){
			console.log(e)
			res.render('error500')
			return
		}
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
		if ( !rif || !year || rif.length > 14 || !/^[\d|A-Z|-\s]*$/.test(rif) || !/^\d\d\d\d$/.test(year) ) {
			res.status(400)
			res.end('bad request detected')
			return
		}
		fileManager.getReportsFromYear(rif,year,(files)=>{
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
	router.post('/newEquipement',(req,res)=>{
		let { serie , rif , nombre , marca , modelo , sala , UltimoQc , ProxQc , observaciones } = req.body
		const sql = `
			INSERT INTO equipos (serie,rif_clinica,nombre,marca,modelo,sala,UltimoQc,ProxQc,observaciones)
			VALUES (
				${mysql.escape(serie)},
				${mysql.escape(rif)},
				${mysql.escape(nombre)},
				${mysql.escape(marca)},
				${mysql.escape(modelo)},
				${mysql.escape(sala)},
				${UltimoQc?mysql.escape(UltimoQc+'-1'):"NULL"},
				${ProxQc?mysql.escape(ProxQc+'-1'):"NULL"},
				${mysql.escape(observaciones)}
				)
		`
		con.query( sql , err => {
			if (err) {
				console.log(err)
				return
			}
			res.render('n-success-message',{
				message:'Creación de equipo exitoso'
			})
		})
	})
	router.post('/newRoom',(req,res)=>{
		let { rif , nombre , equipos , ProximoLev , UltimoLev , observaciones , identificador_en_clinica } = req.body
		const sql = `
			INSERT INTO salas (rif_clinica,equipos,ProximoLev,UltimoLev,observaciones,identificador_en_clinica)
			VALUES (
				${ mysql.escape( rif ) },
				${ mysql.escape( equipos ) },
				${ ProximoLev ? mysql.escape( ProximoLev + '-1' ) : "NULL" },
				${ UltimoLev  ? mysql.escape( UltimoLev  + '-1' ) : "NULL" },
				${ mysql.escape( observaciones ) },
				${ mysql.escape( identificador_en_clinica ) }
				)
		`
		con.query( sql , err => {
			if ( err ) {
				console.log( err )
				return
			}
			res.render( 'n-success-message' , {
				message : 'Creación de sala exitosa'
			})
		})
	})
	router.post('/newActivity',(req,res)=>{
		const { concepto , fecha , rif } = req.body
		if ( !concepto || !fecha || !rif ) {
			res.end(missingFieldsMessage)
			return
		}
		const sql = `
			INSERT INTO actividad(rif_clinica,fecha,concepto)
			VALUES (${mysql.escape(rif)},${mysql.escape(fecha)},${mysql.escape(concepto)})
		`
		con.query(sql,(err)=>{
			if (err) {
				console.log(err)
				return
			}
			res.render('n-success-message',{
				message:'Creación de actividad exitosa'
			})
		})
	})
	router.post('/newChasis',(req,res)=>{
		let { rif , marca , modelo , tamano , ubi , n , eval1 , date1 , obs1 , eval2 , date2 , obs2 } = req.body
		if ( !rif || !marca || !modelo || !tamano || !ubi || !n || !eval1 || !eval2 ) {
			res.end(missingFieldsMessage)
			return
		}
		modelo = mysql.escape( modelo )
		tamano = mysql.escape( tamano )
		marca = mysql.escape( marca )
		eval1 = mysql.escape( eval1 )
		date1 = mysql.escape( date1 ? date1 + '-1' : null )
		eval2 = mysql.escape( eval2 )
		date2 = mysql.escape( date2 ? date2 + '-1' : null )
		obs1 = mysql.escape( obs1 )
		obs2 = mysql.escape( obs2 )
		ubi = mysql.escape( ubi )
		rif = mysql.escape( rif )
		n = mysql.escape( n )
		const sql = `
			INSERT INTO qcChasis ( rif_clinica , marca , modelo , tamano , ubi , n , eval1 , date1 , obs1 , eval2 , date2 , obs2 ) VALUES
			(
				${rif},
				${marca},
				${modelo},
				${tamano},
				${ubi},
				${n},
				${eval1},
				${date1},
				${obs1},
				${eval2},
				${date2},
				${obs2}
			)
		`
		con.query(sql,(err)=>{
			if (err) {
				console.log(err)
				return
			}
			res.render('n-success-message',{
				message:'Creación de chasis exitosa'
			})
		})
	})
	router.post('/newDisp',(req,res)=>{
		let { rif , tipo , ubi , n , eval1 , date1 , obs1 , eval2 , date2 , obs2 } = req.body
		if ( !rif || !tipo || !ubi || !n || !eval1 || !eval2 ) {
			res.end(missingFieldsMessage)
			return
		}
		eval1 = mysql.escape( eval1 )
		date1 = mysql.escape( date1 ? date1 + '-1' : null )
		eval2 = mysql.escape( eval2 )
		date2 = mysql.escape( date2 ? date2 + '-1' : null )
		tipo = mysql.escape( tipo )
		obs1 = mysql.escape( obs1 )
		obs2 = mysql.escape( obs2 )
		ubi = mysql.escape( ubi )
		rif = mysql.escape( rif )
		n = mysql.escape( n )
		const sql = `
			INSERT INTO qcdisp ( rif_clinica , tipo , ubi , n , eval1 , date1 , obs1 , eval2 , date2 , obs2 ) VALUES
			(
				${rif},
				${tipo},
				${ubi},
				${n},
				${eval1},
				${date1},
				${obs1},
				${eval2},
				${date2},
				${obs2}
			)
		`
		con.query(sql,(err)=>{
			if (err) {
				console.log(err)
				return
			}
			res.render('n-success-message',{
				message:'Creación de dispositivo exitosa'
			})
		})
	})
	router.post('/newImagen',(req,res)=>{
		let { rif , tipo , ubi , n , eval1 , date1 , obs1 , eval2 , date2 , obs2 } = req.body
		if ( !rif || !tipo || !ubi || !n || !eval1 || !eval2 ) {
			res.end(missingFieldsMessage)
			return
		}
		eval1 = mysql.escape( eval1 )
		date1 = mysql.escape( date1 ? date1 + '-1' : null )
		eval2 = mysql.escape( eval2 )
		date2 = mysql.escape( date2 ? date2 + '-1' : null )
		tipo = mysql.escape( tipo )
		obs1 = mysql.escape( obs1 )
		obs2 = mysql.escape( obs2 )
		ubi = mysql.escape( ubi )
		rif = mysql.escape( rif )
		n = mysql.escape( n )
		const sql = `
			INSERT INTO qcimagen ( rif_clinica , tipo , ubi , n , eval1 , date1 , obs1 , eval2 , date2 , obs2 ) VALUES
			(
				${rif},
				${tipo},
				${ubi},
				${n},
				${eval1},
				${date1},
				${obs1},
				${eval2},
				${date2},
				${obs2}
			)
		`
		con.query(sql,(err)=>{
			if (err) {
				console.log(err)
				return
			}
			res.render('n-success-message',{
				message:'Creación de QC Imagen exitosa'
			})
		})
	})
/*
 * part 5 of the code (Read):
*/
/*
 * part 6 of the code (Update):
*/
	router.post('/changePhysicist',async (req,res)=>{
		try{
			await asyncQuery(`
				UPDATE clinicas
				SET id_encargado=${Number.parseInt(req.body.physicist_id)}
				WHERE rif=${mysql.escape(req.body.rif)}
				`)
			res.render('n-success-message',{
				message:'Encargado modificado'
			})
		}catch(e){
			console.log(e)
			res.render('error500')
			return
		}
	})
	router.post('/updateEquipement',(req,res)=>{
		const { serie , nombre , marca , modelo , sala , UltimoQc , ProxQc , observaciones } = req.body
		const esc = mysql.escape//shorthand for mysql.escape
		const sql = `
			UPDATE equipos SET
			
			nombre = ${esc(nombre)},
			marca = ${esc(marca)},
			modelo = ${esc(modelo)},
			sala = ${esc(sala)},
			UltimoQc = ${esc(UltimoQc+'-1')},
			ProxQc = ${esc(ProxQc+'-1')},
			observaciones = ${esc(observaciones)} 
			
			WHERE serie = ${esc(serie)}
		`
		con.query( sql , err => {
			if (err) {
				console.log(err)
				res.render('error500')
				return
			}
			res.render('n-success-message',{
				message:'Equipo con serial ' + req.body.serie + ' modificado'
			})
		})
	})
	router.post('/updateRoom',(req,res)=>{
		const { identificador_en_clinica , equipos , ProximoLev , UltimoLev , observaciones , id } = req.body
		const esc = mysql.escape//shorthand for mysql.escape
		const sql = `
			UPDATE salas SET
			
			identificador_en_clinica = ${esc(identificador_en_clinica)},
			equipos = ${esc(equipos)},
			ProximoLev = ${esc(ProximoLev+'-1')},
			UltimoLev = ${esc(UltimoLev+'-1')},
			observaciones = ${esc(observaciones)} 
			
			WHERE id = ${esc(id)}
		`
		con.query( sql , err => {
			if (err) {
				console.log(err)
				res.render('error500')
				return
			}
			res.render('n-success-message',{
				message:'Sala Modificada'
			})
		})
	})
	router.post('/updateActivity',(req,res)=>{
		const { fecha_nuevo , concepto_nuevo , fecha_anterior , concepto_anterior , rif_clinica_anterior } = req.body
		const sql = `
			UPDATE actividad SET

			fecha=${ mysql.escape( fecha_nuevo ) },
			concepto=${ mysql.escape( concepto_nuevo ) }

			WHERE rif_clinica=${ mysql.escape( rif_clinica_anterior ) } AND
			concepto=${ mysql.escape( concepto_anterior ) } AND
			fecha=${ mysql.escape( fecha_anterior ) }
		`
		con.query( sql , err => {
			if (err) {
				console.log(err)
				res.render('error500')
				return
			}
			res.render('n-success-message',{
				message:'Actividad Modificada'
			})
		})
	})
	router.post('/updateChasis',(req,res)=>{
		let { rif_clinica , marca , modelo , tamano , ubi , n , eval1 , obs1 , date1 , eval2 , obs2 , date2 } = req.body
		rif_clinica = mysql.escape(rif_clinica)
		marca = mysql.escape(marca)
		modelo = mysql.escape(modelo)
		tamano = mysql.escape(tamano)
		ubi = mysql.escape(ubi)
		n = mysql.escape(n)
		eval1 = mysql.escape(eval1)
		obs1 = mysql.escape(obs1)
		date1 = date1 ? mysql.escape(date1+'-1'):null
		eval2 = mysql.escape(eval2)
		obs2 = mysql.escape(obs2)
		date2 = date2 ? mysql.escape(date2+'-1'):null
		let sql = `
			UPDATE qcchasis SET
			marca=${marca},
			modelo=${modelo},
			tamano=${tamano},
			ubi=${ubi},
			eval1=${eval1},
			obs1=${obs1},
			date1=${date1},
			eval2=${eval2},
			obs2=${obs2},
			date2=${date2}
			WHERE n=${n} AND rif_clinica=${rif_clinica}
		`
		con.query( sql , err => {
			if (err) {
				console.log(err)
				res.render('error500')
				return
			}
			res.render('n-success-message',{
				message:'QC Chasis Modificado'
			})
		})
	})
	router.post('/updateDisp',(req,res)=>{
		let { rif_clinica , tipo , ubi , n , eval1 , obs1 , date1 , eval2 , obs2 , date2 } = req.body
		rif_clinica = mysql.escape(rif_clinica)
		tipo = mysql.escape(tipo)
		ubi = mysql.escape(ubi)
		n = mysql.escape(n)
		eval1 = mysql.escape(eval1)
		obs1 = mysql.escape(obs1)
		date1 = date1 ? mysql.escape(date1+'-1'):null
		eval2 = mysql.escape(eval2)
		obs2 = mysql.escape(obs2)
		date2 = date2 ? mysql.escape(date2+'-1'):null
		let sql = `
			UPDATE qcdisp SET
			tipo=${tipo},
			ubi=${ubi},
			eval1=${eval1},
			obs1=${obs1},
			date1=${date1},
			eval2=${eval2},
			obs2=${obs2},
			date2=${date2}
			WHERE n=${n} AND rif_clinica=${rif_clinica}
		`
		con.query( sql , err => {
			if (err) {
				console.log(err)
				res.render('error500')
				return
			}
			res.render('n-success-message',{
				message:'QC Dispositivo Modificado'
			})
		})
	})
	router.post('/updateImagen',(req,res)=>{
		let { rif_clinica , tipo , ubi , n , eval1 , obs1 , date1 , eval2 , obs2 , date2 } = req.body
		rif_clinica = mysql.escape(rif_clinica)
		tipo = mysql.escape(tipo)
		ubi = mysql.escape(ubi)
		n = mysql.escape(n)
		eval1 = mysql.escape(eval1)
		obs1 = mysql.escape(obs1)
		date1 = date1 ? mysql.escape(date1+'-1'):null
		eval2 = mysql.escape(eval2)
		obs2 = mysql.escape(obs2)
		date2 = date2 ? mysql.escape(date2+'-1'):null
		let sql = `
			UPDATE qcimagen SET
			tipo=${tipo},
			ubi=${ubi},
			eval1=${eval1},
			obs1=${obs1},
			date1=${date1},
			eval2=${eval2},
			obs2=${obs2},
			date2=${date2}
			WHERE n=${n} AND rif_clinica=${rif_clinica}
		`
		con.query( sql , err => {
			if (err) {
				console.log(err)
				res.render('error500')
				return
			}
			res.render('n-success-message',{
				message:'QC Imagen Modificado'
			})
		})
	})
/*
 * part 7 of the code (Delete):
*/
	router.get( '/deleteClinic' , ( req , res) => {
		const rif = mysql.escape(req.query.rif)
		Promise.all([
				'actividad WHERE rif_clinica =',
				'qcchasis WHERE rif_clinica =',
				'qcimagen WHERE rif_clinica =',
				'equipos WHERE rif_clinica =',
				'qcdisp WHERE rif_clinica =',
				'salas WHERE rif_clinica =',
				'clinicas WHERE rif ='
			].map(sql=>asyncQuery("DELETE FROM "+sql+rif)))
			.then(values=>{
				res.render('n-success-message',{
					message:'Clínica Eliminada'
				})
			}).catch(reason => { 
				console.log(reason)
				res.render('error500')
			})
	})
	router.post( '/deleteEquipemement' , ( req , res) => {
		if (!req.body.serie) {
			res.end('serial faltante')
			return
		}
		let sql = `DELETE FROM equipos WHERE serie=${mysql.escape(req.body.serie)}`
		con.query( sql , err => {
			if (err) {
				console.log(err)
				res.render('error500')
				return
			}
			res.render('n-success-message',{
				message:'Equipo con serial ' + req.body.serie + ' eliminado'
			})
		})
	})
	router.post( '/deleteRoom' , ( req , res ) => {
		let number = Number( req.body.id )
		if ( !req.body.id || isNaN( number ) ) {
			res.end('id faltante')
			return
		}
		let sql = `DELETE FROM salas WHERE id=${ number }`
		con.query( sql , err => {
			if (err) {
				console.log(err)
				res.render('error500')
				return
			}
			res.render('n-success-message',{
				message:'Sala eliminada'
			})
		})
	})
	router.post( '/deleteActivity' , ( req , res ) => {
		const { rif_clinica , concepto , fecha } = req.body
		if ( !rif_clinica || !concepto || !fecha ) {
			res.end('error inesperado')
			return
		}
		let sql = `
			DELETE FROM actividad
			WHERE rif_clinica=${mysql.escape(rif_clinica)} AND
			concepto=${mysql.escape(concepto)} AND
			fecha=${mysql.escape(fecha)}
		`
		con.query( sql , err => {
			if (err) {
				console.log(err)
				res.render('error500')
				return
			}
			res.render('n-success-message',{
				message:'Actividad eliminada'
			})
		})
	})
	router.post( '/deleteChasis' , ( req , res ) => {
		const { rif , n } = req.body
		if ( !rif || !n ) {
			res.end(missingFieldsMessage)
			return
		}
		let sql = `
			DELETE FROM qcchasis WHERE
			rif_clinica=${mysql.escape(rif)} AND
			n=${mysql.escape(n)}
		`
		con.query( sql , err => {
			if (err) {
				console.log(err)
				res.render('error500')
				return
			}
			res.render('n-success-message',{
				message:'QC Chasis eliminado'
			})
		})
	})
	router.post( '/deleteDisp' , ( req , res ) => {
		const { rif , n } = req.body
		if ( !rif || !n ) {
			res.end(missingFieldsMessage)
			return
		}
		let sql = `
			DELETE FROM qcdisp WHERE
			rif_clinica=${mysql.escape(rif)} AND
			n=${mysql.escape(n)}
		`
		con.query( sql , err => {
			if (err) {
				console.log(err)
				res.render('error500')
				return
			}
			res.render('n-success-message',{
				message:'QC Dispositivo eliminado'
			})
		})
	})
	router.post( '/deleteImagen' , ( req , res ) => {
		const { rif , n } = req.body
		if ( !rif || !n ) {
			res.end(missingFieldsMessage)
			return
		}
		let sql = `
			DELETE FROM qcimagen WHERE
			rif_clinica=${mysql.escape(rif)} AND
			n=${mysql.escape(n)}
		`
		con.query( sql , err => {
			if (err) {
				console.log(err)
				res.render('error500')
				return
			}
			res.render('n-success-message',{
				message:'QC Imagen eliminado'
			})
		})
	})
/*
 * part 8 of the code (File Upload and download):
*/
	//download report
	router.get( '/getReport' , ( req , res ) => {
		let { rif , year , month } = req.query
		if ( !rif || !year || !month || rif.length > 14 || !/^[\d|A-Z|-\s]*$/.test(rif) || !/^\d\d\d\d$/.test(year) || !/^\d\d?$/.test(month) ) {
			res.status(400)
			res.end('bad request detected')
			return
		}
		const fileName = `${rif}-${year}-${month}.docx`
		const filePath = 'informes/'
		fs.stat(filePath+fileName , function(err, stat) {
			if( !err ) {
				res.download( filePath + fileName , fileName , err => {
					if (err) {
						console.log('error',err)
					}
				})
			} else if(err.code === 'ENOENT') {
				res.render('n-success-message',{
					message:'Archivo no encontrado'
				})
				console.log( 'ENOENT' , filePath + fileName );
			} else {
				console.log( 'Some other error: ' , err.code );
			}
		})
	})
	router.post('/uploadReport',(req,res)=>{
		const form = new formidable.IncomingForm()
		form.parse(req, function (err, fields, files) {
			const oldpath = files.filetoupload.path,
				newpath = `informes/${req.query.rif}-${req.query.year}-${req.query.month}.docx`
			fs.rename(oldpath, newpath, function (err) {
				if (err) throw err
				res.write('{"success":true}')
				res.end()
			})
		})
	})

/*
 * part 9 of the code (module.exports):
*/
module.exports = router // this line MUST be the last one