export type Scenario = "movie" | "home" | "travel" | "work";
// LAN HTTP pages may not expose crypto.randomUUID; IDs do not carry security claims.
export const uid = () =>
  typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `oneflow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
export type StepStatus =
  | "pending"
  | "waiting_confirmation"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";
export type TaskStatus =
  | "draft"
  | "pending_confirmation"
  | "running"
  | "paused"
  | "completed"
  | "partial_failed"
  | "cancelled";
export interface Device {
  id: string;
  name: string;
  type: string;
  room: string;
  online: boolean;
  power: boolean;
  properties: Record<string, string | number>;
}
export interface Step {
  id: string;
  title: string;
  agentType: string;
  serviceName: string;
  targetDeviceId?: string;
  status: StepStatus;
  requiresConfirmation: boolean;
  scheduledTime: number;
  parameters: Record<string, string | number>;
  result: string;
  errorMessage: string;
}
export interface Config {
  film: number;
  cart: number[];
  target: string;
  play: boolean;
  temp: number;
  light: number;
  water: number;
  ac: boolean;
  lights: boolean;
  ambient: boolean;
  shopping: boolean;
  video: boolean;
  eta: number;
  dinner: number;
  soup: boolean;
  budget: number;
  city: string;
  destination: string;
  date: string;
  hotel: number;
  transport: number;
  route: number;
  reminder: string;
}
export interface Task {
  id: string;
  title: string;
  originalUserRequest: string;
  scenarioType: Scenario;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  steps: Step[];
  selectedDevices: string[];
  selectedServices: string[];
  executionResults: string[];
  conversationId: string;
  stage: number;
  config: Config;
  messages: { role: "user" | "ai"; text: string }[];
  clock: number;
  ordered: boolean;
}
export interface State {
  devices: Device[];
  tasks: Task[];
  services: boolean[];
  nickname: string;
  preference: string;
  current: string | null;
}
export const scenarios = [
  {
    id: "movie" as Scenario,
    title: "科幻电影之夜",
    sub: "把客厅，交给宇宙",
    desc: "找电影 · 挑周边 · 观影模式",
    request: "今晚想看一部科幻电影，顺便买点电影周边，把客厅布置成观影模式。",
    emoji: "🪐",
  },
  {
    id: "home" as Scenario,
    title: "下班归家",
    sub: "家，比你先准备好",
    desc: "空调 · 热水 · 清淡晚餐",
    request:
      "我大概30分钟后到家，提前把空调打开、洗澡水烧好，顺便推荐点清淡的晚餐。",
    emoji: "🏡",
  },
  {
    id: "travel" as Scenario,
    title: "周末轻旅行",
    sub: "去收集一点新风景",
    desc: "交通 · 酒店 · 两日路线",
    request: "周末想去杭州玩两天，预算1500元，帮我安排交通、酒店和游玩路线。",
    emoji: "🏞️",
  },
  {
    id: "work" as Scenario,
    title: "跨端接续办公",
    sub: "灵感，不必按暂停",
    desc: "文档接续 · 待办 · 提醒",
    request:
      "把手机上正在看的文档同步到电脑，整理一下待办，晚上8点提醒我继续处理。",
    emoji: "💻",
  },
];
export const films = [
  {
    name: "星际穿越",
    time: 169,
    desc: "穿越星河，寻找人类的下一站",
    en: "INTERSTELLAR",
  },
  {
    name: "流浪地球2",
    time: 173,
    desc: "带着地球，奔赴新的太阳",
    en: "THE WANDERING EARTH",
  },
  { name: "沙丘", time: 155, desc: "沙海之上，命运正在苏醒", en: "DUNE" },
];
export const goods = [
  { name: "科幻主题宇航员模型", price: 129, emoji: "🧑‍🚀" },
  { name: "宇宙星空氛围灯", price: 89, emoji: "🔮" },
  { name: "科幻电影主题海报", price: 39, emoji: "🌌" },
];
export const dinners = [
  { name: "鸡肉蔬菜沙拉", price: 35, emoji: "🥗" },
  { name: "菌菇鸡汤套餐", price: 42, emoji: "🍲" },
  { name: "清蒸鱼轻食套餐", price: 48, emoji: "🐟" },
];
export const agents = [
  {
    name: "影音娱乐",
    app: "星幕视频",
    desc: "影视搜索、内容推荐与跨屏播放",
    device: "电视 / 手机",
    command: scenarios[0].request,
  },
  {
    name: "购物生活",
    app: "优选商城",
    desc: "商品对比、购物清单与订单确认",
    device: "手机",
    command: "找一些电影周边",
  },
  {
    name: "智慧家居",
    app: "OneFlow智家",
    desc: "温度、灯光与全屋场景联动",
    device: "空调 / 热水器 / 灯光",
    command: scenarios[1].request,
  },
  {
    name: "出行服务",
    app: "OneFlow地图",
    desc: "路线规划、导航与车机接续",
    device: "手机 / 智能汽车",
    command: scenarios[2].request,
  },
  {
    name: "日程办公",
    app: "OneFlow日历",
    desc: "文档接续、待办与日程提醒",
    device: "手机 / 电脑",
    command: scenarios[3].request,
  },
  {
    name: "服务发现",
    app: "悦享外卖",
    desc: "发现适合你的服务与清淡晚餐",
    device: "手机",
    command: "推荐晚饭，准备回家",
  },
];
export const todos = [
  "完善用户旅程与核心场景",
  "补充跨端异常处理方案",
  "准备周五产品评审材料",
];
export const time = (v: number) =>
  `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
