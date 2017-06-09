var mapChartOptions = {
        chart: {
            map: 'custom/world'
        },
        legend: {
            title: {
                style: {
                    color: (Highcharts.theme && Highcharts.theme.textColor) || 'black'
                }
            }
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

        colorAxis: {
            min: 110,
            max: 150,
            type: 'linear'
        },

        series: [{}]
};

var scatterChartOptions = {
        chart: {
            type: 'scatter',
            zoomType: 'xy',
            spacingLeft: 0
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'top',
            x: 100,
            y: 70,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        },
                        select: {
                            marker: {
                                enabled: false
                            }
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    },
                    select: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '<b>{point.name}</b><br>{point.x}, {point.y}'
                }
            }
        },
        series: [{}]
    };

function drawCharts(map_data, scatter_data, series_data) {
    var scatterChart = new Highcharts.chart('scatter', scatterChartOptions);
    scatterChart.series[0].update({
            name: '2015',
            allowPointSelect: true,
            color: 'rgba(223, 83, 83, .5)',
            data: scatter_data.data
        })
    scatterChart.update({title: {
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
    var mapChart = new Highcharts.mapChart('map', mapChartOptions);

    mapChart.setTitle({text: map_data.fact.title});
    mapChart.series[0].update({
            data: map_data.data,
            mapData: Highcharts.maps['custom/world'],
            joinBy: ['iso-a2', 'code'],
            name: 'Mean systolic blood pressure',
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
        });
    mapChart.legend.update({text: map_data.fact.ylabel});

    var timeSeriesChart = new Highcharts.chart('timeseries', {
        title: {
            text: 'Blood Pressure over Time'
        },
        chart: {
            height: 300,
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
    console.log(series_data);
    Highcharts.wrap(Highcharts.Point.prototype, 'select', function (proceed) {
        // careful about recursion here -- dont select anything!
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        // need to understand which element is selected
        if (this.series['type']=='map'){
            console.log('Map was clicked')
            // deal with map select event only for now
            var points = mapChart.getSelectedPoints();

            console.log(this.name + ' ' + this.code);
            console.log(points.length.toString() + ' points selected')
            index = scatterChart.series[0].data.findIndex(x => x.code==this.code);
            //remove hover and select states
            $.each(scatterChart.series[0].data, function(p){
                scatterChart.series[0].data[p].setState('');
                scatterChart.series[0].data[p].select(false);
            });
            scatterChart.tooltip.hide();

            if (index != -1) {
                console.log('found in scatter - selecting point');
                scatterChart.series[0].data[index].setState('hover');
                scatterChart.tooltip.refresh(scatterChart.series[0].data[index]);
            } else {
                console.log('not found in scatter');
            };
            
            $.each(points, function(i, point) {
                var source_id = $('#source1').val().toString();
                var ts_endpoint = '/api/v1/data/'+source_id+'/ts/'+point.code;
                console.log('Fetching: ' + ts_endpoint);
                $.getJSON(ts_endpoint, function(series_data) {
                    if (timeSeriesChart.series[i]) {
                        console.log('update 0-th series');
                        timeSeriesChart.series[i].update({
                            name: point.name,
                            data: series_data.data,
                            type: points.length > 1 ? 'line' : 'area'
                        });
                    } else {
                        console.log('adding new series');
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

        } else if (this.series['type'] =='scatter') {

            console.log('Scatter was clicked');

        } else {
            console.log('Timeseries was clicked');
        };
    });
};

// -- ON INITIAL LOAD-- //
$.getJSON('/api/v1/data/3/map', function(map_data) {
    $.getJSON('api/v1/data/3/scatter/1', function(scatter_data) {
        $.getJSON('/api/v1/data/3/ts/US', function(series_data) {
            $.each(map_data.data, function () {
                this.flag = this.code.replace('UK', 'GB').toLowerCase();
            });
        drawCharts(map_data, scatter_data, series_data);
        });
    });
});
// Populate list boxes
$.getJSON('/api/v1/data', function(source_list) {
    $.each(source_list, function(i, source){
         $('#source1').append($("<option />").val(source.id).text(source.name));
         $('#source2').append($("<option />").val(source.id).text(source.name));
    });
    //defaults
    $('#source1').val(3);
    $('#source2').val(1);
});

// List box change
$('#source1').change(function() {
    var primary = $('#source1').val();
    var secondary = $('#source2').val();
    console.log('Primary Source now: '+ primary );
    
    $.getJSON('/api/v1/data/3/map', function(map_data) {
        $.getJSON('api/v1/data/3/scatter/1', function(scatter_data) {
            $.getJSON('/api/v1/data/3/ts/US', function(series_data) {
                $.each(map_data.data, function () {
                    this.flag = this.code.replace('UK', 'GB').toLowerCase();
                });
            drawCharts(map_data, scatter_data, series_data);
            });
        });
    });
});

