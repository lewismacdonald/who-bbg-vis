import boto3
import boto3.session
import os
import logging
import json
from StringIO import StringIO

BUCKET = 'whobbg'

IS_PROD = ('WHO_BBG_PROD_ENV' in os.environ)

if IS_PROD:
    S3_PREFIX = 'prod/parsed-data'
else:
    S3_PREFIX = 'dev/parsed-data'


def get_s3_client():
    """ S3 Client"""
    session = boto3.session.Session(region_name='eu-west-1')
    s3client = session.client('s3', verify=False, config= boto3.session.Config(signature_version='s3v4'))
    return s3client


class FileManager():
    """ Manage S3 Interactions to save and delete files """
    def __init__(self, client=None, bucket=None, prefix=None, lazy=True):
        self.client = client or get_s3_client()
        self.prefix = prefix or S3_PREFIX
        self.bucket = bucket or BUCKET
        self.bucket_content = None
        self.env = 'PROD' if IS_PROD else 'DEV'
        if not lazy:
            self.get_bucket_content()
        self.file_condition = lambda file: file['Size']>0 and 'meta' not in file['Key'].split('.')
        self.meta_file_condition = lambda file: file['Size']>0 and 'meta' in file['Key'].split('.')
        self._content_cache={}
        self._resp_cache={}
        self.logger = logging.getLogger()

    def get_bucket_content(self):
        self.bucket_content = self.client.list_objects(Bucket=self.bucket,Prefix=self.prefix)

    def list_files(self, refresh_content=False):
        """ List all the data files """
        if (self.bucket_content is None) or refresh_content:
            self.get_bucket_content()
        meta_keys = [obj['Key'] for obj in self.bucket_content['Contents'] if self.file_condition(obj)]
        return meta_keys

    def list_meta_files(self, refresh_content=False):
        """ List all the meta files """
        if (self.bucket_content is None) or refresh_content:
            self.get_bucket_content()
        meta_keys = [obj['Key'] for obj in self.bucket_content['Contents'] if self.meta_file_condition(obj)]
        return meta_keys

    def get_s3_file(self, key, refresh_content=False):
        try:
            if refresh_content:
                self._resp_cache[key]=self.client.get_object(Bucket=self.bucket, Key=key)
                self._content_cache[key]= self._resp_cache[key]['Body'].read()
            elif key not in self._resp_cache:
                self._resp_cache[key]=self.client.get_object(Bucket=self.bucket, Key=key)
                self._content_cache[key]= self._resp_cache[key]['Body'].read()
            return self._content_cache[key]
        except Exception as e:
            # nothing for now
            raise 
    
    def put_s3_file(self, filename, content):
        try:
            s3_key = '/'.join([self.prefix,filename])
            self.client.upload_fileobj(Bucket=self.bucket, Fileobj=StringIO(content), Key=s3_key)
            self.logger.info('Successfully wrote File: {} to S3 (Bucket: {})'.format(s3_key, self.bucket)) 
        except Exception as e:
            self.logger.error('Error writing file: {} to S3 (Bucket: {})'.format(s3_key, self.bucket)) 
            raise

    def get_file_content(self, key, refresh_content=False):
        try:
            content = self.get_s3_file(key, refresh_content)
        except Exception as e:
            raise IOError('Error fetching file from S3 {}'.format(key))
        try:
            return json.loads(content)
        except Exception as e:
            raise IOError('File {} was retrieved from S3 but not valid JSON'.format(key))


    def sources(self, refresh_content=False):
        """ Primary Method to fetch list of sources from MetaFiles"""
        sources = []
        for key in self.list_meta_files(refresh_content=refresh_content):
            data_key = key.replace('.meta','')
            try:
                content = self.get_file_content(key, refresh_content=refresh_content)
                sources.append((data_key, content))
            except Exception as e:
                # Don't raise, just move on
                self.logger.error('Error fetching {}'.format(key), exc_info=True)

        return sources

    def add_source(self, file, file_name, meta, meta_filename):
        """ Primary Method to add a source. This requires both data AND meta files"""
        try:
            s3_resp = self.put_s3_file(file_name, json.dumps(file))
            meta_resp = self.put_s3_file(meta_filename, json.dumps(meta))
        except Exception as e:
            self.logger.error('Error writing to S3 {}'.format(filename))
            return False

        return True
    
    def edit_source_metadata(self, meta, meta_filename):
        """ Update the metadata for a particular file """
        pass

    def remove_source(self, file_name):
        """ Move source and metadata to deleted """
        pass

    def unremove_source(self, file_name):
        """ Move source and metadata from deleted back to main"""
        pass

if __name__=='__main__':
    print list_content()
    print list_files()
    print list_meta_files()