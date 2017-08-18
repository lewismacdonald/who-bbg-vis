$(document).ready(function() {
    $.getJSON('/api/v1/sources', function(data) {
        var table_data = []
        console.log('Source array:', data);
        $.each(data, function(i, row) {
            console.log(i, row);
            table_data.push([row['title'],row['source-name'],row['source-url'],row['description']])
        });
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
});

