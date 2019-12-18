let fs = require("fs");
let folder = ".\\Sport-sessions";

let startDate = new Date(2019, 06, 5)
let endDate = new Date(2019, 07, 10)

const toRadians = degrees => degrees * (Math.PI / 180);

async function getData(pc) {
    return new Promise((res, rej) => {
        try {
            let allData = [];

            fs.readdir(folder, (err, files) => {
                files.forEach(file => {
                    if (fs.lstatSync(`${folder}\\${file}`).isDirectory()) return;
                    
                    let data = handleFile(file);
                    if (data) 
                        allData.push(data);                    
                });
                
                allData = allData.filter(x => x.data.distance < 5000);
                allData.sort((a, b) => a.data.start_time - b.data.start_time);

                let maxDistance = Math.max(...allData.map(d => d.data.distance));

                let pointcount = pc || Math.max(...allData.map(d => d.gps.length));                

                console.log("points: ",pointcount);
                console.log("sets: ",allData.length);
                
                allData.forEach(d => {
                    let distanceAcum = 0;
                    let p = d.gps.shift();
                    for (let g of d.gps) {
                        let p1 = {lat: p.latitude,long: p.longitude,alt: p.altitude};
                        let p2 = {lat: g.latitude,long: g.longitude,alt: g.altitude};
                        let distance = coordToMeters(p1, p2);
                        distanceAcum += distance;
                        g.distance = distanceAcum;
                        p = g;
                    }
                });

                allData.forEach(d => {
                    d.points = [];

                    for (let i = 0; i < pointcount; i++) {
                        d.points.push(null);
                    }
                    
                    d.gps.forEach(g => {
                        let percentage = Math.round((g.distance / maxDistance) * pointcount);
                        
                        if (!d.points[percentage])
                            d.points[percentage] = [];
                        
                        d.points[percentage].push(g.speed);
                    });
                    let maxPercentage = Math.round((d.data.distance / maxDistance) * pointcount);
                    
                    d.points = d.points.map((p) => {                        
                        if (p)
                            return p.reduce((acum, curr) => acum + curr) / p.length;          
                        return null;
                    });
                    
                    for(let i=0; i<d.points.length;i++){
                        p = d.points[i];
                        if(i > maxPercentage){
                            d.points[i] = null
                        }
                        else if (!p) {
                            d.points[i] = d.points[i-1] || 0;
                        }
                    }
                });

                res(allData.map(d => ({
                    data: d.data,
                    points: d.points
                })));
            });
        } catch (e) {
            rej(e)
        }
    });
}

function handleFile(file) {
    try {
        let data = require(`${folder}\\${file}`);
        let date = new Date(data.start_time);

        if (date > endDate || date < startDate) return;

        let gps = require(`${folder}\\GPS-data\\${data.id}.json`);
        return {
            data,
            gps
        }
    } catch (e) {
        console.log(file + ": NO MAP DATA", e);
    }
}

module.exports = getData;

function coordToMeters(p1, p2) {
    let R = 6371e3;
    let φ1 = toRadians(p1.lat);
    let φ2 = toRadians(p2.lat);
    let Δφ = toRadians(p2.lat - p1.lat);
    let Δλ = toRadians(p2.long - p1.long);

    let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    let d = R * c;

    return d;
}
