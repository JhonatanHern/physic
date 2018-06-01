'use strict';
module.exports = function(obj,keys,strict){
	if (!Array.isArray(keys)) {
		throw 'second parameter is not an array';
		return;
	}
	for (let i = keys.length - 1; i >= 0; i--) {
		if(obj[keys[i]]){
			if (typeof obj[keys[i]]==='string') {
				if(obj[keys[i]].indexOf('<') !== -1){
					return {clean:false , message:'found "<" in obj["'+keys[i]+'"]'};
				}
			} else {
				return {clean:false , message:keys[i]+' is not a string'};
			}
		}else{
			if (strict) {
				return {clean:false , message:keys[i]+' not found in object'};
			}
		}
	}
	return{clean:true};
}