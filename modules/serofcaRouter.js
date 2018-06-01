/* Tipos de usuario:
 * 	-administrador
 * 	-físico
*/

var express = require('express');

var mysql = require('./connection'),
	SHA256  = require('./SHA256'),
	validId   = require('./idValidator'),
	htmlFind    = require('./HTMLFinder'),
	subirInformes = require('./subirInformes');


var router = express.Router();
var con = mysql.connection;

router.use(function(req, res, next){next()});

router.get('/',function(req,res){
	var id = req.session.id+"";
	var user,clinics,redirect=false;
	con.executeByUser(id,
		function(user){
			con.query("SELECT * FROM clinicas WHERE id_encargado="+id,function(err,result) {
				if (err) {console.log(err)}
				res.render('py',{'user':user,'clinics':result});
				res.end();
			});
		},function(user){
			con.query("SELECT email,id FROM usuarios WHERE userClass='P'",function(err,physs) {
				if(err){
					console.log(err);
					res.render('error500',{message:err.message});
					return;
				}
				if (physs.length===0) {
					res.render('admin',{'fisicos':false,'user':user});
					return;
				}
				res.render('admin',{'fisicos':physs,'user':user});
			});
		},function(err){
			res.render('error500',{message:"Disculpa, pero no tienes permiso de ver esto."});
		}
	);
});
router.get('/pendientes'    ,function(req,res) {//read for both
	var id = req.session.id;
	if (!validId(id)) {
		res.end('{message:"id corrupto, detectado posible ataque"}');
		return;
	}
	con.executeByUser(id,
		function(p) {
			var days = new Date().toDateString().split(' ')[2]-1;
			var sqlEquipos = "SELECT equipos.nombre,clinicas.nombre AS Lugar,DATE(equipos.ProxQc) AS ProxQc FROM equipos INNER JOIN clinicas ON equipos.rif_clinica=clinicas.rif"+
				" WHERE equipos.id_encargado="+id+
				" AND (equipos.ProxQC=DATE_ADD(CURDATE(),INTERVAL -"+days+" DAY) OR"+
					" DATE_ADD(equipos.ProxQC,INTERVAL -1 MONTH)=DATE_ADD(CURDATE(),INTERVAL -"+days+" DAY) OR"+
					" DATE_ADD(equipos.ProxQC,INTERVAL -2 MONTH)=DATE_ADD(CURDATE(),INTERVAL -"+days+" DAY) OR"+
					" DATE_ADD(equipos.ProxQC,INTERVAL -3 MONTH)=DATE_ADD(CURDATE(),INTERVAL -"+days+" DAY)) "+
				" ORDER BY ProxQC ASC";
			var sqlSalas = "SELECT identificador_en_clinica AS nombre,clinicas.nombre AS Lugar,DATE(ProximoLev) AS ProximoLev FROM salas INNER JOIN clinicas ON salas.rif_clinica=clinicas.rif"+
				" WHERE salas.id_encargado="+id+
				" AND (salas.ProximoLev=DATE_ADD(CURDATE(),INTERVAL -"+days+" DAY) OR"+
					 " DATE_ADD(salas.ProximoLev,INTERVAL -1 MONTH)=DATE_ADD(CURDATE(),INTERVAL -"+days+" DAY) OR"+
					 " DATE_ADD(salas.ProximoLev,INTERVAL -2 MONTH)=DATE_ADD(CURDATE(),INTERVAL -"+days+" DAY) OR"+
					 " DATE_ADD(salas.ProximoLev,INTERVAL -3 MONTH)=DATE_ADD(CURDATE(),INTERVAL -"+days+
					 " DAY)) ORDER BY ProximoLev DESC";
			con.query(sqlEquipos,function(err,equipos){
				con.query(sqlSalas,function(err,salas){
					if (err) {console.log(err)}
					res.setHeader('Content-Type', 'application/json');
					res.end(JSON.stringify({'equipos':equipos,'salas':salas}));
				});
			});
		},function(a){
			id = req.query.IDU ;
			if(!id){
				res.setHeader('Content-Type', 'application/json');
				res.end('{"message":"IDU not in the query"}');
				console.log('{"message":"IDU not in the query"}');
				return;
			}
			var days = new Date().toDateString().split(' ')[2]-1;
			var sqlEquipos = "SELECT equipos.nombre,clinicas.nombre AS Lugar,DATE(equipos.ProxQc) AS ProxQc FROM equipos INNER JOIN clinicas ON equipos.rif_clinica=clinicas.rif"+
				" WHERE equipos.id_encargado="+id+
				" AND (equipos.ProxQC=DATE_ADD(CURDATE(),INTERVAL -"+days+" DAY) OR"+
					" DATE_ADD(equipos.ProxQC,INTERVAL -1 MONTH)=DATE_ADD(CURDATE(),INTERVAL -"+days+" DAY) OR"+
					" DATE_ADD(equipos.ProxQC,INTERVAL -2 MONTH)=DATE_ADD(CURDATE(),INTERVAL -"+days+" DAY) OR"+
					" DATE_ADD(equipos.ProxQC,INTERVAL -3 MONTH)=DATE_ADD(CURDATE(),INTERVAL -"+days+" DAY)) "+
				" ORDER BY ProxQC ASC";
			var sqlSalas = "SELECT identificador_en_clinica AS nombre,clinicas.nombre AS Lugar,DATE(ProximoLev) AS ProximoLev FROM salas INNER JOIN clinicas ON salas.rif_clinica=clinicas.rif"+
				" WHERE salas.id_encargado="+id+
				" AND (salas.ProximoLev=DATE_ADD(CURDATE(),INTERVAL -"+days+" DAY) OR"+
					 " DATE_ADD(salas.ProximoLev,INTERVAL -1 MONTH)=DATE_ADD(CURDATE(),INTERVAL -"+days+" DAY) OR"+
					 " DATE_ADD(salas.ProximoLev,INTERVAL -2 MONTH)=DATE_ADD(CURDATE(),INTERVAL -"+days+" DAY) OR"+
					 " DATE_ADD(salas.ProximoLev,INTERVAL -3 MONTH)=DATE_ADD(CURDATE(),INTERVAL -"+days+
					 " DAY)) ORDER BY ProximoLev DESC";
			con.query(sqlEquipos,function(err,equipos){
				con.query(sqlSalas,function(err,salas){
					if (err) {console.log(err)}
					res.setHeader('Content-Type', 'application/json');
					res.end(JSON.stringify({'equipos':equipos,'salas':salas}));
				});
			});
		},function(){
		}
	);
});
router.get('/pasados'       ,function(req,res) {//read for both
	//SELECT * FROM film WHERE CURRENT_TIMESTAMP > last_update;
	var id = req.session.id;
	if (!validId(id)) {
		res.end('{message:"id corrupto, detectado posible ataque"}');
		return;
	}
	con.executeByUser(id,function(argument) {
		let sqlSalas = 'SELECT salas.identificador_en_clinica,clinicas.nombre,ProximoLev AS expiration_date'+
			' FROM salas INNER JOIN clinicas '+
			'ON salas.rif_clinica=clinicas.rif '+
			`WHERE CURRENT_TIMESTAMP > ProximoLev AND salas.id_encargado=${id}`;
		let sqlEquipos = 'SELECT equipos.nombre,clinicas.nombre AS clinica,ProxQc AS expiration_date'+
			' FROM equipos INNER JOIN clinicas ON equipos.rif_clinica=clinicas.rif'+
			' WHERE CURRENT_TIMESTAMP > ProxQC AND equipos.id_encargado='+id;
		con.query(sqlEquipos,function(err,equipos){
			con.query(sqlSalas,function(err,salas){
				if (err) {console.log(err)}
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify({'equipos':equipos,'salas':salas}));
			});
		});
	},function(argument) {
		id = req.query.IDU;
		let sqlSalas = 'SELECT salas.identificador_en_clinica,clinicas.nombre,ProximoLev AS expiration_date'+
			' FROM salas INNER JOIN clinicas '+
			'ON salas.rif_clinica=clinicas.rif '+
			`WHERE CURRENT_TIMESTAMP > ProximoLev AND salas.id_encargado=${id}`;
		let sqlEquipos = 'SELECT equipos.nombre,clinicas.nombre AS clinica,ProxQc AS expiration_date'+
			' FROM equipos INNER JOIN clinicas ON equipos.rif_clinica=clinicas.rif'+
			' WHERE CURRENT_TIMESTAMP > ProxQC AND equipos.id_encargado='+id;
		con.query(sqlEquipos,function(err,equipos){
			con.query(sqlSalas,function(err,salas){
				if (err) {console.log(err)}
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify({'equipos':equipos,'salas':salas}));
			});
		});
	},function(argument){
		res.end('no');
	});
});
router.get('/equipos'       ,function(req,res) {//read for both
	var id = req.session.id;
	let objFound = htmlFind(req.query,['rif']);
	if (!objFound.clean) {
		res.status(400);
		res.render('error500',{message:"rif corrupto, detectado posible ataque"});
		return;
	}
	con.executeByUser(id,
		function(){
			var sql = "SELECT nombre,sala,UltimoQc,ProxQc,observaciones,serie,marca,modelo FROM equipos WHERE rif_clinica="+
				mysql.escape(req.query.rif)+" AND id_encargado="+id+" ORDER BY ProxQC ASC";
			con.query(sql,function(err,equipos){
				res.setHeader('Content-Type','application/json');
				res.end(JSON.stringify(equipos));
			});
		},function () {
			id = req.query.IDU;
			if(!id){
				res.setHeader('Content-Type','application/json');
				res.end('{"message":"Missing IDU"}');
				return;
			}
			var sql = "SELECT nombre,sala,UltimoQc,ProxQc,observaciones,serie,marca,modelo,NOW() as resetter FROM equipos WHERE rif_clinica="+
				mysql.escape(req.query.rif)+" AND id_encargado="+id+" ORDER BY ProxQC ASC";
			con.query(sql,function(err,equipos){
				res.setHeader('Content-Type','application/json');
				res.end(JSON.stringify(equipos));
			});
		},function () {
		}
	);
});
router.get('/salas'         ,function(req,res) {//read for both
	var id = req.session.id;
	let objFound = htmlFind(req.query,['rif']);
	if (!objFound.clean) {
		res.status(400);
		res.render('error500',{message:"rif corrupto, detectado posible ataque"});
		return;
	}
	con.executeByUser(id,
		function(){
			var rif = mysql.escape(req.query.rif);
			var sql = "SELECT * FROM salas WHERE id_encargado="+id+
				" AND rif_clinica="+rif+" ORDER BY ProximoLev ASC";
			con.query(sql,function(err,salas){
				res.setHeader('Content-Type','application/json');
				res.end(JSON.stringify(salas));
			});
		},function () {
			id = req.query.IDU;
			if(!id){
				res.setHeader('Content-Type','application/json');
				res.end('{"message":"Missing IDU"}');
				return;
			}
			var rif = mysql.escape(req.query.rif);
			var sql = "SELECT * FROM salas WHERE id_encargado="+id+
				" AND rif_clinica="+rif+" ORDER BY ProximoLev ASC";
			con.query(sql,function(err,salas){
				res.setHeader('Content-Type','application/json');
				res.end(JSON.stringify(salas));
			});
		},function () {
			res.setHeader('Content-Type','application/json');
			res.end('{"message":"not allowed to enter here"}');
		}
	);
});
router.get('/clinica'       ,function(req,res) {//read for both
	var id = req.session.id;
	let objFound = htmlFind(req.query,['rif']);
	if (!objFound.clean) {
		res.status(400);
		console.log('NOT CLEAN');
		res.render('error500',{message:"rif corrupto, detectado posible ataque"});
		return;
	}
	var rif = req.query.rif;
	
	con.executeByUser(id,
		function () {
			var sql='SELECT nombre,ultcsl,vencsl,ultrim,venrim,ultpsr,venpsr,ultpfe,venpfe,rif,observacion'+
			',f_ccsl,n_pcsl,f_crim,n_prim,f_cpsr,n_ppsr,f_cpfe,n_ppfe'+
			' FROM clinicas WHERE rif='+mysql.escape(rif)+" AND id_encargado="+id;
			con.query(sql,function(err,clinica){
				if ( err ) console.log( err )
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(clinica[0]));
			});
		},function() {
			if (!req.query.IDU||!validId(req.query.IDU)) {
				res.setHeader('Content-Type', 'application/json');
				res.end('{"message":"missing IDU"}');
				console.log('{"message":"missing IDU"}');
				return;
			}
			var sql='SELECT nombre,ultcsl,vencsl,ultrim,venrim,ultpsr,venpsr,ultpfe,venpfe,rif,observacion'+
			',f_ccsl,n_pcsl,f_crim,n_prim,f_cpsr,n_ppsr,f_cpfe,n_ppfe'+
			' FROM clinicas WHERE rif='+mysql.escape(rif)+" AND id_encargado="+req.query.IDU;
			con.query(sql,function(err,clinica){
				if ( err ) console.log( err )
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(clinica[0]));
			});
		},function() {
		}
	);
});
router.get('/getClinicas'   ,function(req,res) {//read for admins
	var id = req.session.id;
	if (!validId(id)||!req.query.IDU) {
		res.status(400);
		res.setHeader('Content-Type', 'application/json');
		res.end('{"message":"data corrupta, detectado posible ataque"');
		return;
	}
	con.executeByUser(
		id,
		function(p){
			res.end('no');
		},function(a) {
			con.query('SELECT * FROM clinicas where id_encargado='+mysql.escape(req.query.IDU),function(err,cls){
				if (err) {
					res.setHeader('Content-Type', 'application/json');
					res.end('{"message":"error en la consulta"');
					return;
				}
				if (cls && cls.length){
					quicksort( 0 , cls.length-1 , cls )
				}
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(cls));
			});
		},function() {
			res.end('no');
		}
	);
});
router.get('/getChasis'     ,function(req,res) {//read for both
	var id = req.session.id;
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	let rif = mysql.escape(req.query.rif);
	con.executeByUser(
		id,
		function() {
			let sql = `SELECT * FROM qcchasis WHERE rif_clinica = ${rif}`;
			con.query(sql,function(err,data) {
				res.setHeader('Content-Type','application/json');
				if (err) {
					res.end('{"error":true}');
					throw err;
				}
				res.end(JSON.stringify(data));
			})
		},
		function() {
			let sql = `SELECT * FROM qcchasis WHERE rif_clinica = ${rif}`;
			con.query(sql,function(err,data) {
				res.setHeader('Content-Type','application/json');
				if (err) {
					res.end('{"error":true}');
					throw err;
				}
				res.end(JSON.stringify(data));
			})
		},
		function() {
			res.end('no');
		}
	);
});
router.get('/getDisp'       ,function(req,res) {//read for both
	var id = req.session.id;
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	let rif = mysql.escape(req.query.rif);
	con.executeByUser(
		id,
		function() {
			let sql = `SELECT * FROM qcdisp WHERE rif_clinica = ${rif}`;
			con.query(sql,function(err,data) {
				res.setHeader('Content-Type','application/json');
				if (err) {
					res.end('{"error":true}');
					throw err;
				}
				res.end(JSON.stringify(data));
			})
		},
		function() {
			let sql = `SELECT * FROM qcdisp WHERE rif_clinica = ${rif}`;
			con.query(sql,function(err,data) {
				res.setHeader('Content-Type','application/json');
				if (err) {
					res.end('{"error":true}');
					throw err;
				}
				res.end(JSON.stringify(data));
			})
		},
		function() {
			res.end('no');
		}
	);
});
router.get('/getImagen'     ,function(req,res) {//read for both
	var id = req.session.id;
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	let rif = mysql.escape(req.query.rif);
	con.executeByUser(
		id,
		function() {
			let sql = `SELECT * FROM qcimagen WHERE rif_clinica = ${rif}`;
			con.query(sql,function(err,data) {
				res.setHeader('Content-Type','application/json');
				if (err) {
					res.end('{"error":true}');
					throw err;
				}
				res.end(JSON.stringify(data));
			})
		},
		function() {
			let sql = `SELECT * FROM qcimagen WHERE rif_clinica = ${rif}`;
			con.query(sql,function(err,data) {
				res.setHeader('Content-Type','application/json');
				if (err) {
					res.end('{"error":true}');
					throw err;
				}
				res.end(JSON.stringify(data));
			})
		},
		function() {
			res.end('no');
		}
	);
});
//esta función obtiene los datos de la actividad.
router.get('/getActividades',function(req,res) {
	let rif = mysql.escape(req.query.rif),
		sql = `SELECT * FROM actividad WHERE rif_clinica=${rif}`;
	res.setHeader('Content-Type', 'application/json');
	con.query(sql,function(err,acts) {
		if (err) {
			res.end('{"success":false,"error":"error desconocido"}');
			console.log(err);
			return;
		}
		res.end(JSON.stringify(acts));
	})
});
//esta función obtiene el nombre de la clínica junto a la actividad.
router.get('/getActividadesClinica',function(req,res) {
	let rif = mysql.escape(req.query.rif),
		sql = `SELECT actividad.* , clinicas.nombre FROM actividad JOIN clinicas ON actividad.rif_clinica=clinicas.rif WHERE rif_clinica=${rif}`;
	res.setHeader('Content-Type', 'application/json');
	con.query(sql,function(err,acts) {
		if (err) {
			res.end('{"success":false,"error":"error desconocido"}');
			console.log(err);
			return;
		}
		res.end(JSON.stringify(acts));
	})
});
//esta función obtiene el nombre de la clínica junto a la actividad.
//a diferencia de la anterior, esta trae solamente las actualizadas.
router.get('/getActividadesClinicaActualizada',function(req,res) {
	let rif = mysql.escape(req.query.rif),
		sql = `SELECT actividad.* , clinicas.nombre FROM actividad JOIN clinicas ON actividad.rif_clinica=clinicas.rif WHERE rif_clinica=${rif} AND actividad.fecha > CURDATE()`;
	res.setHeader('Content-Type', 'application/json');
	con.query(sql,function(err,acts) {
		if (err) {
			res.end('{"success":false,"error":"error desconocido"}');
			console.log(err);
			return;
		}
		res.end(JSON.stringify(acts));
	})
});


