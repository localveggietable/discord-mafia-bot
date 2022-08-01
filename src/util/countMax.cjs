//Returns an object containing the value (or array of values) inside an iterable that has been repeated the most times, as well as how many times it has been repeated.

/*

@param {Iterable} iterable

*/


module.exports.countMax = function(iterable){
    let exp = {
        count: 0,
        value: null
    };
    let map = new Map();
    for (let val of iterable){
        if (!val) continue;
        if (map.has(val)) {
            let cardinality = map.get(val);
            map.set(val, ++cardinality);

            if (cardinality > exp.count){
                exp = {
                    count: cardinality,
                    value: val
                };
            } else if (cardinality == exp.count){
                exp = Array.isArray(exp.value) ? {count: cardinality, value: exp.value.push(val)} : {count: cardinality, value: [exp.value, val]}
            }
        } else {
            map.set(val, 1);

            if (!exp.count){
                exp = {
                    count: 1,
                    value: val
                };
            } else if (exp.count == 1){
                exp = Array.isArray(exp.value) ? {count: 1, value: exp.value.push(val)} : {count: 1, value: [exp.value, val]}
            }
        }
    }

    return exp;
}