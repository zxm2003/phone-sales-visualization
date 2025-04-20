<template>
  <div class="dashboard-page">
    <el-row :gutter="24">
      <!-- 销售统计卡片 -->
      <el-col :span="8">
        <el-card class="stat-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon class="header-icon"><DataLine /></el-icon>
                <span class="header-title">今日销量</span>
              </div>
              <div class="header-actions">
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
                <el-tag type="success" effect="dark" class="stat-tag">{{ todaySales }}</el-tag>
              </div>
            </div>
          </template>
          <div class="card-content">
            <v-chart
                :option="todaySalesChartOption"
                class="v-chart"
                autoresize
            />
          </div>
        </el-card>
      </el-col>

      <!-- 库存警报卡片 -->
      <el-col :span="8">
        <el-card class="stat-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon class="header-icon"><Warning /></el-icon>
                <span class="header-title">库存警报</span>
              </div>
              <div class="header-actions">
                <el-select
                    v-model="selectedAlertBrand"
                    placeholder="选择品牌"
                    clearable
                    @change="handleAlertBrandChange"
                    class="brand-select"
                >
                  <el-option
                      v-for="brand in brands"
                      :key="brand"
                      :label="brand"
                      :value="brand"
                  />
                </el-select>
                <el-tag :type="lowStockCount > 0 ? 'danger' : 'success'" effect="dark" class="stat-tag">{{ lowStockCount }}</el-tag>
              </div>
            </div>
          </template>
          <div class="card-content">
            <v-chart
                :option="alertChartOption"
                class="v-chart alert-chart"
                autoresize
            />
          </div>
        </el-card>
      </el-col>

      <!-- 销售预测卡片 -->
      <el-col :span="8">
        <el-card class="stat-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon class="header-icon"><TrendCharts /></el-icon>
                <span class="header-title">销量预测</span>
              </div>
              <el-tag type="info" effect="dark" class="future-tag">未来7天</el-tag>
            </div>
          </template>
          <div class="card-content">
            <v-chart
                :option="forecastChartOption"
                class="v-chart"
                autoresize
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 销售趋势图 -->
    <el-row style="margin-top: 24px">
      <el-col :span="24">
        <el-card class="trend-card" shadow="hover">
          <template #header>
            <div class="card-header trend-header">
              <div class="header-left">
                <el-icon class="header-icon"><TrendCharts /></el-icon>
                <span class="header-title">销售趋势</span>
              </div>
              <el-radio-group v-model="timeRange" size="large" @change="handleTimeRangeChange" class="time-range-group">
                <el-radio-button value="week">周</el-radio-button>
                <el-radio-button value="month">月</el-radio-button>
                <el-radio-button value="year">年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="trend-chart">
            <v-chart
                :option="trendChartOption"
                class="v-chart"
                autoresize
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { salesApi, inventoryPageApi, statsApi } from '@/utils/service'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import { provide } from 'vue'
import { DataLine, Warning, TrendCharts } from '@element-plus/icons-vue'

// 注册必需的组件
echarts.use([
  CanvasRenderer,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent
])

// 提供主题
provide(THEME_KEY, 'light')

const todaySales = ref(0)
const salesTrend = ref(0)
const lowStockItems = ref([])
const lowStockCount = ref(0)
const timeRange = ref('week')
const salesData = ref([])
const forecastData = ref([])
const selectedBrand = ref('')
const selectedAlertBrand = ref('')
const selectedTrendBrand = ref('全部品牌')
const brands = ref(['全部品牌', '苹果', '三星', '小米', '华为', 'OPPO', 'VIVO','荣耀','8848'])
const hourlyData = ref([])

// 将timeSlotData改为普通的响应式对象
const timeSlotData = ref({
  '8:00-12:00': 0,
  '12:00-16:00': 0,
  '16:00-20:00': 0,
  '20:00-24:00': 0
});

