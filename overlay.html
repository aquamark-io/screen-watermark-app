<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: transparent;
    }
    #watermark-container {
      width: 100vw;
      height: 100vh;
      position: relative;
      pointer-events: none;
    }
    .watermark {
      position: absolute;
      color: rgba(255, 0, 0, 0.15);
      font-size: 24px;
      font-family: Arial, sans-serif;
      font-weight: bold;
      transform: rotate(-45deg);
      white-space: nowrap;
      user-select: none;
    }
  </style>
</head>
<body>
  <div id="watermark-container"></div>

  <script>
    window.electronAPI.onSetWatermark((watermarkText) => {
      const container = document.getElementById('watermark-container');
      container.innerHTML = '';

      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      const spacingX = 400;
      const spacingY = 300;

      for (let y = -200; y < screenHeight + 200; y += spacingY) {
        for (let x = -200; x < screenWidth + 200; x += spacingX) {
          const watermark = document.createElement('div');
          watermark.className = 'watermark';
          watermark.textContent = watermarkText;
          watermark.style.left = x + 'px';
          watermark.style.top = y + 'px';
          container.appendChild(watermark);
        }
      }
    });
  </script>
</body>
</html>
