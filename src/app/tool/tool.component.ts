import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';
import Chart from 'chart.js';
import {Group, Row} from './model/row.model';
import {Observable, of} from 'rxjs/';

@Component({
  selector: 'app-tool',
  templateUrl: './tool.component.html',
  styleUrls: ['./tool.component.scss']
})
export class ToolComponent implements OnInit {
  navigations: string;
  tasks: string;
  importance: string;
  type: string;
  tableData: Array<Group> = [];
  visibleData: Array<Group> = [];
  rowID: number;
  filterColumns = ['type', 'navigations', 'tasks', 'importance'];

  fileIsUploaded = false;

  usability = 0;
  usabilityList = [];
  usabilityCount = [];
  functionsTypeList: Array<any> = [];
  functionsTypeCount: Array<number> = [];

  usabilityGroup: any = [];
  usabilityTotal: any;

  errorList: any = [];
  mainPageErrorPresent = false;

  showUsability = false;
  showPlots = false;
  private id = 1;

  constructor() {
    this.tableData.push(
      new Group([new Row(this.getUniqueId(), 'Discover', 'Search', 2, 0, 1)]),
      new Group([new Row(this.getUniqueId(), 'Create', 'Search', 3, 2, 2)]),
      new Group([new Row(this.getUniqueId(), 'Edit', 'Search', 3, 2, 2)]),
      new Group([new Row(this.getUniqueId(), 'Discover', 'Search', 2, 1, 2)]),
      new Group([new Row(this.getUniqueId(), 'Discover', 'Search', 3, 2, 3)]),
    );
    this.visibleData.push(...this.tableData);

  }

  reset() {
    this.navigations = '';
    this.tasks = '';
    this.importance = '';
    this.type = '';
    this.visibleData = this.tableData;
  }


  addRow(id) {
    const rowId = this.getUniqueId();
    id.push(new Row(rowId));
    this.rowID = rowId;
  }

  addGroup() {
    const id = this.getUniqueId();
    const group = new Group([new Row(id)]);
    this.tableData.push(group);
    this.rowID = id;
    this.reset();
  }

  // addGroup this.datatable1 in petqa push ani datark group
  // addrow stanuma groupy u et groupi meji row erum petqa push ani nor sarqc rown

  editRow(value) {
    this.rowID = value;
  }

  deleteRow(value, origin) {
    origin.rows.splice(origin.rows.findIndex(x => x.id === value.id), 1);
    if (origin.rows.length === 0) {
      this.tableData = this.tableData.filter((group: Group) => group.rows.length != 0);
      this.visibleData = this.visibleData.filter((group: Group) => group.rows.length != 0);
    }
  }

  filterList() {
    this.visibleData = this.tableData;
    this.filterColumns.forEach(columnName => this.filterListByColumn(columnName, this[columnName]));
  }

  filterListByColumn(filteredColumn: string, value: any) {
    // if(value === 0 || value === undefinde || value === null){
    //
    // }
    let result: Array<Group> = [];
    const isEmptyFilter: boolean = value === null || value === undefined || value.toString().trim() === '';
    this.visibleData
      .forEach(g => {
        result.push(new Group(filterGroup(g)));
      });

    result = result.filter((g: Group) => g.rows.length !== 0);
    this.visibleData = result;

    function filterGroup(group: Group): Array<Row> {
      return group.rows.filter(row => {
        return isEmptyFilter || (row[filteredColumn] !== undefined && row[filteredColumn] !== null && row[filteredColumn] == value);
      });
    }

  }

  saveRow() {
    this.rowID = 0;
  }

  calculateDataLength() {
    let count = 0;
    for (let i = 0; i < this.visibleData.length; i++) {
      for (let j = 0; j < this.visibleData[i].rows.length; j++) {
        count++;
      }
    }
    return count;
  }

  doCalculation(i, j) {
    const importanceValue = this.tableData[i].rows[j].importance;
    const tasksValue = this.tableData[i].rows[j].tasks;
    const navigationsValue = this.tableData[i].rows[j].navigations;
    const type = this.tableData[i].rows[j].type;
    this.functionsTypeList.push(type);
    // const log =  Math.log(importanceValue + 1) / Math.log(2);
    let usabilityValue = importanceValue / (0.8 * tasksValue + 1.2 * navigationsValue);
    if (navigationsValue < importanceValue - 1) {
      const difference = importanceValue - 1 - navigationsValue;
      usabilityValue = usabilityValue * (100 - difference) / 100;
    }
    this.usabilityList.push(usabilityValue);
    this.usability += usabilityValue;
  }

  calculate() {
    this.calculateUsability();
    this.drawPlots();
  }

