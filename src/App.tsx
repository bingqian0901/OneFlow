import TaskSummary, { travelCost } from "./components/TaskSummary";
import SceneArt from "./components/SceneArt";
import DevicePreview from "./components/DevicePreview";
import { useEffect, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  AudioLines,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Home,
  MessageCircle,
  Layers,
  Grid2X2,
  User,
  Monitor,
  Smartphone,
  Tv,
  Car,
  Wind,
  Droplets,
  Lightbulb,
  Power,
  Plus,
  Minus,
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Link,
  Settings,
  Clock,
  MapPin,
  ShoppingBag,
  Film,
  Calendar,
  Volume2,
  Wifi,
  MoreHorizontal,
  CheckCircle2,
} from "lucide-react";
import {
  agents,
  createTask,
  dinners,
  films,
  goods,
  initialState,
  plan,
  runStep,
  scenarios,
  statusLabel,
  time,
  todos,
  uid,
  type Config,
  type Device,
  type Scenario,
  type State,
  type Task,
} from "./model";
const KEY = "oneflow-demo-v1";
const iconFor = (type: string) =>
  type === "电视"
    ? Tv
    : type === "电脑"
      ? Monitor
      : type === "汽车"
        ? Car
        : type === "空调"
          ? Wind
          : type === "热水器"
            ? Droplets
            : type === "手机"
              ? Smartphone
              : Lightbulb;
