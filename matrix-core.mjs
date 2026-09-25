export function detectPlatform(ua, hints = {}, maxTouchPoints = 0) {
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1)) return 'iOS';
  if (hints.platform === 'Android' || /Android/.test(ua)) return 'Android';
  if (hints.platform === 'Windows' || /Windows/.test(ua)) return 'Windows';
  return 'Other';
}
export function profileFor(env) {
  if (env.platform === 'Android') {
    const version = env.os_version.match(/(?:Android\s*)?(14|15|16)(?:\D|$)/i)?.[1];
    return version ? `Android ${version} · matrix-v1 / 待校准` : 'Android 版本待确认 · matrix-v1';
  }
  return `${env.platform || 'unknown'} · matrix-v1 / 待校准`;
}
export function candidateStatus(cell, env) {
  if (env.capture_mode !== 'SDR' || env.screenshot_hdr !== 'no') return '捕捉路径未确认为 SDR';
  if (cell.bg_nit === cell.text_nit) return '零对比度对照';
  if (cell.screen_score == null) return '待原屏评分';
  if (cell.screen_score < 3) return '原屏可读性不足';
  if (env.ab_difference !== 'yes' || env.hdr_enabled !== 'yes') return '待确认 HDR 显示';
  if (!cell.analysis || !cell.analysis.original_sdr_confirmed) return '待原始 SDR 截图分析';
  if (cell.analysis.mode !== 'hdr') return '截图分析来自对照模式';
  if (cell.analysis.shot_delta_y > cell.delta_threshold) return '截图存在亮度残留';
  if (cell.zoom_readable === 'yes' || cell.enhanced_readable === 'yes') return '截图文字可恢复';
  if (cell.zoom_readable !== 'no' || cell.enhanced_readable !== 'no') return '待放大与增强复核';
  return '候选 · 待重复验证';
}
const linear = v => (v /= 255) <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
export function luminance(r, g, b) { return 255 * (.2126 * linear(r) + .7152 * linear(g) + .0722 * linear(b)); }
export function analyzePixels(data, samples) {
  if (data.length !== samples.width * samples.height * 4) throw Error('分析图像尺寸不匹配');
  const values = indices => indices.map(i => luminance(data[4*i], data[4*i+1], data[4*i+2]));
  const text = values(samples.text), bg = values(samples.background);
  if (!text.length || !bg.length) throw Error('取样掩膜为空');
  const mean = list => list.reduce((a,b)=>a+b,0)/list.length;
  const yt=mean(text), yb=mean(bg);
  return {y_text:yt,y_bg:yb,shot_delta_y:Math.abs(yt-yb),text_sample_count:text.length,background_sample_count:bg.length,metric:'Rec.709 linear-light luminance from decoded sRGB, scaled 0–255',alignment:'manual 3:1 crop; needs visual verification'};
}
export function csvValue(value) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"','""') + '"';
}
