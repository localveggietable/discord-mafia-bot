console.log('Script start');
setTimeout(() => {
  console.log('setTimeout');
}, 0);
new Promise((resolve, reject) => {
    console.log("promise ongoing")
    resolve('Promise resolved');
  }).then(res => {console.log(res); return 4})
    .then(res => console.log(res))
    .catch(err => console.log(err));
console.log('Script End');