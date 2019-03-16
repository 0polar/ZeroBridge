## `home.html`

```html
<link rel="preload" href="/Me.ZeroNetwork.bit/css/all.css?v=1542807170" as="style">
...
<b><a href="/raw/1Ake2MmwxDgst5M8WqoyNLjDQj2pcPj5zL/sitemap.html">Site Map</a></b>,
<b><a href="/Me.ZeroNetwork.bit/">Feed Map</a></b>
...
Hosted on Cloudflare and Vultr.
```

## Remove dead sites (long time "connecting")

https://github.com/zcyzcy88/SelfColle/issues/57

```js
Page.site_list.sites.forEach(e => {
	if (!e.row.content.title) {
		Page.cmd('siteDelete', { 'address': e.row.address })
	}
})
```

## Generate `sitemap.html`

http://127.0.0.1:43110/presto.greeter.bit/

```js
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
```

## `UiRequest.py`

```python
import gc
...
elif path == "/GC":
    self.sendHeader()
    return str(gc.collect())
```
