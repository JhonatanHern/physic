'use strict'

const httpsAvailable = true
const cachingTime = 1000

const fs = require('fs'),
	https = require('https')

/*npm modules*/
const cookieSession = require("cookie-session"),
	body_parser     = require("body-parser"),
	compression     = require('compression'),
	express         = require("express")

/*personalized modules*/
const serofcaRouter = require('./modules/serofcaRouter'),//first-version router
	adminRouter     = require('./modules/admin-router'),
	prevent         = require('./modules/CSRFPrevent'),
	validId         = require('./modules/idValidator'),  
	physicistRouter = require('./modules/phy-router'),
	mysql           = require('./modules/connection'),
	SHA256          = require('./modules/SHA256')

const con = mysql.connection
/*configurating app issues*/
const app = express()

app.disable('x-powered-by')
//remove this header so the client does not know
//which tech is being used in the backend 
app.use(compression())
//compress data saving bandwidth
app.use(express.static('./public' , { maxAge : cachingTime } ))
app.use(body_parser.urlencoded({extended:true}))
app.set('view engine', 'pug')

app.use(cookieSession({
	name:"session",
	keys:[
		"FCLFNUNCJDHHDTG%RTYH/GHRFGT$#$bdv$$#/%#FGBJ#%%/$%/$ddybdeu",
		'VSE%#/#%[]¨*¨P¨*¨¨¨hYHRYRHERHEFG45%&(%=$&(/&)"!%/!&()/?=)[*'
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
	let logQuery = "SELECT * FROM usuarios WHERE email=" + email + " AND password='"+password+"'"
	con.query(logQuery,function(err,result){
		if ( err ) {
			console.log( err )
			res.status(500)
			res.render('error500')
			return
		}
		if ( result.length === 0 ){
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
	if( prevent( req , 'serofcapp.hopto.org' ) && req.session.physicist_id && Number(req.session.physicist_id) === req.session.physicist_id ){
		next( )
	}else{
		res.redirect( "/enterprise-login" )
	}
})
app.use('/physicist',physicistRouter)

app.use('/admin',(req,res,next) => {//validating session
	if( prevent( req , 'serofcapp.hopto.org' ) && req.session.admin_id && Number(req.session.admin_id) === req.session.admin_id ){
		next( )
	}else{
		res.redirect( "/enterprise-login" )
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
	console.log('http server working in port 80')
})

//https ahead
if (httpsAvailable) {
	let key = fs.readFileSync('certs/key.key','utf8'),
		crt = fs.readFileSync('certs/crt.crt','utf8'),
		credentials = {
			key : key,
			cert : crt
		}

	let httpsServer = https.createServer(credentials,app)

	httpsServer.listen( 443 , ( ) => {
		console.log('https server working in port 443')
	})
}