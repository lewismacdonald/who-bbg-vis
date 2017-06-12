var mapChartOptions = {
        chart: {
            map: 'custom/world',
            marginBottom: 0
        },
        mapNavigation: {
            enabled: true,
            buttonOptions: {
                verticalAlign: 'bottom'
            }
        },
        tooltip: {
            backgroundColor: 'none',
            borderWidth: 0,
            shadow: false,
            useHTML: true,
            padding: 0,
            pointFormat: '<span class="f32"><span class="flag {point.flag}"></span></span>' +
                ' {point.name}: <b>{point.value}</b>',
            positioner: function () {
                return { x: 0, y: 250 };
            }
        },
        credits: {
            enabled: false
        },
        colorAxis: {},
        legend: {
            floating: true,
            align: 'center',
            verticalAlign: 'bottom',
            y:0,
            margin:0,
            padding:0
        },

        series: [{id:'map_source'}]
};

var scatterChartOptions = {
        chart: {
            type: 'scatter',
            zoomType: 'xy',
            spacingLeft: 0,
            padding: 0
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'top',
            x: 100,
            y: 70,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1,
            enabled: false
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            scatter: {
                animation: true,
                marker: {
                    radius: 4,
                    states: {
                        hover: {
                            enabled: true,
                            fillColor: '#a4edba',
                            lineColor: 'rgb(100,100,100)'
                        },
                        select: {
                            enabled: true,
                            fillOpacity:1,
                            fillColor: '#a4edba',
                            lineColor: 'rgb(100,100,100)',
                            radius: 8
                        }
                    }
                },
                tooltip: {
                    pointFormat: '<b>{point.name}</b><br>{point.x}, {point.y}'
                }
            }
        },
        series: [{}]
    };

