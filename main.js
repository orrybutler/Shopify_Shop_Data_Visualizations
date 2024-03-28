let abFilter = 25
const width = window.innerWidth;
const height = window.innerHeight;

let scatterLeft = 0, scatterTop = 0;
let scatterMargin = {top: 10, right: 30, bottom: 30, left: 60},
    scatterWidth = 400 - scatterMargin.left - scatterMargin.right,
    scatterHeight = 350 - scatterMargin.top - scatterMargin.bottom;

let distrLeft = 400, distrTop = 0;
let distrMargin = {top: 10, right: 30, bottom: 30, left: 60},
    distrWidth = 400 - distrMargin.left - distrMargin.right,
    distrHeight = 350 - distrMargin.top - distrMargin.bottom;

let teamLeft = 0, teamTop = 400;
let teamMargin = {top: 100, right: 30, bottom: 100, left: 60},
    teamWidth = width - teamMargin.left - teamMargin.right,
    teamHeight = height/2 - teamMargin.top - teamMargin.bottom;

var svg = d3.select("svg")
var path = d3.geoPath()
const allie_data = d3.csv("data.csv")
const usPromise = d3.json("https://d3js.org/us-10m.v2.json")
const stateCounty = d3.json("https://gist.githubusercontent.com/vitalii-z8i/bbb96d55d57f1e4342c3408e7286d3f2/raw/3b9b1fba8b226359d5a025221bb2688e9807c674/counties_list.json")
let state_data_count = []
let state_list = []
let state_count = []
let date_list = []
let date_count = []
// console.log(allie_data)
// console.log(stateCounty)

allie_data.then(function(list) {
    let purchases = list.filter( function(d) {
        if (d.TransactionType == 'product') {
            return d
        }
    })
    for(let i = 0; i < purchases.length; i++) {
        if (purchases[i].ShippingCountry == "United States") {
            if (state_list.includes(purchases[i].ShippingRegion)) {
                let position = state_list.indexOf(purchases[i].ShippingRegion)
                state_count[position] = state_count[position] + 1
            }
            else {
                state_list.push(purchases[i].ShippingRegion)
                state_count.push(1)
            }
        }
        if (date_list.includes(purchases[i].Date.slice(0,7))) {
            // console.log(puchases[i].Date.slice(0, 6))
            let position = date_list.indexOf(purchases[i].Date.slice(0,7))
            date_count[position] = state_count[position] + 1
        }
        else {
            date_list.push(purchases[i].Date.slice(0, 7))
            date_count.push(1)
            // console.log(purchases[i].Date.slice(0, 7))
        }
    }
    updateVisualization()
})
function updateVisualization() { 
    usPromise.then(function(us) {
        // console.log(state_list)
        // console.log(state_count)
        let state_data = topojson.feature(us, us.objects.states).features

        for (let i = 0; i< state_data.length; i++) {
            if (state_list.includes(state_data[i].properties.name)) {
                let position = state_list.indexOf(state_data[i].properties.name)
                state_data[i].properties.count = state_count[position]
            }
            else {
                state_data[i].properties.count = 0
            }
        }

        const colorScale = d3.scaleLinear()
        .domain([0, d3.max(state_data, d => d.properties.count)]) // Domain based on the range of counts
        .range(['#FFEBEB', '#FF1493']); // Range of colors 

        const g1 = svg.append("g")
        .attr("width", scatterWidth)
        .attr("height", scatterHeight)
        .attr("transform", `translate(${scatterMargin.left})`)
        const path = d3.geoPath()
        g1.selectAll("path")
        .data(state_data)
        .enter()
        .append("path")
        .attr('d', path)
        .attr("stroke", "white")
        .attr("fill", function(d) {
            return colorScale(d.properties.count)
        }).on("mouseover", function(d) {
            svg.append("text")
            .classed("hover_text", true)
            .attr("font-size", "15px")
            .attr("x", d3.event.pageX - 30)
            .attr("y", d3.event.pageY - 30)
            .text(d.properties.name + ", " + d.properties.count)
            g1.selectAll("path")
            .attr("opacity", function(state) {
                if (state.properties.name == d.properties.name) {
                    return 1
                } else {
                    return 0.1
                }
            })
            .attr("fill", function(state) {
                if (state.properties.name == d.properties.name) {
                    return colorScale(state.properties.count)
                } else {
                    return "gray"
                }
            })
        }).on("mousemove", function(d) {
            svg.select(".hover_text")
            .attr("x", d3.event.pageX - 30)
            .attr("y", d3.event.pageY - 30)
        }).on("mouseout", function(d) {
            svg.select(".hover_text").remove()
            g1.selectAll("path")
            .attr("opacity", function(state) {
                return 1
            })
            .attr("fill", function(state) {
                return colorScale(state.properties.count)
            })

        })
    })

    const g2 = svg.append('g')
    .attr("width", teamWidth)
    .attr("height", teamHeight)
    .attr("transform", `translate(${teamMargin.left})`)
    
    const x2 = d3.scaleBand()
    .domain(date_list.map(function(d) {
        return d
    }))
    .range([0, teamWidth])
    .padding(0.2)

    const xAxisCall2 = d3.axisBottom(x2)
    g2.append("g")
    .attr("transform", `translate(0, ${height - 100})`)
    .call(xAxisCall2)
    .selectAll("text")
        .attr("y", "10")
        .attr("x", "-5")
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .attr("fill", "black")

    const y2 = d3.scaleLinear()
    .domain([0, d3.max(date_count, function(d) {
        return d
    })])
    .range([teamHeight, 0])
    const yAxisCall = d3.axisLeft(y2).ticks(7)

    g2.append("g")
    .attr("transform", `translate(0, ${height/2 + teamMargin.top})`)
    .call(yAxisCall)

    const date_data = []

    for (let i = 0; i < date_list.length; i++) {
        date_data.push([date_list[i], date_count[i]])
    }

    // console.log(date_data)
    
    const rects2 = g2.selectAll("rect").data(date_data)

    rects2.enter().append("rect")
    .attr("y", function(d) {
        return y2(d[1])
    })
    .attr("x", function(d) {
        return x2(d[0])
    })
    .attr("width", x2.bandwidth)
    .attr("height", d => teamHeight - y2(d[1]))
    .attr("transform", `translate(0, ${height/2 + teamMargin.top})`)
    .attr("fill", "#DA70D6")

}

