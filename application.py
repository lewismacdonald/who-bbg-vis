"""
	This simple flask application serves as a
	demonstration of geo mapping with a flask 
	app using HighCharts.js and bokeh (python)

	Author: Lewis Macdonald
	Date: 14-04-2017

"""
import logging, sys

from flask import Flask, render_template


app = Flask(__name__)

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

logger = logging.getLogger(__name__)

@app.route('/highmaps')
def highmaps_vis():
	""" Render a template with highmaps """
	return render_template("index.html")

@app.route('/')
def default():
    return "Hello"

if __name__=='__main__':
    app.debug=True
    app.run()
