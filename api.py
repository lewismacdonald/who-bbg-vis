import requests
import StringIO
import json

proxies={'https':'proxy.bloomberg.com:81'}
url = 'https://www.highcharts.com/samples/data/jsonp.php?filename=world-population-density.json'

resp = requests.get(url, proxies=proxies, verify=False)

with open('data.json','w') as f:
    f.write(resp.content)


print json.loads(resp.content)

"""
/api/v1/data - get list of source (id, name, description)
/api/v1/data/{id}/dates
/api/v1/data/{id}/dimensions - {x:xname, y:yname, z: zname...}


/api/v1/data/{id} - raw as json
/api/v1/data/{id}/map - fetch data [{'code':<iso-a2 code>,'value':<value>}] (latest ts if time series)
/api/v1/data/{id}/map/{ts} - for particular timestamp
/api/v1/data/{id}/map/ratio/{id2} - ratio between id and id2 per iso code, 
									(normalized to unit s.d. and 0 mean?)
/api/v1/data/{id}/scatter/{id2} - [{x, y, code, country}]
/api/v1/data/{id}/series/{code} = [{y: <value>, t: <time/date value>}]
"""

class DataSource():
	id = 'id123'
	name = 'something'
	description = 'something longer'
	is_timeseries = True
	def get(self):
		pass

	def 