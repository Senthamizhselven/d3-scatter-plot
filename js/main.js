/*
 *    main.js
 *    Mastering Data Visualization with D3.js
 *    Project 2 - Gapminder Clone
 */

const MARGIN = { LEFT: 100, RIGHT: 10, TOP: 10, BOTTOM: 100 };
const HEIGHT = 500 - MARGIN.TOP - MARGIN.BOTTOM;
const WIDTH = 800 - MARGIN.LEFT - MARGIN.RIGHT;

let time = 0;
let interval;
let formattedData;
let isPaused = true;

const svg = d3
	.select('#chart-area')
	.append('svg')
	.attr('height', HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)
	.attr('width', WIDTH + MARGIN.LEFT + MARGIN.RIGHT);

const g = svg
	.append('g')
	.attr('transform', `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`);

const yScale = d3.scaleLinear().domain([0, 90]).range([HEIGHT, 0]);
const xScale = d3.scaleLog().domain([142, 250000]).range([0, WIDTH]);

const areaScale = d3
	.scaleLinear()
	.range([25 * Math.PI, 1500 * Math.PI])
	.domain([2000, 1400000000]);

const colorScale = d3.scaleOrdinal(d3.schemePastel1);

const xAxisCall = d3
	.axisBottom(xScale)
	.tickValues([400, 4000, 40000])
	.tickFormat(d3.format('$'));
const xAxis = g
	.append('g')
	.attr('class', 'x axis')
	.attr('transform', `translate(0,${HEIGHT})`)
	.call(xAxisCall);

const yAxisCall = d3.axisLeft(yScale);
const yAxis = g.append('g').attr('class', 'y axis').call(yAxisCall);

const yAxisLabel = g
	.append('text')
	.attr('class', 'y axis label')
	.attr('x', WIDTH / 2)
	.attr('text-anchor', 'middle')
	.attr('y', HEIGHT + 50)
	.text('GDP Per Capita ($)');

const xAxisLabel = g
	.append('text')
	.attr('class', 'x axis label')
	.attr('x', -(HEIGHT / 2))
	.attr('y', -(MARGIN.LEFT - 50))
	.attr('transform', 'rotate(-90)')
	.attr('text-anchor', 'middle')
	.text('Life Expectancy (years)');

const yearMarker = g
	.append('text')
	.attr('class', 'year marker')
	.attr('x', WIDTH - 50)
	.attr('y', HEIGHT - 10)
	.attr('text-anchor', 'middle')
	.attr('font-size', '40px')
	.attr('opacity', '0.4');

const continents = ['africa', 'americas', 'europe', 'asia'];
const legend = g
	.append('g')
	.attr('transform', `translate(${WIDTH - 10},${HEIGHT - 125})`);

continents.forEach((continent, i) => {
	const legendRow = legend
		.append('g')
		.attr('transform', `translate(0,${i * 20})`);
	legendRow
		.append('rect')
		.attr('width', 10)
		.attr('height', 10)
		.attr('fill', colorScale(continent));
	legendRow
		.append('text')
		.attr('x', -10)
		.attr('y', 10)
		.attr('text-anchor', 'end')
		.style('text-transform', 'capitalize')
		.text(continent);
});

/* Tooltip */
// initialize
const tip = d3
	.tip()
	.attr('class', 'd3-tip')
	.html((d) => {
		let text = `<strong>Country: </strong><span style='color:red; text-transform: capitalize;'>${d.country}</span><br>`;
		text += `<strong>Continent: </strong><span style='color:red; text-transform: capitalize;'>${d.continent}</span><br>`;
		text += `<strong>Population: </strong><span style='color:red'>${d3.format(
			',.0f'
		)(d.population)}</span><br>`;
		text += `<strong>GDP Per Capita: </strong><span style='color:red'>${d3.format(
			'$,.0f'
		)(d.income)}</span><br>`;
		text += `<strong>Life Expectancy: </strong><span style='color:red' >${d3.format(
			'.2f'
		)(d.life_exp)} Years</span><br>`;
		text += `<strong>`;
		return text;
	});

// set the context
g.call(tip);

d3.json('data/data.json').then(function (data) {
	formattedData = data.map((year) => {
		return year['countries']
			.filter((country) => {
				return country.income && country.life_exp;
			})
			.map((country) => {
				country.income = +country.income;
				country.life_exp = +country.life_exp;
				return country;
			});
	});

	// const chartInterval = setInterval(() => {
	// 	step(formattedData);
	// }, 200);

	update(formattedData[0]);
});

const step = () => {
	time = time < formattedData.length - 1 ? time + 1 : 0;
	update(formattedData[time]);
};

const areaToRadius = (area) => {
	return Math.sqrt(area / Math.PI);
};

$('#play-button').on('click', function () {
	const button = $(this);
	if (!isPaused) {
		clearInterval(interval);
		button.text('Play');
	} else {
		button.text('Pause');
		interval = setInterval(step, 100);
	}
	isPaused = !isPaused;
});

$('#reset-button').on('click', function () {
	time = 0;
	update(formattedData[0]);
});

$('#continent-select').on('change', function () {
	if (isPaused) update(formattedData[time]);
});

$('#date-slider').slider({
	max: 2014,
	min: 1800,
	step: 1,
	range: false,
	slide: (event, ui) => {
		time = ui.value - 1800;
		if (isPaused) update(formattedData[time]);
	},
});

const update = (data) => {
	const transition = d3.transition().duration(100);
	const continentFilter = $('#continent-select').val();
	if (continentFilter !== 'all') {
		data = data.filter((d) => d.continent === continentFilter);
	}
	const circles = g.selectAll('circle').data(data, (d) => d.country);

	circles.exit().remove();

	circles
		.enter()
		.append('circle')
		.on('mouseover', tip.show)
		.on('mouseout', tip.hide)
		.attr('fill', (d) => colorScale(d.continent))
		.merge(circles)
		.transition(transition)
		.attr('cx', (d) => xScale(d.income))
		.attr('cy', (d) => yScale(d.life_exp))
		.attr('r', (d) => areaToRadius(areaScale(d.population)));
	yearMarker.text(time + 1800);
	$('#year')[0].innerHTML = time + 1800 + '';
	$('#date-slider').slider('value', time + 1800);
};
