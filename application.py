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

from flask import Flask, render_template, jsonify, request, redirect, url_for, flash
import json, os
import re
import logging
import sys
from sources import S3Loader, list_s3_sources, \
    get_s3_source, add_s3_source, delete_s3_source, add_s3_metadata
import utils


application = Flask(__name__)
application.secret_key = os.getenv('FLASK_SECRET','APK123')

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
@application.route('/api/v1/data/<source_name>/map/<ts>')
def get_map_data(source_name, ts=None):
    """ API Method to fetch data for the map """
    source = get_s3_source(source_name)
    f = S3Loader(source)
    if ts is None:
        ts = f.most_recent_date
    fact = {
        'ylabel':source.title,
        'title':source.title, 
        'source':source.source_name,
        'credit_url':source.source_url,
        'date': ts
        }
    logging.info('**API V1 Response **: MAP data for %s %s' % (source_name, ts))
    return json.dumps({'data': f.get(date=ts), 'fact': fact})


@application.route('/api/v2/data/<source_name>/map')
def get_map_time_data(source_name):
    source = get_s3_source(source_name)
    f = S3Loader(source)
    fact = {
        'ylabel':source.title,
        'title':source.title, 
        'source':source.source_name,
        'credit_url':source.source_url,
        'date': f.most_recent_date
        }
    return json.dumps({'data': f.get(v2=True), 'fact': fact, 'dates':f.date_range})


@application.route('/api/v1/data/<primary_source_name>/scatter/<secondary_source_name>')
@application.route('/api/v1/data/<primary_source_name>/scatter/<secondary_source_name>/<ts>')
@application.route('/api/v1/data/<primary_source_name>/scatter/<secondary_source_name>/<ts>/<secondary_ts>')
def get_scatter_data(primary_source_name, secondary_source_name, ts=None, secondary_ts=None):
    """ API Method to get data for the scatter """

    # Load data sources
    primary_source = get_s3_source(primary_source_name)
    primary = S3Loader(primary_source)
    secondary_source = get_s3_source(secondary_source_name)
    secondary = S3Loader(secondary_source)
    
    if ts is None:
        ts = primary.most_recent_date

    if secondary_ts is None:
        secondary_ts = secondary.most_recent_date
        
    # Join the two datasets on the country code
    output = utils.join(primary.get(date=ts), secondary.get(date=secondary_ts), key='code', fields=['name'])
    fact = {
        'xlabel':primary_source.title, 
        'ylabel': secondary_source.title,
        'title':'"{}" v.s. "{}" ({})'.format(primary_source.title, secondary_source.title, ts),
        'source':primary_source.source_name,
        'credit_url':primary_source.source_url,
        'secondary_source':secondary_source.source_name,
        'secondary_credit_url':secondary_source.source_url,
        'date':ts,
        'seondary_date':secondary_ts
        }
    logging.info('**API V1 Response **: SCATTER data for %s %s %s %s' % 
        (primary_source_name, secondary_source_name, ts, secondary_ts))
    return json.dumps({'data': output, 'fact': fact})

@application.route('/api/v1/data/<source_name>/ts/<code>')
def get_time_series(source_name, code):
    source = get_s3_source(source_name)
    f = S3Loader(source)
    fact = {
        'ylabel':source.title,
        'title':'"' + source.title + '" over Time', 
        'source':source.source_name,
        'code':code,
        'credit_url':source.source_url,
        'start':min(f.unique_values('date')),
        }
    ts = f.time_series(code=code)
    resp = jsonify({'data': ts, 'fact': fact})
    logging.info('**API V1 Response **: SERIES data for %s %s' % (source_name, code))
    return resp


@application.route('/api/v1/sources')
def ui_source_list():
    """ Return List of Source OBJECTS"""
    return json.dumps([source for s3_key, source in list_s3_sources(refresh_content=True)])

@application.route('/api/v1/sources/<source_name>', methods=['GET','DELETE','POST'])
def get_source_meta(source_name):
    if request.method=='GET':
        source = get_s3_source(source_name)
        return json.dumps(source._asdict())
    elif request.method=='DELETE':
        resp = delete_s3_source(source_name)
        if resp:
            flash('Source successfully Deleted','bg-success')
            
        else:
            flash('Error Deleting source','bg-danger')
        
    elif request.method=='POST':
        name = source_name
        source = request.form['source']
        description = request.form['description']
        source_url = request.form['source_url']
        title =  request.form['title']

        resp = add_s3_metadata(name, source, source_url, title, description)
        if resp:
            flash('Source successfully Updated','bg-success')
        else:
            flash('Error updating source','bg-danger')
        
    return redirect(url_for('source_screen'))

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
            flash(request_errors, 'bg-danger')
            return redirect(url_for('source_screen'))

        # valid request
        resp = add_s3_source(request.files['file'], name, source, source_url, title, description)

        if resp:
            flash('Source added Successfully', 'bg-success')
            return redirect(url_for('source_screen'))
        else:
            flash('Failed Uploading: Invalid File'+str(e.__dict__))
            return redirect(url_for('source_screen'), 'bg-danger')
    except Exception as e:
        flash('Failed Uploading: Invalid File'+str(e.__dict__))
        return redirect(url_for('source_screen'), 'bg-danger')




# run the app.
if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    application.debug = True
    application.run()