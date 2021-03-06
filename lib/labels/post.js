var OBLIGATIONS = require('obligations');
var estraverse = require('estraverse'), sideEffects = require('../side-effects'), ContractError = require('../error');
module.exports = postcondition;
function postcondition(ast, options, labels, func) {
    OBLIGATIONS.precondition(ast.type === 'LabeledStatement');
    OBLIGATIONS.precondition(ast.body.type === 'BlockStatement');
    OBLIGATIONS.precondition(options && typeof options === 'object');
    var __result;
    var effects = sideEffects(ast);
    if (effects.length) {
        throw new ContractError('Postcondition contains side-effects! ', effects[0]);
    }
    __result = removeLabel(labels, func, options, estraverse.replace(ast, { enter: enter.bind(null, options) }));
    OBLIGATIONS.postcondition(Array.isArray(__result));
    return __result;
}
;
function enter(options, node, parent) {
    var statement;
    if (node.type === 'ExpressionStatement') {
        statement = {
            type: 'ExpressionStatement',
            expression: {
                type: 'CallExpression',
                callee: {
                    type: 'Identifier',
                    name: options.libIdentifier + '.postcondition'
                },
                arguments: []
            },
            range: node.range,
            loc: node.loc
        };
        if (node.expression.type === 'SequenceExpression') {
            statement.expression.arguments = node.expression.expressions;
        } else {
            statement.expression.arguments.push(node.expression);
        }
        return statement;
    }
}
function removeLabel(labels, func, options, ast) {
    var body = ast.body.body;
    if (!labels.invariant) {
        return body.concat(createReturnStatement(options));
    } else {
        return body;
    }
}
function createReturnStatement(options) {
    return {
        type: 'ReturnStatement',
        argument: {
            type: 'Identifier',
            name: options.resultIdentifier
        }
    };
}