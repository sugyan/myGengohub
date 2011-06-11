var path = location.pathname;

if (path.match(/^\/repositories\//)) {
    $(function () {
        var m = path.match(/^\/repositories\/(\w+)\/(\w+)/);
        $.ajax({
            url: '/api/repository',
            data: {
                user: m[1],
                repo: m[2]
            },
            success: function (data) {
                $('body').append($('<pre>').text(data));
            }
        });
    });
}
