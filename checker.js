const fs = require('fs')
const mysql = require('./modules/connection')

const con = mysql.connection
const year = 2018
const month = process.argv[2] || (new Date()).getMonth() + 1

async function query(sql) {
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

con.query('SELECT id,email FROM usuarios WHERE userClass = "P"', async (err,res)=>{
	for (var i = 0; i < res.length; i++) {
		let p = res[i]
		p.done = []
		p.toDo = []
		let cls = await query('SELECT rif,nombre FROM clinicas WHERE id_encargado='+p.id)
		cls.forEach(c=>{
			if (fs.existsSync(`./informes/${c.rif}-${year}-${month}.docx`)) {
				p.done.push(c)
			}else{
				p.toDo.push(c)
			}
		})
		console.log(p.email+':')
		console.log('hecho:')
		p.done.forEach(c=>console.log(c.nombre))
		console.log('\n')
		console.log('por hacer:')
		p.toDo.forEach(c=>console.log(c.nombre))
		console.log('\n\n\n\n\n')
	}
	process.exit(0)
})