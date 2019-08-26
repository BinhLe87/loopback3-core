'use strict';

var myMap = new Map();

myMap.set('ten', 'binh');
myMap.set('tuoi', 30);

myMap.forEach((value, key) => {

    console.log(`${value}:${key}`);
})
