# iPhone HDR regression investigation — 2026-09-25

## Observed

User: iPhone 14 Pro, iOS 27, Safari; legacy page still shows HDR. The matrix page shows no visible difference when switching HDR / SDR. This is a physical user report, not an automated display measurement.

Both the working legacy asset and matrix B9 are 10-bit full-range YUV444 AVIF, with BT.2020 / PQ / BT.2020 NCL (9/16/9) in the container and decoded AV1 stream. All 54 matrix fixtures previously passed lossless pixel verification. No asset bytes are changed in this revision.

## Leading hypothesis, not yet physically confirmed

The original matrix used a two-axis `overflow:auto` container with a height limit, and each card had `overflow:hidden`. The working legacy image is in ordinary document flow.

In WebKit's `RenderLayerBacking::updateDrawsContent(PaintedContentsInfo&)`, the `m_scrollContainerLayer` branch sets scrolling-layer content and returns before the later `setDetectsHDRContent` / `setDrawsHDRContent` calls. This provides a concrete reason to isolate nested scrolling. It does **not** prove that the user's exact Safari build follows this path, or rule out Apple AVIF decoder differences.

Source inspected: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/rendering/RenderLayerBacking.cpp (2026-09-25). Search the function named above; upstream main is mutable.

## Changes

- Remove nested scrolling and card clipping from the matrix, use a responsive grid in document flow on all platforms. Only the result table retains its independent scrolling.
- Keep all 54 fixtures, nit values, and masks unchanged. Start the selected sample at B9 (203 / 1000 nit), a strong-contrast reference.
- Add `hdr-check.html`, with only one image in the DOM: unchanged legacy or unchanged matrix B9. Independently switch plain / scrolling layout and no-limit / standard. The layout pair preserves image display width, and current selections persist in the URL for a full reload check.
- Version script / CSS URLs (`flow-2`). Log computed dynamic-range-limit and container overflow.
- Archive the previous active trial and create a new `flow-2` trial with A/B observation reset to unknown. Preserve prior observations; export display revision in JSON and CSV.

## Validation and limits

- Chromium in-app browser at 390 × 844: 54/54 images decode; responsive matrix has no document horizontal overflow; matrix and card overflow are visible.
- All matrix images compute `standard` after SDR switch; single-image mode computes `no-limit` after returning to HDR.
- Isolation-page plain/scroll B9 display widths match. Switching asset and refreshing retains layout and SDR mode; both assets decode.
- Two pre-existing local synthetic observations survive migration; reload does not re-archive the current flow-2 trial. JSON export retains history.
- Syntax checks and existing luminance / candidate exclusion / CSV logic tests pass.
- The development display reports `dynamic-range: high = false`. These checks verify page behavior, not iPhone HDR output.

Follow-up user report (2026-09-25): brightness changes are now visible. On iPhone, the user prefers B7/B8, reports clear text without HDR, and disappearing text in SDR captures of HDR content. No plain-versus-scroll paired result was supplied, so the exact compositor cause remains a hypothesis even though the revised display works in the user's test. The user also confirms iPad Pro 2022 (M2), iPadOS 27: C7/C8/C9 are clearly readable on screen and their text disappears in SDR screenshots. Display size and browser were not supplied. Structured observations: [device-candidates.json](device-candidates.json).

Next physical work: verify B7/B8/C7/C8/C9 on each device with recorded screen brightness, original SDR captures, enlarged/enhanced inspection and repeated runs. Do not convert this qualitative report into numeric screen scores or measured screenshot deltas.
