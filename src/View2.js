import React, { useState } from 'react';
import { config } from './manager/ConfigManager';
import { SuccessToast } from './shared/Alerts';

const ipcRenderer = window.require('electron').ipcRenderer;
const fs = window.require('fs');
let rawdata = fs.readFileSync(`./tables.json`);
let data = JSON.parse(rawdata);

const GetColumnData = (TableName) => {
  let arr = []
  Object.entries(data[TableName]["columns"]).forEach(([key, val], index) => {
    if (key === 'LOOP' || key === 'LOOP2' || key === 'LOOP3' || key === 'LOOP4') {
      for (let num = 0; num < val['NUM']; num++) {
        for (let index = 0; index < Object.entries(val['DATA']).length; index++) {
          arr.push({ table: Object.keys(val['DATA'])[index], display: Object.values(val['DATA'])[index]['display'], options: Object.values(val['DATA'])[index]['options'], related: Object.values(val['DATA'])[index]['related'], loop: num })
        }
      }
    }
    else {
      arr.push({ table: key, display: val.display, options: val.options, related: val.related })
    }
  })
  return arr;
}

const LoadTable = (ObjectData, TableName, Tblidx) => {
  let table = [];
  let tableObj = [];
  const { app } = window.require('electron').remote
  console.log(app.getAppPath());
  const fs = window.require('fs')
  const filePath = `./script/${TableName}.txt`;
  const file = fs.readFileSync(filePath, 'utf8');
  file.split("\n").forEach((item) => {
    if (item.includes("//") === false && item !== "") {
      table.push(item.split("\t"));
    }
  })
  table.forEach((row) => {
    let table2 = [];
    let rowNum = 0;
    if (row[rowNum] === Tblidx) {
      Object.entries(ObjectData).forEach(([key, val]) => {
        if (val['table'] !== undefined || row[rowNum] !== undefined || val['display'] !== undefined) {
          if (Array.isArray(val['table']) === false) {
            if (val['loop'] !== undefined) table2.push({ [val['table']]: row[rowNum], display: val['display'], options: val['options'], related: val['related'], loop: val['loop'] })
            else table2.push({ [val['table']]: row[rowNum], display: val['display'], options: val['options'], related: val['related'] })
            rowNum += 1;
          }
        }
      })
      tableObj.push(table2);
      return tableObj;
    }

  })
  return tableObj;
}

const SaveTable = (CurrentItem, TableName, Tblidx) => {
  let table = [];
  let tableObj = [];
  const fs = window.require('fs');
  const filePath = `./script/${TableName}.txt`;
  const file = fs.readFileSync(filePath, 'utf8');

  let item = [];
  CurrentItem.map((row) =>
    row.map((columns) =>
      Object.entries(columns).filter(([key, val]) => key !== 'display' && key !== 'options' && key !== 'related' && key !== 'loop').map(([key, val]) =>
        item.push(val)
      )
    )
  )

  file.split("\n").forEach((item) => {
    if (item.includes("//") === false && item !== "") {
      table.push(item.split("\t"));
    }
  })
  table.forEach((row) => {
    let table2 = [];
    let rowNum = 0;
    if (row[rowNum] !== Tblidx) tableObj.push(row);
    else tableObj.push(item);
  })

  const output = tableObj.map((row) =>
    row.map((columns) =>
      columns
    ).join("\t")
  ).join("\n")

  fs.writeFileSync(`./script/${TableName}.txt`, output)
  SuccessToast.fire(`Saved ${TableName}.txt`)
}

export default function View2() {
  const [state, setState] = useState({ isLoaded: false, currentItem: null, tableName: null, tblidx: null })

  ipcRenderer.on('fromViewWindow', function (event, arg) {
    if (state.isLoaded === false)
      setState({ isLoaded: true, currentItem: LoadTable(GetColumnData(arg.TableName[2]), arg.TableName[2], arg.Tblidx), tableName: arg.TableName, tblidx: arg.Tblidx })
  });

  const handleUpdate = (e, key, val, l = false) => {
    let curItem = state.currentItem
    if (!curItem[0].length) {
      return console.error("CurrItem invalid")
    }
    let i = null
    if (l && l >= 0) {
      i = { ...curItem[0].find((x, k) => x[key] === val && (x.loop && x.loop === l)) }
    } else {
      i = { ...curItem[0].find((x, k) => x[key] === val) }
    }
    if (!i) {
      return console.error("No index")
    }
    let index = null

    if (l && l >= 0) {
      index = curItem[0].indexOf(curItem[0].find(x => x[key] === i[key] && (x.loop && x.loop === l)))
    } else {
      index = curItem[0].indexOf(curItem[0].find(x => x[key] === i[key]))
    }

    i[key] = e.target.value
    curItem[0][index] = { ...i }
    setState({ ...state, currentItem: [...curItem] })
  }

  return (
    <div className="App bg-background overflow-hidden min-h-screen w-full text-pink font-bold overscroll-none p-0 m-0">
      <div className="header fixed w-full flex h-[35px] bg-background" style={{ WebkitAppRegion: 'drag' }}>
        <h1 className='place-self-center ml-5 text-xs'>Table Editor</h1>
        <button onClick={() => {
          const remote = window.require('electron').remote
          remote.getCurrentWindow().hide();
        }} className="btn-primary px-7 h-full font-bold bg-foreground hover:border-r-2 hover:-translate-x-1 ml-auto" style={{ WebkitAppRegion: 'no-drag' }}>
          <i className="fas fa-times m-auto"></i>
        </button>
      </div>

      <div className="tabs fixed flex w-full bg-line h-[50px] items-center select-none mt-[35px]">
        {state.tableName && <label className='ml-5 font-bold text-sm text-background'>{state.tableName[0]} {'>'} {state.tableName[1]} {'>'} {state.tableName[2]}</label>}
        {state.currentItem && <button onClick={() => SaveTable(state.currentItem, state.tableName[2], state.tblidx)} className={`btn-primary w-[150px] ml-auto px-5 h-full font-bold bg-foreground hover:border-b-2 hover:-translate-y-1`}>Save Table</button>}
      </div>

      {
        state.isLoaded &&
        <div className="overflow-scroll h-full space-y-1 w-full pt-[90px]">
          {
            state.currentItem[0] && Object.values(state.currentItem[0]).map((data, index) =>
              Object.entries(data).map(([key, val]) =>
                data['display'] === true && key !== 'display' && key !== 'options' && key !== 'related' && key !== 'loop' &&
                <div key={key} className='w-full grid grid-cols-2 items-center gap-4'>
                  <label className='text-xl ml-auto'>{key}{data['loop'] >= 0 && config['ShowLoopIndex'] && `: ${data['loop']}`}</label>
                  {
                    data['options'] !== false && data['options'] !== undefined ?
                      <select className="btn-primary p-3 w-full flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4" value={val} onChange={(e) => { handleUpdate(e, key, val) }}>
                        {
                          Object.entries(data['options']).map(([key, val]) =>
                            <option key={key} className="btn-primary p-3 flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4" value={key}>{val} {config['ShowOptionIndex'] && key}</option>
                          )
                        }
                      </select>
                      :
                      <div className='flex flex-row items-center space-x-2 w-full'>
                        <input type="text" className="btn-primary p-3 flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4 w-full" value={val} onChange={(e) => { handleUpdate(e, key, val, (data.loop || data.loop === 0) ? data.loop : false) }} />
                      </div>
                  }
                </div>
              )
            )
          }
        </div>
      }
    </div>
  );
}
