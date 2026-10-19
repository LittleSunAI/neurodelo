import { Code2, Crown, Headphones, ShieldCheck, Sparkles, Star, Tablet } from "lucide-react";
import type { HeroConfig } from "@/types/platform";

const defaultConfig: HeroConfig = { style: "engineer", palette: "cyan", accessory: "laptop", badge: "code" };

export function HeroAvatar({ compact = false, config = defaultConfig, level = 14, imageUrl, imageAlt = "Визуальный герой пользователя" }: { compact?: boolean; config?: HeroConfig; level?: number; imageUrl?: string; imageAlt?: string }) {
  const BadgeIcon = config.badge === "shield" ? ShieldCheck : config.badge === "spark" ? Sparkles : Code2;
  return (
    <div className={`${compact ? "hero-avatar compact" : "hero-avatar"} hero-${config.style} palette-${config.palette}`}>
      <div className="hero-glow" />
      <div className="hero-rank"><Crown size={15} />{level}</div>
      {imageUrl ? <div className="hero-portrait-image" role="img" aria-label={imageAlt} style={{ backgroundImage: `url(${JSON.stringify(imageUrl).slice(1, -1)})` }} /> : <div className="hero-character" aria-label={imageAlt}>
        <div className="hero-hair" />
        <div className="hero-head"><span className="eye left" /><span className="eye right" /><span className="smile" /></div>
        <div className="hero-neck" />
        <div className="hero-body"><div className="hero-jacket-left" /><div className="hero-jacket-right" /><div className="hero-shirt"><BadgeIcon size={22} /></div></div>
        {config.accessory === "laptop" ? <div className="hero-laptop"><Sparkles size={19} /><span>AI</span></div> : null}
        {config.accessory === "tablet" ? <div className="hero-tablet"><Tablet size={23} /></div> : null}
        {config.accessory === "headset" ? <div className="hero-headset"><Headphones size={28} /></div> : null}
      </div>}
      <div className="hero-stars"><Star size={13} /><Star size={9} /><Star size={11} /></div>
    </div>
  );
}
