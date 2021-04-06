/* eslint-disable no-unused-vars */
import React from 'react'
import * as d3 from 'd3'

import {
    cvgCartoonMap,
    genomeBins,
    colorMap,
    sectionMargin,
    sectionWidth,
    sectionHeight,
    tableShiftY,
    barWidth,
    barHeight,
    barBorder,
    drawLegend,
    addHeaders,
    addColumns,
    getCoverageData,
} from '../Chart/ChartHelpers'

const chartId = 'run-family-lookup-chart'

export const Chart = () => {
    return <div id={chartId} />
}

const familyNameKey = 'family_id'
const familyCoverageKey = 'coverage_bins'

export const renderChart = (results, colMap, d3InterpolateFunction, drilldownCallback) => {
    const chartSvg = d3.select(`#${chartId}`).append('svg').attr('viewBox', `0 0 750 250`)
    const familiesSvg = chartSvg.append('svg').attr('y', tableShiftY)

    drawLegend(familiesSvg, d3InterpolateFunction)

    const columnTooltipSvgText = chartSvg.append('text').attr('id', 'tooltip')
    const columnHeadersG = chartSvg
        .append('g')
        .attr('transform', `translate(0, ${tableShiftY - sectionHeight})`)
    addHeaders(columnHeadersG)
    addColumns(columnHeadersG, colMap)

    results.forEach((family, i) => {
        const familyG = familiesSvg
            .append('g')
            .attr('class', 'family')
            .attr('rowid', `${family[familyNameKey]}`)
        drawExpandableRow({
            gElement: familyG,
            name: family[familyNameKey],
            rowType: 'family',
            coverageData: getCoverageData(family, familyCoverageKey),
            rowIndex: i,
            d3InterpolateFunction: d3InterpolateFunction,
            drilldownCallback: drilldownCallback,
        })
        addColumns(familyG.select('svg'), colMap, family)
    })
}

function drawExpandableRow({
    gElement,
    name,
    rowType,
    coverageData,
    rowIndex,
    d3InterpolateFunction,
    drilldownCallback,
}) {
    const entrySvg = gElement
        .append('svg')
        .attr('y', rowIndex * sectionHeight)
        .attr('width', sectionWidth)
        .attr('height', sectionHeight)
        .attr('border', barBorder.size)
        .style('display', 'block')

    const entryG = entrySvg
        .append('g')
        .attr('transform', `translate(${sectionMargin.left}, ${sectionMargin.top})`)

    const x = d3.scaleBand().range([0, barWidth]).domain(genomeBins).padding(0.01)

    const y = d3.scaleBand().range([0, barHeight]).domain([name]).padding(0.01)
    const yAxis = entryG.append('g').call(d3.axisLeft(y))
    yAxis.select('path').remove()
    yAxis.select('line').remove()
    yAxis
        .selectAll('text')
        .style('font-size', 12)
        .style('fill', 'blue')
        .style('cursor', 'pointer')
        .each(function (d, i) {
            const link = `${window.location.pathname}?${rowType}=${name}`
            const textWidth = 100
            const textHeight = 14
            const linkA = d3.select(this.parentNode).append('a').attr('href', link)
            linkA
                .append('rect')
                .attr('x', -textWidth)
                .attr('y', -8)
                .attr('width', textWidth)
                .attr('height', textHeight)
                .attr('fill', 'black')
                .style('opacity', 0)
        })

    const heatMap = entryG.append('g').attr('class', 'heatmap')

    const heatSquares = heatMap
        .selectAll()
        .data(coverageData)
        .enter()
        .append('rect')
        .attr('x', (d) => x(d.bin))
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .style('fill', (d) => colorMap(cvgCartoonMap[d.cartoonChar], d3InterpolateFunction))

    const barBorderPath = entryG
        .append('rect')
        .attr('class', 'heatmap-border')
        .attr('width', barWidth)
        .attr('height', barHeight)
        .style('fill', 'none')
        .style('stroke', barBorder.color)
        .style('stroke-width', barBorder.size)

    const clickExpandRect = entryG
        .append('rect')
        .attr('class', 'heatmap-click')
        .attr('visibility', 'visible')
        .attr('width', barWidth)
        .attr('height', barHeight)
        .style('opacity', 0)
        .style('cursor', 'pointer')
        .on('click', () => drilldownCallback(name))
}