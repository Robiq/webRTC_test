import os, glob
import re
import requests
import json

ips=''
ls = {}

def start():
	names = getNames()
	for filename in glob.glob('./Logs/*_log.txt'):
		#print filename
		if filename.replace('_log.txt', '') in names:
			find_ip(filename);

	#print ips

	f = {}
	for k in ls.keys():
		for ip in ls[k]:
			if ip != '127.0.0.1' and ip != '0.0.0.0' and ip != '203.178.143.47':
				if f.get(ip) and ip not in f[ip]:
					f[ip].append(k)
				else:
					f[ip]=[k]

	file = open("./Logs/ipLog.txt", 'w')
	st=''
	for k in f.keys():
		fff = ''
		for fi in f[k]:
			#print fi
			fff+=fi+'\n'
		#print 'IP: %s File(s):\n%s'%(k, fff)
		st+='IP: %s File(s):\n%s\n'%(k, fff)
		url = "http://ipinfo.io/"+k
		data = requests.get(url)
		data=data.json()
		#data = json.loads(data)
		#print(data)
		st+="Info:\n---------------------------\n"
		for key, value in data.items():
			st+=key + ": " + value+'\n'
		st+='****************************************************\n'
		#print (data.json())
		#print(data.text)
	file.write(st)
	file.close()


def getNames():
	name = open('./Logs/files.txt', 'r')
	content = name.read().splitlines()
	content = [x.replace('_res.txt', '') for x in content]
	#print content
	return content

def find_ip(fname):
	global ips
	with open(fname) as f:
		res2 = []
		for l in f:
			#print l
			#s=r'IP\s*\d\s(\d{0,4}\.\d{0,4}\.\d{0,4}.\d{0,4})'
			t=r'\"type\":\"offer\"'
			s=r'c=IN\sIP\d\s(\d{0,4}\.\d{0,4}\.\d{0,4}.\d{0,4})'
			res = re.findall(s, l, re.I)
			test = re.search(t, l, re.I)
			if res:
				if test:
					res2 += res
		res2 = list(set(res2))
		ls[fname]=res2
		for i in res2:	
			if i != '127.0.0.1' and i != '0.0.0.0' and i != '203.178.143.47':
				ips+=fname+': IP: '+i+'\n'
		ips+='\n'

if __name__ == '__main__':
	start()