// 今日销售图表配置
const todaySalesChartOption = computed(() => ({
  title: {
    text: '今日销量',
    left: 'center',
    top: 10,
    textStyle: {
      fontSize: 16,
      fontWeight: 'normal',
      color: '#606266'
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    },
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#eee',
    borderWidth: 1,
    textStyle: {
      color: '#606266'
    },
    padding: [10, 15]
  },
  xAxis: {
    type: 'category',
    data: hourlyData.value.map(item => {
      const timeSlot = item.time_slot;
      const nextSlot = {
        '08:00': '12:00',
        '12:00': '16:00',
        '16:00': '20:00',
        '20:00': '24:00'
      }[timeSlot] || '24:00';
      return `${timeSlot}-${nextSlot}`;
    }),
    axisLabel: {
      rotate: 45,
      margin: 15,
      color: '#909399'
    },
    axisLine: {
      lineStyle: {
        color: '#DCDFE6'
      }
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#909399',
      formatter: function (value) {
        if (value >= 1000000) {
          return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
          return (value / 1000).toFixed(1) + 'K';
        }
        return value;
      }
    },
    splitLine: {
      lineStyle: {
        color: '#EBEEF5',
        type: 'dashed'
      }
    }
  },
  grid: {
    top: 60,
    bottom: 60,
    left: 40,
    right: 20,
    containLabel: true
  },
  series: [{
    name: '销量',
    data: hourlyData.value.map(item => item.total),
    type: 'bar',
    barWidth: '40%',
    itemStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [{
          offset: 0,
          color: '#409EFF'
        }, {
          offset: 1,
          color: 'rgba(64, 158, 255, 0.3)'
        }]
      },
      borderRadius: [6, 6, 0, 0]
    },
    emphasis: {
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: '#66b1ff'
          }, {
            offset: 1,
            color: 'rgba(102, 177, 255, 0.3)'
          }]
        }
      }
    }
  }]
}))

// 库存警报图表配置
const alertChartOption = computed(() => {
  // 在computed中打印当前的数据，用于调试
  console.log('Computing alert chart option with data:', timeSlotData.value);
  
  // 计算最大值，用于设置y轴范围
  const maxValue = Math.max(...Object.values(timeSlotData.value).map(v => Number(v) || 0));
  const yAxisMax = Math.max(5, Math.ceil(maxValue * 1.2)); // 留出20%的空间
  
  return {
    title: {
      text: '库存警报分布',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal',
        color: '#606266'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}种机型',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      top: 60,
      bottom: 60,
      left: 60,
      right: 20,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['8:00-12:00', '12:00-16:00', '16:00-20:00', '20:00-24:00'],
      axisLabel: {
        rotate: 45,
        margin: 15,
        color: '#909399',
        show: true
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#DCDFE6',
          width: 1
        }
      },
      axisTick: {
        show: true,
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value',
      name: '机型种类数量',
      nameTextStyle: {
        color: '#606266',
        padding: [0, 0, 0, 40]
      },
      axisLabel: {
        color: '#909399',
        formatter: '{value}种'
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#EBEEF5',
          type: 'dashed'
        }
      },
      min: 0,
      max: yAxisMax
    },
    series: [{
      name: '库存警报',
      type: 'bar',
      data: [
        Number(timeSlotData.value['8:00-12:00']) || 0,
        Number(timeSlotData.value['12:00-16:00']) || 0,
        Number(timeSlotData.value['16:00-20:00']) || 0,
        Number(timeSlotData.value['20:00-24:00']) || 0
      ],
      barWidth: '40%',
      itemStyle: {
        color: function(params) {
          return params.value > 0 ? '#F56C6C' : '#E6A23C';
        },
        borderRadius: [4, 4, 0, 0]
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}种',
        color: '#606266'
      },
      emphasis: {
        itemStyle: {
          color: function(params) {
            return params.value > 0 ? '#FF7875' : '#F3B95F';
          }
        }
      }
    }]
  };
});

// 销售趋势图表配置
const trendChartOption = computed(() => {
  console.log('当前销售数据:', salesData.value); // 打印当前销售数据
  return {
    title: {
      text: '销售趋势',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal',
        color: '#606266'
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
      top: 30
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: salesData.value.length > 0 ? 
        salesData.value.map(item => dayjs(item.date).format('MM-DD')) : 
        ['暂无数据'],
    },
    yAxis: [
      {
        type: 'value',
        name: '销售总量',
        axisLabel: {
          formatter: '{value} 台'
        }
      },
      {
        type: 'value',
        name: '型号数量',
        axisLabel: {
          formatter: '{value} 种'
        }
      }
    ],
    grid: {
      top: 70,
      bottom: 60,
      left: 40,
      right: 40,
      containLabel: true
    },
    series: [
      {
        name: '销售总量',
        type: 'line',
        smooth: true,
        data: salesData.value.length > 0 ? 
          salesData.value.map(item => item.total_quantity) : 
          [0],
      },
      {
        name: '销售型号数',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: salesData.value.length > 0 ? 
          salesData.value.map(item => item.model_count) : 
          [0],
      }
    ]
  };
});

