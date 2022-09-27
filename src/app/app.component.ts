import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  maxAllowed = 0;
  graphData = [
    {
      hrCount: 0,
      adjCount: 0,
    },
    {
      hrCount: 4,
      adjCount: -2,
    },
    {
      hrCount: 8,
      adjCount: -8,
    },
    {
      hrCount: 12,
      adjCount: -10,
    },
    {
      hrCount: 16,
      adjCount: 13,
    },
    {
      hrCount: 20,
      adjCount: 19,
    },
    {
      hrCount: 24,
      adjCount: 25,
    },
    {
      hrCount: 28,
      adjCount: 33,
    },
    {
      hrCount: 32,
      adjCount: 37,
    },
    {
      hrCount: 36,
      adjCount: 40,
    },
    {
      hrCount: 40,
      adjCount: 42,
    },
    {
      hrCount: 44,
      adjCount: 44,
    },
    {
      hrCount: 48,
      adjCount: 47,
    },
    {
      hrCount: 52,
      adjCount: 48,
    },
    {
      hrCount: 56,
      adjCount: 50,
    },
    {
      hrCount: 58,
      adjCount: 53,
    },
  ];
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  width: number;
  height: number;
  g: any;
  xScale: any;
  yScale: any;
  xAxis: any;
  yAxis: any;
  yAxisScale: any;
  transitionTime: 1500;

  constructor() {
    this.margin = {
      top: 5,
      right: 10,
      bottom: 20,
      left: 25,
    };
  }

  ngOnInit() {
    this.maxAllowed = d3.max(this.graphData, (d: any) => d.hrCount);
    this.drawLineGraph();
  }

  drawLineGraph() {
    this.width =
      document.getElementById('svgcontainer').parentElement.offsetWidth -
      (this.margin.left + this.margin.right);
    this.height =
      document.getElementById('svgcontainer').parentElement.offsetHeight -
      (this.margin.top + this.margin.bottom) +
      80;

    // Remove any existing SVG
    d3.select('#svgcontainer').selectAll('svg > *').remove();

    this.createGroup();
    this.createScale();
    this.createYAxisGridLine();
    this.createXAxisGridLine();
    this.createShadowEffect();
    this.createAxis();
    this.createDataPath();

    // Removing y-axis 0 tick-line
    d3.selectAll('.y-axis-tick .tick line').each(function (d, i) {
      if (i === 0) {
        this.remove();
      }
    });
  }

  createGroup(): void {
    this.g = d3
      .select('#svgcontainer')
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .style('background-color', 'none')
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ', ' + this.margin.top + ')'
      );
  }

  createScale(): void {
    // x-scale
    this.xScale = d3
      .scaleLinear()
      .domain([0, d3.max(this.graphData, (d: any) => d.hrCount)])
      .range([0, this.width]);

    // y-scale
    this.yScale = d3
      .scaleLinear()
      .domain([
        Math.min(0, ...this.graphData.map((d) => d.adjCount)),
        Math.max(...this.graphData.map((d) => d.adjCount)),
      ])
      .range([this.height, 0]);
  }

  createYAxisGridLine(): void {
    const yMax = Math.max(...this.graphData.map((d) => d.adjCount));
    const yNumSteps = 3;
    const yStep = Math.ceil(yMax / yNumSteps);
    const ySteps = [yStep, yStep * 2, yMax];

    this.g
      .append('g')
      .attr('class', 'y-axis-grid')
      .call(
        d3
          .axisLeft(this.yScale)
          .tickSize(-this.width)
          .tickFormat('')
          .tickValues(ySteps)
      );
    this.g.select('.domain').remove();
    this.g
      .selectAll('.tick line')
      .style('stroke', 'red')
      .style('stroke-dasharray', '4');
  }

  createXAxisGridLine(): void {
    const xMax = Math.max(...this.graphData.map((d) => d.hrCount));
    const xNumSteps = 4;
    const xStep = Math.ceil(xMax / xNumSteps);
    const xSteps = [xStep, xStep * 2, xStep * 3, xMax];

    this.g
      .append('g')
      .attr('class', 'x-axis-grid')
      .call(
        d3
          .axisBottom(this.xScale)
          .tickSize(this.height)
          .tickFormat('')
          .tickValues(xSteps)
      );
    this.g.select('.domain').remove();
    this.g
      .selectAll('.tick line')
      .style('stroke', 'red')
      .style('stroke-dasharray', '4');
  }

  createShadowEffect(): void {
    const yMax = Math.max(...this.graphData.map((d) => d.adjCount));
    const yMin = Math.min(...this.graphData.map((d) => d.adjCount));
    const zero = (this.height / (yMax - Math.min(0, yMin))) * yMax;
    const zeroLinePercent = zero / this.height;
    const colorArray = [
      ['rgb(8, 141, 218)', '0.8', 0],
      ['rgb(8, 141, 218)', '0.5', zeroLinePercent / 2],
      ['rgb(8, 141, 218)', '0.2', zeroLinePercent],
      ['rgb(255, 64, 34)', '0.2', zeroLinePercent],
      ['rgb(255, 64, 34)', '0.5', (1 - zeroLinePercent) / 2 + zeroLinePercent],
      ['rgb(255, 64, 34)', '0.8', 1],
    ];
    const defs = this.g.append('defs');
    const grad = defs
      .append('linearGradient')
      .attr('id', 'areaGradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%');
    grad
      .selectAll('stop')
      .data(colorArray)
      .enter()
      .append('stop')
      .style('stop-color', (d: any) => {
        return d[0];
      })
      .style('stop-opacity', (d: any) => {
        return d[1];
      })
      .attr('offset', (d: any, i: any) => {
        return d[2] * 100 + '%';
      });
    const area = d3
      .area()
      .y0((d: any) => {
        if (d.y <= zero) {
          return d.y;
        } else {
          return zero;
        }
      })
      .y1((d: any) => {
        if (d.y <= zero) {
          return zero;
        } else {
          return d.y;
        }
      })
      .x((d: any) => d.x)
      .curve(d3.curveCardinal.tension(0.5));

    this.g
      .append('path')
      .attr('fill', 'url(#areaGradient)')
      .transition()
      .duration(1500)
      .attrTween('d', function (d) {
        var p = d3.select('.line').node(),
          l = p.getTotalLength(),
          i = d3.interpolate(0, l),
          dAtT = [];
        return function (t) {
          dAtT.push(p.getPointAtLength(i(t)));
          return area(dAtT);
        };
      });
  }

  createAxis(): void {
    // y-axis
    const yMax = Math.max(...this.graphData.map((d) => d.adjCount));
    const yNumSteps = 3;
    const yStep = Math.ceil(yMax / yNumSteps);
    const ySteps = [0, yStep, yStep * 2, yMax];

    this.yAxis = d3.axisLeft(this.yScale).tickValues(ySteps);
    this.g
      .append('g')
      .attr('class', 'graph-axis')
      .call(this.yAxis.scale(this.yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .attr('font', '10px sans-serif')
      .attr('letter-spacing', '1px')
      .attr('fill', '#8997b1')
      .text('Adjusters');

    // x-axis
    const xMax = Math.max(...this.graphData.map((d) => d.hrCount));
    const yMin = Math.min(...this.graphData.map((d) => d.adjCount));
    const xNumSteps = 4;
    const xStep = Math.ceil(xMax / xNumSteps);
    const xSteps = [xStep, xStep * 2, xStep * 3, xMax];
    const translate = (this.height / (yMax - Math.min(0, yMin))) * yMax;

    this.xAxis = d3.axisBottom(this.xScale).tickValues(xSteps);
    this.g
      .append('g')
      .attr('transform', 'translate(0, ' + translate + ')')
      .attr('class', 'graph-axis')
      .call(this.xAxis.scale(this.xScale))
      .append('text')
      .attr('x', this.width)
      .attr('y', -6)
      .attr('text-anchor', 'end')
      .attr('font', '10px sans-serif')
      .attr('letter-spacing', '1px')
      .attr('fill', '#8997b1')
      .text('Hours');
  }

  createDataPath(): void {
    const yMax = Math.max(...this.graphData.map((d) => d.adjCount));
    const yMin = Math.min(...this.graphData.map((d) => d.adjCount));
    const zero = (this.height / (yMax - Math.min(0, yMin))) * yMax;
    const zeroLinePercent = zero / this.height;
    const colorArray = [
      ['rgb(8, 141, 218)', 0],
      ['rgb(8, 141, 218)', zeroLinePercent],
      ['rgb(255, 64, 34)', zeroLinePercent],
      ['rgb(255, 64, 34)', 1],
    ];
    const defs = this.g.append('defs');
    const grad = defs
      .append('linearGradient')
      .attr('id', 'lineGradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%');
    grad
      .selectAll('stop')
      .data(colorArray)
      .enter()
      .append('stop')
      .style('stop-color', (d: any) => {
        return d[0];
      })
      .attr('offset', (d: any, i: any) => {
        return d[1] * 100 + '%';
      });
    const line = d3
      .line()
      .x((d: any) => this.xScale(d.hrCount))
      .y((d: any) => this.yScale(d.adjCount))
      .curve(d3.curveCardinal.tension(0.5));
    const path = this.g
      .append('path')
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', 'url(#lineGradient)')
      .attr('stroke-width', '2px')
      .attr('d', line(this.graphData));

    /* Transition */
    const totLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totLength + ' ' + totLength)
      .attr('stroke-dashoffset', totLength);
    path.transition().duration(1500).attr('stroke-dashoffset', 0);
  }
}
