alert('r')

var searchBox = document.getElementById('text'),
	board = document.getElementById('arts'),
	dataFrame = document.getElementById('showData'),
	clinicas = null

function closeFrame() {
	dataFrame.style.display = 'none'
}

function assignDivs() {
	let divs = document.querySelectorAll('#arts > div')
	divs.forEach(function(e) {
		e.addEventListener('click',function() {
			let rif = this.id
			let actual = clinicas.filter( c => c.rif === rif )[0]
			dataFrame.innerHTML = `
				<i id="close">Cerrar</i>
				<b>Nombre de Clínica:</b> ${actual.nombre}<br>
				<b>rif:</b> ${actual.rif}<br><br>
				<b>Conformidad Sanitaria del Local<br></b>
				Último: ${actual.ultcsl?actual.ultcsl:'No Registrado'}<br>
				Vence:  ${actual.vencsl?actual.vencsl:'No Registrado'}<br>
				<b>RIMFRI<br></b>
				Último: ${actual.ultrim?actual.ultrim:'No Registrado'}<br>
				Vence:  ${actual.venrim?actual.venrim:'No Registrado'}<br>
				<b>Permiso Sanitario Ambiente Radiológico<br></b>
				Último: ${actual.ultpsr?actual.ultpsr:'No Registrado'}<br>
				Vence:  ${actual.venpsr?actual.venpsr:'No Registrado'}<br>
				<b>Permiso Sanitario Funcionamiento de los Equipos<br></b>
				Último: ${actual.ultpfe?actual.ultpfe:'No Registrado'}<br>
				Vence:  ${actual.venpfe?actual.venpfe:'No Registrado'}<br>

				<b>Observaciones Generales<br></b>
				${actual.observacion?actual.observacion:'No Registrado'}
			`
			dataFrame.style.display = 'block'
			document.getElementById('close').addEventListener('click',closeFrame)
		})
	})
}
document.getElementById('search').addEventListener('click',function(e) {
	if (!searchBox.value) {
		alert('escriba algo en el campo de búsqueda')
		return
	}
	board.innerHTML=''
	fetch('/serofca/buscar?s='+searchBox.value,{credentials:'include'}).then(function(res) {
		return res.json()
	}).then(function(array) {
		clinicas = array
		let content = ''
		array.forEach(function(e) {
			content += 
			`
				<div id="${e.rif}">
					<b>${e.nombre}</b>
					<br>${e.rif}
				</div>
			`
		})
		board.innerHTML = content
		assignDivs()
	}).catch(function(error) {
		alert('Al parecer hubo un error procesando su petición, contacte al encargado de sistemas.');
	});
})