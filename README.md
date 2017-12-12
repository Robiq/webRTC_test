# Test-framework for connection-offers

### Plan:

#####	CLIENT:
1. Have client connect and update html
2. Have client start tests. UPDATE html
3. Have client notify of completed tests.
4. Client sends log to server.
5. Client updates HTML says test is over

	Use updateHTML() to make each test visible. Update 'test' variable every time a new test is ran.

#####	SERVER:
1. Send html and js to client
2. Receive initial connection over websocket
3. Send offer over websocker
4. Confirm connection.
5. Notify client of confirmed connection over websocket
6. Repeat [3.]-[5.] 4 times (5 times total), with different time-outs!
7. Receive Client log over websocket
8. Write Serverlog & Clientlog to file.