function drawCharts(map_data, scatter_data, series_data) {
    if (typeof scatterChart != 'undefined') {
        console.log('DESTROYING SCATTER CHART');
        scatterChart.destroy();
    };
    scatterChart = Highcharts.chart('scatter', scatterChartOptions);
    scatterChart.series[0].update({
            name: scatter_data.fact.title,
            allowPointSelect: true,
            data: scatter_data.data,
            color: 'rgba(119, 152, 191, .4)',
            dataLabels: {
                enabled: false,
                formatter: function() {
                    return this.point.name;
                },
                style: {color:"black"}
            },
            point: {
                events: {
                    unselect: function() {
                        this.update({
                            dataLabels: {
                                enabled: false
                            }
                        });
                    },
                    select: function() {
                        this.update({
                            dataLabels: {
                                enabled: true
                            }
                        });
                    }
                }
            }
            
        })
    scatterChart.update({
        title: {
            text: scatter_data.fact.title
        },
        xAxis: {
            title: {
                enabled: true,
                text: scatter_data.fact.xlabel
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: {
            title: {
                text: scatter_data.fact.ylabel
            },
            opposite: true
        }
    });

    if (typeof mapChart != 'undefined') {
        console.log('DESTROYING MAP CHART');
        mapChart.destroy();
    };

    mapChart = Highcharts.mapChart('map', mapChartOptions);
    
    mapChart.setTitle({
        text: map_data.fact.title,
        floating: true,
        padding: 0,
        margin: 0,
        align: 'center'
    });
    
    if (mapChart.series[0]) {
        // series already exists
        console.log('existing map series..updating')
        mapChart.get('map_source').update({
            id: 'map_source',
            data: map_data.data,
            mapData: Highcharts.maps['custom/world'],
            joinBy: ['iso-a2', 'code'],
            name: map_data.fact.ylabel,
            allowPointSelect: true,
            states: {
                hover: {
                    color: '#a4edba'
                },
                 select: {
                    color: '#a4edba',
                    borderColor: 'black',
                    dashStyle: 'shortdot'
                }
            }
        })
    } else {
        console.log('No map series Present...adding new')
        mapChart.addSeries({
            id: 'map_source',
            data: map_data.data,
            mapData: Highcharts.maps['custom/world'],
            joinBy: ['iso-a2', 'code'],
            name: map_data.fact.ylabel,
            allowPointSelect: true,
            states: {
                hover: {
                    color: '#a4edba'
                },
                 select: {
                    color: '#a4edba',
                    borderColor: 'black',
                    dashStyle: 'shortdot'
                }
            }
        })
    };
    console.log('Map Series:', mapChart.series);

    if (typeof timeSeriesChart != 'undefined') {
        console.log('DESTROYING TIME SERIES CHART');
        timeSeriesChart.destroy();
    };

    timeSeriesChart = Highcharts.chart('timeseries', {
        title: {
            text: series_data.fact.title
        },
        chart: {
            spacingLeft: 0
        },
        credits: {
            enabled: false
        },
        subtitle: {
            text: null
        },
        xAxis: {
            tickPixelInterval: 50,
            crosshair: true
        },
        yAxis: {
            title: null,
            opposite: true
        },
        tooltip: {
            split: true
        },
        plotOptions: {
            series: {
                animation: {
                    duration: 500
                },
                marker: {
                    enabled: false
                },
                threshold: 0,
                pointStart: series_data.fact.start,
            }
        },
        series: [{
            name: series_data.fact.title,
            data: series_data.data,
            type: 'area',
        }]
    });
    Highcharts.wrap(Highcharts.Point.prototype, 'select', function (proceed) {
        
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));
        
        // avoid infinite recursion - we pass
        // a separate {trigger:'chartsync'} object when we 
        // call select programatically. This will be undefined
        // if it has come from an user select event.
        var trigger = arguments[3];
        if (typeof trigger == 'undefined') {
            console.log('TRIGGERED BY USER')
            if (this.series['type']=='map'){
                console.log('Map was clicked:', this.name, this.code)

                // deal with map select event only for now
                var points = mapChart.getSelectedPoints();
                console.log(points.length.toString() + ' points selected:', points);

                $.each(points, function(i, point) {
                    // select the scatter
                    index = scatterChart.series[0].data.findIndex(x => x.code==point.code);
                    if (index != -1) {
                        scatterChart.series[0].data[index].graphic.toFront();
                        console.log('Found point in scatter - selecting:', point.code);
                        if (points.length > 1) {
                            // accumulate
                            scatterChart.series[0].data[index].select(true, true, {trigger:'chartsync'});
                        } else {
                            scatterChart.series[0].data[index].select(true, false, {trigger:'chartsync'});
                        };
                        
                    } else {
                        console.log('not found in scatter:', point.code);
                    };

                    var source_id = $('#source1').val().toString();
                    var ts_endpoint = '/api/v1/data/'+source_id+'/ts/'+point.code;
                    console.log('Fetching: ' + ts_endpoint);
                    $.getJSON(ts_endpoint, function(series_data) {
                        if (timeSeriesChart.series[i]) {
                            console.log('update 0-th time series');
                            timeSeriesChart.series[i].update({
                                name: point.name,
                                data: series_data.data,
                                type: points.length > 1 ? 'line' : 'area'
                            });
                        } else {
                            console.log('adding new time series');
                            timeSeriesChart.addSeries({
                                name: point.name,
                                data: series_data.data,
                                type: points.length > 1 ? 'line' : 'area'
                            }, false);
                        }
                        while (timeSeriesChart.series.length > points.length) {
                            timeSeriesChart.series[timeSeriesChart.series.length - 1].remove(false);
                        }
                        timeSeriesChart.redraw();
                    });
                    
                });
                block_select = false;
            } else if (this.series['type'] =='scatter') {

                console.log('Scatter was clicked',this.name, this.code);
                this.update({
                    dataLabels: {
                        enabled: true
                        }
                    }
                )
                var points = scatterChart.getSelectedPoints();
                console.log('Scatter selected Points:', points);

                $.each(points, function(i, point) {
                    index = mapChart.series[0].data.findIndex(x => x.code==point.code);
                    
                    if (index != -1) {
                        console.log('Found point in map - selecting:', point.code);
                        if (points.length > 1) {
                            // accumulate
                            mapChart.series[0].data[index].select(true, true, {trigger:'chartsync'});
                        } else {
                            mapChart.series[0].data[index].select(true, false, {trigger:'chartsync'});
                        };
                    } else {
                        console.log('not found in map:', point.code);
                    };
                })

            } else {
                console.log('Timeseries was clicked');
            };
        } else if (trigger.trigger=='chartsync') {
            console.log('TRIGGERED BY CODE - IGNORE')
        }
        // need to understand which element is selected
        
    });
};
/*
function syncSelect(e) {
    console.log(e); // func args (select)
    console.log(this); // actual point selected
    console.log(arguments);
    
    var thisChart = this.series.chart;

    Highcharts.each(Highcharts.charts, function (chart) {
        if (chart != thisChart) {
            console.log(chart);
        }
    });
    
    if (e.trigger != 'syncSelect')  { //prevent feedback loop

        var thisChart = this.series.chart;
        var points = thisChart.getSelectedPoints(); // excludes current
        var thisType = this.series['type'];
        var currentPoint = e.target;

        console.log(points.length.toString() + ' points selected:', points);
        Highcharts.each(Highcharts.charts, function (chart) {
            if (chart != thisChart) {
                // to update
                var index = chart.series[0].data.findIndex(x => x.code==currentPoint.code);
                if (index != -1) {
                    if (points.length > 1) {
                        // accumulate
                        //chart.series[0].data[index].select(true, true, { trigger: 'syncSelect' });
                    } else {
                        chart.series[0].data[index].select(true, false, { trigger: 'syncSelect' });
                    };
                    //chart.series[0].data[index].graphic.toFront();
                } else {
                    console.log('not found:', currentPoint.code);
                };
            } else {
                console.log('Source:', chart);
            }
            
        });
    }
   
}
*/


function getDataAndDraw(primary_id, secondary_id) {
    $.getJSON('/api/v1/data/'+primary_id+'/map', function(map_data) {
        $.getJSON('api/v1/data/'+primary_id+'/scatter/'+secondary_id, function(scatter_data) {
            $.getJSON('/api/v1/data/'+primary_id+'/ts/US', function(series_data) {
                $.each(map_data.data, function () {
                    this.flag = this.code.replace('UK', 'GB').toLowerCase();
                });
            drawCharts(map_data, scatter_data, series_data);
            });
        });
    });
};
///initial -- some DEFAULTS
var DEFAULT_PRIMARY = 3;
var DEFAULT_SECONDARY = 1;

// -- ON INITIAL LOAD-- //
getDataAndDraw(DEFAULT_PRIMARY, DEFAULT_SECONDARY);

// Populate list boxes
$.getJSON('/api/v1/data', function(source_list) {
    $.each(source_list, function(i, source){
         $('#source1').append($("<option />").val(source.id).text(source.name));
         $('#source2').append($("<option />").val(source.id).text(source.name));
    });
    //defaults
    $('#source1').val(DEFAULT_PRIMARY);
    $('#source2').val(DEFAULT_SECONDARY);
});

// List box change
$('#source1, #source2').change(function() {
    var primary = $('#source1').val();
    var secondary = $('#source2').val();
    console.log('Sources changed to: '+ primary +' '+ secondary );
    getDataAndDraw(primary, secondary);
});

