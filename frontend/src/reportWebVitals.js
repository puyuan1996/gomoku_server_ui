/*
这段代码是一个JavaScript模块，旨在报告web应用的性能指标。它定义了一个名为 reportWebVitals 的函数，该函数接受一个 onPerfEntry 回调函数作为参数。
如果提供了这个回调函数，并且它是一个函数类型，那么代码将动态导入 web-vitals 包，
并使用这个包提供的方法来获取不同的性能指标（Cumulative Layout Shift (CLS), First Input Delay (FID), First Contentful Paint (FCP),
Largest Contentful Paint (LCP), Time to First Byte (TTFB)），这些指标随后会通过回调函数 onPerfEntry 被报告出去。
这些性能指标有助于开发者了解他们的应用在真实世界中的性能表现。
*/

// 定义一个名为reportWebVitals的函数，该函数接受一个参数onPerfEntry
const reportWebVitals = onPerfEntry => {
  // 检查onPerfEntry是否存在，并且确认它是一个函数类型
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // 动态导入web-vitals模块
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // 调用getCLS函数，并将onPerfEntry作为参数传入，用于记录Cumulative Layout Shift指标
      getCLS(onPerfEntry);
      // 调用getFID函数，并将onPerfEntry作为参数传入，用于记录First Input Delay指标
      getFID(onPerfEntry);
      // 调用getFCP函数，并将onPerfEntry作为参数传入，用于记录First Contentful Paint指标
      getFCP(onPerfEntry);
      // 调用getLCP函数，并将onPerfEntry作为参数传入，用于记录Largest Contentful Paint指标
      getLCP(onPerfEntry);
      // 调用getTTFB函数，并将onPerfEntry作为参数传入，用于记录Time to First Byte指标
      getTTFB(onPerfEntry);
    });
  }
};

// 导出reportWebVitals函数，使其在其他模块中可用
export default reportWebVitals;
