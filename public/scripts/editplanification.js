var selectedRIF = ''
var allcls = null
function getClinics(){
	fetch('/serofca/allclinicsbyname',{credentials:'include'})
		.then(e=>e.json())
		.then(function(json) {
			if (json.error) {
				alert('error, verifique su conexión a internet')
				console.log(json.error)
				return
			}
			allcls = json
			let elementFromDOM = document.getElementById('clinics')
			elementFromDOM.innerHTML = ''//reset
			let divs = []/*
			json = json.sort(function(a,b){
				return a.nombre > b.nombre
			})*/
			quicksort( 0 , json.length - 1 , json )
			for (var i = 0 ; i < json.length; i++) {
				let clinic = json[i]
				let div = document.createElement('div')
				divs.push(div)
				div.setAttribute('key',clinic.rif)
				div.innerText = clinic.nombre
				elementFromDOM.appendChild(div)
			}
			updateListeners(divs)
		})
}

HTMLElement.prototype.nameCatcher = function(name) {
	return this.querySelector(`[name="${name}"]`)
}
HTMLElement.prototype.serialize = function(name) {
	let result = Array.from(this.querySelectorAll('input,textarea,select'))
	result = result.filter(e=>!!e.name)
	result = result.map(e=>encodeURIComponent(e.name)+'='+encodeURIComponent(e.value))
	result = result.join('&')
	return result
}

function updateListeners(elements) {
	elements.forEach(function(e) {
		e.addEventListener('click',function() {
			let rif = this.getAttribute('key')
			selectedRIF = rif
			fetch('/serofca/getclinicbyrifforplanification?rif='+rif,{credentials:'include'})
				.then(e=>e.json())
				.then(function(monoArray) {
					let clinic = monoArray[0]
					if (!clinic) {
						alert('error, clínica no hallada, notifique al administrador.')
					}
					console.log(clinic)
					document.querySelector('#black h2').innerText = clinic.nombre
					let form = document.querySelector('#black form')
					for(let key in clinic){
						let input = form.nameCatcher(key)
						if (input) {
							if(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\d[a-z|A-Z]$/.test(clinic[key])){
								input.value = clinic[key].split('T')[0]
							}else{
								input.value = clinic[key]
							}
						}else{
							console.log('no entry for '+key)
						}
					}
					document.getElementById('black').style.display = 'block'
				})
		})
	})
}
getClinics()

document.querySelector('#black form').addEventListener('click',function() {
	this.parentElement.setAttribute('mute','true')
})
document.querySelector('#black').addEventListener('click',function() {
	if(this.getAttribute('mute')!=='true'){
		this.style.display = 'none'
	}
	this.setAttribute('mute','false')
})
document.querySelector('#black form').addEventListener('submit',function(e) {
	e.preventDefault();
	let params = this.serialize()+'&rif='+encodeURIComponent(selectedRIF)
	let url = '/serofca/updateClinicCalendar?'+params
	fetch(url,{credentials:'include'})
		.then(e=>e.json())
		.then(function(json) {
			if (!json.permission) {
				alert('usted no está autorizado para modificar estos datos')
				return
			}
			if (!json.success) {
				alert('hubo un error en la consulta, contacte al administrador')
				return
			}
			alert('datos modificados exitosamente')
			document.getElementById('black').style.display = 'none'
		})
})

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