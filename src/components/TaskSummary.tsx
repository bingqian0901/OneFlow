import {
  films,
  goods,
  dinners,
  time,
  type Task,
  type Config,
  type Device,
} from "../model";
export function travelCost(c: Config) {
  return (c.transport ? 260 : 146) + (c.hotel ? 680 : 398) + 280;
}

export default function TaskSummary({
  task: t,
  devices,
}: {
  task: Task;
  devices: Device[];
}) {
  return (
    <div className="summary">
      {t.scenarioType === "movie" ? (
        <>
          <div>
            <span>今晚的电影</span>
            <b>《{films[t.config.film].name}》</b>
          </div>
          <div>
            <span>播放设备</span>
            <b>
              {t.config.video
                ? devices.find((d) => d.id === t.config.target)?.name +
                  " · " +
                  (t.config.play ? "立即播放" : "影片详情页")
                : "已跳过"}
            </b>
          </div>
          <div>
            <span>观影环境</span>
            <b>
              {t.config.ac ? `${t.config.temp}℃` : "空调不调整"} ·{" "}
              {t.config.lights ? `灯光 ${t.config.light}%` : "灯光不调整"}
            </b>
          </div>
          <div>
            <span>氛围灯</span>
            <b>{t.config.ambient ? "星空模式" : "不调整"}</b>
          </div>
          <div>
            <span>购物清单</span>
            <b>
              {t.config.shopping ? t.config.cart.reduce((a, b) => a + b, 0) : 0}{" "}
              件 · ¥
              {t.config.shopping
                ? t.config.cart.reduce((a, b, i) => a + b * goods[i].price, 0)
                : 0}
            </b>
          </div>
        </>
      ) : t.scenarioType === "home" ? (
        <>
          <div>
            <span>预计到家</span>
            <b>{time(t.config.eta)}</b>
          </div>
          <div>
            <span>热水准备</span>
            <b>
              {time(t.config.eta - 25)} · {t.config.water}℃
            </b>
          </div>
          <div>
            <span>客厅空调</span>
            <b>
              {t.config.ac
                ? `${time(t.config.eta - 20)} · ${t.config.temp}℃`
                : "不调整"}
            </b>
          </div>
          <div>
            <span>客厅暖光</span>
            <b>
              {t.config.lights
                ? `${time(t.config.eta - 5)} · ${t.config.light}%`
                : "不调整"}
            </b>
          </div>
          <div>
            <span>晚餐</span>
            <b>
              {t.config.dinner < 0
                ? "暂不点餐"
                : `${dinners[t.config.dinner].name} · ¥${dinners[t.config.dinner].price}`}
            </b>
          </div>
        </>
      ) : t.scenarioType === "travel" ? (
        <>
          <div>
            <span>行程</span>
            <b>
              {t.config.city} → {t.config.destination} · {t.config.date}
            </b>
          </div>
          <div>
            <span>交通 / 酒店</span>
            <b>
              {t.config.transport ? "自驾" : "高铁"} ·{" "}
              {t.config.hotel ? "湖畔精品酒店" : "城市轻居酒店"}
            </b>
          </div>
          <div>
            <span>游玩路线</span>
            <b>{t.config.route ? "灵隐寺 → 龙井村" : "西湖 → 河坊街"}</b>
          </div>
          <div>
            <span>预算 / 预计花费</span>
            <b>
              ¥{t.config.budget} / ¥{travelCost(t.config)}
            </b>
          </div>
        </>
      ) : (
        <>
          <div>
            <span>文档接续</span>
            <b>产品方案 V1.0 → 个人电脑</b>
          </div>
          <div>
            <span>待办与提醒</span>
            <b>3 项待办 · {t.config.reminder}</b>
          </div>
        </>
      )}
    </div>
  );
}