const read = (): State => {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : initialState();
  } catch {
    return initialState();
  }
};
export default function App() {
  const [state, setState] = useState<State>(read),
    [page, setPage] = useState("首页"),
    [input, setInput] = useState(""),
    [preview, setPreview] = useState("家居"),
    [modal, setModal] = useState<string | null>(null),
    [service, setService] = useState(0),
    [filter, setFilter] = useState("进行中"),
    [toast, setToast] = useState(""),
    [menu, setMenu] = useState(false),
    [pending, setPending] = useState<{
      id: string;
      config: Config;
      reason: string;
    } | null>(null),
    [fallback, setFallback] = useState("");
  const task = state.tasks.find((t) => t.id === state.current);
  const notify = (s: string) => setToast(s);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page, state.current]);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);
  useEffect(() => {
    if (toast) {
      const h = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(h);
    }
  }, [toast]);
  useEffect(() => {
    const t = state.tasks.find(
      (t) =>
        t.status === "running" &&
        t.steps.some(
          (s) =>
            ["pending", "running"].includes(s.status) &&
            (t.scenarioType !== "home" || s.scheduledTime <= t.clock),
        ),
    );
    if (!t) return;
    const s = t.steps.find(
      (s) =>
        ["pending", "running"].includes(s.status) &&
        (t.scenarioType !== "home" || s.scheduledTime <= t.clock),
    )!;
    const timer = setTimeout(
      () => {
        if (s.status === "running") setState((old) => runStep(old, t.id, s.id));
        else
          updateTask(t.id, (current) => {
            if (current.status === "running")
              current.steps.find((step) => step.id === s.id)!.status =
                "running";
          });
      },
      s.status === "running" ? 650 : 120,
    );
    return () => clearTimeout(timer);
  }, [state]);
  const updateTask = (id: string, fn: (t: Task) => void) =>
    setState((old) => {
      const next = structuredClone(old);
      const t = next.tasks.find((t) => t.id === id);
      if (t) {
        fn(t);
        t.updatedAt = new Date().toISOString();
      }
      return next;
    });
  const cfg = (patch: Partial<Config>) => {
    if (task)
      updateTask(task.id, (t) => {
        t.config = { ...t.config, ...patch };
      });
  };
  const deviceUpdate = (
    id: string,
    patch: Partial<Device>,
    props?: Device["properties"],
  ) =>
    setState((old) => ({
      ...old,
      devices: old.devices.map((d) =>
        d.id === id
          ? { ...d, ...patch, properties: { ...d.properties, ...props } }
          : d,
      ),
    }));
  const begin = (kind: Scenario, request?: string) => {
    const t = createTask(
      kind,
      request || scenarios.find((s) => s.id === kind)!.request,
    );
    setState((old) => ({ ...old, tasks: [t, ...old.tasks], current: t.id }));
    setPage("AI对话");
    setInput("");
    setFallback("");
  };
  const openTask = (t: Task) => {
    setState((s) => ({ ...s, current: t.id }));
    setPage("AI对话");
  };
  const advance = (stage: number) => {
    if (task)
      updateTask(task.id, (t) => {
        t.stage = stage;
        t.status = stage === 5 ? "pending_confirmation" : "draft";
      });
  };
  const alter = (c: Config, reason: string) => {
    if (!task) return;
    if (
      ["running", "paused", "completed", "partial_failed"].includes(task.status)
    ) {
      setPending({ id: task.id, config: c, reason });
    } else {
      cfg(c);
      updateTask(task.id, (t) =>
        t.messages.push({ role: "ai", text: reason + "，已更新当前方案。" }),
      );
    }
  };
  const acceptChange = () => {
    if (!pending) return;
    updateTask(pending.id, (t) => {
      const previous = t.config;
      t.config = pending.config;
      const fresh = plan(t);
      t.steps = t.steps.map((s) => {
        const replacement = fresh.find((n) => n.id === s.id);
        if (!replacement)
          return s.status === "completed" ? s : { ...s, status: "cancelled" };
        if (s.status === "completed") {
          if (s.targetDeviceId === "ac" && previous.temp !== t.config.temp)
            return s;
          return s;
        }
        return {
          ...replacement,
          status: s.status,
          errorMessage: s.errorMessage,
        };
      });
      if (
        previous.temp !== t.config.temp &&
        t.steps.some(
          (s) => s.targetDeviceId === "ac" && s.status === "completed",
        )
      ) {
        const base = fresh.find((s) => s.targetDeviceId === "ac");
        if (base)
          t.steps.push({
            ...base,
            id: uid(),
            title: "再次调整空调温度",
            scheduledTime: t.clock,
          });
      }
      if (previous.reminder !== t.config.reminder && t.scenarioType === "work")
        t.steps.push({
          ...fresh[2],
          id: uid(),
          title: "更新本地提醒",
        });
      t.status = t.status === "paused" ? "paused" : "running";
      t.messages.push({
        role: "ai",
        text: pending.reason + "。新计划已确认，已完成的设备操作保持不变。",
      });
    });
    setPending(null);
  };
  const control = (action: "pause" | "resume" | "cancel") => {
    if (!task) return;
    if (action === "pause" && task.status !== "running") {
      notify("任务还未开始执行，无需暂停");
      return;
    }
    if (action === "resume" && task.status !== "paused") return;
    updateTask(task.id, (t) => {
      if (action === "cancel") {
        t.steps.forEach((s) => {
          if (s.status !== "completed") s.status = "cancelled";
        });
        t.status = "cancelled";
        t.stage = 6;
      } else t.status = action === "pause" ? "paused" : "running";
    });
  };
  function send(text = input) {
    if (!text.trim()) return;
    setInput("");
    if (task) {
      updateTask(task.id, (t) => t.messages.push({ role: "user", text }));
      const c = { ...task.config };
      const n = text.match(/(\d+)\s*[度℃]/);
      if (n && /空调|温度/.test(text)) {
        c.temp = Math.max(16, Math.min(30, Number(n[1])));
        alter(c, `空调目标温度改为 ${c.temp}℃`);
        return;
      }
      if (
        /晚.*(分钟|到家|到)|堵车|提前/.test(text) &&
        task.scenarioType === "home"
      ) {
        const minutes = Number(text.match(/(\d+)\s*分钟/)?.[1] || 20);
        c.eta = Math.min(
          1439,
          Math.max(
            task.clock + 1,
            c.eta + (/提前/.test(text) ? -minutes : minutes),
          ),
        );
        alter(c, `预计到家改为 ${time(c.eta)}，重新安排尚未执行的步骤`);
        return;
      }
      if (/汤|不要辣|清淡/.test(text) && task.scenarioType === "home") {
        c.soup = true;
        c.dinner = 1;
        alter(c, "晚餐改为不辣的菌菇鸡汤，其他计划保持不变");
        return;
      }
      if (
        /第二部|第一部|第三部|星际穿越|流浪地球|沙丘/.test(text) &&
        task.scenarioType === "movie" &&
        ["draft", "pending_confirmation"].includes(task.status)
      ) {
        c.film = /第二|流浪/.test(text) ? 1 : /第三|沙丘/.test(text) ? 2 : 0;
        cfg(c);
        advance(c.shopping ? 2 : 3);
        return;
      }
      if (
        /不.*(买|周边)|取消周边/.test(text) &&
        task.scenarioType === "movie"
      ) {
        if (
          task.steps.some(
            (s) => s.title === "整理购物清单" && s.status === "completed",
          )
        ) {
          updateTask(task.id, (t) =>
            t.messages.push({
              role: "ai",
              text: t.ordered
                ? "演示订单已经创建，取消任务不会撤销已有订单。订单记录会继续保留。"
                : "购物清单已经整理完成，没有下单或付款。你可以不确认订单，已完成的清单记录会保留。",
            }),
          );
          return;
        }
        c.shopping = false;
        c.cart = [0, 0, 0];
        alter(c, "已取消尚未执行的周边购物步骤");
        return;
      }
      if (/暂停/.test(text)) {
        control("pause");
        return;
      }
      if (/继续|恢复/.test(text) && task.status === "paused") {
        control("resume");
        return;
      }
      if (/取消/.test(text)) {
        control("cancel");
        return;
      }
      if (/提醒/.test(text) && task.scenarioType === "work") {
        c.reminder = text.match(/\d{1,2}:\d{2}/)?.[0] || "21:00";
        alter(c, `提醒改为 ${c.reminder}`);
        return;
      }
    }
    const kind: Scenario | undefined = /电影|科幻|周边|电视|投屏|观影/.test(
      text,
    )
      ? "movie"
      : /回家|到家|空调|热水|洗澡|灯光|晚饭|晚餐/.test(text)
        ? "home"
        : /旅行|旅游|酒店|交通|路线|预算/.test(text)
          ? "travel"
          : /文档|电脑|同步|提醒|待办/.test(text)
            ? "work"
            : undefined;
    if (kind) {
      begin(kind, text);
    } else {
      setPage("AI对话");
      setFallback(
        `收到「${text}」。当前演示支持电影之夜、下班归家、周末旅行和跨端办公，试试下方的场景吧。`,
      );
    }
  }
  const execute = () => {
    if (!task || !["draft", "pending_confirmation"].includes(task.status))
      return;
    const steps = plan(task);
    const missing = steps
      .map((s) => agents.findIndex((a) => a.app === s.serviceName))
      .find((i) => !state.services[i]);
    if (missing !== undefined) {
      setService(missing);
      setModal("auth");
      return;
    }
    updateTask(task.id, (t) => {
      if (!["draft", "pending_confirmation"].includes(t.status)) return;
      t.steps = steps;
      t.selectedDevices = steps.flatMap((s) =>
        s.targetDeviceId ? [s.targetDeviceId] : [],
      );
      t.selectedServices = [...new Set(steps.map((s) => s.serviceName))];
      t.status = steps.length ? "running" : "completed";
      t.stage = 6;
    });
    setPreview(
      task.scenarioType === "movie"
        ? task.config.target === "phone"
          ? "手机"
          : "电视"
        : task.scenarioType === "work"
          ? "电脑"
          : task.scenarioType === "travel"
            ? "汽车"
            : "家居",
    );
  };
  const nextTime = () => {
    if (!task) return;
    updateTask(task.id, (t) => {
      const next = t.steps
        .filter((s) => s.status === "pending" && s.scheduledTime > t.clock)
        .map((s) => s.scheduledTime);
      t.clock = Math.min(...next, t.config.eta);
      if (
        t.steps.every((s) =>
          ["completed", "failed", "cancelled"].includes(s.status),
        )
      )
        t.status = t.steps.some((s) => s.status === "failed")
          ? "partial_failed"
          : "completed";
    });
  };
  const retry = (id: string) => {
    if (task)
      updateTask(task.id, (t) => {
        t.steps.find((s) => s.id === id)!.status = "pending";
        t.status = "running";
      });
  };
  const online = state.devices.filter((d) => d.online).length;
  const composer = (hero = false) => (
    <form
      className={hero ? "composer hero-input" : "composer"}
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <input
        aria-label="告诉 OneFlow 你的需求"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={hero ? "一句话，安排你的生活…" : "继续说说你的想法…"}
      />
      <button
        type="button"
        className="icon-btn"
        aria-label="模拟语音输入"
        onClick={() => setModal("voice")}
      >
        <AudioLines size={20} />
      </button>
      <button className="send" aria-label="发送">
        <ArrowUp size={20} />
      </button>
    </form>
  );
  const deviceCards = (all = false) => (
    <div className="device-grid">
      {state.devices
        .filter((d) => all || ["tv", "ac", "water", "light"].includes(d.id))
        .map((d) => {
          const I = iconFor(d.type);
          return (
            <button
              className="device-card"
              key={d.id}
              onClick={() => setModal(d.id)}
            >
              <span className={"device-icon " + (d.power ? "on" : "")}>
                <I size={23} />
              </span>
              <span className={"dot " + (!d.online ? "offline" : "")} />
              <b>{d.name}</b>
              <small>
                {!d.online
                  ? "离线"
                  : d.id === "ac" || d.id === "water"
                    ? `${d.properties.temperature}℃ · ${d.power ? "已开启" : "待机"}`
                    : d.id === "light"
                      ? `亮度 ${d.properties.brightness}%`
                      : d.power
                        ? "已开启"
                        : "待机"}
              </small>
            </button>
          );
        })}
    </div>
  );
  const title = (small: string, big: string) => (
    <div className="section-title">
      <div>
        <span className="eyebrow">{small}</span>
        <h2>{big}</h2>
      </div>
    </div>
  );
  const summary = (t: Task) => <TaskSummary task={t} devices={state.devices} />;
  const slider = (
    label: string,
    key: "temp" | "water" | "light",
    min: number,
    max: number,
    unit: string,
  ) => (
    <label className="slider-label">
      <span>
        {label}
        <b>
          {task!.config[key]}
          {unit}
        </b>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        value={task!.config[key]}
        onChange={(e) => cfg({ [key]: Number(e.target.value) })}
      />
    </label>
  );
  const environment = () => (
    <>
      <label className="check-row">
        <input
          type="checkbox"
          checked={task!.config.ac}
          onChange={(e) => cfg({ ac: e.target.checked })}
        />
        调整客厅空调
      </label>
      {slider("目标温度", "temp", 16, 30, "℃")}
      <label className="check-row">
        <input
          type="checkbox"
          checked={task!.config.lights}
          onChange={(e) => cfg({ lights: e.target.checked })}
        />
        调整客厅暖光
      </label>
      {slider("灯光亮度", "light", 1, 100, "%")}
      {task!.scenarioType === "movie" ? (
        <>
          <label className="check-row">
            <input
              type="checkbox"
              checked={task!.config.ambient}
              onChange={(e) => cfg({ ambient: e.target.checked })}
            />
            背景氛围灯 · 星空模式
          </label>
          <p className="muted">客厅窗帘未连接 · 暂不可控，将跳过</p>
        </>
      ) : (
        slider("热水目标温度", "water", 35, 60, "℃")
      )}
    </>
  );
  const timeline = (t: Task) => (
    <div className="timeline">
      {t.steps.map((s) => (
        <div className={"step " + s.status} key={s.id}>
          <span className="step-mark">
            {s.status === "completed" ? (
              <Check size={13} />
            ) : s.status === "failed" ? (
              <X size={13} />
            ) : (
              <Clock size={12} />
            )}
          </span>
          <div className="step-body">
            <div className="row">
              <b>{s.title}</b>
              <span className={"badge " + s.status}>
                {statusLabel[s.status]}
              </span>
            </div>
            <small>
              {t.scenarioType === "home" ? time(s.scheduledTime) + " · " : ""}
              {s.agentType} · {s.serviceName}
            </small>
            <p>
              {s.result ||
                s.errorMessage ||
                (s.status === "cancelled"
                  ? "未执行，已取消"
                  : s.targetDeviceId
                    ? state.devices.find((d) => d.id === s.targetDeviceId)?.name
                    : "等待服务执行")}
            </p>
            {s.status === "failed" && (
              <div className="actions">
                <button onClick={() => retry(s.id)}>重试</button>
                <button
                  onClick={() =>
                    updateTask(t.id, (q) => {
                      q.steps.find((n) => n.id === s.id)!.status = "cancelled";
                      if (
                        q.steps.every((n) =>
                          ["completed", "cancelled", "failed"].includes(
                            n.status,
                          ),
                        )
                      )
                        q.status = q.steps.some((n) => n.status === "failed")
                          ? "partial_failed"
                          : "completed";
                    })
                  }
                >
                  跳过此步骤
                </button>
                <button
                  onClick={() =>
                    s.targetDeviceId
                      ? setModal(s.targetDeviceId)
                      : (setService(
                          agents.findIndex((a) => a.app === s.serviceName),
                        ),
                        setModal("auth"))
                  }
                >
                  {s.targetDeviceId ? "查看设备" : "连接服务"}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
  const flow = () => {
    if (!task) return null;
    const t = task,
      c = t.config;
    return (
      <div className="flow-card">
        <div className="row">
          <span className="eyebrow">ONEFLOW PLAN</span>
          <span className={"badge " + t.status}>{statusLabel[t.status]}</span>
        </div>
        <h3>
          {t.stage === 5
            ? "准备就绪，等你确认"
            : t.stage === 6
              ? t.status === "completed"
                ? "一切就绪，享受此刻"
                : t.status === "partial_failed"
                  ? "计划部分完成，请查看异常"
                  : t.status === "cancelled"
                    ? "计划已取消，已完成操作保留"
                    : t.status === "paused"
                      ? "计划已暂停，等待你的安排"
                      : "你的计划正在进行"
              : t.title}
        </h3>
        {t.stage === 0 && (
          <>
            <p className="muted">我会为你安排这些事，你始终拥有决定权。</p>
            {(t.scenarioType === "movie"
              ? [
                  "推荐科幻电影",
                  "查找电影周边",
                  "选择播放设备",
                  "设置客厅观影环境",
                ]
              : t.scenarioType === "home"
                ? ["确认归家时间", "安排空调、热水和灯光", "挑选清淡晚餐"]
                : t.scenarioType === "travel"
                  ? ["规划交通与酒店", "安排两日路线", "保存日历，接续导航"]
                  : ["检查电脑状态", "接续文档与三项待办", "设置晚间提醒"]
            ).map((s, i) => (
              <div className="plan-line" key={s}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {s}
                {t.scenarioType === "movie" && i === 1 && (
                  <input
                    aria-label="包含周边购物"
                    type="checkbox"
                    checked={c.shopping}
                    onChange={(e) => cfg({ shopping: e.target.checked })}
                  />
                )}
              </div>
            ))}
            <button className="primary full" onClick={() => advance(1)}>
              开始规划 <ArrowRight size={16} />
            </button>
          </>
        )}
        {t.stage > 0 && t.stage < 5 && t.scenarioType === "movie" && (
          <>
            <div className="mini-progress">
              {["选电影", "挑周边", "选设备", "调环境"].map((s, i) => (
                <button
                  key={s}
                  className={t.stage === i + 1 ? "active" : ""}
                  onClick={() => advance(i + 1)}
                >
                  {s}
                </button>
              ))}
            </div>
            {t.stage === 1 && (
              <div className="horizontal">
                {films.map((f, i) => (
                  <div
                    className={"film-card " + (c.film === i ? "chosen" : "")}
                    key={f.name}
                  >
                    <div className={"poster poster-" + i}>
                      <span>{f.en}</span>
                      <div className="planet" />
                      <b>{f.name}</b>
                      <small>探索，不止于想象</small>
                    </div>
                    <h4>{f.name}</h4>
                    <small>科幻 / 冒险 · {f.time} 分钟</small>
                    <p>{f.desc}</p>
                    <button
                      className="primary"
                      onClick={() => {
                        cfg({ film: i });
                        advance(c.shopping ? 2 : 3);
                      }}
                    >
                      选择这部
                    </button>
                  </div>
                ))}
              </div>
            )}
            {t.stage === 2 && (
              <>
                <p>《{films[c.film].name}》主题灵感周边</p>
                <div className="horizontal">
                  {goods.map((g, i) => (
                    <div className="product" key={g.name}>
                      <div className="product-art">{g.emoji}</div>
                      <h4>{g.name}</h4>
                      <b>¥{g.price}</b>
                      <div className="quantity">
                        <button
                          aria-label={"减少" + g.name}
                          onClick={() =>
                            cfg({
                              cart: c.cart.map((n, k) =>
                                i === k ? Math.max(0, n - 1) : n,
                              ),
                            })
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <span>{c.cart[i]}</span>
                        <button
                          aria-label={"加入清单" + g.name}
                          onClick={() =>
                            cfg({
                              shopping: true,
                              cart: c.cart.map((n, k) => (i === k ? n + 1 : n)),
                            })
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="actions">
                  <button
                    onClick={() => {
                      cfg({ shopping: false, cart: [0, 0, 0] });
                      advance(3);
                    }}
                  >
                    暂不购买
                  </button>
                  <button className="primary" onClick={() => advance(3)}>
                    加入本次购物清单
                  </button>
                </div>
              </>
            )}
            {t.stage === 3 && (
              <>
                <h4>想在哪个设备上观看？</h4>
                {["tv", "bedtv", "phone"].map((id) => {
                  const d = state.devices.find((d) => d.id === id)!;
                  return (
                    <button
                      key={id}
                      className={
                        "select-row " + (c.target === id ? "selected" : "")
                      }
                      disabled={!d.online}
                      onClick={() => cfg({ target: id })}
                    >
                      <Tv size={21} />
                      <span>
                        <b>{d.name}</b>
                        <small>
                          {d.online
                            ? id === "tv"
                              ? "在线 · 65 英寸 · 支持视频播放"
                              : "在线 · 随时观看"
                            : "离线 · 暂不可用"}
                        </small>
                      </span>
                      {c.target === id && <Check size={18} />}
                    </button>
                  );
                })}
                <label className="field">
                  播放动作
                  <select
                    value={c.play ? "play" : "detail"}
                    onChange={(e) => cfg({ play: e.target.value === "play" })}
                  >
                    <option value="detail">先打开影片详情页</option>
                    <option value="play">立即播放</option>
                  </select>
                </label>
                <div className="actions">
                  <button
                    onClick={() => {
                      cfg({ video: false });
                      advance(4);
                    }}
                  >
                    跳过播放
                  </button>
                  <button
                    className="primary"
                    onClick={() => {
                      cfg({ video: true });
                      advance(4);
                    }}
                  >
                    下一步
                  </button>
                </div>
              </>
            )}
            {t.stage === 4 && (
              <>
                {environment()}
                <button className="primary full" onClick={() => advance(5)}>
                  确认开启观影模式
                </button>
              </>
            )}
          </>
        )}
        {t.stage > 0 && t.stage < 5 && t.scenarioType === "home" && (
          <>
            <div className="time-banner">
              <Clock />
              <div>
                <small>模拟出发时间 18:10</small>
                <b>让家等你回家</b>
              </div>
              <span>{time(c.eta)}</span>
            </div>
            <label className="field">
              预计到家时间
              <input
                type="time"
                value={time(c.eta)}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  if (Number.isFinite(h))
                    cfg({ eta: Math.max(1091, h * 60 + m) });
                }}
              />
            </label>
            {environment()}
            <div className="connection-list">
              {["ac", "water", "light", "car"].map((id) => {
                const d = state.devices.find((d) => d.id === id)!;
                return (
                  <span key={id} className={!d.online ? "error" : ""}>
                    {d.name} · {d.online ? "在线" : "离线，执行时可重试或跳过"}
                  </span>
                );
              })}
            </div>
            <div className="row">
              <h4>今晚，清淡一点</h4>
              <button
                className="text-btn"
                onClick={() => cfg({ soup: !c.soup, dinner: -1 })}
              >
                更换推荐
              </button>
            </div>
            {dinners
              .filter((_, i) => !c.soup || i === 1)
              .map((d) => (
                <button
                  key={d.name}
                  className={
                    "select-row " +
                    (c.dinner === dinners.indexOf(d) ? "selected" : "")
                  }
                  onClick={() => cfg({ dinner: dinners.indexOf(d) })}
                >
                  <span className="food">{d.emoji}</span>
                  <span>
                    <b>{d.name}</b>
                    <small>
                      少油少盐 · {c.soup ? "不辣 · 热汤" : "清淡推荐"}
                    </small>
                  </span>
                  <b>¥{d.price}</b>
                </button>
              ))}
            <button className="text-btn" onClick={() => cfg({ dinner: -1 })}>
              暂不点餐 {c.dinner === -1 ? "✓" : ""}
            </button>
            <p className="muted">
              设备启动时间为演示安排。晚餐需单独确认订单。
            </p>
            <button className="primary full" onClick={() => advance(5)}>
              查看归家计划
            </button>
          </>
        )}
        {t.stage > 0 && t.stage < 5 && t.scenarioType === "travel" && (
          <>
            <div className="travel-art">
              杭州 <span>HANGZHOU · WEEKEND ESCAPE</span>
            </div>
            <div className="two-fields">
              <label className="field">
                出发城市
                <input
                  value={c.city}
                  onChange={(e) => cfg({ city: e.target.value })}
                />
              </label>
              <label className="field">
                目的地
                <input
                  value={c.destination}
                  onChange={(e) => cfg({ destination: e.target.value })}
                />
              </label>
              <label className="field">
                出发日期
                <input
                  type="date"
                  value={c.date}
                  onChange={(e) => cfg({ date: e.target.value })}
                />
              </label>
              <label className="field">
                预算（元）
                <input
                  type="number"
                  min="0"
                  value={c.budget}
                  onChange={(e) => cfg({ budget: Number(e.target.value) })}
                />
              </label>
            </div>
            <label className="field">
              交通方案
              <select
                value={c.transport}
                onChange={(e) => cfg({ transport: Number(e.target.value) })}
              >
                <option value={0}>高铁往返 · ¥146</option>
                <option value={1}>自驾油费 · ¥260</option>
              </select>
            </label>
            <label className="field">
              酒店推荐
              <select
                value={c.hotel}
                onChange={(e) => cfg({ hotel: Number(e.target.value) })}
              >
                <option value={0}>城市轻居酒店 · ¥398</option>
                <option value={1}>湖畔精品酒店 · ¥680</option>
              </select>
            </label>
            <label className="field">
              两日路线
              <select
                value={c.route}
                onChange={(e) => cfg({ route: Number(e.target.value) })}
              >
                <option value={0}>西湖 → 河坊街</option>
                <option value={1}>灵隐寺 → 龙井村</option>
              </select>
            </label>
            <p>
              交通 + 酒店 + 餐饮游玩 ¥280 = <b>¥{travelCost(c)}</b>
            </p>
            {travelCost(c) > c.budget && (
              <p className="error">
                预计超出预算 ¥{travelCost(c) - c.budget}，可以调整酒店或预算。
              </p>
            )}
            <button className="primary full" onClick={() => advance(5)}>
              确认行程并添加至日历
            </button>
          </>
        )}
        {t.stage > 0 && t.stage < 5 && t.scenarioType === "work" && (
          <>
            <div className="document">
              <span>ONEFLOW DOCS</span>
              <h3>产品方案 V1.0</h3>
              <p>多端智慧生活 · 产品评审草案</p>
              {todos.map((s, i) => (
                <p key={s}>
                  0{i + 1}　{s}
                </p>
              ))}
            </div>
            <p className="muted">同步阅读位置、文档和待办上下文到个人电脑。</p>
            <label className="field">
              继续处理的提醒时间
              <input
                type="time"
                value={c.reminder}
                onChange={(e) => cfg({ reminder: e.target.value })}
              />
            </label>
            <button className="primary full" onClick={() => advance(5)}>
              查看接续计划
            </button>
          </>
        )}
        {t.stage === 5 && (
          <>
            {summary(t)}
            <div className="notice">
              <CheckCheck size={17} />
              <span>
                仅执行你确认的设备与服务动作。商品和晚餐不会自动下单或付款。
              </span>
            </div>
            <div className="actions">
              <button onClick={() => advance(1)}>修改方案</button>
              <button className="primary" onClick={execute}>
                {t.scenarioType === "home" ? "确认归家计划" : "确认执行"}
              </button>
            </div>
          </>
        )}
        {t.stage === 6 && (
          <>
            {t.scenarioType === "home" && (
              <div className="time-banner">
                <Clock />
                <div>
                  <small>当前模拟时间</small>
                  <b>
                    {time(t.clock)} <small>预计 {time(c.eta)} 到家</small>
                  </b>
                </div>
                {t.status === "running" && (
                  <button
                    onClick={nextTime}
                    disabled={t.steps.some(
                      (s) =>
                        ["pending", "running"].includes(s.status) &&
                        s.scheduledTime <= t.clock,
                    )}
                  >
                    推进模拟时间
                  </button>
                )}
              </div>
            )}
            <div className="progress">
              <span
                style={{
                  width: `${t.steps.length ? (t.steps.filter((s) => s.status === "completed").length / t.steps.length) * 100 : 100}%`,
                }}
              />
            </div>
            {timeline(t)}
            {["running", "paused"].includes(t.status) && (
              <div className="actions">
                <button
                  onClick={() =>
                    control(t.status === "paused" ? "resume" : "pause")
                  }
                >
                  {t.status === "paused" ? "恢复执行" : "暂停未执行步骤"}
                </button>
                <button onClick={() => control("cancel")}>取消剩余步骤</button>
                <button onClick={() => setModal("edit")}>修改计划</button>
              </div>
            )}
            {["completed", "partial_failed"].includes(t.status) && (
              <div className="result">
                <CheckCircle2 />
                <h4>
                  {t.status === "completed"
                    ? `${t.title}准备完成！`
                    : "部分准备完成，仍有步骤需要处理"}
                </h4>
                <p>
                  {t.scenarioType === "movie"
                    ? `${c.shopping ? c.cart.reduce((a, b) => a + b, 0) : 0} 件商品已加入清单，尚未下单。`
                    : t.scenarioType === "home"
                      ? `预计 ${time(c.eta)} 到家。已执行动作见上方记录；晚餐仍需单独确认。`
                      : "你的安排已保存到本地演示任务。"}
                </p>
              </div>
            )}
            <div className="actions">
              <button
                onClick={() => {
                  setPreview(
                    t.scenarioType === "movie"
                      ? t.config.target === "phone"
                        ? "手机"
                        : "电视"
                      : t.scenarioType === "work"
                        ? "电脑"
                        : t.scenarioType === "travel"
                          ? "汽车"
                          : "家居",
                  );
                  setModal("preview");
                }}
              >
                {t.scenarioType === "movie"
                  ? t.config.target === "phone"
                    ? "查看手机"
                    : "查看电视"
                  : "查看设备"}
              </button>
              {["movie", "home"].includes(t.scenarioType) && (
                <button onClick={() => setModal("cart")}>
                  {t.scenarioType === "movie" ? "查看购物清单" : "查看晚餐"}
                </button>
              )}
              <button
                onClick={() =>
                  setModal(t.scenarioType === "movie" ? "ac" : "edit")
                }
              >
                调整方案
              </button>
              <button onClick={() => begin(t.scenarioType)}>再次使用</button>
            </div>
            <p className="muted">已完成操作不会因暂停或取消而撤销。</p>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("首页");
          }}
        >
          <span className="brand-mark">✳</span>
          <span>
            OneFlow<small>万象 · 智慧生活</small>
          </span>
        </a>
        <div className="workspace-label">你的生活，由此连接</div>
        <nav>
          {[
            [Home, "首页"],
            [MessageCircle, "AI对话"],
            [Layers, "任务"],
            [Grid2X2, "服务"],
            [User, "我的"],
          ].map(([I, name]) => {
            const Icon = I as typeof Home;
            return (
              <button
                key={name as string}
                className={page === name ? "active" : ""}
                onClick={() => setPage(name as string)}
              >
                <Icon size={20} />
                <span>{name as string}</span>
                {name === "AI对话" && <span className="nav-ai">AI</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="connected-note">
            <span className="connection-glyph">
              <Link size={20} />
            </span>
            <b>让生活，自然相连</b>
            <p>{online} 台设备已准备就绪</p>
            <button
              onClick={() => {
                setPage("我的");
              }}
            >
              管理我的设备 <ArrowUpRight size={15} />
            </button>
          </div>
          <button className="profile" onClick={() => setPage("我的")}>
            <span className="avatar">万</span>
            <span>
              <b>{state.nickname}</b>
              <small>我的智慧生活空间</small>
            </span>
            <Settings size={17} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            我的空间 <ChevronRight size={13} />{" "}
            <b>{page === "首页" ? "生活概览" : page}</b>
          </span>
          <div>
            <span className="demo-label">DEMO · 本地演示</span>
            <button
              className="icon-btn"
              aria-label="通知中心"
              onClick={() => setModal("notifications")}
            >
              <Bell size={19} />
              <i />
            </button>
            <span className="avatar small">万</span>
          </div>
        </header>
        <main className="main-layout">
          <section
            className={"main-content " + (page === "AI对话" ? "chat-page" : "")}
          >
            {page === "首页" && (
              <>
                <div className="greeting">
                  <div>
                    <span className="eyebrow">
                      A LITTLE LESS TO DO. A LITTLE MORE TO LIVE.
                    </span>
                    <h1>
                      {new Date().getHours() < 12
                        ? "早上好"
                        : new Date().getHours() < 18
                          ? "下午好"
                          : "晚上好"}
                      ，{state.nickname} <span className="sun">✺</span>
                    </h1>
                    <p>一个入口，连接生活的每一步。</p>
                  </div>
                  <span className="online-pill">
                    <span className="dot" /> AI 助手在线
                  </span>
                </div>
                <div className="hero">
                  <div className="hero-glow" />
                  <span className="ai-symbol">✳</span>
                  <div className="hero-copy">
                    <span className="hero-tag">YOUR EVERYDAY, CONNECTED</span>
                    <h2>
                      生活有很多步，
                      <br />
                      你只需要说一步。
                    </h2>
                    <p>告诉我你想做什么，剩下的交给 OneFlow。</p>
                  </div>
                  {composer(true)}
                  <div className="quick-prompts">
                    <button onClick={() => begin("home")}>
                      🏡 提前准备好我的家 <ArrowUpRight size={12} />
                    </button>
                    <button onClick={() => begin("movie")}>
                      🪐 今晚看点什么？ <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
                <div className="section-title">
                  <div>
                    <h2>
                      为生活，开个好头 <span>精选场景</span>
                    </h2>
                  </div>
                  <span className="muted">一句话，安排妥当</span>
                </div>
                <div className="scenario-grid">
                  {scenarios.map((s, i) => (
                    <button
                      key={s.id}
                      className={"scenario scenario-" + i}
                      onClick={() => begin(s.id)}
                    >
                      <div className="scenario-visual">
                        <SceneArt kind={s.id} />
                        <i />
                        <em />
                      </div>
                      <span className="scenario-number">0{i + 1}</span>
                      <div className="scenario-copy">
                        <small>{s.sub}</small>
                        <h3>{s.title}</h3>
                        <p>{s.desc}</p>
                      </div>
                      <span className="round-arrow">
                        <ArrowUpRight size={18} />
                      </span>
                    </button>
                  ))}
                </div>
                <div className="section-title">
                  <h2>正在为你安排</h2>
                  <button className="text-btn" onClick={() => setPage("任务")}>
                    全部任务 <ArrowRight size={14} />
                  </button>
                </div>
                {state.tasks
                  .filter((t) =>
                    [
                      "running",
                      "paused",
                      "pending_confirmation",
                      "draft",
                    ].includes(t.status),
                  )
                  .slice(0, 2)
                  .map((t) => (
                    <button
                      className="active-task"
                      key={t.id}
                      onClick={() => openTask(t)}
                    >
                      <span className="task-icon">
                        <Layers />
                      </span>
                      <span>
                        <b>{t.title}</b>
                        <small>
                          {statusLabel[t.status]} · 已完成{" "}
                          {
                            t.steps.filter((s) => s.status === "completed")
                              .length
                          }
                          /{t.steps.length || "—"} 步
                        </small>
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                {!state.tasks.some((t) =>
                  [
                    "running",
                    "paused",
                    "pending_confirmation",
                    "draft",
                  ].includes(t.status),
                ) && (
                  <div className="quiet-card">
                    <CheckCircle2 size={24} />
                    <div>
                      <b>此刻，一切井井有条</b>
                      <p>从上方选一个场景，开启今天的第一件小事。</p>
                    </div>
                    <span>ALL CLEAR</span>
                  </div>
                )}
                <div className="section-title">
                  <h2>
                    我的智能设备 <span>{online} 台在线</span>
                  </h2>
                  <button className="text-btn" onClick={() => setPage("我的")}>
                    设备中心 <ArrowRight size={14} />
                  </button>
                </div>
                {deviceCards()}
                <div className="section-title">
                  <h2>随时为你效劳</h2>
                </div>
                <div className="quick-services">
                  {agents.map((a, i) => (
                    <button
                      key={a.name}
                      onClick={() => {
                        setService(i);
                        setModal("service");
                      }}
                    >
                      {
                        [
                          <Film />,
                          <ShoppingBag />,
                          <Home />,
                          <MapPin />,
                          <Calendar />,
                          <Grid2X2 />,
                        ][i]
                      }
                      <span>
                        {["视频", "购物", "家居", "出行", "日程", "外卖"][i]}
                      </span>
                    </button>
                  ))}
                </div>
                <footer>ONEFLOW · MAKE ROOM FOR LIFE</footer>
              </>
            )}
            {page === "AI对话" && (
              <>
                <div className="chat-heading">
                  <button
                    className="icon-btn"
                    onClick={() => setPage("首页")}
                    aria-label="返回首页"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <span className="chat-logo">✳</span>
                  <div>
                    <h2>OneFlow AI</h2>
                    <small>
                      <span className="dot" /> {task?.title || "你的生活助手"}
                    </small>
                  </div>
                  <button
                    className="icon-btn"
                    aria-label="更多操作"
                    onClick={() => setMenu(!menu)}
                  >
                    <MoreHorizontal />
                  </button>
                  {menu && (
                    <div className="more-menu">
                      {["新建对话", "查看任务", "清空当前会话"].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            if (s === "查看任务") setPage("任务");
                            else if (s === "新建对话")
                              setState((s) => ({ ...s, current: null }));
                            else if (task)
                              updateTask(task.id, (t) => (t.messages = []));
                            setMenu(false);
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="chat-body">
                  {!task && (
                    <div className="chat-welcome">
                      <span className="ai-symbol">✳</span>
                      <h2>想做什么，说给我听。</h2>
                      <p>把琐事交给我，把时间留给生活。</p>
                      {scenarios.map((s) => (
                        <button key={s.id} onClick={() => begin(s.id)}>
                          {s.emoji} {s.title}
                          <ArrowUpRight size={16} />
                        </button>
                      ))}
                    </div>
                  )}
                  {task?.messages.map((m, i) => (
                    <div className={"message " + m.role} key={i}>
                      {m.role === "ai" && <span>✳</span>}
                      <p>{m.text}</p>
                    </div>
                  ))}
                  {fallback && <p className="notice">{fallback}</p>}
                  {flow()}
                </div>
                <div className="chat-composer">
                  <div className="suggestions">
                    {(task?.scenarioType === "home"
                      ? [
                          "空调改成25度",
                          "我晚20分钟到家",
                          "不要辣的，换成有汤的",
                        ]
                      : task?.scenarioType === "movie"
                        ? ["就看第二部", "先不要买周边"]
                        : ["下班归家", "周末旅行"]
                    ).map((s) => (
                      <button key={s} onClick={() => send(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {composer()}
                  <small>本地模拟理解 · 每一个重要动作，都由你确认</small>
                </div>
              </>
            )}
            {page === "任务" && (
              <>
                {title("YOUR PLANS, IN ONE PLACE", "每一步，都心中有数")}
                <div className="filter-tabs">
                  {["进行中", "待确认", "已完成"].map((f) => (
                    <button
                      key={f}
                      className={filter === f ? "active" : ""}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {state.tasks
                  .filter((t) =>
                    filter === "进行中"
                      ? ["running", "paused", "draft"].includes(t.status)
                      : filter === "待确认"
                        ? t.status === "pending_confirmation"
                        : ["completed", "partial_failed", "cancelled"].includes(
                            t.status,
                          ),
                  )
                  .map((t) => (
                    <button
                      className="task-card"
                      key={t.id}
                      onClick={() => openTask(t)}
                    >
                      <div className="row">
                        <span className="task-icon">
                          <Layers size={20} />
                        </span>
                        <span className={"badge " + t.status}>
                          {statusLabel[t.status]}
                        </span>
                      </div>
                      <h3>{t.title}</h3>
                      <p>{t.originalUserRequest}</p>
                      <div className="progress">
                        <span
                          style={{
                            width: `${t.steps.length ? (t.steps.filter((s) => s.status === "completed").length / t.steps.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <small>
                        {new Date(t.createdAt).toLocaleString("zh-CN")} ·{" "}
                        {t.steps.filter((s) => s.status === "completed").length}
                        /{t.steps.length} 步完成
                      </small>
                      <p className="muted">
                        {t.selectedServices.join(" · ") ||
                          "OneFlow 正在安排服务"}
                      </p>
                    </button>
                  ))}
                <button
                  className="outline full"
                  onClick={() => {
                    setState((s) => ({ ...s, current: null }));
                    setPage("AI对话");
                  }}
                >
                  <Plus size={17} /> 创建新任务
                </button>
              </>
            )}
            {page === "服务" && (
              <>
                {title("CONNECTED TO YOUR EVERYDAY", "生活服务，一触即达")}
                <p className="muted">
                  让擅长的服务，做擅长的事。OneFlow 帮你自然连接。
                </p>
                <div className="services-grid">
                  {agents.map((a, i) => (
                    <button
                      className="service-card"
                      key={a.name}
                      onClick={() => {
                        setService(i);
                        setModal("service");
                      }}
                    >
                      <span className={"service-icon color-" + i}>
                        {
                          [
                            <Film />,
                            <ShoppingBag />,
                            <Home />,
                            <MapPin />,
                            <Calendar />,
                            <Sparkles />,
                          ][i]
                        }
                      </span>
                      <span className="badge">
                        {state.services[i] ? "已连接" : "未连接"}
                      </span>
                      <h3>{a.name} Agent</h3>
                      <p>{a.desc}</p>
                      <small>
                        {a.app} <ArrowUpRight size={13} />
                      </small>
                    </button>
                  ))}
                </div>
              </>
            )}
            {page === "我的" && (
              <>
                {title("YOUR OWN LITTLE UNIVERSE", "我的生活空间")}
                <div className="profile-card">
                  <span className="avatar large">万</span>
                  <div>
                    <label className="field">
                      我的昵称
                      <input
                        value={state.nickname}
                        onChange={(e) =>
                          setState((s) => ({ ...s, nickname: e.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      生活偏好
                      <input
                        value={state.preference}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            preference: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                </div>
                <div className="section-title">
                  <h2>
                    设备中心 <span>{online} 台在线</span>
                  </h2>
                </div>
                {deviceCards(true)}
                <div className="about-card">
                  <h3>关于 OneFlow</h3>
                  <p>
                    当前为产品演示版本，智能理解及服务执行由本地模拟逻辑驱动。所有价格、内容、导航及设备状态均为演示数据。
                  </p>
                  <p>
                    影片信息仅用于交互演示，不代表星幕视频拥有播放版权。提醒保存在本地，非系统通知。
                  </p>
                  <button className="outline" onClick={() => setModal("reset")}>
                    <RotateCcw size={15} /> 重置演示数据
                  </button>
                </div>
              </>
            )}
          </section>
          <aside className="companion">
            <div className="companion-heading">
              <div>
                <span className="eyebrow">YOUR CONNECTED SPACE</span>
                <h2>生活，在另一端回应</h2>
              </div>
              <span className="live">
                <span className="dot" /> LIVE
              </span>
            </div>
            {
              <DevicePreview
                state={state}
                preview={preview}
                setPreview={setPreview}
                setModal={setModal}
                deviceUpdate={deviceUpdate}
              />
            }
            <div className="connection-flow">
              <div>
                <Smartphone size={20} />
                <span>你的需求</span>
              </div>
              <i />
              <div className="flow-ai">
                <Sparkles size={21} />
                <span>OneFlow</span>
              </div>
              <i />
              <div>
                <Monitor size={20} />
                <span>设备回应</span>
              </div>
            </div>
            <div className="companion-tip">
              <span>✳</span>
              <div>
                <h3>你开口，生活就有了默契。</h3>
                <p>
                  在左侧确认计划，看设备在这里实时响应。
                  <br />
                  每一步，都在你的掌控之中。
                </p>
              </div>
            </div>
            <div className="activity">
              <div className="row">
                <h4>空间动态</h4>
                <span className="muted">实时</span>
              </div>
              {state.tasks
                .flatMap((t) => [...t.executionResults].reverse())
                .slice(0, 3)
                .map((r, i) => (
                  <p key={i}>
                    <span className="dot" />
                    {r}
                  </p>
                ))}
              <p>
                <span className="dot" />
                {online} 台设备已连接到你的空间
              </p>
            </div>
            <div className="desktop-note">
              <Wifi size={13} /> 多设备协同模拟视图 · 不连接真实硬件
            </div>
          </aside>
        </main>
      </div>
      <nav className="mobile-nav">
        {[
          [Home, "首页"],
          [MessageCircle, "AI对话"],
          [Layers, "任务"],
          [Grid2X2, "服务"],
          [User, "我的"],
        ].map(([I, n]) => {
          const Icon = I as typeof Home;
          return (
            <button
              key={n as string}
              className={page === n ? "active" : ""}
              onClick={() => setPage(n as string)}
            >
              <Icon size={21} />
              <span>{n as string}</span>
            </button>
          );
        })}
      </nav>
      {(modal || pending) && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setModal(null);
            setPending(null);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-btn"
              aria-label="关闭"
              onClick={() => {
                setModal(null);
                setPending(null);
              }}
            >
              <X size={21} />
            </button>
            {pending && (
              <>
                <span className="eyebrow">PLAN UPDATE</span>
                <h2>确认这次调整</h2>
                <p>{pending.reason}</p>
                <p className="notice">
                  仅调整受影响的步骤，已经开启的设备保持当前状态。已执行的空调改温将作为新的控制动作。
                </p>
                {task && summary({ ...task, config: pending.config })}
                <button className="primary full" onClick={acceptChange}>
                  确认新计划
                </button>
              </>
            )}
            {modal === "preview" && (
              <>
                <h2>多设备协同视图</h2>
                {
                  <DevicePreview
                    state={state}
                    preview={preview}
                    setPreview={setPreview}
                    setModal={setModal}
                    deviceUpdate={deviceUpdate}
                  />
                }
              </>
            )}
            {modal === "notifications" && (
              <>
                <h2>空间通知</h2>
                <p>你的 OneFlow 已准备就绪，{online} 台设备在线。</p>
                {state.tasks
                  .filter((t) => t.status === "partial_failed")
                  .map((t) => (
                    <button
                      className="select-row"
                      key={t.id}
                      onClick={() => {
                        openTask(t);
                        setModal(null);
                      }}
                    >
                      {t.title} · 有未完成步骤 <ChevronRight />
                    </button>
                  ))}
                <p className="muted">重要执行结果会同步显示在任务中心。</p>
              </>
            )}
            {modal === "voice" && (
              <>
                <span className="voice-symbol">
                  <AudioLines size={38} />
                </span>
                <h2>模拟语音输入</h2>
                <p className="muted">
                  点选一句话，体验语音转文字。不会调用麦克风。
                </p>
                {scenarios.map((s) => (
                  <button
                    className="select-row"
                    key={s.id}
                    onClick={() => {
                      setInput(s.request);
                      setModal(null);
                    }}
                  >
                    {s.emoji} {s.title}
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              </>
            )}
            {(modal === "service" || modal === "auth") && (
              <>
                <span className="service-icon">
                  <Link />
                </span>
                <h2>
                  {modal === "auth"
                    ? "先连接服务，再继续"
                    : agents[service].name + " Agent"}
                </h2>
                <p>{agents[service].desc}</p>
                <div className="summary">
                  <div>
                    <span>模拟应用</span>
                    <b>{agents[service].app}</b>
                  </div>
                  <div>
                    <span>支持设备</span>
                    <b>{agents[service].device}</b>
                  </div>
                  <div>
                    <span>授权范围</span>
                    <b>读取偏好 · 提交已确认的演示任务</b>
                  </div>
                </div>
                <button
                  className="outline full"
                  onClick={() => {
                    setState((s) => ({
                      ...s,
                      services: s.services.map((v, i) =>
                        i === service ? !v : v,
                      ),
                    }));
                    if (modal === "auth") {
                      setModal(null);
                      notify("服务已连接，请确认执行计划");
                    }
                  }}
                >
                  {state.services[service] ? "断开连接" : "同意授权并连接"}
                </button>
                <p className="muted">推荐指令：{agents[service].command}</p>
                <button
                  className="primary full"
                  onClick={() => {
                    send(agents[service].command);
                    setModal(null);
                  }}
                >
                  立即使用
                </button>
              </>
            )}
            {modal === "cart" && task && (
              <>
                <h2>
                  {task.scenarioType === "movie"
                    ? "本次购物清单"
                    : "今晚的晚餐"}
                </h2>
                {task.scenarioType === "movie" ? (
                  goods.map(
                    (g, i) =>
                      task.config.cart[i] > 0 && (
                        <div className="cart-row" key={g.name}>
                          <span>{g.emoji}</span>
                          <div>
                            <b>{g.name}</b>
                            <small>
                              ¥{g.price} × {task.config.cart[i]}
                            </small>
                          </div>
                          <b>¥{g.price * task.config.cart[i]}</b>
                        </div>
                      ),
                  )
                ) : task.config.dinner >= 0 ? (
                  <div className="cart-row">
                    <span>{dinners[task.config.dinner].emoji}</span>
                    <b>{dinners[task.config.dinner].name}</b>
                    <b>¥{dinners[task.config.dinner].price}</b>
                  </div>
                ) : (
                  <p>本次没有选择晚餐。</p>
                )}
                <h3>
                  合计 ¥
                  {task.scenarioType === "movie"
                    ? task.config.cart.reduce(
                        (a, b, i) => a + b * goods[i].price,
                        0,
                      )
                    : task.config.dinner >= 0
                      ? dinners[task.config.dinner].price
                      : 0}
                </h3>
                <p className="notice">
                  {task.ordered
                    ? "演示订单已创建，无真实交易。"
                    : "仅为清单，尚未下单或付款。"}
                </p>
                <button
                  className="primary full"
                  disabled={
                    task.ordered ||
                    (task.scenarioType === "movie"
                      ? !task.steps.some(
                          (s) =>
                            s.title === "整理购物清单" &&
                            s.status === "completed",
                        ) ||
                        !task.config.shopping ||
                        !task.config.cart.some(Boolean)
                      : !task.steps.some(
                          (s) =>
                            s.title === "准备晚餐订单" &&
                            s.status === "completed",
                        ))
                  }
                  onClick={() => setModal("order")}
                >
                  {task.ordered ? "模拟订单已创建" : "模拟确认下单"}
                </button>
              </>
            )}
            {modal === "order" && task && (
              <>
                <h2>最后确认一下</h2>
                <p className="notice">
                  演示订单，不产生真实交易。不会扣款，也不会配送。
                </p>
                {summary(task)}
                <button
                  className="primary full"
                  onClick={() => {
                    updateTask(task.id, (t) => (t.ordered = true));
                    setModal("cart");
                    notify("模拟订单创建成功，无真实交易");
                  }}
                >
                  确认创建演示订单
                </button>
              </>
            )}
            {modal === "edit" && task && (
              <>
                <h2>调整当前计划</h2>
                <p className="muted">
                  修改后会展示确认，已完成的操作不会回退。
                </p>
                {summary(task)}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    const c = {
                      ...task.config,
                      temp: Number(data.get("temp") || task.config.temp),
                      reminder: String(
                        data.get("reminder") || task.config.reminder,
                      ),
                    };
                    const eta = String(data.get("eta") || time(c.eta))
                      .split(":")
                      .map(Number);
                    c.eta = Math.max(
                      task.clock + 1,
                      Math.min(1439, eta[0] * 60 + eta[1]),
                    );
                    setModal(null);
                    alter(c, "更新温度、到家时间或提醒安排");
                  }}
                >
                  <label className="field">
                    空调温度
                    <input
                      name="temp"
                      type="number"
                      min="16"
                      max="30"
                      defaultValue={task.config.temp}
                    />
                  </label>
                  {task.scenarioType === "home" && (
                    <label className="field">
                      预计到家
                      <input
                        name="eta"
                        type="time"
                        defaultValue={time(task.config.eta)}
                      />
                    </label>
                  )}
                  {task.scenarioType === "work" && (
                    <label className="field">
                      提醒时间
                      <input
                        name="reminder"
                        type="time"
                        defaultValue={task.config.reminder}
                      />
                    </label>
                  )}
                  <button className="primary full">查看调整</button>
                </form>
              </>
            )}
            {modal === "doc" && (
              <>
                <span className="eyebrow">ONEFLOW WORKSPACE</span>
                <h2>产品方案 V1.0</h2>
                <p>阅读位置：第 2 节 · 用户旅程</p>
                <div className="document">
                  <h3>从一句需求，到完整的生活服务</h3>
                  <p>
                    目标：统一手机、电脑和家庭设备的任务上下文，减少应用切换。
                  </p>
                  {todos.map((s, i) => (
                    <label className="check-row" key={s}>
                      <input
                        type="checkbox"
                        checked={Boolean(
                          state.devices.find((d) => d.id === "pc")?.properties[
                            "todo" + i
                          ],
                        )}
                        onChange={(e) =>
                          deviceUpdate(
                            "pc",
                            {},
                            { ["todo" + i]: e.target.checked ? 1 : 0 },
                          )
                        }
                      />
                      {s}
                    </label>
                  ))}
                </div>
                <p className="muted">演示文档 · 待办来源于手机当前文档</p>
              </>
            )}
            {modal === "reset" && (
              <>
                <h2>重新开始这次演示？</h2>
                <p>将清除本地任务、偏好与设备修改，恢复默认示例。</p>
                <button
                  className="primary full"
                  onClick={() => {
                    setState(initialState());
                    setModal(null);
                    setPage("首页");
                  }}
                >
                  确认重置
                </button>
              </>
            )}
            {state.devices
              .filter((d) => d.id === modal)
              .map((d) => {
                const I = iconFor(d.type);
                return (
                  <div key={d.id}>
                    <span className="device-icon on">
                      <I size={28} />
                    </span>
                    <h2>{d.name}</h2>
                    <p className="muted">
                      {d.room} · {d.type} · {d.online ? "在线" : "离线"}
                    </p>
                    <label className="switch-row">
                      设备在线状态
                      <input
                        aria-label="设备在线状态"
                        type="checkbox"
                        checked={d.online}
                        onChange={(e) =>
                          deviceUpdate(d.id, { online: e.target.checked })
                        }
                      />
                    </label>
                    <label className="switch-row">
                      电源
                      <input
                        aria-label="电源"
                        type="checkbox"
                        disabled={!d.online}
                        checked={d.power}
                        onChange={(e) =>
                          deviceUpdate(d.id, { power: e.target.checked })
                        }
                      />
                    </label>
                    {["ac", "water", "floor"].includes(d.id) && (
                      <>
                        <label className="slider-label">
                          <span>
                            目标温度<b>{d.properties.temperature}℃</b>
                          </span>
                          <input
                            aria-label="设备目标温度"
                            disabled={!d.online}
                            type="range"
                            min={d.id === "water" ? 35 : 16}
                            max={d.id === "water" ? 60 : 30}
                            value={Number(d.properties.temperature)}
                            onChange={(e) =>
                              deviceUpdate(
                                d.id,
                                {},
                                { temperature: Number(e.target.value) },
                              )
                            }
                          />
                        </label>
                        <label className="field">
                          模式
                          <select
                            disabled={!d.online}
                            value={d.properties.mode}
                            onChange={(e) =>
                              deviceUpdate(d.id, {}, { mode: e.target.value })
                            }
                          >
                            <option>自动</option>
                            <option>制冷</option>
                            <option>制热</option>
                            <option>节能</option>
                          </select>
                        </label>
                        {d.id === "water" && (
                          <p>{d.power ? "已启动预热" : "等待预热"}</p>
                        )}
                      </>
                    )}
                    {d.type === "灯光" && (
                      <>
                        <label className="slider-label">
                          <span>
                            亮度<b>{d.properties.brightness}%</b>
                          </span>
                          <input
                            type="range"
                            disabled={!d.online}
                            min="1"
                            max="100"
                            value={d.properties.brightness}
                            onChange={(e) =>
                              deviceUpdate(
                                d.id,
                                {},
                                { brightness: Number(e.target.value) },
                              )
                            }
                          />
                        </label>
                        <label className="field">
                          灯光场景
                          <select
                            value={d.properties.mode}
                            disabled={!d.online}
                            onChange={(e) =>
                              deviceUpdate(d.id, {}, { mode: e.target.value })
                            }
                          >
                            <option>自动</option>
                            <option>暖光</option>
                            <option>星空</option>
                            <option>阅读</option>
                          </select>
                        </label>
                      </>
                    )}
                    {["tv", "pc", "car", "phone"].includes(d.id) && (
                      <>
                        <div className="summary">
                          <div>
                            <span>当前内容</span>
                            <b>
                              {d.properties.content ||
                                d.properties.document ||
                                d.properties.destination ||
                                "尚未接收任务"}
                            </b>
                          </div>
                        </div>
                        <button
                          className="primary full"
                          onClick={() => {
                            setPreview(
                              d.id === "pc"
                                ? "电脑"
                                : d.id === "car"
                                  ? "汽车"
                                  : "电视",
                            );
                            setModal("preview");
                          }}
                        >
                          打开设备接续视图
                        </button>
                      </>
                    )}
                    <p className="notice">
                      手动操作立即更新本地模拟设备；AI
                      计划中的待执行设置仍以任务确认为准。
                    </p>
                  </div>
                );
              })}
          </section>
        </div>
      )}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
