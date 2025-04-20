<template>
  <div class="data-analysis">
    <div class="header">
      <h2 class="page-title">数据分析</h2>
      <div class="filter-section">
        <el-select
          v-model="selectedBrand"
          placeholder="选择品牌"
          clearable
          @change="handleBrandChange"
          class="brand-select"
        >
          <el-option
            v-for="brand in brands"
            :key="brand"
            :label="brand"
            :value="brand"
          />
        </el-select>
        <el-date-picker
          v-model="startDate"
          type="date"
          placeholder="选择开始日期"
          @change="updateEndDate"
        />
        <el-date-picker
          v-model="endDate"
          type="date"
          placeholder="选择结束日期"
          :disabled="!startDate"
        />
      </div>
    </div>

    <el-row :gutter="24" class="chart-row">
      <el-col :span="16">
        <el-card class="chart-card trend-chart" shadow="hover" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="card-title">销售趋势</span>
              <el-tooltip content="显示每日销售总量和销售型号数量" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card rank-chart" shadow="hover" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="card-title">型号销量排行</span>
              <el-tooltip content="显示销量前10的机型" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div ref="rankChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card pie-chart" shadow="hover" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="card-title">库存分布</span>
              <el-tooltip content="显示各库存状态的机型分布" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div ref="pieChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card radar-chart" shadow="hover" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="card-title">销售指标分析</span>
              <el-tooltip content="显示销售、库存、型号等多维度分析" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div ref="radarChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="chart-row">
      <el-col :span="24">
        <el-card class="chart-card inventory-chart" shadow="hover" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="card-title">库存状态</span>
              <div class="filter-section">
                <el-select
                  v-model="inventoryRange"
                  placeholder="选择库存区间"
                  @change="handleInventoryRangeChange"
                  style="width: 150px; margin-right: 10px;"
                >
                  <el-option label="0-8台" value="0-8" />
                  <el-option label="9-15台" value="9-15" />
                  <el-option label="16-500台" value="16-500" />
                  <el-option label="501-5000台" value="501-5000" />
                  <el-option label="5001-10000台" value="5001-10000" />
                  <el-option label="10001-15000台" value="10001-15000" />
                  <el-option label="15001-20000台" value="15001-20000" />
                  <el-option label="20001-25000台" value="20001-25000" />
                  <el-option label="25001-30000台" value="25001-30000" />
                  <el-option label="30001-35000台" value="30001-35000" />
                  <el-option label="35000台以上" value="35000+" />
                </el-select>
                <el-tooltip content="显示各型号库存量和销售情况" placement="top">
                  <el-icon class="help-icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </div>
          </template>
          <div class="inventory-content">
            <div ref="inventoryChartRef" class="chart-container"></div>
            <div class="analysis-panel">
              <div class="analysis-header">
                <span class="analysis-title">库存状态数据分析</span>
                <div class="analysis-divider"></div>
              </div>
              <div class="analysis-content" v-html="analysisData.summary"></div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart, RadarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { statsApi } from '@/utils/service'
import { QuestionFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  RadarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

// 数据
const loading = ref(true)
const startDate = ref('')
const endDate = ref('')
const trendChartRef = ref(null)
const rankChartRef = ref(null)
const inventoryChartRef = ref(null)
const pieChartRef = ref(null)
const radarChartRef = ref(null)
const modelRankData = ref([])
const inventoryRange = ref('0-8')
const analysisData = ref({
  totalModels: 0,
  averageStock: 0,
  totalStock: 0,
  totalSales: 0,
  summary: ''
})
let trendChart = null
let rankChart = null
let inventoryChart = null
let pieChart = null
let radarChart = null

// 添加品牌数据
const brands = ref(['iPhone', '三星', '华为', '小米', 'OPPO', 'VIVO', '荣耀', 'Redmi', 'Galaxy','红米'])
const selectedBrand = ref('')

// 处理品牌变化
const handleBrandChange = async () => {
  try {
    loading.value = true
    await fetchAnalysis()
  } catch (error) {
    console.error('品牌切换数据更新失败:', error)
    ElMessage.error('数据更新失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 监听品牌变化
watch(selectedBrand, async (newValue) => {
  if (newValue || newValue === '') {
    await handleBrandChange()
  }
}, { immediate: false })

// 初始化图表
const initCharts = async () => {
  await nextTick()
  
  if (!trendChartRef.value || !rankChartRef.value || !inventoryChartRef.value || !pieChartRef.value || !radarChartRef.value) {
    console.error('图表容器未找到')
    return
  }

  try {
    // 销毁已存在的图表实例
    trendChart?.dispose()
    rankChart?.dispose()
    inventoryChart?.dispose()
    pieChart?.dispose()
    radarChart?.dispose()

    // 初始化新的图表实例
    trendChart = echarts.init(trendChartRef.value, null, { renderer: 'canvas' })
    rankChart = echarts.init(rankChartRef.value, null, { renderer: 'canvas' })
    inventoryChart = echarts.init(inventoryChartRef.value, null, { renderer: 'canvas' })
    pieChart = echarts.init(pieChartRef.value, null, { renderer: 'canvas' })
    radarChart = echarts.init(radarChartRef.value, null, { renderer: 'canvas' })

    // 设置加载动画
    trendChart.showLoading()
    rankChart.showLoading()
    inventoryChart.showLoading()
    pieChart.showLoading()
    radarChart.showLoading()

    // 初始化趋势图
    trendChart.setOption({
      title: {
        text: '销售趋势分析',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      legend: {
        data: ['销售总量', '销售型号数'],
        top: 40
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: [],
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '销售数量',
          position: 'left'
        },
        {
          type: 'value',
          name: '型号数量',
          position: 'right'
        }
      ],
      series: [
        {
          name: '销售总量',
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: {
            color: '#409EFF'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64,158,255,0.3)' },
              { offset: 1, color: 'rgba(64,158,255,0.1)' }
            ])
          }
        },
        {
          name: '销售型号数',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: [],
          itemStyle: {
            color: '#67C23A'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(103,194,58,0.3)' },
              { offset: 1, color: 'rgba(103,194,58,0.1)' }
            ])
          }
        }
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicInOut'
    })

    // 初始化排行图
    rankChart.setOption({
      title: {
        text: '型号销量排行',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        position: 'top',
        splitNumber: 5,
        minInterval: 1,
        alignTicks: false,
        axisLabel: {
          formatter: '{value}'
        }
      },
      yAxis: {
        type: 'category',
        data: [],
        axisLabel: {
          interval: 0,
          rotate: 30,
          formatter: function(value) {
            if (value.length > 10) {
              return value.substring(0, 10) + '...';
            }
            return value;
          }
        }
      },
      series: [
        {
          name: '销量',
          type: 'bar',
          data: [],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#2378f7' },
                { offset: 0.7, color: '#2378f7' },
                { offset: 1, color: '#83bff6' }
              ])
            }
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}'
          }
        }
      ]
    })

    // 初始化饼图
    pieChart.setOption({
      title: {
        text: '库存状态分布',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        top: 'center',
        data: ['库存不足', '库存正常', '库存过高']
      },
      series: [
        {
          name: '库存状态',
          type: 'pie',
          radius: ['50%', '70%'],
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
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: 0, name: '库存不足', itemStyle: { color: '#F56C6C' } },
            { value: 0, name: '库存正常', itemStyle: { color: '#E6A23C' } },
            { value: 0, name: '库存过高', itemStyle: { color: '#67C23A' } }
          ]
        }
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicInOut'
    })

    // 初始化雷达图
    radarChart.setOption({
      title: {
        text: '销售指标分析',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'item'
      },
      legend: {
        data: ['实际值', '目标值'],
        top: 40
      },
      radar: {
        shape: 'circle',
        splitNumber: 5,
        axisName: {
          color: '#999',
          fontSize: 12
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(255,255,255,0.9)', 'rgba(250,250,250,0.9)']
          }
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(0,0,0,0.1)'
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0,0,0,0.1)'
          }
        },
        indicator: [
          { name: '销售总量', max: 100 },
          { name: '销售型号数', max: 100 },
          { name: '库存周转率', max: 100 },
          { name: '库存充足率', max: 100 },
          { name: '销售增长率', max: 100 }
        ]
      },
      series: [
        {
          type: 'radar',
          name: '销售指标',
          data: [
            {
              value: [0, 0, 0, 0, 0],
              name: '实际值',
              symbolSize: 6,
              lineStyle: {
                width: 2
              },
              itemStyle: {
                color: '#409EFF'
              },
              areaStyle: {
                color: 'rgba(64,158,255,0.2)'
              }
            },
            {
              value: [80, 80, 80, 80, 80],
              name: '目标值',
              symbolSize: 6,
              lineStyle: {
                width: 2,
                type: 'dashed'
              },
              itemStyle: {
                color: '#E6A23C'
              }
            }
          ]
        }
      ]
    })

    // 初始化库存图
    inventoryChart.setOption({
      title: {
        text: '库存状态分析',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          const data = params[0].data;
          return `${params[0].name}<br/>
                  当前库存: ${data.value}台<br/>
                  库存状态: ${data.stock_status === 'low' ? '库存不足' : 
                             data.stock_status === 'high' ? '库存过高' : '库存正常'}`;
        }
      },
      legend: {
        data: ['当前库存'],
        top: 40
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: [],
        axisLabel: {
          interval: 0,
          rotate: 45,
          formatter: function(value) {
            return value.length > 8 ? value.substring(0, 8) + '...' : value;
          }
        },
        axisTick: {
          alignWithLabel: true
        }
      },
      yAxis: {
        type: 'value',
        name: '库存数量',
        nameTextStyle: {
          padding: [0, 0, 0, 40]
        },
        axisLabel: {
          formatter: '{value}台'
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: 'rgba(0,0,0,0.1)'
          }
        }
      },
      series: [
        {
          name: '当前库存',
          type: 'bar',
          barWidth: '40%',
          data: [],
          itemStyle: {
            color: function(params) {
              const data = params.data;
              if (data && data.stock_status === 'low') {
                return '#F56C6C';
              } else if (data && data.stock_status === 'high') {
                return '#67C23A';
              }
              return '#E6A23C';
            }
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}台'
          }
        }
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicInOut'
    })

    // 隐藏加载动画
    trendChart.hideLoading()
    rankChart.hideLoading()
    inventoryChart.hideLoading()
    pieChart.hideLoading()
    radarChart.hideLoading()

    console.log('图表初始化完成')
  } catch (error) {
    console.error('图表初始化失败:', error)
    ElMessage.error('图表初始化失败：' + error.message)
  }
}

