#!/usr/bin/python
# -*- coding: utf-8 -*-
#sources.py

import requests
import itertools
import datetime
import logging
from collections import namedtuple
from io import BytesIO
from file_operations import FileManager
from werkzeug.utils import secure_filename
from custom_parsers import BloodPressureParse, CellularParse, UploaderParse
import json
import os

LocalSource = namedtuple('Source','name, title, parsed, source_name, source_url')

S3Source = namedtuple('Source','name, title, key, source_name, source_url, description, upload_data')

DATA_DIRECTORY='parsed-who-data'

# Manages S3 Interaction
file_manager = FileManager()

def list_s3_sources(refresh_content=False):
    return file_manager.sources(refresh_content=refresh_content)

def delete_s3_source(name):
    """ Delete a source from S3 """
    # Data File
    filename = name+'.json'
    #  Metadata
    meta_filename = name+'.meta.json'

    return file_manager.remove_source(filename, meta_filename)

def get_s3_source(name):
    try:
        key, source = next((k,s) for k,s in list_s3_sources() if s['name']==name)
    except:
        print list_s3_sources()
        raise IOError("Source {} not found".format(name))

    return S3Source(
        source['name'],
        source['title'],
        key,
        source['source-name'],
        source['source-url'],
        source['description'],
        source.get('upload-data')
        )

def add_s3_metadata(name, source, source_url, title, description, upload_data=None):
    """ Function to add metadata only, for existing source """
    # TODO: CHECK THAT IT ALREADY EXISTS
    filename = name+'.json'
    meta_filename = name+'.meta.json'
    
    meta = {   
        "name":name,
        "source-name":source,
        "source-url":source_url,
        "data-file":filename,
        "title":title,
        "long-title":title,
        "description":description,
        "upload-data":upload_data
    }
    logging.info('Writing metadata to s3: %s', meta)
    if file_manager.add_source_metadata(meta, meta_filename):
    	return True
    else:
    	return False

def add_s3_source(file, name, source, source_url, title, description):
    """ Function to add a Source, taking arguments from the upload form """
    logging.info('Parsing uploaded file locally')
    filename = secure_filename(file.filename)
    # save the uploaded file
    fname, format = filename.split('.')

    upload_filename = '_'.join(['upload',fname,str(datetime.datetime.now())])
    upload_key = '.'.join([upload_filename,format])
    raw_resp = file_manager.add_raw_file(file, upload_key)

    logging.info('Successfully saved raw uploaded file to s3: %s', upload_key)
    
    file.seek(0)
    try:
        file_content = UploaderParse(file).get()
    except IOError as ee:
        msg = 'Error parsing file; probably an encoding issue, make sure to use windows line endings'
        logging.info(msg)
        return {'status': msg} 

    logging.info('Successfully parsed uploaded file: %s', filename)

    filename = name+'.json'

    # Construct Metadata
    meta_filename = name+'.meta.json'
    
    meta = {   
        "name":name,
        "source-name":source,
        "source-url":source_url,
        "data-file":filename,
        "title":title,
        "long-title":title,
        "description":description,
        "upload-data":upload_key
    }
    if file_manager.add_source(file_content, filename, meta, meta_filename):
        return {'status':'OK'}
    else:
        return {'status':'FAILED'}

class S3Loader():
    def __init__(self, s3source):
        self.source = s3source
        self.data = file_manager.get_file_content(s3source.key)
        self.standard_attributes = ['date','code','name','value']
        
    @property
    def additional_attributes(self):
        return [k for k in self.data[0].keys() if k not in self.standard_attributes]
        
    @property
    def default_attributes(self):
        return [max([x[k] for x in self.data]) for k in self.additional_attributes]
    
    @property
    def most_recent_date(self):
        return max([x['date'] for x in self.data])

    @property
    def date_range(self):
        return list(set([x['date'] for x in self.data]))    

    def unique_values(self, attribute):
        return list(set([x.get(attribute) for x in self.data]))

    def get(self, v2=False, **kwargs):
        """ Handle API V1 (single date) and V2 (all dates)
        This difference between v1 and v2 is simply
        that v2 always returns data for ALL dates. Where
        v1 only returns for a particular date, which is
        either supplied or chosen to be the 'latest' (highest)
        date.
        """
        if not v2:
            if 'date' in kwargs:
                date = kwargs.pop('date')
                # force the date date to
                if isinstance(self.most_recent_date, int):
                    date = int(date)
            else:
                date = self.most_recent_date
            filter_dict = {k: v for k, v in zip(self.additional_attributes, self.default_attributes)}
            filter_dict.update(kwargs)
            condition = lambda elem: all([elem[k]==v for k, v in filter_dict.items()])
            return [elem for elem in self.data if elem['date']==date and condition(elem)]
        else:
            filter_dict = {k: v for k, v in zip(self.additional_attributes, self.default_attributes)}
            filter_dict.update(kwargs)
            condition = lambda elem: all([elem[k]==v for k, v in filter_dict.items()])
            return [elem for elem in self.data if condition(elem)]

    def time_series(self, code, **kwargs):
        filter_dict = {k: v for k, v in zip(self.additional_attributes, self.default_attributes)}
        filter_dict.update(kwargs)
        condition = lambda elem: all([elem[k]==v for k, v in filter_dict.items()])
        series = [elem for elem in self.data if elem['code']==code and condition(elem)]
        for elem in series:
            elem['y']=elem.pop('value')
        return series


