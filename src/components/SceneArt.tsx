/** Local CSS artwork: consistent across platforms, with no image requests. */
export default function SceneArt({ kind }: { kind: string }) {
  return (
    <div className={"scene-art art-" + kind} aria-hidden="true">
      <i className="art-a" />
      <i className="art-b" />
      <i className="art-c" />
      <i className="art-d" />
      <i className="art-e" />
    </div>
  );
}