  calculateUsability() {
    this.usability = 0;
    this.usabilityGroup = [];
    this.usabilityList = [];
    for (let i = 0; i < this.visibleData.length; i++) {
      for (let j = 0; j < this.visibleData[i].rows.length; j++) {
        const importanceValue = this.tableData[i].rows[j].importance;
        const tasksValue = this.tableData[i].rows[j].tasks;
        const navigationsValue = this.tableData[i].rows[j].navigations;
        if (importanceValue <= (0.8 * tasksValue + 1.2 * navigationsValue)) {
          this.doCalculation(i, j);
        } else {
          let usabilityValue = 1;
          const difference = importanceValue - 1 - navigationsValue;
          if (navigationsValue < importanceValue - 1) {usabilityValue = usabilityValue * (100 - difference) / 100; }
          this.usabilityList.push(usabilityValue);
          this.usability += usabilityValue;
        }
      }
      this.usabilityGroup.push(this.usability / this.visibleData[i].rows.length);
      this.usability = 0;
    }
    this.findErrors();
    this.usabilityTotal = this.usabilityGroup.reduce((partial_sum, a) => partial_sum + a) / this.visibleData.length;
    this.usabilityTotal = this.usabilityTotal.toFixed(4);
    this.showUsability = true;
  }

  cumulativeLength(index) {
    let acc = 0;
    for (let i = 0; i < index; i++) {
      acc += this.visibleData[i].rows.length;
    }
    return acc;
  }

  getResultColor(i, j) {
    const usaRange = this.usabilityList[this.cumulativeLength(j) + i].toFixed(2) * 50;
    if (usaRange <= 12.5) {return 'rgba(255, 0, 0, 0.59)'; }
    if (usaRange > 12.5 && usaRange <= 25) {return 'rgba(255, 165, 0, 0.68)'; }
    if (usaRange > 12.5 && usaRange <= 50) {return 'rgba(0, 128, 0, 0.69)'; }
  }

  findErrors() {
    this.errorList = [];
    this.mainPageErrorPresent = false;
    let numberOfNavs = 0;
    let numberOfImp = 0;
    for (let i = 0; i < this.visibleData.length; i++) {
      for (let j = 0; j < this.visibleData[i].rows.length; j++) {
        if (this.visibleData[i].rows[j].navigations < this.visibleData[i].rows[j].importance - 1) {
          this.errorList.push(this.visibleData[i].rows[j].id);
        }
        if (this.visibleData[i].rows[j].navigations === 0) {
          numberOfNavs++;
        }
        if (this.visibleData[i].rows[j].importance === 1) {
          numberOfImp++;
        }
      }
    }
    if (numberOfNavs > numberOfImp) {
      this.mainPageErrorPresent = true;
      this.usabilityTotal = this.usabilityTotal / 3;
    }
  }

  getData() {
    const navData = [];
    const tasksData = [];
    const importanceData = [];
    for (let i = 0; i < this.visibleData.length; i++) {
      for (let j = 0; j < this.visibleData[i].rows.length; j++) {
        navData.push(this.visibleData[i].rows[j].navigations);
        tasksData.push(this.visibleData[i].rows[j].tasks);
        importanceData.push(this.visibleData[i].rows[j].importance);
      }
    }
    return {navData, tasksData, importanceData};
  }

  extractingData(data) {
    const dataFirst: Array<number> = [];
    const dataSecond: Array<number> = [];
    const length: number = Math.max(...data);
    for (let i = 0; i <= length; i++) {dataSecond.push(0); }
    for (let i = 0; i <= length; i++) {dataFirst.push(i); }
    data.sort((x, y) => {
      return x - y;
    });
    data.forEach(x => dataSecond[x]++);

    return [dataFirst, dataSecond];
  }

  thirdPlotData() {
    const count: Array<number> = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.usabilityList.forEach(x => count[Math.round(x * 10)]++);
    this.usabilityCount = count;
  }

  fourthPlotData() {
    const count: Array<number> = [];
    this.functionsTypeList.sort();
    this.functionsTypeList.forEach(x => count[x] = (count[x] || 0) + 1);
    this.functionsTypeCount = count;
    console.log(typeof this.functionsTypeCount);
  }

