"""
    This simple flask application serves as a
    demonstration of geo mapping with a flask 
    app using HighCharts.js and bokeh (python)

    Author: Lewis Macdonald
    Date: 14-04-2017

"""

from flask import Flask, render_template

application = Flask(__name__)

@application.route('/highmaps')
def highmaps_vis():
    """ Render a template with highmaps """
    return render_template("index.html")

# run the app.
if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production app.
    application.debug = True
    application.run()