// 监听加载状态变化
watch(loading, (newValue) => {
  if (!newValue) {
    // 加载完成后，等待 DOM 更新完成再初始化图表
    nextTick(() => {
      if (!trendChart || !rankChart || !inventoryChart || !pieChart || !radarChart) {
        initCharts()
      }
    })
  }
})

// 生命周期钩子
onMounted(async () => {
  const today = new Date()
  startDate.value = today.toISOString().split('T')[0]
  updateEndDate(today)
  await nextTick()
  await initCharts()
  if (brands.value.length > 0) {
    selectedBrand.value = brands.value[0]
  }
  await fetchAnalysis()
  await fetchInventoryData()  // 获取库存数据
  window.addEventListener('resize', handleResize)
})

// 更新结束日期为开始日期后90天
const updateEndDate = (date) => {
  const endDateValue = new Date(date)
  endDateValue.setDate(endDateValue.getDate() + 90) // 加90天
  endDate.value = endDateValue.toISOString().split('T')[0] // 格式化为 YYYY-MM-DD
}

// 修改 fetchModelRankData 函数
const fetchModelRankData = async () => {
  try {
    // 如果没有选择品牌，清空数据并更新图表
    if (!selectedBrand.value) {
      modelRankData.value = []
      if (rankChart) {
        rankChart.setOption({
          xAxis: {
            max: 100,
            interval: 20,
            minInterval: 1,
            alignTicks: false
          },
          yAxis: {
            type: 'category',
            data: [],
            axisLabel: {
              interval: 0,
              rotate: 30
            }
          },
          series: [
            {
              name: '销量',
              type: 'bar',
              data: [],
              label: {
                show: true,
                position: 'right'
              }
            }
          ]
        })
      }
      return
    }

    console.log('开始获取型号排行数据，参数:', {
      brand: selectedBrand.value,
      startDate: dayjs(startDate.value).format('YYYY-MM-DD'),
      endDate: dayjs(endDate.value).format('YYYY-MM-DD')
    })

    const response = await statsApi.getModelRank({
      brand: selectedBrand.value,
      startDate: dayjs(startDate.value).format('YYYY-MM-DD'),
      endDate: dayjs(endDate.value).format('YYYY-MM-DD')
    })
    
    console.log('获取到的型号排行数据:', response)

    // 确保 response 是数组且有数据
    if (Array.isArray(response) && response.length > 0) {
      modelRankData.value = response
      if (rankChart) {
        const maxValue = Math.max(...response.map(item => item.value))
        const interval = Math.ceil(maxValue / 5)

        rankChart.setOption({
          xAxis: {
            max: interval * 5,
            interval: interval,
            minInterval: 1,
            alignTicks: false
          },
          yAxis: {
            type: 'category',
            data: response.map(item => item.model),
            axisLabel: {
              interval: 0,
              rotate: 30,
              formatter: function(value) {
                if (value.length > 10) {
                  return value.substring(0, 10) + '...';
                }
                return value;
              }
            }
          },
          series: [
            {
              name: '销量',
              type: 'bar',
              data: response.map(item => item.value),
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: '#83bff6' },
                  { offset: 0.5, color: '#188df0' },
                  { offset: 1, color: '#188df0' }
                ])
              },
              emphasis: {
                itemStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#2378f7' },
                    { offset: 0.7, color: '#2378f7' },
                    { offset: 1, color: '#83bff6' }
                  ])
                }
              },
              label: {
                show: true,
                position: 'right',
                formatter: '{c}'
              }
            }
          ]
        })
      }
    } else {
      modelRankData.value = []
      console.log('没有获取到型号排行数据')
    }
  } catch (error) {
    console.error('获取型号排行数据失败:', error)
    ElMessage.error(error.message || '获取型号排行数据失败')
    modelRankData.value = []
  }
}

