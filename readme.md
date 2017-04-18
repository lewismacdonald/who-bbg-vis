# WHO - Bloomberg Vis POC

This project is for scoping out different open source vis solutions to use.

The implementation here is based on a very simple flask app.

There are two existing feature demonstrations:

 - /bokeh
 - /highmaps

## Tech Resource Links

### Highmaps
http://www.highcharts.com/docs/maps/custom-geojson-maps
http://www.highcharts.com/maps/demo/geojson

### Bokeh
http://bokeh.pydata.org/en/latest/docs/user_guide/geo.html#tile-providers
http://geo.holoviews.org/Working_with_Bokeh.html

## Get Started
 - Download
```bash
> git clone https://bbgithub.dev.bloomberg.com/lmacdonald18/who-bbg-vis
```
 - Set up Virtualenv
```bash
> cd who-bbg-vis
> virtualenv venv
  ...
```
 - Install Dependencies
```bash
> call venv/scripts/activate
(venv) > pip install -r requirements.txt
```
- Run the app
```bash
(venv) > python app.py 
```
