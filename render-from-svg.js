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
 *  element type (e.g. "circle", "path", etc.) or undefined if unsupported.
 */
function stringToKeyValueMap(string) {
  const VALID_KEYS = ['d', 'cx', 'cy' /* there will be some other ones for bar charts */]
  const VALID_TYPES = ['circle', 'path', /* there will be some other ones for bar charts */]

  const split = string.split(" ");
  const typeString = split[0].slice(1);
  if (!VALID_TYPES.includes(typeString)) {
    return { type: undefined }
  }
  const ret = { type: typeString } // remove leading '<'
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
  let caption = await getCaption(id);

  const mappingJson = await getMapping(id);

  d3.select(".role-mark").selectChildren().classed("mark", true);

  // Markup the caption with <span> tags, assigning IDs to each claim.
  for (const [index, [subCaption, _]] of Object.entries(mappingJson).entries()) {
    const claimId = `claim-${index}`;
    caption = caption.replace(
      subCaption,
      `<span id="${claimId}" class="interactible">${subCaption}</span>`
    );
  }
  d3.select('#caption').html(caption);

  // Markup visualization marks to associate marks with claims
  for (const [index, [_, svgStrings]] of Object.entries(mappingJson).entries()) {
    for (const svgString of svgStrings) {
      const claimId = `claim-${index}`;
      const markClass = `mark-${index}`;
      const kvm = stringToKeyValueMap(svgString);
      if (kvm.type !== undefined) {
        d3.selectAll(kvm.type).select(function () {
          // Iterate over all the elements of type kvm.type (e.g. circle, path, etc.)
          // `this` is a DOM element.
          // If the 
          for (const [k, v] of Object.entries(kvm)) {
            if (k === 'type') continue;
            if (this.getAttribute(k) !== v) return null;
          }
          return this;
        }).classed(markClass, true);
      }

      // Add interaction listeners
      d3.select(`#${claimId}`)
        .on("mouseenter", function () {
          d3.selectAll('.interactible').filter(function() {
            return this.id !== claimId;
          }).classed('deemphasized', true);

          d3.selectAll('.mark').filter(function() {
            console.log(this.classList);
            return !this.classList.contains(markClass);
          }).classed('deemphasized', true);
        })
        .on("mouseleave", function () {
          d3.selectAll('.interactible')
            .classed('deemphasized', false)
            .classed('regular', true);
            
          d3.selectAll('.mark')
          .classed('deemphasized', false)
          .classed('regular', true);
        });
    }
  }
}

main();