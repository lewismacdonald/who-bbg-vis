$.getJSON('/static/refined.json', function (data) {

    // Add lower case codes to the data set for inclusion in the tooltip.pointFormat
    $.each(data, function () {
        this.flag = this.code.replace('UK', 'GB').toLowerCase();
    });

    // Initiate the chart
    Highcharts.mapChart('container', {

        title: {
            text: 'WHO - Bloomberg POC'
        },

        legend: {
            title: {
                text: 'Mean systolic blood pressure (age-standardized estimate, Female)',
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
            data: data,
            mapData: Highcharts.maps['custom/world'],
            joinBy: ['iso-a2', 'code'],
            name: 'Mean systolic blood pressure',
            states: {
                hover: {
                    color: '#a4edba'
                }
            }
        }]
    });
});