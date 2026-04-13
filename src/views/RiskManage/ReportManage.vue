<template>
  <div class="report-manage-container">
    <div class="action-bar">
      <h2>安全风险评估报告</h2>
      <el-button type="primary" :icon="Download" @click="exportToPdf">导出为 PDF</el-button>
    </div>

    <!-- 预览区域 -->
    <el-card class="report-preview" shadow="hover">
      <div id="report-content" class="report-content">
        <h1 class="report-title">NSOAR 网络安全态势评估报告</h1>
        <p class="report-meta">生成时间: {{ currentTime }}</p>
        <el-divider></el-divider>
        
        <div class="report-section">
          <h3>一、系统整体安全评分</h3>
          <div class="score-display">
            <el-progress type="dashboard" :percentage="85" :color="scoreColor" />
            <div class="score-desc">当前系统处于「<strong>安全可控</strong>」状态，整体防护策略生效良好。</div>
          </div>
        </div>

        <div class="report-section">
          <h3>二、近期告警与处置摘要</h3>
          <el-table :data="summaryData" border style="width: 100%; margin-top: 15px;">
            <el-table-column prop="type" label="风险类型" width="180"></el-table-column>
            <el-table-column prop="count" label="触发次数"></el-table-column>
            <el-table-column prop="handled" label="已处置数"></el-table-column>
            <el-table-column prop="ratio" label="防护成功率"></el-table-column>
          </el-table>
        </div>

        <div class="report-section">
          <h3>三、发现的主要风险点</h3>
          <ul class="risk-list">
            <li>部分内网主机（192.168.1.x 段）存在异常的流量外发行为，建议深入查杀病毒。</li>
            <li>昨日遭受短时间高频 DDoS 导致网关负载突增，已自动拉平，建议升级防护带宽。</li>
          </ul>
        </div>

        <div class="report-section">
          <h3>四、安全优化建议</h3>
          <p>1. 进一步细化阈值配置，降低误报率。<br/>2. 定期将高频恶意IP加入硬防黑名单。<br/>3. 加强相关业务系统的密码复杂度检查。</p>
        </div>
        
        <div class="report-footer">
          <p>NSOAR 防护中心自动生成 - 保密级别：内部(Internal)</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 初始化数据
const currentTime = ref('')
const scoreColor = '#67C23A' // 绿色

const summaryData = ref([
  { type: '恶意扫描', count: '1,245', handled: '1,245', ratio: '100%' },
  { type: 'DDoS攻击', count: '56', handled: '56', ratio: '100%' },
  { type: 'Web漏洞尝试', count: '320', handled: '315', ratio: '98.4%' },
  { type: '异常登录', count: '89', handled: '89', ratio: '100%' }
])

onMounted(() => {
  const d = new Date()
  currentTime.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

const exportToPdf = async () => {
  try {
    ElMessage.info('开始生成 PDF，请稍候...')
    // 动态引入 html2pdf.js，避免SSR或打包提前报错
    const html2pdf = (await import('html2pdf.js')).default

    const element = document.getElementById('report-content')
    const opt = {
      margin:       10,
      filename:     `NSOAR_安全评估报告_${new Date().getTime()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    html2pdf().set(opt).from(element).save().then(() => {
      ElMessage.success('导出PDF成功！')
    }).catch(err => {
      console.error('PDF导出异常:', err)
      ElMessage.error('导出PDF失败，请查看控制台日志')
    })
  } catch (error) {
    console.error('加载 html2pdf.js 失败:', error)
    ElMessage.error('不支持导出功能或依赖未安装 (html2pdf.js)')
  }
}
</script>

<style scoped>
.report-manage-container {
  padding: 20px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.report-preview {
  max-width: 900px;
  margin: 0 auto;
}

.report-content {
  padding: 20px;
  background-color: #fff;
}

.report-title {
  text-align: center;
  color: #303133;
  margin-bottom: 10px;
}

.report-meta {
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.report-section {
  margin-top: 25px;
}

.report-section h3 {
  color: #409EFF;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
  margin-bottom: 15px;
}

.score-display {
  display: flex;
  align-items: center;
  padding: 10px 20px;
}

.score-desc {
  margin-left: 30px;
  font-size: 16px;
  color: #606266;
}

.risk-list {
  line-height: 2;
  color: #606266;
}

.report-footer {
  margin-top: 50px;
  text-align: center;
  color: #C0C4CC;
  font-size: 12px;
  border-top: 1px dashed #EBEEF5;
  padding-top: 20px;
}
</style>
