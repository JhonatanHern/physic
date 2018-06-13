var formidable = require('formidable');
var fs = require('fs');

module.exports = function (req,name,type,callback) {
	var form = new formidable.IncomingForm();
	form.parse(req, function (err, fields, files) {
		var oldpath = files.filetoupload.path;
		var newpath = process.cwd().split('\\\\').join('/') + '/'+type+'/' + name;
		switch(type){
			case 'informes':
				newpath += '.docx'
				break;
			case 'dosimets':
				newpath += '.xls'
				break;
		}
		fs.rename(oldpath, newpath, function (err) {
			if (err){
				console.log( err );
				callback( err );
			}
			callback();
		});
	});
}