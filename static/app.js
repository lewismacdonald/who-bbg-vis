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
        subtitle: {
            text: 'Source: '+'<a  href="'+scatter_data.fact.credit_url + '">' + scatter_data.fact.source +'</a>'
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
    
    // set title ad subtitle
    mapChart.setTitle({
        text: '"' + map_data.fact.title +'" ('+map_data.fact.date+')',
        align: 'center'
    },
    {
        text: 'Source: '+'<a  href="'+map_data.fact.credit_url + '">' + map_data.fact.source +'</a>'
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
        subtitle: {
            text: 'Source: '+'<a  href="'+series_data.fact.credit_url + '">' + series_data.fact.source +'</a>'
        },
        chart: {
            spacingLeft: 0
        },
        credits: {
            enabled: false
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
            type: 'line',
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
                                type: points.length > 1 ? 'line' : 'line'
                            });
                        } else {
                            console.log('adding new time series');
                            timeSeriesChart.addSeries({
                                name: point.name,
                                data: series_data.data,
                                type: points.length > 1 ? 'line' : 'line'
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
            console.log('TRIGGERED BY APP')

        } else {

            console.log('Pigs can fly!') // this can never happen!
        }
        
    });
};


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


// ON LOAD
$(document).ready(function() {
    ///initial -- some DEFAULTS
    var DEFAULT_PRIMARY = "blood-pressure-male";
    var DEFAULT_SECONDARY = "blood-pressure-female";
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("loader").style.display = "block";
    // -- ON INITIAL LOAD-- //

    $.getJSON('/api/v1/sources', function(source_list) {
        $.each(source_list, function(i, source){
             $('#source1').append($("<option>",{
                class:"source1",
                value: source.name+'_1',
                text: source.title
             }));
             console.log(source.name);
             $('#source2').append($("<option>",{
                class:"source2",
                value: source.name+'_2',
                text: source.title
             }));
        });
         
         $('#source_picker').selectpicker('val',[DEFAULT_PRIMARY+'_1', DEFAULT_SECONDARY+'_2']);
         $('#source_picker').selectpicker('refresh');
         //$('#source1').selectpicker('refresh');
         //$('#source2').selectpicker('refresh');
    });

    getDataAndDraw(DEFAULT_PRIMARY, DEFAULT_SECONDARY);
    document.getElementById("loader").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
});

/* OLD TWO SOURCES
// Source List box change
$('#source1, #source2').change(function() {
    var primary = $('#source1').val();
    var secondary = $('#source2').val();
    console.log('Sources changed to: '+ primary +' '+ secondary );
    //getDataAndDraw(primary, secondary);
});
*/
$('#source_picker').on('changed.bs.select', function (e, i, new_val, old_val) {
  var selected_options = $(this).find(":selected"); // get selected option for the changed select only
  if (selected_options.length==1){

  } else {
    var primary = ''
    var secondary = ''
    $.each(selected_options, function(i, option){
        if (i==0){
            //primary
            primary = option.value.slice(0, -2)
        } else {
            //secondary
            secondary = option.value.slice(0, -2)
        }
        
      });
    console.log('Drawing primary, secondary:', primary, secondary)
    getDataAndDraw(primary, secondary);
  }
  
  
  //console.log(selected_option.classname);
});
