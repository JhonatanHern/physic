document.addEventListener('error',function(e) {
	console.log(e)
})
var year,month,today = new Date()
year = today.getFullYear()
month= today.getMonth()+1
var redDates = [year+'-'+(month>9?month:"0"+month)]
var yellowDates = []

month=(month+1===13)?1:month+1
year=(month===1)?year+1:year
redDates.push(year+'-'+(month>9?month:"0"+month))
month=(month+1===13)?1:month+1
year=(month===1)?year+1:year
yellowDates.push(year+'-'+(month>9?month:"0"+month))
month=(month+1===13)?1:month+1
year=(month===1)?year+1:year
yellowDates.push(year+'-'+(month>9?month:"0"+month))
var filters = {
	'red':function(elem){
		let year , month
		if(elem.ProxQc){
			year = elem.ProxQc.split('-')[0]
			month= elem.ProxQc.split('-')[1]
		}else{
			year = elem.ProximoLev.split('-')[0]
			month= elem.ProximoLev.split('-')[1]
		}
		return redDates.indexOf(year+'-'+month)!==-1
	},
	'yellow':function(elem){
		let year , month
		if(elem.ProxQc){
			year = elem.ProxQc.split('-')[0]
			month= elem.ProxQc.split('-')[1]
		}else{
			year = elem.ProximoLev.split('-')[0]
			month= elem.ProximoLev.split('-')[1]
		}
		return yellowDates.indexOf(year+'-'+month)!==-1
	}
}

$('#physic').html($('#physic').html())

var currentUser=$('#physic').val()


