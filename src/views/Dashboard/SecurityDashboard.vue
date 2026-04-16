<template>
  <div class="security-dashboard">
    <!-- 顶部标题 -->
    <header class="dashboard-header">
      <div class="header-title">网络安全态势感知监控中心</div>
      <div class="header-time">{{ currentTime }}</div>
    </header>

    <!-- 核心主体区 1:2:1 布局 -->
    <div class="dashboard-main">
      <!-- 左侧：QPS趋势 与 威胁分布 -->
      <div class="panel-left">
        <div class="card-box">
          <div class="card-title">系统实时流量与拦截趋势 (QPS)</div>
          <div class="chart-container" ref="chartARef"></div>
        </div>
        <div class="card-box">
          <div class="card-title">当前威胁风险等级分布</div>
          <div class="chart-container" ref="chartBRef"></div>
        </div>
      </div>

      <!-- 中心：态势热力地图 -->
      <div class="panel-center">
         <div class="map-title">全域攻击源追踪实时分布</div>
         <div class="chart-container map-container" ref="mapRef"></div>
      </div>

      <!-- 右侧：高频攻击URI 与 实时日志 -->
      <div class="panel-right">
        <div class="card-box">
          <div class="card-title">被攻击频次 TOP 5 高危受控端</div>
          <div class="chart-container" ref="chartCRef"></div>
        </div>
        <div class="card-box flex-log">
          <div class="card-title">安全盾实时拦截广播墙</div>
          <div class="log-container">
            <!-- 加长日志列表内容以支撑无穷滚动，通过复制自己 -->
            <div class="log-list animate-roll" >
              <div class="log-item" v-for="(log, idx) in displayLogList" :key="idx">
                <span class="log-time">[{{ log.time }}]</span>
                <span class="log-ip">{{ log.ip }}</span>
                <span class="log-rule" :class="log.level">{{ log.rule }}</span>
                <span class="log-action">拦截成功</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';

// ==== 如果你需要真实地图配置，需要在项目中引入 JSON 并解开以下注释 ====
import chinaJson from '@/assets/china.json';

// === 状态与引用 ===
const chartARef = ref(null);
const chartBRef = ref(null);
const chartCRef = ref(null);
const mapRef = ref(null);

const currentTime = ref('');
let timeTimer = null;
let dataTimer = null;

let chartA = null;
let chartB = null;
let chartC = null;
let chartMap = null;

// === Mock 日志数据 ===
const logList = ref([]);
// 计算属性：将数据复制一份以用于无缝 @keyframes 滚动
const displayLogList = computed(() => {
    return [...logList.value, ...logList.value];
});

