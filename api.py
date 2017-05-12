import requests
import StringIO
import json

proxies={'https':'proxy.bloomberg.com:81'}
url = 'https://www.highcharts.com/samples/data/jsonp.php?filename=world-population-density.json'

resp = requests.get(url, proxies=proxies, verify=False)

with open('data.json','w') as f:
    f.write(resp.content)


print json.loads(resp.content)