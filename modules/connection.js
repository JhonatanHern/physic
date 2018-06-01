var mysql = require('mysql');

var pool = mysql.createPool({
	host     : 'localhost'  ,
	user     : 'root',
	password : 'pickleman666',
	database : 'serofcai_serofclinic'
});
if (!pool) {
	console.log('database error')
}
var query = function(queryString,callback){
	pool.getConnection(function(err, connection) {
		if (err) {
			console.log('-----------------------------------------')
			console.log(err)
			console.log('-----------------------------------------')
			callback({message:'missing connection'})
			return
		}
		connection.query(queryString, function (error, dbResults, fields) {
			callback(error,dbResults);
			connection.release();
		});
	});
}

var executeIfValid = function(id,desiredType,q,callback){
	if (!(desiredType==='p'||
			desiredType==='P'||
			desiredType==='A'||
			desiredType==='a'||
			desiredType==='both')) {
		callback('error with the desired userClass '+desiredType);
		return;
	}
	query( "SELECT userClass FROM usuarios WHERE id=" + Number(id) , function( err , dbRes ){
		if (err) {
			callback(err);
			return;
		}
		if (dbRes.length===0){
			callback("user id not found");
			return;
		}
		switch(desiredType){
			case 'P':
			case 'p':
				if (dbRes[0].userClass==='p'||dbRes[0].userClass==='P') {
					query(q,callback);
				}else{
					callback('el id tiene el userClass '+dbRes[0].userClass+
						' y el tipo deseado es '+desiredType);
				}
				break;
			case 'A':
			case 'a':
				if (dbRes[0].userClass==='a'||dbRes[0].userClass==='A') {
					query(q,callback);
				}else{
					callback('el id tiene el userClass '+dbRes[0].userClass+
						' y el tipo deseado es '+desiredType);
				}
				break;
			case 'both':
				if (dbRes[0].userClass==='a'||
					dbRes[0].userClass==='A'||
					dbRes[0].userClass==='p'||
					dbRes[0].userClass==='P') {
					query(q,callback);
				}else{
					callback('el id tiene el userClass '+dbRes[0].userClass+
						' y el tipo deseado es '+desiredType);
				}
				break;
		}
	});
}

function executeByUser(userID,physicCallback,adminCallback,errorCallback){
	query("SELECT userClass,email FROM usuarios WHERE id="+userID,function(err,dbRes){
		if (dbRes.length===0){
			errorCallback("id no encontrado");
			return;
		}
		switch(dbRes[0].userClass){
			case 'P':
			case 'p':
				physicCallback(dbRes[0]);
				break;
			case 'A':
			case 'a':
				adminCallback(dbRes[0]);
				break;
			default:
				errorCallback('user not allowed to enter here');
		}
	});
}

module.exports = {
	'connection':{
		'query':query,
		'executeIfValid':executeIfValid,
		'executeByUser':executeByUser
	},
	'escape':mysql.escape,
	'escape2':function(e){
		if (e) {
			return mysql.escape(e);
		}else{
			return 'NULL';
		}
	}
};