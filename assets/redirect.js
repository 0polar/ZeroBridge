var href = location.href
var pathname = location.pathname

if (pathname[pathname.length - 1] === '/')
	href = href.replace(pathname, pathname + 'index.html')
else
	href = href.replace(pathname, pathname + '/index.html')

location.replace(href)
