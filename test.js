
import { EventEmitter } from 'node:events';
import {promisify} from "util";

const delay = promisify(setTimeout);

var e1 = new EventEmitter();


e1.on("event1", () => {
    const interval = setInterval(async ()=>{
        console.log("evet1");
        await delay(1000);
        clearInterval(interval);
    }, 500);
});

const interval = setInterval(async ()=>{
    console.log("evet1");
    await delay(1000);
    clearInterval(interval);
}, 500);

setInterval(function() {
    let curr = new Date;
    while(new Date() - curr <= 5000);
    console.log('done');
}, 4000);

await delay(10);
console.log("done");