/*
此代码是一个React组件，用于实现一个五子棋游戏的棋盘。该棋盘能够响应用户点击，将点击位置转换为棋子坐标，并根据游戏状态更新棋盘上的棋子。
它使用了React的hooks，Redux来管理状态，以及axios来与服务器通信。该组件还负责展现棋子的历史记录以及高亮最后一个落子位置。棋盘和棋子的样式通过CSS实现。
*/

// 引入React的核心功能
import React, { useState, useEffect } from "react";
// 引入Redux的hook，用于派发action和选择器
import { useDispatch, useSelector } from 'react-redux';
// 引入Redux store中的动作
import { movePiece, tempMove } from '../store/gameSlice';
// 引入CSS样式文件
import './board.css';
// 引入背景图片
import bg from '../assets/bg.jpg';
// 引入棋盘大小的配置
import { board_size } from '../config';
// 引入游戏状态的常量
import { STATUS } from '../status';
// 引入axios库用于发起HTTP请求
import axios from 'axios';

// 定义Board组件
const Board = () => {
  // 使用Redux的hook来获取dispatch方法
  const dispatch = useDispatch();
  // 使用Redux的hook来从store中选取需要的游戏数据
  const { board, currentPlayer, history, status, size, loading, winner, depth, index } = useSelector((state) => state.game);

  // 定义点击棋盘的事件处理函数
  const handleClick = async (i, j) => {
    // 如果游戏正在加载或者不在游戏中，则不处理点击
    if (loading || status !== STATUS.GAMING) {
      console.log(loading, status);
      console.log(' loading || status !== STATUS.GAMING ');
      return;
    }
    // 如果点击的位置没有棋子
    if (board[i][j] === 0) {
      // 如果深度为0，需要与服务器通信
      if (depth === 0) {
        try {
          // 先在本地进行临时移动
          dispatch(tempMove([i, j]))
          // 向服务器发送步骤信息，并等待响应
          const response = await axios.post('http://127.0.0.1:5001/gomoku_ui/', {
            command: 'step',
            argument: [i, j], // 这里需要根据服务器要求调整数据格式
            action: [i, j], // 这里需要根据服务器要求调整数据格式
            uid: ':1' // 如果需要的话，这里应填入玩家的唯一标识符
          });
          // 服务器响应的数据，这里假设服务器返回的bot动作格式为 {'i': x, 'j': y }
          const agentAction = response.data.result.action;
          // 使用服务器返回的动作更新Redux store
          dispatch(movePiece({ position: [i, j, agentAction.i, agentAction.j], depth: 0 }));
        } catch (error) {
          // 如果通信失败，则打印错误信息
          console.error('Error communicating with the server: ', error.response || error);
        }
      } else {
        // 如果不需要与服务器通信，直接在本地执行移动
        dispatch(tempMove([i, j]))
        dispatch(movePiece({ position: [i, j], depth }));
        console.log(' depth != 0 ');
      }
    }
  };

  // 使用effect hook来处理胜利者的出现
  useEffect(() => {
    // 如果有胜利者出现，弹出提示框
    if (winner === 1 || winner === -1) {
      window.alert(winner === 1 ? '黑棋获胜' : '白棋获胜')
    }
  }, [winner]);

  // 计算单个棋盘格子的样式
  const cellStyle = {
    width: `${375 / board_size}px`,
    height: `${375 / board_size}px`,
  };

  // 渲染棋盘组件
  return (
    <div className="board" style={{ backgroundImage: `url(${bg})` }}>
      {/* 遍历棋盘数组，渲染每一行 */}
      {board.map((row, i) => (
        <div key={i} className="board-row">
          {/* 遍历棋盘的每一列，渲染每一个格子 */}
          {row.map((cell, j) => {
            // 根据格子位置给格子添加不同的边界样式
            let cellClassName = 'cell';
            if (i === 0) {
              cellClassName += ' top';
            }
            if (i === board_size - 1) {
              cellClassName += ' bottom';
            }
            if (j === 0) {
              cellClassName += ' left';
            }
            if (j === board_size - 1) {
              cellClassName += ' right';
            }
            // 根据格子内棋子的状态给棋子添加不同的样式
            let pieceClassname = 'piece';
            if (cell === 1) {
              pieceClassname += ' black';
            } else if (cell === -1) {
              pieceClassname += ' white';
            }
            // 判断当前格子是否为最后落子的格子
            let isLastCell = false;
            const lastMove = history[history.length - 1];
            if (lastMove && (lastMove.i === i && lastMove.j === j)) {
              isLastCell = true;
            }
            // 如果显示历史记录索引，则计算当前棋子的序号
            let number = 0;
            if (index) {
              for(let x = 0; x < history.length; x++) {
                if (history[x].i === i && history[x].j === j) {
                  number = x + 1;
                  break;
                }
              }
            }
            // 渲染每一个格子，包括棋子和最后落子的标记
            return (
              <div key={j} className={cellClassName} style={cellStyle} onClick={() => handleClick(i, j)}>
                {cell == 0 ? '' : <div className={pieceClassname}>{ number === 0 ? '' : number}</div>}
                {isLastCell && <div className="last" />}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  );
};

// 导出Board组件以便在其他文件中使用
export default Board;
