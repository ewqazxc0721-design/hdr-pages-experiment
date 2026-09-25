$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$work = Join-Path $root '.calibration-build'
New-Item -ItemType Directory -Path $work -Force | Out-Null
$bitmap = [Drawing.Bitmap]::new(480,160)
$graphics = [Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([Drawing.Color]::Black)
$graphics.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$font = [Drawing.Font]::new('Microsoft YaHei',52,[Drawing.FontStyle]::Bold,[Drawing.GraphicsUnit]::Pixel)
$format = [Drawing.StringFormat]::new()
$format.Alignment = [Drawing.StringAlignment]::Center
$format.LineAlignment = [Drawing.StringAlignment]::Center
$graphics.DrawString('测试 AB12',$font,[Drawing.Brushes]::White,[Drawing.RectangleF]::new(0,0,480,160),$format)
$mask = [byte[]]::new(480*160)
for ($y=0; $y -lt 160; $y++) {
  for ($x=0; $x -lt 480; $x++) { $mask[$y*480+$x] = $bitmap.GetPixel($x,$y).R }
}
[IO.File]::WriteAllBytes((Join-Path $work 'text-mask.raw'),$mask)
$format.Dispose(); $font.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
Write-Output '480x160 grayscale glyph mask exported (not an HDR display asset).'