// 销售预测图表配置
const forecastChartOption = computed(() => ({
  title: {
    text: '未来7天销量预测',
    left: 'center',
    top: 10,
    textStyle: {
      fontSize: 16,
      fontWeight: 'normal',
      color: '#606266'
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'line'
    },
    formatter: function(params) {
      const data = params[0];
      return `${data.name}<br/>${data.seriesName}：${data.value}台<br/>预测区间：${data.data.min}-${data.data.max}台`;
    }
  },
  xAxis: {
    type: 'category',
    data: forecastData.value.slice(0, 7).map(item => dayjs(item.date).format('MM-DD')),
    axisLabel: {
      rotate: 45,
      margin: 15
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: function (value) {
        if (value >= 1000000) {
          return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
          return (value / 1000).toFixed(1) + 'K';
        }
        return value;
      }
    }
  },
  grid: {
    top: 60,
    bottom: 60,
    left: 40,
    right: 20,
    containLabel: true
  },
  series: [
    {
      name: '预测销量',
      type: 'line',
      smooth: true,
      data: forecastData.value.slice(0, 7).map(item => ({
        value: item.forecast,
        min: Math.floor(item.forecast * 0.9),
        max: Math.ceil(item.forecast * 1.1)
      })),
      symbolSize: 8,
      lineStyle: {
        width: 3,
        color: '#E6A23C'
      },
      itemStyle: {
        color: '#E6A23C',
        borderWidth: 2,
        borderColor: '#fff'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(230,162,60,0.3)'
          }, {
            offset: 1,
            color: 'rgba(230,162,60,0.1)'
          }]
        }
      },
      markArea: {
        itemStyle: {
          color: 'rgba(230,162,60,0.1)'
        },
        data: forecastData.value.slice(0, 7).map(item => [{
          yAxis: Math.floor(item.forecast * 0.9)
        }, {
          yAxis: Math.ceil(item.forecast * 1.1)
        }])
      }
    }
  ]
}))

// 处理时间范围变化的函数
const handleTimeRangeChange = async () => {
  try {
    const params = {
      timeRange: timeRange.value,
      brand: selectedTrendBrand.value === '全部品牌' ? '' : selectedTrendBrand.value
    };
    console.log('请求参数:', params); // 打印请求参数
    const trendData = await statsApi.getTrend(params);
    
    console.log('获取的趋势数据:', trendData); // 打印返回的数据
    
    if (Array.isArray(trendData) && trendData.length > 0) {
      salesData.value = trendData;
    } else {
      salesData.value = []; // 清空数据
      ElMessage.warning('没有可显示的数据');
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error);
    ElMessage.error('获取趋势数据失败');
    salesData.value = [];
  }
}

// 处理品牌变化
const handleBrandChange = async () => {
  // 如果选择了"全部品牌"，将selectedBrand设为空字符串
  if (selectedBrand.value === '全部品牌') {
    selectedBrand.value = '';
  }
  await fetchDashboardPageData();
}

// 修改handleAlertBrandChange函数
const handleAlertBrandChange = async () => {
  try {
    console.log('选择的警报品牌:', selectedAlertBrand.value);
    
    const brand = selectedAlertBrand.value === '全部品牌' || !selectedAlertBrand.value ? '' : selectedAlertBrand.value;
    console.log('发送到后端的品牌参数:', brand);
    
    const response = await inventoryPageApi.getAlerts(brand);
    console.log('获取到的警报数据:', response);
    
    // 更新数据，使用Set去重确保机型不重复
    const uniqueModels = new Set(response.items?.map(item => item.model) || []);
    lowStockItems.value = Array.from(uniqueModels).map(model => {
      return response.items.find(item => item.model === model);
    });
    
    // 更新时间段数据
    const newTimeSlotData = {
      '8:00-12:00': 0,
      '12:00-16:00': 0,
      '16:00-20:00': 0,
      '20:00-24:00': 0,
      ...response.timeSlots
    };

    // 确保所有值都是数字，且不超过实际的机型种类数量
    Object.keys(newTimeSlotData).forEach(key => {
      const value = Number(newTimeSlotData[key]) || 0;
      newTimeSlotData[key] = Math.min(value, uniqueModels.size);
    });

    // 使用新对象更新timeSlotData
    timeSlotData.value = newTimeSlotData;
    
    console.log('更新后的时间段数据:', timeSlotData.value);
    console.log('实际警报机型种类数量:', uniqueModels.size);
    
    // 更新警报数量为实际的机型种类数量
    lowStockCount.value = uniqueModels.size;
  } catch (error) {
    console.error('获取库存警报数据失败:', error);
    ElMessage.error('获取库存警报数据失败');
  }
}

