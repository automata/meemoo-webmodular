var samplerate;
var stereo = 1;
var audioif;
var audiomix;
var outbufsize = 1024;
var outbufsize2 = outbufsize * 2;
var outquenum = 5;
var app;
var ctx;
var imgpanel;
var imgknobs = new Array();
var mouseX, mouseY;
var jinum = jonum = 0;
var colnum = 0;
//var cablecol = [0xcc0000, 0xcc4400, 0xcc8800, 0xcccc00, 0x88cc00, 0x44cc00, 0x00cc00, 0x00cc44, 0x00cc88,
//             0x00cccc, 0x0088cc, 0x0044cc, 0x0000cc, 0x4400cc, 0x8800cc, 0xcc00cc, 0xcc0088, 0xcc0044, ];
var cablecol = [0xcc0000, 0x00cccc, 0xcc4400, 0x0088cc, 0xcc8800, 0x0044cc, 0xcccc00, 0x0000cc, 0x88cc00, 0x4400cc, 0x44cc00, 0x8800cc, 0x00cc00, 0xcc00cc, 0x00cc44, 0xcc0088, 0x00cc88, 0xcc0044, ];

// window.addEventListener("message", webMidiLinkRecv, false);
// function webMidiLinkRecv(event) {
//     var msg = event.data.split(",");
//     switch (msg[0]) {
//         case "midi":
//             switch (parseInt(msg[1], 16) & 0xf0) {
//                 case 0x80:
//                     app.keyboard.key.NoteOff(parseInt(msg[2], 16));
//                     break;
//                 case 0x90:
//                     var velo = parseInt(msg[3], 16);
//                     if (velo > 0)
//                         app.keyboard.key.NoteOn(parseInt(msg[2], 16), velo);
//                     else
//                         app.keyboard.key.NoteOff(parseInt(msg[2], 16));
//                     break;
//                 case 0xb0:
//                     if (parseInt(msg[2], 16) == 0x78) {
//                         app.keyboard.key.AllOff();
//                     }
//                     break;
//             }
//             break;
//     }
// }