// 修改 fetchInventoryData 函数
const fetchInventoryData = async () => {
  try {
    console.log('开始获取库存数据');
    // 添加参数
    const response = await statsApi.getInventoryPage({
      brand: selectedBrand.value,
      startDate: dayjs(startDate.value).format('YYYY-MM-DD'),
      endDate: dayjs(endDate.value).format('YYYY-MM-DD')
    });
    console.log('获取到的库存数据:', response);
    
    if (!response) {
      throw new Error('未获取到库存数据');
    }

    // 确保response是数组
    const inventoryData = Array.isArray(response) ? response : 
                         Array.isArray(response.data) ? response.data :
                         response.inventory || [];
    
    console.log('处理后的库存数据:', inventoryData);

    let filteredData = inventoryData;
    if (inventoryRange.value) {
      filteredData = inventoryData.filter(item => {
        if (!item || typeof item.quantity !== 'number') {
          console.warn('无效的库存数据项:', item);
          return false;
        }
        const quantity = item.quantity;
        switch(inventoryRange.value) {
          case '0-8':
            return quantity >= 0 && quantity <= 8;
          case '9-15':
            return quantity >= 9 && quantity <= 15;
          case '16-500':
            return quantity >= 16 && quantity <= 500;
          case '501-5000':
            return quantity >= 501 && quantity <= 5000;
          case '5001-10000':
            return quantity >= 5001 && quantity <= 10000;
          case '10001-15000':
            return quantity >= 10001 && quantity <= 15000;
          case '15001-20000':
            return quantity >= 15001 && quantity <= 20000;
          case '20001-25000':
            return quantity >= 20001 && quantity <= 25000;
          case '25001-30000':
            return quantity >= 25001 && quantity <= 30000;
          case '30001-35000':
            return quantity >= 30001 && quantity <= 35000;
          case '35000+':
            return quantity > 35000;
          default:
            return true;
        }
      });
    }

    console.log('过滤后的数据:', filteredData);

    // 更新分析数据
    if (filteredData.length > 0) {
      const totalStock = filteredData.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalSales = filteredData.reduce((sum, item) => sum + (item.total_sales || 0), 0);
      
      analysisData.value = {
        totalModels: filteredData.length,
        averageStock: Math.round(totalStock / filteredData.length),
        totalStock: totalStock,
        totalSales: totalSales,
        summary: generateAnalysisSummary(filteredData)
      };

      // 更新库存图表
      if (inventoryChart) {
        console.log('开始更新库存图表');
        
        const chartData = filteredData.map(item => ({
          value: item.quantity,
          name: item.model,
          stock_status: item.quantity <= 8 ? 'low' :
                       item.quantity > 1500 ? 'high' : 'normal',
          itemStyle: {
            color: item.quantity <= 8 ? '#F56C6C' :
                   item.quantity > 1500 ? '#67C23A' : '#E6A23C'
          }
        }));

        console.log('图表数据:', chartData);

        // 使用完整的图表配置
        inventoryChart.setOption({
          title: {
            text: '库存状态分析',
            left: 'center',
            top: 10
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            },
            formatter: function(params) {
              const data = params[0].data;
              return `${data.name}<br/>
                      当前库存: ${data.value}台<br/>
                      库存状态: ${data.stock_status === 'low' ? '库存不足' :
                                 data.stock_status === 'high' ? '库存过高' : '库存正常'}`;
            }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: chartData.map(item => item.name),
            axisLabel: {
              interval: 0,
              rotate: 45,
              formatter: function(value) {
                return value.length > 8 ? value.substring(0, 8) + '...' : value;
              }
            }
          },
          yAxis: {
            type: 'value',
            name: '库存数量',
            axisLabel: {
              formatter: '{value}台'
            }
          },
          series: [{
            name: '当前库存',
            type: 'bar',
            data: chartData,
            barWidth: '40%',
            label: {
              show: true,
              position: 'top',
              formatter: '{c}台'
            }
          }]
        }, true);
        
        // 强制重新渲染
        nextTick(() => {
          inventoryChart.resize();
        });
      }
    } else {
      analysisData.value = {
        totalModels: 0,
        averageStock: 0,
        totalStock: 0,
        totalSales: 0,
        summary: '暂无数据'
      };

      if (inventoryChart) {
        inventoryChart.setOption({
          xAxis: { data: [] },
          series: [{ data: [] }]
        });
      }
    }
  } catch (error) {
    console.error('获取库存数据失败:', error);
    ElMessage.error(error.message || '获取库存数据失败');
  }
}

