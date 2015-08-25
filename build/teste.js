var react_1 = require('react');
var teste = function () {
    var x;
    return react_1.createClass({
        displayName: 'teste',
        render: function () {
            return react_1.createElement('div', null, 'ok1111 ', x);
        },
        componentWillMount: function () {
            x = 1;
        }
    });
}();
exports.default = teste;
