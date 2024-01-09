/*
这段代码是一个JavaScript模块，用于与Web Worker进行通信。Web Worker可以在后台线程中执行代码，使得主线程（通常是UI线程）不会因为复杂的或者耗时的任务而被阻塞。
在这个例子中，Web Worker 负责执行一个名为 MinmaxWorker 的任务，可能是一个实现了极小化极大算法（Minimax Algorithm）的工作线程，它通常用于棋类游戏中的人工智能决策。
该模块提供了四个函数：start, move, end, 和 undo，
每个函数都通过 worker.postMessage 发送一个包含 action 和其他必要信息的对象给Worker。
Worker接收这些信息后将执行相应的AI计算任务，完成后通过 worker.onmessage 将结果信息传回给主线程。
每个函数返回一个Promise对象，这意味着它们都是异步的，可以在未来的某个时间点解决（resolve）或拒绝（reject）。
主线程在接收到信息后，通过 resolve 方法将Promise对象的状态改为已解决，并返回结果数据，从而可以在异步函数中使用 await 表达式获取这些数据。
*/

// bridge.js: 从当前目录下的'minmax.worker'文件导入MinmaxWorker类
import MinmaxWorker from './minmax.worker';

// 创建MinmaxWorker的实例
const worker = new MinmaxWorker();

// `start` 函数，异步初始化游戏，传入棋盘大小、AI是否先手和搜索深度
export const start = async (board_size, aiFirst, depth) => {
  // 返回一个新的Promise对象
  return new Promise((resolve, reject) => {
    // 向worker发送初始化游戏的消息
    worker.postMessage({
      action: 'start',
      payload: {
        board_size, // 棋盘大小
        aiFirst,    // AI是否先手
        depth       // 搜索深度
      },
    });
    // 当worker发送消息回来时触发
    worker.onmessage = (event) => {
      // 从事件中解构出action和payload
      const { action, payload } = event.data;
      // 如果action是'start'，则解决（resolve）这个promise
      if (action === 'start') {
        resolve(payload);
      }
    };
  })
};

// `move` 函数，异步执行一个移动，传入移动的位置和搜索深度
export const move = async (position, depth) => {
  // 返回一个新的Promise对象
  return new Promise((resolve, reject) => {
    // 向worker发送执行移动的消息
    worker.postMessage({
      action: 'move',
      payload: {
        position, // 移动的位置
        depth     // 搜索深度
      },
    });
    // 当worker发送消息回来时触发
    worker.onmessage = (event) => {
      // 从事件中解构出action和payload
      const { action, payload } = event.data;
      // 如果action是'move'，则解决（resolve）这个promise
      if (action === 'move') {
        resolve(payload);
      }
    };
  })
};

// `end` 函数，异步结束游戏
export const end = async () => {
  // 返回一个新的Promise对象
  return new Promise((resolve, reject) => {
    // 向worker发送结束游戏的消息
    worker.postMessage({
      action: 'end',
    });
    // 当worker发送消息回来时触发
    worker.onmessage = (event) => {
      // 从事件中解构出action和payload
      const { action, payload } = event.data;
      // 如果action是'end'，则解决（resolve）这个promise
      if (action === 'end') {
        resolve(payload);
      }
    };
  })
};

// `undo` 函数，异步执行撤销上一步操作
export const undo = async () => {
  // 返回一个新的Promise对象
  return new Promise((resolve, reject) => {
    // 向worker发送撤销上一步操作的消息
    worker.postMessage({
      action: 'undo',
    });
    // 当worker发送消息回来时触发
    worker.onmessage = (event) => {
      // 打印接收到的撤销操作相关的信息
      console.log('undo', event);
      // 从事件中解构出action和payload
      const { action, payload } = event.data;
      // 如果action是'undo'，则解决（resolve）这个promise
      if (action === 'undo') {
        resolve(payload);
      }
    };
  })
};