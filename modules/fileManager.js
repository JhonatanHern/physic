const fs = require('fs')

const getReports = ( rif , year , callback ) => {
	fs.readdir( './informes/' , ( err , files ) => {
		if (err) {
			console.log(err)
		}
		const expression = new RegExp( `^${ rif }-${ year }-\\d\\d?.docx` )
		callback( files.filter( f => expression.test( f ) ) )
	})
}

module.exports = {
	getReportsFromYear:getReports
}