///////////////////////////////////////////////////////
///////////////////////////////////////////////////////

router.post("/nuevaActividad",function(req,res) {
	let rif = mysql.escape(req.body.rif_clinica),
		fecha = mysql.escape(req.body.fecha),
		concepto = mysql.escape(req.body.concepto)
	con.executeByUser(req.session.id,
		()=>res.end('forbidden access'),
		function() {
			let sql = `INSERT INTO actividad (rif_clinica,fecha,concepto) VALUES (${rif},${fecha},${concepto})`
			console.log(sql)
			con.query(sql,function(err) {
				if (err) {
					console.log(err)
				}
				res.end(JSON.stringify({
					success:!err,
					message:err?'error desconocido':'proceso exitoso'
				}))
			})
		}
	);
})
router.post("/nuevoEquipo"   ,function (req,res) {//create for both
	var id = req.session.id;
	var body = req.body;
	var sql = "SELECT * FROM equipos WHERE rif_clinica="+
		(body.rif?mysql.escape(body.rif):"NULL")+
		" AND nombre="+
		(body.nombre?mysql.escape(body.nombre):"NULL");
	con.executeByUser(id,function(){
		con.query(sql,function(err,eqs){
			if (err) {
				res.setHeader('Content-Type', 'application/json');
				res.end('{"success":false,"error":"error desconocido"}');
				console.log(err);
				return;
			}
			if (eqs.length > 0) {
				res.setHeader('Content-Type', 'application/json');
				res.end('{"success":false,"error":"nombre de equipo repetido"}');
				console.log(eqs);
				return;
			}
			let objFound = htmlFind(req.body,['serial','rif','nombre','observacion','marca','modelo','uqc','pqc']);
			if (!objFound.clean) {
				res.status(400);
				res.end('{"success":false,"message":"data corrupta, detectado posible ataque"}');
				return;
			}
			sql = "INSERT INTO equipos (serie,rif_clinica,id_encargado,nombre,marca,modelo,UltimoQc,ProxQc,sala,observaciones) VALUES ("+
				mysql.escape(body.serial)+","+
				(body.rif?mysql.escape(body.rif):"NULL")+","+
				(id?id:"NULL")+","+
				(body.nombre?mysql.escape(body.nombre):"NULL")+","+
				(body.marca?mysql.escape(body.marca):"NULL")+","+
				(body.modelo?mysql.escape(body.modelo):"NULL")+","+
				(body.uqc?mysql.escape(body.uqc+'-1'):"NULL")+","+
				(body.pqc?mysql.escape(body.pqc+'-1'):"NULL")+","+
				(body.sala?mysql.escape(body.sala):"NULL")+","+
				(body.observacion?mysql.escape(body.observacion):"NULL")+")";
			con.query(sql,function(err) {
				if (err) {
					console.log(err)
					res.setHeader('Content-Type', 'application/json');
					res.end('{"success":false,"error":"serial de equipo repetido"}');
					return;
				}
				res.setHeader('Content-Type', 'application/json');
				res.end('{"success":true}');
			});
		});
	},function(){
		con.query(sql,function(err,eqs){
			if (err) {
				res.setHeader('Content-Type', 'application/json');
				res.end('{"success":false,"error":"error desconocido"}');
				console.log(err);
				return;
			}
			if (eqs.length > 0) {
				res.setHeader('Content-Type', 'application/json');
				res.end('{"success":false,"error":"nombre de equipo repetido"}');
				return;
			}
			let objFound = htmlFind(req.body,['serial','rif','nombre','observacion','marca','modelo','uqc','pqc']);
			if (!objFound.clean) {
				res.status(400);
				res.end('{"success":false,"message":"data corrupta, detectado posible ataque"}');
				return;
			}
			id = req.body.IDU;
			if (!validId(id)) {
				res.status(400);
				res.end('');
				return;
			}
			sql = "INSERT INTO equipos (serie,rif_clinica,id_encargado,nombre,marca,modelo,UltimoQc,ProxQc,sala,observaciones) VALUES ("+
				mysql.escape(body.serial)+","+
				(body.rif?mysql.escape(body.rif):"NULL")+","+
				(id?id:"NULL")+","+
				(body.nombre?mysql.escape(body.nombre):"NULL")+","+
				(body.marca?mysql.escape(body.marca):"NULL")+","+
				(body.modelo?mysql.escape(body.modelo):"NULL")+","+
				(body.uqc?mysql.escape(body.uqc+'-1'):"NULL")+","+
				(body.pqc?mysql.escape(body.pqc+'-1'):"NULL")+","+
				(body.sala?mysql.escape(body.sala):"NULL")+","+
				(body.observacion?mysql.escape(body.observacion):"NULL")+")";
			con.query(sql,function(err) {
				if (err) {
					res.setHeader('Content-Type', 'application/json');
					console.log(err);
					res.end('{"success":false,"error":"serial de equipo repetido"}');
					return;
				}
				res.setHeader('Content-Type', 'application/json');
				res.end('{"success":true}');
			});
		});
	},function(){
		res.status(400);
		res.end('');
	});
});
router.post("/nuevaSala"     ,function (req,res){//create for both
	var id = req.session.id;
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	var body = req.body;
	if(!body.rif_clinica||!body.identificador_en_clinica||!body.plv||!body.ulv){
		res.setHeader('Content-Type', 'application/json');
		res.end('{"message":"faltan datos"}');
		return;
	}
	con.executeByUser(id,
		function(){
			var sql = "SELECT * FROM salas WHERE rif_clinica="+
				mysql.escape(body.rif_clinica)+
				"AND identificador_en_clinica="+
				mysql.escape(body.identificador_en_clinica);
			con.query(sql,function(err,salas) {
				if(err){
					res.setHeader('Content-Type', 'application/json');
					res.end('{"message":"'+err.toString()+'"}');
					return;
				}
				if(salas.length>0){
					res.setHeader('Content-Type', 'application/json');
					res.end('{"message":"Nombre repetido en esta clínica"}');
					return;
				}
				let objFound = htmlFind(body,['rif_clinica','identificador_en_clinica','equipos','plv','ulv','observaciones']);
				if (!objFound.clean) {
					res.end('{"message":"data corrupta, detectado posible ataque"}');
					return;
				}
				var sql = "INSERT INTO salas (rif_clinica,identificador_en_clinica,"+
					"id_encargado,equipos,ProximoLev,UltimoLev,observaciones) VALUES ("+
					mysql.escape(body.rif_clinica)+","+
					mysql.escape(body.identificador_en_clinica)+","+
					id+","+
					(body.equipos?mysql.escape(body.equipos):"NULL")+","+
					mysql.escape(body.plv+'-1')+","+
					mysql.escape(body.ulv+'-1')+","+
					(body.observaciones?mysql.escape(body.observaciones):"NULL")+")";
					
				con.query(sql,function(err){
					if (err) {
						res.setHeader('Content-Type', 'application/json');
						res.end('{"message":"'+err.toString()+'"}');
						return;
					}
					res.setHeader('Content-Type','application/json');
					res.end('{"success":true}');
				});
			});
		},
		function(){
			id = req.body.IDU;
			if (!validId(id)) {
				res.status(400);
				res.end('');
				return;
			}
			var sql = "SELECT * FROM salas WHERE rif_clinica="+
				mysql.escape(body.rif_clinica)+
				"AND identificador_en_clinica="+
				mysql.escape(body.identificador_en_clinica);
			con.query(sql,function(err,salas) {
				if(err){
					res.setHeader('Content-Type', 'application/json');
					res.end('{"message":"'+err.toString()+'"}');
					return;
				}
				if(salas.length>0){
					res.setHeader('Content-Type', 'application/json');
					res.end('{"message":"Nombre repetido en esta clínica"}');
					return;
				}
				let objFound = htmlFind(body,['rif_clinica','identificador_en_clinica','equipos','plv','ulv','observaciones']);
				if (!objFound.clean) {
					res.end('{"message":"data corrupta, detectado posible ataque"}');
					return;
				}
				var sql = "INSERT INTO salas (rif_clinica,identificador_en_clinica,"+
					"id_encargado,equipos,ProximoLev,UltimoLev,observaciones) VALUES ("+
					mysql.escape(body.rif_clinica)+","+
					mysql.escape(body.identificador_en_clinica)+","+
					id+","+
					(body.equipos?mysql.escape(body.equipos):"NULL")+","+
					mysql.escape(body.plv+'-1')+","+
					mysql.escape(body.ulv+'-1')+","+
					(body.observaciones?mysql.escape(body.observaciones):"NULL")+")";
					
				con.query(sql,function(err){
					if (err) {
						res.setHeader('Content-Type', 'application/json');
						res.end('{"message":"'+err.toString()+'"}');
						console.log(err);
						return;
					}
					res.setHeader('Content-Type','application/json');
					res.end('{"success":true}');
				});
			});
		},
		function(){
			res.status(400);
			res.end('');
		}
	);
});
router.post('/nuevaClinica'  ,function (req,res) {//create for admins
	var id = req.session.id;
	if (!validId(id)||!req.body.IDU||!validId(req.body.IDU)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	res.setHeader("Content-Type",'application/json');
	con.executeByUser(id,
		function() {
			res.end('{"message":"cracking detected"}');
			console.log("CRACKING DETECTED FROM "+req.connection.remoteAddress);
		},function() {
			let body = req.body;
			let sql = "INSERT INTO clinicas (nombre,rif,id_encargado,ultcsl,vencsl,ultrim,venrim,ultpsr,venpsr,ultpfe,venpfe,observacion,f_ccsl,n_pcsl,f_crim,n_prim,f_cpsr,n_ppsr,f_cpfe,n_ppfe) VALUES ("+
				((body.nombre)?mysql.escape(body.nombre):"NULL")+','+
				((body.rif)?mysql.escape(body.rif):"NULL")+','+
				body.IDU+','+
				((body.ultcsl)?mysql.escape(body.ultcsl+'-1'):"NULL")+','+
				((body.vencsl)?mysql.escape(body.vencsl+'-1'):"NULL")+','+
				((body.ultrim)?mysql.escape(body.ultrim+'-1'):"NULL")+','+
				((body.venrim)?mysql.escape(body.venrim+'-1'):"NULL")+','+
				((body.ultpsr)?mysql.escape(body.ultpsr+'-1'):"NULL")+','+
				((body.venpsr)?mysql.escape(body.venpsr+'-1'):"NULL")+','+
				((body.ultpfe)?mysql.escape(body.ultpfe+'-1'):"NULL")+','+
				((body.venpfe)?mysql.escape(body.venpfe+'-1'):"NULL")+','+
				((body.observacion)?mysql.escape(body.observacion):"NULL")+','+
				((body.f_ccsl)?mysql.escape(body.f_ccsl+'-1'):"NULL")+','+
				((body.n_pcsl)?Number(body.n_pcsl):"NULL")+','+
				((body.f_crim)?mysql.escape(body.f_crim+'-1'):"NULL")+','+
				((body.n_prim)?Number(body.n_prim):"NULL")+','+
				((body.f_cpsr)?mysql.escape(body.f_cpsr+'-1'):"NULL")+','+
				((body.n_ppsr)?Number(body.n_ppsr):"NULL")+','+
				((body.f_cpfe)?mysql.escape(body.f_cpfe+'-1'):"NULL")+','+
				((body.n_ppfe)?Number(body.n_ppfe):"NULL")+')';
			con.query(sql,function(err) {
				if (err) {
					res.end('{"message":"rif repetido"}');
					//console.log(err);
				} else {
					res.end('{"success":true}');
				}
			})
		},function(){
			res.end('{"message":"cracking detected"}');
			console.log("CRACKING DETECTED FROM "+req.connection.remoteAddress);
		}
	);
});
router.post('/nuevoUsuario'  ,function (req,res) {//create for admins
	var id = req.session.id;
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	if(!(req.body.userClass&&req.body.password&&req.body.email)){
		res.end('');
		console.log('missing data');
		return;
	}
	res.setHeader("Content-Type",'application/json');
	con.executeByUser(id,
		function() {
			res.end('{"message":"cracking detected"}');
			console.log("CRACKING DETECTED FROM "+req.connection.remoteAddress);
		},function() {
			var sql = 'INSERT INTO usuarios (email,userClass,password) VALUES ('+
				mysql.escape(req.body.email);
			if (req.body.userClass==='A') {
				sql +=',"A",';
			}else if (req.body.userClass==='P') {
				sql +=',"P",';
			}else{
				res.end('{"message":"unknown error"}');
				return;
			}
			sql += mysql.escape(SHA256(req.body.password))+')';
			con.query(sql,function(err) {
				if (err) {
					res.end('{"message":"unknown error"}');
					console.log(err);
				} else {
					res.end('{"success":true}');
				}
			})
		},function () {
			res.end('{"message":"cracking detected"}');
			console.log("CRACKING DETECTED FROM "+req.connection.remoteAddress);
		}
	);
});
router.post( '/newChasis'    ,function (req,res) {//create for both
	var id = req.session.id;
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	let body = req.body;
	let validate = `SELECT * FROM qcchasis WHERE rif_clinica = ${mysql.escape(body.rif)} AND n = ${body.n}`
	let sql = 'INSERT INTO qcchasis (rif_clinica,marca,modelo,tamano,ubi,n,eval1,obs1,date1,eval2,obs2,date2) VALUES ('+
		mysql.escape(body.rif_clinica)+','+
		mysql.escape(body.marca)+','+
		mysql.escape(body.modelo)+','+
		mysql.escape(body.tamano)+','+
		mysql.escape(body.ubi)+','+
		(body.n-0)+','+
		mysql.escape(body.eval1)+','+
		mysql.escape(body.obs1)+','+
		(body.date1?mysql.escape(body.date1+'-1'):"NULL")+','+
		mysql.escape(body.eval2)+','+
		mysql.escape(body.obs2)+','+
		(body.date2?mysql.escape(body.date2+'-1'):"NULL")+')';
	con.executeByUser(id,
		function(argument) {
			con.query(validate,function(err,data) {
				res.setHeader('Content-Type','application/json');
				if (err) {
					res.end('{"error":true}');
					console.log(err);
					return;
				}
				if (data.length !== 0) {
					res.end('{"error":"número repetido en esta clínica"}');
				} else {
					con.query(sql,function(err) {
						if (err) {
							console.log(err);
							res.end('{"error":"unknown error"}');
							return;
						}
						res.end('{"success":true}');
					})
				}
			})
		},function(argument) {
			con.query(validate,function(err,data) {
				res.setHeader('Content-Type','application/json');
				if (err) {
					res.end('{"error":true}');
					console.log(err);
					return;
				}
				if (data.length !== 0) {
					res.end('{"error":"número repetido en esta clínica"}');
				} else {
					con.query(sql,function(err) {
						if (err) {
							console.log(err);
							res.end('{"error":"unknown error"}');
							return;
						}
						res.end('{"success":true}');
					})
				}
			})
		},function(argument) {
			res.end('no');
		}
	);
});
router.post( '/newDisp'      ,function (req,res) {//create for both
	var id = req.session.id;
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	let body = req.body;
	let validate = `SELECT * FROM qcdisp WHERE rif_clinica = ${mysql.escape(body.rif)} AND n = ${body.n}`
	let sql = 'INSERT INTO qcdisp (rif_clinica,tipo,ubi,n,eval1,obs1,date1,eval2,obs2,date2) VALUES ('+
		mysql.escape(body.rif_clinica)+','+
		mysql.escape(body.tipo)+','+
		mysql.escape(body.ubi)+','+
		(body.n-0)+','+
		mysql.escape(body.eval1)+','+
		mysql.escape(body.obs1)+','+
		(body.date1?mysql.escape(body.date1+'-1'):"NULL")+','+
		mysql.escape(body.eval2)+','+
		mysql.escape(body.obs2)+','+
		(body.date2?mysql.escape(body.date2+'-1'):"NULL")+')';
	con.executeByUser(id,
		function(argument) {
			con.query(validate,function(err,data) {
				res.setHeader('Content-Type','application/json');
				if (err) {
					res.end('{"error":true}');
					console.log(err);
					return;
				}
				if (data.length !== 0) {
					res.end('{"error":"número repetido en esta clínica"}');
				} else {
					con.query(sql,function(err) {
						if (err) {
							console.log(err);
							res.end('{"error":"unknown error"}');
							return;
						}
						res.end('{"success":true}');
					})
				}
			})
		},function(argument) {
			con.query(validate,function(err,data) {
				res.setHeader('Content-Type','application/json');
				if (err) {
					res.end('{"error":true}');
					console.log(err);
					return;
				}
				if (data.length !== 0) {
					res.end('{"error":"número repetido en esta clínica"}');
				} else {
					con.query(sql,function(err) {
						if (err) {
							console.log(err);
							res.end('{"error":"unknown error"}');
							return;
						}
						res.end('{"success":true}');
					})
				}
			})
		},function(argument) {
			res.end('no');
		}
	);
});
router.post( '/newImagen'    ,function (req,res) {//create for both
	var id = req.session.id;
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	let body = req.body;
	let validate = `SELECT * FROM qcimagen WHERE rif_clinica = ${mysql.escape(body.rif)} AND n = ${body.n}`
	let sql = 'INSERT INTO qcimagen (rif_clinica,tipo,ubi,n,eval1,obs1,date1,eval2,obs2,date2) VALUES ('+
		mysql.escape(body.rif_clinica)+','+
		mysql.escape(body.tipo)+','+
		mysql.escape(body.ubi)+','+
		(body.n-0)+','+
		mysql.escape(body.eval1)+','+
		mysql.escape(body.obs1)+','+
		(body.date1?mysql.escape(body.date1+'-1'):"NULL")+','+
		mysql.escape(body.eval2)+','+
		mysql.escape(body.obs2)+','+
		(body.date2?mysql.escape(body.date2+'-1'):"NULL")+')';
	con.executeByUser(id,
		function(argument) {
			con.query(validate,function(err,data) {
				res.setHeader('Content-Type','application/json');
				if (err) {
					res.end('{"error":true}');
					console.log(err);
					return;
				}
				if (data.length !== 0) {
					res.end('{"error":"número repetido en esta clínica"}');
				} else {
					con.query(sql,function(err) {
						if (err) {
							console.log(err);
							res.end('{"error":"unknown error"}');
							return;
						}
						res.end('{"success":true}');
					})
				}
			})
		},function(argument) {
			con.query(validate,function(err,data) {
				res.setHeader('Content-Type','application/json');
				if (err) {
					res.end('{"error":true}');
					console.log(err);
					return;
				}
				if (data.length !== 0) {
					res.end('{"error":"número repetido en esta clínica"}');
				} else {
					con.query(sql,function(err) {
						if (err) {
							console.log(err);
							res.end('{"error":"unknown error"}');
							return;
						}
						res.end('{"success":true}');
					})
				}
			})
		},function(argument) {
			res.end('no');
		}
	);
});
///////////////////////////////////////////////////////
///////////////////////////////////////////////////////
router.post("/modificarSala"   ,function (req,res) {//update for both
	var id = req.session.id;
	let body = req.body;

	if(!(body.identificador_en_clinica&&body.rif&&
		 body.plv&&body.ulv&&body.old)){
		console.log(body);
		res.status(400);
		res.end('');
		return;
	}
	con.executeByUser(
		id,
		function(){
			let objFound = htmlFind(body,['rif','identificador_en_clinica','equipos','plv','ulv','observaciones']);
			if (!objFound.clean) {
				res.end('{"message":"data corrupta, detectado posible ataque"}');
				return;
			}
			let sql = "UPDATE salas SET identificador_en_clinica="+
				mysql.escape(body.identificador_en_clinica)+
				",equipos="+(body.equipos?mysql.escape(body.equipos):"NULL")+
				",ProximoLev="+mysql.escape(body.plv+"-1")+
				",UltimoLev="+mysql.escape(body.ulv+"-1")+
				",observaciones="+(body.observaciones?mysql.escape(body.observaciones):"NULL")+
				" WHERE id_encargado="+id+
				" AND rif_clinica="+mysql.escape(body.rif)+
				" AND identificador_en_clinica="+mysql.escape(body.old);
			con.query(sql,function(err) {
				res.setHeader('Content-Type', 'application/json');
				if (err) {
					res.end('{}');
					console.log( err );
				} else {
					res.end('{"success":true}');
				}
			});
		},
		function(){
			let objFound = htmlFind(body,['rif','identificador_en_clinica','equipos','plv','ulv','observaciones']);
			if (!objFound.clean) {
				res.end('{"message":"data corrupta, detectado posible ataque"}');
				return;
			}
			let sql = "UPDATE salas SET identificador_en_clinica="+
				mysql.escape(body.identificador_en_clinica)+
				",equipos="+(body.equipos?mysql.escape(body.equipos):"NULL")+
				",ProximoLev="+mysql.escape(body.plv+"-1")+
				",UltimoLev="+mysql.escape(body.ulv+"-1")+
				",observaciones="+(body.observaciones?mysql.escape(body.observaciones):"NULL")+
				" WHERE rif_clinica="+mysql.escape(body.rif)+
				" AND identificador_en_clinica="+mysql.escape(body.old);
			con.query(sql,function(err) {
				res.setHeader('Content-Type', 'application/json');
				if (err) {
					res.end('{}');
					console.log( err );
				} else {
					res.end('{"success":true}');
				}
			});
		},
		function() {
		}
	)
});
router.post("/modificarEquipo" ,function (req,res) {//update for both
	var id = req.session.id;
	if (!validId(id)) {
		res.status(400);
		res.end('error500');
		return;
	}
	let body = req.body;
	if(!(body.serial&&body.rif&&
		 body.nombre&&body.marca&&
		 body.modelo&&body.uqc&&
		 body.pqc&&body.old)){
		console.log(body);
		res.status(400);
		res.end('');
		return;
	}
	con.executeByUser(
		id,
		function() {
			let objFound = htmlFind(body,['rif_clinica','serial','nombre',
					'marca','modelo','uqc','pqc','observaciones']);
			if (!objFound.clean) {
				res.end('{"success":false,"message":"data corrupta, detectado posible ataque"}');
				return;
			}
			var sql = 'UPDATE equipos SET serie='+mysql.escape(body.serial)+
				',rif_clinica='+mysql.escape(body.rif)+
				',nombre='+mysql.escape(body.nombre)+
				',sala='+mysql.escape(body.sala)+
				',marca='+mysql.escape(body.marca)+
				',modelo='+mysql.escape(body.modelo)+
				',UltimoQc='+mysql.escape(body.uqc+'-1')+
				',ProxQC='+mysql.escape(body.pqc+'-1')+
				',observaciones='+(body.observaciones?mysql.escape(body.observaciones):"NULL")+
				' WHERE serie='+mysql.escape(body.old);
			con.query(sql,function(err) {
				res.setHeader('Content-Type', 'application/json');
				if (err) {
					res.end('{"success":false}');
					console.log( err );
				} else {
					res.end('{"success":true}');
				}
			});
		},
		function() {
			let objFound = htmlFind(body,['rif_clinica','serial','nombre',
					'marca','modelo','uqc','pqc','observaciones']);
			if (!objFound.clean) {
				res.end('{"success":false,"message":"data corrupta, detectado posible ataque"}');
				return;
			}
			var sql = 'UPDATE equipos SET serie='+mysql.escape(body.serial)+
				',rif_clinica='+mysql.escape(body.rif)+
				',nombre='+mysql.escape(body.nombre)+
				',sala='+mysql.escape(body.sala)+
				',marca='+mysql.escape(body.marca)+
				',modelo='+mysql.escape(body.modelo)+
				',UltimoQc='+mysql.escape(body.uqc+'-1')+
				',ProxQC='+mysql.escape(body.pqc+'-1')+
				',observaciones='+(body.observaciones?mysql.escape(body.observaciones):"NULL")+
				' WHERE serie='+mysql.escape(body.old);
			con.query(sql,function(err,k) {
				res.setHeader('Content-Type', 'application/json');
				if (err) {
					res.end('{"success":false}');
					console.log( err );
				} else {
					res.end('{"success":true}');
				}
			});
		},
		function() {
		}
	);
});
router.post('/modificarClinica',function (req,res) {//update for both
	res.setHeader('Content-Type','application/json');
	var id = req.session.id;
	var rif = mysql.escape(req.body.rif);
	con.executeByUser(id,
		function(){//physic
			let objFound = htmlFind(req.body,['rif','nombre','observacion','ultcsl','vencsl','ultrim','venrim','ultpsr','venpsr','ultpfe','venpfe']);
			if (!objFound.clean) {
				res.status(400);
				res.end('{"success":false,"message":"data corrupta, detectado posible ataque"}');
				return;
			}
			let body = req.body;
			let sql = "UPDATE clinicas SET "+
				"nombre="+((body.nombre)?mysql.escape(body.nombre):"NULL")+','+
				"observacion=" + ( body.observacion ?mysql.escape(body.observacion):"NULL")+','+
				"ultcsl="      + ( body.ultcsl      ? mysql.escape(body.ultcsl) : "NULL" ) +','+
				"vencsl="      + ( body.vencsl      ? mysql.escape(body.vencsl) : "NULL" ) +','+
				"ultrim="      + ( body.ultrim      ? mysql.escape(body.ultrim) : "NULL" ) +','+
				"venrim="      + ( body.venrim      ? mysql.escape(body.venrim) : "NULL" ) +','+
				"ultpsr="      + ( body.ultpsr      ? mysql.escape(body.ultpsr) : "NULL" ) +','+
				"venpsr="      + ( body.venpsr      ? mysql.escape(body.venpsr) : "NULL" ) +','+
				"ultpfe="      + ( body.ultpfe      ? mysql.escape(body.ultpfe) : "NULL" ) +','+
				"venpfe="      + ( body.venpfe      ? mysql.escape(body.venpfe) : "NULL" ) +','+
				"f_ccsl="      + ( body.f_ccsl      ? mysql.escape(body.f_ccsl) : "NULL" ) +','+
				"n_pcsl="      + ( body.n_pcsl      ? Number(body.n_pcsl)            : "NULL" ) +','+
				"f_crim="      + ( body.f_crim      ? mysql.escape(body.f_crim) : "NULL" ) +','+
				"n_prim="      + ( body.n_prim      ? Number(body.n_prim)            : "NULL" ) +','+
				"f_cpsr="      + ( body.f_cpsr      ? mysql.escape(body.f_cpsr) : "NULL" ) +','+
				"n_ppsr="      + ( body.n_ppsr      ? Number(body.n_ppsr)            : "NULL" ) +','+
				"f_cpfe="      + ( body.f_cpfe      ? mysql.escape(body.f_cpfe) : "NULL" ) +','+
				"n_ppfe="      + ( body.n_ppfe      ? Number(body.n_ppfe)            : "NULL" ) +
				" WHERE id_encargado="+id+" AND rif="+rif;
			con.query(sql,function(err) {
			if (err) {
					res.end('{"success":false}');
					console.log( err );
				} else {
					res.end('{"success":true}');
				}
			});
		},function(){//admin
			let objFound = htmlFind(req.body,['rif','nombre','observacion','ultcsl','vencsl','ultrim','venrim','ultpsr','venpsr','ultpfe','venpfe']);
			if (!objFound.clean) {
				res.status(400);
				res.end('{"success":false,"message":"data corrupta, detectado posible ataque"}');
				return;
			}
			let body = req.body;
			let sql = "UPDATE clinicas SET "+
				"nombre="+((body.nombre)?mysql.escape(body.nombre):"NULL")+','+
				"observacion=" + ( body.observacion ?mysql.escape(body.observacion):"NULL")+','+
				"ultcsl="      + ( body.ultcsl      ? mysql.escape(body.ultcsl) : "NULL" ) +','+
				"vencsl="      + ( body.vencsl      ? mysql.escape(body.vencsl) : "NULL" ) +','+
				"ultrim="      + ( body.ultrim      ? mysql.escape(body.ultrim) : "NULL" ) +','+
				"venrim="      + ( body.venrim      ? mysql.escape(body.venrim) : "NULL" ) +','+
				"ultpsr="      + ( body.ultpsr      ? mysql.escape(body.ultpsr) : "NULL" ) +','+
				"venpsr="      + ( body.venpsr      ? mysql.escape(body.venpsr) : "NULL" ) +','+
				"ultpfe="      + ( body.ultpfe      ? mysql.escape(body.ultpfe) : "NULL" ) +','+
				"venpfe="      + ( body.venpfe      ? mysql.escape(body.venpfe) : "NULL" ) +','+
				"f_ccsl="      + ( body.f_ccsl      ? mysql.escape(body.f_ccsl) : "NULL" ) +','+
				"n_pcsl="      + ( body.n_pcsl      ? Number(body.n_pcsl)            : "NULL" ) +','+
				"f_crim="      + ( body.f_crim      ? mysql.escape(body.f_crim) : "NULL" ) +','+
				"n_prim="      + ( body.n_prim      ? Number(body.n_prim)            : "NULL" ) +','+
				"f_cpsr="      + ( body.f_cpsr      ? mysql.escape(body.f_cpsr) : "NULL" ) +','+
				"n_ppsr="      + ( body.n_ppsr      ? Number(body.n_ppsr)            : "NULL" ) +','+
				"f_cpfe="      + ( body.f_cpfe      ? mysql.escape(body.f_cpfe) : "NULL" ) +','+
				"n_ppfe="      + ( body.n_ppfe      ? Number(body.n_ppfe)            : "NULL" ) +
				" WHERE rif="+rif;
			con.query(sql,function(err) {
			if (err) {
					res.end('{"success":false}');
					console.log( err );
				} else {
					res.end('{"success":true}');
				}
			});
		},function(){
			res.end('{"success":false}');
		}
	);
});
router.post('/modificarUsuario',function (req,res) {//update for admins
	var id = req.session.id;
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	res.setHeader('Content-Type', 'application/json');
	con.executeByUser(id,
		function(){
			res.end('{"success":false}');
		},function(){
			if (!req.body.email||!req.body.password||!req.body.IDU) {
				res.end('{"message":"missing information"}');
				return;
			}
			if (!validId(req.body.IDU)) {
				res.end('{"message":"corrupted IDU"}');
				return;
			}
			var sql = "UPDATE usuarios SET email="+mysql.escape(req.body.email)+
			",password="+mysql.escape(SHA256(req.body.password))+" WHERE id="+req.body.IDU;
			con.query(sql,function(err) {
				if (err) {
					res.end('{"message":"unknown error"}');
					console.log(err);
					return;
				} else {
					res.end('{"success":true}');
				}
			})
		},function(){
			res.end('{"success":false}');
		}
	);
});
router.post( '/modificarChasis',function (req,res) {//update for both
	let id = req.session.id;
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	let body = req.body;
	res.setHeader('Content-Type','application/json');

	let sql = `UPDATE qcchasis SET marca = ${mysql.escape(body.marca)}`+
		`,modelo = ${mysql.escape(body.modelo)}`+
		`,tamano = ${mysql.escape(body.tamano)}`+
		`,ubi = ${mysql.escape(body.ubi)}`+
		`,n = ${mysql.escape(body.n)}`+
		`,eval1 = ${mysql.escape(body.eval1)}`+
		`,obs1 = ${mysql.escape(body.obs1)}`+
		`,date1 = ${mysql.escape(body.date1?body.date1+'-1':null)}`+
		`,eval2 = ${mysql.escape(body.eval2)}`+
		`,obs2 = ${mysql.escape(body.obs2)}`+
		`,date2 = ${mysql.escape(body.date2?body.date2+'-1':null)}`+
		` WHERE n = ${mysql.escape(body.old)} AND rif_clinica = ${mysql.escape(body.rif)}`;
	con.executeByUser(id
		 ,function(){
		 	con.query(sql,function(err) {
		 		if (err) {
		 			console.log(err);
		 			res.end('{"message":"check console"}');
		 			return;
		 		}
		 		res.end('{"success":true}')
		 	})
		},function(){
			con.query(sql,function(err) {
				if (err) {
					console.log(err);
					res.end('{"error":"check console"}');
					return;
				}
				res.end('{"success":true}')
			})
		},function(){
			res.end('no');
		}
	);
});
router.post( '/modificarDisp'  ,function (req,res) {//update for both
	let id = req.session.id;
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	let body = req.body;
	res.setHeader('Content-Type','application/json');

	let sql = `UPDATE qcdisp SET tipo = ${mysql.escape(body.tipo)}`+
		`,ubi = ${mysql.escape(body.ubi)}`+
		`,n = ${mysql.escape(body.n)}`+
		`,eval1 = ${mysql.escape(body.eval1)}`+
		`,obs1 = ${mysql.escape(body.obs1)}`+
		`,date1 = ${mysql.escape(body.date1?body.date1+'-1':null)}`+
		`,eval2 = ${mysql.escape(body.eval2)}`+
		`,obs2 = ${mysql.escape(body.obs2)}`+
		`,date2 = ${mysql.escape(body.date2?body.date2+'-1':null)}`+
		` WHERE n = ${mysql.escape(body.old)} AND rif_clinica = ${mysql.escape(body.rif)}`;
	con.executeByUser(id
		 ,function(){
		 	con.query(sql,function(err) {
		 		if (err) {
		 			console.log(err);
		 			res.end('{"error":"check console"}');
		 			return;
		 		}
		 		res.end('{"success":true}')
		 	})
		},function(){
			con.query(sql,function(err) {
				if (err) {
					console.log(err);
					res.end('{"error":"check console"}');
					return;
				}
				res.end('{"success":true}')
			})
		},function(){
			res.end('no');
		}
	);
});
router.post( '/modificarImagen',function (req,res) {//update for both
	let id = req.session.id;
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	let body = req.body;
	res.setHeader('Content-Type','application/json');

	let sql = `UPDATE qcimagen SET tipo = ${mysql.escape(body.tipo)}`+
		`,ubi = ${mysql.escape(body.ubi)}`+
		`,n = ${mysql.escape(body.n)}`+
		`,eval1 = ${mysql.escape(body.eval1)}`+
		`,obs1 = ${mysql.escape(body.obs1)}`+
		`,date1 = ${mysql.escape(body.date1?body.date1+'-1':null)}`+
		`,eval2 = ${mysql.escape(body.eval2)}`+
		`,obs2 = ${mysql.escape(body.obs2)}`+
		`,date2 = ${mysql.escape(body.date2?body.date2+'-1':null)}`+
		` WHERE n = ${mysql.escape(body.old)} AND rif_clinica = ${mysql.escape(body.rif)}`;
	con.executeByUser(id
		 ,function(){
		 	con.query(sql,function(err) {
		 		if (err) {
		 			console.log(err);
		 			res.end('{"error":"check console"}');
		 			return;
		 		}
		 		res.end('{"success":true}')
		 	})
		},function(){
			con.query(sql,function(err) {
				if (err) {
					console.log(err);
					res.end('{"error":"check console"}');
					return;
				}
				res.end('{"success":true}')
			})
		},function(){
			res.end('no');
		}
	);
});
router.get('/cambiarEncargadoClinica',function(req,res) {
	let id = req.session.id;//admin id
	let rif = req.query.rif,//rif from the clinic
		next = req.query.next;//next physic id
	if ( !rif || !validId(next) ) {
		res.end('missing statements');
		console.log('missing statements');
		console.log(req.query);
		return;
	}
	con.executeByUser(id,
		()=>{res.end('no')},
		function() {
			let sqls = [
					`UPDATE clinicas SET id_encargado=${next} WHERE rif=${mysql.escape(rif)}`,
					`UPDATE equipos SET id_encargado=${next} WHERE rif_clinica=${mysql.escape(rif)}`,
					`UPDATE salas SET id_encargado=${next} WHERE rif_clinica=${mysql.escape(rif)}`
				],
				count = 0;
			sqls.forEach(function(sql) {
				let error = false;
				con.query(sql,function(err) {
					if (error) {
						return;
					}
					if (err) {
						error = true;
						console.log(err);
						res.setHeader('Content-Type','application/json');
						res.end('{"error":"error desconocido"}');
					}
					count++
					if (count === sqls.length) {
						res.setHeader('Content-Type','application/json');
						res.end('{"success":true}');
					}
				})
			})
		},
		()=>{res.end('no')}
	);
});
router.post('/modificarActividad',function(req,res) {
	let id = req.session.id;//admin id
	if (!req.body.fechan||!req.body.fechap||!req.body.concepton||!req.body.conceptop||!req.body.rif) {
		res.status(400)
		res.end('missing parameters, bad request.')
		console.log('missing body')
		console.log(req.body)
		return
	}
	con.executeByUser(id,()=>{res.end('')},function() {
		let fechan = mysql.escape(req.body.fechan),
			fechap = mysql.escape(req.body.fechap),
			concepton = mysql.escape(req.body.concepton),
			conceptop = mysql.escape(req.body.conceptop),
			rif = mysql.escape(req.body.rif)
		let sql = `
			UPDATE actividad
			SET fecha = ${fechan},concepto = ${concepton}
			WHERE fecha = ${fechap} AND concepto = ${conceptop} AND rif_clinica = ${rif}
		`
		con.query(sql,function(err) {
			if (err) {
				console.log(err)
			}
			res.end(JSON.stringify({
				success : ! err
			}))
		})
	})
})
///////////////////////////////////////////////////////
///////////////////////////////////////////////////////
router.delete("/eliminarEquipo" ,function (req,res) {//delete for both
	var id = req.session.id;
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	res.setHeader('Content-Type', 'application/json');
	con.executeByUser(id,
		function(){//phy
			var name = mysql.escape(req.body.name);
			var sql = "DELETE FROM equipos WHERE id_encargado="+id+
				" AND nombre="+name+"AND rif_clinica="+mysql.escape(req.body.rif);
			con.query(sql,function (err) {
				if (err) {
					res.end('{"success":false}');
					console.log( err );
				}
				res.end('{"success":true}');
			});
		},function() {//adm
			id = req.body.IDU;
			var name = mysql.escape(req.body.name);
			if (!validId(id)) {
				res.end('{"success":false}');
				return;
			}
			var sql = "DELETE FROM equipos WHERE id_encargado="+id+
				" AND nombre="+name+"AND rif_clinica="+mysql.escape(req.body.rif);
			con.query(sql,function (err) {
				if (err) {
					res.end('{"message":"unknown error"}');
					return;
				}
				res.end('{"success":true}');
			});
		},function() {//unk
			res.end('{"success":false}');
		}
	);
});
router.delete("/eliminarSala"   ,function (req,res) {//delete for both
	var id   = req.session.id;
	var name = mysql.escape(req.body.name);
	var rif  = mysql.escape(req.body.rif);
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	con.executeByUser(id,
		function(){//phy
			var sql = "DELETE FROM salas WHERE id_encargado="+id+
				" AND identificador_en_clinica="+name+" AND rif_clinica="+rif;
			con.query(sql,function (err) {
				res.setHeader('Content-Type', 'application/json');
				if (err) {
					res.end('{"success":false}');
					console.log(err);
					return;
				}
				res.end('{"success":true}');
			});
		},function(){
			var sql = "DELETE FROM salas WHERE identificador_en_clinica="+
				name + " AND rif_clinica=" + rif;
			con.query(sql,function (err) {
				res.setHeader('Content-Type', 'application/json');
				if (err) {
					res.end('{"success":false}');
					console.log(err);
					return;
				}
				res.end('{"success":true}');
			});
		},function() {
			res.setHeader('Content-Type', 'application/json');
			res.end('{"success":false}');
		}
	);
});
router.delete("/eliminarUsuario",function (req,res) {//delete for admins
	var id = req.session.id;
	var IDU = req.body.IDU;
	if (!validId(id)||!IDU||!validId(IDU)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	var mail = req.body.email;
	con.executeByUser(id,
		function(){
			res.setHeader("Content-Type",'application/json');
			res.end('{"message":"cracking detected"}');
			console.log("CRACKING DETECTED FROM "+req.connection.remoteAddress);
		},function(){
			var sql = 'DELETE FROM usuarios WHERE id='+IDU;
			con.query(sql,function(err) {
				res.setHeader('Content-Type', 'application/json');
				if (err) {
					res.end('{"success":false}');
					console.log(err);
				}
				res.end('{"success":true}');
			});
		},function(){
			res.setHeader("Content-Type",'application/json');
			res.end('{"message":"cracking detected"}');
			console.log("CRACKING DETECTED FROM "+req.connection.remoteAddress);
		}
	);
});
router.delete("/eliminarClinica",function (req,res) {//delete for admins
	var id = req.session.id;
	var rif = mysql.escape(req.body.rif);
	if (!validId(id)) {
		res.status(400);
		res.render('error500',{message:"data corrupta, detectado posible ataque"});
		return;
	}
	con.executeByUser(id,
		function(){
			res.setHeader("Content-Type",'application/json');
			res.end('{"message":"cracking detected"}');
			console.log("CRACKING DETECTED FROM "+req.connection.remoteAddress);
		},function(){
			var sql = 'DELETE FROM clinicas WHERE rif='+rif;
			con.query(sql,function(err) {
				res.setHeader('Content-Type', 'application/json');
				if (err) {
					res.end('{"error":"clínica repetida"}');
					//console.log(err);
				}
				res.end('{"success":true}');
			});
			con.query('DELETE FROM equipos WHERE rif_clinica='+rif,function(err) {
				if(err)
					console.log(err)
			})
			con.query('DELETE FROM salas WHERE rif_clinica='+rif,function(err) {
				if(err)
					console.log(err)
			})
		},function(){
			res.setHeader("Content-Type",'application/json');
			res.end('{"message":"cracking detected"}');
			console.log("CRACKING DETECTED FROM "+req.connection.remoteAddress);
		}
	);
});
router.delete('/eliminarChasis' ,function (req,res) {//delete for both
	let id = req.session.id;
	res.setHeader('Content-Type','application/json');
	let rif = mysql.escape(req.body.rif);
	let n = mysql.escape(req.body.name);
	con.executeByUser(
		id,
		function() {
			let sql = `DELETE FROM qcchasis WHERE rif_clinica = ${rif} AND n = ${n}`;
			con.query(sql,function(err,data) {
				if (err) {
					res.end('{"error":true}');
					throw err;
				}
				res.end('{"success":true}');
			})
		},
		function() {
			let sql = `DELETE FROM qcchasis WHERE rif_clinica = ${rif} AND n = ${n}`;
			con.query(sql,function(err,data) {
				if (err) {
					res.end('{"error":true}');
					throw err;
				}
				res.end('{"success":true}');
			})
		},
		function() {
			res.end('no');
		}
	);
});
router.delete('/eliminarDisp'   ,function (req,res) {//delete for both
	var id = req.session.id;
	res.setHeader('Content-Type','application/json');
	let rif = mysql.escape(req.body.rif);
	let n = mysql.escape(req.body.name);
	con.executeByUser(
		id,
		function() {
			let sql = `DELETE FROM qcdisp WHERE rif_clinica = ${rif} AND n = ${n}`;
			con.query(sql,function(err,data) {
				if (err) {
					res.end('{"error":true}');
					throw err;
				}
				res.end('{"success":true}');
			})
		},
		function() {
			let sql = `DELETE FROM qcdisp WHERE rif_clinica = ${rif} AND n = ${n}`;
			con.query(sql,function(err,data) {
				if (err) {
					res.end('{"error":true}');
					throw err;
				}
				res.end('{"success":true}');
			})
		},
		function() {
			res.end('no');
		}
	);
});
router.delete('/eliminarImagen' ,function (req,res) {//delete for both
	var id = req.session.id;
	res.setHeader('Content-Type','application/json');
	let rif = mysql.escape(req.body.rif);
	let n = mysql.escape(req.body.name);
	con.executeByUser(
		id,
		function() {
			let sql = `DELETE FROM qcimagen WHERE rif_clinica = ${rif} AND n = ${n}`;
			con.query(sql,function(err,data) {
				if (err) {
					console.log(err)
					res.end('{"error":true}');
					throw err;
				}
				res.end('{"success":true}');
			})
		},
		function() {
			let sql = `DELETE FROM qcimagen WHERE rif_clinica = ${rif} AND n = ${n}`;
			con.query(sql,function(err,data) {
				if (err) {
					console.log(err)
					res.end('{"error":true}');
					throw err;
				}
				res.end('{"success":true}');
			})
		},
		function() {
			res.end('no');
		}
	);
});
router.delete('/eliminarActividad',function(req,res) {
	let id = req.session.id
	con.executeByUser(id,()=>{res.end('')},function() {
		let fecha = mysql.escape(req.body.fecha),
			concepto = mysql.escape(req.body.concepto),
			rif = mysql.escape(req.body.rif)
		let sql = `
			DELETE FROM actividad
			WHERE fecha = ${fecha} AND concepto = ${concepto} AND rif_clinica = ${rif}
		`
		con.query(sql,function(err) {
			if (err) {
				console.log(err)
			}
			res.end(JSON.stringify({
				success : ! err
			}))
		})
	})
})
////////////////////////////////////////////b///////////
///////////////////////////////////////////////////////
//'UPLOAD' CODE READY
router.post('/subirInforme' , subirInformes.informe    );//UPLOAD SECTION
router.post('/subirDosimet' , subirInformes.dosimet    );//UPLOAD SECTION
router.get ('/getInforme'   , subirInformes.getInforme );//UPLOAD SECTION
router.get ('/getDosimet'   , subirInformes.getDosimet );//UPLOAD SECTION

router.get('/buscar',function(req,res) {
	let id = req.session.id;
	res.setHeader('Content-Type','application/json');
	let word = req.query.s;
	if (!word) {
		res.end('0');
		return;
	}
	let sql = 'SELECT * FROM clinicas WHERE'
	for(let i = 1 ; i <= word.length ; i++){
		let end = mysql.escape('%'+word.substr(0,i-1)+'_'+word.substr(i,word.length)+"%");
		sql += ` rif LIKE ${end} OR nombre LIKE ${end} OR`;
	}
	sql += ' FALSE';
	con.executeByUser(id,function(argument) {
		con.query(sql,function(err,data) {
			if (err) {
				console.log(err);
				res.end('{"error":true}');
				return;
			}
			res.end(JSON.stringify(data));
		})
	},function(argument) {
		con.query(sql,function(err,data) {
			if (err) {
				console.log(err);
				res.end('{"error":true}');
				return;
			}
			res.end(JSON.stringify(data));
		})
	},function(argument) {
		res.end('no');
	});
});
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
router.get('/calendar',function (req,res) {
	res.render('calendario.pug');
});

router.get('/editaclinicas',function (req,res) {
	res.render('editplanification.pug');
});

router.get('/clinicsfrommonth',function(req,res) {
	let month = Number( req.query.month )
	let year  = Number( req.query.year  )
	if ( month && year && month < 13 && month > 0 && year > 1920) {
		let sql = 'SELECT rif,nombre,emails,prox_visita,not_visita_fisico,llamada,reporte_actividades,recibido_mcast,enviado_informe_serofca,recibido_servicio_serofca,enviado_centro_Salud,obs'+
			' FROM clinicas '+
			`WHERE prox_visita  ='${year}-${month}-1'`+
			` OR prox_visita  ='${year}-${month}-2'` +
			` OR prox_visita  ='${year}-${month}-3'` +
			` OR prox_visita  ='${year}-${month}-4'` +
			` OR prox_visita  ='${year}-${month}-5'` +
			` OR prox_visita  ='${year}-${month}-6'` +
			` OR prox_visita  ='${year}-${month}-7'` +
			` OR prox_visita  ='${year}-${month}-8'` +
			` OR prox_visita  ='${year}-${month}-9'` +
			` OR prox_visita  ='${year}-${month}-10'`+
			` OR prox_visita  ='${year}-${month}-11'`+
			` OR prox_visita  ='${year}-${month}-12'`+
			` OR prox_visita  ='${year}-${month}-13'`+
			` OR prox_visita  ='${year}-${month}-14'`+
			` OR prox_visita  ='${year}-${month}-15'`+
			` OR prox_visita  ='${year}-${month}-16'`+
			` OR prox_visita  ='${year}-${month}-17'`+
			` OR prox_visita  ='${year}-${month}-18'`+
			` OR prox_visita  ='${year}-${month}-19'`+
			` OR prox_visita  ='${year}-${month}-20'`+
			` OR prox_visita  ='${year}-${month}-21'`+
			` OR prox_visita  ='${year}-${month}-22'`+
			` OR prox_visita  ='${year}-${month}-23'`+
			` OR prox_visita  ='${year}-${month}-24'`+
			` OR prox_visita  ='${year}-${month}-25'`+
			` OR prox_visita  ='${year}-${month}-26'`+
			` OR prox_visita  ='${year}-${month}-27'`+
			` OR prox_visita  ='${year}-${month}-28'`+
			` OR prox_visita  ='${year}-${month}-29'`+
			` OR prox_visita  ='${year}-${month}-30'`+
			` OR prox_visita  ='${year}-${month}-31'`;
		con.query(sql,function(err,data) {
			if (err) {
				res.end('{"error":"in query"}');
				console.log(err);
				return;
			}
			res.end(JSON.stringify(data));
		});
	}else{
		res.end('{"error":true}');
	}
});
router.get('/actsFromMonth',function(req,res) {
	let month = Number( req.query.month )
	let year  = Number( req.query.year  )
	if ( month && year && month < 13 && month > 0 && year > 1920) {
		let sql = 'SELECT '+
			'actividad.* , clinicas.nombre FROM actividad JOIN clinicas ON actividad.rif_clinica=clinicas.rif '+
			`WHERE fecha ='${year}-${month}-1'`+
			` OR fecha ='${year}-${month}-2'` +
			` OR fecha ='${year}-${month}-3'` +
			` OR fecha ='${year}-${month}-4'` +
			` OR fecha ='${year}-${month}-5'` +
			` OR fecha ='${year}-${month}-6'` +
			` OR fecha ='${year}-${month}-7'` +
			` OR fecha ='${year}-${month}-8'` +
			` OR fecha ='${year}-${month}-9'` +
			` OR fecha ='${year}-${month}-10'`+
			` OR fecha ='${year}-${month}-11'`+
			` OR fecha ='${year}-${month}-12'`+
			` OR fecha ='${year}-${month}-13'`+
			` OR fecha ='${year}-${month}-14'`+
			` OR fecha ='${year}-${month}-15'`+
			` OR fecha ='${year}-${month}-16'`+
			` OR fecha ='${year}-${month}-17'`+
			` OR fecha ='${year}-${month}-18'`+
			` OR fecha ='${year}-${month}-19'`+
			` OR fecha ='${year}-${month}-20'`+
			` OR fecha ='${year}-${month}-21'`+
			` OR fecha ='${year}-${month}-22'`+
			` OR fecha ='${year}-${month}-23'`+
			` OR fecha ='${year}-${month}-24'`+
			` OR fecha ='${year}-${month}-25'`+
			` OR fecha ='${year}-${month}-26'`+
			` OR fecha ='${year}-${month}-27'`+
			` OR fecha ='${year}-${month}-28'`+
			` OR fecha ='${year}-${month}-29'`+
			` OR fecha ='${year}-${month}-30'`+
			` OR fecha ='${year}-${month}-31'`;
		con.query(sql,function(err,data) {
			if (err) {
				res.end('{"error":"in query"}');
				console.log(err);
				return;
			}
			res.end(JSON.stringify(data));
		});
	}else{
		res.end('{"error":true}');
	}
})
router.get('/allclinics',function (req,res) {
	let sql = 'SELECT rif,nombre,emails,prox_visita,not_visita_fisico,llamada,reporte_actividades,recibido_mcast,enviado_informe_serofca,recibido_servicio_serofca,enviado_centro_Salud,obs FROM clinicas';
	con.query(sql,function(err,data) {
		console.log(err);
		if (err) {
			res.end('{"error":"in query"}');
			return;
		}
		res.end(JSON.stringify(data));
	});
});
router.get('/getclinicbyrifforplanification',function (req,res) {
	let rif = mysql.escape(req.query.rif);
	let sql = 'SELECT rif,nombre,emails,prox_visita,not_visita_fisico,llamada,reporte_actividades,recibido_mcast,enviado_informe_serofca,recibido_servicio_serofca,enviado_centro_Salud,obs FROM clinicas WHERE rif='+rif;
	con.query(sql,function(err,data) {
		console.log(err);
		if (err) {
			res.end('{"error":"in query"}');
			return;
		}
		res.end(JSON.stringify(data));
	});
});
router.get('/allclinicsbyname',function (req,res) {
	let sql = 'SELECT rif,nombre FROM clinicas';
	con.query(sql,function(err,data) {
		console.log(err);
		if (err) {
			res.end('{"error":"in query"}');
			return;
		}
		res.end(JSON.stringify(data));
	});
});
router.get('/updateClinicCalendar',function(req,res) {
	con.executeByUser(req.session.id,
		function() {
			res.end('{"permission":false}');
		},function() {
			let rif = mysql.escape2(req.query.rif),
				emails = mysql.escape2(req.query.emails),
				prox_visita = mysql.escape2(req.query.prox_visita),
				not_visita_fisico = mysql.escape2(req.query.not_visita_fisico),
				llamada = mysql.escape2(req.query.llamada),
				reporte_actividades = mysql.escape2(req.query.reporte_actividades),
				recibido_mcast = mysql.escape2(req.query.recibido_mcast),
				enviado_informe_serofca = mysql.escape2(req.query.enviado_informe_serofca),
				recibido_servicio_serofca = mysql.escape2(req.query.recibido_servicio_serofca),
				enviado_centro_Salud = mysql.escape2(req.query.enviado_centro_Salud),
				obs = mysql.escape2(req.query.obs);

			let sql = 'UPDATE clinicas SET'+
				' emails=' + emails +
				',prox_visita=' + prox_visita +
				',not_visita_fisico=' + not_visita_fisico +
				',llamada=' + llamada +
				',reporte_actividades=' + reporte_actividades +
				',recibido_mcast=' + recibido_mcast +
				',enviado_informe_serofca=' + enviado_informe_serofca +
				',recibido_servicio_serofca=' + recibido_servicio_serofca +
				',enviado_centro_Salud=' + enviado_centro_Salud +
				',obs=' + obs +
				' WHERE rif=' + rif ;
			con.query(sql,function(err) {
				if (err) {
					console.log(err);
					res.end('{"permission":true,"success":false}');
					return;
				}
				res.end('{"permission":true,"success":true}');
			})
		}
	);
});
function quicksort(primero,ultimo,arreglo){
	//definimos variables indices
	i = primero
	j = ultimo
	//sacamos el pivote de la mitad del arreglo
	pivote = arreglo[ Number.parseInt( ( i + j ) / 2 ) ]
	//repetir hasta que i siga siendo menor que j
	do{
		//mientras arreglo[i] sea menor a pivote
		while(arreglo[i].nombre<pivote.nombre)
			i++;        //mientras j sea mayor a pivote
		while(arreglo[j].nombre>pivote.nombre)
			j--;
		//si i es menor o igual a j, los valores ya se cruzaron
		if(i<=j){
			//variable temporal auxiliar para guardar valor de arreglo[j]
			aux=arreglo[j];
			//intercambiamos los valores de arreglo[j] y arreglo[i]
			arreglo[j] = arreglo[i]
			arreglo[i] = aux
			// incrementamos y decrementamos i y j
			i++;
			j--;
		}
	}while(i<j);
	//si primero es menor a j llamamos la funcion nuevamente
	if(primero<j){
		quicksort(primero,j,arreglo);
	}
	//si ultimo es mayor que i llamamos la funcion nuevamente
	if(ultimo>i){
		quicksort(i,ultimo,arreglo);
	}
}

module.exports = router;