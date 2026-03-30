const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3000;

// 1. 静态文件托管
app.use(express.static(path.join(__dirname, 'dist')));

// 2. 代理转发配置：
// 将所有以 /nsoar-admin 开头的请求转发到后端的 30000 端口，并去掉 /nsoar-admin 前缀
app.use('/nsoar-admin', createProxyMiddleware({
  target: 'http://localhost:30000',
  changeOrigin: true,
  pathRewrite: {
    '^/nsoar-admin': '', // 去掉前缀，让后端收到的是 /getCaptcha
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[代理] 转发请求: ${req.url} -> http://localhost:30000${proxyReq.path}`);
  },
  onError: (err, req, res) => {
    console.error('[代理] 错误:', err.message);
    res.status(500).send('代理连接后端失败，请检查后端服务是否已在 30000 端口启动。');
  }
}));

// 3. 处理 SPA 路由刷新 (当之前的路径匹配失败时，一律返回 index.html)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});



app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`> 代理前端服务器已运行在: http://localhost:${PORT}`);
  console.log(`> 转发规则: /nsoar-admin/*  =>  http://localhost:30000/*`);
  console.log(`========================================\n`);
});
