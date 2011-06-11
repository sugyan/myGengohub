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
                $('body')
                    .append($('<form method="POST">')
                            .append($('<textarea name="readme" disabled>').text(data))
                            .append($('<input type="submit" value="translate!">'))
                            .submit(function () {
                                $('textarea').removeAttr('disabled');
                            }));
            }
        });
    });
}
