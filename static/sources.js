$(document).ready(function() {
    $.getJSON('/api/v1/sources', function(data) {
        var table_data = []
        console.log('Source array:', data);
        $.each(data, function(i, row) {
            console.log(i, row);
            table_data.push([row['name'],row['title'],row['source-name'],row['source-url'],row['description']])
        });
        var table = $('#source-table').DataTable( {
            data: table_data,
            columns: [
                {title:'Name', visible:false},
                {title:"Title"},
                {title:"Source"},
                {title:"Source Website"},
                {title:"Description"},
                {title:"Options"}
                ],
            responsive: true,
            columnDefs: [{
                "targets": -1,
                "data": null,
                "defaultContent": "<button class=\"form-control btn-warning btn-small src-edit\" style=\"width:100%; float:left\"><span class=\"glyphicon glyphicon-edit\"></span> Edit</button>"
                }]
            })

        $('#source-table').on( 'click', 'button.src-edit', function () {
            var row_data = table.row( $(this).parents('tr') ).data();
            // fetch identifier to request info
            var source_name = row_data[0];
            $.getJSON('/api/v1/sources/'+source_name, function(data){
                console.log('Source info', data);
                // set modal values to begin with
                $('#edit-name').val(data.name);
                $('#edit-source').val(data.source_name);
                $('#edit-title').val(data.title);
                $('#edit-url').val(data.source_url);
                $('#edit-description').val(data.description);
            });
            $('#editSource').modal('show');
        } );

        $('#editsource').submit(function(e){
            e.preventDefault();
            var source_to_update = $('#edit-name').val();
            console.log('Clicked Edit Submit Changes',source_to_update )
            var api_endpoint = '/api/v1/sources/'+source_to_update;

            $.ajax({
                url: api_endpoint,
                type: 'POST',
                data: $( "#editsource" ).serialize(),
                complete: function(result) {
                    //redirect
                    window.location.href ='/sources'
                }
            });
        });

        $('#delete-source').on('click', function() {
            var source_to_delete = $('#edit-name').val();

            console.log('Request to delete', source_to_delete);
            var api_endpoint = '/api/v1/sources/'+source_to_delete;

            $.ajax({
                url: api_endpoint,
                type: 'DELETE',
                complete: function(result) {
                    //redirect
                    window.location.href ='/sources'
                }
            });
        });
    });

    
});

