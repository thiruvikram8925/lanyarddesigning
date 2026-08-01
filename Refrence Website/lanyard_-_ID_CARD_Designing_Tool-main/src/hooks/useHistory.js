import { useState, useCallback, useRef } from 'react';

export function useHistory(initialState) {
  const [state, _setState] = useState(initialState);
  const [history, setHistory] = useState([initialState]);
  const [pointer, setPointer] = useState(0);

  const setState = useCallback((nextState, overwrite = false) => {
    const value = typeof nextState === 'function' ? nextState(state) : nextState;
    
    if (JSON.stringify(value) === JSON.stringify(state)) return;

    if (overwrite) {
      const nextHistory = [...history];
      nextHistory[pointer] = value;
      setHistory(nextHistory);
      _setState(value);
    } else {
      const nextHistory = history.slice(0, pointer + 1);
      nextHistory.push(value);
      setHistory(nextHistory);
      setPointer(nextHistory.length - 1);
      _setState(value);
    }
  }, [state, history, pointer]);

  const undo = useCallback(() => {
    if (pointer > 0) {
      const nextPointer = pointer - 1;
      setPointer(nextPointer);
      _setState(history[nextPointer]);
    }
  }, [history, pointer]);

  const redo = useCallback(() => {
    if (pointer < history.length - 1) {
      const nextPointer = pointer + 1;
      setPointer(nextPointer);
      _setState(history[nextPointer]);
    }
  }, [history, pointer]);

  return { state, setState, undo, redo, canUndo: pointer > 0, canRedo: pointer < history.length - 1 };
}
