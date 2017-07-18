# WHO - Bloomberg Vis POC

This project is for creating a basic Data Visualisation app for use. It allows the user to upload basic geographical panel data and analyse this on a set of visualisations.

## Implementation

The application is built using open source packages:
 - Flask (Web App)
 - jQuery (UI)
 - Highcharts (visualisation)
 - Datatables

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
- Bokeh: http://localhost:5000/bokeh
- HighMaps: https://localhost:5000/highmaps

## On aws
For testing and development, using aws ec2. 
For deployment, using aws elastic beanstalk.

```bash
pip install awsebcli

# within bloomberg (assume proxies set as environment vars)
eb init --no-verify-ssl
```



