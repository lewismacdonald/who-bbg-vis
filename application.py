"""
    This simple flask application serves as a
    demonstration of geo mapping with a flask 
    app using HighCharts.js and bokeh (python)

    Author: Lewis Macdonald
    Date: 14-04-2017

"""

"""

API OUTLINE
-----------

/api/v1/data - get list of source (id, name, description)
/api/v1/data/{id}/dates
/api/v1/data/{id}/dimensions - {x:xname, y:yname, z: zname...}


/api/v1/data/{id} - raw as json
/api/v1/data/{id}/map - fetch data [{'code':<iso-a2 code>,'value':<value>}] (latest ts if time series)
/api/v1/data/{id}/map/{ts} - for particular timestamp
/api/v1/data/{id}/map/ratio/{id2} - ratio between id and id2 per iso code, 
                                    (normalized to unit s.d. and 0 mean?)
/api/v1/data/{id}/scatter/{id2} - [{x, y, code, country}]
/api/v1/data/{id}/ts/{code} = [{y: <value>, t: <time/date value>}]
"""
from flask import Flask, render_template, jsonify
from flask_cors import CORS
import json
from sources import get_source, Loader, list_sources
import utils
application = Flask(__name__)
CORS(application)

@application.route('/')
def highmaps_vis():
    """ Render a template with highmaps """
    return render_template("index.html")


@application.route('/api/v1/data/<int:dataid>/map')
def get_map_data(dataid):
    source = get_source(dataid)
    f = Loader(source)
    fact={'ylabel':source.name,'title':source.name, 'source':'WHO', 'date': f.most_recent_date}
    return json.dumps({'data':f.get(),'fact':fact})

@application.route('/api/v1/data/<int:primaryid>/scatter/<int:secondaryid>')
def get_scatter_data(primaryid, secondaryid):
    primary_source = get_source(primaryid)
    primary = Loader(primary_source)
    secondary_source = get_source(secondaryid)
    secondary = Loader(secondary_source)
    # join on the code
    output = utils.join(primary.get(), secondary.get(), key='code', fields=['name'])
    fact = {'xlabel':primary_source.name, 
            'ylabel': secondary_source.name,
            'title':'{} v.s. {}'.format(primary_source.name, secondary_source.name),
            'date':primary.most_recent_date
            }
    return json.dumps({'data':output,'fact':fact})

@application.route('/api/v1/data/<int:dataid>/ts/<code>')
def get_time_series(dataid, code):
    source = get_source(dataid)
    f = Loader(source)
    fact={'ylabel':source.name,'title':source.name, 'source':'WHO','start':min(f.unique_values('date'))}
    ts = f.time_series(code=code)
    resp = jsonify({'data':ts,'fact':fact})
    return resp

@application.route('/api/v1/data')
def get_source_list():
    return json.dumps(list_sources())
# run the app.
if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    application.debug = True
    application.run()