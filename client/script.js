let data;
let counter = 0;
let i = 0;
let w = window.innerWidth;
let h = window.innerHeight;

let points = w;
let maxDistance;
let maxSpeed;
let kms;
let speedDelta;
async function setup() {
    colorMode(HSB);
    createCanvas(w, h);
    let start = Date.now();

    data = await (await fetch(`/data?points=${points}`)).json();
    
    
    maxSpeed = Math.max(...data.map(d => Math.max(...d.points)));
    maxDistance = Math.max(...data.map(d => d.data.distance));

    
    //--------------------
    //morning/evening set
    let morningSet = data.filter(d => new Date(d.data.start_time).getHours() < 12);
    let eveningSet = data.filter(d => new Date(d.data.start_time).getHours() > 12);

    morningSet.forEach(s => {
        s.data.color = color(240, 20, 100);
        s.data.time = "morning";
    })
    eveningSet.forEach(s => {
        s.data.color = color(0, 20, 100);
        s.data.time = "evening";
    })

    morningSet.push(await average(morningSet.map(x => x.points), "morning", color(240, 100, 100)));
    eveningSet.push(await average(eveningSet.map(x => x.points), "evening", color(0, 100, 100)));

    data = [...morningSet, ...eveningSet];

    //--------------------
    //single set (no morning/evening)
    //    data.forEach(s => {
    //        s.data.color = color(0, 20, 100);
    //    })
    //    data.push(await average(data.map(x => x.points), "average", color(0, 100, 100)));
    //--------------------
    

    maxSpeed = maxSpeed < 60 ? maxSpeed : 60;    
    speedDelta = maxSpeed / 10;
    stroke(80);
    for (let i = 0; i < 10; i++) {
        let y = map(speedDelta * i, 0, maxSpeed, h, 0);
        strokeWeight(1);
        line(0, y, w, y);
    }

    kms = Math.round(maxDistance / 1000);
    for (let i = 0; i <= kms; i++) {
        let x = map(i * 1000, 0, maxDistance, 0, w);
        strokeWeight(1);
        line(x, 0, x, h);
    }
}

function mousePressed() {
    //    noLoop()
}

let p = {}

function draw() {
    //    background(55)
    if (!data) return;
    if (counter > points) noLoop();

    data.forEach(d => {
        id = d.data.id;
        let index = counter;
        let g = d.points[index];

        if (!p[id] || index == 0)
            p[id] = d.points[0];

        if (g) {
            let c = {
                y: map(g, 0, maxSpeed, h, 0)
            }

            if (d.data.time == "evening")
                c.x = map(index, 0, points, w, 0);
            else
                c.x = map(index, 0, points, 0, w);

            if (d.average)
                strokeWeight(2);
            else
                strokeWeight(1);
            stroke(d.data.color);
            line(c.x, c.y, p[id].x, p[id].y);

            p[id] = c;
        }

    })
    counter += 1;
    strokeWeight(0);
    for (let i = 0; i < 10; i++) {
        let y = map(speedDelta * i, 0, maxSpeed, h, 0);
        text(`${Math.round(speedDelta*i)}km/h`, 5, y - 20);
    }
    for (let i = 0; i <= kms; i++) {
        let x = map(i * 1000, 0, maxDistance, 0, w);
        text(`${i}km`, x + 5, h - 20);
    }
}

function average(ps, id, color) {
    let ap = [];
    for (let i = 0; i < points; i++) {
        let ipoints = ps.map(p => p[i]);
        let valid = ipoints.filter(p => p);
        ap.push((valid.reduce((acum, curr) => curr ? curr + acum : acum, 0)) / valid.length);
    }
    return {
        average: true,
        data: {
            id,
            color,
            time: id
        },
        points: ap
    }
}
