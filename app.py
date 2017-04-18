"""
	This simple flask application serves as a
	demonstration of geo mapping with a flask 
	app using HighCharts.js and bokeh (python)

	Author: Lewis Macdonald
	Date: 14-04-2017

"""
import logging, sys

from flask import Flask, render_template

from bokeh.embed import components
from bokeh.models import (
    ColumnDataSource,
    HoverTool,
    LogColorMapper,
    TapTool,
    CustomJS
)

from bokeh.plotting import figure

from bokeh.resources import INLINE
from bokeh.util.string import encode_utf8


app = Flask(__name__)

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

logger = logging.getLogger(__name__)

@app.route('/highmaps')
def highmaps_vis():
	""" Render a template with highmaps """
	return render_template("index.html")

@app.route('/bokeh')
def bokeh_vis():
	""" Render a template with bokeh """
	from bokeh.palettes import Viridis6 as palette
	from bokeh.sampledata.us_counties import data as counties
	from bokeh.sampledata.unemployment import data as unemployment

	# Filter counties to just Florida (this could be removed)
	counties = {
	    code: county for code, county in counties.items() if county["state"] == "fl"
	}
	
	# Create arrays for the county boundaries and respective names
	county_xs = [county["lons"] for county in counties.values()]
	county_ys = [county["lats"] for county in counties.values()]

	county_names = [county['name'] for county in counties.values()]
	county_rates = [unemployment.get(county_id,0) for county_id in counties]

	# Create standard Data Source which render contains boundaries
	source = ColumnDataSource(data=dict(
	    x=county_xs,
	    y=county_ys,
	    name=county_names,
	    rate=county_rates,
	))

	# Set which visual tools should be available
	TOOLS = "pan,wheel_zoom,reset,hover,save,tap"

	p = figure(
	    title="Florida Unemployment, 2009", tools=TOOLS,
	    x_axis_location=None, y_axis_location=None
	)
	p.grid.grid_line_color = None

	# Set color depending on Log value
	palette.reverse() # just for prettiness
	color_mapper = LogColorMapper(palette=palette)

	# Create 'patches' of color split by the county boundaries
	p.patches('x', 'y', source=source,
	          fill_color={'field': 'rate', 'transform': color_mapper},
	          fill_alpha=0.7, line_color="white", line_width=0.5)

	# Add a basic tooltip
	hover = p.select_one(HoverTool)
	hover.point_policy = "follow_mouse"
	hover.tooltips = [
	    ("Name", "@name"),
	    ("Unemployment rate)", "@rate%"),
	    ("(Long, Lat)", "($x, $y)"),
	]

	click = p.select_one(TapTool)
	click.callback = CustomJS(args=dict(source=source), code="alert('Clicked!');")
	
	# Retrieve what we need to render on web page
	js_resources = INLINE.render_js()
	css_resources = INLINE.render_css()
	script, div = components(p)

	# Render the Jinja template 'embed.html'
	html = render_template(
	    'embed.html',
	    plot_script=script,
	    plot_div=div,
	    js_resources=js_resources,
	    css_resources=css_resources
	)

	return encode_utf8(html)

if __name__=='__main__':
	app.run(host="0.0.0.0", debug=True)
