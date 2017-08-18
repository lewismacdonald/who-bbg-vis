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

from flask import Flask, render_template, jsonify, request
import json, os
import re
import logging
import sys
from sources import S3Loader, list_s3_sources, get_s3_source, add_s3_source
import utils


application = Flask(__name__)

application.config['UPLOAD_FOLDER'] = 'parsed-who-data' 

logging.basicConfig(stream = sys.stdout, level=logging.INFO)

@application.route('/', methods=['GET', 'POST'])
def highmaps_vis():
    """ Render a template with highmaps """
    return render_template("index.html", title='WHO-BBG Data Visualisation')


@application.route('/sources',methods=['GET'])
def source_screen():
    return render_template('sources.html',  title='WHO-BBG Data Visualisation')


@application.route('/api/v1/data/<source_name>/map')
def get_map_data(source_name):
    source = get_s3_source(source_name)
    f = S3Loader(source)
    fact = {
        'ylabel':source.title,
        'title':source.title, 
        'source':source.source_name,
        'credit_url':source.source_url,
        'date': f.most_recent_date
        }
    return json.dumps({'data': f.get(), 'fact': fact})


@application.route('/api/v1/data/<primary_source_name>/scatter/<secondary_source_name>')
def get_scatter_data(primary_source_name, secondary_source_name):
    primary_source = get_s3_source(primary_source_name)
    primary = S3Loader(primary_source)
    secondary_source = get_s3_source(secondary_source_name)
    secondary = S3Loader(secondary_source)
    # join on the code
    output = utils.join(primary.get(), secondary.get(), key='code', fields=['name'])
    fact = {
        'xlabel':primary_source.title, 
        'ylabel': secondary_source.title,
        'title':'"{}" ({}) v.s. "{}" ({})'.format(primary_source.title, \
            primary.most_recent_date, \
            secondary_source.title, \
            secondary.most_recent_date
            ),
        'source':primary_source.source_name,
        'credit_url':primary_source.source_url,
        'date':primary.most_recent_date
        }
    return json.dumps({'data': output, 'fact': fact})

@application.route('/api/v1/data/<source_name>/ts/<code>')
def get_time_series(source_name, code):
    source = get_s3_source(source_name)
    f = S3Loader(source)
    fact = {
        'ylabel':source.title,
        'title':'"' + source.title + '" over Time', 
        'source':source.source_name,
        'credit_url':source.source_url,
        'start':min(f.unique_values('date')),
        }
    ts = f.time_series(code=code)
    resp = jsonify({'data': ts, 'fact': fact})
    return resp


@application.route('/api/v1/sources')
def ui_source_list():
    """ Return List of Source OBJECTS"""
    return json.dumps([source for s3_key, source in list_s3_sources(refresh_content=True)])


@application.route('/upload', methods=['POST'])
def upload_file():
    """ Allow the user to upload a CSV file
    which corresponds to the template available on the UI
    """
    try:
        logging.info('Upload request for: {}'.format(str(request.form)))
        title = request.form['title']
        name = re.sub('[^a-z]','',title.lower())
        description = request.form['description']
        source = request.form['source']
        source_url = request.form['source_url']
        
        # Check the Upload Requeust is valid
        request_errors = utils.validate_upload(request)
        if not request_errors is None:
            return render_template("sources.html", title='WHO-BBG Data Visualisation', error=request_errors)

        # valid request
        resp = add_s3_source(request.files['file'], name, source, source_url, title, description)

        if resp:
            return render_template("sources.html", title='WHO-BBG Data Visualisation', success='Source added Successfully')
        else:
            return render_template("sources.html", title='WHO-BBG Data Visualisation', error='Failed Uploading: Invalid File'+str(e.__dict__))
    except Exception as e:
        return render_template("sources.html", title='WHO-BBG Data Visualisation', error='Failed Uploading: Invalid File'+str(e.__dict__))




# run the app.
if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    application.debug = True
    application.run()