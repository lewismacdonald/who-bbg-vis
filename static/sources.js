$(document).ready(function() {
    $.getJSON('/api/v1/sources', function(data) {
        var table_data = []
        console.log(data);
        $.each(data, function(i, row) {
            console.log(i, row);
            table_data.push([row['title'],row['source-name'],row['source-url'],row['description']])
        });
        console.log(table_data);
        $('#source-table').DataTable( {
            data: table_data,
            columns: [
                {title:"Title"},
                {title:"Source"},
                {title:"Source Website"},
                {title:"Description"}
                ],
            responsive: true,
            })
    });

    // Populate list boxes
    $.getJSON('/api/v1/sources', function(source_list) {
        $.each(source_list, function(i, source){
             $('#source1').append($("<option />").val(source.name).text(source.title));
             $('#source2').append($("<option />").val(source.name).text(source.title));
        });
    });
    //$('#uploadsource').formValidation();
});

