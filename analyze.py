#Test 1 failed!
#succeeded
#Testset nr. 3 finished!

import os, glob
import re

st=''

def handlelines(curset, r_set, fi, line=None):
	global st
	s = r'^Test (\d) (\w+)!$'
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
			#if test 0 disregard
			if res.group(1) != '0':
				#add to total
				curset[int(res.group(1))] += 1
				#check for success
				if res.group(2) == 'succeeded':
					r_set[int(res.group(1))] += 1

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
	print line
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

	for filename in glob.glob('*_res.txt'):
		print filename
		fi = open(filename, 'r')
		line=fi.readline()
		st+=line
		#print line
		findSet(line, fi)
		fi.close()

	fi = open("fullLog.txt", 'w')
	fi.write(st)
	fi.close()

	print ''
	print 'Results'
	print 'Server'
	print set1
	print 'Client'
	print set2
	print 'Both'
	print set3
	print 'Res Server'
	print r_set1
	print 'Res Client'
	print r_set2
	print 'Res Both'
	print r_set3