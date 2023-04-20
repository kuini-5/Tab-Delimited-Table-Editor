import React from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { setTableName, setTableSelection, setTableData, setTableFavorite, setJsonData } from '../redux/slice'
import { LoadTable } from './TableManager'
import { config } from './ConfigManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react';
import Switch from "react-switch";

const fs = window.require('fs');
let data = JSON.parse(fs.readFileSync(`./tables.json`));

export const DisplayTableSelection = () => {
    const dispatch = useDispatch();
    const states = useSelector((state) => state.layout);
    const [tab, setTab] = useState(0);
    let data2 = JSON.parse(fs.readFileSync(`./tables.json`)); // needed for display inputs to update correctly

    return (
        <div className={`grid grid-cols-3 gap-4 w-screen ${states.TableSelection ? '' : 'hidden'}`}>
            <div className='space-y-2'>
                <div className='grid grid-cols-2 items-center'>
                    <label className='font-bold text-xl'>Tables: {Object.keys(data).length}</label>
                    <button onClick={() => [dispatch(setTableSelection(false)), dispatch(setTableData(LoadTable(GetColumnData(states), states.TableName)))]} className={`${states.TableName ? '' : 'hidden'} btn-primary px-5 py-2 font-bold bg-line hover:border-b-2 my-auto ml-5 hover:-translate-y-1`}>Select Table</button>
                </div>
                <div className='grid grid-cols-2 gap-2 pt-1'>
                    <button onClick={() => setTab(0)} className={`${tab === 0 && 'border-b-2 text-pink'} btn-primary px-5 py-2 font-bold bg-line hover:border-b-2 hover:-translate-y-1 text-center`}>All</button>
                    <button onClick={() => setTab(1)} className={`${tab === 1 && 'border-b-2 text-pink'} btn-primary px-5 py-2 font-bold bg-line hover:border-b-2 hover:-translate-y-1`}>Favorite</button>
                </div>
                <hr className='border-line' />
                <div className='flex flex-col space-y-1 overflow-scroll h-screen pb-[200px]'>
                    {
                        Object.entries(data).filter((e) => tab === 1 ? e[1].favorite : true).map((table) =>
                            Object.entries(data[table[0]]).map(([key, val], i) =>
                                key === "name" && <button key={i} onClick={() => [dispatch(setTableName(table[0])), dispatch(setTableFavorite(data[table[0]]['favorite'])), dispatch(setJsonData(data2))]} className={`${states.TableName === table[0] ? 'border-l-4 text-pink' : 'text-slate-400'} btn-primary w-full p-3 flex font-bold bg-line hover:border-l-4 hover:translate-x-2`}>{val}</button>
                            )
                        )
                    }
                </div>
            </div>
            <div className='flex flex-col space-y-5 overflow-scroll h-screen pb-[100px] col-span-2'>
                <div className='flex flex-row items-center'>
                    <label className='font-bold text-xl w-2/4'>Selected Table:</label>
                    <label className='font-bold text-xl'>{states.TableName}</label>
                    {states.TableName && <FontAwesomeIcon onClick={() => [dispatch(setTableFavorite(states.TableFavorite ? false : true)), data[states.TableName]['favorite'] = !states.TableFavorite, UpdateObject()]} className={`${states.TableFavorite ? 'text-red' : 'text-line'} hover:text-red hover:bg-line p-1 rounded transition-colors duration-150 text-2xl ml-5`} icon={faHeart} />}
                </div>
                {
                    states.TableName && (GetColumns(states, dispatch))
                }
            </div>
        </div >
    );
}

const GetColumns = (states, dispatch) => {
    return (
        Object.entries(states.JsonData[states.TableName]["columns"]).map(([columnName, columnVal], i) =>
            <div key={i} className={`flex ${(columnName === 'LOOP' || columnName === 'LOOP2' || columnName === 'LOOP3' || columnName === 'LOOP4') ? 'flex-col' : 'flex-row items-center'}`}>

                <label className='font-bold text-md w-2/4'>{columnName}</label>
                {
                    (columnName === 'LOOP' || columnName === 'LOOP2' || columnName === 'LOOP3' || columnName === 'LOOP4') ?
                        Object.entries(columnVal).map(([key, val], i) =>
                            <div key={i} className={`flex ${key === 'NUM' ? 'flex-row' : 'flex-col'}`}>
                                <label className='font-bold text-md w-2/4 ml-5'>{key}</label>
                                {
                                    key === 'NUM' ?
                                        <label className='font-bold text-md'>{val}</label>
                                        :
                                        Object.entries(val).map(([key, val], i) =>
                                            <div key={i} className={`flex ${key === 'NUM' ? 'flex-row' : 'flex-col'}`}>
                                                <div className='flex flex-row mt-1'>
                                                    <label className='font-bold text-md ml-10 w-2/4'>{key}</label>
                                                    <Switch onColor='#e087ba' onChange={() => [
                                                        data[states.TableName]["columns"][columnName]['DATA'][key]['display'] = data[states.TableName]["columns"][columnName]['DATA'][key]['display'] ? false : true,
                                                        dispatch(setJsonData({
                                                            ...states.JsonData,
                                                            [states.TableName]: {
                                                                ...states.JsonData[states.TableName],
                                                                columns: {
                                                                    ...states.JsonData[states.TableName]["columns"],
                                                                    [columnName]: {
                                                                        ...states.JsonData[states.TableName]["columns"][columnName],
                                                                        DATA: {
                                                                            ...states.JsonData[states.TableName]["columns"][columnName]['DATA'],
                                                                            [key]: {
                                                                                ...states.JsonData[states.TableName]["columns"][columnName]['DATA'][key],
                                                                                display: data[states.TableName]["columns"][columnName]['DATA'][key]['display']
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        })),
                                                        UpdateObject()
                                                    ]} checked={val['display']} />
                                                </div>
                                            </div>
                                        )
                                }
                            </div>
                        )
                        :
                        <Switch onColor='#e087ba' onChange={() => [
                            data[states.TableName]["columns"][columnName]['display'] = data[states.TableName]["columns"][columnName]['display'] ? false : true,
                            dispatch(setJsonData({
                                ...states.JsonData,
                                [states.TableName]: {
                                    ...states.JsonData[states.TableName],
                                    columns: {
                                        ...states.JsonData[states.TableName]["columns"],
                                        [columnName]: {
                                            ...states.JsonData[states.TableName]["columns"][columnName],
                                            display: data[states.TableName]["columns"][columnName]['display']
                                        }
                                    }
                                }
                            })),
                            UpdateObject()]} checked={states.JsonData[states.TableName]["columns"][columnName]['display']} />
                }
            </div>
        )
    )
}

const GetColumnData = (states) => {
    let arr = []
    Object.entries(data[states.TableName]["columns"]).forEach(([key, val], index) => {
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

const UpdateObject = () => {
    fs.writeFileSync(`./tables${config['ServerType']}.json`, JSON.stringify(data, null, 2), function writeJSON(err) {
        if (err) return console.log("ERROR" + err);
    });
}