// 添加分析总结生成函数
const generateAnalysisSummary = (data) => {
  // 根据新的阈值调整库存状态判断
  const lowStock = data.filter(item => item.quantity <= 8)
    .sort((a, b) => a.quantity - b.quantity);
  const warningStock = data.filter(item => item.quantity > 8 && item.quantity <= 14)
    .sort((a, b) => a.quantity - b.quantity);
  const normalStock = data.filter(item => item.quantity > 14 && item.quantity <= 1500);
  const highStock = data.filter(item => item.quantity > 1500)
    .sort((a, b) => b.quantity - a.quantity);
  
  let summaryContent = '';
  
  // 添加基础数据分析
  summaryContent += `<div class="analysis-basic">
    <div class="analysis-item">
      <span class="item-label">区间型号数量：</span>
      <span class="item-value">${data.length}个型号</span>
    </div>
    <div class="analysis-item">
      <span class="item-label">平均库存数量：</span>
      <span class="item-value">${Math.round(data.reduce((sum, item) => sum + item.quantity, 0) / data.length)}台</span>
    </div>
    <div class="analysis-item">
      <span class="item-label">库存总量：</span>
      <span class="item-value">${data.reduce((sum, item) => sum + item.quantity, 0)}台</span>
    </div>
 
  </div>`;

  // 添加库存状态统计
  summaryContent += '<div class="status-summary">';
  if (lowStock.length > 0) {
    summaryContent += `<div class="status-item low">
      <span class="status-dot"></span>
      <span class="status-count">${lowStock.length}个</span>
      <span class="status-text">库存不足</span>
    </div>`;
  }
  if (warningStock.length > 0) {
    summaryContent += `<div class="status-item warning">
      <span class="status-dot"></span>
      <span class="status-count">${warningStock.length}个</span>
      <span class="status-text">库存警告</span>
    </div>`;
  }
  if (normalStock.length > 0) {
    summaryContent += `<div class="status-item normal">
      <span class="status-dot"></span>
      <span class="status-count">${normalStock.length}个</span>
      <span class="status-text">库存正常</span>
    </div>`;
  }
  if (highStock.length > 0) {
    summaryContent += `<div class="status-item high">
      <span class="status-dot"></span>
      <span class="status-count">${highStock.length}个</span>
      <span class="status-text">库存过高</span>
    </div>`;
  }
  summaryContent += '</div>';

  // 添加库存预警信息
  if (lowStock.length > 0) {
    summaryContent += `<div class="alert-message critical">
      <span class="alert-icon">🚨</span>
      <span>紧急：库存不足(≤8台)机型：<br/>
        ${lowStock.map((item, index) => 
          `${index + 1}. ${item.model}: ${item.quantity}台`
        ).join('<br/>')}
      </span>
    </div>`;
  }
  
  if (warningStock.length > 0) {
    summaryContent += `<div class="alert-message warning">
      <span class="alert-icon">⚠️</span>
      <span>警告：库存偏低(9-14台)机型：<br/>
        ${warningStock.map((item, index) => 
          `${index + 1}. ${item.model}: ${item.quantity}台`
        ).join('<br/>')}
      </span>
    </div>`;
  }

  // 添加库存过高的前五个机型信息
  if (highStock.length > 0) {
    const topFiveHighStock = highStock.slice(0, 5);
    
    summaryContent += `<div class="alert-message notice high-stock">
      <span class="alert-icon">📊</span>
      <span>库存最高的前五个机型：<br/>
        ${topFiveHighStock.map((item, index) => 
          `${index + 1}. ${item.model}: ${item.quantity}台`
        ).join('<br/>')}
      </span>
    </div>`;
  }

  return summaryContent;
}

