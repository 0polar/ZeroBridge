## Dependencies

https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md

```bash
apt install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

```bash
adduser zero
adduser chrome
```

## `/etc/systemd/system/zeronet.service` (systemd)

Optional: `--multiuser_no_new_sites`

```ini
[Unit]
Description=ZeroNet

[Service]
User=zero
ExecStart=/usr/bin/python /home/zero/zeronet.py
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable zeronet
systemctl start zeronet
```

## `/etc/systemd/system/prerender.service` (systemd)

```ini
[Unit]
Description=ZeroBridge prerender

[Service]
User=chrome
ExecStart=/usr/bin/node /home/chrome/prerender.js
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable prerender
systemctl start prerender
```

## Sandbox for Chrome, Port Redirect, Restart

```bash
sysctl -w kernel.unprivileged_userns_clone=1
ip6tables -A PREROUTING -t nat -i eth0 -p tcp --dport 443 -j REDIRECT --to-port 8443
systemctl stop prerender --no-block
pkill node
pkill chrome
systemctl restart prerender
```

## Virtual Memory

_Chrome is really a memory hog_
https://www.techbrown.com/create-linux-swap-drive-swap-file

## Cloudflare Rules

*   SSL: Full strict
*   Security Level: Low
*   Browser Cache Expiration: 20 hours
*   Email Address Obfuscation: Off

### Firewall Rules

1.  `(http.request.uri.path eq "/Stats")`
    Block

### Page Rules

1.  `43110.cf/raw/*`
    Browser Cache TTL: 2 days, Cache Level: Cache Everything, Edge Cache TTL: 5 days
2.  `43110.cf/raw/1Ake2MmwxDgst5M8WqoyNLjDQj2pcPj5zL/*`
    Browser Cache TTL: 30 minutes, Cache Level: Cache Everything, Edge Cache TTL: a month

## Home

```html
<link rel="preload" href="/Me.ZeroNetwork.bit/css/all.css?v=1542807170" as="style">
...
<b><a href="/raw/1Ake2MmwxDgst5M8WqoyNLjDQj2pcPj5zL/sitemap.html">Site Map</a></b>,
<b><a href="/Me.ZeroNetwork.bit/">Feed Map</a></b>
...
Hosted on Cloudflare and Vultr.
```