export const statusLabel: Record<string, string> = {
  draft: "规划中",
  pending_confirmation: "待确认",
  running: "进行中",
  paused: "已暂停",
  completed: "已完成",
  partial_failed: "部分失败",
  cancelled: "已取消",
  pending: "待执行",
  waiting_confirmation: "待确认",
  failed: "执行失败",
};
export function createTask(kind: Scenario, request: string): Task {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: scenarios.find((s) => s.id === kind)!.title,
    originalUserRequest: request,
    scenarioType: kind,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    steps: [],
    selectedDevices: [],
    selectedServices: [],
    executionResults: [],
    conversationId: uid(),
    stage: 0,
    clock: 1090,
    ordered: false,
    config: {
      film: 0,
      cart: [0, 0, 0],
      target: "tv",
      play: false,
      temp: 26,
      light: 30,
      water: 45,
      ac: true,
      lights: true,
      ambient: true,
      shopping: true,
      video: true,
      eta: 1120,
      dinner: -1,
      soup: false,
      budget: 1500,
      city: "上海",
      destination: "杭州",
      date: "2026-09-26",
      hotel: 0,
      transport: 0,
      route: 0,
      reminder: "20:00",
    },
    messages: [
      { role: "user", text: request },
      {
        role: "ai",
        text:
          kind === "movie"
            ? "当然。一起挑一部好电影，再把客厅变成你的私人影院。所有设备操作都会等你确认。"
            : kind === "home"
              ? "辛苦啦！我来安排客厅环境和洗澡热水，再陪你挑一份清淡的晚餐。"
              : kind === "travel"
                ? "给周末留一点自由。这里是一份可以随时调整的两日旅行方案。"
                : "把工作接着做。文档、待办和提醒会一起同步到你的电脑。",
      },
    ],
  };
}
export function plan(t: Task): Step[] {
  const c = t.config;
  const items: [
    string,
    string,
    number,
    number,
    Record<string, string | number>,
  ][] =
    t.scenarioType === "movie"
      ? [
          ...(c.video
            ? [
                [
                  "打开影片详情",
                  "" + c.target,
                  0,
                  1090,
                  {
                    content: films[c.film].name,
                    mode: c.play ? "正在播放" : "影片详情",
                  },
                ] as [
                  string,
                  string,
                  number,
                  number,
                  Record<string, string | number>,
                ],
              ]
            : []),
          ...(c.lights
            ? [
                [
                  "调整客厅灯光",
                  "light",
                  2,
                  1090,
                  { brightness: c.light, mode: "暖光" },
                ] as [
                  string,
                  string,
                  number,
                  number,
                  Record<string, string | number>,
                ],
              ]
            : []),
          ...(c.ac
            ? [
                ["设置客厅空调", "ac", 2, 1090, { temperature: c.temp }] as [
                  string,
                  string,
                  number,
                  number,
                  Record<string, string | number>,
                ],
              ]
            : []),
          ...(c.ambient
            ? [
                ["开启星空氛围灯", "ambient", 2, 1090, { mode: "星空" }] as [
                  string,
                  string,
                  number,
                  number,
                  Record<string, string | number>,
                ],
              ]
            : []),
          ...(c.shopping
            ? [
                [
                  "整理购物清单",
                  "",
                  1,
                  1090,
                  { count: c.cart.reduce((a, b) => a + b, 0) },
                ] as [
                  string,
                  string,
                  number,
                  number,
                  Record<string, string | number>,
                ],
              ]
            : []),
        ]
      : t.scenarioType === "home"
        ? [
            [
              "同步归家路线",
              "car",
              3,
              1090,
              { destination: "家", eta: time(c.eta) },
            ],
            ["预热洗澡热水", "water", 2, c.eta - 25, { temperature: c.water }],
            ...(c.ac
              ? [
                  [
                    "开启客厅空调",
                    "ac",
                    2,
                    c.eta - 20,
                    { temperature: c.temp },
                  ] as [
                    string,
                    string,
                    number,
                    number,
                    Record<string, string | number>,
                  ],
                ]
              : []),
            ...(c.lights
              ? [
                  [
                    "开启客厅暖光",
                    "light",
                    2,
                    c.eta - 5,
                    { brightness: c.light, mode: "暖光" },
                  ] as [
                    string,
                    string,
                    number,
                    number,
                    Record<string, string | number>,
                  ],
                ]
              : []),
            ...(c.dinner >= 0
              ? [
                  [
                    "准备晚餐订单",
                    "",
                    5,
                    1090,
                    { dinner: dinners[c.dinner].name },
                  ] as [
                    string,
                    string,
                    number,
                    number,
                    Record<string, string | number>,
                  ],
                ]
              : []),
          ]
        : t.scenarioType === "travel"
          ? [
              ["保存两日行程", "", 3, 1090, { destination: c.destination }],
              ["添加至日历", "", 4, 1090, { date: c.date }],
              [
                "接续车机导航",
                "car",
                3,
                1090,
                { destination: c.destination, eta: "约 2 小时 30 分钟" },
              ],
            ]
          : [
              ["接续手机文档", "pc", 4, 1090, { document: "产品方案 V1.0" }],
              ["整理三项待办", "", 4, 1090, { count: 3 }],
              ["创建本地提醒", "", 4, 1090, { reminder: c.reminder }],
            ];
  return items.map(([title, device, a, scheduledTime, parameters], i) => ({
    id: `${t.id}-${device || title}`,
    title,
    agentType: agents[a].name + "Agent",
    serviceName: agents[a].app,
    targetDeviceId: device || undefined,
    status: "pending",
    requiresConfirmation: true,
    scheduledTime,
    parameters,
    result: "",
    errorMessage: "",
  }));
}
export function initialState(): State {
  const specs = [
    ["phone", "当前手机", "手机", "随身"],
    ["pc", "个人电脑", "电脑", "书房"],
    ["tv", "客厅电视", "电视", "客厅"],
    ["car", "智能汽车", "汽车", "车库"],
    ["ac", "客厅空调", "空调", "客厅"],
    ["water", "智能热水器", "热水器", "浴室"],
    ["light", "客厅灯光", "灯光", "客厅"],
    ["floor", "智能地暖", "地暖", "客厅"],
    ["ambient", "背景氛围灯", "灯光", "客厅"],
    ["bedtv", "卧室电视", "电视", "卧室"],
  ];
  const history = ["work", "travel"].map((k) => {
    const t = createTask(k as Scenario, "上一次的生活安排");
    t.status = "completed";
    t.stage = 6;
    t.steps = plan(t).map((s) => ({
      ...s,
      status: "completed",
      result: "历史演示记录 · 已完成",
    }));
    t.createdAt = "2026-09-23T10:00:00.000Z";
    return t;
  });
  return {
    devices: specs.map(([id, name, type, room]) => ({
      id,
      name,
      type,
      room,
      online: id !== "bedtv",
      power: ["phone", "pc", "car", "light"].includes(id),
      properties: {
        temperature: id === "water" ? 40 : 27,
        brightness: 80,
        mode: "自动",
        content: "",
        document: "",
        destination: "尚未设置",
      },
    })),
    tasks: history,
    services: [true, true, true, true, true, true],
    nickname: "小万",
    preference: "科幻电影 · 清淡饮食",
    current: null,
  };
}
export function runStep(state: State, taskId: string, stepId: string): State {
  const next = structuredClone(state),
    t = next.tasks.find((t) => t.id === taskId)!;
  if (!t || t.status !== "running") return state;
  const s = t.steps.find((s) => s.id === stepId)!;
  if (!s || !["pending", "running", "failed"].includes(s.status)) return state;
  if (t.scenarioType === "home" && s.scheduledTime > t.clock) return state;
  const device = next.devices.find((d) => d.id === s.targetDeviceId);
  if (device && !device.online) {
    s.status = "failed";
    s.errorMessage = `${device.name}连接失败，设备当前离线`;
    s.result = "";
  } else if (!next.services[agents.findIndex((a) => a.app === s.serviceName)]) {
    s.status = "failed";
    s.errorMessage = `${s.serviceName}尚未连接，请先授权`;
  } else {
    s.status = "completed";
    s.errorMessage = "";
    if (device) {
      device.power = true;
      Object.assign(device.properties, s.parameters);
      s.result = `${device.name}：${Object.entries(s.parameters)
        .map(([k, v]) =>
          k === "temperature" ? `${v}℃` : k === "brightness" ? `亮度 ${v}%` : v,
        )
        .join(" · ")}`;
    } else {
      s.result =
        s.title === "准备晚餐订单"
          ? `${s.parameters.dinner} · 待确认，尚未下单`
          : s.title === "整理购物清单"
            ? `${s.parameters.count} 件商品已加入清单，尚未下单`
            : s.title === "创建本地提醒"
              ? `${s.parameters.reminder} 本地演示提醒已保存`
              : s.title === "整理三项待办"
                ? "已整理 3 项待办，可在电脑查看"
                : `${s.title}：${Object.values(s.parameters).join(" · ")}（演示）`;
    }
  }
  t.executionResults = t.steps
    .filter((s) => s.status === "completed")
    .map((s) => s.result);
  if (
    t.steps.every((s) =>
      ["completed", "failed", "cancelled"].includes(s.status),
    ) &&
    (t.scenarioType !== "home" || t.clock >= t.config.eta)
  )
    t.status = t.steps.some((s) => s.status === "failed")
      ? "partial_failed"
      : "completed";
  t.updatedAt = new Date().toISOString();
  return next;
}