  drawPlots() {
    this.thirdPlotData();
    this.showPlots = true;
    const mainData: any = this.getData();

    const navigation = this.extractingData(mainData.navData);
    const tasks = this.extractingData(mainData.tasksData);
    const importance = this.extractingData(mainData.importanceData);

    const firstPlotContainer = document.getElementById('firstChart');
    const firstChart = new Chart(firstPlotContainer, {
      type: 'line',
      data: {
        labels: (tasks[0].length > navigation[0].length) ? tasks[0] : navigation[0],
        datasets: [{
          label: 'Frequency of Tasks',
          data: tasks[1],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }, {label: 'Frequency of Navigations',
            data: navigation[1],
            backgroundColor: 'rgba(61, 235, 70, 0.2)',
            borderColor: 'rgba(61, 235, 70, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        },
        tooltips: {
          callbacks: {
            title: function (tooltipItems, data) {
              const title = tooltipItems[0] || '';

              if (title) {
                return 'Step with length ' + data.labels[title.index];
              }
            }
          }
        }
      }
    });

    const secondPlotContainer = document.getElementById('secondChart');
    const secondChart = new Chart(secondPlotContainer, {
      type: 'line',
      data: {
        labels: importance[0],
        datasets: [{
          label: 'Frequency of Importance',
          data: importance[1],
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Importance'
            }
          }]
        },
        tooltips: {
          callbacks: {
            title: function (tooltipItems, data) {
              const title = tooltipItems[0] || '';

              if (title) {
                return 'Importance value ' + data.labels[title.index];
              }
            }
          }
        }
      }
    });
    const thirdPlotContainer = document.getElementById('thirdChart');
    const thirdChart = new Chart(thirdPlotContainer, {
      type: 'line',
      data: {
        labels: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        datasets: [{
          label: 'Frequency of Usability',
          data: this.usabilityCount,
          backgroundColor: 'rgba(255,158,109, 0.2)',
          borderColor: 'rgb(255,158,109, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Usability (J)'
            }
          }]
        },
        tooltips: {
          callbacks: {
            title: function (tooltipItems, data) {
              const title = tooltipItems[0] || '';

              if (title) {
                return 'Importance value ' + data.labels[title.index];
              }
            }
          }
        }
      }
    });
    this.fourthPlotData();
    const fourthPlotContainer = document.getElementById('fourthChart');
    const fourthChart = new Chart(fourthPlotContainer, {
      type: 'bar',
      data: {
        labels: Object.keys(this.functionsTypeCount),
        datasets: [{
          label: 'Frequency of Function Types',
          data: Object.values(this.functionsTypeCount),
          backgroundColor: 'rgba(89, 255, 242, 0.2)',
          borderColor: 'rgba(89, 255, 242, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: false,
            }
          }]
        },
        tooltips: {
          callbacks: {
            title: function (tooltipItems, data) {
              const title = tooltipItems[0] || '';

              if (title) {
                return data.labels[title.index];
              }
            },
            label: function (tooltipItem, data) {
              const label = data.datasets[tooltipItem.datasetIndex].label || '';

              if (label) {
                return 'Frequency: ' + tooltipItem.yLabel;
              }
            }
          }
        }
      }
    });
  }


  ngOnInit() {
    this.loadData().subscribe(data => {
      // Overriding the default data
      if (data) {
        this.tableData = data;
        this.visibleData = this.tableData;
        this.id = 1;
        this.tableData.forEach((gr: Group) => {
          this.id += gr.rows.length * 10;
        });
      }
    });
  }

  private getUniqueId(): number {
    return this.id++;
  }

  save(): void {
    localStorage.setItem('functionsData', JSON.stringify(this.tableData));
  }

  checkFilePresent(elm) {
    elm.valueOf().tableData.length ? this.fileIsUploaded = true : this.fileIsUploaded = false;
  }

  download() {
    const tableData = JSON.parse(localStorage.getItem('functionsData'));
    const data = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tableData));
    const elm = document.getElementById('downloadBtn');

    elm.setAttribute('href', data);
    elm.setAttribute('download', 'data.json');
    elm.click();
  }

  importData() {
    // Empty the old results
    this.usabilityGroup = [];
    this.usabilityTotal = null;
    // Gets data from selected file
    const data = (<HTMLInputElement>document.getElementById('selectData')).files;
    if (!data.length) {
      this.fileIsUploaded = false;
      return 0;
    }
    // Reads data
    const readData = new FileReader();
    const newData: Array<Group> = [];
    readData.onload = function() {
     const result = JSON.parse(readData.result);
      newData.push(...result);
    };
    readData.readAsText(data.item(0));
    // Changes the ids of rows
    this.tableData = newData;
    this.visibleData = this.tableData;
    this.id = 1;
    this.tableData.forEach((gr: Group) => {
      this.id += gr.rows.length * 10;
    });
  }

  loadData(): Observable<any> {
    const data = localStorage.getItem('functionsData');
    return of(JSON.parse(data));
  }
}
