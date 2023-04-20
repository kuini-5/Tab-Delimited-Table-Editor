import React from 'react';
import { DisplayTableSelection } from './manager/ObjectManager'
import { DisplayTblidx, DisplayInputs, Settings, SaveTable } from './manager/TableManager'
import { useDispatch, useSelector } from 'react-redux'
import { setTableName, setTableSelection, setCurrentItem } from './redux/slice'

function App() {
  const dispatch = useDispatch();
  const states = useSelector((state) => state.layout);
  const ipcRenderer = window.require('electron').ipcRenderer;

  return (
    <div className="App bg-background overflow-hidden min-h-screen w-full text-pink font-bold overscroll-none p-0 m-0 border-solid border-background border-x-2">
      <div className="header fixed w-full flex h-[35px] bg-background" style={{ WebkitAppRegion: 'drag' }}>
        <h1 className='place-self-center ml-5 text-xs'>Table Editor</h1>
        <button onClick={() => {
          const remote = window.require('electron').remote
          remote.getCurrentWindow().close()
        }} className="btn-primary px-7 h-full font-bold bg-foreground hover:border-r-2 hover:-translate-x-1 ml-auto" style={{ WebkitAppRegion: 'no-drag' }}>
          <i className="fas fa-times m-auto"></i>
        </button>
      </div>

      <div className="tabs fixed flex w-full bg-line h-[50px] select-none mt-[35px]">
        {
          states.TableSelection !== true &&
          <div className='w-full grid grid-cols-6 gap-2'>
            <button onClick={() => [dispatch(setTableSelection(true)), dispatch(setTableName('')), dispatch(setCurrentItem(null)), ipcRenderer.send('selectTable')]} className={`btn-primary px-5 h-full font-bold bg-foreground hover:border-b-2 hover:-translate-y-1`}>Select Table</button>

            <button onClick={() => SaveTable(states)} className={`btn-primary col-end-7 px-5 h-full font-bold bg-foreground hover:border-b-2 hover:-translate-y-1`}>Save Table</button>
          </div>

        }
      </div>
      <div className="body bg-foreground px-4 py-4 h-screen pt-[90px] w-full grid grid-cols-5 gap-4">
          <DisplayTableSelection />
          {states.TableSelection !== true && <Settings />}
          {states.TableSelection !== true && <DisplayTblidx states={states} dispatch={dispatch} />}
          {states.TableSelection !== true && states.CurrentItem !== null && <DisplayInputs states={states} dispatch={dispatch} />}
      </div>
    </div>
  );
}

export default App;
