$(document).ready(function() {
    $.getJSON('/api/v1/data', function(data) {
        var table_data = []
        console.log(data);
        $.each(data, function(i, row) {
            console.log(i, row);
            table_data.push([row['id'],row['name'],row['name'],row['name'],row['name'],row['name']])
        });
        console.log(table_data);
        $('#source-table').DataTable( {
            data: table_data,
            columns: [
                {title:"Name"},
                {title:"Source"},
                {title:"URL"},
                {title:"Raw"},
                {title:"Attributes"},
                {title:"Description"}
                ]
            })
    });
    
} );