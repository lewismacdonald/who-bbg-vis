import boto3

def list_files(name):
	""" List all the data files """
	client = boto3.client('s3')

	return [x['Key'] for x in client.list_objects(Bucket='whobbg', Prefix='parsed-data/')]



if __name__=='__main__':
	print [x['Key'] for x in get_file(None)['Contents']]