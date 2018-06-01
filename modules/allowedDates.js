module.exports = function(){
	var year,month,today = new Date()
	year = today.getFullYear()
	month= today.getMonth()+1
	var dates = [year+'-'+month]
	month=(month===1)?12:month-1
	year=(month===12)?year-1:year
	dates.push(year+'-'+month)
	month=(month===1)?12:month-1
	year=(month===12)?year-1:year
	dates.push(year+'-'+month)
	return dates
}