/**
 * Parse the mapping string describing an emphasis target.
 * 
 * @param {String} string - The string describing an emphasis target.
 *  Note that the current implementation makes some assumptions about
 *  the format of the string, such as starting with '<' and ending with
 *  ' />', being space-separated, and having each 'value' be wrapped
 *  in escaped double-quotes.
 * @returns {Object} An object acting as a key-value map. There should
 *  always be an entry with the key "type" whose value will be an SVG
 *  element type (e.g. "circle", "path", etc.)
 */
function stringToKeyValueMap(string) {
    const VALID_KEYS = ['d', 'cx', 'cy' /* there will be some other ones for bar charts */]

    const split = string.split(" ");
    const ret = {type: split[0].slice(1)} // remove leading '<'
    for (let i of split.slice(1, -1)) { // leave off the last one because it's '/>"'
        const innerSplit = i.split("=");
        if (VALID_KEYS.includes(innerSplit[0])) {
            ret[innerSplit[0]] = innerSplit[1].slice(1, -1);
        }
    }
    return ret;
}

async function getCaption(id) {
    const response = await fetch('./L2L3_captions.json');
    const responseJson = await response.json();
    return responseJson.find((element) => element.img_id === id).caption_L2L3;
}

async function getMapping(id) {
    const response = await fetch(`./${id}_mapping.json`);
    const responseJson = await response.json();
    return responseJson;
}

async function main() {
    const id = 8819;
    const caption = await getCaption(id);
    d3.select('p').text(caption);

    const mappingJson = await getMapping(id);
    console.log(mappingJson);

    for (const [subCaption, svgStrings] of Object.entries(mappingJson)) {
        console.log(subCaption);
    }

    const testItem = "<circle cx=\"200\" cy=\"4\" r=\"3\" fill=\"#3af\" />"
    const kvm = stringToKeyValueMap(testItem);
    const svgItem = d3.selectAll(kvm.type).select(function() {
        // Iterate over all the elements of type kvm.type (e.g. circle, path, etc.)
        // `this` is a DOM element.
        for (const [k, v] of Object.entries(kvm)) {
            if (k === 'type') {
                continue;
            }
            if (this.getAttribute(k) !== v) {
                return null;
            }
        }
        return this;
    });
    svgItem.classed('highlighted', true);
}

main();