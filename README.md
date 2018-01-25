# Test-framework for connection-offers

## Plan:

### Tests:

1. Timeout is server-side (after offer created)
2. Timeout is client-side (after answer created)
3. Timeout is both client- & server-side (after offer created & answer created)

#### Timeouts:
1. 0.5 sec
2. 1.0 sec
3. 2.0 sec
4. 5.0 sec
5. 10.0 sec

### Setup:

#####	CLIENT:
1. Have client connect and update html
2. Have client start tests. UPDATE html
3. Have client notify when a tests completes.
4. Client sends log to server.
5. Client updates HTML says test is over

	Use updateHTML() to make each test visible. Update 'test' variable every time a new test is ran.
	If interrupt: send current client-log to server and close!

#####	SERVER:
1. Send html and js to client
2. Receive initial connection over websocket
3. Send offer over websocker
4. Confirm connection.
5. Notify client of confirmed connection over websocket
6. Repeat [3.]-[5.] 4 times (5 times total), with different time-outs!
7. Receive Client log over websocket
8. Write Serverlog & Clientlog to file.


#### Generate key and certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365


require('scribe-js')(); //loads Scribe

var console = process.console;

https://github.com/js-platform/node-webrtc

https://github.com/shanet/WebRTC-Example

Server addresses:
4:
203.178.143.47
6:
2001:200:0:8801:203:178:143:47/64

DOES NOT TERMINATE AT RIGHT TIME! FIXXX
NEED TO ADD SHORT DELAY! FIXXgit statu

Changes to:
/etc/network/interfaces

/etc/dhcp/dhclient.conf

/etc/resolvconf/resolv.conf.d/head
/etc/resolv.conf

sudo resolvconf -u

sudo reboot

https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04

To remove page:
sudo pm2 unstartup systemd


CONFIGURE SSL FOR NGINX & NODEJS
Then fix for python!