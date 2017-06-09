#!/usr/bin/python
# -*- coding: utf-8 -*-
#sources.py

import requests
import itertools

from collections import namedtuple
from io import BytesIO
from custom_parsers import BloodPressureParse, CellularParse
import json

# We need some inventory of sources
Source = namedtuple('Source','id, name, url, local, parsed, type, panel, parser')
sources=[
Source(1,'itu-mobile','http://www.itu.int/en/ITU-D/Statistics/Documents/statistics/2016/Mobile_cellular_2000-2015.xls','who-data/cellular-normalised.json','parsed-who-data/itu-mobile.json','json',True, CellularParse),
#Source(4,'itu-mobile','http://www.itu.int/en/ITU-D/Statistics/Documents/statistics/2016/Mobile_cellular_2000-2015.xls','who-data/Mobile_cellular_2000-2015_trimmed.xls','excel',True, CellularParse),
#Source(2,'itu-cellular-normalised','who-data/cellular_normalised','who-data/cellular_normalised.json','json',True, None),
Source(4, 'blood-pressure-male','http://apps.who.int/gho/athena/data/GHO/BP_06.json?profile=simple&filter=SEX:*;COUNTRY:*','who-data/bloodpressure.json','parsed-who-data/blood-pressure-male.json','json',True, BloodPressureParse),
Source(5, 'blood-pressure-female','http://apps.who.int/gho/athena/data/GHO/BP_06.json?profile=simple&filter=SEX:*;COUNTRY:*','who-data/bloodpressure.json','parsed-who-data/blood-pressure-female.json','json',True, BloodPressureParse),
Source(3, 'blood-pressure-both','http://apps.who.int/gho/athena/data/GHO/BP_06.json?profile=simple&filter=SEX:*;COUNTRY:*','who-data/bloodpressure.json','parsed-who-data/blood-pressure.json','json',True, BloodPressureParse)
]


class Loader():
	def __init__(self, source):
		self.source = source
		self.data = json.loads(open(source.parsed,'r').read())
		self.standard_attributes = ['date','code','name','value']
		self.additional_attributes = [k for k in self.data[0].keys() if k not in self.standard_attributes]
		self.default_attributes = [max([x[k] for x in self.data]) for k in self.additional_attributes]
		self.most_recent_date = max([x['date'] for x in self.data])
		self.date_range = list(set([x['date'] for x in self.data]))	

	def unique_values(self, attribute):
		return list(set([x.get(attribute) for x in self.data]))

	@property
	def list_sources(self):
		permute = [[self.source.name]]
		for attr in self.additional_attributes:
			permute.append(self.unique_values(attr))

		return ['_'.join(source_elem) for source_elem in itertools.product(*permute)]

	def get(self, **kwargs):
		if 'date' in kwargs:
			date = kwargs.pop('date')
		else:
			date = self.most_recent_date
		filter_dict = {k: v for k, v in zip(self.additional_attributes, self.default_attributes)}
		filter_dict.update(kwargs)
		condition = lambda elem: all([elem[k]==v for k, v in filter_dict.items()])
		return [elem for elem in self.data if elem['date']==date and condition(elem)]

	def time_series(self, code, **kwargs):
		filter_dict = {k: v for k, v in zip(self.additional_attributes, self.default_attributes)}
		filter_dict.update(kwargs)
		condition = lambda elem: all([elem[k]==v for k, v in filter_dict.items()])
		series = [elem for elem in self.data if elem['code']==code and condition(elem)]
		for elem in series:
			elem['y']=elem.pop('value')
		return series

def list_sources():
	return [{'id':source.id, 'name':source.name} for source in sources]

def get_source(id):
	try:
		source = next(s for s in sources if s.id==id)
	except:
		raise IOError("Id {} not found".format(id))
	else:

		if source.local is None:
			raise IOError("Id {} has no registered local".format(id))
		return source


if __name__=='__main__':
	for s in sources:
		parser = get_source(s.id)
		data = parser.get()		
		with open('parsed-who-data/'+s.name+'.json', 'wb') as out:
			out.write(json.dumps(data))

