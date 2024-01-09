// 引入 Redux Toolkit 的 createSlice 和 createAsyncThunk 工具，以及 axios 库
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
// 引入配置常量 board_size 和状态常量 STATUS
import { board_size } from '../config';
import { STATUS } from '../status';
// 引入与后端通信的函数：开始游戏、结束游戏、移动棋子、悔棋操作
import { start, end, move, undo } from '../bridge';

// 定义开始游戏的异步操作，包括棋盘大小、是否AI先行及搜索深度
export const startGame = createAsyncThunk('game/start', async ({ board_size, aiFirst, depth }) => {
  const data = await start(board_size, aiFirst, depth);
  return data;
});

// 定义移动棋子的异步操作，包括移动位置和搜索深度
export const movePiece = createAsyncThunk('game/move', async ({ position, depth = 4 }) => {
  const data = await move(position, depth);
  return data;
});

// 定义结束游戏的异步操作
export const endGame = createAsyncThunk('game/end', async (sessionId) => {
  const data = await end();
  return data;
});

// 定义悔棋的异步操作
export const undoMove = createAsyncThunk('game/undo', async (sessionId) => {
  const data = await undo();
  return data;
});

// 初始化棋盘状态，创建一个 board_size 大小的二维数组，初始值为0
const initBoard = Array.from({ length: board_size }).map(() => Array.from({ length: board_size }).fill(0));

// 定义游戏的初始状态
const initialState = {
  board: initBoard,                 // 棋盘数组
  aiFirst: true,                    // AI是否先行
  currentPlayer: null,              // 当前玩家
  winner: null,                     // 赢家
  history: [],                      // 历史记录
  status: STATUS.IDLE,              // 当前状态
  sessionId: null,                  // 会话ID
  size: 15,                         // 棋盘大小
  loading: false,                   // 加载状态
  depth: 0,                         // 搜索深度，默认为0
  index: true,                      // 是否显示序号，默认显示
  score: 0,                         // 得分
  path: [],                         // 最优路径
  currentDepth: 0,                  // 当前搜索深度
};

// 创建 Redux 的 slice，包含名称、初始状态、reducers和额外的reducer逻辑
export const gameSlice = createSlice({
  name: 'game',                      // slice的名称
  initialState,                      // 初始状态
  reducers: {                        // reducers定义了一些同步操作
    tempMove: (state, action) => {   // 临时移动棋子的操作
      const p = action.payload
      state.board[p[0]][p[1]] = state.currentPlayer;
      state.history.push({
        i: p[0],
        j: p[1],
        role: state.currentPlayer,
      });
    },
    setAiFirst: (state, action) => { // 设置AI是否先行
      state.aiFirst = action.payload;
    },
    setDepth: (state, action) => {   // 设置搜索深度
      state.depth = Number(action.payload);
    },
    setIndex: (state, action) => {   // 设置是否显示序号
      state.index = action.payload;
    },
  },
  extraReducers: (builder) => {      // 额外的reducers处理异步操作
    builder
      // 当开始游戏的异步操作处于等待状态时，设置加载状态为真
      .addCase(startGame.pending, (state) => {
        state.loading = true;
      })
      // 当开始游戏的异步操作完成时，更新游戏状态
      .addCase(startGame.fulfilled, (state, action) => {
        state.board = action.payload.board; // 更新棋盘
        state.currentPlayer = action.payload.current_player; // 更新当前玩家
        state.winner = action.payload.winner; // 更新赢家状态
        state.history = action.payload.history; // 更新历史记录
        state.status = STATUS.GAMING; // 更新游戏状态为进行中
        state.sessionId = action.payload.session_id; // 更新会话ID
        state.size = action.payload.size; // 更新棋盘大小
        state.score = action.payload.score; // 更新得分
        state.path = action.payload.bestPath; // 更新最佳路径
        state.currentDepth = action.payload.currentDepth; // 更新当前搜索深度
        state.loading = false; // 设置加载状态为假
      })
      // 当移动棋子的异步操作处于等待状态时，设置加载状态为真
      .addCase(movePiece.pending, (state, action) => {
        state.loading = true;
      })
      // 当移动棋子的异步操作完成时，更新游戏状态
      .addCase(movePiece.fulfilled, (state, action) => {
        state.board = action.payload.board; // 更新棋盘
        state.currentPlayer = action.payload.current_player; // 更新当前玩家
        state.winner = action.payload.winner; // 更新赢家状态
        state.history = action.payload.history; // 更新历史记录
        state.score = action.payload.score; // 更新得分
        state.path = action.payload.bestPath; // 更新最佳路径
        state.currentDepth = action.payload.currentDepth; // 更新当前搜索深度
        state.loading = false; // 设置加载状态为假
        if (action.payload.winner !== 0) {
          state.status = STATUS.IDLE; // 如果有赢家，则更新游戏状态为闲置
        }
      })
      // 当悔棋的异步操作处于等待状态时，设置加载状态为真
      .addCase(undoMove.pending, (state, action) => {
        state.loading = true;
      })
      // 当悔棋的异步操作完成时，更新游戏状态
      .addCase(undoMove.fulfilled, (state, action) => {
        state.board = action.payload.board; // 更新棋盘
        state.currentPlayer = action.payload.current_player; // 更新当前玩家
        state.winner = action.payload.winner; // 更新赢家状态
        state.history = action.payload.history; // 更新历史记录
        state.score = action.payload.score; // 更新得分
        state.path = action.payload.bestPath; // 更新最佳路径
        state.currentDepth = action.payload.currentDepth; // 更新当前搜索深度
        state.loading = false; // 设置加载状态为假
      })
      // 当结束游戏的异步操作完成时，重置游戏状态到初始状态
      .addCase(endGame.fulfilled, () => {
        return initialState;
      });
  },
});
// 导出reducers中定义的同步操作函数
export const { tempMove, setAiFirst, setDepth, setIndex } = gameSlice.actions;
// 默认导出gameSlice的reducer函数
export default gameSlice.reducer;
