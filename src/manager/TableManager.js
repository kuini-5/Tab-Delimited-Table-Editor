import { setCurrentItem, setFilterShow, setBulkEdit, setBulkDuplicate, setFilterData, setSearch, setTableData, setSearchTblidx, setDuplicateTblidx } from '../redux/slice';
import { useDispatch, useSelector } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp, faEraser, faRetweet, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { List, AutoSizer } from "react-virtualized";
import { DangerAlert, SuccessToast, WarningToast } from '../shared/Alerts';
import React from 'react';
import { config } from './ConfigManager';

const ipcRenderer = window.require('electron').ipcRenderer;

export const LoadTable = (ObjectData, TableName) => {
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
    })

    return tableObj;
}

export const SaveTable = (states) => {
    const fs = window.require('fs')

    const output = states.TableData.map((row) =>
        row.map((columns) =>
            Object.entries(columns).filter(([key, val]) => key !== 'display' && key !== 'options' && key !== 'related' && key !== 'loop').map(([key, val]) =>
                val
            )
        ).join("\t")
    ).join("\n")

    fs.writeFileSync(`./script/${states.TableName}.txt`, output)
    SuccessToast.fire(`Saved ${states.TableName}.txt`)
}

export const DisplayTblidx = ({ states, dispatch }) => {
    const table = states.TableData.filter(x => {
        const obj = {}
        const filters = states.Settings.Filter.Filters
        const itemKeys = Object.keys(states.Settings.Filter.Filters)
        if (itemKeys.length < 1) { return true }

        for (const i of itemKeys) {
            if (i === 'TBLIDX')
                obj[i] = x.find(y => y[i]?.includes(filters[i]))
            else
                obj[i] = x.find(y => y[i] === filters[i])
        }

        const passed = Object.keys(obj).every(y => obj[y] !== undefined)

        return passed
    }).map((row, i) => row)
    return (
        <div className="h-full space-y-1 w-full border-r-4 border-background/30" style={{ width: "100%", height: "100%" }}>
            <AutoSizer>
                {({ width, height }) => {
                    return (
                        <List
                            width={width}
                            height={height}
                            rowHeight={50}
                            rowCount={table.length}
                            scrollToIndex={states.Settings.SearchIndex}
                            rowRenderer={({ key, index, style }) => {

                                const tables = table[index]
                                return (
                                    tables && tables[0].TBLIDX !== undefined &&
                                    <div key={index} id={tables[0].TBLIDX} className='flex flex-row space-x-3 items-center outline-none' style={style}>
                                        {
                                            tables.map((key, i) =>
                                                key.ICON !== undefined && <img key={i} className='w-[40px] h-[40px]' src={"./icon/" + (key.ICON !== "" ? key.ICON.toLowerCase() : "no_use.png")} alt="" />
                                            )
                                        }
                                        <button onClick={() => { dispatch(setCurrentItem(tables)) }} className={`${states.CurrentItem && states.CurrentItem[0]['TBLIDX'] === tables[0].TBLIDX ? 'border-l-4 text-pink' : 'text-slate-400'} h-[45px] btn-primary w-full px-3 items-center flex font-bold bg-line hover:border-l-4 hover:translate-x-2`}>{tables[0].TBLIDX}</button>
                                    </div>
                                );
                            }}
                        />
                    );
                }}
            </AutoSizer>
        </div>
    );
}

