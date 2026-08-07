param(
  [string]$AssetRoot = (Join-Path $PSScriptRoot '..\app-store\1.1.0')
)

Add-Type -AssemblyName System.Drawing

$canvasWidth = 1320
$canvasHeight = 2868
$screenWidth = 1000
$screenHeight = 2168
$screenX = [int](($canvasWidth - $screenWidth) / 2)
$screenY = 630
$cornerRadius = 64

$rawDirectory = Join-Path $AssetRoot 'raw'
$outputDirectory = Join-Path $AssetRoot 'generated'
$backgroundPath = Join-Path $AssetRoot 'background.png'

New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$fontCollection = New-Object System.Drawing.Text.PrivateFontCollection
$fontCollection.AddFontFile('C:\Windows\Fonts\seguisb.ttf')
$fontCollection.AddFontFile('C:\Windows\Fonts\segoeui.ttf')
$displayFamily = $fontCollection.Families[0]
$bodyFamily = $fontCollection.Families[1]

$eyebrowFont = New-Object System.Drawing.Font($displayFamily, 32, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$titleFont = New-Object System.Drawing.Font($displayFamily, 84, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$subtitleFont = New-Object System.Drawing.Font($bodyFamily, 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$items = @(
  @{
    Source = 'IMG_6971.PNG'
    Output = '01-tu-plan-diario.png'
    Eyebrow = 'NUTRICIÓN'
    Title = "Tu plan diario,`nmás claro"
    Subtitle = 'Menús, comidas y recetas sin complicaciones.'
    Accent = '#35E0B1'
  },
  @{
    Source = 'IMG_6968.PNG'
    Output = '02-ruta-de-entrenamiento.png'
    Eyebrow = 'ENTRENAMIENTO'
    Title = "Una ruta hecha`npara ti"
    Subtitle = 'Visualiza tu semana y retoma justo donde vas.'
    Accent = '#5CA5FF'
  },
  @{
    Source = 'IMG_6978.PNG'
    Output = '03-salud-y-recuperacion.png'
    Eyebrow = 'SALUD'
    Title = "Energía y recuperación,`nen contexto"
    Subtitle = 'Conecta tus señales para entrenar con intención.'
    Accent = '#5CA5FF'
  },
  @{
    Source = 'IMG_6977.PNG'
    Output = '04-plan-semanal.png'
    Eyebrow = 'PLANIFICACIÓN'
    Title = "Planea tu semana`ny tu súper"
    Subtitle = 'Organiza menús y genera una lista más precisa.'
    Accent = '#35E0B1'
  },
  @{
    Source = 'IMG_6972.PNG'
    Output = '05-comidas-del-dia.png'
    Eyebrow = 'DIETA'
    Title = "Cada comida,`nen su lugar"
    Subtitle = 'Calorías y recetas resumidas en una vista simple.'
    Accent = '#35E0B1'
  },
  @{
    Source = 'IMG_6975.PNG'
    Output = '06-bloques-de-entrenamiento.png'
    Eyebrow = 'EJECUCIÓN'
    Title = "Sigue cada bloque`nsin perderte"
    Subtitle = 'Consulta el ejercicio y registra tu avance.'
    Accent = '#5CA5FF'
  },
  @{
    Source = 'IMG_6976.PNG'
    Output = '07-series-peso-esfuerzo.png'
    Eyebrow = 'PROGRESIÓN'
    Title = "Series, peso`ny esfuerzo"
    Subtitle = 'Registra lo importante durante tu entrenamiento.'
    Accent = '#5CA5FF'
  },
  @{
    Source = 'IMG_6973.PNG'
    Output = '08-chat-con-entrenador.png'
    Eyebrow = 'ACOMPAÑAMIENTO'
    Title = "Habla con tu`nentrenador"
    Subtitle = 'Mensajes y notas de voz en un mismo espacio.'
    Accent = '#4D9BFF'
  },
  @{
    Source = 'IMG_6974.PNG'
    Output = '09-datos-en-progreso.png'
    Eyebrow = 'MEDIDAS'
    Title = "Convierte tus datos`nen progreso"
    Subtitle = 'Revisa tendencias y cambios con mayor claridad.'
    Accent = '#5CA5FF'
  },
  @{
    Source = 'IMG_6970.PNG'
    Output = '10-recomendaciones-y-metricas.png'
    Eyebrow = 'SEGUIMIENTO'
    Title = "Decisiones más claras,`ncada semana"
    Subtitle = 'Recomendaciones y métricas reunidas para ti.'
    Accent = '#B76BE8'
  }
)

function New-RoundedRectanglePath {
  param(
    [System.Drawing.RectangleF]$Rectangle,
    [float]$Radius
  )

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($Rectangle.X, $Rectangle.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($Rectangle.Right - $diameter, $Rectangle.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($Rectangle.Right - $diameter, $Rectangle.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($Rectangle.X, $Rectangle.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-CoverImage {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Image,
    [System.Drawing.Rectangle]$Bounds
  )

  $scale = [Math]::Max($Bounds.Width / $Image.Width, $Bounds.Height / $Image.Height)
  $drawWidth = [int][Math]::Ceiling($Image.Width * $scale)
  $drawHeight = [int][Math]::Ceiling($Image.Height * $scale)
  $drawX = $Bounds.X + [int](($Bounds.Width - $drawWidth) / 2)
  $drawY = $Bounds.Y + [int](($Bounds.Height - $drawHeight) / 2)
  $Graphics.DrawImage($Image, $drawX, $drawY, $drawWidth, $drawHeight)
}

$background = [System.Drawing.Image]::FromFile($backgroundPath)

foreach ($item in $items) {
  $sourcePath = Join-Path $rawDirectory $item.Source
  $outputPath = Join-Path $outputDirectory $item.Output
  $screen = [System.Drawing.Image]::FromFile($sourcePath)
  # App Store screenshots must be fully opaque; Apple rejects PNGs that
  # contain an alpha channel even when every pixel has alpha 255.
  $canvas = New-Object System.Drawing.Bitmap($canvasWidth, $canvasHeight, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $canvas.SetResolution(72, 72)
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.Clear([System.Drawing.Color]::FromArgb(4, 12, 24))

  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  Draw-CoverImage -Graphics $graphics -Image $background -Bounds (New-Object System.Drawing.Rectangle(0, 0, $canvasWidth, $canvasHeight))

  $accentColor = [System.Drawing.ColorTranslator]::FromHtml($item.Accent)
  $accentOverlay = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(24, $accentColor))
  $graphics.FillRectangle($accentOverlay, 0, 0, $canvasWidth, $canvasHeight)
  $accentOverlay.Dispose()

  $topShade = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle(0, 0, $canvasWidth, 720)),
    [System.Drawing.Color]::FromArgb(210, 4, 12, 24),
    [System.Drawing.Color]::FromArgb(25, 4, 12, 24),
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
  )
  $graphics.FillRectangle($topShade, 0, 0, $canvasWidth, 720)
  $topShade.Dispose()

  $accentBrush = New-Object System.Drawing.SolidBrush($accentColor)
  $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 208, 220, 238))

  $graphics.DrawString('FITPILOT', $eyebrowFont, $accentBrush, 110, 92)
  $graphics.FillRectangle($accentBrush, 110, 152, 108, 7)

  $titleFormat = New-Object System.Drawing.StringFormat
  $titleFormat.Alignment = [System.Drawing.StringAlignment]::Near
  $titleFormat.LineAlignment = [System.Drawing.StringAlignment]::Near
  $titleFormat.Trimming = [System.Drawing.StringTrimming]::Word
  $graphics.DrawString(
    $item.Title,
    $titleFont,
    $whiteBrush,
    (New-Object System.Drawing.RectangleF(105, 185, 1110, 230)),
    $titleFormat
  )
  $graphics.DrawString(
    $item.Subtitle,
    $subtitleFont,
    $mutedBrush,
    (New-Object System.Drawing.RectangleF(110, 455, 1100, 90))
  )

  foreach ($shadow in @(
    @{ Offset = 32; Alpha = 34 },
    @{ Offset = 20; Alpha = 48 },
    @{ Offset = 10; Alpha = 62 }
  )) {
    $shadowRect = New-Object System.Drawing.RectangleF(
      ($screenX - $shadow.Offset),
      ($screenY - $shadow.Offset),
      ($screenWidth + ($shadow.Offset * 2)),
      ($screenHeight + ($shadow.Offset * 2))
    )
    $shadowPath = New-RoundedRectanglePath -Rectangle $shadowRect -Radius ($cornerRadius + $shadow.Offset)
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($shadow.Alpha, 0, 0, 0))
    $graphics.FillPath($shadowBrush, $shadowPath)
    $shadowBrush.Dispose()
    $shadowPath.Dispose()
  }

  $screenRect = New-Object System.Drawing.RectangleF($screenX, $screenY, $screenWidth, $screenHeight)
  $screenPath = New-RoundedRectanglePath -Rectangle $screenRect -Radius $cornerRadius
  $state = $graphics.Save()
  $graphics.SetClip($screenPath)
  $graphics.DrawImage($screen, $screenX, $screenY, $screenWidth, $screenHeight)
  $graphics.Restore($state)

  $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(110, 198, 220, 255), 4)
  $graphics.DrawPath($borderPen, $screenPath)

  $outputDirectoryInfo = [System.IO.Path]::GetDirectoryName($outputPath)
  [System.IO.Directory]::CreateDirectory($outputDirectoryInfo) | Out-Null
  $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $borderPen.Dispose()
  $screenPath.Dispose()
  $titleFormat.Dispose()
  $accentBrush.Dispose()
  $whiteBrush.Dispose()
  $mutedBrush.Dispose()
  $graphics.Dispose()
  $canvas.Dispose()
  $screen.Dispose()
}

$background.Dispose()
$eyebrowFont.Dispose()
$titleFont.Dispose()
$subtitleFont.Dispose()
$fontCollection.Dispose()

Write-Output "Generated $($items.Count) App Store screenshots in $outputDirectory"
