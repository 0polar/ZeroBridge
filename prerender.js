/* eslint semi: ['error', 'never'] */
'use strict';

const FLAG_HEADLESS = true
const FLAG_PUBLIC = true
const FLAG_BANNER = true

const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const util = require('util')
const puppeteer = require(FLAG_HEADLESS ? 'puppeteer' : 'puppeteer-core')

function main(request, response) {
	if (request.url === '/') {
		response.writeHead(200, {
			'Content-Type': 'text/html; charset=utf-8'
		})
		const filePath = path.resolve(__dirname, 'assets/home.html')
		fs.createReadStream(filePath).pipe(response)
		return
	}
	if (request.url === '/robots.txt') {
		response.writeHead(200, {
			'Content-Type': 'text/plain'
		})
		const filePath = path.resolve(__dirname, 'assets/robots.txt')
		fs.createReadStream(filePath).pipe(response)
		return
	}
	if (request.url.startsWith('/uimedia/all.js')) {
		response.writeHead(200, {
			'Content-Type': 'application/javascript'
		})
		const filePath = path.resolve(__dirname, 'assets/redirect.js')
		fs.createReadStream(filePath).pipe(response)
		return
	}
	if (request.url.startsWith('/raw')) {
		proxy(request, response)
		return
	}

	var pathname = request.url.replace(/\?.*/, '')
	var cleanPathname = pathname.replace(/\/$/, '')

	var isRoot = cleanPathname.match(/\//g).length === 1
	var isEndWithSlash = pathname.endsWith('/')
	var isAddress = cleanPathname.startsWith('/1')
	var isBitcoin = cleanPathname.endsWith('.bit')

	if (isRoot && !isEndWithSlash && (isAddress || isBitcoin)) {
		response.writeHead(301, {
			'Location': request.url.replace(pathname, pathname + '/')
		})
		response.end()
		return
	}
	if (isRoot && isEndWithSlash && (isAddress || isBitcoin)) {
		queueAdd(request, response)
		return
	}

	var ext = path.parse(cleanPathname).ext.toLowerCase()
	var isHTML = ['.xht', '.xhtml', '.htm', '.html'].includes(ext)
	var isCommonStatic = ['.css', '.js', '.json', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico'].includes(ext)

	if (isHTML) {
		queueAdd(request, response, botTest(request.headers['User-Agent']))
		return
	} else if (FLAG_PUBLIC && !isEndWithSlash && !isCommonStatic) {
		// optimize for caching rule
		response.writeHead(301, {
			'Location': '/raw' + pathname
		})
		response.end()
		return
	} else {
		proxy(request, response)
		return
	}
}

function proxy(clientRequest, clientResponse) {
	var options = {
		hostname: '127.0.0.1',
		port: 43110,
		path: clientRequest.url,
		method: clientRequest.method,
		headers: Object.assign(clientRequest.headers, { host: '127.0.0.1:43110' })
	}
	var initiation = http.request(options, response => {
		clientResponse.writeHead(response.statusCode, response.headers)
		response.pipe(clientResponse)
	})
	clientRequest.pipe(initiation)
}

/* Reference: https://developers.google.com/web/tools/puppeteer/articles/ssr */
let browser
(async function () {
	browser = await puppeteer.launch({
		headless: FLAG_HEADLESS,
		defaultViewport: null,
		executablePath: FLAG_HEADLESS ? undefined : 'C:/Program Files (x86)/Google/Chrome Beta/Application/chrome.exe'
	})
})()

async function prerender(request, response) {
	console.log('Prerender:', request.url)
	try {
		var page = await browser.newPage()
		await page.setViewport({
			width: 1280,
			height: 1000,
			deviceScaleFactor: 1
		})
		await page.setRequestInterception(true)
		page.on('request', blockRequest)

		await page.goto('http://127.0.0.1:43110' + request.url, { waitUntil: 'domcontentloaded', timeout: 20000 })
		await page.waitFor(200)
		var frame = await page.waitFor('#inner-iframe', { timeout: 1000 })
		frame = await frame.contentFrame()

		var isBot = botTest(request.headers['User-Agent'])
		frame.evaluate(function () {
			if (typeof jQuery !== 'undefined') {
				jQuery.fx.off = true
			}
			let style = document.createElement('style')
			style.innerHTML = '*, body * { transition: 0s 0s !important; }'
			document.head.appendChild(style)

			let clicker = setInterval(() => {
				// ZeroTalk, ZeroSites, Millchan, Nullchan
				let buttons = document.querySelectorAll('[href="#More"], #SiteLists .more, .posts_wrapper .toggle-replies, .skip-gap .expand-button')
				Array.from(buttons).forEach(element => element.click())
			}, 300)
			let scroller = setInterval(() => {
				window.scrollBy(50, 800)
			}, 100)
			setTimeout(() => {
				clearInterval(clicker)
				clearInterval(scroller)
				style.remove()
			}, isBot ? 3000 : 1600)
		})
		await page.waitFor(isBot ? 4000 : 1800)

		frame = await page.waitFor('#inner-iframe', { timeout: 5000 })
		frame = await frame.contentFrame()

		var pageTitle = await page.title()
		var frameTitle = await frame.title()
		var fullTitle = titleProcess(pageTitle, frameTitle)
		var iconLink = await page.evaluate(function () {
			let element = document.querySelector('link[rel="icon"]')
			return element ? element.outerHTML : ''
		})
		var viewPort = await page.evaluate(function () {
			let element = document.querySelector('meta[name="viewport"]')
			return element ? element.outerHTML : ''
		})
		if (FLAG_BANNER) {
			const filePath = path.resolve(__dirname, 'assets/banner.html')
			var reader = util.promisify(fs.readFile)
			var banner = await reader(filePath, 'utf8')
		}

		var frameHTML = await frame.evaluate(function (fullTitle, iconLink, viewPort, FLAG_BANNER, banner) {
			let scripts = document.querySelectorAll('script, object, embed, meta[charset], meta[http-equiv]')
			Array.from(scripts).forEach(element => element.remove())

			let h1 = document.querySelector('h1')
			let h2 = document.querySelector('h2')
			if (h1 && h2 && h1.innerText === 'SITE BLOCKED' && h2.innerText === 'THIS SITE IS ON YOUR BLOCKLIST:') {
				return 403
			}
			if (h1 && h2 && h1.innerText === 'Not Found' && h2 === document.body.lastElementChild) {
				return 404
			}
			document.title = fullTitle
			if (FLAG_BANNER) document.body.innerHTML += banner
			document.head.innerHTML = iconLink + viewPort + document.head.innerHTML

			let content = document.documentElement.outerHTML
				.split('href="http://127.0.0.1:43110').join('href="')
				.split('href="http://localhost:43110').join('href="')
				.split('src="http://127.0.0.1:43110').join('src="')
				.split('src="http://localhost:43110').join('src="')
			document.documentElement.innerHTML = ''
			return content
		}, fullTitle, iconLink, viewPort, FLAG_BANNER, banner)

		page.close()
		running--
		queueRemove(request, response)
		if (frameHTML === 403) {
			response.writeHead(403)
			response.end('403 Forbidden: too big to load')
		} else if (frameHTML === 404) {
			response.writeHead(404)
			response.end('404 Not Found')
		} else {
			response.writeHead(200, {
				'Content-Type': 'text/html; charset=utf-8',
				'X-Frame-Options': 'deny',
				'Content-Security-Policy': `script-src 'none'; object-src 'none'`
			})
			response.end(frameHTML)
		}
	} catch (error) {
		if (FLAG_HEADLESS) page.close()
		running--
		queueRemove(request, response)
		response.writeHead(500)
		response.end('Prerender Error:\n' + error)
	}
}

function titleProcess(pageTitle, frameTitle) {
	var fullTitle = []

	pageTitle = pageTitle
		.trim()
		.replace(/\s*- ZeroNet$/, '')
	if (pageTitle) {
		fullTitle.push(pageTitle)
	}

	frameTitle = frameTitle
		.trim()
		.replace(/\s*- ZeroNet$/, '')
		.replace(/^ZeroBlog Demo$/, '')
		.replace(/^ZeroTalk$/, '')
		.replace(/^ZeroMe!$/, '')
	if (frameTitle && frameTitle !== pageTitle) {
		fullTitle.push(frameTitle)
	}

	fullTitle.push('ZeroBridge, ZeroNet Proxy')
	return fullTitle.join(' // ').trim()
}

function blockRequest(request) {
	var url = request.url()
	if (url.startsWith('data:')) {
		url = url.substring(0, 60) + '...'
	}

	var isLocal1 = url.startsWith('http://localhost:43110/')
	var isLocal2 = url.startsWith('http://127.0.0.1:43110/')
	var isLocal = isLocal1 || isLocal2
	var isLarge = ['stylesheet', 'image', 'media', 'font'].includes(request.resourceType())

	if (isLocal === false || isLarge) {
		request.abort()
		// console.log('Block:', url)
	} else {
		request.continue()
		// console.log('Allow:', url)
	}
}

function botTest(userAgent) {
	if (!userAgent) return false
	userAgent = userAgent.toLowerCase()
	return userAgent.includes('google') || userAgent.includes('yandex') || userAgent.includes('bing') || userAgent.includes('wget') || userAgent.includes('curl')
}

var queue = []
var IPs = {}
var running = 0

function queueAdd(request, response, isBot) {
	var IP = getIP(request, response)
	if (mapGet(IP)) {
		queue.unshift(request)
		queue.unshift(response)
		mapPlus(IP)
		request.on('close', () => {
			queueRemove(request, response)
		})
		queueRun()
	} else {
		mapPlus(IP)
		var pending = setTimeout(() => {
			queue.unshift(request)
			queue.unshift(response)
			queueRun()
		}, IPs[IP] * (isBot ? 5000 : 3000))
		request.on('close', () => {
			clearTimeout(pending)
			queueRemove(request, response)
		})
	}
	console.log(queue.length + '\t' + Object.keys(IPs).length + '\t' + running)
}
function queueRemove(request, response) {
	var IP = getIP(request, response)
	queue.remove(request)
	queue.remove(response)
	setTimeout(() => {
		mapMinus(IP)
		console.log(queue.length + '\t' + Object.keys(IPs).length + '\t' + running)
	}, 1000)
	queueRun()
}
function queueRun() {
	if (running < 2 && queue.length > 0) {
		prerender(queue[1], queue[0])
		running++
	}
	console.log(queue.length + '\t' + Object.keys(IPs).length + '\t' + running)
}

function mapPlus(IP) {
	IPs[IP] = IPs[IP] || 0
	IPs[IP]++
}
function mapMinus(IP) {
	IPs[IP] = IPs[IP] || 0
	IPs[IP]--
	if (IPs[IP] <= 0) {
		delete IPs[IP]
	}
}
function mapGet(IP) {
	return IPs[IP] || 0
}
function getIP(request, response) {
	return FLAG_PUBLIC ? request.headers['CF-Connecting-IP'] : request.connection.remoteAddress
}
Array.prototype.remove = function (item) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] === item) {
			this.splice(i, 1)
			break
		}
	}
}

function server(request, response) {
	try {
		main(request, response)
	} catch (error) {
		response.writeHead(500)
		response.end('Error:\n' + error)
	}
}
if (FLAG_PUBLIC) {
	const options = {
		key: fs.readFileSync(path.resolve(__dirname, 'key.pem')),
		cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem')),
		ca: fs.readFileSync(path.resolve(__dirname, 'origin-pull-ca.pem')),
		requestCert: true,
		rejectUnauthorized: true
	}
	https.createServer(options, server).listen(8443)
} else {
	http.createServer(server).listen(8080)
}