// 修改fetchDashboardPageData函数中的相关部分
const fetchDashboardPageData = async () => {
  try {
    // 获取趋势数据
    await handleTimeRangeChange();
    
    // 获取其他数据
    const [todayResponse, yesterdayResponse, alertResponse, forecastResponse] = await Promise.all([
      statsApi.getTodaySales(selectedBrand.value === '全部品牌' ? '' : selectedBrand.value),
      statsApi.getYesterdaySales(),
      inventoryPageApi.getAlerts(selectedAlertBrand.value),
      salesApi.getForecast()
    ]);

    // 更新今日销售数据
    todaySales.value = todayResponse?.total || 0;
    hourlyData.value = todayResponse?.hourly?.map(item => ({
      ...item,
      time_slot: item.time_slot || '00-00'
    })) || [];

    // 计算销售趋势百分比
    const yesterdaySalesTotal = yesterdayResponse?.total || 0;
    salesTrend.value = yesterdaySalesTotal === 0 ? 100 :
      Math.round(((todaySales.value - yesterdaySalesTotal) / yesterdaySalesTotal) * 100);

    // 更新库存警报数据
    if (alertResponse?.items) {
      const uniqueModels = new Set(alertResponse.items.map(item => item.model));
      lowStockItems.value = Array.from(uniqueModels).map(model => {
        return alertResponse.items.find(item => item.model === model);
      });

      const newTimeSlotData = {
        '8:00-12:00': 0,
        '12:00-16:00': 0,
        '16:00-20:00': 0,
        '20:00-24:00': 0,
        ...alertResponse.timeSlots
      };

      // 确保所有值都是数字，且不超过实际的机型种类数量
      Object.keys(newTimeSlotData).forEach(key => {
        const value = Number(newTimeSlotData[key]) || 0;
        newTimeSlotData[key] = Math.min(value, uniqueModels.size);
      });

      timeSlotData.value = newTimeSlotData;
      lowStockCount.value = uniqueModels.size;
    }

    // 更新预测数据
    forecastData.value = forecastResponse || [];

    console.log('更新后的时间段数据:', timeSlotData.value);
    console.log('警报机型种类数量:', lowStockCount.value);

  } catch (error) {
    console.error('获取仪表板数据失败:', error);
    ElMessage.error('获取数据失败');
  }
}

onMounted(async () => {
  try {
    // 初始化时调用一次获取全部品牌的数据
    await handleAlertBrandChange();
    await fetchDashboardPageData();
  } catch (error) {
    console.error('初始化失败:', error);
    ElMessage.error('初始化失败');
  }
})
</script>

<style>
.dashboard-page {
  padding: 20px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  background: linear-gradient(145deg, #ffffff, #f5f7fa);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-select {
  width: 120px;
}

.stat-tag {
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 6px;
}

.future-tag {
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 6px;
}

.card-content {
  height: 300px;
  padding: 10px;
}

.v-chart {
  width: 100%;
  height: 100%;
}

.trend-card {
  border-radius: 12px;
  border: none;
  background: linear-gradient(145deg, #ffffff, #f5f7fa);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.trend-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.trend-header {
  padding: 0;
}

.time-range-group {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 4px;
}

.trend-chart {
  height: 400px;
  padding: 10px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.el-card__body) {
  padding: 0;
}

:deep(.el-radio-button__inner) {
  border: none;
  background: transparent;
  color: #606266;
  padding: 8px 16px;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: #409eff;
  color: #fff;
  box-shadow: none;
}

:deep(.el-select .el-input__wrapper) {
  box-shadow: none;
  background: #f5f7fa;
  border-radius: 6px;
}

:deep(.el-select .el-input__wrapper:hover) {
  background: #e4e7ed;
}

:deep(.el-select .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}
</style>
