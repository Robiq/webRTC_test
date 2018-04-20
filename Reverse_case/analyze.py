#Test 1 failed!
#succeeded
#Testset nr. 3 finished!
from testIP import *
import os, glob
import re

st=''

def file_nocon(fname):
	with open(fname) as f:
		for l in f:
#			print l
			s = r'^Test (\d) (\w+)!'
			res = re.match(s, l, re.M)
			if res:
				if res.group(1) != '0':
					if res.group(2) == 'succeeded':
						return False
		return True

def file_len(fname):
    with open(fname) as f:
    	i=-1
        for i, l in enumerate(f):
            pass
    return i + 1

def getres(nr):
	print '%d files removed for not supporting webRTC or being incomplete\n'%(nr)
	print 'Testcase 1:\n--------------'
	for x in range(1,6):
		print 'Tests done for test %d: %d'%(x, set1[x])
		print 'Success rate for test %d is %0.2f. Successful: %d'% (x, (float(r_set1[x])/float(set1[x])*100.00), r_set1[x])
		#print r_set1[x], set1[x]
	print '\nTestcase 2:\n--------------'
	for x in range(1,6):
		print 'Tests done for test %d: %d'%(x, set2[x])
		print 'Success rate for test %d is %0.2f. Successful: %d'% (x, (float(r_set2[x])/float(set2[x])*100.00), r_set2[x])
		#print r_set2[x], set2[x]
	print '\nTestcase 3:\n--------------'
	for x in range(1,6):
		print 'Tests done for test %d: %d'%(x, set3[x])
		print 'Success rate for test %d is %0.2f. Successful: %d'% (x, (float(r_set3[x])/float(set3[x])*100.00), r_set3[x])
		#print r_set3[x], set3[x]

def handlelines(curset, r_set, fi, line=None):
	global st
	s = r'^Test (\d) (\w+)!'
	while 1:
		#reads line if one isn't passed
		if line == None:
			line=fi.readline()
			#print line

		#adds to total output
		st+=line
		#matches regex
		res = re.match(s, line, re.M)
		#Add results
		if res:
			#print line
			#if test 0 disregard
			if res.group(1) != '0':
				#print 'Test %s Res %s'%(res.group(1), res.group(2))
				#add to total
				curset[int(res.group(1))] += 1
				#check for success
				if res.group(2) == 'succeeded':
					r_set[int(res.group(1))] += 1

				#print curset[int(res.group(1))]
				#next line
				line=None
			#If 0, just continue
			else:
				#next line
				line=None
		
		#No match to test
		else:
			#If new testset
			if line[0:7] == 'Testset':
				findSet(line, fi)
				break
			elif line == '':
				break
			#If random line, read next
			else:
				line=None


def findSet(line, fi):
	#print line
	if line == 'Testset nr. 3 finished!\n':
		handlelines(set1, r_set1, fi)
	elif line == 'Testset nr. 2 finished!\n':
		handlelines(set3, r_set3, fi)
	elif line == 'Testset nr. 1 finished!\n':
		handlelines(set2, r_set2, fi)
	#Unsure of which case!
	else:
		handlelines(set1, r_set1, fi, line)

if __name__ == '__main__':
	
	global set1, set2, set3, r_set1, r_set2, r_set3

	#Server
	set1={1:0, 2:0, 3:0, 4:0, 5:0}
	#Client
	set2={1:0, 2:0, 3:0, 4:0, 5:0}
	#Both
	set3={1:0, 2:0, 3:0, 4:0, 5:0}

	#Server results
	r_set1={1:0, 2:0, 3:0, 4:0, 5:0}
	#Client
	r_set2={1:0, 2:0, 3:0, 4:0, 5:0}
	#Both
	r_set3={ 1:0, 2:0, 3:0, 4:0, 5:0}

	cnt = 0
	name=''
	for filename in glob.glob('./Logs/*_res.txt'):
		#print filename
		if file_len(filename) >= 5 and file_nocon(filename) == False:
		#if file_nocon(filename) == False:
			name+=filename+'\n'
			fi = open(filename, 'r')
			line=fi.readline()
			st+=line
			#print line
			findSet(line, fi)
			st+="---------------------------------------\n"
			#print '------------------------------------------------'
			fi.close()
		else:
			cnt+=1

	fi = open("./Logs/fullLog.txt", 'w')
	fi.write(st)
	fi.close()

	fi2 = open("./Logs/files.txt", 'w')
	fi2.write(name)
	fi2.close()

	start()
	#print 'Results'
	#print 'Server'
	#print set1
	#print 'Client'
	#print set2
	#print 'Both'
	#print set3
	#print 'Res Server'
	#print r_set1
	#print 'Res Client'
	#print r_set2
	#print 'Res Both'
	#print r_set3
	getres(cnt)
