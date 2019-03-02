// http://127.0.0.1:43110/presto.greeter.bit/

l = []

l.push('<style> p { min-height: 4em } </style>')
l.push('<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">')


$$('.site-link').forEach(e => {

	var a = document.createElement('a')


	var tl = []
	var t

	t = e.innerText.replace(/\n/g, '\t').trim()
	if (t) tl.push(t)

	t = e.title.replace(/\n/g, '\t').trim()
	if (t) tl.push(t)

	t = e.getAttribute('href')
	if (t) tl.push(t)


	a.innerText = tl.join('\n')
	a.href = e.getAttribute('href')

	l.push('<p>' + a.outerHTML + '</p>')
})


copy(l.join('\n'))
