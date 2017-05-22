#!/usr/bin/python
# -*- coding: utf-8 -*-
#sources.py

import requests
from collections import namedtuple
from io import BytesIO
from custom_parsers import BloodPressureParse, CellularParse

# We need some inventory of sources
Source = namedtuple('Source','id, name, url, local, type, panel, parser')
sources=[
Source(1,'itu-mobile','http://www.itu.int/en/ITU-D/Statistics/Documents/statistics/2016/Mobile_cellular_2000-2015.xls','who-data/cellular-normalised.json','json',True, CellularParse),
Source(4,'itu-mobile','http://www.itu.int/en/ITU-D/Statistics/Documents/statistics/2016/Mobile_cellular_2000-2015.xls','who-data/Mobile_cellular_2000-2015_trimmed.xls','excel',True, CellularParse),
Source(2,'itu-cellular-normalised','who-data/cellular_normalised','who-data/cellular_normalised.json','json',True, None),
Source(3, 'blood-pressure','http://apps.who.int/gho/athena/data/GHO/BP_06.json?profile=simple&filter=SEX:*;COUNTRY:*','who-data/bloodpressure.json','json',True, BloodPressureParse)
]

def get_source(id):
	try:
		source = next(s for s in sources if s.id==id)
	except:
		raise IOError("Id {} not found".format(id))
	else:
		if source.parser is None:
			raise IOError("Id {} has no registered parser".format(id))
		return source.parser(source.local)


if __name__=='__main__':
	print get_data(sources[0])