const generateMockLogs = () => {
    const rules = [
        { name: 'XSS注入特征', level: 'high' },
        { name: 'SQL联合查询', level: 'high' },
        { name: '目录遍历探针', level: 'medium' },
        { name: 'CC频次触发', level: 'low' },
        { name: '恶意UA头识别', level: 'low' },
        { name: '越权访问尝试', level: 'high' },
        { name: '暴力破解密码', level: 'high' },
        { name: 'WebShell上传', level: 'high' }
    ];
    return Array.from({ length: 12 }).map(() => {
        const d = new Date();
        const rule = rules[Math.floor(Math.random() * rules.length)];
        return {
            time: `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`,
            ip: `${Math.floor(Math.random()*220)+1}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
            rule: rule.name,
            level: rule.level
        };
    });
};

// === 图表初始化核心方法 ===
const initChartA = () => {
    chartA = echarts.init(chartARef.value);
    const option = {
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(0,0,0,0.8)', textStyle: { color: '#fff' } },
        grid: { top: 35, bottom: 20, left: 45, right: 15 },
        xAxis: { 
            type: 'category', 
            boundaryGap: false, 
            data: ['10:00','10:05','10:10','10:15','10:20','10:25','10:30'],
            axisLine: { lineStyle: { color: '#2a4d69' } },
            axisLabel: { color: '#a0c5e8', fontSize: 11 }
        },
        yAxis: { 
            type: 'value',
            splitLine: { lineStyle: { color: 'rgba(0, 242, 254, 0.1)', type: 'dashed' } },
            axisLabel: { color: '#a0c5e8', fontSize: 11 }
        },
        series: [
            {
                name: '全站流量',
                type: 'line',
                smooth: true,
                symbol: 'none',
                itemStyle: { color: '#00f2fe' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(0, 242, 254, 0.4)' },
                        { offset: 1, color: 'rgba(0, 242, 254, 0)' }
                    ])
                },
                data: [120, 132, 101, 134, 90, 230, 210]
            },
            {
                name: '拦截恶意包',
                type: 'line',
                smooth: true,
                symbol: 'none',
                itemStyle: { color: '#ff0844' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(255, 8, 68, 0.4)' },
                        { offset: 1, color: 'rgba(255, 8, 68, 0)' }
                    ])
                },
                data: [20, 32, 11, 34, 9, 30, 50]
            }
        ]
    };
    chartA.setOption(option);
};

const initChartB = () => {
    chartB = echarts.init(chartBRef.value);
    const option = {
        tooltip: { trigger: 'item', backgroundColor: 'rgba(0,0,0,0.8)', textStyle:{color:'#fff'}, borderWidth: 0 },
        legend: { bottom: '0', textStyle: { color: '#a0c5e8', fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
        series: [
            {
                name: '威胁等级',
                type: 'pie',
                radius: ['35%', '65%'],
                center: ['50%', '42%'],
                roseType: 'radius',
                itemStyle: {
                    borderRadius: 4,
                    borderColor: '#040f23',
                    borderWidth: 2
                },
                label: { color: '#a0c5e8', show: true, formatter: '{b}\n{c} ({d}%)', fontSize: 10 },
                labelLine: { length: 10, length2: 12 },
                data: [
                    { value: 40, name: '高危漏洞攻击', itemStyle: { color: '#ff4b2b' } },
                    { value: 38, name: '中危扫描探测', itemStyle: { color: '#f7b733' } },
                    { value: 65, name: '低危常规清洗', itemStyle: { color: '#11998e' } },
                    { value: 20, name: '爬虫DDoS拦截', itemStyle: { color: '#8e2de2' } }
                ]
            }
        ]
    };
    chartB.setOption(option);
};

const initChartC = () => {
    chartC = echarts.init(chartCRef.value);
    const option = {
        grid: { top: 10, bottom: 20, left: 80, right: 30 },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(0,0,0,0.8)', textStyle:{color:'#fff'}, borderWidth: 0  },
        xAxis: { type: 'value', show: false },
        yAxis: { 
            type: 'category', 
            data: ['/api/login', '/admin/dump', '/public/ping', '/assets/..', '/etc/passwd'],
            inverse: true,
            axisLine: { show: false },
            axisTick: { show: false },
            // 利用 formatter 对超长 URI 进行切割
            axisLabel: { color: '#a0c5e8', fontSize: 12, formatter: function(val) { return val.length > 10 ? val.substring(0,10)+'...' : val; } }
        },
        series: [
            {
                name: '受击频次',
                type: 'bar',
                barWidth: 12,
                itemStyle: {
                    borderRadius: 6,
                    color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                        { offset: 0, color: '#f857a6' },
                        { offset: 1, color: '#ff5858' }
                    ])
                },
                label: { show: true, position: 'right', color: '#fff', fontSize: 10 },
                data: [520, 312, 192, 85, 42]
            }
        ]
    };
    chartC.setOption(option);
};

const initMap = () => {
    chartMap = echarts.init(mapRef.value);
    
    // 注册地图
    echarts.registerMap('china', chinaJson);

    // 初始模拟散点（中国范围：经度80-120，纬度20-45）
    const mockScatterData = [
        {name: '北京', value: [116.40, 39.90, 150]},
        {name: '上海', value: [121.47, 31.23, 120]},
        {name: '广州', value: [113.26, 23.12, 110]},
        {name: '成都', value: [104.06, 30.67, 90]},
        {name: '西安', value: [108.94, 34.27, 80]},
        {name: '武汉', value: [114.30, 30.59, 100]},
        {name: '乌鲁木齐', value: [87.61, 43.82, 60]}
    ];

    const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: '{b}<br/>攻击热度：{c}' },
        
        geo: {
          map: 'china',
          roam: true, // 允许鼠标缩放平移
          emphasis: {
            itemStyle: { areaColor: '#123773' },
            label: { show: false }
          },
          itemStyle: {
            areaColor: '#071638',
            borderColor: '#165798',
            borderWidth: 1.5,
            shadowColor: 'rgba(0, 242, 254, 0.3)',
            shadowBlur: 10
          }
        },

        series: [
            {
                name: '攻击源追踪',
                type: 'effectScatter',
                coordinateSystem: 'geo', 
                symbolSize: function (val) {
                    return val[2] / 6; // 热度值映射涟漪波及大小
                },
                itemStyle: {
                    color: '#00f2fe',
                    shadowBlur: 10,
                    shadowColor: '#00f2fe'
                },
                rippleEffect: {
                    brushType: 'stroke',
                    scale: 3.5,
                    period: 4
                },
                data: mockScatterData
            }
        ]
    };
    chartMap.setOption(option);
};

// === Mock 数据动态刷新逻辑 (答辩演示核心) ===
const updateMockData = () => {
    // 1. 刷新 QPS 折线图
    if (chartA) {
        const option = chartA.getOption();
        const data1 = option.series[0].data;
        const data2 = option.series[1].data;
        data1.shift(); 
        data1.push(Math.floor(Math.random() * 200 + 100)); // 推入新常态数据
        data2.shift(); 
        data2.push(Math.floor(Math.random() * 80 + 10)); // 推入新拦截数据
        
        // 顺势滚动 X 轴时间
        const xAxisData = option.xAxis[0].data;
        const d = new Date();
        const newTimeLabel = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
        // 为了防止X轴完全相同重叠，仅作演示用覆盖
        xAxisData.shift();
        xAxisData.push(newTimeLabel);

        chartA.setOption(option);
    }

    // 2. 刷新雷达玫瑰图数值缩放颤动
    if (chartB) {
        chartB.setOption({
            series: [{
                data: [
                    { value: Math.floor(Math.random() * 60 + 20), name: '高危漏洞攻击', itemStyle: { color: '#ff4b2b' } },
                    { value: Math.floor(Math.random() * 40 + 20), name: '中危扫描探测', itemStyle: { color: '#f7b733' } },
                    { value: Math.floor(Math.random() * 80 + 40), name: '低危常规清洗', itemStyle: { color: '#11998e' } },
                    { value: Math.floor(Math.random() * 30 + 10), name: '爬虫DDoS拦截', itemStyle: { color: '#8e2de2' } }
                ]
            }]
        });
    }

    // 3. 刷新柱状图顺序位置颤动
    if (chartC) {
        const newData = [
            Math.floor(Math.random() * 600 + 400),
            Math.floor(Math.random() * 400 + 200),
            Math.floor(Math.random() * 200 + 100),
            Math.floor(Math.random() * 100 + 50),
            Math.floor(Math.random() * 80 + 10)
        ].sort((a,b)=> b - a); // 始终降序
        chartC.setOption({ series: [{ data: newData }] });
    }

    // 4. 刷新攻击源散点生成位移闪点特效
    if(chartMap) {
         chartMap.setOption({
            series: [{
                data: Array.from({length: 8}).map((_, i) => ({
                    name: `攻击点 ${i}`,
                    // 随机散落在我国大部分版块经纬度（经度约80-120，纬度约20-45）
                    value: [(Math.random() * 40 + 80), (Math.random() * 25 + 20), Math.floor(Math.random() * 150 + 40)]
                }))
            }]
         });
    }

    // 5. 推送一条新数据进日志列首，维持心跳
    const d = new Date();
    const rules = [{ name: 'XSS注入特征', level: 'high' }, { name: 'SQL联合查询', level: 'high' }, { name: '防提权拦截', level: 'high' }, { name: '恶意UA头识别', level: 'low' }];
    const ruleItem = rules[Math.floor(Math.random() * rules.length)];
    const newLog = {
        time: `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`,
        ip: `${Math.floor(Math.random()*220)+1}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
        rule: ruleItem.name,
        level: ruleItem.level
    };
    logList.value.push(newLog);
    if(logList.value.length > 30) {
        logList.value.shift(); // 维持性能
    }
};

const handleResize = () => {
    // 提供节流或者直接 resize，echarts resize是很消耗性能的
    chartA?.resize();
    chartB?.resize();
    chartC?.resize();
    chartMap?.resize();
};

onMounted(() => {
    logList.value = generateMockLogs();

    // 1、顶部时间走秒跳动
    timeTimer = setInterval(() => {
        const d = new Date();
        currentTime.value = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    }, 1000);

    // 2、渲染图表
    nextTick(() => {
        initChartA();
        initChartB();
        initChartC();
        initMap();
        
        // 绑定 resize 用于视口切换刷新
        window.addEventListener('resize', handleResize);
        
        // 3秒频次的自动化大屏数据演示更新机制
        dataTimer = setInterval(updateMockData, 3000);
    });
});

onUnmounted(() => {
    // 销毁并卸载所有监听器和定时器防止组件内存泄漏
    clearInterval(timeTimer);
    clearInterval(dataTimer);
    window.removeEventListener('resize', handleResize);
    chartA?.dispose();
    chartB?.dispose();
    chartC?.dispose();
    chartMap?.dispose();
});
</script>

<style scoped>
/* =========== 科技感暗黑大屏极简样式 =========== */
.security-dashboard {
  width: 100%;
  height: 100vh;
  /* 科技感的电路板点阵底色或深邃星空底色 */
  background: #040f23 url('data:image/svg+xml;utf8,<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h40v40H0V0zm20 20h20v20H20V20z" fill="%230b1b3d" fill-opacity="0.3" fill-rule="evenodd"/></svg>') repeat;
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden; 
  box-sizing: border-box;
}

/* --- 头部区块 --- */
.dashboard-header {
  height: 8%;
  min-height: 60px;
  background: linear-gradient(to bottom, rgba(1, 10, 24, 0.9), rgba(4, 15, 35, 0));
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  border-bottom: 1px solid rgba(0, 242, 254, 0.2);
  position: relative;
  box-shadow: 0 2px 20px rgba(0, 242, 254, 0.05);
}
.header-title {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 3px;
  color: #00f2fe;
  text-shadow: 0 0 15px rgba(0, 242, 254, 0.6);
}
.header-time {
  font-size: 22px;
  font-family: 'Courier New', Courier, monospace;
  color: #a0c5e8;
  text-shadow: 0 0 5px rgba(160, 197, 232, 0.3);
}

/* --- 主体区三列布局 --- */
.dashboard-main {
  flex: 1;
  display: flex;
  padding: 15px 25px 25px;
  gap: 25px;
  box-sizing: border-box;
  height: 92%;
}
.panel-left, .panel-right {
  width: 25%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.panel-center {
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  /* 重点突出中央的核心边界光晕 */
  border: 1px solid rgba(0, 242, 254, 0.25);
  border-radius: 8px;
  background: rgba(1, 14, 33, 0.4);
  position: relative;
  box-shadow: inset 0 0 50px rgba(0, 242, 254, 0.08), 0 0 15px rgba(0,0,0, 0.5);
}

/* --- 卡片通用样式 --- */
.card-box {
  flex: 1;
  background: rgba(1, 14, 33, 0.5);
  border: 1px solid rgba(0, 242, 254, 0.15);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  padding: 15px;
  box-shadow: inset 0 0 20px rgba(0, 242, 254, 0.02);
  position: relative;
  overflow: hidden;
}
/* 卡片四个角的霓虹折线装饰 */
.card-box::before, .card-box::after, .panel-center::before, .panel-center::after {
  content: ''; position: absolute; width: 12px; height: 12px; pointer-events: none;
}
.card-box::before, .panel-center::before { top: -1px; left: -1px; border-top: 2px solid #00f2fe; border-left: 2px solid #00f2fe; border-top-left-radius: 6px; }
.card-box::after, .panel-center::after { bottom: -1px; right: -1px; border-bottom: 2px solid #00f2fe; border-right: 2px solid #00f2fe; border-bottom-right-radius: 6px; }

.card-title {
  font-size: 15px;
  color: #00f2fe;
  font-weight: bold;
  border-left: 4px solid #00f2fe;
  padding-left: 10px;
  margin-bottom: 15px;
  text-shadow: 0 0 10px rgba(0, 242, 254, 0.3);
}
.chart-container {
  flex: 1;
  width: 100%;
}

/* --- 地图专属 --- */
.map-title {
  position: absolute;
  top: 25px;
  left: 35px;
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  z-index: 10;
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
}
.map-container {
  height: 100%;
}

/* --- 拦截列表滚动动画引擎 --- */
.flex-log { flex: 1.2; } /* 让日志框稍微高一点点 */
.log-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  /* 消除两端生硬边界 */
  mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
}
.log-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.animate-roll {
  /* 使用20秒走完一个周期，根据元素高度可以微调 */
  animation: rollUp 20s linear infinite;
}
@keyframes rollUp {
  0% { transform: translateY(0); }
  /* 向上位移列表总高度的一半 (因为我们拷贝了2倍的数据用作无缝假象) */
  100% { transform: translateY(-50%); } 
}
.log-container:hover .animate-roll {
  animation-play-state: paused;
  cursor: pointer;
}

.log-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 242, 254, 0.04);
  padding: 10px 14px;
  border-radius: 4px;
  border-left: 3px solid #00f2fe;
  font-size: 13px;
  transition: all 0.3s;
}
.log-item:hover {
  background: rgba(0, 242, 254, 0.1);
  box-shadow: inset 0 0 10px rgba(0, 242, 254, 0.2);
}
.log-time { color: #a0c5e8; width: 65px; font-family: monospace; }
.log-ip { color: #fff; font-family: monospace; flex: 1; text-align: center; }
.log-rule { padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;}
.log-rule.high { background: rgba(255, 8, 68, 0.2); color: #ff0844; border: 1px solid rgba(255, 8, 68, 0.4);}
.log-rule.medium { background: rgba(247, 183, 51, 0.2); color: #f7b733; border: 1px solid rgba(247, 183, 51, 0.4);}
.log-rule.low { background: rgba(17, 153, 142, 0.2); color: #11998e; border: 1px solid rgba(17, 153, 142, 0.4);}
.log-action { color: #00f2fe; width: 55px; text-align: right; font-size: 12px; }
</style>
