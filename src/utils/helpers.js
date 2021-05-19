//https://github.com/soundstep/magic-xylophone/blob/master/app/js/app.js
function fastAbs(value) {
    // funky bitwise, equal Math.abs
    return (value ^ (value >> 31)) - (value >> 31);
}
function threshold(value) {
    return (value > 0x15) ? 0xFF : 0;
}

function difference(target, data1, data2) {
    // blend mode difference
    if (data1.length != data2.length) return null;
    var i = 0;
    while (i < (data1.length * 0.25)) {
        target[4*i] = data1[4*i] == 0 ? 0 : fastAbs(data1[4*i] - data2[4*i]);
        target[4*i+1] = data1[4*i+1] == 0 ? 0 : fastAbs(data1[4*i+1] - data2[4*i+1]);
        target[4*i+2] = data1[4*i+2] == 0 ? 0 : fastAbs(data1[4*i+2] - data2[4*i+2]);
        target[4*i+3] = 0xFF;
        ++i;
    }
}

function differenceAccuracy(target, data1, data2) {
    if (data1.length != data2.length) return null;
    var i = 0;
    while (i < (data1.length * 0.25)) {
        var average1 = (data1[4*i] + data1[4*i+1] + data1[4*i+2]) / 3;
        var average2 = (data2[4*i] + data2[4*i+1] + data2[4*i+2]) / 3;
        var diff = threshold(fastAbs(average1 - average2)); // 0xFF or 0
        target[4*i] = diff; // R
        target[4*i+1] = diff; // G
        target[4*i+2] = diff; // B
        target[4*i+3] = 0xFF; // alpha
        ++i;
    }
}

// customise for telemotion
const getColumnQoM = (data1, data2, cols, width) => {
    let n = cols.length;
    for (let i = 0; i < data1.length; i += 4) {
        // let isTopHalf = i < data1.length / 2;
        let colW = width * 4 / n;
        let whichColumn = Math.floor((i % (width * 4)) / colW) // remainder: 12 % 5 === 2
        let avg1 = (data1[i] + data1[i+1] + data1[i+2]) / 3;
        let avg2 = (data2[i] + data2[i+1] + data2[i+2]) / 3;
        cols[whichColumn] += fastAbs(avg1 - avg2);
    }
}

export {fastAbs, threshold, difference, differenceAccuracy, getColumnQoM}