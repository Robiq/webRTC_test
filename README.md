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
<<<<<<< HEAD

203.178.143.47

LEARN HEROKU!
https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction

##### Basic
sudo systemctl start webrtc_test
sudo systemctl stop webrtc_test
sudo systemctl restart webrtc_test

##### Startup
sudo systemctl enable webrtc_test
sudo systemctl disable webrtc_test


Find process
lsof -i :8443

show PID info
ps -p PID -o command=

sudo /var/log/syslog
systemctl daemon-reload


Normal log and current boot log
journalctl -u service-name.service
journalctl -u service-name.service -b


####IP

Server addresses:
4:
203.178.143.47
6:
2001:200:0:8801:203:178:143:47/64

Changes to:
/etc/network/interfaces

/etc/dhcp/dhclient.conf

/etc/resolvconf/resolv.conf.d/head
/etc/resolv.conf

sudo resolvconf -u

sudo reboot

https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04

https://www.nginx.com/blog/free-certificates-lets-encrypt-and-nginx/


sudo ln -s /etc/nginx/sites-available/NAME /etc/nginx/sites-enabled/NAME

To remove page:
sudo pm2 unstartup systemd
=======
####Activate nginx site
sudo ln -s /etc/nginx/sites-available/NAME /etc/nginx/sites-enabled/NAME


sudo cat /var/log/nginx/error.log

/etc/sites-available/ip is this server
sudo ufw allow 8443


/var/log/node/server.log = webrtc log!

sudo systemctl daemon-reload

/etc/systemd/system/webrtc_test.service


[Unit]
Description=Node.js Webrtc_Test
After=network.target

[Service]
Type=simple
User=robin
Group=www-data
ExecStart=/bin/bash -c 'exec /usr/local/bin/node /home/robin/webRTC_test/server.js 2>&1 >> /home/robin/webRTC_test/Logs/syslog/server.log'
#ExecStart=/home/robin/webRTC_test/start.sh
Environment=NODE_ENV=production PORT=8443


# Required on some systems
#WorkingDirectory=/opt/nodeserver

Restart=always
# Restart service after 10 seconds if node service crashes
RestartSec=10

# Output to syslog
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=webrtc_test

[Install]
WantedBy=multi-user.target


User&PW
webrtc

Create script to run nodejs server?
https://gist.github.com/jobsamuel/6d6095d52228461f3c53
Use passenger?
https://www.phusionpassenger.com/library/walkthroughs/deploy/nodejs/ownserver/nginx/oss/trusty/install_passenger.html
Heroku?
https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction
