const url = require('url')

let reportAttack = (request,url)=>{
	console.log('possible attack detected from:')
	console.log(request.connection.remoteAddress)
	if (request.headers['x-forwarded-for']) {
		console.log('x-forwarded-for:')
		console.log(req.headers['x-forwarded-for'])
	}
	console.log('source of malicious link:')
	console.log(url)
	console.log('\n')
}

let isGoodRequest = (hostname,domainName) => {
	return hostname === domainName ||
		hostname === '127.0.0.1' || 
		hostname === '192.168.0.107' || 
		hostname === 'localhost'
}

module.exports = (request,domainName) => {
	if (request.headers.referer) {
		const parsedURL = url.parse(request.headers.referer)
		let goodRequest = isGoodRequest( parsedURL.hostname , domainName )
		if (!goodRequest) {
			reportAttack(request,request.headers.referer)
		}
		return goodRequest
	}
	if (request.headers.origin) {
		const parsedURL = url.parse(request.headers.origin)
		let goodRequest = isGoodRequest( parsedURL.hostname , domainName )
		if (!goodRequest) {
			reportAttack(request,request.headers.origin)
		}
		return goodRequest
	}
	return true
}