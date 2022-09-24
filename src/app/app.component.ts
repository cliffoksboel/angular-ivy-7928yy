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
      adjCount: 2,
    },
    {
      hrCount: 8,
      adjCount: 5,
    },
    {
      hrCount: 12,
      adjCount: 10,
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
      hrCount: 60,
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
  transitionTime: 1500;

  ngOnInit() {
    this.maxAllowed = d3.max(this.graphData, (d: any) => d.hrCount);
    this.drawLineGraph();
  }

  drawLineGraph() {
    this.margin = {
      top: 5,
      right: 10,
      bottom: 20,
      left: 25,
    };
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
    this.createShadowEffect();
    this.createAxis();
    this.createDataPathAndDots();

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
      /* .scaleBand() */
      /* .domain(this.graphData.map((d: any) => d.hrCount)) */
      .scaleLinear()
      .domain([0, d3.max(this.graphData, (d: any) => d.hrCount)])
      .range([0, this.width]);

    // y-scale
    this.yScale = d3
      .scaleLinear()
      .domain([0, this.maxAllowed])
      .range([this.height, 0]);
  }

  createYAxisGridLine(): void {
    this.g
      .append('g')
      .attr('class', 'y-axis-grid')
      .call(
        d3.axisLeft(this.yScale).tickSize(-this.width).tickFormat('').ticks(2)
      )
      .selectAll('line')
      .style('stroke', 'red')
      .style('stroke-dasharray', '4');
  }

  createShadowEffect(): void {
    const colorArray = [
      ['rgb(8, 141, 218)', '0.8'],
      ['rgb(8, 141, 218)', '0.5'],
      ['rgb(8, 141, 218)', '0.2'],
    ];
    const defs = this.g.append('defs');
    const grad = defs
      .append('linearGradient')
      .attr('id', 'grad')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%')
      .attr('gradientTransform', 'rotate(-15)');
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
        return 100 * (i / 2) + '%';
      });
    const area = d3
      .area()
      .y0(this.height)
      .y1((d: any) => d.y)
      .x((d: any) => d.x);

    this.g
      .append('path')
      .attr('fill', 'url(#grad)')
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
    // x-axis
    /* const xJump = 10;
    const xMax = Math.max(...this.graphData.map((d) => d.hrCount));
    let xRange = []; */
    /* for (let i = 0; i < xMax; i++) {
      xRange.push(i);
    } */
    /* if (xMax !== xRange[-1]) xRange.push(xMax); */

    this.xAxis = d3
      .axisBottom(this.xScale)
      /* .tickValues([0, 25, 50, 75, 100]) */
      .ticks(3)
      .tickSizeOuter(0);
    this.g
      .append('g')
      .attr('transform', 'translate(0, ' + this.height + ')')
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

    // y-axis
    this.yAxis = d3.axisLeft(this.yScale).ticks(3).tickSizeOuter(0);
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
  }

  createDataPathAndDots(): void {
    const line = d3
      .line()
      .x((d: any) => this.xScale(d.hrCount))
      /* .x((d: any) => this.xScale(d.hrCount) + this.xScale.bandwidth() / 2) */
      .y((d: any) => this.yScale(d.adjCount));
    const path = this.g
      .append('path')
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', '#088dda')
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
