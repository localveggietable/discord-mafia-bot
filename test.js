import EventEmitter from "events";
var e = new EventEmitter();

e.on("event1", () => {
    e.emit("event2");

    for (let i = 50; i < 100; ++i){
        console.log(i);
    }
});

e.on("event2", ()=> {
    for (let i = 1; i < 50; ++i){
        console.log(i);
    }
});

e.emit("event1");

var p1 = new Promise(resolve => {
    for (let i = 0; i < 100; ++i){
        console.log(i);
    } 

    resolve("third");
});

console.log(p1);

var p2 = new Promise(resolve => {
    console.log("first");
    setTimeout(() => {
        console.log("second-to-last")
        resolve("last");
    }, 0);
});

p1.then(value=>{console.log(value)});
p2.then(value=>{console.log(value)});


console.log("second");


