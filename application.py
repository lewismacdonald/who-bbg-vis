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
/api/v1/data/{id}/series/{code} = [{y: <value>, t: <time/date value>}]
"""
from flask import Flask, render_template, jsonify
import json
from sources import get_source
import utils
application = Flask(__name__)

@application.route('/')
def highmaps_vis():
    """ Render a template with highmaps """
    return render_template("index.html")


@application.route('/api/v1/data/<int:dataid>/map')
def get_map_data(dataid):
    source = get_source(dataid)
    fact={'ylabel':source.value_name,'title':source.value_name, 'source':'WHO'}
    return json.dumps({'data':source.get(),'fact':fact})

@application.route('/api/v1/data/<int:primaryid>/scatter/<int:secondaryid>')
def get_scatter_data(primaryid, secondaryid):
    primary = get_source(primaryid)
    secondary = get_source(secondaryid)
    # join on the code
    output = utils.join(primary.get(), secondary.get(), key='code', fields=['name'])
    fact = {'xlabel':primary.value_name, 
            'ylabel': secondary.value_name,
            'title':'{} v.s. {}'.format(primary.value_name, secondary.value_name)
            }
    return json.dumps({'data':output,'fact':fact})

# run the app.
if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    application.debug = True
    application.run()