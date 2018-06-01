 'use strict'

/*npm modules*/
let express       = require("express"),
	body_parser   = require("body-parser"),
	cookieSession = require("cookie-session")

/*personalized modules*/
let serofcaRouter = require('./modules/serofcaRouter'),//first-version router
	validId      = require('./modules/idValidator'),  
	SHA256      = require('./modules/SHA256'),
	mysql      = require('./modules/connection'),
	physicistRouter = require('./modules/phy-router'),
	adminRouter = require('./modules/admin-router')

let con = mysql.connection
/*configurating app issues*/
let app = express()
app.use(express.static('./public'))
app.use(body_parser.urlencoded({extended:true}))
app.set('view engine', 'pug')

app.use(cookieSession({
	name:"session",
	keys:[
		"fjgvadshkfgasdjkfjoasdghwevbdaehbndfaweghfuiwehdfuihedfuuetywt35687epgh'sjt",
		'VSERUOHFAJKXDOASDUYHUIOWE4JHR79WE6DY34R6T2UHRB4RT5E4RT547RT346FDQD5RITB2368DTHGBGIJUY78EYHUODNSUDGH78'
	]
}))

/*principal routing*/
app.get("/",(req,res)=>{
	res.render('index')
})

app.get('/enterprise-login',(req,res) => {
	res.render('login-2')
})

app.post('/enterprise-login',(req,res) => {
	let email,password
	if (req.body.password) {
		password = SHA256(req.body.password)
	}else{
		console.log('missing password')
		res.render('badLogin')
		return
	}
	if (req.body.email) {
		email = mysql.escape(req.body.email)
	}else{
		console.log('missing email')
		res.render('badLogin')
		return
	}
	let logQuery = `SELECT * FROM usuarios WHERE email = ${email} AND password = '${password}'`
	con.query(logQuery,function(err,result){
		if (err) {
			console.log( err )
			res.status(500)
			res.render('error500')
			return
		}
		if (result.length === 0){
			res.render('login-2',{failedAttempt:true})
		}else{
			let user = result[0]
			if (user.userClass === 'A') {//user is administrator
				req.session.admin_id = user.id
				res.redirect('/admin')
			}else{//user is physicist
				req.session.physicist_id = user.id
				res.redirect('/physicist')
			}
		}
	})
})

app.get("/serofcaLogin",(req,res) => {
	if (!req.session.id) {
		res.render('login',{target:"/serofcaLogin"})
		return
	}
	res.redirect("/serofca")
})

app.post("/serofcaLogin",(req,res) => {
	let email,password
	if (req.body.password) {
		password = SHA256(req.body.password)
	}else{
		console.log('missing password')
		res.render('badLogin')
		return
	}
	if (req.body.email) {
		email = mysql.escape(req.body.email)
	}else{
		console.log('missing email')
		res.render('badLogin')
		return
	}
	let logQuery = "SELECT * FROM usuarios WHERE email="+email+" AND password='"+password+"'"
	con.query(logQuery,function(err,result){
		if (err) {
			console.log( err )
			res.status(500)
			res.render('error500')
			return
		}
		if (result.length===0){
			res.render('badLogin')
		}else{
			req.session.id = result[0].id
			res.redirect('/serofca')
		}
	})
})

app.get("/logout",(req,res) => {
	req.session = null/*delete the session*/
	res.render('goodbye')
})




/* 
 * ROUTING: this section enables routing
 * for the users and filters non-authorized users
 */
app.use('/serofca',(req,res,next) => {//validating session
	if( req.session.id && validId( req.session.id ) ){
		next( )
	}else{
		res.redirect( "/" )
	}
})
app.use('/serofca',serofcaRouter)

app.use('/physicist',(req,res,next) => {//validating session
	if( req.session.physicist_id && Number(req.session.physicist_id) === req.session.physicist_id ){
		next( )
	}else{
		res.redirect( "/" )
	}
})
app.use('/physicist',physicistRouter)

app.use('/admin',(req,res,next) => {//validating session
	if( req.session.admin_id && Number(req.session.admin_id) === req.session.admin_id ){
		next( )
	}else{
		res.redirect( "/" )
	}
})
app.use('/admin',adminRouter)


/*
 * Errors:
 * This part shows different error messages
 * for 404 error (not found)
 * and 500 error (internal server error)
*/
app.use((req,res) => {//handle 404 errors
	res.status(404)
	res.render('error404')
})

app.use((error, req, res, next) => {//handle 500 errors
	console.log(error)
	res.status(500)
	res.render('error500')
})

app.listen(80,() => {
	console.log('server listening in port 80')
})