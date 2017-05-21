$.getJSON('/api/v1/data/3/map', function (map_data) {
$.getJSON('api/v1/data/3/scatter/1', function(scatter_data) {
    // Add lower case codes to the data set for inclusion in the tooltip.pointFormat
    $.each(map_data.data, function () {
        this.flag = this.code.replace('UK', 'GB').toLowerCase();
    });

    // Initiate the Map
    mapChart = Highcharts.mapChart('map', {

        title: {
            text: map_data.fact.title
        },
        subtitle: {
            text: map_data.fact.source
        },
        chart: {
            map: 'custom/world'
        },
        legend: {
            title: {
                text: map_data.fact.ylabel,
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

        series: [{
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
        }]
    });

    // Initiate the scatter
    scatterChart = Highcharts.chart('scatter', {
        chart: {
            type: 'scatter',
            zoomType: 'xy',
            height: 300,
            spacingLeft: 0
        },
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
        series: [{
            name: '2015',
            allowPointSelect: true,
            color: 'rgba(223, 83, 83, .5)',
            data: scatter_data.data
        }]
    });

    timeSeriesChart = Highcharts.chart('timeseries', {
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
                pointStart: 1,
            }
        },
        series: [{
            name: 'default',
            data: [1,2,3,4,5,6],
            type: 'area',
        }]
    });

    // Work out hover sync

    // OnClick
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
            
            $.each(points, function(i) {
                if (timeSeriesChart.series[i]) {
                        console.log('update 0-th series');
                        timeSeriesChart.series[i].update({
                            name: this.name,
                            data: [1,2,3,4,5,6,7],
                            type: points.length > 1 ? 'line' : 'area'
                        });
                    } else {
                        console.log('adding new series');
                        timeSeriesChart.addSeries({
                            name: this.name,
                            data: [7,6,5,4,3,2,1],
                            type: points.length > 1 ? 'line' : 'area'
                        }, false);
                    }
                
                while (timeSeriesChart.series.length > points.length) {
                    timeSeriesChart.series[timeSeriesChart.series.length - 1].remove(false);
                }
                timeSeriesChart.redraw();
            });

        } else if (this.series['type'] =='scatter') {

            console.log('Scatter was clicked');

        } else {
            console.log('Timeseries was clicked');
        };
    });
});
});