import {
    createClass,
    createElement,
    ReactNode
} from 'react';
var teste = function () {
    var x: number;
    return createClass({
        displayName: 'teste',
        render: function () {
            return createElement('div', null, 'ok1111 ', x);
        },
        componentWillMount: function () {
            x = 1;
        }
    });
}();
export default teste;