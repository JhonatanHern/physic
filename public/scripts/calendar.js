String.prototype.replaceAll = function(first,substitute) {
	return this.split(first).join(substitute)
}
var monthLong = {
	0:31,//jan
	1:28,//feb
	2:31,//mar
	3:30,//abr
	4:31,//may
	5:30,//jun
	6:31,//jul
	7:31,//aug
	8:30,//sep
	9:31,//oct
	10:30,//nov
	11:31//dec
}
var weekdays = [
	"Domingo",
	"Lunes",
	"Martes",
	"Miércoles",
	"Jueves",
	"Viernes",
	"Sábado"
]
class Day{
	constructor(number,acts){
		this.number = number?number:0
		this.acts = acts?acts:[]
	}
	render(){
		let td = document.createElement('td')
		if (!this.number) {
			td.classList.add('dead')
		}
		let label = document.createElement('label')
		let div = document.createElement('div')
		label.innerText = this.number?this.number:''
		td.appendChild(label)
		if (this.acts) {
			this.acts.forEach(activity=>{
				let p = document.createElement('p')
				p.innerText = activity
				div.appendChild(p)
			})
		}
		td.appendChild(div)
		return td
	}
}
function showCalendar( month = null , year = null , actsArray = new Array(32) ){
	let d = new Date()
	d.setDate(1)//set day of the month
	let monthNumber = d.getUTCMonth(),
		weekArray   = [[],[],[],[],[],[]],
		dayCounter  = 0,
		actualWeek  = 0

	if(typeof month === 'number'){
		//the thing goes 0-11, that's why the '-1'
		d.setUTCMonth(monthNumber = month - 1)
	}
	if(typeof year === 'number'){
		d.setFullYear(year)
	}
	let weekDay = d.getDay()
	for(let i = 0;i<weekDay;i++){
		weekArray[0].push(new Day(null,null))
		dayCounter++
	}
	for(let i = monthLong[ monthNumber ] , j = 1 ; i > 0 ; i-- , j++){
		if( dayCounter % 7 === 0 ){
			actualWeek++
		}
		weekArray[ actualWeek ].push( new Day( j , actsArray[j] ) )
		dayCounter++
	}
	let calendarBody = document.getElementById( 'calendar-body' )
	calendarBody.innerHTML = ''
	weekArray.forEach( function( week ){
		let tr = document.createElement('tr')
		week.forEach( function( day ){
			tr.appendChild(day.render())
		})
		calendarBody.appendChild(tr)
	})
}
Array.from(
	document.querySelectorAll('#inputs input,#inputs select')//take all inputs
).forEach(function(e){
	e.addEventListener('change',function() {
		let year = Number(document.getElementById('year').value),
			month = Number(document.getElementById('month').value)
		fetchCurrentMonth(month,year)
	})
})
/////////////////////////////////////////////////////////////////
function fetchCurrentMonth(month,year) {
	let details = {credentials:'include'},
		url = '/serofca/clinicsfrommonth?month=' + month + '&year=' + year,
		urlActs = '/serofca/actsFromMonth?month=' + month + '&year=' + year,
		pending = {
			visits:true,
			acts:true
		}
	let acts = new Array(32)
	
	fetch(urlActs,details)
		.then(e=>e.json())
		.then(function(json){
			pending.acts = false
			if (json.error) {
				console.log('Error')
				console.log(json)
				return
			}
			json.forEach(function(e) {
				e['fecha'] = new Date(e['fecha'])
				day = e['fecha'].getUTCDate()
				acts[day] = acts[day]?acts[day]:[]
				acts[day].push(e.concepto + ' en ' + e.nombre)
			})
			if (!pending.visits) {
				showCalendar( month , year , acts )
			}
		})
	fetch(url,details)
		.then(e=>e.json())
		.then(function(json){
			pending.visits = false
			if (json.error) {
				console.log('Error')
				console.log(json)
				return
			}
			json.forEach(function(e) {
				e['prox_visita'] = new Date(e['prox_visita'])
				day = e['prox_visita'].getUTCDate()
				acts[day] = acts[day]?acts[day]:[]
				acts[day].push(e.nombre)
			})
			if (!pending.acts) {
				showCalendar( month , year , acts )
			}
		})
}
let today = new Date()
document.querySelector('#inputs select').value = today.getUTCMonth() + 1
fetchCurrentMonth( today.getUTCMonth() + 1 , today.getFullYear() )//starts calendar
function fetchGlobal() {
	let details = {credentials:'include'},
		url = '/serofca/allclinics'
	fetch(url,details)
		.then(e=>e.json())
		.then(function(json){
			if (json.error) {
				console.log('Error')
				console.log(json)
				return
			}
			let tbodyHTML = ''
			json.forEach(function (e) {
				for(key in e){
					if (!e[key]) {
						e[key] = 'N/D'
					}
				}
				tbodyHTML += '<tr>'+
						'<td>'+e['nombre'].replaceAll('<','')+'</td>'+
						'<td>'+e['prox_visita'].replaceAll('<','').split('T')[0]+'</td>'+
						'<td>'+e['not_visita_fisico'].replaceAll('<','').split('T')[0]+'</td>'+
						'<td>'+e['llamada'].replaceAll('<','').split('T')[0]+'</td>'+
						'<td>'+e['reporte_actividades'].replaceAll('<','')+'</td>'+
						'<td>'+e['recibido_mcast'].replaceAll('<','').split('T')[0]+'</td>'+
						'<td>'+e['enviado_informe_serofca'].replaceAll('<','').split('T')[0]+'</td>'+
						'<td>'+e['recibido_servicio_serofca'].replaceAll('<','').split('T')[0]+'</td>'+
						'<td>'+e['enviado_centro_Salud'].replaceAll('<','').split('T')[0]+'</td>'+
						'<td>'+e['obs'].replaceAll('<','')+'</td>'+
						'<td>'+e['emails'].replaceAll('<','')+'</td>'+
					'</tr>'
			})
			document.getElementById('full-table').innerHTML = tbodyHTML
		})
}
fetchGlobal()