// 修改库存区间变化处理函数
const handleInventoryRangeChange = async () => {
  await fetchInventoryData();
}

// 修改 fetchAnalysis 函数，移除库存图表的更新
const fetchAnalysis = async () => {
  if (!startDate.value || !endDate.value) {
    ElMessage.warning('请选择日期范围')
    return
  }

  if (dayjs(startDate.value).isAfter(dayjs(endDate.value))) {
    ElMessage.warning('开始日期不能晚于结束日期')
    return
  }

  loading.value = true
  try {
    console.log('开始获取分析数据，参数:', {
      startDate: dayjs(startDate.value).format('YYYY-MM-DD'),
      endDate: dayjs(endDate.value).format('YYYY-MM-DD'),
      brand: selectedBrand.value
    })

    const response = await statsApi.getAnalysis({
      startDate: dayjs(startDate.value).format('YYYY-MM-DD'),
      endDate: dayjs(endDate.value).format('YYYY-MM-DD'),
      brand: selectedBrand.value || undefined
    })

    console.log('获取到的分析数据:', response)

    if (response) {
      if (!trendChart) {
        await initCharts()
      }
      // 更新趋势图和饼图
      if (response.trend) {
        trendChart.setOption({
          xAxis: {
            data: response.trend.map(item => item.date)
          },
          series: [
            {
              data: response.trend.map(item => item.total_quantity)
            },
            {
              data: response.trend.map(item => item.model_count)
            }
          ]
        })
      }

      // 更新饼图
      if (response.inventory) {
        const lowStock = response.inventory.filter(item => item.stock_status === 'low').length || 0
        const normalStock = response.inventory.filter(item => item.stock_status === 'normal').length || 0
        const highStock = response.inventory.filter(item => item.stock_status === 'high').length || 0

        pieChart.setOption({
          series: [{
            data: [
              { value: lowStock, name: '库存不足', itemStyle: { color: '#F56C6C' } },
              { value: normalStock, name: '库存正常', itemStyle: { color: '#E6A23C' } },
              { value: highStock, name: '库存过高', itemStyle: { color: '#67C23A' } }
            ]
          }]
        })
      }

      // 更新雷达图
      if (response.trend && response.trend.length > 0) {
        const totalSales = response.trend.reduce((sum, item) => sum + item.total_quantity, 0)
        const avgModelCount = response.trend.reduce((sum, item) => sum + item.model_count, 0) / response.trend.length
        const stockTurnover = totalSales / (response.inventory?.reduce((sum, item) => sum + item.quantity, 0) || 1)
        const stockSufficiency = response.inventory ? 
          ((response.inventory.filter(item => item.stock_status === 'normal').length + 
            response.inventory.filter(item => item.stock_status === 'high').length) / response.inventory.length * 100) : 0
        
        let salesGrowth = 0
        if (response.trend.length >= 2) {
          const lastSales = response.trend[response.trend.length - 1].total_quantity
          const prevSales = response.trend[response.trend.length - 2].total_quantity
          salesGrowth = prevSales ? ((lastSales - prevSales) / prevSales) * 100 : 0
        }

        radarChart.setOption({
          series: [{
            data: [
              {
                value: [
                  Math.min(totalSales / 10, 100),
                  Math.min(avgModelCount * 2, 100),
                  Math.min(stockTurnover * 30, 100),
                  Math.min(stockSufficiency, 100),
                  Math.min(Math.max(salesGrowth + 50, 0), 100)
                ],
                name: '实际值'
              },
              {
                value: [80, 80, 80, 80, 80],
                name: '目标值'
              }
            ]
          }]
        })
      }

      // 单独获取型号排行数据
      await fetchModelRankData()
    } else {
      ElMessage.error('获取数据失败：返回数据为空')
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

// 添加resize处理函数
const handleResize = () => {
  trendChart?.resize()
  rankChart?.resize()
  inventoryChart?.resize()
  pieChart?.resize()
  radarChart?.resize()
}

// 组件卸载时移除监听器
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  // 销毁图表实例
  trendChart?.dispose()
  rankChart?.dispose()
  inventoryChart?.dispose()
  pieChart?.dispose()
  radarChart?.dispose()
})
</script>

<style scoped>
.data-analysis {
  padding: 24px;
  background: linear-gradient(135deg, #f6f8fc 0%, #f0f4f8 100%);
  min-height: calc(100vh - 60px);
  position: relative;
  overflow: hidden;
}

.data-analysis::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(64, 158, 255, 0.05) 0%, transparent 25%),
    radial-gradient(circle at 80% 80%, rgba(103, 194, 58, 0.05) 0%, transparent 25%),
    radial-gradient(circle at 50% 50%, rgba(230, 162, 60, 0.05) 0%, transparent 35%);
  pointer-events: none;
  animation: gradientShift 15s ease-in-out infinite alternate;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.05),
    0 5px 10px rgba(0, 0, 0, 0.02),
    inset 0 0 0 1px rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.header:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 15px 35px rgba(0, 0, 0, 0.08),
    0 8px 15px rgba(0, 0, 0, 0.03),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0) 100%);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.header:hover::after {
  transform: translateX(100%);
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(120deg, #2c5282, #4299e1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.5px;
  position: relative;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 40%;
  height: 3px;
  background: linear-gradient(90deg, #4299e1, transparent);
  border-radius: 2px;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.brand-select {
  width: 200px;
  transition: all 0.3s ease;
}

.date-picker {
  width: 400px;
  transition: all 0.3s ease;
}

.chart-row {
  margin-bottom: 24px;
  animation: slideUpFade 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

.chart-card {
  height: 100%;
  border: none;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.05),
    0 5px 10px rgba(0, 0, 0, 0.02),
    inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.chart-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 20px 35px rgba(0, 0, 0, 0.08),
    0 10px 15px rgba(0, 0, 0, 0.03),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  background: linear-gradient(120deg, #ffffff 0%, #f8faff 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.card-header .card-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(120deg, #2c5282, #4299e1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.5px;
  position: relative;
}

.card-header .card-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 40%;
  height: 3px;
  background: linear-gradient(90deg, #4299e1, transparent);
  border-radius: 2px;
}

.help-icon {
  color: #909399;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  font-size: 20px;
  padding: 8px;
  border-radius: 50%;
  background: rgba(144, 147, 153, 0.1);
}

.help-icon:hover {
  color: #409EFF;
  transform: scale(1.1) rotate(15deg);
  background: rgba(64, 158, 255, 0.1);
}

.chart-container {
  padding: 24px;
  width: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 252, 254, 0.95) 100%);
}

/* 图表特定样式 */
.trend-chart .chart-container {
  height: 500px;
  min-width: 600px;
}

.rank-chart .chart-container {
  height: 500px;
  min-width: 400px;
}

.pie-chart .chart-container,
.radar-chart .chart-container {
  height: 400px;
  min-width: 400px;
}

.inventory-chart .chart-container {
  height: 500px;
  min-width: 800px;
}

:deep(.el-card__body) {
  padding: 0;
}

:deep(.el-date-editor) {
  --el-date-editor-width: 100%;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(228, 231, 237, 0.8);
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}

:deep(.el-date-editor:hover) {
  border-color: #409EFF;
  transform: translateY(-2px);
  box-shadow: 
    0 8px 16px rgba(64, 158, 255, 0.15),
    inset 0 0 0 1px rgba(64, 158, 255, 0.2);
}

:deep(.el-date-editor.is-active) {
  border-color: #409EFF;
  box-shadow: 
    0 8px 16px rgba(64, 158, 255, 0.2),
    inset 0 0 0 1px rgba(64, 158, 255, 0.3);
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes gradientShift {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 100% 100%;
  }
}

.chart-row:nth-child(2) {
  animation-delay: 0.2s;
}

.chart-row:nth-child(3) {
  animation-delay: 0.4s;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .date-picker {
    width: 350px;
  }
  
  .chart-container {
    height: 350px;
  }
  
  .trend-chart .chart-container,
  .rank-chart .chart-container {
    height: 400px;
  }
}

@media (max-width: 1200px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px 20px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .date-picker {
    width: 100%;
  }
  
  .chart-container {
    height: 300px;
    padding: 16px;
  }
  
  .trend-chart .chart-container,
  .rank-chart .chart-container {
    height: 350px;
  }
}

@media (max-width: 768px) {
  .data-analysis {
    padding: 16px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .card-header {
    padding: 16px;
  }
  
  .card-title {
    font-size: 16px;
  }
  
  .help-icon {
    font-size: 16px;
    padding: 6px;
  }
  
  .chart-container {
    padding: 12px;
  }
}

.inventory-content {
  display: flex;
  gap: 24px;
  padding: 20px;
  min-height: 480px;
  position: relative;
}

.inventory-content .chart-container {
  flex: 2;
  min-width: 600px;
  height: 480px !important;
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.analysis-panel {
  flex: 1;
  width: 300px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 252, 254, 0.95) 100%);
  border-radius: 12px;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.05),
    inset 0 0 0 1px rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 16px;
  transition: all 0.3s ease;
  height: 480px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.analysis-panel:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 16px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.analysis-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(66, 153, 225, 0.1);
  flex-shrink: 0;
}

.analysis-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c5282;
  display: flex;
  align-items: center;
  gap: 8px;
}

.analysis-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.analysis-content::-webkit-scrollbar {
  width: 4px;
}

.analysis-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
}

.analysis-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.analysis-basic {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  font-size: 12px;
}

.analysis-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  line-height: 1.4;
}

.status-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  font-size: 12px;
}

.alert-message {
  margin-top: 8px;
  padding: 8px 10px;
  background: rgba(245, 108, 108, 0.1);
  border-radius: 6px;
  color: #F56C6C;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11px;
  line-height: 1.4;
}

.alert-message span {
  word-break: break-all;
  flex: 1;
}

.alert-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-count {
  font-weight: 600;
  color: #2c5282;
  white-space: nowrap;
}

.status-text {
  color: #606266;
  white-space: nowrap;
}

.alert-message.critical {
  background: rgba(245, 108, 108, 0.2);
  border-left: 4px solid #F56C6C;
}

.alert-message.warning {
  background: rgba(230, 162, 60, 0.2);
  border-left: 4px solid #E6A23C;
}

.alert-message.notice {
  background: rgba(144, 147, 153, 0.2);
  border-left: 4px solid #909399;
}
</style>