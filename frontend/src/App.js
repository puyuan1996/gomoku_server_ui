// npm run start-fix
import React from 'react';

import Board from './components/board';
import './App.css';
import Control from './components/control';

function App() {
  return (
    <div className="App">
      <Board />
      <Control />
    </div>
  );
}

export default App;

/*
这段代码是一个React前端应用程序的一部分，它使用Redux进行状态管理，并且包含了两个组件：Board 和 Control。Board 组件负责显示和交互五子棋棋盘，而 Control 组件则提供了游戏控制按钮和设置。
*/