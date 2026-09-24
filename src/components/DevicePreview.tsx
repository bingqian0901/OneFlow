import {
  ArrowUpRight,
  Home,
  Monitor,
  Smartphone,
  Tv,
  Car,
  Wind,
  Droplets,
  Lightbulb,
  Play,
  MapPin,
} from "lucide-react";
import type { State, Device } from "../model";
const iconFor = (type: string) =>
  type === "空调" ? Wind : type === "热水器" ? Droplets : Lightbulb;
interface Props {
  state: State;
  preview: string;
  setPreview: (s: string) => void;
  setModal: (s: string) => void;
  deviceUpdate: (
    id: string,
    patch: Partial<Device>,
    props?: Device["properties"],
  ) => void;
}
export default function DevicePreview({
  state,
  preview,
  setPreview,
  setModal,
  deviceUpdate,
}: Props) {
  const tv = state.devices.find(
      (d) => d.id === (preview === "手机" ? "phone" : "tv"),
    )!,
    pc = state.devices.find((d) => d.id === "pc")!,
    car = state.devices.find((d) => d.id === "car")!;
  return (
    <div className="preview-inner">
      <div className="preview-tabs">
        {[
          ["电视", Tv],
          ["汽车", Car],
          ["电脑", Monitor],
          ["家居", Home],
          ...(preview === "手机" ? [["手机", Smartphone]] : []),
        ].map(([name, I]) => {
          const Icon = I as typeof Tv;
          return (
            <button
              key={name as string}
              className={preview === name ? "active" : ""}
              onClick={() => setPreview(name as string)}
            >
              <Icon size={17} />
              {name as string}
            </button>
          );
        })}
      </div>
      {preview === "电视" || preview === "手机" ? (
        <div className="tv-frame">
          <div
            className={
              "tv-screen " +
              (tv.properties.mode === "正在播放" ? "playing" : "")
            }
          >
            <span className="screen-label">
              星幕视频 <small>演示内容</small>
            </span>
            <div className="screen-orbit" />
            <div className="tv-content">
              <small>ONEFLOW CINEMA</small>
              <h2>{tv.properties.content || "今晚，去宇宙漫游"}</h2>
              <p>
                {tv.properties.content
                  ? tv.properties.mode
                  : "好故事，值得在大屏相遇。"}
              </p>
              {tv.properties.content ? (
                <button
                  disabled={!tv.online}
                  onClick={() =>
                    deviceUpdate(
                      tv.id,
                      {},
                      {
                        mode:
                          tv.properties.mode === "正在播放"
                            ? "影片详情"
                            : "正在播放",
                      },
                    )
                  }
                >
                  <Play size={15} />
                  {tv.properties.mode === "正在播放" ? "暂停播放" : "开始播放"}
                </button>
              ) : (
                <span>等待手机发送观影计划</span>
              )}
            </div>
          </div>
          <div className="tv-stand" />
        </div>
      ) : preview === "电脑" ? (
        <div className="pc-frame">
          <div className="window-top">
            <i />
            <i />
            <i />
            <span>OneFlow Workspace</span>
          </div>
          <div className="pc-content">
            <div className="document-icon">
              <Monitor />
            </div>
            <small>从手机，无缝继续</small>
            <h3>
              {pc.properties.document
                ? `已接收到手机任务：《${pc.properties.document}》`
                : "让灵感，在这里继续"}
            </h3>
            {pc.properties.document ? (
              <>
                <button className="primary" onClick={() => setModal("doc")}>
                  打开文档与待办
                </button>
                <p>阅读位置 · 第 2 节 / 用户旅程</p>
              </>
            ) : (
              <p>文档与任务将在确认后同步</p>
            )}
          </div>
        </div>
      ) : preview === "汽车" ? (
        <div className="car-screen">
          <div className="map-grid">
            <div className="route-path" />
            <span className="map-point start">●</span>
            <span className="map-point end">
              <MapPin />
            </span>
            <span className="map-label">城市快速路</span>
          </div>
          <div className="navigation">
            <ArrowUpRight />
            <div>
              <small>ONEFLOW NAVIGATION</small>
              <h3>{car.properties.destination}</h3>
              <span>{car.properties.eta || "等待手机发送行程"}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="room-scene">
            <div className="room-window">
              <i />
              <i />
            </div>
            <div className="room-art" />
            <div
              className="room-lamp"
              style={{
                opacity: state.devices.find((d) => d.id === "light")!.power
                  ? 1
                  : 0.25,
              }}
            />
            <div className="sofa">
              <i />
              <i />
              <i />
            </div>
            <div className="rug" />
            <div className="coffee-table" />
            <span className="room-badge">
              <span className="dot" /> 客厅 · 舒适在线
            </span>
            <span className="room-temp">
              {state.devices.find((d) => d.id === "ac")!.properties.temperature}
              <small>℃</small>
            </span>
          </div>
          <div className="home-stats">
            {["ac", "water", "light"].map((id) => {
              const d = state.devices.find((d) => d.id === id)!,
                I = iconFor(d.type);
              return (
                <button key={id} onClick={() => setModal(id)}>
                  <I size={20} />
                  <b>
                    {id === "light"
                      ? `${d.properties.brightness}%`
                      : `${d.properties.temperature}℃`}
                  </b>
                  <small>
                    {d.name} ·{" "}
                    {!d.online ? "离线" : d.power ? "已开启" : "待机"}
                  </small>
                </button>
              );
            })}
          </div>
        </>
      )}
      <div className="preview-foot">
        <span>
          <span className="dot" /> 实时同步已开启
        </span>
        <span>本地设备模拟</span>
      </div>
    </div>
  );
}
