'use strict';

import m from 'mithril';
import Chart from 'chart.js';

export default {
  view(vnode) {
    const model = vnode.attrs.model;
    model.config.data.labels = vnode.attrs.x; // values sent to module for X axis
    model.config.data.datasets[0].data = vnode.attrs.y;// values sent to module for Y axis

    return m(`.${model.config.type}`, [
      m('#canvas-holder', [
        m('canvas#chart', {
          oncreate(vnode) {
            const canvas = <HTMLCanvasElement> document.getElementById('chart'); //access created canvas
            const ctx = canvas.getContext('2d'); 
            model.instance = new Chart(ctx, model.config);
          }
        })
      ]),
    ])
  }
};