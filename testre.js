#!/usr/bin/env node

const CHARS = ["\u002E", "\u3002", "\uFF0E", "\uFF61"];
const RE    = new RegExp(/[\u002E\u3002\uFF0E\uFF61]|%2e|%2E/, 'm');

const STATE_NULL = 0;
const STATE_ONE  = 1;
const STATE_TWO  = 2;

const Generator         = Object.getPrototypeOf(function*(){}()).constructor;
const GeneratorFunction = Generator.constructor;

function Duration() {
    if ( this instanceof Duration == false ) throw new Error('Ooops ...');
    this.btime = new Date().getMilliseconds();
}
Duration.prototype.elapsed = function (){
    let etime = new Date().getMilliseconds();
    return etime - this.btime;
};

function assert(left, right) {
    let res = false;
    if (typeof left == 'object' && typeof right == 'object' 
        && 'eq' in left == true && 'eq' in right == true) {
        res = left.eq(right);
    } else {
        res = left == right;
    }

    if ( res != true ) {
        throw new Error('AssertError');
    }
    return res;
}

Array.prototype.extend = function (b){
    let self = this;
    b.forEach(function (elem){
        self.push(elem);
    });
};
Array.prototype.clear = function (){
    let self = this;
    let idx = 0;
    while (idx < this.length){
        this.pop();
    }
};
Array.prototype.eq = function (b){
    if ( this.length != b.length ) return false;
    let idx = 0;
    while (idx < this.length) {
        let ae = this[idx];
        let be = b[idx];
        if (ae != be) {
            return false;
        }
        idx += 1;
    }
    return true;
};
String.prototype.chars = function* (){
    let idx = 0;
    while ( idx < this.length ){
        yield this[idx];
        idx += 1;
    }
};
String.prototype.forEach = function (cb){
    for (let c of this) {
        cb(c);
    }
};
String.prototype.map = function (cb){
    let res = [];
    for (let c of this) {
        res.push(cb(c));
    }
    return res;
};
String.prototype.split2 = function (cb){
    let output = [];
    let buff = "";
    for (let c of this) {
        if (cb(c) == true) {
            output.push(buff);
            buff = "";
        } else if (cb(c) == false) {
            buff += c;
        } else {
            throw new Error('Ooops ...');
        }
    }
    output.push(buff);
    return output;
};
String.prototype.replace2 = function (p, to){
    let str = this;
    while (1){
        if ( str.indexOf(p) == -1 ) {
            break;
        } else {
            str = str.replace(p, to);
        }
    }
    return str;
};
Generator.prototype.map = function (cb){
    let res = [];
    let idx = 0;
    while (1){
        let next = this.next();
        if ( next.done == true ) break;
        res.push(cb(next.value, idx));
        idx += 1;
    }
    return res;
};
Generator.prototype.forEach = function (cb){
    let idx = 0;
    while (1){
        let next = this.next();
        if ( next.done == true ) break;
        cb(next.value, idx);
        idx += 1;
    }
};


function split(input, output){
    let now = new Duration();

    let idx = 0;
    let state = STATE_NULL;
    let buff = "";
    let c = null;
    input.chars().forEach(function (c, idx){
        if (CHARS.indexOf(c) != -1) {
            output.push(buff);
            buff = "";
        } else {
            if (state == STATE_NULL) {
                if ( c == '%' ) {
                    state = STATE_ONE;
                } else {
                    buff += c;
                }
            } else if (state == STATE_ONE) {
                if ( c == '2' ) {
                    state = STATE_TWO;
                } else {
                    buff += '%' + c;
                    state = STATE_NULL;
                }
            } else if (state == STATE_TWO) {
                if ( c == 'e' || c == 'E' ) {
                    output.push(buff);
                    buff = "";
                    state = STATE_NULL;
                } else {
                    buff += '%2' + c;
                    state = STATE_NULL;
                }
            }
        }
    });

    output.push(buff);
    buff = null;
    c = null;
    state = null;
    return now.elapsed();
}

function split2(input, output){
    let now = new Duration();
    input.replace2("%2e", '.').replace2("%2E", '.')
        .split2(function (c){
            return CHARS.indexOf(c) > -1;
        })
        .forEach(function (elem){
            output.push(elem);
        });
    return now.elapsed();
}

function re_split(input, output){
    let now = new Duration();
    output.extend(input.split(RE));
    return now.elapsed();
}



function test(){
    let output = [];

    split("192.168.1.1", output);
    assert(output.eq(["192", "168", "1", "1"]), true);

    output.clear();
    split("..", output);
    assert(output.eq(["", "", ""]), true);

    output.clear();
    split("192%2e168%2e1%2e1", output);
    assert(output.eq(["192","168","1","1"]), true);
    
    output.clear();
    split("asdf", output);
    assert(output.eq(["asdf"]), true);

    // TODO: Add more test case ...
    
    console.log("[TEST] ok");
}

function bench(){
    console.error("[ERROR] unimplemented!")
}


function run(input){
    let output = [];
    console.log("Input: \"" + input + "\"");

    let duration1 = split(input, output);
    console.log("[  Split] output: " + JSON.stringify(output) + " Duration: " + duration1 );

    output.clear();
    let duration2 = split2(input, output);
    console.log("[ Split2] output: " + JSON.stringify(output) + " Duration: " + duration2 );

    output.clear();
    let duration3 = re_split(input, output);
    console.log("[ReSplit] output: " + JSON.stringify(output) + " Duration: " + duration3 );

    console.log("");
}


function usage(){
    console.log("usage:")
    console.log("\t$ node testre.js run")
    console.log("\t$ node testre.js test")
    console.log("\t$ node testre.js bench")
}

function main (){
    let argv = process.argv.splice(2, process.argv.length);
    if ( argv.length < 1 ) {
        return usage();
    }
    let cmd = argv[0];
    if (cmd == 'run'){
        return [
            "192.168.1.1", "..", "192%2e168%2e1%2e1", "asdf", 
            "192.39%2e1%2E1", "as\uFF61awe.a3r23.lkajsf0ijr....",
            "%2e%2easdf", "sdoijf%2e", "ksjdfh.asdfkj.we%2", 
            "0xc0%2e0x00%2e0x02%2e0xeb", ""
        ].forEach(function (input){
            run(input);
        });
    } else if (cmd == 'test') {
        return test();
    } else if (cmd == 'bench') {
        return bench();
    }
}

main();
