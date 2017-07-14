$(document).ready(function() {
    $.getJSON('/api/v1/sources', function(data) {
        var table_data = []
        console.log(data);
        $.each(data, function(i, row) {
            console.log(i, row);
            table_data.push([row['name'],row['title'],row['source-url'],row['data-file'],row['long-title'],row['description']])
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

    // Populate list boxes
    $.getJSON('/api/v1/sources', function(source_list) {
        $.each(source_list, function(i, source){
             $('#source1').append($("<option />").val(source.name).text(source.title));
             $('#source2').append($("<option />").val(source.name).text(source.title));
        });
    });   
});