export const DisplayInputs = ({ states, dispatch }) => {
    const handleUpdate = (e, key, val, l = false) => {
        const tblData = [...states.TableData]
        let curItem = [...tblData.find(x => x[0] === states.CurrentItem[0])]
        const cIndex = tblData.indexOf(tblData.find(x => x[0] === curItem[0]))
        if (!curItem.length) {
            return console.error("CurrItem invalid")
        }
        let i = null
        if (l && l >= 0) {
            i = { ...curItem.find((x, k) => x[key] === val && (x.loop && x.loop === l)) }
        } else {
            i = { ...curItem.find((x, k) => x[key] === val) }
        }
        if (!i) {
            return console.error("No index")
        }
        let index = null

        if (l && l >= 0) {
            index = curItem.indexOf(curItem.find(x => x[key] === i[key] && (x.loop && x.loop === l)))
        } else {
            index = curItem.indexOf(curItem.find(x => x[key] === i[key]))
        }

        i[key] = e.target.value

        curItem[index] = { ...i }
        tblData[cIndex] = [...curItem]
        dispatch(setCurrentItem([...curItem]))
        dispatch(setTableData([...tblData]))
    }
    return (
        <div className="overflow-scroll h-full space-y-1 w-full col-span-3">
            {
                states.CurrentItem && Object.values(states.CurrentItem).map((data, index) =>
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
                                        {data['related'] !== false && val !== "4294967295" && <FontAwesomeIcon onClick={() => ipcRenderer.send('view', { TableName: [states.TableName, data['related']], Tblidx: val})} className='hover:bg-line p-2 rounded-lg cursor-pointer' icon={faUpRightFromSquare} />}
                                    </div>
                            }
                        </div>
                    )
                )
            }
        </div>
    );
}

