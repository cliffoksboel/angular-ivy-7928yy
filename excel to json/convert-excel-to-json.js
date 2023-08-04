const Excel = require('exceljs');
const fs = require('fs');

function main(instrument) {
  // read from a file
  let preWorkbook = new Excel.Workbook();
  preWorkbook.xlsx.readFile(`./${instrument}.xlsx`)
    .then((workbook) => {
        const headers = workbook.getWorksheet('data').getTables()[0].table.columns.map(col => col.name);
        const rows = workbook._worksheets[2]._rows.slice(1);
        const returnObjects = [];
        let obj = {
          timestamp: 0,
          instrument: '',
          snapshot: {
            open: 0,
            high: 0,
            low: 0,
            close: 0,
            volume: 0,
          }
        };
        
        rows.forEach(row => {
          row._cells.forEach((cel, index) => {
            if (index === 0) obj.timestamp = new Date(cel._value.model.value).getTime();
            else if (index === 1) obj[headers[index]] = cel._value.model.value;
            else obj.snapshot[headers[index]] = cel._value.model.value
          });
          returnObjects.push(obj);
        });
      
        try {
          fs.writeFileSync(`./${instrument}.json`, JSON.stringify(returnObjects));
        } catch (err) {
          console.error(err);
        }
    });
}

main();