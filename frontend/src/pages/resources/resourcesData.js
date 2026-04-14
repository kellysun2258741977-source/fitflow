export const resourcesData = {
  home: {
    title: '资源中心',
    subtitle: '常用工具与参考资料',
  },
  nutrition: {
    title: '营养与食物',
    subtitle: '热量与营养信息来源',
    items: [
      { icon: '🥗', title: 'FatSecret Platform', desc: '营养数据库与食品API文档', url: 'https://platform.fatsecret.com/platform-api' },
      { icon: '🏷️', title: 'USDA FoodData', desc: '食品营养数据库（英文）', url: 'https://fdc.nal.usda.gov/' },
      { icon: '📦', title: '条码数据库', desc: '用于识别包装食品（思路参考）', url: 'https://www.gs1.org/standards/barcodes' },
    ],
  },
  vision: {
    title: '图像识别',
    subtitle: '菜品识别与图片处理',
    items: [
      { icon: '📷', title: '百度AI开放平台', desc: '菜品识别能力与文档入口', url: 'https://ai.baidu.com/' },
      { icon: '🧪', title: '图片压缩参考', desc: '上传前压缩、降低延迟', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API' },
    ],
  },
  fitness: {
    title: '运动与MET',
    subtitle: '运动消耗估算参考',
    items: [
      { icon: '🏃', title: 'METs 概念', desc: '代谢当量基础概念（百科）', url: 'https://en.wikipedia.org/wiki/Metabolic_equivalent_of_task' },
      { icon: '📊', title: '运动记录建议', desc: '如何描述强度/时长', url: 'https://www.cdc.gov/physicalactivity/basics/index.htm' },
    ],
  },
  dev: {
    title: '开发与部署',
    subtitle: 'CI/CD 与运维参考',
    items: [
      { icon: '🔐', title: 'SSH Key 指南', desc: 'ed25519 密钥与安全建议', url: 'https://www.ssh.com/academy/ssh/keygen' },
      { icon: '⚙️', title: 'GitHub Actions', desc: '工作流与 Secrets', url: 'https://docs.github.com/actions' },
    ],
  },
};

