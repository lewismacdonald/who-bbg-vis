
$(document).ready(function() {

    var mapChartOptions = {
        title:{
            text: 'World Map'
        },
        chart: {
            map: 'custom/world',
            marginBottom: 0,
            spacingLeft: 0,
            spcacingRight: 0
        },
        mapNavigation: {
            enabled: true,
            buttonOptions: {
                alignTo: 'spacingBox',
                padding: 5
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
            title:{
                text: 'Scatter Data'
            },
            chart: {
                type: 'scatter',
                zoomType: 'xy',
                spacingLeft: 0,
                spcacingRight: 0,
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
        }

    var timeSeriesOptions = {
            title:{
                text: 'Time Series'
            },
            chart: {
                spacingLeft: 0,
                spcacingRight: 0
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
                split: true,
                pointFormat: '<b>{point.name}</b><br>{point.y} ({point.x})'
            },
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
            series: [{}],
        }

    // define data for interactive charts
    // with document scope
    var map_data = {};
    var scatter_data = {};
    //var series_data = {};
    // can hold several
    var series_container = [];


    // Define the three global chart options

    var scatterChart = new Highcharts.chart('scatter', scatterChartOptions);
    var mapChart = new Highcharts.mapChart('map', mapChartOptions);
    var timeSeriesChart = new Highcharts.chart('timeseries', timeSeriesOptions);

    function scatterSourcesCredit(data_fact) {
        var source_html =  'Sources: '+'<a  href="'+scatter_data.fact.credit_url + '">' 
        + scatter_data.fact.source +'</a> / <a  href="' + data_fact.secondary_credit_url + '">' 
        + scatter_data.fact.secondary_source +'</a>';
        return source_html
    }

    function drawCharts(callback) {
        console.log('DRAW CHARTS CALLED ****')

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
                text: scatterSourcesCredit(scatter_data.fact)
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
            console.log('Updating map data.')
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
            console.log('Initialising new map data.')
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

        timeSeriesChart.update({
            title: {
                text: series_container[0].fact.title
            },
            subtitle: {
                text: 'Source: '+'<a href="'+series_container[0].fact.credit_url + '">' + series_container[0].fact.source +'</a>'
            },
            plotOptions: {
                series: {
                    animation: {
                        duration: 500
                    },
                    marker: {
                        enabled: true
                    },
                    threshold: 0,
                    pointStart: series_container[0].fact.start,
                    allowPointSelect: true
                }
            }   
        });
        // TODO FIX 
        
        timeSeriesChart.series[0].update({
            name: series_container[0].data[0].name,
            data: series_container[0].data,
            allowPointSelect: true,
            type: 'line',
            pointStart: series_container[0].fact.start
        });
        timeSeriesChart.redraw();
        console.log('Time Series Data:', series_container[0], 'Chart:', timeSeriesChart)


        if (typeof callback!='undefined'){
            callback();
        };
    };

    /**
    * Override the Highcharts tooltip reset function, we don't need 
    to hide the tooltips and crosshairs.
    https://stackoverflow.com/questions/36437297/highcharts-synchronized-charts-display-tooltip
    */
    Highcharts.Pointer.prototype.reset = function() {
        return undefined;
    };

    /**
    * Override the default Highcharts select event to synchronize between charts.
    This means when user selects on the map, we select the corresponding point
    on the scatter and update the time series.
    To allow this to work two ways i.e. from scatter-> map and map-> scatter,
    while avoiding infinite recursion, we send a custom argument {trigger: 'chartsync'} 
    when selecting via this overriden function, and ignore calls with this argument.
    */
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
                if (points.length){
                    // stuff is selected
                } else {
                    // nothing is selected.
                };
                console.log(points.length.toString() + ' points selected:', points);
                var selected_options = $('#source_picker').find(":selected");
                // get source name of the primary
                var source_name = selected_options[0].value.slice(0, -2);
                // update the time series
                updateTimeSeries(source_name, points)

                $.each(points, function(i, point) {
                    // select the scatter
                    function isMatch(element) {
                        return element.code==point.code
                    };
                    index = scatterChart.series[0].data.findIndex(isMatch);
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
                    
                });
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
                    function isMatch(element) {
                        return element.code==point.code
                    };  
                    index = mapChart.series[0].data.findIndex(isMatch);
                    
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
                var point = timeSeriesChart.getSelectedPoints();
                console.log('Timeseries was clicked', point);
                //console.log('Scatter', scatter_data,'Map',map_data, 'TS', series_data);
                getDataAndDrawWithDate(point[0].date)
            };
        } else if (trigger.trigger=='chartsync') {
            console.log('TRIGGERED BY APP')

        } else {
            console.log('Pigs can fly!') // this can never happen!
        } 
    });

    function getExistingCodes() {
        var codes = [];
        $.each(series_container, function(i, data) {
            codes.push(data.fact.code);
        })
        return codes
    };

    function updateTimeSeries(source, points) {
        console.log('Updating Time series', points, source)
        var existing_codes = getExistingCodes();

        console.log('Existing codes', existing_codes)

        $.each(points, function(i, point) {
            // if already in series_container, dont get anything
 
            var ts_endpoint = '/api/v1/data/'+source+'/ts/'+point.code;
            console.log('Fetching time series: ' + ts_endpoint);
            $.getJSON(ts_endpoint, function(series_response) {
                series_container.push(series_response);
                if (timeSeriesChart.series[i]) {
                    // add the series data for this code
                    
                    timeSeriesChart.series[i].update({
                        id: point.code,
                        name: point.name,
                        data: series_response.data,
                        type:'line'
                    });
                } else {
                    // add the series data for this code
                    
                    timeSeriesChart.addSeries({
                        id: point.code,
                        name: point.name,
                        data: series_response.data,
                        type: 'line'
                    });
                }  
            });
            
            while (timeSeriesChart.series.length > points.length) {
                timeSeriesChart.series[timeSeriesChart.series.length - 1].remove(false);
            }
            //timeSeriesChart.redraw();
        });
        console.log('Series Container AFTER', series_container)
    }; 

    function getDataAndDrawWithDate(ts) {
        //TODO: update points rather than update the 
        // entire series. this will make animation nicer.
        console.log('CALLED GET DATA AND DRAW WITH DATE ***')
        var selected_sources = $('#source_picker').find(":selected");
        var primary = ''
        var secondary = ''
        $.each(selected_sources, function(i, option){
            if (i==0){
                //primary
                primary = option.value.slice(0, -2)
            } else {
                //secondary
                secondary = option.value.slice(0, -2)
            }
        });
        //console.log('Drawing primary, secondary:', primary, secondary, 'ts:', ts, 'current ts data', series_data)
        var map_endpoint ='/api/v1/data/'+primary+'/map/'+ts
        $.getJSON(map_endpoint, function(map_response) {
            var scatter_endpoint = 'api/v1/data/'+primary+'/scatter/'+secondary+'/'+ts+'/'+ts
            $.getJSON(scatter_endpoint, function(scatter_response) {
                map_data = map_response;
                scatter_data = scatter_response;
                drawCharts();
            });
        }); 
    };

    function getDataAndDraw(primary_id, secondary_id, callback) {
        console.log('CALLED GET DATA AND DRAW ***')
        $.getJSON('/api/v1/data/'+primary_id+'/map', function(map_response) {
            $.getJSON('api/v1/data/'+primary_id+'/scatter/'+secondary_id, function(scatter_response) {
                $.getJSON('/api/v1/data/'+primary_id+'/ts/US', function(series_response) {
                    $.each(map_data.data, function () {
                        this.flag = this.code.replace('UK', 'GB').toLowerCase();
                    });
                    map_data = map_response;
                    scatter_data = scatter_response;
                    series_container.push(series_response); 

                    drawCharts(callback);
                });
            });
        });
    };

    $('#source_picker').on('changed.bs.select', function (e, i, new_val, old_val) {
        var selected_options = $(this).find(":selected"); // get selected option for the changed select only
        if (selected_options.length==1){
            console.log('Only one source has been selected - ERROR')
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
    });

    ///initial -- some DEFAULTS
    var DEFAULT_PRIMARY = "blood-pressure-male";
    var DEFAULT_SECONDARY = "blood-pressure-female";

    $.getJSON('/api/v1/sources', function(source_list) {
        $.each(source_list, function(i, source){
             $('#source1').append($("<option>",{
                class:"source1",
                value: source.name+'_1',
                text: source.title
             }));
             $('#source2').append($("<option>",{
                class:"source2",
                value: source.name+'_2',
                text: source.title
             }));
        });
         
        $('#source_picker').selectpicker('val',[DEFAULT_PRIMARY+'_1', DEFAULT_SECONDARY+'_2']);
        $('#source_picker').selectpicker('refresh');

    });
    
    function showLoading() {
        $("body").addClass("loading");
    };
    
    function hideLoading() {
        $("body").removeClass("loading"); 
    };

    // ON LOAD
    showLoading();

    // Draw charts with a callback to hide the loading overlay.
    getDataAndDraw(DEFAULT_PRIMARY, DEFAULT_SECONDARY, hideLoading);

});
