/*
这段代码是一个典型的React应用程序的入口文件，通常命名为index.js。
它负责设置React应用程序的根组件，并将其绑定到HTML文档中的一个DOM元素上。此外，它也集成了Redux来管理应用的状态，并通过reportWebVitals函数启用了性能监测。

以下是代码的整体功能和结构概述：

导入所需的模块和组件。
创建React组件树的根。
使用<Provider>组件将Redux的store传递给应用的所有组件。
使用<React.StrictMode>组件来检测应用中的潜在问题。
渲染<App>组件作为应用的主要组件。
可选的性能监测功能，通过reportWebVitals函数。
*/

import React from 'react'; // 导入React库
import ReactDOM from 'react-dom/client'; // 导入ReactDOM库，用于处理DOM相关的渲染
import './index.css'; // 导入通用CSS样式
import App from './App'; // 导入App组件
import reportWebVitals from './reportWebVitals'; // 导入性能监测函数
import { Provider } from 'react-redux'; // 导入Redux的Provider组件
import store from './store/store'; // 导入Redux的store对象

// 使用ReactDOM.createRoot创建应用的根节点，并绑定到id为'root'的DOM元素上
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // 使用Provider组件将Redux的store传递给React应用的所有子组件
  <Provider store={store}>
    {/* 使用React.StrictMode组件来启用严格模式，该模式会额外检查应用中的潜在问题*/}
    <React.StrictMode>
      {/* 渲染App组件作为应用的主要组件*/}
      <App />
    </React.StrictMode>
  </Provider>
);

// 调用reportWebVitals函数进行性能监测，目前传入的是空函数，意味着不会执行任何操作
// 如果需要监测性能，可以将console.log或其他日志函数传递给reportWebVitals
reportWebVitals();
