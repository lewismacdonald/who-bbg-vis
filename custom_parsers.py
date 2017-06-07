import utils
import json

class BloodPressureParse():
    """ Source 3"""
    def __init__(self, raw):
        self.raw = raw
        self.data = None
        self.cmap = utils.Countries()
        self._preproc()

    def parse_str_flt(self, val):
        try:
            return float(val.split()[0])
        except: 
            return
    @property
    def value_name(self):
        return 'Blood Pressure, Normalised'

    def _preproc(self):
        self.raw = json.loads(open(self.raw,'r').read())
        distinct_ts = list(set([x['dims']['YEAR'] for x in self.raw['fact']]))
        output = dict()
        for ts in distinct_ts:
            partial = []
            for row in self.raw['fact']:
                if row['dims']['YEAR']==ts:
                    if self.parse_str_flt(row['Value']):
                        code = self.cmap.get_code(row['dims']['COUNTRY'])
                        if code:
                            partial.append(
                                {'value':self.parse_str_flt(row['Value']),
                                 'name':row['dims']['COUNTRY'],
                                 'code':code,
                                 'sex':row['dims']['SEX']
                                })
            output[int(ts)]=partial
        self.data=output
        return self
    
    def get(self):
        output = []
        for ts in self.data.keys():
            for c in self.data[ts]:
                c['date'] = ts
                output.append(c)
        return output

class CellularParse():
    """ Source 1 """
    def __init__(self, raw):
        self.raw = raw
        self.data = None
        self.cmap = utils.Countries()
        self._preproc()

    @property
    def value_name(self):
        return 'Mobile-cellular telephone subscriptions'

    def _preproc(self):
        self.data = json.loads(open(self.raw,'r').read())
        return self

    def get(self):
        for ts in self.data.keys():
            output = [
                {
                'code':self.cmap.get_code(c[0]), 
                'value':c[1],
                'name':c[0],
                'date':ts
                } 
                for c in self.data[ts].items()
                if c[1]
            ]
        return output
