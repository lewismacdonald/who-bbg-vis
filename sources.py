#!/usr/bin/python
# -*- coding: utf-8 -*-
#sources.py

import requests
import itertools
import logging
from collections import namedtuple
from io import BytesIO
from file_operations import FileManager
from werkzeug.utils import secure_filename
from custom_parsers import BloodPressureParse, CellularParse, UploaderParse
import json
import os

LocalSource = namedtuple('Source','name, title, parsed, source_name, source_url')

S3Source = namedtuple('Source','name, title, key, source_name, source_url, description')

DATA_DIRECTORY='parsed-who-data'

# Manages S3 Interaction
file_manager = FileManager()

def list_s3_sources(refresh_content=False):
    return file_manager.sources(refresh_content=refresh_content)

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
        source['description']
        )

def add_s3_source(file, name, source, source_url, title, description):
    """ Function to add a Source, taking arguments from the upload form """
    logging.info('Parsing uploaded file locally')
    filename = secure_filename(file.filename)
    file_content = UploaderParse(file).get()
    logging.info('Successfully parsed uploaded file')

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
        "description":description    
    }
    if file_manager.add_source(file_content, filename, meta, meta_filename):
        return True
    else:
        return False

class S3Loader():
    def __init__(self, s3source):
        self.source = s3source
        self.data = file_manager.get_file_content(s3source.key)
        self.standard_attributes = ['date','code','name','value']
        self.additional_attributes = [k for k in self.data[0].keys() if k not in self.standard_attributes]
        self.default_attributes = [max([x[k] for x in self.data]) for k in self.additional_attributes]
        self.most_recent_date = max([x['date'] for x in self.data])
        self.date_range = list(set([x['date'] for x in self.data]))    

    def unique_values(self, attribute):
        return list(set([x.get(attribute) for x in self.data]))

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


