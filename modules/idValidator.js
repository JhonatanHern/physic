var possibles = "1234567890";
module.exports = function(id){
	id = id+'';
	for (var i = id.length - 1; i >= 0; i--) {
		var inner = false;
		for (var j = possibles.length - 1; j >= 0; j--) {
			inner = inner || possibles[j] === id[i];
		};
		if (!inner) {
			return false;
		}
	}
	return true;
}