export const Settings = () => {
    const states = useSelector((state) => state.layout);
    const dispatch = useDispatch();

    const SearchRow = () => {
        if (states.TableData.find(x => x[0].TBLIDX === states.Settings.SearchTblidx)) {
            const [index, table] = SearchTblidx(states, states.Settings.SearchTblidx);
            dispatch(setSearch(index));
            dispatch(setCurrentItem(table));
        }
        else WarningToast.fire("TBLIDX doesn't exist!");
    }

    const DuplicateRow = () => {
        if (SearchTblidx(states, states.Settings.SearchTblidx) !== undefined) {
            if (SearchTblidx(states, states.Settings.DuplicateTblidx) === undefined) {
                const [index, table] = SearchTblidx(states, states.Settings.SearchTblidx);
                let tblData = [...states.TableData];
                let curItem = [...table];
                if (!curItem.length) {
                    return console.error("CurrItem invalid");
                }
                const i = { ...curItem.find(x => x['TBLIDX'] === index) };
                if (!i) {
                    return console.error("No index");
                }
                i['TBLIDX'] = states.Settings.DuplicateTblidx;

                curItem[0] = { ...curItem[0], ...i };
                tblData = [...tblData, [...curItem]];
                dispatch(setTableData([...tblData]));
                SuccessToast.fire(`Duplicated TBLIDX [${states.Settings.DuplicateTblidx}]`)
            }
            else WarningToast.fire("Duplicate TBLIDX exists already!");
        }
        else WarningToast.fire("TBLIDX doesn't exist!");
    };

    const DeleteRow = () => {
        if (config['ShowConfirmation']) {
            DangerAlert.fire({ title: `Delete TBLIDX [${states.CurrentItem[0].TBLIDX}]?` })
                .then((result) => {
                    if (result.isConfirmed) {
                        let tblData = [...states.TableData];
                        const curItemTblidx = states.CurrentItem[0].TBLIDX;
                        const [index, table] = SearchTblidx(states, curItemTblidx);
                        tblData.splice(index, 1);
                        dispatch(setTableData([...tblData]));
                        dispatch(setCurrentItem(null));
                        SuccessToast.fire(`Deleted TBLIDX [${curItemTblidx}]`)
                    }
                })
        }
        else {
            let tblData = [...states.TableData];
            const curItemTblidx = states.CurrentItem[0].TBLIDX;
            const [index] = SearchTblidx(states, curItemTblidx);
            tblData.splice(index, 1);
            dispatch(setTableData([...tblData]));
            dispatch(setCurrentItem(null));
            SuccessToast.fire(`Deleted TBLIDX [${curItemTblidx}]`)
        }
    }

    const SwapInputs = () => {
        if (states.Settings.SearchTblidx && states.Settings.DuplicateTblidx) {
            const search = states.Settings.SearchTblidx;
            const duplicate = states.Settings.DuplicateTblidx;
            dispatch(setSearchTblidx(duplicate))
            dispatch(setDuplicateTblidx(search))
        }
        else WarningToast.fire("Input is empty!");
    }

    const BulkEdit = () => {
        const BulkEdit = states.Settings.BulkEdit;
        let tblData = [...states.TableData];
        let edited = 0;

        if (BulkEdit.FromTblidx && BulkEdit.ToTblidx && BulkEdit.Table && BulkEdit.Value) {
            if (BulkEdit.FromTblidx < BulkEdit.ToTblidx) {
                const tables = [...tblData.filter(x => parseInt(x[0].TBLIDX) >= parseInt(BulkEdit.FromTblidx) && parseInt(x[0].TBLIDX) <= parseInt(BulkEdit.ToTblidx))]
                for (const table of tables) {
                    edited += 1;
                    let t = [...table]
                    const editableTable = t.find(x => Object.keys(x).find(y => y === BulkEdit.Table))
                    const eTableIndex = t.indexOf(editableTable)
                    console.log(editableTable, eTableIndex)
                    t[eTableIndex] = { ...editableTable, [BulkEdit.Table]: BulkEdit.Value }
                    const tIndex = tblData.indexOf(table)
                    tblData[tIndex] = [...t]
                }
                dispatch(setTableData([...tblData]));
                SuccessToast.fire(`Successfully edited [${edited}] rows`)
            }
            else WarningToast.fire("From Tblidx should be less than To Tblidx!");
        }
        else WarningToast.fire("Input is empty!");
    }

    const BulkDuplicate = () => {
        const BulkDuplicate = states.Settings.BulkDuplicate;
        let tblData = [...states.TableData];
        let duplicated = 0;

        if (BulkDuplicate.BaseTblidx && BulkDuplicate.FromTblidx && BulkDuplicate.ToTblidx) {
            if (tblData.find(x => x[0].TBLIDX === BulkDuplicate.BaseTblidx)) {
                if (BulkDuplicate.FromTblidx < BulkDuplicate.ToTblidx) {
                    const tables = [...tblData.filter(x => parseInt(x[0].TBLIDX) >= parseInt(BulkDuplicate.FromTblidx) && parseInt(x[0].TBLIDX) <= parseInt(BulkDuplicate.ToTblidx))]
                    if (tables.length === 0) {
                        const [index, table] = SearchTblidx(states, BulkDuplicate.BaseTblidx);
                        let curItem = [...table];
                        if (!curItem.length) {
                            return console.error("CurrItem invalid");
                        }
                        const i = { ...curItem.find(x => x['TBLIDX'] === index) };
                        if (!i) {
                            return console.error("No index");
                        }
                        for (let e = parseInt(BulkDuplicate.FromTblidx); e <= parseInt(BulkDuplicate.ToTblidx); e++) {
                            duplicated += 1;
                            i['TBLIDX'] = e;
                            curItem[0] = { ...curItem[0], ...i };
                            tblData = [...tblData, [...curItem]];
                        }

                        dispatch(setTableData([...tblData]));
                        SuccessToast.fire(`Successfully duplicated [${duplicated}] rows`)
                    }
                    else WarningToast.fire(`[${tables.length}] rows can't be duplicated!`);
                }
                else WarningToast.fire("From Tblidx should be less than To Tblidx!");
            }
            else WarningToast.fire("Base Tblidx does not exist!");
        }
        else WarningToast.fire("Input is empty!");
    }
    const uniqueFilters = [];
    return (
        <div className="overflow-scroll h-full w-full border-r-4 border-background/30 select-none">
            <div className="flex flex-col h-full w-full">
                <input id='SearchInput' type="text" className="btn-primary p-3 w-full flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4" placeholder="TBLIDX" value={states.Settings.SearchTblidx} onChange={(e) => { dispatch(setSearchTblidx(e.target.value)) }} />
                <div onClick={SwapInputs} className='flex flex-row justify-between items-center py-3 cursor-pointer'>
                    <label>Swap</label>
                    <FontAwesomeIcon className='hover:bg-line p-1 rounded-lg' icon={faRetweet} />
                </div>
                <input id='DuplicateInput' type="text" className="btn-primary p-3 w-full flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4 mt-1" placeholder="Duplicate TBLIDX" value={states.Settings.DuplicateTblidx} onChange={(e) => { dispatch(setDuplicateTblidx(e.target.value)) }} />
                <button className={`btn-primary p-3 w-full flex font-bold bg-line hover:border-r-4 hover:-translate-x-1 mt-5 justify-center`} onClick={SearchRow}>Search</button>
                <button className={`btn-primary p-3 w-full flex font-bold bg-line hover:border-r-4 hover:-translate-x-1 mt-1 justify-center`} onClick={DuplicateRow}>Duplicate</button>

                <hr className='border-t-4 border-background/30 my-10' />

                <div onClick={() => dispatch(setFilterShow(states.Settings.Filter.Show ? false : true))} className="flex flex-row justify-between cursor-pointer">
                    <label>Filter</label>
                    <FontAwesomeIcon className='hover:bg-line p-1 rounded-lg' icon={states.Settings.Filter.Show ? faChevronUp : faChevronDown} />
                </div>
                <div className={`${states.Settings.Filter.Show === false && 'hidden'} select-none`}>
                    {
                        states.Settings.Filter.Filters.length !== 0 &&
                        <button onClick={() => dispatch(setFilterData([]))} className='btn-primary p-3 w-full flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4 mb-5 items-center justify-between'>Clear Filter <FontAwesomeIcon icon={faEraser} /></button>}
                    {
                        states.TableData[0] && Object.values(states.TableData[0]).filter((e) => {
                            if (e.loop >= 0) {
                                if (!uniqueFilters.includes(Object.keys(e)[0])) {
                                    uniqueFilters.push(Object.keys(e)[0]);
                                    return true;
                                }
                                else return false;
                            }
                            else return true;
                        }).map(data =>
                            Object.entries(data).map(([key, val]) =>
                                data.display === true && key !== 'display' && key !== 'options' && key !== 'related' && key !== 'loop' &&
                                <div key={key} className='mb-1'>
                                    {
                                        data.options !== false && data.options !== undefined ?
                                            <select className="btn-primary p-3 w-full flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4" onChange={(e) => {
                                                if (e.currentTarget.value.length > 0 || e.currentTarget.value === key) {
                                                    dispatch(setFilterData({ ...states.Settings.Filter.Filters, [key]: e.currentTarget.value }))
                                                }
                                                else {
                                                    dispatch(setFilterData(x => {
                                                        const k = { ...x }
                                                        delete k[key]
                                                        return k
                                                    }))
                                                }
                                            }}
                                            >
                                                <option className="btn-primary p-3 flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4" value={key}>{key}</option>
                                                {
                                                    Object.entries(data.options).map(([key, val]) =>
                                                        <option key={key} className="btn-primary p-3 flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4" value={key}>{val}</option>
                                                    )
                                                }
                                            </select>
                                            :
                                            <input type="text" className="btn-primary p-3 w-full flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4" placeholder={key} onChange={(e) => {
                                                if (e.currentTarget.value.length > 0) {
                                                    dispatch(setFilterData({ ...states.Settings.Filter.Filters, [key]: e.currentTarget.value }))
                                                }
                                                else {
                                                    dispatch(setFilterData(x => {
                                                        const k = { ...x }
                                                        delete k[key]
                                                        return k
                                                    }))
                                                }
                                            }} />
                                    }
                                </div>
                            )
                        )
                    }
                </div>

                <hr className='border-t-4 border-background/30 my-10' />

                <div onClick={() => dispatch(setBulkEdit({ Show: states.Settings.BulkEdit.Show ? false : true }))} className="flex flex-row justify-between cursor-pointer">
                    <label>Bulk Edit</label>
                    <FontAwesomeIcon className='hover:bg-line p-1 rounded-lg' icon={states.Settings.BulkEdit.Show ? faChevronUp : faChevronDown} />
                </div>
                <div className={`${states.Settings.BulkEdit.Show === false && 'hidden'} select-none`}>
                    <input type="text" className="btn-primary p-3 w-full flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4" placeholder="FROM TBLIDX" value={states.Settings.BulkEdit.FromTblidx} onChange={(e) => dispatch(setBulkEdit({ FromTblidx: e.target.value }))} />
                    <input type="text" className="btn-primary p-3 w-full flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4 mt-1" placeholder="TO TBLIDX" value={states.Settings.BulkEdit.ToTblidx} onChange={(e) => dispatch(setBulkEdit({ ToTblidx: e.target.value }))} />
                    <select className="btn-primary w-full p-3 flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4 mt-1" value={states.Settings.BulkEdit.Table} onChange={(e) => dispatch(setBulkEdit({ Table: e.target.value }))}>
                        <option className="btn-primary p-3 flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4" value={'TABLE'}>TABLE</option>
                        {
                            states.TableData[0] && Object.values(states.TableData[0]).map(data =>
                                Object.entries(data).map(([key, val]) =>
                                    data['display'] === true && key !== 'display' && key !== 'options' && key !== 'loop' && data['loop'] === undefined &&
                                    <option key={key} className="btn-primary p-3 flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4" value={key}>{key}</option>
                                ))
                        }
                    </select>
                    <input type="text" className="btn-primary p-3 w-full flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4 mt-1" placeholder="VALUE" value={states.Settings.BulkEdit.Value} onChange={(e) => dispatch(setBulkEdit({ Value: e.target.value }))} />
                    <button className={`btn-primary p-3 w-full flex font-bold bg-line hover:border-r-4 hover:-translate-x-1 mt-5 justify-center`} onClick={BulkEdit}>Confirm</button>
                </div>

                <hr className='border-t-4 border-background/30 my-10' />

                <div onClick={() => dispatch(setBulkDuplicate({ Show: states.Settings.BulkDuplicate.Show ? false : true }))} className="flex flex-row justify-between cursor-pointer">
                    <label>Bulk Duplicate</label>
                    <FontAwesomeIcon className='hover:bg-line p-1 rounded-lg' icon={states.Settings.BulkDuplicate.Show ? faChevronUp : faChevronDown} />
                </div>
                <div className={`${states.Settings.BulkDuplicate.Show === false && 'hidden'} select-none`}>
                    <input type="text" className="btn-primary p-3 w-full flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4 mt-1" placeholder="BASE TBLIDX" value={states.Settings.BulkDuplicate.BaseTblidx} onChange={(e) => dispatch(setBulkDuplicate({ BaseTblidx: e.target.value }))} />
                    <input type="text" className="btn-primary p-3 w-full flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4 mt-1" placeholder="FROM TBLIDX" value={states.Settings.BulkDuplicate.FromTblidx} onChange={(e) => dispatch(setBulkDuplicate({ FromTblidx: e.target.value }))} />
                    <input type="text" className="btn-primary p-3 w-full flex font-bold bg-line focus:text-pink focus:border-r-4 hover:border-r-4 mt-1" placeholder="TO TBLIDX" value={states.Settings.BulkDuplicate.ToTblidx} onChange={(e) => dispatch(setBulkDuplicate({ ToTblidx: e.target.value }))} />
                    <button className={`btn-primary p-3 w-full flex font-bold bg-line hover:border-r-4 hover:-translate-x-1 mt-5 justify-center`} onClick={BulkDuplicate}>Confirm</button>
                </div>

                <hr className='border-t-4 border-background/30 my-10' />

                {states.CurrentItem && <button onClick={DeleteRow} className={`btn-primary p-3 w-full mt-auto font-bold bg-line hover:border-r-4 hover:-translate-x-1 justify-center text-red`}>Delete {states.CurrentItem[0]['TBLIDX']}</button>}
            </div>

        </div>
    );
}

const SearchTblidx = (states, tblidx) => {
    for (let i = 0; i < states.TableData.length; i++) {
        const table = states.TableData[i];
        if (table[0].TBLIDX === tblidx) {
            return [i, table];
        }
    }
};