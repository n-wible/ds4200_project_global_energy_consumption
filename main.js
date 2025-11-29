const width = 1000;
const height = 700;

// tooltip and map for D3
const svg = d3.select("#map")
    .attr("width", width)
    .attr("height", height);
const tooltip = d3.select("#tooltip");

// projection for the world map
const projection = d3.geoNaturalEarth1()
    .scale(170)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// colors purple and ornage for the world map
const colorScale = d3.scaleLinear()
    .domain([0, 50, 100])
    .range(["#5e3c99", "#f6f4c0", "#e66101"]);

// the data for countries by the year and also current years
let energyByYear = {};
let currentYear = 1980;

// using GEOJSON & also the csv
Promise.all([
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
  d3.csv("energy_mix_1980_2023.csv")
]).then(([worldData, energyData]) => {

  energyData.forEach(d => {
    d.year = +d.year;
    d.renewables_share_energy = +d.renewables_share_energy;
    d.fossil_share_energy = +d.fossil_share_energy;

    if (d.coal_share_energy !== undefined) d.coal_share_energy = +d.coal_share_energy;
    if (d.oil_share_energy !== undefined) d.oil_share_energy = +d.oil_share_energy;
    if (d.gas_share_energy !== undefined) d.gas_share_energy = +d.gas_share_energy;
  });

  energyData.forEach(d => {
    if (!energyByYear[d.year]) {
      energyByYear[d.year] = {};
    }
    energyByYear[d.year][d.iso_code] = d;
  });

  // designing the map
  svg.append("g")
    .selectAll("path")
    .data(worldData.features)
    .join("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("stroke", "#888")
      .attr("stroke-width", 0.5)
      .attr("fill", "#eee")
      .on("mousemove", (event, d) => {
        const iso = d.id;
        const data = (energyByYear[currentYear] || {})[iso];

        if (data) {
          const lines = [
            `<strong>${data.country} (${currentYear})</strong>`,
            `Renewables: ${data.renewables_share_energy.toFixed(1)}%`,
            `Fossil: ${data.fossil_share_energy.toFixed(1)}%`];

          if (data.coal_share_energy != null) lines.push(`Coal: ${data.coal_share_energy.toFixed(1)}%`);
          if (data.oil_share_energy != null) lines.push(`Oil: ${data.oil_share_energy.toFixed(1)}%`);
          if (data.gas_share_energy != null) lines.push(`Gas: ${data.gas_share_energy.toFixed(1)}%`);

          tooltip.html(lines.join("<br>"))
            .style("visibility", "visible")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px");
        } else {
          tooltip.style("visibility", "hidden");}})
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");});

  // function to update the map every single year
  function updateMap(year) {
    currentYear = year;
    d3.select("#year-label").text(year);
    svg.selectAll("path.country")
      .transition()
      .duration(300)
      .attr("fill", d => {
        const iso = d.id;
        const data = (energyByYear[year] || {})[iso];
        if (!data || isNaN(data.renewables_share_energy)) {
          return "#ccc";}
        return colorScale(data.renewables_share_energy);});
  }

  updateMap(currentYear);
  // slider for each year
  d3.select("#year-slider").on("input", function() {
    updateMap(+this.value);
  });
}).catch(err => console.error("Error loading data:", err));
