<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="dashboard-card" shadow="hover">
          <div class="card-header">
            <span>今日告警总数</span>
          </div>
          <div class="card-content warning-text">1,234</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="dashboard-card" shadow="hover">
          <div class="card-header">
            <span>已封禁IP数</span>
          </div>
          <div class="card-content danger-text">89</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="dashboard-card" shadow="hover">
          <div class="card-header">
            <span>放行域名数</span>
          </div>
          <div class="card-content success-text">43</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="dashboard-card" shadow="hover">
          <div class="card-header">
            <span>系统运行天数</span>
          </div>
          <div class="card-content primary-text">128</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card shadow="hover" class="chart-card">
          <div class="chart-header">
            <span>近七日告警态势</span>
          </div>
          <div ref="lineChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="chart-card">
          <div class="chart-header">
            <span>风险类型分布</span>
          </div>
          <div ref="pieChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'

const lineChartRef = ref(null)
const pieChartRef = ref(null)

let lineChart = null
let pieChart = null

const initLineChart = () => {
  if (lineChartRef.value) {
    lineChart = echarts.init(lineChartRef.value)
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '告警数量',
          type: 'line',
          smooth: true,
          areaStyle: {
            opacity: 0.1
          },
          data: [120, 232, 101, 264, 90, 340, 250],
          itemStyle: {
            color: '#409EFF'
          }
        }
      ]
    }
    lineChart.setOption(option)
  }
}

const initPieChart = () => {
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
    const option = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        bottom: '0%',
        left: 'center'
      },
      series: [
        {
          name: '风险类型分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '20',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: 1048, name: 'DDoS攻击' },
            { value: 735, name: 'SQL注入' },
            { value: 580, name: 'XSS攻击' },
            { value: 484, name: '暴力破解' },
            { value: 300, name: '其他异常' }
          ]
        }
      ]
    }
    pieChart.setOption(option)
  }
}

const handleResize = () => {
  if (lineChart) lineChart.resize()
  if (pieChart) pieChart.resize()
}

onMounted(() => {
  nextTick(() => {
    initLineChart()
    initPieChart()
    window.addEventListener('resize', handleResize)
  })
})

onBeforeUnmount(() => {
  if (lineChart) lineChart.dispose()
  if (pieChart) pieChart.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-card {
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-header {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.card-content {
  font-size: 28px;
  font-weight: bold;
}

.warning-text {
  color: #E6A23C;
}

.danger-text {
  color: #F56C6C;
}

.success-text {
  color: #67C23A;
}

.primary-text {
  color: #409EFF;
}

.chart-row {
  margin-top: 20px;
}

.chart-card {
  height: 400px;
}

.chart-header {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #303133;
}

.chart-box {
  width: 100%;
  height: 320px;
}
</style>