function getXY(e) {
    var rc = e.target.getBoundingClientRect();
    mouseX = Math.floor(e.clientX - rc.left);
    mouseY = Math.floor(e.clientY - rc.top);
    if (mouseX < 0) mouseX = 0;
    if (mouseY < 0) mouseY = 0;
}
function Rect(x, y, w, h) {
    this.ty = 10000;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.Draw = function() {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";
        ctx.strokeRect(x, y, w, h);
    }
    this.MouseDown = function(x,y) {
    }
    this.MouseMove = function(x,y) {
    }
    this.MouseUp = function(x,y) {
    }
}
function Jack(x, y, ty,col) {
    this.ty = ty;
    this.x = x;
    this.y = y;
    this.w = 16;
    this.h = 16;
    this.connect = null;
    this.fanout = 0;
    if (ty == 0)
        this.pnum = jinum++;
    else
        this.pnum = jonum++;
    this.col = cablecol[colnum];
    if (ty == 0) {
        if (++colnum >= 18)
            colnum = 0;
    }
    if (ty != 0) {
        try {
            this.buf = new Float32Array(128);
        } catch (e) {
            this.buf = new Array(128);
        }
        for (var i = 0; i < 128; ++i)
            this.buf[i] = 0;
    }
    this.Draw = function() {
        if (typeof (gadget) != "undefined")
            return;
        if (this.connect != null) {
            this.Cable(this, this.connect.x + 8, this.connect.y + 12, this.col, 0);
        }
    }
    this.FillBuf = function(v) {
        var out = this.buf;
        for (var i = 0; i < 128; ++i)
            out[i] = v;
    }
    this.Connect = function(jck) {
        var jIn = this;
        var jOut = jck;
        if (this.ty != 0) {
            jIn = jck;
            jOut = this;
        }
        if (jIn.connect != null) {
            if (jIn.connect.fanout > 0)
                --(jIn.connect.fanout);
        }
        jIn.connect = jOut;
        if (jOut != null)
            ++jOut.fanout;
    }
    this.Cable = function(j, x, y, col, f) {
        var mx = (j.x + 8 + x) / 2;
        var my = Math.max(j.y+12, y)+40;
        ctx.beginPath();
        ctx.moveTo(j.x + 8, j.y+12);
        ctx.bezierCurveTo(mx, my, mx, my, x, y);

        var r = (col >> 16) & 0xff;
        var g = (col >> 8) & 0xff;
        var b = col & 0xff;
        for (var i = 3; i; --i) {
            ctx.strokeStyle = "#" + ("000000" + ((r << 16) + (g << 8) + b).toString(16)).slice(-6);
            if (r < 200)
                r += Math.floor((200 - r) / 3);
            if (g < 200)
                g += Math.floor((200 - g) / 3);
            if (b < 200)
                b += Math.floor((200 - b) / 3);
            ctx.lineWidth = i;
            ctx.lineCap = "round";
            ctx.stroke();
        }
        switch (f) {
            case 1:
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#00ff00";
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2, true);
                ctx.stroke();
                break;
            case 2:
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#ff0000";
                ctx.beginPath();
                ctx.moveTo(x - 8, y - 8);
                ctx.lineTo(x + 8, y + 8);
                ctx.moveTo(x + 8, y - 8);
                ctx.lineTo(x - 8, y + 8);
                ctx.stroke();
                break;
        }
    }
    this.MouseDown = function(x,y) {
    }
    this.MouseMove = function(x,y) {
    }
    this.MouseUp = function(x,y) {
    }
}
function Knob(x, y, w, h, img, step, def) {
    this.ty = 100;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.x0 = 0;
    this.y0 = 0;
    this.v0 = 0;
    this.img = img;
    this.step = step;
    this.val = def;
    this.Draw = function() {
        if (typeof (gadget) != "undefined" || imgknobs[img] == undefined)
            return;
        var n = Math.floor(this.val * step);
        if (this.val == 1)
            --n;
        ctx.drawImage(imgknobs[img], 0, n * h, w, h, this.x, this.y, w, h);
    }
    this.Set = function(v) {
        if (v < 0)
            v = 0;
        if (v > 1)
            v = 1;
        if (this.step > 1)
            v = Math.floor(v * (this.step - 1)) / (this.step - 1);
        this.val = v;
    }
    this.MouseDown = function(x, y) {
        this.x0 = x;
        this.y0 = y;
        this.v0 = this.val;
    }
    this.MouseMove = function(x, y) {
        if (typeof (gadget) != "undefined")
            return;
        this.Set(this.v0 + (x - this.x0 - y + this.y0) * 0.01);
        this.Draw();
    }
    this.MouseUp = function(x, y) {
    }
}
function Switch(x, y, w, h, img, step, def) {
    this.ty = 102;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.img = img;
    this.step = step;
    this.val = def;
    this.Draw = function() {
        if (typeof (gadget) != "undefined" || imgknobs[img] == undefined)
            return;
        var n = Math.floor(this.val * this.step);
        if (this.val == 1)
            --n;
        ctx.drawImage(imgknobs[img], 0, n * this.h, this.w, this.h, this.x, this.y, this.w, this.h);
    }
    this.Set = function(v) {
        if (v < 0)
            v = 0;
        if (v > 1)
            v = 1;
        this.val = v;
    }
    this.MouseDown = function(x, y) {
        this.MouseMove(x, y);
    }
    this.MouseMove = function(x, y) {
        if (typeof (gadget) != "undefined")
            return;
        this.Set(Math.floor((1 - (y - this.y) / this.h) * this.step) / (this.step - 1));
        this.Draw();
    }
    this.MouseUp = function(x, y) {
    }
}
function Slider(x, y,def) {
    this.ty = 101;
    this.x = x;
    this.y = y;
    this.w = 16;
    this.h = 65;
    this.val = def;
    this.vala = (Math.pow(1000, this.val) - 1) * 0.0001;
    this.v0 = 0;
    this.x0 = 0;
    this.y0 = 0;
    this.Draw = function() {
        if (typeof (gadget) != "undefined")
            return;
        ctx.drawImage(imgknobs["slider"], this.x, this.y + 50 - this.val * 50);
    }
    this.Set=function(v) {
        if (v < 0)
            v = 0;
        if (v > 1)
            v = 1;
        this.val = v;
        this.vala = (Math.pow(100, this.val) - 1) * 0.04;
    }
    this.MouseDown = function(x, y) {
        this.x0 = x;
        this.y0 = y;
        this.v0 = this.val;
    }
    this.MouseMove = function(x, y) {
        if (typeof (gadget) != "undefined")
            return;
        this.Set(this.v0 + (this.y0 - y) * 0.01);
        this.Draw();
    }
    this.MouseUp = function(x,y) {
    }
}
var cnt = 0;
function Key(x, y) {
    this.ty = 900;
    this.x = x;
    this.y = y;
    if (typeof(gadget) == "undefined")
        this.w = 448;
    else
        this.w = 272;
    this.h = 64;
    this.gate = 0;
    this.cv = 0;
    this.retrig = 0;
    this.lastn = -1;
    this.table = [
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,12,-1,-1,-1,
        27, -1, 13, 15, -1, 18, 20, 22, -1, 25, -1, -1, -1, -1, -1, -1,
        -1, -1, 7, 4, 3, 16, -1, 6, 8, 24, 10, -1, 13, 11, 9, 26,
        28, 12,17,1,19,23,5,14,2,21,0,-1,-1,-1,-1,-1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 15, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 12, -1, 14, -1,
    ];
    this.press = new Array();
    this.Draw = function() {
    }
    this.KeyPosX = function(n) {
        return Math.floor(n / 12) * 112 + [0, 12, 16, 28, 32, 48, 60, 64, 76, 80, 92, 96][n % 12];
    }
    this.KeyPosY = function(n) {
        return [40, 0, 40, 0, 40, 40, 0, 40, 0, 40, 0, 40][n % 12];
    }
    this.DrawKey = function(n) {
        //        if (this.lastn != n) {
        var nmax = 48;
        if (typeof (gadget) != "undefined")
            nmax = 29;
        ctx.drawImage(imgpanel, this.x, this.y, this.w, this.h, this.x, this.y, this.w, this.h);
        if (n >= 0 && n < nmax) {
            var y = this.KeyPosY(n);
            var w = (y != 0) ? 16 : 8;
            var h = (y != 0) ? 24 : 40;
            ctx.drawImage(imgknobs["keypress"], this.KeyPosX(n), y, w, h, this.x + this.KeyPosX(n), this.y + y, w, h);
        }
        this.lastn = n;
        //        }
    }
    this.MouseDown = function(x, y) {
        this.gate = 1;
        this.MouseMove(x, y);
    }
    this.MouseMove = function(x, y) {
        var n;
        x = (x - this.x);
        if (y >= this.y + 40) {
            x = Math.floor(x / 16);
            if (x < 0)
                x = 0;
            if (x >= 28)
                x = 27;
            n = Math.floor(x / 7) * 12 + [0, 2, 4, 5, 7, 9, 11][x % 7];
        }
        else {
            var xx = x + 5;
            if (xx % 16 < 10) {
                var xxx = Math.floor(xx / 16) % 7;
                if (xxx == 1 || xxx == 2 || xxx == 4 || xxx == 5 | xxx == 6) {
                    x = Math.floor(x / 16);
                    n = Math.floor(x / 7) * 12 + [0, 1, 3, 0, 6, 8, 10][xxx];
                    this.cv = n / 12 * 0.2;
                    this.DrawKey(n);
                    return;
                }
            }
            x = Math.floor(x / 16);
            if (x < 0)
                x = 0;
            if (x >= 28)
                x = 27;
        }
        n = Math.floor(x / 7) * 12 + [0, 2, 4, 5, 7, 9, 11][x % 7];
        this.cv = n / 12 * 0.2;
        if (this.lastn >= 0 && n >= 0 && n != this.lastn)
            this.retrig = 1;
        this.DrawKey(n);
    }
    this.MouseUp = function(x, y) {
        this.gate = 0;
        this.DrawKey(-1);
    }
    this.AllOff = function() {
        this.press.length = 0;
        this.gate = 0;
        this.DrawKey(-1);
    }
    this.NoteOn = function(n,v) {
        for (var i = 0; i < this.press.length; ++i) {
            if (this.press[i] == n)
                break;
        }
        if (i == this.press.length) {
            this.gate = 1;
            this.retrig = 1;
            n -= 36;
            this.cv = n / 60;
            this.DrawKey(n);
        }
    }
    this.NoteOff = function(n) {
        for (var i = 0; i < this.press.length; ++i) {
            if (this.press[i] == n) {
                this.press.splice(i, 1);
                break;
            }
        }
        if (this.press.length == 0) {
            this.gate = 0;
            this.DrawKey(-1);
        }
        else {
            n = this.press[0] - 36;
            this.cv = n / 60;
            this.DrawKey(n);
        }
    }
    this.KeyPress = function(c, f) {
        if (f) {
            if (c >= 0x20 && c <= 0xbf) {
                var n = this.table[c - 0x20];
                if (n >= 0) {
                    for (var i = 0; i < this.press.length; ++i) {
                        if (this.press[i] == c)
                            break;
                    }
                    if (i == this.press.length) {
                        this.press.unshift(c);
                        this.gate = 1;
                        this.retrig = 1;
                        this.cv = n / 60;
                        this.DrawKey(n);
                    }
                }
            }
        }
        else {
            for (var i = 0; i < this.press.length; ++i) {
                if (this.press[i] == c) {
                    this.press.splice(i, 1);
                    break;
                }
            }
            if (this.press.length == 0) {
                this.gate = 0;
                this.DrawKey(-1);
            }
            else {
                var n = this.table[this.press[0] - 0x20];
                this.cv = n / 60;
                this.DrawKey(n);
            }
        }
    }
}
function Knobs() {
    this.drag = null;
    this.knobs = new Array();
    this.AddRect = function(name, x, y, w, h) {
        this.knobs[name] = new Rect(x, y, w, h);
        return this.knobs[name];
    }
    this.AddJack = function(name, x, y,ty,col) {
        this.knobs[name] = new Jack(x, y,ty,col);
        return this.knobs[name];
    }
    this.AddKnob = function(name, x, y, w,h,img, step,def) {
        this.knobs[name] = new Knob(x, y, w,h,img,step,def);
        return this.knobs[name];
    }
    this.AddSwitch = function(name, x, y,w,h,img,step,def) {
        this.knobs[name] = new Switch(x,y,w,h,img,step,def);
        return this.knobs[name];
    }
    this.AddSlider = function(name, x, y, def) {
        this.knobs[name] = new Slider(x, y, def);
        return this.knobs[name];
    }
    this.AddKey = function(name, x, y) {
        this.knobs[name] = new Key(x, y);
        return this.knobs[name];
    }
    this.MouseDown = function(x, y) {
        this.drag = this.HitTest(x, y);
        if (this.drag != null)
            this.drag.MouseDown(x, y);
    }
    this.MouseMove = function(x, y) {
        if (this.drag != null) {
            app.Draw();
            this.drag.MouseMove(x, y);
        }
    }
    this.MouseUp = function(x, y) {
        var wd = this.HitTest(x, y);
        if (this.drag != null) {
            if (wd != null) {
                if (wd.ty == 0 && (this.drag.ty == 1 || this.drag.ty == 2)) {
                    wd.Connect(this.drag);
                }
                if ((wd.ty == 1 || wd.ty == 2) && this.drag.ty == 0) {
                    this.drag.Connect(wd);
                }
            }
            if (this.drag.ty == 0) {
                if(wd==null || (wd.ty!=1 && wd.ty!=2))
                    this.drag.Connect(null);
            }
            this.drag.MouseUp(x, y);
        }
        this.drag = null;
        app.Draw();
    }
    this.HitTest = function(x, y) {
        var wd, r;
        r = null;
        for (var i in this.knobs) {
            var wd = this.knobs[i];
            if (x >= wd.x && x < wd.x + wd.w && y >= wd.y && y < wd.y + wd.h) {
                if (wd.ty < 1000)
                    r = wd;
            }
        }
        return r;
    }
    this.Draw = function() {
        for (var i in this.knobs) {
            if (this.knobs[i].ty >= 100)
                this.knobs[i].Draw();
        }
        for (var i in this.knobs) {
            if (this.knobs[i].ty < 100)
                this.knobs[i].Draw();
        }
        if (this.drag != null && this.drag.ty < 100) {
            var wd = this.HitTest(mouseX, mouseY);
            var f = 0;
            if (wd != null && wd.ty < 100) {
                if ((this.drag.ty == 0 && wd.ty != 0) || (this.drag.ty != 0 && wd.ty == 0))
                    f = 1;
                else
                    f = 2;
            }
            this.drag.Cable(this.drag, mouseX, mouseY, 0x808080, f);
        }
    }
}
function Keyboard(name, x, y) {
    this.str = "";
    this.start = 0;
    this.tempo = 120;
    this.deflen = 8;
    this.oct = 3;
    this.index = 0;
    this.dur = 0;
    this.gt = 0;
    this.cvcur = 0;
    this.cvlog = 0;
    this.jckCv = app.knobs.AddJack(name + ".cv", x + 24, y + 8, 2,0x600000);
    this.jckGate = app.knobs.AddJack(name + ".g", x + 60, y + 8, 2, 0x700000);
    this.knbGlide = app.knobs.AddKnob(name + ".gl", x + 484, y + 36, 32, 32, "knob", 51, 0);
    if (typeof (gadget) != "undefined")
        this.key = app.knobs.AddKey(name + ".k", x, y);
    else
        this.key = app.knobs.AddKey(name + ".k", x + 24, y + 48);
    this.SetStr=function(s) {
        this.str=s;
    }
    this.Start = function(v) {
        this.jckGate.buf[0] = 0;
        this.tempo = 120;
        this.deflen = 8;
        this.oct = 3;
        this.index = 0;
        this.start = v;
        if (v == 0)
            this.key.DrawKey(-1);
    }
    this.GetNum=function() {
        var n = 0;
        while (this.str[this.index] >= '0' && this.str[this.index] <= '9') {
            n = n * 10 + parseInt(this.str[this.index]);
            ++this.index;
        }
        return n;
    }
    this.Note = function(n) {
        ++this.index;
        var n2 = n;
        while (1) {
            switch (this.str[this.index]) {
                case '+':
                case '#':
                    ++n2;
                    ++this.index;
                    break;
                case '-':
                    --n2;
                    ++this.index;
                    break;
                default:
                    var len;
                    len = this.GetNum();
                    if (len <= 0)
                        len = this.deflen;
                    var len2 = len;
                    while (this.str[this.index] == '.') {
                        ++this.index;
                        len2 = len / 2;
                        len += len2;
                    }
                    var st = 240 / (this.tempo * len);
                    if (this.str[this.index] == '&') {
                        ++this.index;
                        this.gt = st;
                    }
                    else
                        this.gt = st * 0.8;
                    this.dur += st;
                    if (n >= 0) {
                        var nn = (this.oct - 2) * 12 + n2;
                        var v = n / 12 * 0.2;
                        if (v < 0)
                            v = 0;
                        if (v > 2)
                            v = 2;
                        this.cvlog=(nn / 12 * 0.2);
                        this.jckGate.FillBuf(1);
                        this.key.DrawKey(nn);
                    }
                    else {
                        this.jckGate.FillBuf(0);
                        this.gt = 0;
                        this.key.DrawKey(-1);
                    }
                    return;
            }
        }
    }
    this.OutCv = function() {
        var diff = Math.abs(this.cvlog - this.cvcur);
        var ratio = 1;
        if (this.knbGlide.val != 0) {
            ratio = Math.pow(100, this.knbGlide.val) * 0.000078125 * samplerate;
            ratio = 1 - Math.exp(Math.log(0.01) / ratio);
        }
        if (diff < 1e-10)
            this.cvcur = this.cvlog;
        else
            this.cvcur += (this.cvlog - this.cvcur) * ratio;
        this.jckCv.FillBuf(this.cvcur);
    }
    this.Process = function() {
        if (this.start == 0) {
            if (this.key.gate != 0) {
                if (this.key.retrig)
                    this.jckGate.FillBuf(0);
                else
                    this.jckGate.FillBuf(1);
                this.cvlog = this.key.cv;
            }
            else
                this.jckGate.FillBuf(0);
            this.OutCv();
            this.key.retrig = 0;
            return;
        }
        this.key.retrig = 0;
        if (this.dur > 0) {
            this.dur -= 128 / samplerate;
        }
        if (this.gt > 0) {
            if ((this.gt -= 128 / samplerate) <= 0) {
                this.gt = 0;
                this.jckGate.FillBuf(0);
            }
        }
        while (this.dur <= 0) {
            if (this.index >= this.str.length)
                break;
            switch (this.str[this.index]) {
                case 'T':
                case 't':
                    ++this.index;
                    this.tempo = this.GetNum();
                    if (this.tempo <= 0)
                        this.tempo = 120;
                    break;
                case 'V':
                    ++this.index;
                    this.GetNum();
                    break;
                case 'L':
                case 'l':
                    ++this.index;
                    this.deflen = this.GetNum();
                    break;
                case '>':
                    ++this.index;
                    ++this.oct;
                    break;
                case '<':
                    ++this.index;
                    --this.oct;
                    break;
                case 'O':
                case 'o':
                    ++this.index;
                    this.oct = this.GetNum();
                    break;
                case 'R':
                case 'r':
                    this.Note(-1);
                    break;
                case 'C':
                case 'c':
                    this.Note(0);
                    break;
                case 'D':
                case 'd':
                    this.Note(2);
                    break;
                case 'E':
                case 'e':
                    this.Note(4);
                    break;
                case 'F':
                case 'f':
                    this.Note(5);
                    break;
                case 'G':
                case 'g':
                    this.Note(7);
                    break;
                case 'A':
                case 'a':
                    this.Note(9);
                    break;
                case 'B':
                case 'b':
                    this.Note(11);
                    break;
                default:
                    ++this.index;
                    break;
            }
        }
        this.OutCv();
        if (this.index >= this.str.length) {
            this.tempo = 120;
            this.deflen = 8;
            this.oct = 3;
            this.index = 0;
        }
    }
}
function Mix(name, x, y) {
    try {
        this.buf = new Float32Array(128);
    } catch(e) {
        this.buf=new Array(128);
    }
    this.jckIn1 = app.knobs.AddJack(name + ".i1", x + 8, y+52, 0,0x005000);
    this.jckIn2 = app.knobs.AddJack(name + ".i2", x + 28, y+52, 0,0x006000);
    this.jckIn3 = app.knobs.AddJack(name + ".i3", x + 48, y+52, 0,0x007000);
    this.jckIn4 = app.knobs.AddJack(name + ".i4", x + 68, y+52, 0,0x008000);
    this.sliIn1 = app.knobs.AddSlider(name + ".i1m", x + 8, y+72, 0.8);
    this.sliIn2 = app.knobs.AddSlider(name + ".i2m", x + 28, y+72, 0.8);
    this.sliIn3 = app.knobs.AddSlider(name + ".i3m", x + 48, y+72, 0);
    this.sliIn4 = app.knobs.AddSlider(name + ".i4m", x + 68, y+72, 0);
    this.Process = function() {
        for (var i = 0; i < 128; ++i) {
            this.buf[i] = 1e-100;
        }
        if (this.jckIn1.connect) {
            var vala = this.sliIn1.vala;
            for (var i = 0; i < 128; ++i)
                this.buf[i] += this.jckIn1.connect.buf[i] * vala;
        }
        if (this.jckIn2.connect) {
            var vala = this.sliIn2.vala;
            for (var i = 0; i < 128; ++i)
                this.buf[i] += this.jckIn2.connect.buf[i] * vala;
        }
        if (this.jckIn3.connect) {
            var vala = this.sliIn3.vala;
            for (var i = 0; i < 128; ++i)
                this.buf[i] += this.jckIn3.connect.buf[i] * vala;
        }
        if (this.jckIn4.connect) {
            var vala = this.sliIn4.vala;
            for (var i = 0; i < 128; ++i)
                this.buf[i] += this.jckIn4.connect.buf[i] * vala;
        }
    }
}
function Ring(name, x, y) {
    this.jckIn1 = app.knobs.AddJack(name + ".i1", x+8, y + 0, 0,0x009000);
    this.jckIn2 = app.knobs.AddJack(name + ".i2", x+32, y + 0, 0,0x00a000);
    this.jckOut = app.knobs.AddJack(name + ".o", x + 68, y + 0, 1,0x800000);
    this.Process = function() {
        if (this.jckOut.fanout > 0) {
            var out = this.jckOut.buf;
            if (this.jckIn1.connect && this.jckIn2.connect) {
                var in1 = this.jckIn1.connect.buf;
                var in2 = this.jckIn2.connect.buf;
                for (var i = 0; i < 128; ++i)
                    out[i] = in1[i] * in2[i];
            }
            else {
                for (var i = 0; i < 128; ++i)
                    out[i] = 0;
            }
        }
    }
}
function Noise(name, x, y) {
    this.jckOut = app.knobs.AddJack(name + ".o", x + 68, y + 0, 1,0x900000);
    this.Process = function() {
        if (this.jckOut.fanout > 0) {
            var out = this.jckOut.buf;
            for (var i = 0; i < 128; ++i)
                out[i] = Math.random()*2 - 1;
        }
    }
}
function SH(name, x, y) {
    this.hold = 0;
    this.trlast = 0;
    this.jckIn = app.knobs.AddJack(name + ".i", x + 8, y + 0, 0,0x009000);
    this.jckTr = app.knobs.AddJack(name + ".tr", x + 32, y + 0, 0,0x00a000);
    this.jckOut = app.knobs.AddJack(name + ".o", x + 68, y + 0, 1,0x990000);
    this.Process = function() {
        if (this.jckOut.fanout > 0) {
            var out = this.jckOut.buf;
            var hold = this.hold;
            if (this.jckTr.connect != null) {
                var tr = this.jckTr.connect.buf[0];
                if (tr > 0 && this.trlast <= 0) {
                    if (this.jckIn.connect != null)
                        this.hold = this.jckIn.connect.buf[0];
                    else
                        this.hold = 0;
                }
                this.trlast = tr;
            }
            for (var i = 0; i < 128; ++i)
                out[i] = hold;
        }
    }
}
function Env(name, x, y) {
    this.jckOutP = app.knobs.AddJack(name + ".op", x + 68, y + 120, 2,0xb00000);
    this.jckOutN = app.knobs.AddJack(name + ".on", x + 40, y + 120, 2,0xc00000);
    this.jckTrig = app.knobs.AddJack(name + ".tr", x + 8, y + 120, 0,0);
    this.sliA = app.knobs.AddSlider(name + ".a", x + 8, y + 28, 0);
    this.sliD = app.knobs.AddSlider(name + ".d", x + 28, y + 28, 0);
    this.sliS = app.knobs.AddSlider(name + ".s", x + 48, y + 28, 1);
    this.sliR = app.knobs.AddSlider(name + ".r", x + 68, y + 28, 0);
    this.phase = 0;
    this.val = 0;
    this.Process = function() {
        if (this.jckTrig.connect == null) {
            this.jckOutP.buf[0] = this.jckOutN.buf[0] = 0;
            this.phase = this.val = 0;
            return;
        }
        var n = 128 / samplerate;
        var ratea = n / (Math.pow(1000, this.sliA.val) * 0.001);
        var rated = Math.pow(10, -2 / ((Math.pow(1000, this.sliD.val) * 0.01) / n));
        var rater = Math.pow(10, -2 / ((Math.pow(1000, this.sliR.val) * 0.01) / n));
        switch (this.phase) {
            case 0:
                if (this.jckTrig.connect.buf[0] > 0)
                    this.phase = 1;
                else {
                    if (this.val > this.sliS.val) {
                        this.val = this.sliS.val + (this.val - this.sliS.val) * rated;
                    }
                    this.val *= rater;
                    if (this.val < 0.00001)
                        this.val = 0;
                }
                break;
            case 1:
                if (this.jckTrig.connect.buf[0] > 0) {
                    if ((this.val += ratea) >= 1) {
                        this.val = 1;
                        this.phase = 2;
                    }
                }
                else {
                    this.phase = 0;
                }
                break;
            case 2:
                if (this.jckTrig.connect.buf[0] > 0) {
                    this.val = this.sliS.val + (this.val - this.sliS.val) * rated;
                }
                else
                    this.phase = 0;
                break;
        }
        var xxp = this.val;
        var xxn = -this.val;
        for (var i = 0; i < 128; ++i) {
            this.jckOutP.buf[i] = xxp;
            this.jckOutN.buf[i] = xxn;
        }
    }
}
function Lfo(name, x, y) {
    this.jckOut = app.knobs.AddJack(name + ".o", x + 68, y + 20, 2,0x880000);
    this.jckOut10 = app.knobs.AddJack(name + ".o10", x + 40, y + 20, 2,0x990000);
    this.knbForm = app.knobs.AddSwitch(name + ".form", x + 8, y + 64, 16, 40, "sw3", 3, 1);
    this.knbFreq = app.knobs.AddKnob(name + ".f", x + 48, y + 68, 32, 32, "knob", 51, 0.5);
    this.phase = 0;
    this.Process = function() {
        var f = Math.pow(1000, this.knbFreq.val) * 0.1;
        this.phase += f * 128 / samplerate;
        if (this.phase >= 1)
            this.phase -= 1;
        var x, mul0, mul1, add0, add1;
        switch (this.knbForm.val) {
            case 1:
                mul0 = 4;
                mul1 = -4;
                add0 = -1;
                add1 = 3;
                break;
            case 0.5:
                mul0 = mul1 = 2;
                add0 = add1 = -1;
                break;
            case 0:
                mul0 = mul1 = 0;
                add0 = -1;
                add1 = 1;
                break;
        }
        if (this.phase >= 0.5)
            x = this.phase * mul1 + add1;
        else
            x = this.phase * mul0 + add0;
        var xx = x;
        var xx10 = x * 0.1;
        for (var i = 0; i < 128; ++i) {
            this.jckOut.buf[i] = xx;
            this.jckOut10.buf[0] = xx10;
        }
    }
}
function Vco(name, x, y, oct, pit) {
    this.jckPwm = app.knobs.AddJack(name + ".ipw", x + 8, y + 52, 0, 0x007700);
    this.jckOut = app.knobs.AddJack(name + ".o", x + 48, y + 52, 1, 0xf00000);
    this.sliPwm = app.knobs.AddSlider(name + ".pwm", x + 8, y + 72, 0);
    this.sliPw = app.knobs.AddSlider(name + ".pw", x + 28, y + 72, 0);
    this.knbOct = app.knobs.AddSwitch(name + ".oct", x + 8, y + 168, 16, 40, "sw5", 5, oct);
    this.knbForm = app.knobs.AddSwitch(name + ".form", x + 40, y + 168, 16, 40, "sw3", 3, 0.5);
    this.knbCoarse = app.knobs.AddKnob(name + ".co", x + 8, y + 236, 40, 40, "knob2", 25, 0.5);
    this.knbPitch = app.knobs.AddKnob(name + ".pi", x + 16, y + 244, 24, 24, "knob3", 51, pit);
    this.sliMod1 = app.knobs.AddSlider(name + ".m1m", x + 8, y + 280, 1);
    this.sliMod2 = app.knobs.AddSlider(name + ".m2m", x + 28, y + 280, 0.1);
    this.sliMod3 = app.knobs.AddSlider(name + ".m3m", x + 48, y + 280, 0);
    this.jckMod1 = app.knobs.AddJack(name + ".m1", x + 8, y + 348, 0);
    this.jckMod2 = app.knobs.AddJack(name + ".m2", x + 28, y + 348, 0);
    this.jckMod3 = app.knobs.AddJack(name + ".m3", x + 48, y + 348, 0);
    this.phase = 0;
    this.freq = 0;
    this.delta = 0;
    this.cpw = 0;
    this.rcpw = 1;
    this.Process = function() {
        if (this.jckOut.fanout <= 0)
            return;
        var cv;
        cv = (this.knbOct.val - 0.5) * (this.knbOct.step - 1) * 0.2 + (this.knbCoarse.val - 0.5) * 0.4 + (this.knbPitch.val - 0.5) * 0.4 / 12;
        if (this.jckMod1.connect)
            cv += this.jckMod1.connect.buf[0] * this.sliMod1.val;
        if (this.jckMod2.connect)
            cv += this.jckMod2.connect.buf[0] * this.sliMod2.val;
        if (this.jckMod3.connect)
            cv += this.jckMod3.connect.buf[0] * this.sliMod3.val;
        this.freq = 130.8127826502993 * Math.pow(2, cv * 5);
        this.delta = this.freq / samplerate;
        if (this.delta > 1)
            this.delta = 1;
        var cpw = this.sliPw.val;
        if (this.jckPwm.connect)
            cpw += this.jckPwm.connect.buf[0] * this.sliPwm.val;
        if (cpw < 0)
            cpw = -cpw;
        if (cpw > 0.95)
            cpw = 0.95;
        var rcpw = 1 / (1 - cpw);
        var mul0, mul1, add0, add1;
        switch (this.knbForm.val) {
            case 1:
                mul0 = 4;
                add0 = -1;
                mul1 = -4;
                add1 = 3;
                break;
            case 0.5:
                mul0 = mul1 = 2;
                add0 = add1 = -1;
                break;
            case 0:
                mul0 = mul1 = 0;
                add0 = -1;
                add1 = 1;
                break;
        }
        var x;
        var out = this.jckOut.buf;
        for (var i = 0; i < 128; ++i) {
            if (this.phase > cpw) {
                var ph2 = (this.phase - cpw) * rcpw;
                if (ph2 >= 0.5)
                    x = ph2 * mul1 + add1;
                else
                    x = ph2 * mul0 + add0;
            }
            else
                x = 0;
            this.phase += this.delta;
            if (this.phase >= 1)
                this.phase -= 1;
            out[i] = x;
        }
    }
}
function Vcf(name, x, y) {
    this.y1 = this.y2 = this.y3 = this.y4 = 0;
    this.ox = 0;
    this.k = this.r = this.p = 0;
    this.gain = 0;
    this.enable = false;
    this.jckIn1 = app.knobs.AddJack(name + ".i1", x + 8, y + 52, 0);
    this.jckIn2 = app.knobs.AddJack(name + ".i2", x + 28, y + 52, 0);
    this.jckIn3 = app.knobs.AddJack(name + ".i3", x + 48, y + 52, 0);
    this.sliIn1 = app.knobs.AddSlider(name + ".i1m", x + 8, y + 72, 0.8);
    this.sliIn2 = app.knobs.AddSlider(name + ".i2m", x + 28, y + 72, 0.8);
    this.sliIn3 = app.knobs.AddSlider(name + ".i3m", x + 48, y + 72, 0);
    this.knbFreq = app.knobs.AddKnob(name + ".f", x + 12, y + 152, 32, 32, "knob", 50, 0.8);
    this.knbReso = app.knobs.AddKnob(name + ".r", x + 12, y + 200, 32, 32, "knob", 50, 0.5);
    this.jckOut = app.knobs.AddJack(name + ".o", x + 48, y + 252, 1);
    this.sliMod1 = app.knobs.AddSlider(name + ".m1m", x + 8, y + 280, 1);
    this.sliMod2 = app.knobs.AddSlider(name + ".m2m", x + 28, y + 280, 0.5);
    this.sliMod3 = app.knobs.AddSlider(name + ".m3m", x + 48, y + 280, 0);
    this.jckMod1 = app.knobs.AddJack(name + ".m1", x + 8, y + 348, 0);
    this.jckMod2 = app.knobs.AddJack(name + ".m2", x + 28, y + 348, 0);
    this.jckMod3 = app.knobs.AddJack(name + ".m3", x + 48, y + 348, 0);
    this.SetFreq = function(f) {
        f = Math.min(0.45, Math.max(0.001, f));
        this.p = f * (1.8 - 0.8 * f);
        this.k = this.p * 2 - 1;
        t = (1 - this.p) * 1.35;
        t2 = 11 + t * t;
        this.r = this.knbReso.val * (t2 + 6 * t) / (t2 - 6 * t) * 0.8;
    }
    this.SetFreq(1);
    this.Process = function() {
        if (this.jckOut.fanout <= 0)
            return;
        var cv;
        cv = this.knbFreq.val;
        if (this.jckMod1.connect)
            cv += this.jckMod1.connect.buf[0] * this.sliMod1.val;
        if (this.jckMod2.connect)
            cv += this.jckMod2.connect.buf[0] * this.sliMod2.val;
        if (this.jckMod3.connect)
            cv += this.jckMod3.connect.buf[0] * this.sliMod3.val;
        this.freq = 130.8127826502993 * Math.pow(2, cv * 5);
        this.SetFreq(this.freq / samplerate);
        var sliIn1 = this.sliIn1.val;
        var sliIn2 = this.sliIn2.val;
        var sliIn3 = this.sliIn3.val;
        var enIn1 = (this.jckIn1.connect != null);
        var enIn2 = (this.jckIn2.connect != null);
        var enIn3 = (this.jckIn3.connect != null);
        if (enIn1 || enIn2 || enIn3) {
            var out = this.jckOut.buf;
            var k = this.k;
            var p = this.p;
            this.enable = true;
            for (var i = 0; i < 128; ++i) {
                var x = 1e-100;
                if (enIn1)
                    x += this.jckIn1.connect.buf[i] * sliIn1;
                if (enIn2)
                    x += this.jckIn2.connect.buf[i] * sliIn2;
                if (enIn3)
                    x += this.jckIn3.connect.buf[i] * sliIn3;

                x = x * .1 - this.r * this.y4;
                y1 = this.y1; y2 = this.y2; y3 = this.y3;
                this.y1 = (x + this.ox) * p - y1 * k;
                this.y2 = (this.y1 + y1) * p - y2 * k;
                this.y3 = (this.y2 + y2) * p - y3 * k;
                y4 = (this.y3 + y3) * p - this.y4 * k;
                this.y4 = y4 - y4 * y4 * y4 * 0.1666666666666667;
                this.ox = x;
                out[i] = this.y4 * 12;
            }
        }
        else {
            if (this.enable)
                this.jckOut.FillBuf(0);
            this.enable = false;
        }
    }
}
function Vca(name, x, y) {
    this.gain = 0;
    this.enable = false;
    this.jckIn1 = app.knobs.AddJack(name + ".i1", x + 8, y + 52, 0);
    this.jckIn2 = app.knobs.AddJack(name + ".i2", x + 28, y + 52, 0);
    this.jckIn3 = app.knobs.AddJack(name + ".i3", x + 48, y + 52, 0);
    this.sliIn1 = app.knobs.AddSlider(name + ".i1m", x + 8, y + 72, 0.8);
    this.sliIn2 = app.knobs.AddSlider(name + ".i2m", x + 28, y + 72, 0);
    this.sliIn3 = app.knobs.AddSlider(name + ".i3m", x + 48, y + 72, 0);
    this.knbVol = app.knobs.AddKnob(name + ".vol", x + 12, y + 164, 32, 32, "knob", 50, 0.5);
    this.jckOut = app.knobs.AddJack(name + ".o", x + 48, y + 224, 1);
    this.sliMod1 = app.knobs.AddSlider(name + ".m1m", x + 8, y + 280, 1);
    this.sliMod2 = app.knobs.AddSlider(name + ".m2m", x + 28, y + 280, 0);
    this.sliMod3 = app.knobs.AddSlider(name + ".m3m", x + 48, y + 280, 0);
    this.jckMod1 = app.knobs.AddJack(name + ".m1", x + 8, y + 348, 0);
    this.jckMod2 = app.knobs.AddJack(name + ".m2", x + 28, y + 348, 0);
    this.jckMod3 = app.knobs.AddJack(name + ".m3", x + 48, y + 348, 0);
    this.Process = function() {
        if (this.jckOut.fanout <= 0)
            return;
        var v;
        var g = this.knbVol.val;
        if (this.jckMod1.connect != null)
            g += this.jckMod1.connect.buf[0] * this.sliMod1.val;
        if (this.jckMod2.connect != null)
            g += this.jckMod2.connect.buf[0] * this.sliMod2.val;
        if (this.jckMod3.connect != null)
            g += this.jckMod3.connect.buf[0] * this.sliMod3.val;
        if (g < 0)
            g = 0;
        if (Math.abs(this.gain - g) < 1e-10)
            this.gain = g;
        var sli1 = this.sliIn1.val;
        var sli2 = this.sliIn2.val;
        var sli3 = this.sliIn3.val;
        var enIn1 = (this.jckIn1.connect != null);
        var enIn2 = (this.jckIn2.connect != null);
        var enIn3 = (this.jckIn3.connect != null);
        if (enIn1 || enIn2 || enIn3) {
            this.enable = true;
            var out = this.jckOut.buf;
            for (var i = 0; i < 128; ++i) {
                v = 1e-100;
                if (enIn1)
                    v += this.jckIn1.connect.buf[i] * sli1;
                if (enIn2)
                    v += this.jckIn2.connect.buf[i] * sli2;
                if (enIn3)
                    v += this.jckIn3.connect.buf[i] * sli3;
                out[i] = v * this.gain;
                this.gain += (g - this.gain) * 0.02;
//                this.gain = g;
            }
        }
        else {
            if (this.enable)
                this.jckOut.FillBuf(0);
            this.enable = false;
        }
    }
}
function App() {
    this.Draw = function() {
        if (!this.canvas || !this.canvas.getContext) {
            return false;
        }
        ctx = this.canvas.getContext('2d');
        ctx.drawImage(imgpanel, 0, 0);
        this.knobs.Draw();
    }
    this.MouseDown = function(e) {
        document.getElementById("canvas").focus();
        getXY(e);
        app.knobs.MouseDown(mouseX, mouseY);
        return false;
    }
    this.MouseMove = function(e) {
        getXY(e);
        app.knobs.MouseMove(mouseX, mouseY);
    }
    this.MouseUp = function(e) {
        getXY(e);
        app.knobs.MouseUp(mouseX, mouseY);
    }
    this.DblClick = function(e) {
    }
    this.KeyDown = function(e) {
        if (document.activeElement == document.getElementById("canvas")) {
            app.keyboard.key.KeyPress(e.keyCode, 1);
            return false;
        }
    }
    this.KeyUp = function(e) {
        app.keyboard.key.KeyPress(e.keyCode, 0);
    }
    this.KeyPress = function(e) {
        if (document.activeElement == document.getElementById("canvas"))
            return false;
    }
    this.Init = function() {
        samplerate = 44100;
        this.canvas = document.getElementById('canvas');
        this.canvas.onmousedown = this.MouseDown;
        this.canvas.onmousemove = this.MouseMove;
        this.canvas.onmouseup = this.MouseUp;
        this.canvas.ondblclick = this.DblClick;
        document.onkeydown = this.KeyDown;
        document.onkeyup = this.KeyUp;
        document.onkeypress = this.KeyPress;
        this.knobs = new Knobs();
        this.vco1 = new Vco("vco1", 36, 78, 0.5, 0.5);
        this.vco2 = new Vco("vco2", 108, 78, 0.25, 0.45);
        this.vcf1 = new Vcf("vcf1", 180, 78);
        this.vcf2 = new Vcf("vcf2", 252, 78);
        this.vca1 = new Vca("vca1", 324, 78);
        this.vca2 = new Vca("vca2", 396, 78);
        this.env1 = new Env("env1", 468, 78);
        this.env2 = new Env("env2", 468, 226);
        this.lfo1 = new Lfo("lfo1", 468, 374);
        this.lfo2 = new Lfo("lfo2", 564, 374);
        this.mix = new Mix("mix", 564, 78);
        this.ring = new Ring("ring", 564, 250);
        this.noise = new Noise("noise", 564, 286);
        this.sh = new SH("sh", 564, 346);
        if (typeof(gadget) != "undefined")
            this.keyboard = new Keyboard("kb", 24, 154);
        else
            this.keyboard = new Keyboard("kb", 48, 502);
        try {
            this.dummybuf = new Float32Array(128);
        } catch (e) {
            this.dummybuf = new Array(128);
        }
        for (var i = 0; i < 128; ++i)
            this.dummybuf[i] = 0;
        audioif = new AudioIf();
        audiomix = new AudioMix();
        imgpanel = document.getElementById("panel");
        imgknobs["knob"] = document.getElementById("knob");
        imgknobs["knob2"] = document.getElementById("knob2");
        imgknobs["knob3"] = document.getElementById("knob3");
        imgknobs["sw2"] = document.getElementById("sw2");
        imgknobs["sw3"] = document.getElementById("sw3");
        imgknobs["sw5"] = document.getElementById("sw5");
        imgknobs["slider"] = document.getElementById("slider");
        imgknobs["keypress"] = document.getElementById("keypress");
        Setup();
        this.Draw();
        var param = location.search;
        if (param.length > 1)
            CmdLoad(location.search.substring(1));
    }
}
function Interval() {
//    if (typeof (document.hasFocus) != "undefined" && document.hasFocus() == false)
//        return;
    audiomix.Play();
    audioif.Write();
}
function Init() {
    app = new App();
    app.Init();
    if (audioif.enable == 0) {
        return;
    }
    if (audioif.start == 0) {
        audioif.Start();
        audiomix.Reset();
        playint = setInterval(Interval, 20);
    }
}
function CmdPlay(v) {
    if (v) {
        app.keyboard.SetStr(document.getElementById("mml").value);
        app.keyboard.Start(1);
    }
    else {
        app.keyboard.Start(0);
    }
}
function CmdSave() {
    var jstr = "";
    var kstr = "";
    var vals="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (var i in app.knobs.knobs) {
        var w = app.knobs.knobs[i];
        switch(w.ty) {
            case 0:
                if (w.connect != null) {
                    jstr += vals[w.pnum];
                    jstr += vals[w.connect.pnum];
                }
                break;
            case 100:
            case 102:
                kstr += vals[(w.val * (w.step-1)) | 0];
                break;
            case 101:
                kstr += vals[(w.val * 50) | 0];
                break;
        }
    }
    var mstr = encodeURIComponent(document.getElementById("mml").value);
    var url = document.URL.split("?")[0] + "?p=" + jstr + "_" + kstr+"&m="+mstr;
    document.getElementById("url").value = url;
}
function GetJack(n, t) {
    for (var i in app.knobs.knobs) {
        var w = app.knobs.knobs[i];
        if (t == 0) {
            if (w.ty == 0) {
                if (w.pnum == n)
                    return w;
            }
        }
        else {
            if (w.ty != 0 && w.ty < 100) {
                if (w.pnum == n)
                    return w;
            }
        }
    }
}
function CmdLoad(str) {
    if (str == null) {
        str = document.getElementById("url").value;
    }
    n = str.indexOf("?");
    if (n >= 0)
        str = str.substring(n + 1);
    var param = str.split("&");
    var vals="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < param.length; ++i) {
        if (param[i].search("p=") == 0) {
            var s = param[i].substring(2);
            for (var ii in app.knobs.knobs) {
                var w = app.knobs.knobs[ii];
                if (w.ty == 0)
                    w.connect = null;
                else if (w.ty < 100)
                    w.fanout = 0;
            }
            for (var j = 0; j < s.length; j += 2) {
                if (s.charAt(j) == "_")
                    break;
                var n = vals.indexOf(s.charAt(j));
                var v = vals.indexOf(s.charAt(j + 1));
                GetJack(n, 0).Connect(GetJack(v, 1));
            }
            ++j;
            for (var ii in app.knobs.knobs) {
                var w = app.knobs.knobs[ii];
                switch (w.ty) {
                    case 100:
                    case 102:
                        w.Set(vals.indexOf(s.charAt(j)) / (w.step-1));
                        ++j;
                        break;
                    case 101:
                        w.Set(vals.indexOf(s.charAt(j)) / 50);
                        ++j;
                        break;
                }
            }
        }
        else if (param[i].search("m=") == 0) {
            var s;
            try {
                s=decodeURIComponent(param[i].substring(2));
            } catch (e) {
                s = param[i].substring(2);
            }
            document.getElementById("mml").value = s;
        }
    }
    app.Draw();
}
function CmdTweet() {
    CmdSave();
    var url = "https://twitter.com/intent/tweet?hashtags=WebModular&url=" + encodeURIComponent(document.getElementById("url").value);
    var win = window.open(url, "", "toolbar=0, status=0, width=650, height=360");

}
function Message(s) {
}
var datbuf = new Array(4096);
for (var ii = 0; ii < 4096; ++ii) {
    datbuf[ii] = 0;
}
function FlashGetEnable() {
    if (audioif.enable == 3)
        return 1;
    else
        return 0;
}
function FlashGetData() {
    var b = audiomix.GetOutBuf();
    if (b < 0) {
        return datbuf;
    }
    else {
        audiomix.NextBuf();
        return audiomix.queout[b];
    }
}
function AudioIf() {
    this.start = 0;
    this.written = 0;
    this.size = Math.floor(samplerate * 15 / 120) * 16;
    this.buf = 0;
    samplerate = 44100;
    this.enable = 0;
    this.totalwritten = 0;
    this.count = 0;
    if (typeof (webkitAudioContext) != "undefined") {
        this.audio = new webkitAudioContext();
        samplerate = this.audio.sampleRate;
        this.enable = 2;
        outbufsize = 1024;
    }
    else if (typeof (Audio) == "function") {
        this.audio = new Audio();
        if (typeof (this.audio.mozSetup) == "function") {
            this.enable = 1;
            outbufsize = 1024;
        }
    }
    if (this.enable == 0) {
        this.enable = 3;
        outbufsize = 4096;
    }
//    document.title = this.enable;
    switch (this.enable) {
        case 0:
            Message("Audio Disabled: 'AudioDataAPI' or 'WebAudioAPI' is not supported in this browser.");
            break;
        case 1:
            Message("Using Audio Data API");
            break;
        case 2:
            Message("Using Web Audio API");
            break;
        case 3:
            break;
    }
    if (this.enable > 0) {
        try {
            this.dummysample = new Float32Array(outbufsize);
        } catch (e) {
            this.dummysample = new Array(outbufsize);
        }
        for (var i = 0; i < outbufsize; ++i)
            this.dummysample[i] = 0;
    }
    if (this.enable == 1) {
        this.audio.mozSetup(stereo+1, samplerate);
    }
    if (this.enable == 2) {
        this.jsnode = this.audio.createJavaScriptNode(outbufsize, 2, 2);
        this.jsnode.onaudioprocess = function(e) {
            var outl = e.outputBuffer.getChannelData(0);
            var outr = e.outputBuffer.getChannelData(1);
            var b = audiomix.GetOutBuf();
            if (b < 0) {
                outl.set(audioif.dummysample);
                outr.set(audioif.dummysample);
            }
            else {
                outl.set(audiomix.queout[b]);
                outr.set(audiomix.queout[b]);
                audiomix.NextBuf();
            }
        }
    }
    this.SetSamplerate = function(s) {
        if (s != samplerate) {
            samplerate = s;
            audiomix.SetSamplerate();
        }
    }
    this.Write = function() {
        if (this.enable == 1) {
            if (audioif.start == 0)
                return;
            if (this.written >= outbufsize2) {
                if (audiomix.NextBuf() < 0)
                    return;
                this.written = 0;
            }
            if (this.totalwritten > this.audio.mozCurrentSampleOffset() + 16384)
                return;
            var b = audiomix.GetOutBuf();
            if (b >= 0) {
                w = this.audio.mozWriteAudio(audiomix.queout[b].subarray(this.written));
                this.totalwritten += w;
                this.written += w;
            }
        }
    }
    this.Start = function() {
        this.start = 1;
        switch (this.enable) {
            case 1:
                break;
            case 2:
                this.jsnode.connect(this.audio.destination);
                break;
        }
    }
    this.Stop = function() {
        this.start = 0;
        switch (this.enable) {
            case 1:
                break;
            case 2:
                this.jsnode.disconnect(0);
                break;
        }
    }
    this.SetSize = function(s) {
        this.size = s;
    }
}
function AudioMix() {
    this.queout = new Array(outquenum);
    this.queout2 = new Array(outquenum);
    this.windex = 0;
    this.rindex = 0;
    this.pat = 0;
    this.step = 0;
    this.steplen = samplerate / 8;
    this.tick = 0;
    this.count = 0;
    for (var i = 0; i < outquenum; ++i) {
        if (audioif.enable == 1) {
            this.queout[i] = new Float32Array(outbufsize2);
            for (var ii = 0; ii < outbufsize2; ++ii)
                this.queout[i][ii] = 0;
        }
        else if (audioif.enable == 2) {
            this.queout[i] = new Float32Array(outbufsize);
            this.queout2[i] = new Float32Array(outbufsize);
            for (var ii = 0; ii < outbufsize; ++ii) {
                this.queout[i][ii] = this.queout2[i][ii] = 0;
            }
        }
        else {
            this.queout[i] = new Array(outbufsize);
            for (var ii = 0; ii < outbufsize2; ++ii)
                this.queout[i][ii] = 0;
        }
    }
    this.SetSamplerate = function() {
        this.steplen = samplerate * 15 / tempo;
    }
    this.SetTempo = function(x) {
        this.steplen = samplerate * 15 / x;
    }
    this.GetQueNum = function() {
        if ((n = this.windex - this.rindex) < 0)
            n += outquenum;
        return n;
    }
    this.GetOutBuf = function() {
        if (audiomix.rindex == audiomix.windex)
            return -1;
        return audiomix.rindex;
    }
    this.NextBuf = function() {
        if (audiomix.rindex == audiomix.windex)
            return -1;
        if (++audiomix.rindex >= outquenum)
            audiomix.rindex = 0;
        return 1;
    }
    this.Reset = function() {
        audiomix.tick = audiomix.steplen;
        audiomix.rindex = audiomix.windex = 0;
        audioif.written = 0;
    }
    this.Render = function(buf) {
    }
    this.DrawVu = function() {
    }
    this.Play = function() {
        if (((audiomix.windex + 1) % outquenum) == audiomix.rindex)
            return;
        for (var ilp = 0; ilp < outbufsize; ilp += 128) {
            app.keyboard.Process();
            app.noise.Process();
            app.vco1.Process();
            app.vco2.Process();
            app.vcf1.Process();
            app.vcf2.Process();
            app.vca1.Process();
            app.vca2.Process();
            app.lfo1.Process();
            app.lfo2.Process();
            app.env1.Process();
            app.env2.Process();
            app.ring.Process();
            app.sh.Process();
            app.mix.Process();
            switch (audioif.enable) {
                case 1:
                    for (var j = 0; j < 128; ++j) {
                        audiomix.queout[audiomix.windex][(ilp + j) << 1] = app.mix.buf[j];
                        audiomix.queout[audiomix.windex][((ilp + j) << 1) + 1] = app.mix.buf[j];
                    }
                    break;
                case 2:
                    for (var j = 0; j < 128; ++j) {
                        audiomix.queout[audiomix.windex][ilp + j] = app.mix.buf[j];
                        audiomix.queout2[audiomix.windex][ilp + j] = app.mix.buf[j];
                    }
                    break;
                case 3:
                    for (var j = 0; j < 128; ++j) {
                        audiomix.queout[audiomix.windex][ilp + j] = app.mix.buf[j];
                    }
                    break;
            }
        }
        audiomix.windex = (audiomix.windex + 1) % outquenum;
    }
}
function Setup() {
    for (var i in app.knobs.knobs) {
        var widget = app.knobs.knobs[i];
        if (widget.ty == 0) {
            widget.Connect(null);
        }
        else if (widget.ty < 100) {
            widget.fanout = 0;
        }
        if (widget.ty >= 100 && widget.ty < 200)
            widget.Set(0);
    }
    app.knobs.knobs["vco1.oct"].Set(0.5);
    app.knobs.knobs["vco1.form"].Set(0.5);
    app.knobs.knobs["vco1.co"].Set(0.5);
    app.knobs.knobs["vco1.pi"].Set(0.5);
    app.knobs.knobs["vco1.m1m"].Set(1);
    app.knobs.knobs["vco2.oct"].Set(0.5);
    app.knobs.knobs["vco2.form"].Set(0.5);
    app.knobs.knobs["vco2.co"].Set(0.5);
    app.knobs.knobs["vco2.pi"].Set(0.48);
    app.knobs.knobs["vco2.m1m"].Set(1);
    app.knobs.knobs["vcf1.i1m"].Set(0.7);
    app.knobs.knobs["vcf1.f"].Set(1);
    app.knobs.knobs["vcf1.r"].Set(0.5);
    app.knobs.knobs["vcf1.m1m"].Set(1);
    app.knobs.knobs["vcf2.i1m"].Set(0.7);
    app.knobs.knobs["vcf2.f"].Set(0.8);
    app.knobs.knobs["vcf2.r"].Set(0.5);
    app.knobs.knobs["vcf2.m1m"].Set(1);
    app.knobs.knobs["vca1.i1m"].Set(0.7);
    app.knobs.knobs["vca1.m1m"].Set(1);
    app.knobs.knobs["vca2.i1m"].Set(0.7);
    app.knobs.knobs["vca2.m1m"].Set(1);
    app.knobs.knobs["env1.s"].Set(1);
    app.knobs.knobs["env2.s"].Set(1);
    app.knobs.knobs["lfo1.f"].Set(0.5);
    app.knobs.knobs["lfo1.form"].Set(0.5);
    app.knobs.knobs["lfo2.f"].Set(0.5);
    app.knobs.knobs["lfo2.form"].Set(0.5);
    app.knobs.knobs["mix.i1m"].Set(0.5);
    app.knobs.knobs["mix.i2m"].Set(0.5);
    var n = document.getElementById("patch").selectedIndex;
    switch (n) {
        case 0:
            break;
        case 1:
            app.knobs.knobs["vco1.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["vca1.i1"].Connect(app.knobs.knobs["vco1.o"]);
            app.knobs.knobs["mix.i1"].Connect(app.knobs.knobs["vca1.o"]);
            app.knobs.knobs["vca1.m1"].Connect(app.knobs.knobs["kb.g"]);
            break;
        case 2:
            app.knobs.knobs["vco1.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["vco2.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["vcf1.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["env1.tr"].Connect(app.knobs.knobs["kb.g"]);
            app.knobs.knobs["vcf1.i1"].Connect(app.knobs.knobs["vco1.o"]);
            app.knobs.knobs["vcf1.i2"].Connect(app.knobs.knobs["vco2.o"]);
            app.knobs.knobs["vca1.i1"].Connect(app.knobs.knobs["vcf1.o"]);
            app.knobs.knobs["mix.i1"].Connect(app.knobs.knobs["vca1.o"]);
            app.knobs.knobs["vca1.m1"].Connect(app.knobs.knobs["env1.op"]);
            app.knobs.knobs["vco2.oct"].Set(0);
            app.knobs.knobs["vcf1.i2m"].Set(0.7);
            break;
        case 3:
            app.knobs.knobs["vco1.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["vco2.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["vcf1.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["vcf2.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["env1.tr"].Connect(app.knobs.knobs["kb.g"]);
            app.knobs.knobs["env2.tr"].Connect(app.knobs.knobs["kb.g"]);
            app.knobs.knobs["vcf1.i1"].Connect(app.knobs.knobs["vco1.o"]);
            app.knobs.knobs["vcf2.i1"].Connect(app.knobs.knobs["vco2.o"]);
            app.knobs.knobs["vca1.i1"].Connect(app.knobs.knobs["vcf1.o"]);
            app.knobs.knobs["vca2.i1"].Connect(app.knobs.knobs["vcf2.o"]);
            app.knobs.knobs["mix.i1"].Connect(app.knobs.knobs["vca1.o"]);
            app.knobs.knobs["mix.i2"].Connect(app.knobs.knobs["vca2.o"]);
            app.knobs.knobs["vca1.m1"].Connect(app.knobs.knobs["env1.op"]);
            app.knobs.knobs["vca2.m1"].Connect(app.knobs.knobs["env2.op"]);
            app.knobs.knobs["vcf1.f"].Set(0.6);
            app.knobs.knobs["vcf1.r"].Set(0.6);
            app.knobs.knobs["vcf2.f"].Set(0.7);
            app.knobs.knobs["vcf2.r"].Set(1);
            app.knobs.knobs["vco2.oct"].Set(0);
            app.knobs.knobs["env1.d"].Set(0.8);
            app.knobs.knobs["env1.s"].Set(0.1);
            break;
        case 4:
            app.knobs.knobs["vco1.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["vco2.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["vcf1.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["env1.tr"].Connect(app.knobs.knobs["kb.g"]);
            app.knobs.knobs["vcf1.i1"].Connect(app.knobs.knobs["vco1.o"]);
            app.knobs.knobs["vcf1.i2"].Connect(app.knobs.knobs["vco2.o"]);
            app.knobs.knobs["vca1.i1"].Connect(app.knobs.knobs["vcf1.o"]);
            app.knobs.knobs["mix.i1"].Connect(app.knobs.knobs["vca1.o"]);
            app.knobs.knobs["vca1.m1"].Connect(app.knobs.knobs["env1.op"]);
            app.knobs.knobs["vco1.m2"].Connect(app.knobs.knobs["lfo1.o10"]);
            app.knobs.knobs["vcf1.m2"].Connect(app.knobs.knobs["lfo1.o"]);
            app.knobs.knobs["vcf1.i2m"].Set(0.8);
            app.knobs.knobs["vco1.m2m"].Set(0.1);
            app.knobs.knobs["vcf1.m2m"].Set(0.5);
            app.knobs.knobs["lfo1.f"].Set(0.4);
            app.knobs.knobs["lfo1.form"].Set(1);
            break;
        case 5:
            app.knobs.knobs["vco1.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["vco2.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["vcf1.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["env1.tr"].Connect(app.knobs.knobs["kb.g"]);
            app.knobs.knobs["vcf1.i1"].Connect(app.knobs.knobs["vco1.o"]);
            app.knobs.knobs["vcf1.i2"].Connect(app.knobs.knobs["vco2.o"]);
            app.knobs.knobs["vca1.i1"].Connect(app.knobs.knobs["vcf1.o"]);
            app.knobs.knobs["mix.i1"].Connect(app.knobs.knobs["vca1.o"]);
            app.knobs.knobs["vca1.m1"].Connect(app.knobs.knobs["env1.op"]);
            app.knobs.knobs["vco1.m2"].Connect(app.knobs.knobs["lfo1.o10"]);
            app.knobs.knobs["vcf1.m2"].Connect(app.knobs.knobs["lfo1.o"]);
            app.knobs.knobs["vcf1.i3"].Connect(app.knobs.knobs["noise.o"]);
            app.knobs.knobs["sh.i"].Connect(app.knobs.knobs["noise.o"]);
            app.knobs.knobs["sh.tr"].Connect(app.knobs.knobs["lfo2.o"]);
            app.knobs.knobs["vco1.m2"].Connect(app.knobs.knobs["sh.o"]);
            app.knobs.knobs["vcf1.i2m"].Set(0.5);
            app.knobs.knobs["vcf1.i3m"].Set(0.4);
            app.knobs.knobs["vcf1.r"].Set(0.8);
            app.knobs.knobs["vco1.m2m"].Set(0.2);
            app.knobs.knobs["vcf1.m2m"].Set(0.5);
            app.knobs.knobs["lfo1.f"].Set(0.4);
            app.knobs.knobs["lfo1.form"].Set(1);
            app.knobs.knobs["lfo2.f"].Set(0.7);
            break;
        case 6:
            app.knobs.knobs["vco1.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["vco2.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["vcf1.i1"].Connect(app.knobs.knobs["ring.o"]);
            app.knobs.knobs["vcf1.i2"].Connect(app.knobs.knobs["vca2.o"]);
            app.knobs.knobs["vcf1.m1"].Connect(app.knobs.knobs["kb.cv"]);
            app.knobs.knobs["vca1.i1"].Connect(app.knobs.knobs["vcf1.o"]);
            app.knobs.knobs["vca1.m1"].Connect(app.knobs.knobs["env1.op"]);
            app.knobs.knobs["vca2.i1"].Connect(app.knobs.knobs["noise.o"]);
            app.knobs.knobs["vca2.m1"].Connect(app.knobs.knobs["env2.op"]);
            app.knobs.knobs["env1.tr"].Connect(app.knobs.knobs["kb.g"]);
            app.knobs.knobs["env2.tr"].Connect(app.knobs.knobs["kb.g"]);
            app.knobs.knobs["mix.i1"].Connect(app.knobs.knobs["vca1.o"]);
            app.knobs.knobs["ring.i1"].Connect(app.knobs.knobs["vco1.o"]);
            app.knobs.knobs["ring.i2"].Connect(app.knobs.knobs["vco2.o"]);
            app.knobs.knobs["vco1.form"].Set(1);
            app.knobs.knobs["vco2.form"].Set(1);
            app.knobs.knobs["vco2.pi"].Set(0);
            app.knobs.knobs["vco2.m1m"].Set(0.5);
            app.knobs.knobs["vcf1.i2m"].Set(0.5);
            app.knobs.knobs["vcf1.r"].Set(0.8);
            app.knobs.knobs["vcf1.f"].Set(0.5);
            app.knobs.knobs["env1.d"].Set(0.75);
            app.knobs.knobs["env1.s"].Set(0);
            app.knobs.knobs["env1.r"].Set(0.75);
            app.knobs.knobs["env2.s"].Set(0);
            app.knobs.knobs["env2.d"].Set(0.8);
            app.knobs.knobs["env2.r"].Set(0.8);
            app.knobs.knobs["mix.i1m"].Set(0.75);
            break;
    }
    app.Draw();
}