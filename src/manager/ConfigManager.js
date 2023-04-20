const fs = window.require('fs');
let rawdata = fs.readFileSync("./config.json");
export let config = JSON.parse(rawdata);

export const UpdateConfig = () => {
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2), function writeJSON(err) {
        if (err) return console.log("ERROR" + err);
    });
}