console.log(await findTopProductsByType("2021-03", "Hoodies"))

async function findTopProducts(purchaseDate) {
    const shoplist = await allie_data
    console.log(purchaseDate)
    let purchaseCount = []
    let purchaseItem = []
    let topMonthlyPurchase = ""
    let purchases = shoplist.filter( function(d) {
        if (d.TransactionType == 'product') {
            return d
        }
    })
    for (let i = 0; i < purchases.length; i++) {
        // console.log(purchases[i].Date.slice(0, 7))
        if (purchases[i].Date.slice(0, 7) == purchaseDate) {
            if (purchaseItem.includes(purchases[i].Product)) {
                let position = purchaseItem.indexOf(purchases[i].Product)
                purchaseCount[position] = purchaseCount[position] + 1
            }
            else {
                purchaseItem.push(purchases[i].Product)
                purchaseCount.push(1)
            }
        }
    }
    let max_index = 0;
    let array_max = 0;
    for (let i = 0; i < purchaseCount.length; i ++) {
        if (purchaseCount[i] > array_max) {
            max_index = i;
            array_max = purchaseCount[i]
        }
    }
    console.log(purchaseItem[max_index])
    topMonthlyPurchase = purchaseItem[max_index]

    return topMonthlyPurchase
}

async function findTopProductsByType(purchaseDate, purchaseType) {
    const shoplist = await allie_data
    console.log(purchaseDate)
    console.log(purchaseType)
    let purchaseCount = []
    let purchaseItem = []
    let topMonthlyPurchase = ""
    let purchases = shoplist.filter( function(d) {
        if (d.TransactionType == 'product') {
            return d
        }
    })
    for (let i = 0; i < purchases.length; i++) {
        // console.log(purchases[i].Date.slice(0, 7))
        if (purchases[i].Date.slice(0, 7) == purchaseDate && purchases[i].ProductType == purchaseType) {
            if (purchaseItem.includes(purchases[i].Product)) {
                let position = purchaseItem.indexOf(purchases[i].Product)
                purchaseCount[position] = purchaseCount[position] + 1
            }
            else {
                purchaseItem.push(purchases[i].Product)
                purchaseCount.push(1)
            }
        }
    }
    let max_index = 0;
    let array_max = 0;
    for (let i = 0; i < purchaseCount.length; i ++) {
        if (purchaseCount[i] > array_max) {
            max_index = i;
            array_max = purchaseCount[i]
        }
    }
    console.log(purchaseItem[max_index])
    topMonthlyPurchase = purchaseItem[max_index]

    return topMonthlyPurchase
}