if (document.getElementById("opt")) {
	var bg=false,
		did,
		currentClinic,
		equiposAct,
		salasAct,
		serieEquipo,
		nomSala,
		chasisAct,
		dispAct,
		imgAct,
		actsAct,
		oldNumber=null,
		hayClinicas
	//////////////////////////////////////////////////////////////
	//funcion para actualizar el formulario de editar clinica
	//cuando se cambie de clinica en el primer select
	var updateForm = function (clinic) {
		var keys =['ultcsl','vencsl','ultrim','venrim','ultpsr','venpsr','ultpfe','venpfe','f_ccsl','n_pcsl','f_crim','n_prim','f_cpsr','n_ppsr','f_cpfe','n_ppfe']
		$('#formClinicaEdit input[name="nombre"]').val(clinic['nombre'])
		$('#formClinicaVer input[name="rif"]').val(clinic['rif'])
		$('#formClinicaVer input[name="nombre"]').val(clinic['nombre'])
		for (var i = keys.length - 1; i >= 0; i--) {
			$('#formClinicaEdit input[name="'+keys[i]+'"]').val(clinic[keys[i]]?(clinic[keys[i]]+'').split("T")[0]:"")
			$('#formClinicaVer input[name="'+keys[i]+'"]').val(clinic[keys[i]]?(clinic[keys[i]]+'').split("T")[0]:"")
		}
		$('#formClinicaEdit textarea').val(clinic.observacion)
		$('#formClinicaVer textarea').val(clinic.observacion)
	}
	var zero = JSON.parse($('#hiddenZero').text())
	currentClinic=zero
	$('#cotizaci section').text(zero.observacion?zero.observacion:"")
	updateForm(zero)
	//////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////
	function superficialUpdate(clinicRif){
		var asyncCounter=0
		$.get("serofca/equipos/?rif="+clinicRif+'&IDU='+currentUser,function(data) {
			equiposAct=data
			let options="",tbody = document.getElementById('equipos')
			tbody.innerHTML=''
			data.forEach(function(elem) {
				tbody.innerHTML+="<tr><td>"+elem.nombre+"</td><td>"+elem.sala+"</td><td>"+
					elem.UltimoQc.split('T')[0].split('-')[0] + '-' +
					elem.UltimoQc.split('T')[0].split('-')[1] +
					"</td><td>"+
					elem.ProxQc.split('T')[0].split('-')[0] + '-' +
					elem.ProxQc.split('T')[0].split('-')[1] +
					"</td><td>"+elem.observaciones+"</td></tr>"
				options+="<option value='"+elem.nombre+"' >"+elem.nombre+"</option>"
			})
			document.getElementById("modificarEquipoSel").innerHTML=options
			document.getElementById("eliminarEquipoSel").innerHTML=options
			document.getElementById("verEquipoSel").innerHTML=options
		})
		$.get("serofca/salas/?rif="+clinicRif+'&IDU='+currentUser,function(data) {
			salasAct=data
			let options='',tbody = document.getElementById('salas')
			tbody.innerHTML=''
			data.forEach(function(elem) {
				tbody.innerHTML+="<tr><td>"+elem.identificador_en_clinica+"</td><td>"+
					elem.observaciones+"</td><td>"+
					elem.UltimoLev.split('T')[0].split('-')[0]+'-'+
					elem.UltimoLev.split('T')[0].split('-')[1]+"</td><td>"+
					elem.ProximoLev.split('T')[0].split('-')[0]+'-'+
					elem.ProximoLev.split('T')[0].split('-')[1]+"</td></tr>"
				options+="<option value='"+elem.identificador_en_clinica+"' >"+
					elem.identificador_en_clinica+"</option>"
			})
			document.getElementById('modificarSalaSel').innerHTML=options
			document.getElementById('eliminarSalaSel').innerHTML=options
			document.getElementById('verSalaSel').innerHTML=options
		})
		$.get("serofca/getChasis/?rif=" + clinicRif,function(data) {
			chasisAct = data
			let options='',tbody = document.getElementById('chasis')
			tbody.innerHTML=''
			data.forEach(function(elem) {
				tbody.innerHTML+="<tr><td>"+elem.marca+"</td><td>"+
					elem.modelo+"</td><td>"+
					elem.tamano+"</td><td>"+
					elem.ubi+"</td><td>"+
					elem.n+"</td><td>"+
					elem.eval1+"</td><td>"+
					elem.obs1+"</td><td>"+
					elem.eval2+"</td><td>"+
					elem.obs2+"</td></tr>"
				options+="<option value='"+elem.n+"' >"+elem.n+"</option>"
			})
			document.getElementById('verChasisSel').innerHTML=options
			document.getElementById('modificarChasisSel').innerHTML=options
			document.getElementById('eliminarChasisSel').innerHTML=options
		})
		$.get("serofca/getDisp/?rif=" + clinicRif,function(data) {
			dispAct = data
			let options='',tbody = document.getElementById('disp')
			tbody.innerHTML=''
			data.forEach(function(elem) {
				tbody.innerHTML+="<tr><td>"+elem.tipo+"</td><td>"+
					elem.ubi+"</td><td>"+
					elem.n+"</td><td>"+
					elem.eval1+"</td><td>"+
					elem.obs1+"</td><td>"+
					elem.eval2+"</td><td>"+
					elem.obs2+"</td></tr>"
				options+="<option value='"+elem.n+"' >"+elem.n+"</option>"
			})
			document.getElementById('verDispSel').innerHTML=options
			document.getElementById('modificarDispSel').innerHTML=options
			document.getElementById('eliminarDispSel').innerHTML=options
		})
		$.get("serofca/getImagen/?rif=" + clinicRif,function(data) {
			imgAct = data
			let options='',tbody = document.getElementById('imagen')
			tbody.innerHTML=''
			data.forEach(function(elem) {
				tbody.innerHTML+="<tr><td>"+elem.tipo+"</td><td>"+
					elem.ubi+"</td><td>"+
					elem.n+"</td><td>"+
					elem.eval1+"</td><td>"+
					elem.obs1+"</td><td>"+
					elem.eval2+"</td><td>"+
					elem.obs2+"</td></tr>"
				options+="<option value='"+elem.n+"' >"+elem.n+"</option>"
			})
			document.getElementById('verImagenSel').innerHTML=options
			document.getElementById('modificarImagenSel').innerHTML=options
			document.getElementById('eliminarImagenSel').innerHTML=options
		})
		fetch("serofca/getActividadesClinicaActualizada?rif="+clinicRif,{
			credentials:'include'
			}).then(res=>res.json()).then(data=>{
			actsAct = data
			let tbody = document.getElementById('acts'),
				options = ''

			tbody.innerHTML=""
			data.forEach(function(act) {
				let tr = document.createElement('tr'),
					td1 = document.createElement('td'),
					td2 = document.createElement('td')
				td1.innerText = act.fecha.split('T')[0]
				td2.innerText = act.concepto
				tr.appendChild(td1)
				tr.appendChild(td2)
				tbody.appendChild(tr)

				options += "<option value='" + 
							act.fecha + 
							'///' + 
							act.concepto + 
							"' >" +
								act.concepto +
							"</option>"
			})
			document.getElementById("verActividadSel").innerHTML=options
			document.getElementById("modificarActividadSel").innerHTML=options
			document.getElementById("eliminarActividadSel").innerHTML=options
		})
	}
	//////////////////////////////////////////////////////////////////
	function update(clinicRif){
		let url = "serofca/clinica/?rif="+encodeURI(clinicRif)+'&IDU='+currentUser
		$.get(url,function(clinic) {
			currentClinic = clinic
			var keys =['ultcsl','vencsl','ultrim','venrim','ultpsr','venpsr','ultpfe','venpfe','f_ccsl','n_pcsl','f_crim','n_prim','f_cpsr','n_ppsr','f_cpfe','n_ppfe']
			keys.forEach(function (e,i,a) {
				$('#'+e).text(clinic[e]?(clinic[e]+'').split('T')[0]:"No registrado")
			})
			$('#cotizaci section').text(clinic.observacion?clinic.observacion:"")
			updateForm(clinic)
			if(bg){
				bg.remove()
				bg=false
			}
		}).fail(function(f) {
			//alert("error, verifica que tengas internet\n")
			$('#cotizaci section').text('')
			if(bg){
				bg.remove()
				bg=false
			}
		})
		superficialUpdate(clinicRif)
	}
	///////////////////////////////////////////////////////////////////
	$('#clinic').on('change',function(e){
		bg = $('<div/>',{id:'bgclearer'})
		$('body').append(bg)
		$('#equipos,#salas').html('')
		update(this.value)
	})
	document.getElementById('clinic').value = zero.rif
	////////////////////////////////////////////////////////////////////
	function pendientes(){
		$.get("serofca/pendientes/?IDU="+currentUser,function(data,status) {
			var fullArray = data.equipos.concat(data.salas)
			fullArray=fullArray.sort(function(a,b){
				var fa=a.ProxQc?a.ProxQc:a.ProximoLev,
					fb=b.ProxQc?b.ProxQc:b.ProximoLev
				fa = fa.split('T')[0].split('-')
				fb = fb.split('T')[0].split('-')
				fa ={year:fa[0]-0,month:fa[1]-0}
				fb ={year:fb[0]-0,month:fb[1]-0}
				return fa.year!==fb.year?fa.year>fb.year:fa.month>fb.month
			})
			//se les quita el TIME del DATETIME y nos quedamos con el DATE
			fullArray.forEach(function(elem,i,arr) {
				if(elem.ProxQc){
					elem.ProxQc = elem.ProxQc.split('T')[0]
					elem.ProxQc = elem.ProxQc.split('-')[0]+'-'+elem.ProxQc.split('-')[1]
				}else{
					elem.ProximoLev = elem.ProximoLev.split('T')[0]
					elem.ProximoLev = elem.ProximoLev.split('-')[0]+'-'+elem.ProximoLev.split('-')[1]

				}
			})
			//Ahora separamos los rojos y los amarillos
			var red = fullArray.filter(filters['red'])
			var yellow = fullArray.filter(filters['yellow'])
			document.getElementById('yellow').innerHTML = ""
			for (var i = yellow.length - 1; i >= 0; i--) {
				var el = yellow[i]
				var text
				if (el.ProxQc){
					text = ('('+el.ProxQc+') '+el.nombre+' en '+el.Lugar)
				}else{
					text = ('('+el.ProximoLev+') Sala '+el.nombre+' en '+el.Lugar)
				}
				document.getElementById('yellow').innerHTML += "<li>" + text + "</li>"
			}
			document.getElementById('red').innerHTML = ""
			for (var i = red.length - 1; i >= 0; i--) {
				var el = red[i]
				var text
				if (el.ProxQc){
					text = ('('+el.ProxQc+') '+el.nombre+' en '+el.Lugar)
				}else{
					text = ('('+el.ProximoLev+') Sala '+el.nombre+' en '+el.Lugar)
				}
				document.getElementById('red').innerHTML += "<li>" + text + "</li>"
			}
		})

		$.get('serofca/pasados/?IDU='+currentUser,function(data,status) {
			let purple = document.getElementById('purple')
			let fullArray = data.equipos.concat(data.salas)
			fullArray.sort((a,b)=>{
				let ca = a.hasOwnProperty( 'clinica' ) ? a.clinica : a.nombre
				let cb = b.hasOwnProperty( 'clinica' ) ? b.clinica : b.nombre
				return ca > cb
			})

			purple.innerHTML = ""
			for (let i = fullArray.length - 1; i >= 0; i--) {
				let el = fullArray[i]
				let li = document.createElement('li')
				if (el.clinica){
					li.innerText = ('Equipo '+el.nombre+' en '+el.clinica + ' (' + el['expiration_date'].split('T')[0] + ')' )
				}else{
					li.innerText = ('Sala '+el['identificador_en_clinica']+' en '+el.nombre + ' (' + el['expiration_date'].split('T')[0] + ')' )
				}
				purple.appendChild(li)
			}
		})
	}
	////////////////////////////////////////////////////////////////////
	superficialUpdate($('#clinic').val())
	////////////////////////////////////////////////////////////////////
	$('#mCrear,#mModificar,#mEliminar,#mVer,#mPrint,#mSubirInforme,#mSubirDosimet').click(function () {
		//destination identification
		if (bg) {
			bg.remove()
			bg=false
		}
		$(did).css('display','none')
		did='#'+this.id.substr(1,this.id.length).toLowerCase()
		bg = $('<div/>',{id:'bgclearer'})
		$('body').append(bg)
		$(did).css('display','block')
		bg.click(function () {
			bg.remove()
			bg=false
			$(did).css('display','none')
		})
	})
	$('#modals > div > i.fa').click(function () {//CERRAR VENTANA
		if (bg) {
			bg.remove()
			bg=false
		}
		$(did).css('display','none')
	})
	$('.primarySelector>button').click(function () {
		$(did).css('display','none')
		did = $(this).attr('appTarget')
		if (did === '#modificarClinica' && !hayClinicas) {
			alert('no hay clínica para modificar')
			if (bg) {
				bg.remove()
				bg=false
			}
			return
		}
		$(did).css('display','block')
	})
	/////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	$('#elebut').click(function() {//ELIMINAR
		if (equiposAct.length===0) {
			alert('no hay equipos disponibles')
			if (bg) {
				bg.remove()
				bg=false
			}
			return
		}
		$.ajax({
			url:"/serofca/eliminarEquipo",
			method:"DELETE",
			data:"rif="+encodeURI(currentClinic.rif)+
				"&name="+encodeURI($('#eliminarEquipoSel').val())+
				"&IDU="+$('#physic').val(),
			success:function(q){
				if (!q.success) {
					alert(q.message)
				}
				update($('#clinic').val())
				pendientes()
				$(did).css('display','none')
			}
		})
	})
	$('#elsbut').click(function() {//ELIMINAR
		if (salasAct.length===0) {
			alert('no hay salas disponibles')
			if (bg) {
				bg.remove()
				bg=false
			}
			return
		}
		$.ajax({
			url:"/serofca/eliminarSala",
			method:"DELETE",
			data:"rif="+encodeURI(currentClinic.rif)+
				"&name="+encodeURI($('#eliminarSalaSel').val()),
			success:function(q){
				if (!q.success) {
					alert(q.message)
				}
				update($('#clinic').val())
				pendientes()
				$(did).css('display','none')
			}
		})
	})
	$('#elubut').click(function() {//ELIMINAR
		$.ajax({
			url:"/serofca/eliminarUsuario",
			method:"DELETE",
			data:"IDU="+$('#physic').val(),
			success:function(q){
				if (!q.success) {
					alert(q.message)
				}
				location.reload()
				update($('#clinic').val())
				pendientes()
				$(did).css('display','none')
			}
		})
	})
	$('#elcbut').click(function() {//ELIMINAR
		if(!hayClinicas){
			alert('no hay clínica por eliminar')
			if (bg) {
				bg.remove()
				bg=false
			}
			return
		}
		$.ajax({
			url:"/serofca/eliminarClinica",
			method:"DELETE",
			data:"rif="+$('#clinic').val(),
			success:function(q){
				if (!q.success) {
					alert(q.message)
				}
				location.reload()
			}
		})
	})
	function terminate(url,set,id) {
		$(did).css('display','none')
		if (set.length===0) {
			if (bg) {
				bg.remove()
				bg=false
			}
			return
		}
		$.ajax({
			url:url,
			method:"DELETE",
			data:"rif="+encodeURI(currentClinic.rif)+
				"&name="+encodeURI($(id).val()),
			success:function(q){
				if (!q.success) {
					alert(q.message)
				}
				update($('#clinic').val())
				pendientes()
			}
		})
	}
	document.getElementById('elchbut').addEventListener('click',function() {//ELIMINAR
		terminate("/serofca/eliminarChasis",chasisAct,'#eliminarChasisSel')
	})
	document.getElementById('eldbut').addEventListener('click',function() {//ELIMINAR
		terminate("/serofca/eliminarDisp",dispAct,'#eliminarDispSel')
	})
	document.getElementById('elibut').addEventListener('click',function() {//ELIMINAR
		terminate("/serofca/eliminarImagen",imgAct,'#eliminarImagenSel')
	})
	document.getElementById('elabut').addEventListener('click',function() {//ELIMINAR
		if (actsAct.length===0) {
			alert('no hay actividades disponibles')
			if (bg) {
				bg.remove()
				bg=false
			}
			return
		}
		let value = $('#eliminarActividad select').val()
		currentAct = actsAct.filter(a=>{
			return value === a.fecha + '///' + a.concepto
		})[0]
		$.ajax({
			url:"/serofca/eliminarActividad",
			method:"DELETE",
			data:"rif="+encodeURI(currentClinic.rif)+
				"&concepto="+encodeURI(currentAct.concepto)+
				"&fecha="+encodeURI(currentAct.fecha.split('T')[0]),
			success:function(q){
				if (typeof q==="string") {
					q = JSON.parse(q)
				}
				if (!q.success) {
					alert(q.message)
				}
				superficialUpdate($('#clinic').val())
				pendientes()
				$(did).css('display','none')
				bg.remove()
				bg=false
			}
		})
	})
	/////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	$('#formClinicaEdit').submit(function(e) {//modificar
		e.preventDefault()
		$(did).css('display','none')
		$.ajax({
			type:"POST",
			url:'/serofca/modificarClinica',
			data:$('#formClinicaEdit').serialize()+'&rif='+encodeURI($('#clinic').val()),
			success: function(data) {
				if (!data.success) {
					alert(data.message)
				}
				console.log(data)
				update($('#clinic').val())
				pendientes()
				let q = '#clinic option[value="'+currentClinic.rif+'"]'
				$(q).html($('#formClinicaEdit input[name="nombre"]').val())
				bg.remove()
				bg=false
			}
		})
	})
	$('#formUsuarioModificar').submit(function(e) {//modificar
		e.preventDefault()
		$(did).css('display','none')
		$.ajax({
			method:'POST',
			url:'/serofca/modificarUsuario',
			data:$('#formUsuarioModificar').serialize()+'&IDU='+$('#physic').val(),
			success:function(json) {
				$('#formUsuarioModificar')[0].reset()
				if (json.success) {
					location.reload()
				} else {
					alert(json.message)
					bg.remove()
					bg=false
				}
			}
		})
	})
	$('#formModificaEquipo').submit(function(e) {//modificar
		e.preventDefault()
		$(did).css('display','none')
		$.ajax({
			type:"POST",
			url:'/serofca/modificarEquipo',
			data:$('#formModificaEquipo').serialize()+'&rif='+encodeURI($('#clinic').val())+'&old='+encodeURI(serieEquipo),
			success: function(json) {
				if (!json.success) {
					alert(json.message)
				}
				pendientes()
				update($('#clinic').val())
				bg.remove()
				bg=false
			}
		})
	})
	$('#formModificaSala').submit(function(e) {//modificar
		e.preventDefault()
		$(did).css('display','none')
		$.ajax({
			type:"POST",
			url:'/serofca/modificarSala',
			data:$('#formModificaSala').serialize()+'&rif='+encodeURI($('#clinic').val())+'&old='+encodeURI(nomSala),
			success: function(json) {
				if (!json.success) {
					alert(json.message)
				}
				pendientes()
				update($('#clinic').val())
				bg.remove()
				bg=false
			}
		})
	})
	let modifyLastThreeTables = function(event,url,formIdentification) {
		event.preventDefault()
		$(did).css('display','none')
		$.ajax({
			type:"POST",
			url:url,
			data:$(formIdentification).serialize()+'&rif='+encodeURI($('#clinic').val())+'&old='+encodeURI(oldNumber),
			success: function(json) {
				if (!json.success) {
					alert(json.message)
				}
				update($('#clinic').val())
				bg.remove()
				bg=false
			}
		})
	}
	$('#formModificaChasis').submit(function(e) {
		modifyLastThreeTables(e,'serofca/modificarChasis','#formModificaChasis')
	})
	$('#formModificaDisp').submit(function(e) {
		modifyLastThreeTables(e,'serofca/modificarDisp','#formModificaDisp')
	})
	$('#formModificaImagen').submit(function(e) {
		modifyLastThreeTables(e,'serofca/modificarImagen','#formModificaImagen')
	})
	document.getElementById('formModificaActividad').addEventListener('submit',function(e) {//modificar
		e.preventDefault()
		$(did).css('display','none')
		$.ajax({
			type:"POST",
			url:'/serofca/modificarActividad',
			data:$('#formModificaActividad').serialize()+'&rif='+encodeURI($('#clinic').val()),
			success: function(json) {
				json = JSON.parse(json)
				if (!json.success) {
					alert('error desconocido, notifique al administrador de sistemas')
				}
				superficialUpdate($('#clinic').val())
				bg.remove()
				bg = false
			}
		})
	})
	/////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////
	$('#modificarEquipo button').click(function(){//actualizar formulario
		if (equiposAct.length===0) {
			alert('no hay equipos disponibles')
			return
		}
		$(did).css('display','none')
		did="#modificarEquipoformdiv"
		$(did).css('display','block')
		let name = $('#modificarEquipoSel').val()
		let curr = equiposAct.filter(eq=>eq.nombre===name)[0]
		$("#modificarEquipoformdiv form input[name='serial']").val(curr.serie)
		$("#modificarEquipoformdiv form input[name='nombre']").val(curr.nombre)
		$("#modificarEquipoformdiv form input[name='sala']").val(curr.sala)
		serieEquipo=curr.serie
		$("#modificarEquipoformdiv form input[name='marca']").val(curr.marca)
		$("#modificarEquipoformdiv form input[name='modelo']").val(curr.modelo)
		let currdate = curr.UltimoQc.split('T')[0].split('-')
		$("#modificarEquipoformdiv form input[name='uqc']").val(currdate[0]+'-'+currdate[1])
		currdate = curr.ProxQc.split('T')[0].split('-')
		$("#modificarEquipoformdiv form input[name='pqc']").val(currdate[0]+'-'+currdate[1])
		$("#modificarEquipoformdiv form textarea").val(curr.observaciones)
	})
	$('#modificarSala button').click(function() {//actualizar formulario
		if (salasAct.length===0) {
			alert('no hay salas disponibles')
			return
		}
		$(did).css('display','none')
		did="#modificarSalaformdiv"
		$(did).css('display','block')
		let name = $('#modificarSalaSel').val()
		nomSala = name
		let curr = salasAct.filter(eq=>eq.identificador_en_clinica===name)[0]
		$("#modificarSalaformdiv form input[name='identificador_en_clinica']").val(curr.identificador_en_clinica)
		let currdate = curr.UltimoLev.split('T')[0].split('-')
		$("#modificarSalaformdiv form input[name='ulv']").val(currdate[0]+'-'+currdate[1])
		currdate = curr.ProximoLev.split('T')[0].split('-')
		$("#modificarSalaformdiv form input[name='plv']").val(currdate[0]+'-'+currdate[1])
		$("#modificarSalaformdiv form textarea[name='equipos']").val(curr.equipos)
		$("#modificarSalaformdiv form textarea[name='observaciones']").val(curr.observaciones)
	})
	$('#mub').click(function() {
		$('#formUsuarioModificar input[name="email"]').val($('#physic option[value="'+$('#physic').val()+'"]').text())
	})
	let updateFormOfTheThreeLastTables = function(set,idForm,idSelector,frameSelector) {
		/* BTW, those tables are = {"QC Chasis","QC Disp","QC Imagen"} */
		$(did).css('display','none')
		if (set.length===0) {
			alert('no hay QC disponibles')
			if (bg) {
				bg.remove()
				bg=false
			}
			return
		}
		did = frameSelector
		$(did).css('display','block')
		let n = document.getElementById(idSelector).value
		let curr = set.filter(e=>e.n===n)[0]
		oldNumber = curr.n //save the number for the modification
		let form = document.getElementById(idForm)
		for(name in curr){
			let element = form.querySelector(`*[name="${ name }"]`)
			if(element){//ceck if the input exists, excludes "rif"
				element.value = name==='date1'||name==='date2'?curr[name].split('-01T')[0]:curr[name]
			}
		}
	}
	$('#modificarChasis button').click(function() {//actualizar formulario
		updateFormOfTheThreeLastTables(chasisAct,'formModificaChasis','modificarChasisSel','#modificarChasisformdiv')
	})
	$('#modificarDisp button').click(function() {//actualizar formulario
		updateFormOfTheThreeLastTables(dispAct  ,'formModificaDisp'  ,'modificarDispSel'  ,'#modificarDispformdiv'  )
	})
	$('#modificarImagen button').click(function() {//actualizar formulario
		updateFormOfTheThreeLastTables(imgAct   ,'formModificaImagen','modificarImagenSel','#modificarImagenformdiv')
	})
	$('#modificarActividad button').click(function() {
		if (actsAct.length===0) {
			alert('no hay actividades disponibles')
			return
		}
		let value = $('#modificarActividad select').val()
		console.log(value)
		currentAct = actsAct.filter(a=>{
			return value === a.fecha + '///' + a.concepto
		})[0]
		console.log(currentAct)
		$(did).css('display','none')
		did="#modificarActividadformdiv"
		$(did).css('display','block')
		$(did + ' input[name="fechan"]').val(currentAct.fecha.split('T')[0])
		$(did + ' input[name="fechap"]').val(currentAct.fecha.split('T')[0])
		$(did + ' input[name="concepton"]').val(currentAct.concepto)
		$(did + ' input[name="conceptop"]').val(currentAct.concepto)
	})
	/////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////
	//UPLOADS
	$('#uploadInf').click(function() {
		let myWindow = window.open("_blank","subir archivo"),
			year     = $("#subirinforme .year").val()
			month    = $("#subirinforme .month").val()
		myWindow.document.write(
			'<form enctype="multipart/form-data" action="/serofca/subirInforme?rif='+$('#clinic').val()+'&year='+year+'&month='+month+'" method="post">'+
				'<input type="file" name="filetoupload" />'+
				'<input type="submit" value="Enviar Archivo" name="submit">'+
			'</form>')
		$(did).css('display','none')
		if (bg) {
			bg.remove()
			bg=null
		}
	})
	$('#uploadDos').click(function(){
		let myWindow = window.open("_blank","subir archivo"),
			year     = $("#subirinforme .year").val()
			month    = $("#subirinforme .month").val()
		myWindow.document.write(
			'<form enctype="multipart/form-data" action="/serofca/subirDosimet?rif='+$('#clinic').val()+'&year='+year+'&month='+month+'" method="post">'+
				'<input type="file" name="filetoupload" />'+
				'<input type="submit" value="Enviar Archivo" name="submit">'+
			'</form>')
		$(did).css('display','none')
		if (bg) {
			bg.remove()
			bg=null
		}
	})
	var currentDownloadMonth = 1
	$('#meses span').click(function() {
		$('#meses span').removeClass('activeMonth')
		$('#'+this.id).addClass('activeMonth')
		currentDownloadMonth = this.id - 0
	})
	$('#getInforme').click(function() {
		var id = $('#meses span.activeMonth')[0].id
		id=id.substr(1,id.length)
		url = "/serofca/getInforme?month="+id+'&year='+$('#anio').val()+'&rif='+$('#clinic').val()
		window.open(url,'archivo')
	})
	$('#getDosimet').click(function() {
		var id = $('#meses span.activeMonth')[0].id
		id=id.substr(1,id.length)
		url = "/serofca/getDosimet?month="+id+'&year='+$('#anio').val()+'&rif='+$('#clinic').val()
		window.open(url,'archivo')
	})
	/////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////
	var globalUpdate = function(){
		pendientes()
		$.get('/serofca/getClinicas/?IDU='+currentUser,function(res) {
			let str = ''
			for (var i = 0 ; i < res.length ; i++) {
				str+="<option value='"+res[i].rif+"'>"+res[i].nombre+"</option>"
			}
			hayClinicas = false
			if (res.length) {
				update(res[0].rif)
				hayClinicas = true
			}else{
				update('')
				var keys =['ultcsl','vencsl','ultrim','venrim','ultpsr','venpsr','ultpfe','venpfe']
				keys.forEach(function (e,i,a) {
					$('#'+e).html("<span style='color:silver'>No hay datos</span>")
				})
			}
			$('#clinic').html(str)
		})
	}
	globalUpdate()
	$('#physic').on('change',function(e){
		$('#equipos,#salas').html('')
		currentUser = this.value
		globalUpdate()
	})
	/////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////
	$('#formCreaEquipo').submit(function(e){//CREAR
		$(did).css('display','none')
		e.preventDefault()
		$.ajax({
			type:"POST",
			url:'/serofca/nuevoEquipo',
			data:$('#formCreaEquipo').serialize()+'&rif='+encodeURI($('#clinic').val())+'&IDU='+currentUser,
			success: function(json) {
				if (json.success) {
					update($('#clinic').val())
					$('#formCreaEquipo')[0].reset()
				}else{
					alert(json.error)
				}
				pendientes()
				bg.remove()
				bg=false
			}
		})
	})
	$('#formCreaSala').submit(function(e){//CREAR
		$(did).css('display','none')
		e.preventDefault()
		$.ajax({
			type:"POST",
			url:'/serofca/nuevaSala',
			data:$('#formCreaSala').serialize()+'&rif_clinica='+encodeURI($('#clinic').val())+'&IDU='+currentUser,
			success: function(json) {
				if (!json.success) {
					alert(json.message)
				}else{
					$('#formCreaSala')[0].reset()
				}
				update($('#clinic').val())
				pendientes() 
				bg.remove()
				bg=false
			}
		})
	})
	$('#formCreaUsuario').submit(function(e) {//CREAR
		e.preventDefault()
		$(did).css('display','none')
		$.ajax({
			type:"POST",
			url:'/serofca/nuevoUsuario',
			data:$('#formCreaUsuario').serialize(),
			success: function(json) {
				if (!json.success) {
					alert(json.message)
					bg.remove()
					bg = false
				}else{
					$('#formCreaUsuario')[0].reset()
					location.reload()
				}
			}
		})
	})
	$('#formCreaClinica').submit(function(e) {//CREAR
		e.preventDefault()
		$(did).css('display','none')
		$.ajax({
			type:"POST",
			url:'/serofca/nuevaClinica',
			data:$('#formCreaClinica').serialize()+'&IDU='+currentUser,
			success: function(json) {
				console.log(json)
				if (!json.success) {
					alert(json.message)
					bg.remove()
					bg = false
				}else{
					$('#formCreaClinica')[0].reset()
					globalUpdate()
				}
			}
		})
	})
	function create(event,formID,urlToPost) {
		$(did).css('display','none')
		event.preventDefault()
		$.ajax({
			type:"POST",
			url:urlToPost,
			data:$(formID).serialize()+'&rif_clinica='+encodeURI($('#clinic').val()),
			success: function(json) {
				if (!json.success) {
					alert(json.message)
				}
				update($('#clinic').val())
				pendientes()
				$(formID)[0].reset()
				bg.remove()
				bg=false
			},
			error:function(err) {
				console.log(err.error)
				bg.remove()
				bg=false
			}
		})
	}
	$('#formCreaChasis').submit(function(e){//CREAR
		create(e,'#formCreaChasis','/serofca/newChasis')
	})
	$('#formCreaDisp').submit(function(e){//CREAR
		create(e,'#formCreaDisp','/serofca/newDisp')
	})
	$('#formCreaImagen').submit(function(e){//CREAR
		create(e,'#formCreaImagen','/serofca/newImagen')
	})
	$('#formCreaActividad').submit(function(e){//CREAR
		$(did).css('display','none')
		e.preventDefault()
		$.ajax({
			type:"POST",
			url:'/serofca/nuevaActividad',
			data:$('#formCreaActividad').serialize()+'&rif_clinica='+encodeURI($('#clinic').val()),
			success: function(json) {
				console.log(json)
				if (!json.success) {
					//alert(json.message)
				}else{
					$('#formCreaActividad')[0].reset()
				}
				superficialUpdate($('#clinic').val())
				bg.remove()
				bg = false
			}
		})
	})
	/////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////
	$('#verEquipo button').click(function() {//VER
		if (equiposAct.length===0) {
			alert('no hay equipos disponibles')
			return
		}
		$(did).css('display','none')
		did="#verEquipoPanel"
		$(did).css('display','block')
		let name = $('#verEquipoSel').val()
		let curr = equiposAct.filter(eq=>eq.nombre===name)[0]
		$("#verEquipoPanel form input[name='serial']").val(curr.serie)
		$("#verEquipoPanel form input[name='nombre']").val(curr.nombre)
		$("#verEquipoPanel form input[name='sala']").val(curr.sala)
		serieEquipo=curr.serie
		$("#verEquipoPanel form input[name='marca']").val(curr.marca)
		$("#verEquipoPanel form input[name='modelo']").val(curr.modelo)
		let currdate = curr.UltimoQc.split('T')[0].split('-')
		$("#verEquipoPanel form input[name='uqc']").val(currdate[0]+'-'+currdate[1])
		currdate = curr.ProxQc.split('T')[0].split('-')
		$("#verEquipoPanel form input[name='pqc']").val(currdate[0]+'-'+currdate[1])
		$("#verEquipoPanel form textarea").val(curr.observaciones)
	})
	$('#verSala button').click(function() {//VER
		if (salasAct.length===0) {
			alert('no hay salas disponibles')
			return
		}
		$(did).css('display','none')
		did="#verSalaPanel"
		$(did).css('display','block')
		let name = $('#verSalaSel').val()
		nomSala = name
		let curr = salasAct.filter(eq=>eq.identificador_en_clinica===name)[0]
		$("#verSalaPanel form input[name='identificador_en_clinica']").val(curr.identificador_en_clinica)
		let currdate = curr.UltimoLev.split('T')[0].split('-')
		$("#verSalaPanel form input[name='ulv']").val(currdate[0]+'-'+currdate[1])
		currdate = curr.ProximoLev.split('T')[0].split('-')
		$("#verSalaPanel form input[name='plv']").val(currdate[0]+'-'+currdate[1])
		$("#verSalaPanel form textarea[name='equipos']").val(curr.equipos)
		$("#verSalaPanel form textarea[name='observaciones']").val(curr.observaciones)
	})
	$('#verChasis button').click(function() {//VER
		if (chasisAct.length===0) {
			alert('no hay salas disponibles')
			return
		}
		$(did).css('display','none')
		did="#verChasisPanel"
		$(did).css('display','block')
		let name = $('#verChasisSel').val()
		let curr = chasisAct.filter(eq=>eq.n===name)[0]
		$(did+' form input[name="marca"]').val(curr.marca?curr.marca:'')
		$(did+' form input[name="modelo"]').val(curr.modelo?curr.modelo:'')
		$(did+' form input[name="tamano"]').val(curr.tamano?curr.tamano:'')
		$(did+' form input[name="ubi"]').val(curr.ubi?curr.ubi:'')
		$(did+' form input[name="n"]').val(curr.n?curr.n:'')
		$(did+' form input[name="eval1"]').val(curr.eval1?curr.eval1:'')
		$(did+' form input[name="obs1"]').val(curr.obs1?curr.obs1:'')
		$(did+' form input[name="date1"]').val(curr.date1?curr.date1.split('-01T')[0]:'')
		$(did+' form input[name="eval2"]').val(curr.eval2?curr.eval2:'')
		$(did+' form input[name="obs2"]').val(curr.obs2?curr.obs2:'')
		$(did+' form input[name="date2"]').val(curr.date2?curr.date2.split('-01T')[0]:'')
	})
	$('#verDisp button').click(function() {//VER
		if (dispAct.length===0) {
			alert('no hay salas disponibles')
			return
		}
		$(did).css('display','none')
		did="#verDispPanel"
		$(did).css('display','block')
		let name = $('#verDispSel').val()
		let curr = dispAct.filter(eq=>eq.n===name)[0]
		$(did+' form input[name="tipo"]').val(curr.tipo?curr.tipo:'')
		$(did+' form input[name="ubi"]').val(curr.ubi?curr.ubi:'')
		$(did+' form input[name="n"]').val(curr.n?curr.n:'')
		$(did+' form input[name="eval1"]').val(curr.eval1?curr.eval1:'')
		$(did+' form input[name="obs1"]').val(curr.obs1?curr.obs1:'')
		$(did+' form input[name="date1"]').val(curr.date1?curr.date1.split('-01T')[0]:'')
		$(did+' form input[name="eval2"]').val(curr.eval2?curr.eval2:'')
		$(did+' form input[name="obs2"]').val(curr.obs2?curr.obs2:'')
		$(did+' form input[name="date2"]').val(curr.date2?curr.date2.split('-01T')[0]:'')
	})
	$('#verImagen button').click(function() {//VER
		if (imgAct.length===0) {
			alert('no hay salas disponibles')
			return
		}
		$(did).css('display','none')
		did="#verImagenPanel"
		$(did).css('display','block')
		let name = $('#verImagenSel').val()
		let curr = imgAct.filter(eq=>eq.n===name)[0]
		$(did+' form input[name="tipo"]').val(curr.tipo?curr.tipo:'')
		$(did+' form input[name="ubi"]').val(curr.ubi?curr.ubi:'')
		$(did+' form input[name="n"]').val(curr.n?curr.n:'')
		$(did+' form input[name="eval1"]').val(curr.eval1?curr.eval1:'')
		$(did+' form input[name="obs1"]').val(curr.obs1?curr.obs1:'')
		$(did+' form input[name="date1"]').val(curr.date1?curr.date1.split('-01T')[0]:'')
		$(did+' form input[name="eval2"]').val(curr.eval2?curr.eval2:'')
		$(did+' form input[name="obs2"]').val(curr.obs2?curr.obs2:'')
		$(did+' form input[name="date2"]').val(curr.date2?curr.date2.split('-01T')[0]:'')
		console.log(curr)
	})
	$('#verActividad button').click(function() {
		if (actsAct.length===0) {
			alert('no hay actividades disponibles')
			return
		}
		let value = $('#verActividad select').val()
		console.log(value)
		currentAct = actsAct.filter(a=>{
			return value === a.fecha + '///' + a.concepto
		})[0]
		console.log(currentAct)
		$(did).css('display','none')
		did="#verActividadformdiv"
		$(did).css('display','block')
		$(did + ' input[name="fecha"]').val(currentAct.fecha.split('T')[0])
		$(did + ' input[name="concepto"]').val(currentAct.concepto)
	})
	/////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////////
	function print(html,title,onlyshow) {
		let mywindow = window.open('', 'PRINT');
		html = '<html>'+
					'<head>'+
						'<style>'+
							'td,th{border: 1px solid black;text-align:center}'+
						'</style>'+
					'</head>'+
					'<body>'+
						(title?'<h1 style="max-width:100%">'+title+"</h1>":'')+
						'<table style="border-collapse:collapse;max-width:100%">'+
							html+
						'</table>'+
					'</body>'+
				'</html>'
		mywindow.document.write(html);
		mywindow.document.close(); // necesario para IE >= 10
		mywindow.focus(); // necesario para IE >= 10
		if (!onlyshow){
			mywindow.print();
			mywindow.close();
		}
	}
	function pUrgentes(){
		let Q = (e) => document.getElementById(e).innerHTML
		let thead = '<thead><tr><th>En 2 o 3 meses</th><th>Este mes o el próximo</th><th>Pasados</th></tr></thead>',
			tbody = '<tbody><tr><td>'+Q('yellow')+'</td><td>'+Q('red')+'</td><td>'+Q('purple')+'</td></tr></tbody>'
		print(thead+tbody,'Pendientes ('+$('#physic option[value="'+currentUser+'"]').text().split('serofca')[0]+')')
	}
	document.getElementById('show-u').onclick = function (){
		let Q = (e) => document.getElementById(e).innerHTML
		let thead = '<thead><tr><th>En 2 o 3 meses</th><th>Este mes o el próximo</th><th>Pasados</th></tr></thead>',
			tbody = '<tbody><tr><td>'+Q('yellow')+'</td><td>'+Q('red')+'</td><td>'+Q('purple')+'</td></tr></tbody>'
		print(thead+tbody,'Pendientes ('+$('#physic option[value="'+currentUser+'"]').text().split('serofca')[0]+')',true)
		if (bg) {
			bg.remove()
			bg=false
		}
	}
	$('#print button').click(function() {
		let id = this.id
		if (id==='printUrgentes') {
			pUrgentes()
			return
		}
		let map = {
			'printPermisos':'permisos',
			'printEquipos':'tablEquipos',
			'printSalas':'tablSalas',
			'printChasis':'tablChasis',
			'printDispositivos':'tablDisp',
			'printImagen':'tablImagen',
			'printActividad':'tablActs'
		}
		print(document.getElementById(map[id]).innerHTML,currentClinic.nombre)
		$(did).css('display','none')
		if (bg) {
			bg.remove()
			bg=false
		}
	})
	document.getElementById('nombreClinica').addEventListener('keyup',function(e){
		this.value = this.value.toUpperCase()
	})
	///////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////
	document.querySelector('#modEn button').addEventListener('click',function(){
		let rif= encodeURI( $('#clinic').val() ),
			next= encodeURI( $('#encargados').val() )
		$.ajax({
			url:`/serofca/cambiarEncargadoClinica?rif=${rif}&next=${next}`,
			success: function(json) {
				if (!json.success) {
					alert(json.message)
				}
				location.reload()
			},
			error:function(err) {
				console.log(err)
				location.reload()
			}
		})
	})
}